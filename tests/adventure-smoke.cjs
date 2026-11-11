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
for(const path of ['builder-core.js','adventure-pixels.js','adventure-artpack.js','adventure.js'])vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const U=window.URIBuilder,A=window.URIAdventure;
assert.ok(A,'Adventure module exports its manager');
assert.equal(window.URIAdventureArtPack.version,'1.0');
assert.equal(window.URIAdventureArtPack.states.length,5);
assert.ok(fs.readFileSync('adventure.js','utf8').includes('artPack.decorate'),'Art Pack is integrated into Phaser scene');
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
assert.match(html,/uri-pixel-banner/,'Pixel-style invitation header is rendered');
assert.match(html,/uri-pixel-topnav/,'Pixel-themed HUD is rendered');
assert.doesNotMatch(html,/uri-character-select|data-adventure-role|confirm-character/,
 'Guests never see character-selection UI; the owner defines the main character');
assert.doesNotMatch(html,/data-adventure-guest-choice/,
 'Legacy guest character selection must not be published');
assert.equal((A.manager(event).match(/uri-adventure-owner-card/g)||[]).length,8,
 'Eight avatars are selectable only in the owner editor');
assert.match(A.manager(event),/Every guest will play as this character/);
assert.ok(window.URIAdventurePixels.ROLES.floral,'Floral playable role exists');
assert.equal(window.URIAdventurePixels.ROLES.gown.name,'Female in Gown');
assert.equal(window.URIAdventurePixels.ROLES.barong.name,'Male in Barong');
for(const role of ['gown','barong']){
 assert.equal(A.normalize({character:role}).character,role,'New wedding attire selection is saved');
 assert.match(A.manager({...event,adventure:{character:role}}),new RegExp('data-uri-character="'+role+'"'));
 for(const state of ['idle','run','jump','fall']){
  const asset='adventure-assets/wedding-characters/'+role+'-'+state+'.png';
  const png=fs.readFileSync(asset);
  assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a','Valid transparent PNG: '+asset);
  assert.equal(png.readUInt32BE(20),32,'32px sprite frame height: '+asset);
  assert.equal(png[25],6,'RGBA PNG with alpha channel: '+asset);
 }
}
assert.match(html,/class="uri-adventure-interior" hidden/,'Invitation details open inside the actual game viewport');
assert.match(html,/data-adventure-action="room-exit"/,'Guests can return from an explored area');
assert.doesNotMatch(html,/data-adventure-action="room-next"|data-adventure-action="room-prev"/,'Guests must walk between checkpoints');
assert.doesNotMatch(html,/<dialog\b/,'Adventure must not create popup dialogs');
assert.match(html,/uri-adventure-directory/);
assert.doesNotMatch(html,/View all invitation information without playing|View all details|Skip game/,'Adventure has no bypass');
assert.match(html,/class="uri-adventure-directory" hidden/,'Station content is stored offscreen until approached');
assert.doesNotMatch(html,/data-adventure-station=/,'No direct station navigation is published');
assert.match(html,/data-adventure-id="story"/);
assert.match(html,/data-adventure-id="details"/);
assert.match(html,/data-adventure-id="rsvp"/);
assert.match(html,/The Garden Pavilion/);
assert.match(html,/Join our adventure/);
assert.match(html,/gallery\.jpg/);
assert.equal((html.match(/class="uri-adventure-page"/g)||[]).length,A.features(event).length,
  'Each enabled invitation feature is stored for its in-world checkpoint');
assert.match(U.cover(event),/uri-adventure-cover-scene/,'Dashboard uses illustrated pixel art, not the old flat placeholder');
assert.match(U.cover(event),/uri-adventure-cover-v2/);
assert.doesNotMatch(U.cover(event),/uri-adventure-mini-hero/);
const initial=JSON.stringify({names:[event.name1,event.name2],photos:event.photos,order:event.featureOrder});
window.uriAdventureSet('world','sunset');
window.uriAdventureSet('character','dreamer');
window.uriAdventureSet('characterVariant','2');
// Older draft settings cannot re-enable guest character selection.
window.uriAdventureSet('guestChoice',true);
assert.equal(A.normalize({guestChoice:true}).guestChoice,false);
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
assert.equal(U.payload(event).adventure.characterVariant,2);
assert.equal(U.payload(event).adventure.guestChoice,false);
assert.doesNotMatch(U.render(event),/data-adventure-guest-choice/);
assert.match(A.manager(event),/data-uri-character="dreamer"/);
assert.match(A.manager(event),/aria-pressed="true"/);
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
assert.match(fs.readFileSync('adventure-pixel.css','utf8'),/uri-char-cards/);
assert.match(fs.readFileSync('adventure-landscape.js','utf8'),/function cottage/);
assert.match(fs.readFileSync('index.html','utf8'),/src="adventure-pixels\.js"/);
assert.match(fs.readFileSync('index.html','utf8'),/src="adventure-landscape\.js"/);
assert.match(fs.readFileSync('index.html','utf8'),/src="adventure\.js"/);
console.log('Adventure Invitation passed: owner-controlled pixel cover, walking-only checkpoints, locked journey map, movement controls, theme persistence and safe HTML.');
