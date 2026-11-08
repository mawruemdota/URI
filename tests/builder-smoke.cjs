const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inline,'Expected inline site script');
const files=['wedding.js','builder-core.js','builder-editor.js','builder-photos.js','cloud-config.js','cloud.js'];
const app={innerHTML:''},root={innerHTML:''},storage={};
const window={addEventListener(){},scrollTo(){}};
const document={
  getElementById(id){return id==='app'?app:{innerHTML:''}},
  querySelector(){return root},
  querySelectorAll(){return []}
};
const location={hash:'#home',href:'https://example.com/URI/#home',origin:'https://example.com',pathname:'/URI/'};
const localStorage={getItem:key=>storage[key]??null,setItem:(key,value)=>{storage[key]=value}};
const sessionStorage={getItem:key=>storage['session:'+key]??null,setItem:(key,value)=>{storage['session:'+key]=value},removeItem:key=>{delete storage['session:'+key]}};
const sandbox={window,document,root,storage,location,localStorage,sessionStorage,navigator:{},alert(){},confirm(){return true},prompt(){},console,Date,URL,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout};
vm.createContext(sandbox);
vm.runInContext(inline[1],sandbox,{filename:'index.html'});
for(const path of files)vm.runInContext(fs.readFileSync(path,'utf8'),sandbox,{filename:path});
const scenario=function(){
 const sample={...defaults(),id:'e_ci',type:'Wedding',name1:'Maya',name2:'Emir',date:'2027-09-18',venue:'The Garden',photos:[]};
 state.events.push(sample);state.current=sample.id;tab='edit';location.hash='#event';render();
 const U=window.URIBuilder;
 const initialOrder=sample.featureOrder.slice();
 const initialEnabled=sample.featureOrder.filter(id=>U.enabled(sample,id));
 const rendered=U.render(sample);
 window.uriBMove('timeline',-1);
 window.uriBToggle('dress',true);
 window.uriBPanel('design');
 window.uriBDesign('accent','#aa0000');
 window.uriBPanel('photos');
 const photosOk=root.innerHTML.includes('Photo Manager');
 window.uriBPanel('publish');
 const cloudOk=root.innerHTML.includes('Cloud setup required')||root.innerHTML.includes('Supabase library could not be loaded');
 sample.layoutByTemplate.classic={gallery:'grid'};
 const variantOk=U.render(sample).includes('wb-gallery-grid');
 sample.template='garden';
 const editorialOk=U.render(sample).includes('wb-theme-editorial');
 sample.guests=[{name:'Private Guest',email:'private@example.com'}];
 const payload=U.payload(sample);
 return {initialOrder,initialEnabled,orderingWorks:sample.featureOrder.indexOf('timeline')===4,
 dressEnabled:U.enabled(sample,'dress'),
 designWorks:sample.designByTemplate.classic.accent==='#aa0000',
 photosOk,cloudOk,variantOk,editorialOk,privateGuestExcluded:!('guests' in payload),
 rendered:rendered.includes('wb-theme-botanical'),saved:!!localStorage.getItem(KEY)};
};
const result=vm.runInContext('('+scenario.toString()+')()',sandbox);
assert.deepEqual(JSON.parse(JSON.stringify(result.initialOrder)),['hero','story','gallery','countdown','details','timeline','dress','gifts','rsvp']);
assert.deepEqual(JSON.parse(JSON.stringify(result.initialEnabled)),['hero','story','gallery','countdown','details','timeline','rsvp']);
for(const [key,value] of Object.entries(result))if(typeof value==='boolean')assert.ok(value,'Failed check: '+key);
console.log('URI wedding builder smoke tests passed: feature ordering, visibility, design, variants, editor, cloud integration fallback, guest privacy.');
