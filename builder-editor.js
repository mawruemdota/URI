/* URI wedding editor: content, features, design, photos and publishing panels. */
(function(){
'use strict';
const U=window.URIBuilder;
let panel='content',viewport='desktop',dragging='';
const T=v=>esc(v==null?'':String(v));
const LABELS={content:'Content',features:'Features',design:'Design',photos:'Photos',music:'Music',review:'Review',publish:'Publish'};
function event(){let e=current();return e&&e.type==='Wedding'?U.model(e):null}
function rerender(opts={}){
  const y=typeof window.scrollY==='number'?window.scrollY:0;
  eventPage();
  setTimeout(()=>{
    if(opts.scrollTop){
      const editor=document.querySelector('.wb-editor');
      if(editor&&editor.scrollIntoView)editor.scrollIntoView({block:'start'});
      return;
    }
    if(opts.focusId){
      const row=document.querySelector('[data-feature-id="'+opts.focusId+'"]');
      const control=row&&typeof row.querySelector==='function'?row.querySelector(opts.checkbox?'input[type="checkbox"],[data-feature-add]':'[data-move-dir="'+opts.delta+'"]'):null;
      if(control&&control.focus)control.focus({preventScroll:true});
    }
    if(window.scrollTo)window.scrollTo(0,y);
  },0);
}
window.uriBPanel=p=>{if(LABELS[p]){if(panel!==p&&window.uriPhotoClose)window.uriPhotoClose(true);panel=p;rerender({scrollTop:true})}};
function fitLivePreview(){
  if(window.uriPhotoDecoratePreview)window.uriPhotoDecoratePreview();
  if(window.uriBDecorateSections)window.uriBDecorateSections();
  const surface=document.getElementById('wbPreviewSurface');
  const stage=document.getElementById('wbPreviewStage');
  const preview=document.getElementById('wbLivePreview');
  if(!surface||!stage||!preview||!surface.clientWidth)return;
  const designWidth=viewport==='mobile'?390:1024;
  const innerWidth=Math.max(0,surface.clientWidth-32);
  const scale=Math.min(1,innerWidth/designWidth);
  preview.style.width=designWidth+'px';
  preview.style.maxWidth='none';
  preview.style.transformOrigin='top left';
  preview.style.transform='scale('+scale+')';
  stage.style.width=(designWidth*scale)+'px';
  stage.style.height=Math.ceil(preview.scrollHeight*scale)+'px';
  stage.style.margin='0 auto';
  const note=document.getElementById('wbPreviewScale');
  if(note)note.textContent=viewport==='mobile'?'390px mobile layout · '+Math.round(scale*100)+'% scale':'1024px desktop layout · '+Math.round(scale*100)+'% scale';
}
window.uriBPreviewFit=fitLivePreview;
function scheduleFit(){
  setTimeout(()=>{
    fitLivePreview();
    const preview=document.getElementById('wbLivePreview');
    if(preview&&preview.querySelectorAll){
      preview.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',fitLivePreview,{once:true})});
    }
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitLivePreview).catch(()=>{});
  },0);
}
if(window.addEventListener)window.addEventListener('resize',scheduleFit);
window.uriBViewport=v=>{
  viewport=v==='mobile'?'mobile':'desktop';
  let surface=document.getElementById('wbPreviewSurface');
  if(surface)surface.dataset.viewport=viewport;
  document.querySelectorAll('[data-viewport-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.viewportChoice===viewport)));
  scheduleFit();
};
function commitEdit(change,undo){
 change();
 if(U.persist())return true;
 undo();
 const status=document.getElementById('wbSaveState');
 if(status)status.textContent='Save failed. Free up browser storage.';
 U.refresh();
 return false;
}
function restoreField(key,value){
 const node=document.querySelector('[data-uri-field="'+key+'"] input,[data-uri-field="'+key+'"] textarea');
 if(node)node.value=value==null?'':String(value);
}
window.uriBSet=(key,value)=>{
 const e=event();
 if(!e||!['name1','name2','title','date','time','venue','address','deadline','message'].includes(key))return;
 const old=e[key];
 if(!commitEdit(()=>{e[key]=value},()=>{e[key]=old})){restoreField(key,old);return}
 U.refresh();updateReadiness(e);
};
window.uriBConfig=(key,value)=>{
 const e=event();
 if(!e||!['timeline','dress','dressColors','gifts','registryUrl'].includes(key))return;
 const had=Object.hasOwn(e.featureConfig,key),old=e.featureConfig[key];
 if(!commitEdit(()=>{e.featureConfig[key]=value},()=>{if(had)e.featureConfig[key]=old;else delete e.featureConfig[key]})){
   restoreField(key,old);return;
 }
 U.refresh();
};
window.uriBToggle=(id,value)=>{
 const e=event();if(!e)return;
 if(U.customItem(e,id)){window.uriCustomToggle?.(id,value);return}
 if(!U.ids.includes(id))return;
 const had=Object.hasOwn(e.featureConfig,id),old=e.featureConfig[id];
 if(commitEdit(()=>{e.featureConfig[id]=!!value},()=>{if(had)e.featureConfig[id]=old;else delete e.featureConfig[id]}))
   rerender({focusId:id,checkbox:true});
 else rerender({focusId:id,checkbox:true});
};
window.uriBMove=(id,delta)=>{
 const e=event();if(!e)return;
 const visible=e.featureOrder.filter(key=>U.enabled(e,key));
 const position=visible.indexOf(id),neighbor=visible[position+delta];
 if(position<0||!neighbor)return;
 const i=e.featureOrder.indexOf(id),j=e.featureOrder.indexOf(neighbor);
 const old=e.featureOrder.slice();
 commitEdit(()=>{[e.featureOrder[i],e.featureOrder[j]]=[e.featureOrder[j],e.featureOrder[i]]},()=>{e.featureOrder=old});
 rerender({focusId:id,delta});
};
window.uriBDragStart=(ev,id)=>{
 dragging=id;if(ev.dataTransfer){ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',id)}
};
window.uriBDrop=(ev,id)=>{
 ev.preventDefault();const e=event(),from=dragging;dragging='';
 if(!e||!from||from===id)return;
 const i=e.featureOrder.indexOf(from),j=e.featureOrder.indexOf(id);
 if(i<0||j<0)return;
 const old=e.featureOrder.slice();
 const done=commitEdit(()=>{e.featureOrder.splice(i,1);e.featureOrder.splice(j,0,from)},()=>{e.featureOrder=old});
 rerender({focusId:done?from:id,checkbox:true});
};
window.uriBVariant=(id,value)=>{
 const e=event(),f=U.features.find(x=>x.id===id);
 if(!e||!f||!f.variants.some(a=>a[0]===value))return;
 const old={...(e.layoutByTemplate[e.template]||{})},template=e.template;
 if(commitEdit(()=>{e.layoutByTemplate[template]||={};e.layoutByTemplate[template][id]=value},()=>{e.layoutByTemplate[template]=old}))U.refresh();
};
window.uriBTemplate=value=>{
 const e=event();if(!e)return;
 if(!U.presets[value]){window.uriTemplateStudioApply?.(value);return}
 const old=e.template;
 if(commitEdit(()=>{e.template=value},()=>{e.template=old}))rerender();
 else rerender();
};
window.uriBDesign=(key,value)=>{
 const e=event();if(!e)return;
 const base=U.presets[U.baseTemplate(e)];if(!Object.hasOwn(base,key))return;
 if(['bg','ink','accent'].includes(key)&&!/^#[0-9a-fA-F]{6}$/.test(value))return;
 if(['body','heading'].includes(key)&&!U.fonts[value])return;
 if(key==='spacing'&&!['compact','balanced','airy'].includes(value))return;
 const template=e.template,had=Object.hasOwn(e.designByTemplate,template),old={...(e.designByTemplate[template]||{})};
 if(commitEdit(()=>{e.designByTemplate[template]||={};e.designByTemplate[template][key]=value},
 ()=>{if(had)e.designByTemplate[template]=old;else delete e.designByTemplate[template]}))U.refresh();
};
window.uriBResetDesign=()=>{
 const e=event();if(!e)return;
 const template=e.template,had=Object.hasOwn(e.designByTemplate,template),old=e.designByTemplate[template]?{...e.designByTemplate[template]}:undefined;
 if(commitEdit(()=>{delete e.designByTemplate[template]},()=>{if(had)e.designByTemplate[template]=old}))rerender();
};
function readinessIssues(e){const issues=[];if(!(e.name1||'').trim()||!(e.name2||'').trim())issues.push('Add both partners’ names');if(!e.date)issues.push('Choose the wedding date');else{const d=new Date(),today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(e.date<today)issues.push('Choose a current or future wedding date')}if(!e.time)issues.push('Add the start time');if(!(e.venue||'').trim())issues.push('Add the wedding venue');if(e.deadline&&e.date&&e.deadline>e.date)issues.push('Set the RSVP deadline on or before the wedding date');return issues}
function readinessMarkup(e){if(window.URIReadiness)return window.URIReadiness.summary(e);const issues=readinessIssues(e);return issues.length?'<div class="wb-readiness wb-readiness-attention"><strong>'+issues.length+' detail'+(issues.length===1?'':'s')+' to review</strong><span>'+issues.map(x=>T(x)).join(' · ')+'</span>'+(panel!=='content'?'<button type="button" class="btn small" onclick="uriBPanel(\'content\')">Edit details</button>':'')+'</div>':'<div class="wb-readiness wb-readiness-ready"><strong>Details complete</strong><span>Preview before publishing.</span></div>'}
function updateReadiness(e){let node=document.getElementById('wbReadiness');if(node)node.innerHTML=readinessMarkup(e)}
window.uriBuilderUpdateReadiness=updateReadiness;
function field(e,key,label,type='text'){return '<label class="wb-field" data-uri-field="'+key+'"><span>'+label+'</span><input type="'+type+'" value="'+T(e[key]||'')+'" oninput="uriBSet(\''+key+'\',this.value)"></label>'}
function area(e,key,label){return '<label class="wb-field" data-uri-field="'+key+'"><span>'+label+'</span><textarea rows="3" oninput="uriBSet(\''+key+'\',this.value)">'+T(e[key]||'')+'</textarea></label>'}
function config(e,key,label,fallback,rows=3){return '<label class="wb-field" data-uri-field="'+key+'"><span>'+label+'</span><textarea rows="'+rows+'" oninput="uriBConfig(\''+key+'\',this.value)">'+T(e.featureConfig[key]??fallback)+'</textarea></label>'}
function content(e){
 return '<h3>Wedding details</h3>'
 +'<div class="wb-fieldgrid">'+field(e,'name1','First partner')+field(e,'name2','Second partner')+field(e,'title','Dashboard title (optional)')+field(e,'deadline','RSVP deadline','date')+'</div>'
 +area(e,'message','Our Story')
 +(window.URIWeddingDetails?window.URIWeddingDetails.editor(e):'<div class="wb-fieldgrid">'+field(e,'date','Wedding date','date')+field(e,'time','Start time','time')+field(e,'venue','Venue')+field(e,'address','Address')+'</div>')
 +'<details class="wb-extra-details"><summary>Dress code and gifts</summary>'
 +config(e,'dress','Dress code','Formal attire · Earth tones and neutrals')
 +config(e,'dressColors','Dress code colors (hex, comma-separated)','#B5A48B,#D4C5B3,#667C68,#A57C74',2)
 +config(e,'gifts','Gift message','Your presence is our greatest gift.')
 +'<label class="wb-field" data-uri-field="registryUrl"><span>Registry link (optional)</span><input type="url" placeholder="https://..." value="'+T(e.featureConfig.registryUrl||'')+'" oninput="uriBConfig(\'registryUrl\',this.value)"></label></details>';
}
function features(e){
 const active=e.featureOrder.filter(id=>U.enabled(e,id));
 const available=e.featureOrder.filter(id=>!U.enabled(e,id));
 const actual=U.compose(e),layoutById=Object.fromEntries(actual.map(x=>[x.id,x]));
 const notes={hero:'Cover photograph and names',story:'Your message',gallery:e.photos.length?'Wedding photographs':'Add photos in Photos to show this section',
  countdown:'Time until the ceremony',details:'Ceremony and reception information',
  timeline:'Order of activities',dress:'Attire and colors',gifts:'Gift information',rsvp:'Attendance information'};
 const rows=active.map((id,i)=>{
  const custom=U.customItem(e,id);
  if(custom){
    return '<div class="wb-feature-item wb-custom-feature-item" data-feature-id="'+T(id)+'" draggable="true" ondragstart="uriBDragStart(event,\''+id+'\')" ondragover="event.preventDefault()" ondrop="uriBDrop(event,\''+id+'\')">'
     +'<div class="wb-feature-top"><label class="wb-feature-check"><input type="checkbox" checked onchange="uriCustomToggle(\''+id+'\',this.checked)" aria-label="Show '+T(custom.title)+'"><span><strong>'+T(custom.title||'Custom section')+'</strong></span></label>'
     +'<div class="wb-movers"><button type="button" data-move-dir="-1" aria-label="Move '+T(custom.title)+' up" '+(i===0?'disabled':'')+' onclick="uriBMove(\''+id+'\',-1)">Up</button>'
     +'<button type="button" data-move-dir="1" aria-label="Move '+T(custom.title)+' down" '+(i===active.length-1?'disabled':'')+' onclick="uriBMove(\''+id+'\',1)">Down</button></div></div>'
     +(window.URICustomSections?window.URICustomSections.editorItem(custom):'')+'</div>';
  }
  const f=U.features.find(x=>x.id===id);
  const layout=layoutById[id];
  const info=layout?(layout.width==='half'?(layout.pair==='first'?'Paired with next section':'Paired with previous section'):'Full width in this design'):'Appears when content is added';
  return '<div class="wb-feature-item" data-feature-id="'+id+'" draggable="true" ondragstart="uriBDragStart(event,\''+id+'\')" ondragover="event.preventDefault()" ondrop="uriBDrop(event,\''+id+'\')">'
   +'<div class="wb-feature-top"><span class="wb-drag" title="Drag to reorder">⠿</span>'
   +'<label class="wb-feature-check"><input type="checkbox" checked aria-label="Show '+T(f.name)+'" onchange="uriBToggle(\''+id+'\',this.checked)">'
   +'<span><strong>'+T(f.name)+'</strong><small>'+T(notes[id])+'</small></span></label>'
   +'<div class="wb-movers"><button type="button" data-move-dir="-1" aria-label="Move '+T(f.name)+' up" '+(i===0?'disabled':'')+' onclick="uriBMove(\''+id+'\',-1)">Up</button>'
   +'<button type="button" data-move-dir="1" aria-label="Move '+T(f.name)+' down" '+(i===active.length-1?'disabled':'')+' onclick="uriBMove(\''+id+'\',1)">Down</button></div></div>'
   +'<div class="wb-feature-options"><label class="wb-field wb-variant"><span>Appearance</span><select onchange="uriBVariant(\''+id+'\',this.value)">'
   +f.variants.map(([key,name])=>'<option value="'+key+'" '+(U.variant(e,id)===key?'selected':'')+'>'+T(name)+'</option>').join('')
   +'</select></label><small class="wb-feature-layout-note">'+info+'</small></div></div>';
 }).join('');
 const add=available.filter(id=>U.ids.includes(id)).length?'<div class="wb-available-group"><h4>Add a section</h4><div class="wb-available-list">'
  +available.filter(id=>U.ids.includes(id)).map(id=>{
   const f=U.features.find(x=>x.id===id);
   return '<div class="wb-available-item" data-feature-id="'+id+'"><div><strong>'+T(f.name)+'</strong><small>'+T(notes[id])+'</small></div>'
    +'<button type="button" class="btn small" data-feature-add onclick="uriBToggle(\''+id+'\',true)">Add</button></div>';
  }).join('')+'</div></div>':'';
 return '<h3>Sections</h3><div class="wb-feature-overview">'+actual.length+' shown in this design'+(active.length!==actual.length?' · '+(active.length-actual.length)+' awaiting content':'')+'</div>'
  +'<div class="wb-feature-list">'+(rows||'<p class="wb-feature-empty">No sections selected. Add one below.</p>')+'</div>'+add+(window.URICustomSections?window.URICustomSections.catalog(e):'');
}
function design(e){let d=U.design(e),options=(key,name,choices)=>'<label class="wb-field"><span>'+name+'</span><select onchange="uriBDesign(\''+key+'\',this.value)">'+choices.map(([id,label])=>'<option value="'+id+'" '+(d[key]===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label>';return '<h3>Design</h3><div class="wb-template-choices">'+(window.URITemplateStudio?window.URITemplateStudio.list(e):TEMPLATES).map(t=>'<button type="button" aria-pressed="'+(e.template===t.id)+'" class="wb-template-pick '+(e.template===t.id?'selected':'')+'" onclick="uriBTemplate(\''+t.id+'\')">'+(window.URIBuilder?'<div class="template-preview uri-ref-thumb">'+window.URIBuilder.cover({...e,template:t.id,templateRecipes:[...(e.templateRecipes||[]),...(window.URITemplateStudio?.library()||[])]})+'</div>':templateThumb(t))+'<strong>'+t.name+'</strong><small class="wb-template-caption">'+(t.id===e.template?'Current template':'Switch without losing content')+'</small></button>').join('')+'</div><div class="wb-colors">'+[['bg','Background'],['ink','Text'],['accent','Accent']].map(([key,label])=>'<label><input type="color" value="'+d[key]+'" oninput="uriBDesign(\''+key+'\',this.value)"><span>'+label+'</span></label>').join('')+'</div>'+options('heading','Heading font',[['barlow','Barlow Condensed'],['cormorant','Cormorant Garamond'],['allura','Allura Script'],['playfair','Playfair Display'],['montserrat','Montserrat'],['dm','DM Sans']])+options('body','Body font',[['montserrat','Montserrat'],['dm','DM Sans'],['cormorant','Cormorant Garamond'],['playfair','Playfair Display'],['barlow','Barlow Condensed']])+options('spacing','Section spacing',[['compact','Compact'],['balanced','Balanced'],['airy','Airy']])+'<button type="button" class="btn small" onclick="uriBResetDesign()">Reset template style</button>'+(window.URITemplateStudio?window.URITemplateStudio.studio(e):'')+(window.URIBackground?window.URIBackground.manager(e):'')+(window.URIAnimation?window.URIAnimation.manager(e):'')}
function photos(e){return window.uriBuilderPhotosPanel?window.uriBuilderPhotosPanel(e):'<p>The photo manager is loading.</p>'}
function publishing(e){return '<h3>Publishing</h3>'+(window.URICloud?window.URICloud.panel(e):'<div class="banner notice">Cloud publishing is not configured. This event is saved in your browser.</div>')+'<div class="banner notice">Guest lists are not included in public invitations. Cross-device RSVP collection requires a separately secured guest system.</div>'}
const BUILDER_STEPS=['content','features','design','photos','music','review','publish'];
window.uriBNext=function(delta){let i=BUILDER_STEPS.indexOf(panel),next=Math.min(BUILDER_STEPS.length-1,Math.max(0,i+delta));window.uriBPanel(BUILDER_STEPS[next]);let h=document.querySelector('.wb-editor');if(h&&h.scrollIntoView)h.scrollIntoView({behavior:'smooth',block:'start'})};
window.uriBuilderEditor=function(e){
  U.model(e);
  scheduleFit();
  let active=({content,features,design,photos,music:e=>window.URIMusic?window.URIMusic.manager(e):'<p>Music is unavailable.</p>',review:e=>window.URIReadiness?window.URIReadiness.panel(e):readinessMarkup(e),publish:publishing}[panel]||content)(e);
  let index=BUILDER_STEPS.indexOf(panel),next=BUILDER_STEPS[index+1],previous=BUILDER_STEPS[index-1];
  let nextButton=next?'<button type="button" class="btn primary" onclick="uriBNext(1)">Next: '+LABELS[next]+' </button>':'<button type="button" class="btn primary" onclick="uriFlowOpenPreview(\'event\')">Preview full website </button>';
  return '<div class="wb-editor"><div class="wb-builder-heading"><div><h2>Edit invitation</h2></div><div class="wb-builder-status"><span class="chip">'+(e.cloudPublished?'Published snapshot':'Draft')+'</span><span class="wb-save-label" id="wbSaveState" role="status">'+(U.lastSaveFailed?'Changes not saved':'Saved on this device')+'</span><button type="button" class="btn small wb-preview-shortcut" onclick="uriFlowOpenPreview(\'event\')">Preview website </button></div></div>'
    +'<div id="wbReadiness" class="wb-readiness-wrap">'+(panel==='review'?'':readinessMarkup(e))+'</div>'
    +''
    +'<nav class="wb-tabs" aria-label="Wedding builder tabs">'+Object.entries(LABELS).map(([key,label],i)=>'<button type="button" class="'+(panel===key?'active':'')+'" aria-current="'+(panel===key?'page':'false')+'" onclick="uriBPanel(\''+key+'\')">'+label+'</button>').join('')+'</nav>'
    +'<div class="wb-editor-grid"><div class="wb-editor-controls">'+active+'<div class="wb-builder-footer"><span>Step '+(index+1)+' of '+BUILDER_STEPS.length+'</span><div class="wb-builder-footer-actions">'+(previous?'<button type="button" class="btn" onclick="uriBNext(-1)"> '+LABELS[previous]+'</button>':'')+nextButton+'</div></div></div>'
    +'<div class="wb-editor-preview"><div class="wb-preview-toolbar"><strong>Preview</strong><div><button type="button" class="uri-preview-play" onclick="uriAnimationReplay()" aria-label="Play invitation animations">Play animation</button><button type="button" data-viewport-choice="desktop" aria-pressed="'+(viewport==='desktop')+'" onclick="uriBViewport(\'desktop\')">Desktop</button><button type="button" data-viewport-choice="mobile" aria-pressed="'+(viewport==='mobile')+'" onclick="uriBViewport(\'mobile\')">Mobile</button></div></div>'
    +'<div id="wbPreviewSurface" class="wb-preview-surface" data-viewport="'+viewport+'"><div id="wbPreviewStage" class="wb-preview-stage"><div id="wbLivePreview">'+U.render(e)+'</div></div></div>'
    +'<div class="wb-preview-scale" id="wbPreviewScale" aria-live="off">'+(viewport==='mobile'?'390px mobile layout':'1024px desktop layout')+'</div>'
    +'<div class="wb-preview-actions"><button type="button" class="btn" onclick="uriFlowOpenPreview(\'event\')">Full-page preview </button></div></div></div>'
    +'<div class="wb-mobile-actions"><button type="button" class="btn" onclick="uriFlowOpenPreview(\'event\')">Preview website </button></div></div>'
};

})();
