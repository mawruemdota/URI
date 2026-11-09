/* Run: node tests/cloud-sync-smoke.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
(async()=>{
 const account={id:'user-test',email:'host@example.test'};
 const db={drafts:new Map(),guestRows:new Map(),calls:[],user:account};
 const c={
  auth:{async getUser(){return {data:{user:db.user},error:null}},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},async signInWithOtp(){return {error:null}}},
  rpc:async(name,args)=>{
   db.calls.push([name,args]);
   if(name==='uri_save_draft'){
    const existing=db.drafts.get(args.p_event_id);
    if((existing?.revision||0)!==args.p_revision)return {error:{message:'Cloud version conflict.'}};
    const revision=args.p_revision+1;
    db.drafts.set(args.p_event_id,{local_event_id:args.p_event_id,payload:JSON.parse(JSON.stringify(args.p_payload)),revision,updated_at:new Date().toISOString()});
    return {data:revision,error:null};
   }
   if(name==='uri_sync_guest_tokens'){
    const keep=new Set();
    for(const g of args.p_guests){keep.add(g.guest_id);db.guestRows.set(g.guest_id,{...db.guestRows.get(g.guest_id),...g,status:db.guestRows.get(g.guest_id)?.status||'pending',
     plus_ones_confirmed:db.guestRows.get(g.guest_id)?.plus_ones_confirmed||0,answers:db.guestRows.get(g.guest_id)?.answers||{},responded_at:db.guestRows.get(g.guest_id)?.responded_at||null})}
    for(const k of db.guestRows.keys())if(!keep.has(k))db.guestRows.delete(k);
    return {data:keep.size,error:null};
   }
   if(name==='uri_rsvp_lookup'){
    const hash=crypto.createHash('sha256').update(args.p_token).digest('hex');
    const guest=[...db.guestRows.values()].find(g=>g.token_hash===hash);
    return {data:guest?{name:guest.name,status:guest.status,plusOnesAllowed:guest.plus_ones_allowed,plusOnesConfirmed:guest.plus_ones_confirmed,answers:guest.answers,eventName:'Test Wedding',date:'2032-09-18',venue:'Garden',questions:[]}:null,error:null};
   }
   return {error:{message:'Unknown RPC'}};
  },
  from:table=>{
    const params={};
    const q={select(){return q},eq(k,v){params[k]=v;return q},order(){return q},then(resolve,reject){
      let rows=table==='uri_drafts'?[...db.drafts.values()]:
        table==='uri_guest_tokens'?[...db.guestRows.entries()].map(([guest_id,g])=>({...g,guest_id})):[];
      if(params.local_event_id)rows=rows.filter(x=>x.local_event_id===params.local_event_id||table==='uri_guest_tokens');
      return Promise.resolve({data:rows,error:null}).then(resolve,reject);
    }};
    return q;
  }
 };
 const state={events:[{id:'w-test',type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',status:'draft',
   guests:[{id:'guest-1',name:'Guest A',email:'guest@example.test',status:'pending',plusOnesAllowed:1,answers:{}}],
   households:[],rsvpSettings:{capacity:20,questions:[]}}],current:'w-test'};
 const storage={};const app={innerHTML:''};
 const doc={readyState:'complete',getElementById:id=>id==='app'?app:null,querySelectorAll:()=>[],body:{contains(){return true}}};
 const window={crypto:crypto.webcrypto,URIBuilder:{persist(){storage['uri-prototype-v1']=JSON.stringify(state);return true}},
   URICloud:{client:()=>c},addEventListener(){},isSecureContext:false};
 let prompts=[];
 const ctx={window,document:doc,crypto:crypto.webcrypto,TextEncoder,URL,Uint8Array,
   state,current:()=>state.events.find(e=>e.id===state.current),app,location:{hash:'#home',origin:'https://example.test',pathname:'/URI/'},
   render(){app.innerHTML='<p>Home</p>'},eventPage(){},localStorage:{setItem(k,v){storage[k]=v},getItem:k=>storage[k]},navigator:{},
   confirm(){return true},alert(){},prompt(_label,url){prompts.push(url)},setTimeout,clearTimeout,Date,console,esc:x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;')};
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('cloud-drafts.js','utf8'),ctx,{filename:'cloud-drafts.js'});
 vm.runInContext(fs.readFileSync('cloud-rsvp.js','utf8'),ctx,{filename:'cloud-rsvp.js'});
 // Force authentication and initial cloud upload.
 await window.uriCloudActivate();
 const e=state.events[0];
 assert.equal(e._uriCloudRevision,1,'Cloud created a versioned draft');
 assert.match(e.guests[0].onlineToken,/^[a-f0-9]{64}$/,'High entropy token generated');
 assert.equal(db.guestRows.get('guest-1').token_hash,crypto.createHash('sha256').update(e.guests[0].onlineToken).digest('hex'));
 assert.equal(db.drafts.get(e.id).payload.guests[0].onlineToken,e.guests[0].onlineToken,'Owner-only draft preserves bearer link');
 // A returned server RSVP is authoritative even after owner edits.
 db.guestRows.get('guest-1').status='attending';db.guestRows.get('guest-1').plus_ones_confirmed=1;
 e.name1='Maya Updated';window.URICloudDrafts.queueSave();
 await window.URICloudDrafts.flushCurrent();
 assert.equal(db.guestRows.get('guest-1').status,'attending','Guest metadata sync must not erase response');
 assert.equal(e.guests[0].status,'attending','Host sees online response');
 assert.equal(e._uriCloudRevision,2);
 // A second device with no local invitations retrieves the owner's event and answers.
 state.events=[];state.current=null;
 await window.URICloudDrafts.pull(true);
 assert.equal(state.events.length,1);
 assert.equal(state.events[0].guests[0].status,'attending');
 assert.equal(state.events[0].guests[0].onlineToken,e.guests[0].onlineToken);
 // A guest without an owner account may open a token-protected, limited RSVP view.
 ctx.location.hash='#rsvp/'+e.guests[0].onlineToken;ctx.render();
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.match(app.innerHTML,/Personal invitation/);
 assert.match(app.innerHTML,/Guest A/);
 assert.doesNotMatch(app.innerHTML,/guest@example\.test/,'Email must never leak through guest page');
 ctx.location.hash='#rsvp/'+('0'.repeat(64));ctx.render();
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.match(app.innerHTML,/Invitation unavailable/);
 console.log('Cloud sync and token RSVP passed: versioned owner drafts, hashed links, status preservation, device restore and private guest lookup.');
})().catch(err=>{console.error(err);process.exitCode=1});