/* URI Custom Sections — owner-authored content, themed by each wedding template.
   Content is escaped; arbitrary HTML / scripts / iframe URLs are never accepted. */
(function(){
'use strict';
const U=window.URIBuilder;
const T=value=>esc(value==null?'':String(value));
const types=[
 ['text','Text'],['image','Image'],['video','Video'],
 ['faq','FAQ'],['map','Location'],['button','Button']
];
const kinds=new Set(types.map(x=>x[0]));
const unique=prefix=>prefix+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const event=()=>{const e=current();return e?.type==='Wedding'?U.model(e):null};
const find=(e,id)=>U.customItem(e,id);
const safeLink=value=>{
 try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.toString():''}catch(_){return ''}
};
const videoEmbed=url=>{
 const safe=safeLink(url);if(!safe)return '';
 const u=new URL(safe),host=u.hostname.toLowerCase();
 let id='';
 if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host)){
  if(u.pathname==='/watch')id=u.searchParams.get('v')||'';
  else if(u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/embed/'))id=u.pathname.split('/')[2]||'';
 }else if(['youtu.be','www.youtu.be'].includes(host))id=u.pathname.replace('/','');
 if(/^[a-zA-Z0-9_-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){
  const parts=u.pathname.split('/').filter(Boolean),last=parts.at(-1);
  if(/^[0-9]{6,14}$/.test(last||''))return 'https://player.vimeo.com/video/'+last;
 }
 return '';
};
function normalize(section){
 return {
  id:String(section.id||''),type:kinds.has(section.type)?section.type:'text',
  enabled:section.enabled!==false,
  layout:section.layout==='wide'?'wide':'auto',
  title:String(section.title||'').slice(0,110),
  body:String(section.body||'').slice(0,2500),
  url:String(section.url||'').slice(0,600),
  label:String(section.label||'').slice(0,70),
  alt:String(section.alt||'').slice(0,180),
  src:String(section.src||''),
  items:Array.isArray(section.items)?section.items.filter(x=>x&&typeof x==='object').slice(0,12).map(x=>({q:String(x.q||'').slice(0,180),a:String(x.a||'').slice(0,700)})):[]
 };
}
function defaults(type){
 const names={text:'A Note',image:'Our Moment',video:'Our Film',faq:'Questions',map:'Getting There',button:'More Information'};
 const section={id:unique('cs-'),type,enabled:true,layout:['image','video'].includes(type)?'wide':'auto',
  title:names[type],body:'',url:'',label:'View details',src:'',alt:'',items:[]};
 if(type==='faq')section.items=[{q:'What time should we arrive?',a:''}];
 return section;
}
const miniButton=(label,fn)=>'<button type="button" class="btn small" onclick="'+fn+'">'+label+'</button>';
function renderSection(e,section){
 const item=normalize(section),base=U.baseTemplate(e),className='wb-custom wb-custom-'+item.type+' wb-custom-'+base;
 const head=item.title?'<h2>'+T(item.title)+'</h2>':'';
 let contents='';
 if(item.type==='text')contents='<div class="wb-custom-copy">'+T(item.body).replace(/\n/g,'<br>')+'</div>';
 if(item.type==='image')contents=(item.src?U.picture({src:item.src,alt:item.alt},'wb-custom-image'):'<div class="wb-custom-empty">Choose an image</div>')+(item.body?'<p class="wb-custom-caption">'+T(item.body)+'</p>':'');
 if(item.type==='video'){
  const src=videoEmbed(item.url);
  contents=src?'<div class="wb-custom-video-frame"><iframe loading="lazy" title="'+T(item.title||'Wedding video')+'" src="'+T(src)+'" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media;picture-in-picture;fullscreen" allowfullscreen></iframe></div>':
   '<div class="wb-custom-empty">Add a YouTube or Vimeo video URL</div>';
  if(item.body)contents+='<p class="wb-custom-caption">'+T(item.body)+'</p>';
 }
 if(item.type==='faq')contents='<div class="wb-custom-questions">'+item.items.map(row=>'<details class="wb-custom-question"><summary>'+T(row.q||'Question')+'</summary><p>'+T(row.a||'Answer to follow.').replace(/\n/g,'<br>')+'</p></details>').join('')+'</div>';
 if(item.type==='map')contents='<div class="wb-custom-location">'+(item.body?'<p>'+T(item.body).replace(/\n/g,'<br>')+'</p>':'')+(safeLink(item.url)?'<a href="'+T(safeLink(item.url))+'" target="_blank" rel="noopener noreferrer" class="wb-custom-cta">View directions</a>':'')+'</div>';
 if(item.type==='button')contents='<div class="wb-custom-action">'+(item.body?'<p>'+T(item.body)+'</p>':'')+(safeLink(item.url)?'<a href="'+T(safeLink(item.url))+'" target="_blank" rel="noopener noreferrer" class="wb-custom-cta">'+T(item.label||'View details')+'</a>':'')+'</div>';
 return '<section data-feature="'+T(item.id)+'" data-custom-id="'+T(item.id)+'" class="wb-unit '+className+'" data-custom-type="'+T(item.type)+'">'+head+contents+'</section>';
}
function persist(change,rerender=false){
 const e=event();if(!e)return false;
 const previousSections=JSON.stringify(e.customSections),previousOrder=e.featureOrder.slice();
 change(e);
 if(U.persist()){
  if(rerender)eventPage();else U.refresh();
  return true;
 }
 e.customSections=JSON.parse(previousSections);e.featureOrder=previousOrder;eventPage();return false;
}
window.uriCustomAdd=type=>{
 if(!kinds.has(type))return;
 const e=event();if(!e||e.customSections.length>=16)return;
 const item=defaults(type);
 if(persist(e=>{e.customSections.push(item);e.featureOrder.push(item.id)},true)){
  setTimeout(()=>window.uriCustomFocus?.(item.id),0);
 }
};
window.uriCustomFocus=id=>{
 const card=[...document.querySelectorAll?.('[data-custom-editor]')||[]].find(x=>x.dataset.customEditor===id);
 if(card){card.open=true;card.scrollIntoView?.({block:'center',behavior:'smooth'});card.querySelector('input,textarea,select')?.focus?.({preventScroll:true})}
};
window.uriCustomSet=(id,key,value)=>{
 if(!['title','body','url','label','alt','layout'].includes(key))return;
 const e=event(),item=e&&find(e,id);if(!item)return;
 const next=key==='layout'?(value==='wide'?'wide':'auto'):String(value).slice(0,key==='body'?2500:key==='url'?600:key==='alt'?180:110);
 persist(e=>{find(e,id)[key]=next});
};
window.uriCustomToggle=(id,flag)=>{
 if(!find(event()||{},id))return;
 persist(e=>{find(e,id).enabled=!!flag},true);
};
window.uriCustomRemove=id=>{
 if(!find(event()||{},id))return;
 if(!confirm('Delete this custom section and its content? This cannot be undone.'))return;
 persist(e=>{e.customSections=e.customSections.filter(x=>x.id!==id);e.featureOrder=e.featureOrder.filter(x=>x!==id)},true);
};
window.uriCustomDuplicate=id=>{
 const e=event(),item=e&&find(e,id);if(!item||e.customSections.length>=16)return;
 const clone=normalize(item);clone.id=unique('cs-');clone.title=(clone.title+' (Copy)').slice(0,110);
 persist(e=>{
  e.customSections.push(clone);
  const index=e.featureOrder.indexOf(id);
  e.featureOrder.splice(index+1,0,clone.id);
 },true);
};
window.uriCustomFAQAdd=id=>{
 const e=event(),item=e&&find(e,id);if(!item||item.type!=='faq'||item.items.length>=12)return;
 persist(e=>{find(e,id).items.push({q:'New question',a:''})},true);
};
window.uriCustomFAQRemove=(id,index)=>{
 const e=event(),item=e&&find(e,id);if(!item||!item.items[index])return;
 persist(e=>{find(e,id).items.splice(index,1)},true);
};
window.uriCustomFAQSet=(id,index,key,value)=>{
 if(!['q','a'].includes(key))return;
 const e=event(),item=e&&find(e,id);if(!item||!item.items[index])return;
 persist(e=>{find(e,id).items[index][key]=String(value).slice(0,key==='a'?700:180)});
};
window.uriCustomImage=async(ev,id)=>{
 const file=ev.target?.files?.[0],e=event(),item=e&&find(e,id);
 if(!file||!item||item.type!=='image')return;
 const eventId=e.id;
 try{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<1||file.size>10*1024*1024)throw Error('Choose a JPEG, PNG or WebP smaller than 10 MB.');
  const url=URL.createObjectURL(file);
  const compressed=await new Promise((resolve,reject)=>{
   const image=new Image();
   image.onerror=()=>reject(Error('Could not read the image.'));
   image.onload=()=>{
    try{
     const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
     if(!ctx)throw Error('Image conversion is unavailable.');
     const ratio=Math.min(1,1200/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
     canvas.width=Math.max(1,Math.round((image.naturalWidth||image.width)*ratio));
     canvas.height=Math.max(1,Math.round((image.naturalHeight||image.height)*ratio));
     ctx.drawImage(image,0,0,canvas.width,canvas.height);
     resolve(canvas.toDataURL('image/jpeg',.67));
    }catch(err){reject(err)}
   };
   image.src=url;
  }).finally(()=>URL.revokeObjectURL(url));
  if(event()?.id!==eventId||!find(event(),id))return;
  persist(e=>{find(e,id).src=compressed;find(e,id).alt=String(file.name||'Wedding photograph').replace(/\.[^.]+$/,'').slice(0,180)},true);
 }catch(err){alert(err.message||'Unable to upload this image.')}
 finally{if(ev.target)ev.target.value=''}
};
function field(id,key,label,value,tag='input',extra=''){
 const call="uriCustomSet('"+id+"','"+key+"',this.value)";
 if(tag==='textarea')return '<label class="wb-field"><span>'+label+'</span><textarea rows="3" maxlength="2500" oninput="'+call+'">'+T(value)+'</textarea></label>';
 return '<label class="wb-field"><span>'+label+'</span><input type="'+(key==='url'?'url':'text')+'" value="'+T(value)+'" '+extra+' oninput="'+call+'"></label>';
}
function itemForm(item){
 const id=T(item.id);
 let fields=field(id,'title','Heading',item.title,'input','maxlength="110"');
 if(item.type==='text')fields+=field(id,'body','Text',item.body,'textarea');
 if(item.type==='image')fields+='<label class="wb-field"><span>Image</span><input type="file" accept="image/jpeg,image/png,image/webp" onchange="uriCustomImage(event,\''+id+'\')"></label>'+field(id,'alt','Photo description',item.alt)+field(id,'body','Caption',item.body,'textarea');
 if(item.type==='video')fields+=field(id,'url','YouTube or Vimeo URL',item.url)+field(id,'body','Caption',item.body,'textarea');
 if(item.type==='map')fields+=field(id,'body','Address and directions',item.body,'textarea')+field(id,'url','HTTPS maps link',item.url);
 if(item.type==='button')fields+=field(id,'body','Description',item.body,'textarea')+field(id,'label','Button text',item.label)+field(id,'url','HTTPS destination',item.url);
 if(item.type==='faq')fields+='<div class="uri-custom-faq-editor">'+item.items.map((row,i)=>'<div class="uri-custom-faq-row">'+field(id,'noop','Question '+(i+1),row.q).replace("uriCustomSet('"+id+"','noop',this.value)","uriCustomFAQSet('"+id+"',"+i+",'q',this.value)")+
  field(id,'noop','Answer',row.a,'textarea').replace("uriCustomSet('"+id+"','noop',this.value)","uriCustomFAQSet('"+id+"',"+i+",'a',this.value)")+
  miniButton('Remove question',"uriCustomFAQRemove('"+id+"',"+i+")")+'</div>').join('')+'</div>'+miniButton('Add question',"uriCustomFAQAdd('"+id+"')");
 fields+='<label class="wb-field"><span>Section width</span><select onchange="uriCustomSet(\''+id+'\',\'layout\',this.value)"><option value="auto" '+(item.layout!=='wide'?'selected':'')+'>Adapt to template</option><option value="wide" '+(item.layout==='wide'?'selected':'')+'>Full width</option></select></label>';
 return fields;
}
function editorItem(item){
 const type=types.find(x=>x[0]===item.type)?.[1]||'Content',id=T(item.id);
 return '<details class="uri-custom-editor" data-custom-editor="'+id+'"><summary><strong>'+T(item.title||type)+'</strong><span>'+type+'</span></summary>'
 +'<div class="uri-custom-editor-fields">'+itemForm(item)+'</div>'
 +'<div class="uri-custom-editor-actions">'+miniButton('Duplicate',"uriCustomDuplicate('"+id+"')")+miniButton(item.enabled===false?'Show':'Hide',"uriCustomToggle('"+id+"',"+(item.enabled===false?'true':'false')+")")
 +miniButton('Delete',"uriCustomRemove('"+id+"')")+'</div></details>';
}
function catalog(e){
 return '<div class="uri-custom-catalog"><h4>Custom content</h4><div class="uri-custom-types">'
 +types.map(([id,label])=>'<button type="button" onclick="uriCustomAdd(\''+id+'\')" '+(e.customSections.length>=16?'disabled':'')+'>'+label+'</button>').join('')
 +'</div><small>'+e.customSections.length+' / 16 custom sections</small></div>';
}
window.URICustomSections={types,normalize,defaults,renderSection,editorItem,catalog,safeLink,videoEmbed};
U.renderCustom=renderSection;
})();