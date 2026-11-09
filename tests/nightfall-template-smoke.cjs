/* Run: node tests/nightfall-template-smoke.cjs */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('builder-core.js','utf8');
const css=fs.readFileSync('nightfall-template.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const wedding=fs.readFileSync('wedding.js','utf8');
const wizard=fs.readFileSync('wedding-flow.js','utf8');
const editor=fs.readFileSync('builder-editor.js','utf8');
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sample={
 type:'Wedding',template:'nightfall',name1:'Maya',name2:'Emir',
 date:'2032-09-18',time:'16:00',venue:'The Garden Pavilion',address:'Cavite',
 message:'Please celebrate our story with us.',deadline:'2032-08-18',
 heroPhoto:'https://example.test/couple.jpg',
 heroSettings:{x:35,y:65,zoom:1.3,alt:'The couple'},
 photos:[{id:'a',src:'https://example.test/gallery.jpg',alt:'Our favorite moment',x:25,y:75,zoom:1.4,crop:'portrait'}],
 featureConfig:{},featureOrder:[],layoutByTemplate:{},designByTemplate:{}
};
const window={};
const context={window,esc:escape,fmt:x=>x,render(){},KEY:'test',state:{events:[sample]},localStorage:{setItem(){}},alert(){},current:()=>sample,Date};
vm.createContext(context);
vm.runInContext(core,context,{filename:'builder-core.js'});
const U=window.URIBuilder;
assert.equal(U.presets.nightfall.bg,'#0f0f0f');
assert.equal(U.presets.nightfall.ink,'#f3f3f3');
assert.equal(U.presets.nightfall.accent,'#ff6046');
assert.equal(U.variant(sample,'hero'),'immersive');
assert.equal(U.variant(sample,'gallery'),'grid');
const design=U.design(sample);
assert.equal(design.heading,'barlow');
const rendered=U.render(sample);
assert.match(rendered,/wb-theme-nightfall/);
assert.match(rendered,/wb-nightfall-hero/);
assert.match(rendered,/wb-nightfall-story/);
assert.match(rendered,/Maya/);
assert.match(rendered,/Emir/);
assert.match(rendered,/The Garden Pavilion/);
assert.match(rendered,/Our favorite moment/);
assert.match(rendered,/scale\(1\.3\)/);
const mini=U.cover(sample);
assert.match(mini,/wb-mini-nightfall/);
assert.match(mini,/Maya/);
assert.match(mini,/Emir/);
assert.match(mini,/scale\(1\.3\)/);
assert.doesNotMatch(rendered+mini,/steamstatic|dota2\.com|valve_logo|abaddon\.jpg/i);
const before=JSON.stringify({names:[sample.name1,sample.name2],hero:sample.heroPhoto,photos:sample.photos,config:sample.featureConfig,order:sample.featureOrder});
sample.template='classic';U.render(sample);sample.template='garden';U.render(sample);sample.template='nightfall';U.render(sample);
assert.equal(JSON.stringify({names:[sample.name1,sample.name2],hero:sample.heroPhoto,photos:sample.photos,config:sample.featureConfig,order:sample.featureOrder}),before);
sample.featureConfig.gallery=false;
assert.doesNotMatch(U.render(sample),/data-feature="gallery"/);
sample.featureConfig.gallery=true;
sample.featureOrder=['story','hero',...U.ids.filter(x=>x!=='story'&&x!=='hero')];
let ordered=U.render(sample);
assert.ok(ordered.indexOf('data-feature="story"')<ordered.indexOf('data-feature="hero"'));
for(const v of ['split','centered','immersive']){
 sample.layoutByTemplate.nightfall={hero:v};
 assert.match(U.render(sample),new RegExp('wb-hero-'+v));
}
for(const v of ['letter','quote','columns']){
 sample.layoutByTemplate.nightfall={story:v};
 assert.match(U.render(sample),new RegExp('wb-story-'+v));
}
sample.designByTemplate.nightfall={bg:'#111111',ink:'#eeeeee',accent:'#cc5533',heading:'montserrat',spacing:'compact'};
assert.equal(U.design(sample).accent,'#cc5533');
assert.match(U.render(sample),/--wb-accent:#cc5533/);
assert.equal(U.payload(sample).template,'nightfall');
sample.name1='<script>alert(1)</script>';
assert.doesNotMatch(U.render(sample),/<script>/);
assert.match(U.render(sample),/&lt;script&gt;/);
assert.match(wedding,/id:'nightfall',name:'Nightfall'/);
assert.match(wizard,/\['classic','garden','nightfall'\]/);
assert.match(editor,/\['classic','garden','nightfall'\]/);
assert.match(html,/href="nightfall-template\.css"/);
assert.match(css,/@container \(max-width:480px\)/);
assert.match(css,/\.wb-theme-nightfall/);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Stylesheet braces must balance');
console.log('Nightfall template checks passed: dark design, three cover layouts, photo framing, names, editing, publication data, responsive CSS, and safe switching.');
