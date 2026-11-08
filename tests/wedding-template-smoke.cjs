/* Run: node tests/wedding-template-smoke.cjs */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('builder-core.js','utf8');
const css=fs.readFileSync('wedding-refined.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const window={};
const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ctx={window,esc:escape,fmt:value=>value,render(){},KEY:'test',state:{events:[]},localStorage:{setItem(){}},alert(){},current(){return null},Date};
vm.createContext(ctx);
vm.runInContext(source,ctx);
const U=window.URIBuilder;
const e={
 type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',date:'2027-09-18',
 time:'16:00',venue:'Garden Chapel',address:'Cavite',message:'Our unique wedding message.',
 heroPhoto:'https://example.test/photo.jpg',
 photos:[{src:'https://example.test/gallery.jpg',alt:'Our favorite photo',x:30,y:70,crop:'portrait'}],
 featureConfig:{},featureOrder:U.ids.slice()
};
const bot=U.render(e);
assert.match(bot,/wb-botanical-cover/);
assert.match(bot,/wb-botanical-art-top/);
assert.match(bot,/wb-botanical-round-photo/);
assert.match(bot,/Our unique wedding message/);
assert.match(bot,/wb-hero-image/);
assert.match(bot,/https:\/\/example\.test\/photo\.jpg/);
assert.match(U.cover(e),/wb-mini-romance/);
assert.ok(U.ids.filter(id=>U.enabled(e,id)).every((id,i,ids)=>i===0||bot.indexOf('data-feature="'+ids[i-1]+'"')<bot.indexOf('data-feature="'+id+'"')));
const before=JSON.stringify({photos:e.photos,order:e.featureOrder,message:e.message});
e.template='garden';
const editorial=U.render(e);
assert.match(editorial,/wb-editorial-cover/);
assert.match(editorial,/wb-editorial-detail-teaser/);
assert.match(editorial,/wb-editorial-timeline-teaser/);
assert.match(editorial,/wb-editorial-story-monogram/);
assert.match(editorial,/wb-editorial-story-names/);
assert.match(editorial,/https:\/\/example\.test\/gallery\.jpg/);
assert.match(U.cover(e),/wb-mini-stationery/);
assert.equal(JSON.stringify({photos:e.photos,order:e.featureOrder,message:e.message}),before,'Changing templates must preserve data');
e.featureConfig.details=false;e.featureConfig.timeline=false;
const hidden=U.render(e);
assert.doesNotMatch(hidden,/data-feature="details"/);
assert.doesNotMatch(hidden,/data-feature="timeline"/);
assert.doesNotMatch(hidden,/wb-editorial-detail-teaser"><div class="wb-editorial-side-title">The Details/);
assert.doesNotMatch(hidden,/wb-editorial-timeline-teaser"><div class="wb-editorial-side-title">The Timeline/);
e.featureConfig.details=true;e.featureConfig.timeline=true;
e.featureOrder=['story','hero',...U.ids.filter(x=>!['story','hero'].includes(x))];
const reordered=U.render(e);
assert.ok(reordered.indexOf('data-feature="story"')<reordered.indexOf('data-feature="hero"'),'Visual order must follow user order');
e.layoutByTemplate={garden:{hero:'immersive',story:'quote'}};
const variant=U.render(e);
assert.match(variant,/wb-hero-immersive/);
assert.match(variant,/wb-story-quote/);
assert.match(css,/grid-template-columns:22% 56% 22%/);
assert.match(css,/@container \(max-width:575px\)/);
assert.match(css,/\.wb-editorial-story-monogram/);
assert.match(css,/\.wb-botanical-art/);
assert.match(html,/href="wedding-refined\.css"/);
console.log('Wedding template refinement checks passed: layouts, assets, shared content, visibility, ordering, variants and CSS.');
