/* Run: node tests/photo-manager-smoke.cjs
 * Exercise Photo Manager 2.0 against the actual builder modules without a browser/network. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e={type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',venue:'Garden',
 heroPhoto:'https://example.test/cover.jpg',heroSettings:{x:50,y:50,zoom:1,alt:'Cover'},
 photos:[{id:'a',src:'https://example.test/a.jpg',alt:'First',x:50,y:50,crop:'landscape'},
         {id:'b',src:'https://example.test/b.jpg',alt:'Second',x:45,y:55,crop:'square'}]};
const storage={},host={innerHTML:'',querySelector(){return {focus(){}}}},bodyClass=new Set();
const cropImg={style:{}},cropFrame={className:'',querySelector(){return cropImg},getBoundingClientRect(){return {width:400,height:300}},setPointerCapture(){},releasePointerCapture(){}};
const nodes={wbPhotoDialogHost:host,wbCropFrame:cropFrame,wbCropZoomText:{textContent:''},wbCropX:{value:''},wbCropY:{value:''},wbCropZoom:{value:''},wbCropAlt:{value:''},wbPhotoNotice:{textContent:''}};
const previewTargets={
 cover:{children:[],querySelector(selector){if(selector==='.wb-preview-photo-edit')return this.children[0]||null;return null},appendChild(button){this.children.push(button)}},
 gallery:{children:[],querySelector(selector){if(selector==='.wb-preview-photo-edit')return this.children[0]||null;return null},appendChild(button){this.children.push(button)}}
};
nodes.wbLivePreview={
 querySelector(selector){return selector.includes('hero')?previewTargets.cover:null},
 querySelectorAll(selector){return selector.includes('gallery')?[{querySelector(){return previewTargets.gallery}}]:[]}
};
const document={
 body:{classList:{add:x=>bodyClass.add(x),remove:x=>bodyClass.delete(x)}},
 activeElement:null,
 getElementById:id=>nodes[id]||null,
 addEventListener(){},removeEventListener(){},
 querySelector:()=>null,querySelectorAll:()=>[],
 createElement(tag){
  if(tag==='canvas')return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return 'data:image/jpeg;base64,VEVTVA=='}};
  return {tagName:tag.toUpperCase(),className:'',children:[],addEventListener(name,fn){this[name]=fn},setAttribute(){},innerHTML:'',appendChild(node){this.children.push(node)}};
 }
};
const FakeImage=class{constructor(){this.width=400;this.height=600}set src(url){Promise.resolve().then(()=>this.onload?.())}};
const URL={createObjectURL:()=> 'blob:fake',revokeObjectURL(){}};
const window={addEventListener(){},uriBPanel(){}};
const ctx={window,document,URL,Image:FakeImage,esc,fmt:x=>x,render(){},eventPage(){},current:()=>e,
 KEY:'test',state:{events:[e]},localStorage:{setItem(key,value){storage[key]=value}},alert(){},Date,console};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('builder-core.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('builder-photos.js','utf8'),ctx);
(async()=>{
 const U=window.URIBuilder,html=window.uriBuilderPhotosPanel(e);
 assert.match(html,/Photo Manager/);assert.match(html,/wb-photo-grip/);assert.match(html,/aria-label="Move photo right"/);
 assert.match(html,/Edit crop/);assert.match(html,/Photo gallery/);
 window.uriPhotoOpen('gallery',0);
 assert.match(host.innerHTML,/role="dialog"/);assert.ok(bodyClass.has('uri-photo-dialog-open'));
 window.uriPhotoDraft('zoom',1.65);window.uriPhotoDraft('x',25);window.uriPhotoDraft('y',71);window.uriPhotoDraft('crop','portrait');
 assert.equal(e.photos[0].zoom,1,'Crop draft must not save until applied');
 window.uriPhotoApply();
 assert.equal(e.photos[0].zoom,1.65);assert.equal(e.photos[0].x,25);assert.equal(e.photos[0].y,71);assert.equal(e.photos[0].crop,'portrait');
 assert.equal(e.photos[0].id,'a','Stable image ID must survive crop');
 assert.equal(bodyClass.has('uri-photo-dialog-open'),false);
 window.uriPhotoOpen('gallery',0);window.uriPhotoDraft('zoom',2.5);window.uriPhotoClose();
 assert.equal(e.photos[0].zoom,1.65,'Cancel must discard changes');
 const before=e.photos.map(p=>p.id);
 window.uriBPhotoMove(0,1);
 assert.deepEqual(e.photos.map(p=>p.id),before.slice().reverse());
 assert.equal(e.photos[1].zoom,1.65,'Crops must follow photos when reordered');
 window.uriPhotoDragStart({dataTransfer:{effectAllowed:'',setData(){}},target:{closest(){return {classList:{add(){}}}}}},1);
 window.uriPhotoDrop({preventDefault(){}},0);
 assert.deepEqual(e.photos.map(p=>p.id),before,'Drag and drop must reorder');
 window.uriPhotoOpen('hero',0);window.uriPhotoDraft('zoom',1.4);window.uriPhotoDraft('x',31);window.uriPhotoApply();
 assert.equal(e.heroSettings.zoom,1.4);assert.equal(e.heroSettings.x,31);
 window.uriPhotoDecoratePreview();
 assert.equal(previewTargets.cover.children.length,1);
 assert.equal(previewTargets.gallery.children.length,1);
 window.uriPhotoDecoratePreview();
 assert.equal(previewTargets.cover.children.length,1,'Preview edit overlays must not duplicate');
 const botanical=U.render(e);e.template='garden';const editorial=U.render(e);
 assert.match(botanical,/scale\(1\.4\)/);assert.match(editorial,/scale\(1\.4\)/);
 assert.match(editorial,/scale\(1\.65\)/);
 await window.uriBPhotoUpload({target:{files:[{name:'new.jpg',type:'image/jpeg',size:1024}],value:''}},'replace',0);
 assert.equal(e.photos[0].id,'a','Replacement must preserve photo identity');
 assert.equal(e.photos[0].zoom,1,'Replacement must reset old crop to avoid surprising frames');
 assert.match(e.photos[0].src,/^data:image\/jpeg/);
 await window.uriBPhotoUpload({target:{files:[{name:'another.jpg',type:'image/jpeg',size:1024}],value:''}},'gallery');
 assert.equal(e.photos.length,3);assert.ok(e.photos[2].id);
 window.uriBPhotoRemove(2);assert.equal(e.photos.length,2);
 assert.ok(storage.test?.includes('"photos"'));
 console.log('Photo Manager 2.0 passed: crop apply/cancel, focal point, zoom, drag reorder, arrows, mobile-safe controls, preview actions, replacement, and persistence.');
})().catch(e=>{console.error(e);process.exitCode=1});
