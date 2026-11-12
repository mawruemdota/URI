/* Fast regression: thumbnail renderer is separate from actual invitation cover. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('builder-core.js','utf8'),css=fs.readFileSync('template-thumbnails.css','utf8'),html=fs.readFileSync('index.html','utf8');
const ctx={window:{},esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt:v=>v,render(){},KEY:'test',state:{events:[]},localStorage:{setItem(){}},current:()=>null,alert(){},Date};
vm.createContext(ctx);vm.runInContext(core,ctx);
const U=ctx.window.URIBuilder;
assert.equal(typeof U.thumbnail,'function');
const sample={type:'Wedding',name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',venue:'Garden',photos:[],featureConfig:{}};
for(const [id,part] of [['classic','uri-mini-botanical'],['garden','uri-mini-editorial'],['nightfall','uri-mini-nightfall'],['adventure','uri-mini-adventure']]){
 const event={...sample,template:id};const before=JSON.stringify(event),cover=U.cover(event),thumb=U.thumbnail(event);
 assert.match(thumb,new RegExp(part));
 assert.match(thumb,/Maya/);assert.match(thumb,/Emir/);
 if(id!=='adventure'){
  assert.match(thumb,/2032-09-18/);
  assert.match(thumb,/aria-hidden="true"/);
  assert.match(thumb,/--utm-bg:/);
  assert.ok(!thumb.includes('wb-cover-mini'),'Dedicated thumbnail should not squeeze complete cover');
 }
 assert.equal(cover,U.cover(event),'Preview should not alter full invitation');
 assert.equal(event.name1,sample.name1);
 assert.equal(event.name2,sample.name2);
}
const custom={...sample,template:'classic',heroPhoto:'https://example.test/couple.jpg',heroSettings:{x:25,y:70,zoom:1.4},designByTemplate:{classic:{accent:'#aabbcc'}}};
let thumb=U.thumbnail(custom);
assert.match(thumb,/https:\/\/example\.test\/couple\.jpg/);
assert.match(thumb,/object-position:25% 70%/);
assert.match(thumb,/scale\(1.4\)/);
assert.match(thumb,/--utm-accent:#aabbcc/);
const danger={...sample,template:'garden',name1:'<img src=x onerror=alert(1)>',heroPhoto:'javascript:alert(2)'};
thumb=U.thumbnail(danger);
assert.doesNotMatch(thumb,/<img src=x onerror/);
assert.doesNotMatch(thumb,/javascript:/);
assert.match(thumb,/&lt;img/);
assert.match(html,/href="template-thumbnails\.css"/);
for(const target of ['wedding.js','wedding-flow.js','builder-editor.js'])
 assert.match(fs.readFileSync(target,'utf8'),/URIBuilder\.thumbnail\(/,'Missing miniature renderer in '+target);
assert.match(css,/\.uri-mini-adventure/);
assert.match(css,/@media\(max-width:440px\)/);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
console.log('Thumbnail smoke passed: all four themes, public palette, safe photos, image crop, app integration and original cover preservation.');
