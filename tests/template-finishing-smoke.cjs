/* Fast template finishing regression. Run: node tests/template-finishing-smoke.cjs */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const css=fs.readFileSync('template-finishing.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const core=fs.readFileSync('builder-core.js','utf8');
const ctx={window:{},esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),fmt:v=>v,Date,render(){},KEY:'test',state:{events:[]},localStorage:{setItem(){}},current:()=>null,alert(){}};
vm.createContext(ctx);vm.runInContext(core,ctx);
const U=ctx.window.URIBuilder;
const sample={type:'Wedding',name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',venue:'Garden Pavilion',message:'Our invitation',photos:[],featureConfig:{}};
let before;
for(const template of ['classic','garden','nightfall']){
 const e={...sample,template};
 const result=U.render(e),mini=U.cover(e);
 if(!before)before=JSON.stringify(U.payload(e));
 assert.match(result,/data-feature="hero"/);
 assert.match(result,/data-feature="rsvp"/);
 assert.match(result,/personal RSVP link shared by the hosts/);
 assert.doesNotMatch(result,/Online RSVP collection is not active yet/);
 assert.match(mini,/wb-cover-mini/);
 if(template==='classic'){
  assert.match(result,/wb-botanical-intro/);
  assert.match(result,/wb-botanical-symbol/);
 }
 if(template==='garden'){
  assert.match(result,/wb-editorial-invite-label/);
  assert.match(result,/wb-editorial-invite-caption/);
 }
 if(template==='nightfall'){
  assert.match(result,/AN INVITATION/);
  assert.doesNotMatch(result,/URI WEDDING/);
 }
 assert.match(result,/Maya/);assert.match(result,/Emir/);
}
assert.match(html,/href="template-finishing.css"/);
assert.match(css,/@container \(max-width:575px\)/);
for(const selector of ['.wb-botanical-intro','.wb-editorial-invite-label','.wb-nightfall-main','.wb-mini-romance','.wf-designs'])
 assert.ok(css.includes(selector),'Missing design rule '+selector);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Unbalanced CSS rules');
console.log('Template finishing smoke: new cover hierarchy, RSVP accuracy, mini previews, mobile rules, and CSS integrity passed.');
