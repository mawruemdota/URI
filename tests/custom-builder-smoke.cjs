/* URI Custom Builder / Template Studio regression.
 * Run: node tests/custom-builder-smoke.cjs */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e={
 id:'e-test',type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',
 date:'2032-05-05',time:'17:00',venue:'Garden',
 photos:[],heroPhoto:'https://example.test/hero.jpg',featureConfig:{},featureOrder:[],
 customSections:[],templateRecipes:[],layoutByTemplate:{},designByTemplate:{}
};
const state={events:[e],current:e.id},saved={},alerts=[];
const mockForm=class {constructor(form){this.data=form.values}get(key){return this.data[key]??''}};
const document={querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},body:{appendChild(){}},createElement(){return {click(){},remove(){}}}};
const context={window:{addEventListener(){}},document,esc,fmt:x=>x,render(){},KEY:'uri-test',state,
 localStorage:{setItem(k,v){saved[k]=v},getItem:k=>saved[k]??null,removeItem:k=>delete saved[k]},
 current:()=>state.events.find(x=>x.id===state.current),eventPage(){},confirm:()=>true,
 alert:x=>alerts.push(x),Date,URL,FormData:mockForm,setTimeout:fn=>fn(),console};
vm.createContext(context);
for(const p of ['builder-core.js','custom-sections.js','template-studio.js','wedding-details.js','builder-editor.js']){
 vm.runInContext(fs.readFileSync(p,'utf8'),context,{filename:p});
}
const U=context.window.URIBuilder,C=context.window.URICustomSections,S=context.window.URITemplateStudio;
assert.equal(C.types.length,6,'All six section types available');
for(const [type] of C.types){context.window.uriCustomAdd(type)}
assert.equal(e.customSections.length,6);
assert.equal(new Set(e.customSections.map(x=>x.id)).size,6);
assert.equal(e.featureOrder.filter(x=>x.startsWith('cs-')).length,6);
const items=Object.fromEntries(e.customSections.map(x=>[x.type,x]));
const faq=items.faq,txt=items.text,vid=items.video,location=items.map,button=items.button,image=items.image;
context.window.uriCustomSet(txt.id,'title','Our Letter');
context.window.uriCustomSet(txt.id,'body','Hello <script>alert(1)</script>\nWe are getting married');
context.window.uriCustomSet(vid.id,'url','https://www.youtube.com/watch?v=jfKfPfyJRdk');
context.window.uriCustomSet(location.id,'url','javascript:alert(1)');
context.window.uriCustomSet(button.id,'url','https://example.com/rsvp');
context.window.uriCustomSet(button.id,'label','Visit our venue');
context.window.uriCustomFAQSet(faq.id,0,'q','Can I bring someone?');
context.window.uriCustomFAQSet(faq.id,0,'a','Please RSVP first.');
context.window.uriCustomFAQAdd(faq.id);
assert.equal(faq.items.length,2);
context.window.uriCustomFAQRemove(faq.id,1);assert.equal(faq.items.length,1);
assert.equal(e.customSections.find(x=>x.id===txt.id).body.includes('<script>'),true,'Content remains editable');
const rendered=U.render(e);
assert.match(rendered,/Our Letter/);
assert.match(rendered,/&lt;script&gt;/);
assert.doesNotMatch(rendered,/<script>alert\(1\)<\/script>/);
assert.match(rendered,/youtube-nocookie\.com\/embed\/jfKfPfyJRdk/);
assert.doesNotMatch(rendered,/href="javascript:/);
assert.match(rendered,/View our venue|Visit our venue/);
assert.match(rendered,/Can I bring someone/);
assert.equal(C.videoEmbed('https://evil.test/watch?v=jfKfPfyJRdk'),'');
assert.equal(C.videoEmbed('https://vimeo.com/12345678'),'https://player.vimeo.com/video/12345678');
assert.equal(C.safeLink('http://example.com'),'');
assert.equal(C.safeLink('https://user:pass@example.com'),'');
for(const template of ['classic','garden','nightfall']){
 e.template=template;
 const p=U.compose(e);
 assert.equal(p.filter(x=>x.id.startsWith('cs-')).length,6,template+' must render every custom section');
 assert.ok(U.render(e).includes('wb-custom-'+template));
}
const originalCount=e.customSections.length;
context.window.uriCustomDuplicate(txt.id);
assert.equal(e.customSections.length,originalCount+1);
const duplicate=e.customSections.find(x=>x.id!==txt.id&&x.title==='Our Letter (Copy)');
assert.ok(duplicate);
assert.equal(duplicate.body,e.customSections.find(x=>x.id===txt.id).body);
context.window.uriCustomToggle(faq.id,false);
assert.ok(!U.compose(e).some(x=>x.id===faq.id));
assert.match(C.catalog(e),/Hidden sections/);
context.window.uriCustomToggle(faq.id,true);
assert.ok(U.compose(e).some(x=>x.id===faq.id));
context.window.uriCustomRemove(duplicate.id);
assert.ok(!e.customSections.some(x=>x.id===duplicate.id));
assert.ok(!e.featureOrder.includes(duplicate.id));
const snapshot={sections:JSON.stringify(e.customSections),order:JSON.stringify(e.featureOrder)};
for(const t of ['classic','garden','nightfall']){e.template=t;U.render(e)}
assert.equal(JSON.stringify(e.customSections),snapshot.sections);
assert.equal(JSON.stringify(e.featureOrder),snapshot.order);
const roles=S.parseTokens('{"background":"#111111","text":"#ffffff","accent":"#ff6046","fonts":{"heading":"Barlow Condensed","body":"Montserrat"}}','classic');
assert.equal(roles.bg,'#111111');assert.equal(roles.ink,'#ffffff');assert.equal(roles.accent,'#ff6046');assert.equal(roles.heading,'barlow');
const css=S.parseTokens(':root { --background: #101010; --text: #eeeeee; --accent: #d06050; }','garden');
assert.equal(css.bg,'#101010');assert.equal(css.accent,'#d06050');
assert.throws(()=>S.parseTokens('not valid','garden'));
context.window.uriTemplateStudioCreate({preventDefault(){},target:{values:{name:'Cinematic Garden',base:'nightfall',source:'https://example.com',tokens:'{"background":"#151515","text":"#eeeeee","accent":"#d05544"}',notes:'Warm dark'}}});
assert.equal(e.templateRecipes.length,1);
const recipe=e.templateRecipes[0];
assert.match(recipe.id,/^tpl-/);
assert.equal(e.template,recipe.id);
assert.equal(U.baseTemplate(e),'nightfall');
assert.equal(U.design(e).bg,'#151515');
assert.equal(U.design(e).accent,'#d05544');
assert.match(U.render(e),/wb-theme-nightfall/);
assert.match(U.cover(e),/wb-mini-nightfall/);
assert.equal(U.payload(e).templateRecipes[0].name,'Cinematic Garden');
assert.equal(U.payload(e).customSections.length,6);
assert.ok(!Object.hasOwn(U.payload(e),'guests'));
assert.ok(S.list(e).some(x=>x.id===recipe.id));
assert.equal(S.library().length,1);
context.window.uriTemplateStudioRemove(recipe.id);
assert.equal(e.template,'nightfall');
assert.equal(e.templateRecipes.length,0);
assert.ok(S.library().length>=1,'Template remains in reusable library after removing from invitation');
context.window.uriTemplateStudioApply(recipe.id);
assert.equal(e.template,recipe.id);
assert.equal(e.templateRecipes.length,1);
assert.equal(U.baseTemplate(e),'nightfall');
assert.equal(U.templateExists(e,'constructor'),false);
assert.ok(!U.templateExists(e,'__proto__'));
console.log('Custom Builder passed: 6 content types, URL sanitization, XSS escaping, hide/restore, duplication, template switching, token import and reusable recipes.');
