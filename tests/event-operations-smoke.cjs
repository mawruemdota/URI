/* URI Event Operations suite: static security and interactive state smoke.
   node tests/event-operations-smoke.cjs */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
for(const path of ['uri-share.js','uri-style-packs.js','uri-event-ops.js','uri-event-ops.css','supabase/functions/uri-share/index.ts','supabase/event_operations_20261114.sql']){
 assert.ok(read(path).length>100,'Missing '+path);
}
const html=read('index.html'),sql=read('supabase/event_operations_20261114.sql');
for(const path of ['uri-event-ops.css','uri-share.js','uri-style-packs.js','uri-event-ops.js'])
 assert.ok(html.includes('"'+path+'"'),'Module missing from HTML: '+path);
assert.ok(sql.includes('enable row level security'));
assert.ok(sql.includes('uri_checkin_guest'));
assert.ok(sql.includes('accepted_at is not null'));
assert.ok(sql.includes('uri_cohost_save_draft'));
assert.ok(!read('uri-share.js').includes('service_role'));
const cloud=read('cloud-drafts.js');
assert.match(cloud,/uri_sync_checkin_codes/);
assert.match(cloud,/uri_cohost_save_draft/);
assert.match(cloud,/_uriCohostUserId/);
const event={id:'e-test',name1:'Maya',name2:'Emir',type:'Wedding',template:'classic',
 date:'2032-09-18',venue:'Garden',guests:[
  {id:'a',name:'Anna',status:'attending',plusOnesConfirmed:1,inviteSentAt:Date.now()},
  {id:'b',name:'Ben',status:'pending'}
 ],designByTemplate:{},layoutByTemplate:{},cloudPublished:true,cloudSlug:'maya-and-emir'};
let renders=0,updates=0;
const model=e=>{e.designByTemplate??={};e.layoutByTemplate??={};return e};
const U={model,persist(){updates++;return true},design:e=>({...{bg:'#f6f0e8',accent:'#967c72'},...e.designByTemplate[e.template]})};
const window={URIBuilder:U,URITemplateStudio:{studio:()=>'<div>Original design panel</div>'},
 URICloud:{client:()=>null,publicLink:slug=>'https://example.test/'+slug},
 URICloudDrafts:{getUser:()=>null},URIGuests:{panel:()=>'<div>Guest panel</div>',analytics:()=>'<div>Analytics</div>'},
 addEventListener(){},isSecureContext:false};
const app={querySelector(){return null},innerHTML:''};
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
const ctx={window,app,tab:'guests',current:()=>event,eventPage(){renders++},dashboard(){},render(){},state:{events:[event]},
 esc,location:{hash:'#home'},alert(){},prompt(){},document:{getElementById(){return null}},
 confirm(){return true},Date,console,navigator:{}};
vm.createContext(ctx);
for(const path of ['uri-style-packs.js','uri-share.js','uri-event-ops.js'])vm.runInContext(read(path),ctx,{filename:path});
assert.equal(window.URIStylePacks.profiles.length,6);
assert.ok(window.URITemplateStudio.studio(event).includes('Instant art directions'));
assert.ok(window.URITemplateStudio.studio(event).includes('Original design panel'));
window.uriStyleApply('sage');
assert.equal(event.designByTemplate.classic.bg,'#eef1e5');
assert.equal(event.layoutByTemplate.classic.hero,'centered');
assert.equal(event.name1,'Maya','Style change preserves content');
assert.match(window.URIShare.social(event),/uri-share\?slug=maya-and-emir/);
assert.match(window.URIShare.panel(event),/Download PNG/);
assert.match(window.URIShare.panel(event),/Copy rich-preview link/);
assert.equal(window.URIEventOps.calc(event).seats,2);
assert.equal(window.URIEventOps.calc(event).pending,1);
assert.equal(window.URIEventOps.calc(event).sent,1);
window.uriOpsMarkSent('b');
assert.ok(event.guests[1].inviteSentAt);
assert.match(window.URIGuests.panel(event),/Invitation delivery & follow-ups/);
assert.match(window.URIEventOps.progress(event),/RSVP response rate/);
assert.ok(updates>=2&&renders>=1);
assert.match(read('builder-core.js'),/U\.payload=e=>/);
assert.doesNotMatch(read('supabase/functions/uri-share/index.ts'),/service_role|checkinToken|onlineToken/);
console.log('URI event operations smoke passed: 7 features wired, RLS migrations, private token boundaries, style packs, guest tracking and sharing controls.');
