/* Animation Manager 1.0 — run: node tests/animation-smoke.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const event = {type:'Wedding', template:'classic'};
let saves = 0, refreshes = 0, reduced = false, tweens = 0;
const U = {
  model:e=>e,
  render:()=>'<article class="uri-builder-site wb-spacing-airy" data-visible-features="2" style="--wb-bg:#fff"><div class="wb-flow"></div></article>',
  payload:e=>({type:e.type}),
  persist:()=>{saves++;return true},
  refresh:()=>{refreshes++}
};
const doc = {readyState:'loading', addEventListener(){}, getElementById(){return null}};
const win = {
  URIBuilder:U, matchMedia:()=>({matches:reduced}),
  requestAnimationFrame:fn=>fn(),
  gsap:{fromTo(){tweens++;return {kill(){}}}}
};
const ctx = {window:win,document:doc,current:()=>event,Date,Number,setTimeout:fn=>fn()};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('animation.js','utf8'),ctx,{filename:'animation.js'});
const A = win.URIAnimation;
assert.ok(A,'Animation Manager exports a safe runtime');
assert.equal(A.normalize(null).preset,'none','Legacy events remain static by default');
assert.equal(A.normalize({preset:'unknown',speed:999}).preset,'none');
assert.equal(A.normalize({preset:'cinematic',speed:999}).speed,1);
assert.equal(A.normalize({preset:'playful',speed:.75,photos:false}).photos,false);
assert.equal(A.normalize({preset:'elegant',speed:1.5}).speed,1.5);
U.model(event);
assert.equal(event.animation.preset,'none');
win.uriAnimationSet('preset','cinematic');
win.uriAnimationSet('speed','1.25');
win.uriAnimationSet('photos',false);
assert.equal(event.animation.preset,'cinematic');
assert.equal(event.animation.speed,1.25);
assert.equal(event.animation.photos,false);
assert.equal(saves,3);
assert.equal(refreshes,3);
win.uriAnimationSet('speed','not a speed');
assert.equal(saves,3,'Invalid speed must not be persisted');
const html = U.render(event);
assert.match(html,/data-uri-preset="cinematic"/);
assert.match(html,/data-uri-photos="off"/);
assert.match(html,/--uri-anim-duration:/);
assert.equal(U.payload(event).animation.preset,'cinematic','Publishing payload retains animations');
assert.ok(A.manager(event).includes('Animation Manager'));
assert.ok(A.manager(event).includes('Play animations in preview'));

function node(){
  const names = new Set();
  return {dataset:{},style:{removeProperty(){}},classList:{
    add:x=>names.add(x),remove:x=>names.delete(x),contains:x=>names.has(x)
  }};
}
function article(preset='cinematic',inEditor=false){
  const s1=node(),s2=node(),root=node();
  root.dataset={uriPreset:preset,uriEntrance:'on',uriScroll:'on',uriPhotos:'on',uriHover:'on',uriDecorations:'off'};
  root.style={getPropertyValue:()=> '720ms'};
  root.closest=selector=>inEditor&&selector==='#wbLivePreview'?{}:null;
  root.querySelectorAll=selector=>selector==='.wb-flow > [data-feature]'?[s1,s2]:selector==='[data-uri-reveal]'?[s1,s2]:[];
  return {root,s1,s2};
}
const external=article('cinematic');
assert.equal(A.animate(external.root),true,'Public invitations auto-enable animations');
assert.equal(external.s1.dataset.uriReveal,'shown');
assert.equal(external.s2.dataset.uriReveal,'shown','No observer reveals content instead of hiding it');
assert.ok(tweens>0,'Cinematic preset uses GSAP when available');
const editor=article('elegant',true);
assert.equal(A.animate(editor.root),false,'Editor stays static until explicitly played');
assert.equal(A.animate(editor.root,{preview:true}),true);
reduced=true;
const accessible=article('cinematic');
assert.equal(A.animate(accessible.root),false,'Respect reduced motion');
assert.equal(accessible.s1.dataset.uriReveal,undefined);
reduced=false;
const none=article('none');
assert.equal(A.animate(none.root),false);
console.log('Animation Manager passed: legacy defaults, presets, persistence, publishing, preview-only playback, GSAP fallback and reduced motion.');
