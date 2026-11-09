/* URI direct section editing — editor preview only, never on guest/public pages. */
(function(){
'use strict';
const T=x=>esc(x==null?'':String(x));
const map={
 hero:['content','name1'],story:['content','message'],gallery:['photos','gallery'],
 countdown:['content','ceremony-date'],details:['content','ceremony-venue'],
 timeline:['content','timeline'],dress:['content','dress'],gifts:['content','gifts'],rsvp:['guests','guests']
};
function focusTarget(target,index){
 let el=null;
 if(target==='timeline')el=document.querySelector('[data-uri-schedule-index="'+(Number.isInteger(index)?index:0)+'"] input');
 else if(target==='gallery'||target==='cover')el=document.querySelector('.wb-photo-add input[type="file"],.wb-photo-choose input[type="file"]');
 else el=document.querySelector('[data-uri-field="'+target+'"] input,[data-uri-field="'+target+'"] textarea,[data-uri-field="'+target+'"] select');
 if(!el&&target.startsWith('reception-'))el=document.querySelector('.wb-reception-toggle input');
 if(el){const fold=el.closest?.('details');if(fold)fold.open=true;el.scrollIntoView?.({behavior:'smooth',block:'center'});el.focus?.({preventScroll:true})}
}
window.uriBEditTarget=(panel,target,index)=>{
 if(panel==='guests'){tab='guests';eventPage();document.querySelector('.uri-guests')?.scrollIntoView?.({block:'start'});return}
 tab='edit';
 if(typeof window.uriBPanel==='function')window.uriBPanel(panel==='photos'?'photos':'content');
 else eventPage();
 setTimeout(()=>focusTarget(target||'',index),0);
};
function addButton(parent,label,tab,target,index){
 if(!parent||typeof parent.querySelector!=='function'||parent.querySelector(':scope > .wb-inline-edit'))return;
 const btn=document.createElement('button');btn.type='button';
 btn.className='wb-inline-edit';btn.setAttribute('aria-label',label);
 btn.textContent='Edit';
 btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.uriBEditTarget(tab,target,index)});
 parent.appendChild(btn);
}
window.uriBDecorateSections=()=>{
 const preview=document.getElementById('wbLivePreview');
 if(!preview||typeof preview.querySelectorAll!=='function')return;
 preview.querySelectorAll('[data-feature]').forEach(section=>{
  const feature=section.dataset.feature,route=map[feature];
  if(route)addButton(section,'Edit '+feature+' section',route[0],route[1]);
 });
 addButton(preview.querySelector('[data-feature="hero"] .wb-names'),'Edit partners’ names','content','name1');
 addButton(preview.querySelector('[data-feature="story"] p'),'Edit your story','content','message');
 preview.querySelectorAll('.wb-venue-card').forEach(card=>{
  const reception=card.classList.contains('wb-venue-reception');
  addButton(card,reception?'Edit reception':'Edit ceremony','content',reception?'reception-venue':'ceremony-venue');
 });
 preview.querySelectorAll('.wb-schedule-item').forEach((row,index)=>addButton(row,'Edit activity '+(index+1),'content','timeline',index));
};
})();