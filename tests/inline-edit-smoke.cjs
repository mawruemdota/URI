/* Run: node tests/inline-edit-smoke.cjs */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function node(tag='section'){
 const element={tag,children:[],dataset:{},attributes:{},className:'',listeners:{},
  classList:{add(){},contains(){return false}},
  getAttribute(key){return this.attributes[key]||this.dataset[key.replace('data-','')]||''},
  setAttribute(key,value){this.attributes[key]=value},
  addEventListener(type,fn){this.listeners[type]=fn;this[type]=fn},
  appendChild(child){this.children.push(child)},
  querySelector(selector){
   if(selector===':scope > .wb-visual-toolbar')return this.children.find(x=>x.className==='wb-visual-toolbar')||null;
   if(selector===':scope > .wb-inline-edit')return this.children.find(x=>x.className==='wb-inline-edit')||null;
   return null;
  },querySelectorAll(){return []}
 };
 return element;
}
const ids=['hero','story','gallery','countdown','details','timeline','dress','gifts','rsvp'];
const sections=ids.map(feature=>Object.assign(node(),{dataset:{feature}}));
const name=node(),story=node(),ceremony=node(),reception=node(),timeline1=node(),timeline2=node();
reception.classList={add(){},contains(x){return x==='wb-venue-reception'}};
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
const focused=[],panels=[],calls=[],doc={
 getElementById(id){return id==='wbLivePreview'?preview:null},
 createElement:node,
 querySelector(selector){
  return {value:'',focus(){focused.push(selector)},scrollIntoView(){},closest(){return null}};
 },
 querySelectorAll(){return []}
};
const current=()=>({type:'Wedding',template:'classic',customSections:[]});
const window={URIBuilder:{customItem(){return null}},uriBPanel(p){panels.push(p)},
 uriBMove(id,delta){calls.push(['move',id,delta])},uriBToggle(id,v){calls.push(['toggle',id,v])}};
const ctx={window,document:doc,tab:'edit',current,eventPage(){},setTimeout:f=>f()};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('inline-edit.js','utf8'),ctx,{filename:'inline-edit.js'});
const event={preventDefault(){},stopPropagation(){},target:{closest(){return null}}};
window.uriBDecorateSections();
assert.equal(sections.every(s=>s.children.length===1),true);
assert.equal(sections[0].children[0].className,'wb-visual-toolbar');
assert.equal(sections[0].children[0].children.length,4);
assert.equal(name.children.length,1);assert.equal(story.children.length,1);
assert.equal(ceremony.children.length,1);assert.equal(reception.children.length,1);
assert.equal(timeline1.children.length,1);assert.equal(timeline2.children.length,1);
window.uriBDecorateSections();
assert.equal(sections.every(s=>s.children.length===1),true,'No duplicate visual toolbars');
name.children[0].click(event);
assert.equal(panels.at(-1),'content');
assert.ok(focused.at(-1).includes('name1'));
reception.children[0].click(event);
assert.ok(focused.at(-1).includes('reception-venue'));
sections[1].children[0].children[0].click(event);
assert.equal(panels.at(-1),'content');
sections[1].children[0].children[1].click(event);
assert.deepEqual(calls.at(-1),['move','story',-1]);
sections[1].children[0].children[3].click(event);
assert.deepEqual(calls.at(-1),['toggle','story',false]);
window.uriBVisualAction('edit','rsvp');
assert.equal(ctx.tab,'guests');
console.log('Visual editing passed: accessible toolbars, edit/move/hide, names, venue links and guest route.');
