/* URI Adventure Invitation 1.0 regression suite — node tests/adventure-smoke.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const event={
 id:'w-adventure',type:'Wedding',template:'adventure',
 name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',venue:'The Garden Pavilion',
 address:'Cavite',message:'Join our adventure.',deadline:'2032-09-10',
 photos:[{id:'p1',src:'https://example.test/gallery.jpg',alt:'A memory'}],
 heroPhoto:'https://example.test/cover.jpg',
 featureConfig:{},featureOrder:[],layoutByTemplate:{},designByTemplate:{}
};
let saved=0;const state={events:[event],current:event.id};
const window={};const document={readyState:'loading',addEventListener(){},querySelectorAll(){return []}};
const ctx={window,document,esc,fmt:x=>x,state,KEY:'adventure-test',render(){},
 localStorage:{setItem(){saved++}},alert(){},eventPage(){},current:()=>event,Date,Number,setTimeout};
vm.createContext(ctx);
for(const path of ['builder-core.js','adventure.js'])vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const U=window.URIBuilder,A=window.URIAdventure;
assert.ok(A,'Adventure module exports its manager');
assert.ok(U.presets.adventure,'Adventure is a real template base');
assert.equal(U.baseTemplate(event),'adventure');
assert.equal(A.normalize({world:'arbitrary',character:'hacker',touch:'bad'}).world,'meadow');
assert.equal(A.normalize({world:'arbitrary',character:'hacker',touch:'bad'}).character,'explorer');
assert.equal(A.normalize({pace:'brisk',touch:'joystick',collectibles:false}).touch,'joystick');
const html=U.render(event);
assert.match(html,/uri-builder-site uri-adventure-site/);
assert.match(html,/data-adventure-world="meadow"/);
assert.match(html,/data-adventure-control="left"/);
assert.match(html,/data-adventure-control="right"/);
assert.match(html,/data-adventure-control="jump"/);
assert.match(html,/data-adventure-action="interact"/);
assert.match(html,/uri-adventure-stage/);
assert.match(html,/uri-adventure-directory/);
assert.match(html,/View all invitation information without playing/);
assert.match(html,/data-adventure-id="story"/);
assert.match(html,/data-adventure-id="details"/);
assert.match(html,/data-adventure-id="rsvp"/);
assert.match(html,/The Garden Pavilion/);
assert.match(html,/Join our adventure/);
assert.match(html,/gallery\.jpg/);
assert.equal((html.match(/class="uri-adventure-page"/g)||[]).length,A.features(event).length,
  'Each enabled section needs an accessible fallback and checkpoint');
assert.match(U.cover(event),/uri-adventure-mini/);
const initial=JSON.stringify({names:[event.name1,event.name2],photos:event.photos,order:event.featureOrder});
window.uriAdventureSet('world','sunset');
window.uriAdventureSet('character','dreamer');
window.uriAdventureSet('touch','joystick');
window.uriAdventureSet('pace','brisk');
window.uriAdventureSet('collectibles',false);
assert.ok(saved>=5);
assert.match(U.render(event),/data-adventure-world="sunset"/);
assert.match(U.render(event),/data-adventure-touch="joystick"/);
assert.match(U.render(event),/data-adventure-collectibles="false"/);
assert.match(A.manager(event),/Game Template Manager/);
assert.match(A.manager(event),/Active checkpoints/);
assert.equal(U.payload(event).adventure.character,'dreamer');
assert.equal(U.payload(event).adventure.collectibles,false);
window.uriAdventureSet('world','invalid');
assert.equal(event.adventure.world,'sunset','Disallow unknown scene presets');
event.featureConfig.gallery=false;
assert.doesNotMatch(U.render(event),/data-adventure-id="gallery"/);
event.featureConfig.gallery=true;
event.featureOrder=['rsvp','story',...U.ids.filter(x=>!['rsvp','story'].includes(x))];
const changed=U.render(event);
assert.ok(changed.indexOf('data-adventure-id="rsvp"')<changed.indexOf('data-adventure-id="story"'),
 'Checkpoints follow URI feature ordering');
for(const base of ['classic','garden','nightfall']){
 event.template=base;
 assert.doesNotMatch(U.render(event),/uri-adventure-site/,'Legacy templates are preserved');
}
event.template='adventure';
assert.equal(JSON.stringify({names:[event.name1,event.name2],photos:event.photos,order:event.featureOrder}).includes('"Maya"'),true);
event.name1='<img src=x onerror=alert(1)>';
event.message='<script>bad</script>';
const safe=U.render(event);
assert.doesNotMatch(safe,/<img src=x onerror=alert\(1\)>/);
assert.doesNotMatch(safe,/<script>bad<\/script>/);
assert.match(safe,/&lt;script&gt;bad&lt;\/script&gt;/);
assert.match(fs.readFileSync('adventure.css','utf8'),/@media\(max-width:700px\)/);
assert.match(fs.readFileSync('adventure.css','utf8'),/prefers-reduced-motion/);
assert.match(fs.readFileSync('adventure.js','utf8'),/phaser@3\.90\.0/);
assert.match(fs.readFileSync('index.html','utf8'),/src="adventure\.js"/);
console.log('Adventure Invitation passed: template registration, accessible sections, movement controls, theme/character persistence, photo/story content, publication data and safe HTML.');
