/* Run with: node tests/template-matrix.cjs
   Exhaustively check both templates' feature/layout combinations and default behavior. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('builder-core.js','utf8');
const win={},escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context={window:win,esc:escape,fmt:d=>d||'Date to be announced',Date,render(){},KEY:'uri-test',state:{events:[]},localStorage:{setItem(){}},alert(){},current(){return null}};
vm.createContext(context);
vm.runInContext(src,context,{filename:'builder-core.js'});
const U=win.URIBuilder;
assert.deepEqual(Array.from(U.ids),['hero','story','gallery','countdown','details','timeline','dress','gifts','rsvp']);
const sample={
 type:'Wedding',name1:'Maya',name2:'Emir',template:'classic',
 date:'2032-07-15',time:'16:00',venue:'The Garden Pavilion',address:'Cavite, Philippines',
 message:'Our shared journey',deadline:'2032-07-01',
 heroPhoto:'https://example.test/hero.jpg',
 photos:[{src:'https://example.test/one.jpg',alt:'First photo',x:25,y:65,crop:'square'},
         {src:'https://example.test/two.jpg',alt:'Second photo',x:60,y:40,crop:'portrait'}],
 featureConfig:{},layoutByTemplate:{},designByTemplate:{}
};
let combinations=0;
for(const template of ['classic','garden','nightfall']){
 const e=structuredClone(sample);e.template=template;
 U.model(e);
 for(const def of U.features){
   for(const [variant] of def.variants){
     e.featureConfig=Object.fromEntries(U.ids.map(k=>[k,k===def.id]));
     e.layoutByTemplate[template]={[def.id]:variant};
     let html=U.render(e);
     assert.match(html,new RegExp('data-feature="'+def.id+'"'),template+' '+def.id+'/'+variant);
     const cls='wb-'+def.id+'-'+variant;
     assert.ok(html.includes(cls),template+' '+def.id+'/'+variant+' must expose layout class '+cls);
     assert.ok(html.includes('<article class="uri-builder-site'),template+' '+def.id+'/'+variant+' must render an invitation');
     assert.equal((html.match(/data-feature="/g)||[]).length,1,'Only one section must be enabled');
     combinations++;
   }
 }
 e.featureConfig=Object.fromEntries(U.ids.map(k=>[k,true]));
 e.featureOrder=U.ids.slice();
 e.layoutByTemplate[template]={};
 const full=U.render(e);
 assert.ok(U.ids.every(id=>full.includes('data-feature="'+id+'"')));
 assert.ok(U.ids.every((id,i)=>i===0||full.indexOf('data-feature="'+U.ids[i-1]+'"')<full.indexOf('data-feature="'+id+'"')));
 const serialized=JSON.stringify(e);
 e.template=template==='classic'?'garden':'classic';
 U.render(e);
 assert.equal(e.message,sample.message);
 assert.equal(e.photos.length,2);
 assert.equal(e.featureOrder.length,9);
 assert.ok(serialized.includes('"featureOrder"'));
}
const empty=structuredClone(sample);empty.photos=[];
const withoutPhotos=U.render(empty);
assert.doesNotMatch(withoutPhotos,/data-feature="gallery"/,'Empty gallery must not be displayed on the invitation');
assert.doesNotMatch(withoutPhotos,/wb-botanical-round-photo/,'Empty gallery must not show a circular photo placeholder');
assert.ok(empty.featureConfig.gallery!==false,'The gallery feature should remain available for future photos');
empty.photos=[{src:'https://example.test/added.jpg',alt:'Just uploaded',crop:'landscape'}];
assert.match(U.render(empty),/data-feature="gallery"/,'Gallery must appear after upload without further configuration');
const invalid=structuredClone(sample);
invalid.name1='<img src=x onerror=alert(1)>',invalid.message='<script>alert(2)</script>';
const secure=U.render(invalid);
assert.doesNotMatch(secure,/<script>|<img src=x onerror=/);
assert.match(secure,/&lt;script&gt;/);
console.log('Template matrix passed:',combinations,'feature/layout combinations across three templates, visibility, ordering, empty-photo and HTML escaping checks.');
