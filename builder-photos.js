/* URI Photo Manager 2.0
 * Non-destructive focal point + zoom, drag-and-drop ordering, editor-only preview shortcuts.
 * All photos remain local until the owner explicitly uses the separate publish flow. */
(function(){
'use strict';
const U=window.URIBuilder;
const T=v=>esc(v==null?'':String(v));
const clamp=(v,min=0,max=100)=>Math.min(max,Math.max(min,Number(v)||0));
const FORMATS=[['landscape','Landscape · 3:2'],['square','Square · 1:1'],['portrait','Portrait · 3:4']];
let dialog=null,dragIndex=-1,pointer=null,lastFocused=null,escHandler=null;
function event(){const value=current();return value&&value.type==='Wedding'?U.model(value):null}
function fresh(){eventPage()}
function formatSelect(i,value){return '<label class="wb-field"><span>Display shape</span><select aria-label="Gallery photo '+(i+1)+' display shape" onchange="uriBPhotoSet('+i+',\'crop\',this.value)">'+FORMATS.map(([id,label])=>'<option value="'+id+'" '+(value===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'}
function photoCard(p,i,total){
 const n=i+1;
 return '<article class="wb-photo-card wb-photo-tile" data-photo-index="'+i+'" ondragover="uriPhotoDragOver(event,'+i+')" ondragleave="uriPhotoDragLeave(event)" ondrop="uriPhotoDrop(event,'+i+')">'
   +'<div class="wb-photo-tile-header"><span class="wb-photo-tile-number">PHOTO '+n+'</span><button type="button" class="wb-photo-grip" draggable="true" title="Drag this handle to reorder" aria-label="Drag photo '+n+' to reorder" ondragstart="uriPhotoDragStart(event,'+i+')" ondragend="uriPhotoDragEnd(event)">⠿ <span>Drag to reorder</span></button></div>'
   +'<button type="button" class="wb-photo-tile-image" onclick="uriPhotoOpen(\'gallery\','+i+')" aria-label="Open crop editor for photo '+n+'">'+U.picture(p,'wb-photo-card-image')+'<span class="wb-photo-tile-edit">Edit crop</span></button>'
   +'<div class="wb-photo-card-controls"><label class="wb-field"><span>Photo description</span><input aria-label="Description for photo '+n+'" value="'+T(p.alt)+'" maxlength="180" oninput="uriBPhotoSet('+i+',\'alt\',this.value)" placeholder="Describe this moment"></label>'
   +formatSelect(i,p.crop)
   +'<div class="wb-photo-tile-actions"><button type="button" class="wb-photo-action-primary" onclick="uriPhotoOpen(\'gallery\','+i+')">Adjust photo</button>'
   +'<label class="wb-photo-replace">Replace<input aria-label="Replace photo '+n+'" type="file" accept="image/jpeg,image/png,image/webp" onchange="uriBPhotoUpload(event,\'replace\','+i+')"></label></div>'
   +'<div class="wb-photo-actions"><button type="button" aria-label="Move photo left" '+(i===0?'disabled':'')+' onclick="uriBPhotoMove('+i+',-1)">←</button><button type="button" aria-label="Move photo right" '+(i===total-1?'disabled':'')+' onclick="uriBPhotoMove('+i+',1)">→</button><button type="button" class="wb-remove-photo" onclick="uriBPhotoRemove('+i+')">Remove</button></div></div></article>';
}
window.uriBuilderPhotosPanel=function(e){
 U.model(e);const hero=U.photo({src:e.heroPhoto||'',...e.heroSettings}),n=e.photos.length;
 return '<section class="wb-photo-manager"><div class="wb-photo-manager-head"><div><h3>Photo Manager</h3><p>Crop, zoom, arrange and replace photographs. All edits are non-destructive.</p></div><span class="wb-photo-count">'+n+' / 8 gallery</span></div>'
   +'<div id="wbPhotoNotice" class="wb-photo-notice" role="status" aria-live="polite"></div>'
   +'<div class="wb-photo-section"><div class="wb-photo-section-heading"><div><strong>Cover photograph</strong><small>Used in both wedding designs</small></div></div>'
   +'<div class="wb-photo-hero"><button type="button" class="wb-photo-hero-thumb" onclick="uriPhotoOpen(\'hero\',0)" aria-label="Adjust cover photograph">'+U.picture(hero,'wb-photo-card-image','Add your couple photo')+'</button>'
   +'<div class="wb-photo-hero-actions"><p>'+(e.heroPhoto?'Adjust how the couple appears in portrait and landscape layouts.':'Start by choosing a favorite photograph of the couple.')+'</p>'
   +(e.heroPhoto?'<button class="btn small" type="button" onclick="uriPhotoOpen(\'hero\',0)">Edit crop & zoom</button>':'')
   +'<label class="wb-photo-replace wb-photo-choose"><span>'+(e.heroPhoto?'Replace cover':'Upload cover')+'</span><input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload or replace cover photograph" onchange="uriBPhotoUpload(event,\'hero\')"></label>'
   +(e.heroPhoto?'<button type="button" class="wb-photo-remove-link" onclick="uriBHeroRemove()">Remove cover</button>':'')+'</div></div></div>'
   +'<div class="wb-photo-section"><div class="wb-photo-section-heading"><div><strong>Photo gallery</strong><small>Drag by the handle to reorder. Use arrows on mobile.</small></div></div>'
   +'<label class="wb-upload wb-photo-add"><strong>Add photos</strong><span>JPEG, PNG or WebP · up to 8 photos · maximum 12 MB each</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onchange="uriBPhotoUpload(event,\'gallery\')" '+(n>=8?'disabled':'')+'></label>'
   +(n?'<div class="wb-photo-cards wb-photo-grid">'+e.photos.map((p,i)=>photoCard(p,i,n)).join('')+'</div>':'<div class="wb-photo-empty-list"><span aria-hidden="true">▧</span><strong>No gallery photos yet</strong><p>Upload photos here. The gallery will appear automatically on your invitation.</p></div>')
   +'</div><div class="wb-photo-local-note">Your images are saved in this browser until you publish. Photo framing can be changed again at any time.</div><div id="wbPhotoDialogHost"></div></section>';
};
function setNotice(message){const el=document.getElementById('wbPhotoNotice');if(el)el.textContent=message}
function persistOrRollback(mutator){
 const e=event();if(!e)return false;
 const old={heroPhoto:e.heroPhoto,heroSettings:JSON.parse(JSON.stringify(e.heroSettings||{})),photos:JSON.parse(JSON.stringify(e.photos))};
 mutator(e);
 if(U.persist())return true;
 e.heroPhoto=old.heroPhoto;e.heroSettings=old.heroSettings;e.photos=old.photos;
 return false;
}
function afterUpdate(message){fresh();if(message)setNotice(message)}
window.uriBPhotoSet=function(i,key,value){
 const e=event(),p=e?.photos[i];if(!p||!['alt','crop','x','y','zoom'].includes(key))return;
 if(key==='crop'&&!FORMATS.some(([id])=>id===value))return;
 const next=key==='alt'?String(value).slice(0,180):key==='crop'?value:key==='zoom'?clamp(value,1,3):clamp(value);
 if(!persistOrRollback(x=>{x.photos[i]={...x.photos[i],[key]:next}}))return;
 U.refresh();
};
window.uriBHeroSet=function(key,value){
 if(!['alt','x','y','zoom'].includes(key))return;
 const v=key==='alt'?String(value).slice(0,180):key==='zoom'?clamp(value,1,3):clamp(value);
 if(persistOrRollback(e=>{e.heroSettings={...e.heroSettings,[key]:v}}))U.refresh();
};
function move(i,j){
 const e=event();if(!e||!Number.isInteger(i)||!Number.isInteger(j)||i<0||j<0||i>=e.photos.length||j>=e.photos.length||i===j)return false;
 return persistOrRollback(x=>{const [p]=x.photos.splice(i,1);x.photos.splice(j,0,p)});
}
window.uriBPhotoMove=(i,delta)=>{if(move(i,i+delta))afterUpdate('Photo order saved.')};
window.uriBPhotoRemove=i=>{
 const e=event();if(!e||!e.photos[i])return;
 if(persistOrRollback(x=>{x.photos.splice(i,1)}))afterUpdate('Photo removed.');
};
window.uriBHeroRemove=()=>{if(persistOrRollback(e=>{e.heroPhoto=''}))afterUpdate('Cover photograph removed.')};
window.uriPhotoDragStart=(ev,i)=>{
 const e=event();if(!e||!e.photos[i]||!ev.dataTransfer)return;
 dragIndex=i;ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain','uri-photo-'+i);
 const card=ev.target.closest?.('.wb-photo-tile');if(card)card.classList.add('is-dragging');
};
window.uriPhotoDragOver=(ev,i)=>{
 if(dragIndex<0)return;ev.preventDefault();if(ev.dataTransfer)ev.dataTransfer.dropEffect='move';
 const card=ev.currentTarget;if(card)card.classList.add('is-drop-target');
};
window.uriPhotoDragLeave=ev=>{ev.currentTarget?.classList?.remove('is-drop-target')};
window.uriPhotoDrop=(ev,i)=>{
 ev.preventDefault();const from=dragIndex;dragIndex=-1;
 document.querySelectorAll('.wb-photo-tile').forEach(x=>x.classList.remove('is-drop-target','is-dragging'));
 if(move(from,i))afterUpdate('Gallery photo order saved.');
};
window.uriPhotoDragEnd=()=>{dragIndex=-1;document.querySelectorAll('.wb-photo-tile').forEach(x=>x.classList.remove('is-drop-target','is-dragging'))};
function compress(file){
 return new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Choose a JPEG, PNG or WebP photograph.'));
  if(file.size<=0||file.size>12*1024*1024)return reject(new Error('Choose an image smaller than 12 MB.'));
  const url=URL.createObjectURL(file),img=new Image();
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Unable to read this photo.'))};
  img.onload=()=>{
   try{
    const canvas=document.createElement('canvas'),scale=Math.min(1,1400/Math.max(img.width,img.height));
    canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    URL.revokeObjectURL(url);resolve(canvas.toDataURL('image/jpeg',.72));
   }catch(err){URL.revokeObjectURL(url);reject(err)}
  };img.src=url;
 });
}
window.uriBPhotoUpload=async function(ev,target,index){
 const e=event();if(!e)return;
 const files=[...(ev.target.files||[])];if(!files.length)return;
 const count=e.photos.length;
 if(target==='gallery'&&count+files.length>8){setNotice('The gallery supports up to eight photos.');ev.target.value='';return}
 if(!['hero','gallery','replace'].includes(target)||(target==='replace'&&!e.photos[index]))return;
 setNotice('Preparing '+(files.length===1?'your photograph':files.length+' photographs')+'…');
 const previous=e.photos.map(p=>({...p})),oldHero=e.heroPhoto;
 try{
  const prepared=[];
  for(const file of (target==='gallery'?files:[files[0]])){
   const src=await compress(file);
   prepared.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,9),src,alt:file.name.replace(/\.[^.]+$/,'').slice(0,180),x:50,y:50,zoom:1,crop:'landscape'});
  }
  const okay=persistOrRollback(x=>{
   if(target==='hero'){x.heroPhoto=prepared[0].src;x.heroSettings={...(x.heroSettings||{}),x:50,y:50,zoom:1,alt:'Wedding couple'}}
   else if(target==='gallery')x.photos.push(...prepared);
   else x.photos[index]={...x.photos[index],src:prepared[0].src,x:50,y:50,zoom:1};
  });
  if(!okay)throw new Error('Browser storage is full. Try fewer or smaller photos.');
  window.uriPhotoClose(true);
  afterUpdate(target==='hero'?'Cover photo saved.':target==='gallery'?files.length+' gallery photo(s) added.':'Photo replaced.');
 }catch(err){
  e.photos=previous;e.heroPhoto=oldHero;
  setNotice(err.message||'Unable to add this photo.');
 }finally{ev.target.value=''}
};
function source(kind,index){
 const e=event();if(!e)return null;
 if(kind==='hero')return e.heroPhoto?U.photo({src:e.heroPhoto,...e.heroSettings}):null;
 return kind==='gallery'&&e.photos[index]?U.photo(e.photos[index],index):null;
}
function cropDialog(){
 const v=dialog.value,frame=dialog.frame,k=dialog.kind;
 return '<div class="wb-crop-overlay" role="presentation" onclick="if(event.target===this)uriPhotoClose()"><div class="wb-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="wbCropTitle">'
  +'<header class="wb-crop-header"><div><span class="wb-crop-kicker">Photo Manager</span><h3 id="wbCropTitle">'+(k==='hero'?'Adjust cover photo':'Adjust gallery photo '+(dialog.index+1))+'</h3><p>Drag the image to reposition. Use zoom for a closer crop.</p></div><button type="button" class="wb-crop-close" data-photo-close aria-label="Close crop editor" onclick="uriPhotoClose()">×</button></header>'
  +'<div class="wb-crop-body"><div class="wb-crop-canvas"><div id="wbCropFrame" class="wb-crop-frame wb-crop-'+frame+'" onpointerdown="uriPhotoPointerDown(event)" onpointermove="uriPhotoPointerMove(event)" onpointerup="uriPhotoPointerUp(event)" onpointercancel="uriPhotoPointerUp(event)">'+U.picture(v,'wb-crop-photo')+'<div class="wb-crop-grid" aria-hidden="true"></div></div><span class="wb-crop-hint">Drag to move your photo · No original pixels are removed</span></div>'
  +'<div class="wb-crop-controls"><label class="wb-field"><span>'+(k==='hero'?'Preview frame':'Gallery shape')+'</span><select id="wbCropShape" onchange="uriPhotoDraft(\'crop\',this.value)">'+(k==='hero'?[['portrait','Botanical portrait'],['landscape','Editorial landscape']]:FORMATS).map(([id,label])=>'<option value="'+id+'" '+(frame===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'
  +'<label class="wb-field"><span>Zoom <output id="wbCropZoomText">'+Math.round(v.zoom*100)+'%</output></span><input id="wbCropZoom" type="range" min="1" max="3" step=".05" value="'+v.zoom+'" oninput="uriPhotoDraft(\'zoom\',this.value)"></label>'
  +'<label class="wb-field"><span>Horizontal focus</span><input id="wbCropX" type="range" min="0" max="100" step="1" value="'+v.x+'" oninput="uriPhotoDraft(\'x\',this.value)"></label>'
  +'<label class="wb-field"><span>Vertical focus</span><input id="wbCropY" type="range" min="0" max="100" step="1" value="'+v.y+'" oninput="uriPhotoDraft(\'y\',this.value)"></label>'
  +'<label class="wb-field"><span>Photo description</span><input id="wbCropAlt" type="text" maxlength="180" value="'+T(v.alt)+'" oninput="uriPhotoDraft(\'alt\',this.value)" placeholder="Describe the photograph"></label>'
  +'<button type="button" class="btn small wb-crop-reset" onclick="uriPhotoReset()">Reset framing</button>'
  +'<label class="wb-photo-replace wb-crop-replace">Replace photograph<input aria-label="Replace photograph while cropping" type="file" accept="image/jpeg,image/png,image/webp" onchange="uriBPhotoUpload(event,\''+(k==='hero'?'hero':'replace')+'\','+dialog.index+')"></label></div></div>'
  +'<footer class="wb-crop-footer"><span>Changes are saved when you select Apply.</span><div><button type="button" class="btn" onclick="uriPhotoClose()">Cancel</button><button type="button" class="btn primary" onclick="uriPhotoApply()">Apply crop</button></div></footer></div></div>';
}
window.uriPhotoOpen=function(kind,index=0,fromPreview=false){
 const e=event();if(!e||!['hero','gallery'].includes(kind))return;
 if(fromPreview&&window.uriBPanel)window.uriBPanel('photos');
 const p=source(kind,index);
 if(!p){
  if(window.uriBPanel)window.uriBPanel('photos');
  const upload=document.querySelector('.wb-photo-choose input[type="file"]');
  if(upload&&upload.focus)upload.focus();
  setNotice('Upload a photograph first to edit its crop.');
  return;
 }
 const host=document.getElementById('wbPhotoDialogHost');
 if(!host)return;
 if(dialog)window.uriPhotoClose(true);
 dialog={kind,index,original:{...p},value:{...p},frame:kind==='hero'?(e.template==='garden'?'landscape':'portrait'):p.crop};
 lastFocused=document.activeElement;
 host.innerHTML=cropDialog();
 document.body.classList.add('uri-photo-dialog-open');
 if(document.addEventListener){
  escHandler=ev=>{if(ev.key==='Escape')window.uriPhotoClose();};
  document.addEventListener('keydown',escHandler);
 }
 host.querySelector('[data-photo-close]')?.focus();
};
function refreshCrop(){
 if(!dialog)return;
 const frame=document.getElementById('wbCropFrame'),img=frame?.querySelector('.wb-crop-photo img'),v=dialog.value;
 if(frame)frame.className='wb-crop-frame wb-crop-'+dialog.frame;
 if(img){img.style.objectPosition=v.x+'% '+v.y+'%';img.style.transformOrigin=v.x+'% '+v.y+'%';img.style.transform='scale('+v.zoom+')'}
 const ids={x:'wbCropX',y:'wbCropY',zoom:'wbCropZoom',alt:'wbCropAlt'};
 for(const [key,id] of Object.entries(ids)){let input=document.getElementById(id);if(input&&input!==document.activeElement)input.value=v[key]}
 const zoom=document.getElementById('wbCropZoomText');if(zoom)zoom.textContent=Math.round(v.zoom*100)+'%';
}
window.uriPhotoDraft=(key,value)=>{
 if(!dialog||!['x','y','zoom','crop','alt'].includes(key))return;
 if(key==='crop'){
  if(!FORMATS.some(([k])=>k===value))return;
  dialog.frame=value;if(dialog.kind==='gallery')dialog.value.crop=value;
 }else if(key==='alt')dialog.value.alt=String(value).slice(0,180);
 else dialog.value[key]=key==='zoom'?clamp(value,1,3):clamp(value);
 refreshCrop();
};
window.uriPhotoReset=()=>{if(!dialog)return;dialog.value.x=50;dialog.value.y=50;dialog.value.zoom=1;refreshCrop()};
window.uriPhotoPointerDown=ev=>{
 if(!dialog||ev.button!==0)return;ev.preventDefault();
 const rect=ev.currentTarget.getBoundingClientRect();
 pointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY,startX:dialog.value.x,startY:dialog.value.y,width:rect.width||1,height:rect.height||1};
 ev.currentTarget.setPointerCapture?.(ev.pointerId);
};
window.uriPhotoPointerMove=ev=>{
 if(!pointer||!dialog||pointer.id!==ev.pointerId)return;
 const scale=dialog.value.zoom||1;
 dialog.value.x=clamp(pointer.startX-(ev.clientX-pointer.x)/pointer.width*100/scale);
 dialog.value.y=clamp(pointer.startY-(ev.clientY-pointer.y)/pointer.height*100/scale);
 refreshCrop();
};
window.uriPhotoPointerUp=ev=>{
 if(!pointer||pointer.id!==ev.pointerId)return;
 ev.currentTarget.releasePointerCapture?.(ev.pointerId);pointer=null;
};
window.uriPhotoApply=()=>{
 if(!dialog)return;
 const {kind,index,value}=dialog;
 const ok=persistOrRollback(e=>{
  if(kind==='hero')e.heroSettings={...(e.heroSettings||{}),x:value.x,y:value.y,zoom:value.zoom,alt:value.alt};
  else if(e.photos[index])e.photos[index]={...e.photos[index],x:value.x,y:value.y,zoom:value.zoom,crop:value.crop,alt:value.alt};
 });
 if(ok){window.uriPhotoClose(true);afterUpdate('Photo crop saved.')}
};
window.uriPhotoClose=function(silent=false){
 if(!dialog)return;
 dialog=null;pointer=null;
 if(escHandler&&document.removeEventListener)document.removeEventListener('keydown',escHandler);
 escHandler=null;document.body.classList.remove('uri-photo-dialog-open');
 const host=document.getElementById('wbPhotoDialogHost');if(host)host.innerHTML='';
 const f=lastFocused;lastFocused=null;
 if(!silent&&f&&f.isConnected&&f.focus)f.focus({preventScroll:true});
};
window.uriPhotoDecoratePreview=function(){
 const preview=document.getElementById('wbLivePreview');if(!preview)return;
 function add(node,label,kind,i){
  if(!node||node.querySelector('.wb-preview-photo-edit'))return;
  const button=document.createElement('button');
  button.type='button';button.className='wb-preview-photo-edit';
  button.setAttribute('aria-label',label);
  button.innerHTML='<span>Edit photo</span>';
  button.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();window.uriPhotoOpen(kind,i,true)});
  node.appendChild(button);
 }
 add(preview.querySelector('[data-feature="hero"] .wb-hero-image'),'Edit wedding cover photograph','hero',0);
 preview.querySelectorAll('[data-feature="gallery"] .wb-slide').forEach((slide,i)=>{
  add(slide.querySelector('.wb-gallery-image'),'Edit gallery photo '+(i+1),'gallery',i);
 });
};
})();
