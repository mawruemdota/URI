/* Run: node tests/experience-smoke.cjs
 * No network calls; mocks browser storage and form submissions. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const files=['wedding.js','builder-core.js','wedding-details.js','readiness.js','builder-editor.js','builder-photos.js','inline-edit.js','cloud-config.js','cloud.js','wedding-flow.js','dashboard.js','guests-rsvp.js'];
for(const file of files)assert.ok(html.includes('src="'+file+'"'),'Missing script '+file);
const app={innerHTML:''},root={innerHTML:'',scrollIntoView(){}},storage={};
let hash='#home',confirmed=0;const alerts=[];
const location={origin:'https://example.test',pathname:'/URI/',href:'https://example.test/URI/#home'};
Object.defineProperty(location,'hash',{get(){return hash},set(v){hash=String(v).startsWith('#')?String(v):'#'+v}});
const fakeElement={innerHTML:'',dataset:{},focus(){},setAttribute(){},remove(){},scrollIntoView(){}};
const document={
 getElementById(id){return id==='app'?app:fakeElement},
 querySelector(){return root},querySelectorAll(){return []}
};
const localStorage={getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=v},removeItem:k=>delete storage[k]};
const sessionStorage={getItem:k=>storage['session:'+k]??null,setItem:(k,v)=>{storage['session:'+k]=v},removeItem:k=>delete storage['session:'+k]};
class FormData{constructor(form){this.data=form.fields||new Map()}get(k){return this.data.get(k)??null}has(k){return this.data.has(k)}}
const window={addEventListener(){},scrollTo(){}};
const ctx={window,document,location,localStorage,sessionStorage,navigator:{},console,Date,URL:{},
 alert(msg){alerts.push(msg)},confirm(){confirmed++;return true},prompt(){},crypto:require('node:crypto').webcrypto,
 FormData,setTimeout:fn=>fn(),clearTimeout(){},root,app,storage};
vm.createContext(ctx);
vm.runInContext(inline,ctx);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const scenario=function(){
 const e={...defaults(),id:'e-smoke',type:'Wedding',name1:'',name2:'',date:'',time:'',venue:'',address:'',guests:[]};
 state.events.push(e);state.current=e.id;tab='edit';eventPage();
 const U=window.URIBuilder,R=window.URIReadiness,G=window.URIGuests;
 const initiallyBlocked=R.status(e).blockers.some(x=>x.id==='names')&&R.status(e).blockers.some(x=>x.id==='date');
 const reviewRendered=R.panel(e).includes('Required for publishing')&&R.panel(e).includes('Recommended');
 window.uriBSet('name1','Maya');window.uriBSet('name2','Emir');window.uriBSet('date','2032-05-10');window.uriBSet('time','14:00');window.uriBSet('venue','Garden Chapel');
 const ready=R.status(e).ready;
 window.uriReadinessShow();const reviewNav=root.innerHTML.includes('uri-ready-panel');
 window.uriReadinessFix('content','ceremony-venue');
 const editNav=root.innerHTML.includes('data-wedding-section="ceremony"');
 window.uriWeddingReception(true);
 const blockedReception=R.status(e).blockers.some(x=>x.id==='reception');
 window.uriWeddingDetailSet('reception','venue','Reception Hall');window.uriWeddingDetailSet('reception','time','17:00');
 const readyWithReception=R.status(e).ready;
 window.uriBPanel('photos');const photoTab=root.innerHTML.includes('wb-photo-manager');
 const inlineHook=typeof window.uriBEditTarget==='function'&&typeof window.uriBDecorateSections==='function';
 tab='guests';eventPage();
 const guestsPage=app.innerHTML.includes('class="uri-guests"')&&app.innerHTML.includes('uri-guest-form')&&app.innerHTML.includes('uri-question-form');
 const legacy={id:'legacy',name:'Old Guest',group:'Cruz Family',status:'pending'};
 e.guests.push(legacy);G.ensure(e);
 const legacyMigration=!!e.households.find(h=>h.id===legacy.householdId);
 const h=e.households[0];h.seatLimit=2;
 const guest={id:'gid',name:'Sofia',status:'pending',plusOnesAllowed:2,plusOnesConfirmed:0,householdId:h.id,answers:{}};
 e.guests.push(guest);
 e.rsvpSettings={capacity:3,questions:[{id:'meal',label:'Meal choice',type:'choice',options:['Chicken','Fish'],required:true}]};
 const guestPage=(()=>{G.guestPage('e-smoke.gid');return app.innerHTML.includes('Meal choice')&&app.innerHTML.includes('Joyfully accepts')})();
 const evt=(f)=>({preventDefault(){},target:{fields:new Map(Object.entries({...f,eventId:'e-smoke',guestId:'gid'}))}});
 window.uriGuestsRespond(evt({response:'attending',plusOnes:'2',q_meal:'Chicken'}));
 const householdDenied=guest.status==='pending';
 window.uriGuestsRespond(evt({response:'attending',plusOnes:'1',q_meal:'Chicken'}));
 const accepted=guest.status==='attending'&&guest.plusOnesConfirmed===1&&guest.answers.meal==='Chicken';
 h.seatLimit=0;e.rsvpSettings.capacity=1;
 window.uriGuestsRespond(evt({response:'attending',plusOnes:'1',q_meal:'Chicken'}));
 const globalDenied=guest.plusOnesConfirmed===1;
 window.uriGuestsRespond(evt({response:'declined',plusOnes:'0'}));
 const declined=guest.status==='declined'&&guest.plusOnesConfirmed===0;
 const csv=G.parseCSV('Name,Household\n"Sofia, Jr.","Cruz Family"\n');
 const csvQuotes=csv.length===2&&csv[1][0]==='Sofia, Jr.';
 const householdPanel=G.panel(e).includes('Seat limit')&&G.panel(e).includes('Copy test URL');
 const analytics=G.analytics(e).includes('Seat allocation')&&G.analytics(e).includes('Meal choice');
 const publicPayload=U.payload(e);
 const guestPrivacy=!('guests' in publicPayload)&&!('households' in publicPayload)&&!('rsvpSettings' in publicPayload);
 const rsvpPublic=U.render(e).includes('Online RSVP collection is not active yet');
 route('dashboard');
 window.uriDashAction('duplicate','e-smoke');
 const duplicate=state.events.find(x=>x.id!=='e-smoke');
 const duplicateSafe=!!duplicate&&duplicate.guests.length===0&&duplicate.households.length===0&&duplicate.cloudPublished===false;
 return {initiallyBlocked,reviewRendered,ready,reviewNav,editNav,blockedReception,readyWithReception,photoTab,inlineHook,guestsPage,legacyMigration,guestPage,householdDenied,accepted,globalDenied,declined,csvQuotes,householdPanel,analytics,guestPrivacy,rsvpPublic,duplicateSafe};
};
const tests=vm.runInContext('('+scenario.toString()+')()',ctx);
for(const [key,value] of Object.entries(tests))assert.equal(value,true,'Failed: '+key);
assert.ok(alerts.some(x=>String(x).includes('household seat limit')),'Expected household limit warning');
assert.ok(alerts.some(x=>String(x).includes('event capacity')),'Expected capacity warning');
console.log('URI Readiness, Direct Editing & Local RSVP 2.0:',Object.keys(tests).length,'checks passed.');
