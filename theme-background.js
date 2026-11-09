/* URI Background Manager 1.0 — image layers are theme-aware and scoped to templates. */
(function(){
'use strict';
const U=window.URIBuilder;if(!U)return;
const escText=v=>typeof esc==='function'?esc(String(v)):String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keys=['mode','source','opacity','shade','surface','blur','tone','position'];
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
const defaults={mode:'color',source:'',opacity:85,shade:35,surface:76,blur:0,tone:'theme',position:'center'};
function safeSource(value){
 const s=String(value||'').trim();
 if(/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(s)&&s.length<650000)return s;
 try{
  const u=new URL(s);
  return u.protocol==='https:'&&!u.username&&!u.password&&s.length<1200?u.href:'';
 }catch(_){return ''}
}
function normalize(raw){
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {
  mode:o.mode==='image'?'image':'color',
  source:safeSource(o.source),
  opacity:Math.round(clamp(o.opacity,0,100,defaults.opacity)),
  shade:Math.round(clamp(o.shade,0,100,defaults.shade)),
  surface:Math.round(clamp(o.surface,30,100,defaults.surface)),
  blur:Math.round(clamp(o.blur,0,14,defaults.blur)),
  tone:['theme','dark','light','accent'].includes(o.tone)?o.tone:'theme',
  position:['center','top','bottom'].includes(o.position)?o.position:'center'
 };
}
function read(e){
 const map=e?.backgroundByTemplate;
 return normalize(map&&typeof map==='object'?map[e.template]:null);
}
const model=U.model;
U.model=function(e){const result=model(e);if(!e.backgroundByTemplate||typeof e.backgroundByTemplate!=='object'||Array.isArray(e.backgroundByTemplate))e.backgroundByTemplate={};return result};
const render=U.render;
U.render=function(e){
 const html=render(e),b=read(e);
 if(b.mode!=='image'||!b.source)return html;
 const tone={theme:'var(--wb-bg)',dark:'#101319',light:'#ffffff',accent:'var(--wb-accent)'}[b.tone];
 const at=b.position==='top'?'center top':b.position==='bottom'?'center bottom':'center center';
 const layer='<div class="uri-theme-backdrop" aria-hidden="true" style="--uri-image-opacity:'+(b.opacity/100)+';--uri-shade-opacity:'+(b.shade/100)+';--uri-bg-blur:'+b.blur+'px;--uri-shade-color:'+tone+'"><img loading="lazy" src="'+escText(b.source)+'" alt="" style="object-position:'+at+'"><span class="uri-theme-shade"></span></div>';
 return html.replace('<article class="uri-builder-site','<article data-uri-background="image" class="uri-builder-site')
   .replace(' style="',' style="--uri-bg-surface-opacity:'+b.surface+'%;')
   .replace('<div class="wb-flow">',layer+'<div class="wb-flow">');
};
const payload=U.payload;
U.payload=e=>({...payload(e),backgroundByTemplate:JSON.parse(JSON.stringify(e.backgroundByTemplate||{}))});
function update(key,value){
 const e=current();if(!e||e.type!=='Wedding'||!keys.includes(key))return false;
 U.model(e);
 const old=JSON.stringify(e.backgroundByTemplate);
 const b=read(e);
 b[key]=value;
 if(key==='source')b.mode=value?'image':'color';
 e.backgroundByTemplate[e.template]=normalize(b);
 if(!U.persist()){
  e.backgroundByTemplate=JSON.parse(old);
  eventPage();
  return false;
 }
 U.refresh?.();
 return true;
}
window.uriBgSet=(key,v)=>{
 if(key==='source'&&!safeSource(v)&&String(v).trim()){alert('Use a direct HTTPS image URL or upload a JPEG, PNG, or WebP image.');return}
 if(!update(key,v))return;
 const el=document.getElementById('uriBg'+key[0].toUpperCase()+key.slice(1));
 if(el&&['opacity','shade','surface','blur'].includes(key))el.textContent=String(v)+(key==='blur'?' px':'%');
 if(key==='mode'||key==='position'||key==='tone'||key==='source')eventPage();
};
window.uriBgRemove=()=>{if(update('source',''))eventPage()};
async function compress(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024||file.size<1)throw Error('Choose a JPEG, PNG or WebP image under 12 MB.');
 return new Promise((resolve,reject)=>{
  if(!URL.createObjectURL||!window.Image)return reject(Error('Image upload is unavailable here.'));
  const uri=URL.createObjectURL(file),img=new Image();
  img.onerror=()=>{URL.revokeObjectURL(uri);reject(Error('Unable to open this image.'))};
  img.onload=()=>{
   try{
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    let result='',size=1400;
    for(let i=0;i<4;i++){
     const scale=Math.min(1,size/Math.max(img.width,img.height));
     canvas.width=Math.max(1,Math.round(img.width*scale));
     canvas.height=Math.max(1,Math.round(img.height*scale));
     ctx.drawImage(img,0,0,canvas.width,canvas.height);
     for(const quality of [.72,.6,.48]){
      result=canvas.toDataURL('image/jpeg',quality);
      if(result.length<=420000)break;
     }
     if(result.length<=420000)break;
     size=Math.round(size*.75);
    }
    URL.revokeObjectURL(uri);
    if(result.length>640000)throw Error('Please choose a simpler or smaller background image.');
    resolve(result);
   }catch(err){URL.revokeObjectURL(uri);reject(err)}
  };
  img.src=uri;
 });
}
window.uriBgUpload=async ev=>{
 const file=ev.target?.files?.[0],e=current(),template=e?.template,id=e?.id;
 if(!file||!e||e.type!=='Wedding')return;
 const status=document.getElementById('uriBgStatus');if(status)status.textContent='Processing image…';
 try{
  const value=await compress(file);
  if(current()?.id!==id||current()?.template!==template)return;
  if(update('source',value))eventPage();
 }catch(err){if(status)status.textContent=err.message||'Unable to load image.'}
 finally{if(ev.target)ev.target.value=''}
};
function manager(e){
 const b=read(e),source=b.source&&b.source.startsWith('data:')?'Uploaded background image':b.source;
 const num=(key,label,min,max,step=1)=>'<label class="uri-bg-field"><span>'+label+' <output id="uriBg'+key[0].toUpperCase()+key.slice(1)+'">'+b[key]+(key==='blur'?' px':'%')+'</output></span><input aria-label="'+label+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+b[key]+'" oninput="uriBgSet(\''+key+'\',this.value)"></label>';
 const select=(key,label,values)=>'<label class="uri-bg-field"><span>'+label+'</span><select onchange="uriBgSet(\''+key+'\',this.value)">'+values.map(([v,l])=>'<option value="'+v+'" '+(b[key]===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label>';
 return '<section class="uri-background-manager" aria-label="Theme background settings"><h4>Page background</h4><p>Use a solid theme color or layer an image underneath your invitation.</p>'
  +'<div class="uri-bg-modes"><label><input type="radio" name="uri-bg-mode" value="color" '+(b.mode==='color'?'checked':'')+' onchange="uriBgSet(\'mode\',\'color\')"> Theme color</label><label><input type="radio" name="uri-bg-mode" value="image" '+(b.mode==='image'?'checked':'')+' onchange="uriBgSet(\'mode\',\'image\')"> Background image</label></div>'
  +(b.mode==='image'?'<div class="uri-bg-controls"><div class="uri-bg-image-row"><label class="uri-bg-upload">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onchange="uriBgUpload(event)" aria-label="Upload page background image"></label>'
   +(b.source?'<button type="button" class="btn small" onclick="uriBgRemove()">Remove image</button>':'')+'</div><label class="uri-bg-field"><span>Or use an HTTPS image URL</span><input type="url" placeholder="https://example.com/background.jpg" value="'+(b.source.startsWith('data:')?'':escText(b.source))+'" onchange="uriBgSet(\'source\',this.value)"></label>'
   +(b.source?'<div class="uri-bg-current"><img src="'+escText(b.source)+'" alt="Selected theme background"> '+(b.source.startsWith('data:')?'Image stored with this local invitation':'External image URL')+'</div>':'<p class="uri-bg-empty">Choose an image to enable the new background.</p>')
   +'<div class="uri-bg-sliders">'+num('opacity','Image opacity',0,100)+num('shade','Shading strength',0,100)+num('surface','Section surface opacity',30,100)+num('blur','Image blur',0,14)+'</div>'
   +'<div class="uri-bg-sliders">'+select('tone','Shading color',[['theme','Match selected theme'],['dark','Dark'],['light','Light'],['accent','Theme accent']])+select('position','Image position',[['center','Center'],['top','Top'],['bottom','Bottom']])+'</div></div>':'<p class="uri-bg-hint">The existing theme background color remains active.</p>')
  +'<p id="uriBgStatus" class="uri-bg-status" role="status" aria-live="polite"></p><small>These settings belong to the selected template. Changing templates keeps each design’s background.</small></section>';
}
window.URIBackground={normalize,read,safeSource,manager,compress};
})();