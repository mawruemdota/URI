/* URI Visual Editing 2.0 — controls exist only inside the owner editor preview. */
(function(){
'use strict';
const map={
 hero:['content','name1'],story:['content','message'],
 gallery:['photos','gallery'],countdown:['content','ceremony-date'],
 details:['content','ceremony-venue'],timeline:['content','timeline'],
 dress:['content','dress'],gifts:['content','gifts'],rsvp:['guests','guests']
};
function focusTarget(target,index){
 let el;
 if(target==='timeline') {
  const fold=document.querySelector('.wb-timeline-fold');
  if(fold)fold.open=true;
  el=document.querySelectorAll('.wb-schedule-editor-row input')[Math.max(0,index||0)*3]||
    document.querySelector('.wb-schedule-editor-row input');
 } else if(target==='gallery'||target==='cover'){
  el=document.querySelector(target==='cover'?'.wb-photo-choose input[type=file]':'.wb-photo-add input[type=file]');
 } else if(target==='dress'||target==='gifts'){
  const d=document.querySelector('.wb-extra-details');if(d)d.open=true;
  el=document.querySelector('.wb-extra-details input,.wb-extra-details textarea');
 } else if(target==='custom')return;
 else {
  el=document.querySelector('[data-uri-field="'+target+'"] input,[data-uri-field="'+target+'"] textarea,[data-uri-field="'+target+'"] select');
 }
 if(!el&&String(target).startsWith('reception-'))el=document.querySelector('.wb-reception-toggle input');
 if(el){const fold=el.closest?.('details');if(fold)fold.open=true;el.scrollIntoView?.({block:'center',behavior:'smooth'});el.focus?.({preventScroll:true})}
}
window.uriBEditTarget=(panel,target,index)=>{
 if(panel==='guests'){
  tab='guests';eventPage();document.querySelector('.uri-guests')?.scrollIntoView?.({block:'start'});return;
 }
 tab='edit';
 const selected=['photos','features','design'].includes(panel)?panel:'content';
 if(typeof window.uriBPanel==='function')window.uriBPanel(selected);
 else eventPage();
 setTimeout(()=>{
  if(selected==='features'&&target&&String(target).startsWith('cs-'))window.uriCustomFocus?.(target);
  else focusTarget(target||'',index);
 },0);
};
const sectionId=section=>section?.getAttribute?.('data-feature')||section?.dataset?.feature||'';
window.uriBVisualAction=(action,id)=>{
 const e=current();if(!e||e.type!=='Wedding'||!window.URIBuilder)return;
 const U=window.URIBuilder,custom=U.customItem(e,id),route=map[id];
 if(action==='edit'){if(custom)window.uriBEditTarget('features',id);else if(route)window.uriBEditTarget(route[0],route[1]);return}
 if(action==='move-up'){window.uriBMove?.(id,-1);return}
 if(action==='move-down'){window.uriBMove?.(id,1);return}
 if(action==='hide'){if(custom)window.uriCustomToggle?.(id,false);else window.uriBToggle?.(id,false);return}
 if(action==='duplicate'&&custom){window.uriCustomDuplicate?.(id);return}
};
function tool(label,action,id,disabled=false){
 const button=document.createElement('button');
 button.type='button';button.textContent=label;
 button.disabled=disabled;
 button.setAttribute('aria-label',label+' '+(id.startsWith('cs-')?'custom section':id));
 button.dataset.visualAction=action;
 button.addEventListener('click',ev=>{
  ev.preventDefault();ev.stopPropagation();
  window.uriBVisualAction(action,id);
 });
 return button;
}
function decorateSection(section,index,visible){
 const id=sectionId(section);if(!id||section.querySelector(':scope > .wb-visual-toolbar'))return;
 const U=window.URIBuilder,e=current(),custom=U?.customItem(e,id);
 const bar=document.createElement('div');bar.className='wb-visual-toolbar';
 bar.setAttribute('role','group');bar.setAttribute('aria-label','Section actions');
 bar.appendChild(tool('Edit','edit',id));
 bar.appendChild(tool('Up','move-up',id,index===0));
 bar.appendChild(tool('Down','move-down',id,index===visible.length-1));
 if(custom)bar.appendChild(tool('Duplicate','duplicate',id));
 bar.appendChild(tool('Hide','hide',id));
 section.appendChild(bar);
 section.classList.add('wb-section-editable');
 section.addEventListener('click',ev=>{
  if(ev.target.closest('button,a,input,select,textarea,iframe,video,label,details,summary,.wb-photo,.wb-visual-toolbar,.wb-gallery-items'))return;
  window.uriBVisualAction('edit',id);
 });
}
function addButton(parent,label,panel,target,index){
 if(!parent||typeof parent.querySelector!=='function'||parent.querySelector(':scope > .wb-inline-edit'))return;
 const btn=document.createElement('button');
 btn.type='button';btn.className='wb-inline-edit';
 btn.setAttribute('aria-label',label);btn.textContent='Edit';
 btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();window.uriBEditTarget(panel,target,index)});
 parent.appendChild(btn);
}
window.uriBDecorateSections=()=>{
 const preview=document.getElementById('wbLivePreview');
 if(!preview||typeof preview.querySelectorAll!=='function')return;
 const sections=[...preview.querySelectorAll('[data-feature]')];
 sections.forEach((section,index)=>decorateSection(section,index,sections));
 addButton(preview.querySelector('[data-feature="hero"] .wb-names'),'Edit partners names','content','name1');
 addButton(preview.querySelector('[data-feature="story"] p'),'Edit your story','content','message');
 preview.querySelectorAll('.wb-venue-card').forEach(card=>{
  const r=card.classList.contains('wb-venue-reception');
  addButton(card,r?'Edit reception':'Edit ceremony','content',r?'reception-venue':'ceremony-venue');
 });
 preview.querySelectorAll('.wb-schedule-item').forEach((row,index)=>addButton(row,'Edit activity '+(index+1),'content','timeline',index));
};
})();