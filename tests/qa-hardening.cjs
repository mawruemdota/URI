/* Run: node tests/qa-hardening.cjs
 * Regression tests for corrupted drafts, preview framing, privacy and asynchronous uploads. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);
const storage={'uri-prototype-v1':JSON.stringify({events:[null,{},{
  id:'w-good',type:'Wedding',name1:'Maya',name2:'Emir',date:'2032-12-10',
  venue:'Garden',time:'16:00',guests:'old-format',photos:[],template:'classic'
}],current:'w-good'})};
let currentHash='#home',renderCount=0;
const app={innerHTML:''},root={innerHTML:''},status={textContent:''};
const node={innerHTML:'',dataset:{},style:{},focus(){},setAttribute(){},remove(){},scrollIntoView(){},querySelector(){return null},querySelectorAll(){return []}};
const document={
  getElementById:id=>id==='app'?app:id==='wbPhotoNotice'?status:node,
  querySelector(){return root},querySelectorAll(){return []},
  createElement(tag){
    if(tag==='canvas')return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return 'data:image/jpeg;base64,VEVTVA=='}};
    return {innerHTML:'',dataset:{},appendChild(){},setAttribute(){}};
  },
  body:{classList:{add(){},remove(){}}},activeElement:null,addEventListener(){},removeEventListener(){}
};
const location={origin:'https://example.test',pathname:'/URI/',href:'https://example.test/URI/#home'};
Object.defineProperty(location,'hash',{get(){return currentHash},set(v){currentHash=String(v).startsWith('#')?String(v):'#'+v}});
const localStorage={getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=v},removeItem:k=>delete storage[k]};
const sessionStorage={getItem:k=>storage['s:'+k]??null,setItem:(k,v)=>{storage['s:'+k]=v},removeItem:k=>delete storage['s:'+k]};
class FakeImage {
  constructor(){this.width=600;this.height=400}
  set src(v){Promise.resolve().then(()=>this.onload?.())}
}
const URL={createObjectURL(){return 'blob:test'},revokeObjectURL(){}};
const win={addEventListener(){},scrollTo(){}};
const ctx={window:win,document,location,localStorage,sessionStorage,navigator:{},Image:FakeImage,URL,
  crypto:require('node:crypto').webcrypto,setTimeout:fn=>fn(),clearTimeout(){},console,Date,
  alert(){},confirm(){return true},prompt(){}};
vm.createContext(ctx);
vm.runInContext(inline,ctx,{filename:'index.html'});
for(const file of ['wedding.js','builder-core.js','wedding-details.js','readiness.js','builder-editor.js','builder-photos.js','inline-edit.js','cloud-config.js','cloud.js','wedding-flow.js','dashboard.js','guests-rsvp.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
(async()=>{
 const restored=vm.runInContext('state',ctx);
 assert.equal(restored.events.length,1,'Malformed event records should be skipped');
 const good=restored.events[0];
 assert.deepEqual(Array.from(good.guests),[],'Malformed guest array should normalize to empty');
 assert.equal(good.id,'w-good');
 good.heroPhoto='https://example.test/couple.jpg';
 good.heroSettings={zoom:1.75,x:34,y:68};
 const U=win.URIBuilder;
 const cover=U.cover(good);
 assert.match(cover,/scale\(1\.75\)/,'Dashboard cover must preserve hero zoom');
 assert.match(U.render(good),/scale\(1\.75\)/,'Invitation must preserve the same hero zoom');
 good.guests.push({id:'g-secret',name:'Private Guest',email:'private@example.test'});
 const payload=U.payload(good);
 assert.equal(Object.hasOwn(payload,'guests'),false,'Guest records must not enter the public payload');
 assert.equal(Object.hasOwn(payload,'households'),false);
 assert.equal(Object.hasOwn(payload,'rsvpSettings'),false);
 const oldRender=vm.runInContext('eventPage',ctx);
 vm.runInContext('eventPage=function(){throw new Error("Guest filtering must not rebuild the screen")}',ctx);
 win.uriGuestsSearch('Maya');
 win.uriGuestsFilter('pending');
 vm.runInContext('eventPage='+oldRender.toString(),ctx);
 assert.match(win.URIWeddingDetails.editor(good),/wb-timeline-fold/,'Long timeline should be collapsible');
 const other={id:'w-other',type:'Wedding',name1:'Another',name2:'Couple',guests:[],photos:[],template:'garden'};
 restored.events.push(other);
 restored.current=good.id;
 const uploading=win.uriBPhotoUpload({target:{files:[{name:'cross-event.png',type:'image/png',size:5000}],value:''}},'hero');
 restored.current=other.id;
 await uploading;
 assert.equal(other.heroPhoto||'', '', 'Upload must not cross into a different event');
 assert.equal(good.heroPhoto,'https://example.test/couple.jpg','Aborted upload must leave previous image unchanged');
 assert.equal(U.render(other).includes('wb-theme-editorial'),true);
 console.log('URI QA hardening passed: corrupted storage, template zoom, guest data isolation, filter focus, collapsed timeline and async upload isolation.');
})().catch(err=>{console.error(err);process.exitCode=1});
