/* Regression suite for adaptive wedding features.
 * Run: node tests/dynamic-sections-smoke.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const escape=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const window={},state={events:[]};
const ctx={window,esc:escape,fmt:x=>x,render(){},KEY:'uri-test',state,Date,localStorage:{setItem(){}},alert(){},current(){return state.events[0]||null}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('builder-core.js','utf8'),ctx,{filename:'builder-core.js'});
vm.runInContext(fs.readFileSync('wedding-details.js','utf8'),ctx,{filename:'wedding-details.js'});
const U=window.URIBuilder;
const templates=['classic','garden','nightfall'];
const sample=()=>({
 type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',
 date:'2033-05-11',time:'17:00',venue:'A Garden Venue',address:'Cavite',
 message:'Our story',deadline:'2033-04-30',
 heroPhoto:'https://example.test/hero.jpg',
 photos:[{id:'sample',src:'https://example.test/gallery.jpg',alt:'Couple portrait',crop:'portrait'}],
 featureConfig:{},featureOrder:U.ids.slice(),layoutByTemplate:{},designByTemplate:{},
 timelineItems:[{id:'a',title:'Ceremony',time:'17:00',date:'',note:'',location:'ceremony'}],
 weddingDetails:{ceremony:{mapUrl:'',instructions:''},reception:{enabled:false,venue:'',date:'',time:'',address:''}}
});
let combinations=0;
for(const template of templates){
  const layout=U.templateLayout[template];assert.ok(layout);
  const e=sample();e.template=template;state.events=[e];
  for(let mask=0;mask<1<<U.ids.length;mask++){
    e.featureConfig=Object.fromEntries(U.ids.map((id,i)=>[id,!!(mask&(1<<i))]));
    const planned=U.compose(e);
    const out=U.render(e);
    const actual=U.ids.filter(id=>e.featureConfig[id]);
    assert.deepEqual(planned.map(x=>x.id),e.featureOrder.filter(id=>actual.includes(id)),template+' section order on mask '+mask);
    assert.equal((out.match(/data-layout-width=/g)||[]).length,planned.length,template+' missing dynamic width');
    assert.equal((out.match(/data-feature="/g)||[]).length,planned.length,template+' rendered unexpected feature');
    assert.match(out,/data-visible-features="\d+"/);
    for(let i=0;i<planned.length;i++){
      const p=planned[i];
      assert.ok(p.html.includes('data-feature="'+p.id+'"'),template+' wrong section ID');
      assert.ok(p.html.includes('data-layout-width="'+p.width+'"'));
      assert.ok(p.html.includes('data-layout-pair="'+p.pair+'"'));
      if(p.width==='half'){
        assert.ok(layout.pairs.includes(p.id),'Nonpair section became half width');
        if(p.pair==='first'){
          assert.ok(planned[i+1]&&planned[i+1].pair==='second','First half must have a second half');
          assert.equal(planned[i+1].width,'half');
        }else{
          assert.equal(p.pair,'second');
          assert.ok(planned[i-1]&&planned[i-1].pair==='first','Second half must follow first half');
        }
      }else{
        assert.equal(p.pair,'single');
      }
      if(p.pair==='single'&&layout.pairs.includes(p.id)&&planned[i+1]&&layout.pairs.includes(planned[i+1].id))
        assert.fail('Two adjacent pairable sections left as singles');
    }
    if(template==='garden'&&e.featureConfig.hero){
      const details=e.featureConfig.details,timeline=e.featureConfig.timeline;
      const side=details?(timeline?'both':'details'):(timeline?'timeline':'none');
      assert.match(out,new RegExp('wb-editorial-sides-'+side));
      const thumb=U.cover(e);
      assert.match(thumb,new RegExp('wb-mini-sides-'+side));
      assert.equal((out.match(/class="wb-editorial-side wb-editorial-left"/g)||[]).length,details?1:0);
      assert.equal((out.match(/class="wb-editorial-side wb-editorial-right"/g)||[]).length,timeline?1:0);
      assert.equal((thumb.match(/class="wb-mini-details"/g)||[]).length,details?1:0);
      assert.equal((thumb.match(/class="wb-mini-timeline"/g)||[]).length,timeline?1:0);
    }
    combinations++;
  }
  e.featureConfig=Object.fromEntries(U.ids.map(id=>[id,true]));
  e.photos=[];
  assert.ok(!U.compose(e).some(x=>x.id==='gallery'),'Empty gallery should not reserve space');
  e.photos=[{id:'sample',src:'https://example.test/gallery.jpg'}];
  assert.ok(U.compose(e).some(x=>x.id==='gallery'),'Gallery returns after adding photos');
  e.timelineItems=[];
  assert.ok(!U.compose(e).some(x=>x.id==='timeline'),'Empty timeline should not reserve space');
  e.timelineItems=[{id:'a',time:'17:00',title:'Ceremony'}];
  const before=JSON.stringify({names:[e.name1,e.name2],photos:e.photos,details:e.weddingDetails,timeline:e.timelineItems});
  for(const template2 of templates){e.template=template2;U.render(e)}
  assert.equal(JSON.stringify({names:[e.name1,e.name2],photos:e.photos,details:e.weddingDetails,timeline:e.timelineItems}),before,'Switching templates must preserve data');
  const shifted=sample();shifted.template=template;
  shifted.featureOrder=['rsvp','dress','details','hero','gifts','timeline','countdown','gallery','story'];
  shifted.featureConfig.dress=false;
  const plan=U.compose(shifted);
  assert.deepEqual(plan.map(x=>x.id),shifted.featureOrder.filter(id=>id!=='dress'),'Custom order must remain stable');
}
const css=fs.readFileSync('dynamic-sections.css','utf8');
assert.match(css,/@container \(max-width:575px\)/);
assert.match(css,/wb-mini-sides-none/);
assert.match(css,/wb-editorial-sides-timeline/);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS braces should balance');
assert.match(fs.readFileSync('index.html','utf8'),/href="dynamic-sections\.css"/);
console.log('Dynamic feature layouts passed:',combinations,'visibility combinations across three templates, standalone pairing, cover reflow, missing content, preservation and CSS.');
