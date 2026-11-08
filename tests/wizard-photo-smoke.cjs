/* Run: node tests/wizard-photo-smoke.cjs
   Unit-test the optional cover photo path without needing a browser or network. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const app={innerHTML:''},root={innerHTML:''},store={};
const sessionStorage={getItem:k=>store['session:'+k]||null,setItem:(k,v)=>{store['session:'+k]=v},removeItem:k=>{delete store['session:'+k]}};
const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]}};
const document={getElementById:id=>id==='app'?app:{innerHTML:'',dataset:{},textContent:'',setAttribute(){},remove(){},focus(){}},querySelector(){return root},querySelectorAll(){return []},
 createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return 'data:image/jpeg;base64,VEVTVA=='}}}};
const location={hash:'#home',origin:'http://localhost',pathname:'/URI/',href:'http://localhost/URI/#home'};
class FakeImage {
 constructor(){this.width=500;this.height=700}
 set src(v){Promise.resolve().then(()=>this.onload&&this.onload())}
}
const URL={createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}};
const window={addEventListener(){},scrollTo(){}};
const ctx={window,document,location,localStorage,sessionStorage,navigator:{},Image:FakeImage,URL,Date,setTimeout,clearTimeout,
 crypto:require('node:crypto').webcrypto,alert(){},confirm(){return true},prompt(){},console};
vm.createContext(ctx);
vm.runInContext(inline,ctx);
for(const file of ['wedding.js','builder-core.js','builder-editor.js','builder-photos.js','cloud-config.js','cloud.js','wedding-flow.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
(async()=>{
 await vm.runInContext('(async()=>{startWizard("classic");wizardStep(3);await window.uriFlowPhoto({target:{files:[{type:"image/png",size:1024,name:"couple.png"}]}});})()',ctx);
 let draft=JSON.parse(localStorage.getItem('uri-wedding-wizard-v3'));
 assert.equal(draft.step,3);
 assert.equal(draft.wizard.heroPhoto,'data:image/jpeg;base64,VEVTVA==');
 assert.match(app.innerHTML,/Cover photo added/);
 assert.match(app.innerHTML,/Wedding photograph selected/);
 // Unsupported files must not replace the valid photo.
 await vm.runInContext('(async()=>{await window.uriFlowPhoto({target:{files:[{type:"application/pdf",size:1024,name:"bad.pdf"}]}});})()',ctx);
 draft=JSON.parse(localStorage.getItem('uri-wedding-wizard-v3'));
 assert.equal(draft.wizard.heroPhoto,'data:image/jpeg;base64,VEVTVA==');
 vm.runInContext('window.uriFlowClearPhoto()',ctx);
 draft=JSON.parse(localStorage.getItem('uri-wedding-wizard-v3'));
 assert.equal(draft.wizard.heroPhoto,'');
 assert.doesNotMatch(app.innerHTML,/Cover photo added/);
 console.log('Wizard photo checks passed: upload, persisted draft, preview, invalid-file rollback, and removal.');
})().catch(e=>{console.error(e);process.exitCode=1});
