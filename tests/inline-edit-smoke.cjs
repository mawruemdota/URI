/* Run: node tests/inline-edit-smoke.cjs */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function node(){
 return {children:[],dataset:{},classList:{contains(){return false}},querySelector(q){return q===':scope > .wb-inline-edit'?this.children.find(x=>x.className==='wb-inline-edit')||null:null},appendChild(b){this.children.push(b)}};
}
const sections=['hero','story','gallery','countdown','details','timeline','dress','gifts','rsvp'].map(feature=>Object.assign(node(),{dataset:{feature}}));
const name=node(),story=node(),ceremony=node(),reception=node(),timeline1=node(),timeline2=node();
reception.classList={contains(x){return x==='wb-venue-reception'}};
const preview={
 querySelectorAll(selector){
  if(selector==='[data-feature]')return sections;
  if(selector==='.wb-venue-card')return [ceremony,reception];
  if(selector==='.wb-schedule-item')return [timeline1,timeline2];
  return [];
 },
 querySelector(selector){
  if(selector.includes('.wb-names'))return name;
  if(selector.includes('[data-feature="story"] p'))return story;
  return null;
 }
};
const focused=[],panels=[],document={
 getElementById(id){return id==='wbLivePreview'?preview:null},
 createElement(tag){
  assert.equal(tag,'button');return {className:'',type:'',setAttribute(){},addEventListener(type,cb){this[type]=cb}};
 },
 querySelector(selector){
  return {focus(){focused.push(selector)},scrollIntoView(){}};
 }
};
const window={uriBPanel(p){panels.push(p)}};
const ctx={window,document,tab:'edit',eventPage(){},setTimeout:f=>f()};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('inline-edit.js','utf8'),ctx);
window.uriBDecorateSections();
assert.equal(sections.every(s=>s.children.length===1),true);
assert.equal(name.children.length,1);assert.equal(story.children.length,1);
assert.equal(ceremony.children.length,1);assert.equal(reception.children.length,1);
assert.equal(timeline1.children.length,1);assert.equal(timeline2.children.length,1);
window.uriBDecorateSections();
assert.equal(sections.every(s=>s.children.length===1),true,'No duplicate buttons');
name.children[0].click({preventDefault(){},stopPropagation(){}});
assert.equal(panels.at(-1),'content');
assert.ok(focused.at(-1).includes('name1'));
reception.children[0].click({preventDefault(){},stopPropagation(){}});
assert.ok(focused.at(-1).includes('reception-venue'));
timeline2.children[0].click({preventDefault(){},stopPropagation(){}});
assert.ok(focused.at(-1).includes('timeline'));
sections.at(-1).children[0].click({preventDefault(){},stopPropagation(){}});
assert.equal(ctx.tab,'guests');
console.log('Direct editing passed: section buttons, names, venues, timeline, guests, and no duplicate overlays.');
