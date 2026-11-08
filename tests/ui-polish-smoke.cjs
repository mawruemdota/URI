/* Run: node tests/ui-polish-smoke.cjs
   Verifies UI preview fidelity without network or a browser driver. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const core=fs.readFileSync('builder-core.js','utf8');
const editor=fs.readFileSync('builder-editor.js','utf8');
const css=fs.readFileSync('ui-polish.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const e={
  type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',
  date:'2027-09-18',time:'15:00',venue:'The Garden',address:'Cavite',
  status:'draft',photos:[],featureConfig:{},featureOrder:[]
};
const elements={
  wbPreviewSurface:{clientWidth:600,style:{},dataset:{viewport:'desktop'}},
  wbPreviewStage:{style:{}},
  wbLivePreview:{style:{},scrollHeight:2800,querySelectorAll(){return []}},
  wbPreviewScale:{textContent:''},
  wbReadiness:{innerHTML:''}
};
const viewportBtns=[
  {dataset:{viewportChoice:'desktop'},setAttribute(k,v){this[k]=v}},
  {dataset:{viewportChoice:'mobile'},setAttribute(k,v){this[k]=v}}
];
const document={
  getElementById:id=>elements[id]||null,
  querySelectorAll:selector=>selector==='[data-viewport-choice]'?viewportBtns:[],
  querySelector:()=>null
};
const window={addEventListener(){}};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const context={window,document,current:()=>e,esc,fmt:v=>v,render(){},eventPage(){},
  TEMPLATES:[{id:'classic',name:'Romantic Botanical'},{id:'garden',name:'Minimalist Editorial'}],
  templateThumb:()=>'<div class="template-preview"></div>',
  KEY:'test',state:{events:[e]},localStorage:{setItem(){}},alert(){},setTimeout:fn=>fn(),
  Date,console
};
vm.createContext(context);
vm.runInContext(core,context,{filename:'builder-core.js'});
vm.runInContext(editor,context,{filename:'builder-editor.js'});

const markup=window.uriBuilderEditor(e);
assert.match(markup,/id="wbPreviewStage"/);
assert.match(markup,/id="wbPreviewScale"/);
assert.match(markup,/wb-preview-toolbar[\s\S]*?Preview/);
window.uriBViewport('desktop');
assert.equal(elements.wbLivePreview.style.width,'1024px');
assert.equal(elements.wbPreviewStage.style.width,(568/1024*1024)+'px');
assert.equal(elements.wbPreviewStage.style.height,Math.ceil(2800*568/1024)+'px');
assert.match(elements.wbPreviewScale.textContent,/1024px desktop layout/);
window.uriBViewport('mobile');
assert.equal(elements.wbLivePreview.style.width,'390px');
assert.equal(elements.wbPreviewStage.style.width,'390px');
assert.match(elements.wbPreviewScale.textContent,/390px mobile layout/);
elements.wbPreviewSurface.clientWidth=320;
window.uriBViewport('mobile');
assert.equal(elements.wbPreviewStage.style.width,'288px');
const currentState=JSON.stringify({photos:e.photos,name1:e.name1,name2:e.name2,featureOrder:e.featureOrder});
window.uriBViewport('desktop');
assert.equal(JSON.stringify({photos:e.photos,name1:e.name1,name2:e.name2,featureOrder:e.featureOrder}),currentState);
assert.match(css,/workspace:has\(\.wb-editor\)/);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/wb-botanical-cover\.wb-hero-immersive/);
assert.match(css,/wb-editorial-cover\.wb-hero-immersive/);
assert.match(html,/href="ui-polish\.css"/);
console.log('UI polish tests passed: true-width previews, desktop/mobile scaling, layout styles, and event data preservation.');
