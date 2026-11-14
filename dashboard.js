/* URI Dashboard 2.0 — local event management, no backend writes. */
(function(){
'use strict';
let activeFilter='all',activeSort='edited',query='';
const T=value=>esc(value==null?'':String(value));
const events=()=>{
 const account=window.URICloudDrafts?.getUser?.();
 return Array.isArray(state.events)?state.events.filter(e=>!e._uriCloudOwnerId||(account&&(e._uriCloudOwnerId===account.id||e._uriCloudRole==='editor'))):[];
};
const published=e=>e.type==='Wedding'&&e.cloudPublished===true&&!!e.cloudSlug;
const status=e=>published(e)?'Published':e.status==='published'?'Local test':'Draft';
const stamp=e=>Number(e.updatedAt||e.created||0);
const stampText=e=>stamp(e)?new Date(stamp(e)).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}):'Not yet edited';
function card(e){
 const id=T(e.id),name=title(e),s=status(e);
 const count=Array.isArray(e.guests)?e.guests.length:0;
 const cover=e.type==='Wedding'&&window.URIBuilder?window.URIBuilder.cover(e):'<div class="uri-dash-generic"><span>'+T(e.type||'Event')+'</span><strong>'+T(name)+'</strong></div>';
 return '<article class="uri-dash-card" data-event-id="'+id+'" data-status="'+(published(e)?'published':'draft')+'" data-search="'+T((name+' '+(e.venue||'')+' '+(e.type||'')).toLowerCase())+'">'
 +'<div class="uri-dash-cover">'+cover+'<span class="uri-dash-status uri-dash-status-'+(published(e)?'published':e.status==='published'?'test':'draft')+'">'+T(s)+'</span></div>'
 +'<div class="uri-dash-card-body"><span class="uri-dash-type">'+T(e.type||'Event')+'</span><h3>'+T(name)+'</h3>'
 +'<div class="uri-dash-meta"><span> '+T(e.date?fmt(e.date):'Date not set')+'</span><span>Edited '+T(stampText(e))+'</span></div>'+(e.type==='Wedding'&&window.URIReadiness?'<div class="uri-dash-readiness"><strong>'+window.URIReadiness.status(e).percent+'% complete</strong><button type="button" onclick="uriDashAction(\'review\',this.closest(\'[data-event-id]\').dataset.eventId)">View checklist</button></div>':'')
 +'<div class="uri-dash-card-footer"><span>'+count+' test guest'+(count===1?'':'s')+'</span>'
 +'<div class="uri-dash-card-actions">'
 +'<button type="button" class="btn primary" onclick="uriDashAction(\'edit\',this.closest(\'[data-event-id]\').dataset.eventId)">Edit</button>'
 +'<button type="button" class="btn" onclick="uriDashAction(\'preview\',this.closest(\'[data-event-id]\').dataset.eventId)">Preview</button>'
 +'</div></div>'
 +'<div class="uri-dash-secondary-actions"><button type="button" onclick="uriDashAction(\'duplicate\',this.closest(\'[data-event-id]\').dataset.eventId)">Duplicate</button>'
 +'<button type="button" class="uri-dash-delete" onclick="uriDashAction(\'delete\',this.closest(\'[data-event-id]\').dataset.eventId)">Delete</button></div></div></article>';
}
function sortedItems(){
 const es=[...events()];
 es.sort((a,b)=>activeSort==='date'?String(a.date||'9999').localeCompare(String(b.date||'9999')):(stamp(b)-stamp(a)));
 return es;
}
function filterItems(){
 const q=query.toLowerCase().trim();
 const list=[...document.querySelectorAll('.uri-dash-card')];
 let shown=0;
 list.forEach(el=>{
  const matches=(activeFilter==='all'||el.dataset.status===activeFilter)&&(!q||String(el.dataset.search||'').includes(q));
  el.hidden=!matches;if(matches)shown++;
 });
 const out=document.getElementById('uriDashVisible');
 if(out)out.textContent=shown+' event'+(shown===1?'':'s')+' shown';
 const empty=document.getElementById('uriDashNoResults');
 if(empty)empty.hidden=shown!==0||!events().length;
}
function renderDashboard(){
 const es=events(),publishedCount=es.filter(published).length;
 const countDraft=es.length-publishedCount;
 const items=sortedItems();
 app.innerHTML='<div class="wrap uri-dash-wrap"><div class="uri-dash-heading"><div><h1>My Events</h1></div><button type="button" class="btn primary" onclick="startWizard()">New wedding website</button></div>'
 +'<div class="uri-dash-stats"><div><strong>'+es.length+'</strong><span>Total events</span></div><div><strong>'+countDraft+'</strong><span>Drafts</span></div><div><strong>'+publishedCount+'</strong><span>Published</span></div></div>'
 +(es.length?'<div class="uri-dash-toolbar"><label class="uri-dash-search"><span class="sr-only">Search invitations</span><input type="search" value="'+T(query)+'" placeholder="Search invitations..." oninput="uriDashSearch(this.value)"></label><div class="uri-dash-filters" role="group" aria-label="Filter events">'
 +[['all','All'],['draft','Drafts'],['published','Published']].map(([key,label])=>'<button type="button" aria-pressed="'+(activeFilter===key)+'" class="'+(activeFilter===key?'active':'')+'" onclick="uriDashFilter(\''+key+'\')">'+label+'</button>').join('')+'</div>'
 +'<label class="uri-dash-sort">Sort <select aria-label="Sort events" onchange="uriDashSort(this.value)"><option value="edited" '+(activeSort==='edited'?'selected':'')+'>Recently edited</option><option value="date" '+(activeSort==='date'?'selected':'')+'>Event date</option></select></label></div>'
 +'<div class="uri-dash-results"><span id="uriDashVisible">'+items.length+' events shown</span></div>'
 +'<div class="uri-dash-grid">'+items.map(card).join('')+'</div>'
 +'<div id="uriDashNoResults" class="uri-dash-no-results" hidden><h3>No matching invitations</h3><button type="button" class="btn" onclick="uriDashReset()">Clear filters</button></div>'
 :'<div class="uri-dash-empty"><h2>No events yet</h2><button type="button" class="btn primary" onclick="startWizard()">Create a wedding website</button></div>')
 +'<div class="uri-dash-footnote">Invitations save locally. Sign in under Cloud to synchronize them. Publishing status is not checked live.</div></div>';
 if(es.length)filterItems();
}
dashboard=renderDashboard;
window.uriDashSearch=value=>{query=String(value||'').slice(0,120);filterItems()};
window.uriDashFilter=value=>{if(!['all','draft','published'].includes(value))return;activeFilter=value;renderDashboard()};
window.uriDashSort=value=>{if(!['edited','date'].includes(value))return;activeSort=value;renderDashboard()};
window.uriDashReset=()=>{query='';activeFilter='all';activeSort='edited';renderDashboard()};
function saveSafely(){try{save();return true}catch(err){alert('Browser storage is full. No changes were saved.');return false}}
window.uriDashAction=async function(action,id){
 const e=events().find(x=>String(x.id)===String(id));if(!e)return;
 if(action==='edit'||action==='preview'||action==='manage'||action==='review'){
  const previous=state.current;state.current=e.id;
  if(!saveSafely()){state.current=previous;return}
  if(action==='preview'){
   if(e.type==='Wedding'){location.hash='#preview/'+encodeURIComponent(e.id);render()}
   else{tab='share';route('event')}
   return;
  }
  tab=action==='manage'?'overview':'edit';route('event');if(action==='review')window.uriBPanel?.('review');return;
 }
 if(action==='duplicate'){
  let clone;try{clone=JSON.parse(JSON.stringify(e))}catch(err){alert('Unable to duplicate this invitation.');return}
  clone.id='e'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
  clone.created=Date.now();clone.updatedAt=clone.created;
  clone.status='draft';clone.cloudPublished=false;delete clone.cloudSlug;
  delete clone._uriCloudRevision;delete clone._uriCloudSyncedAt;
  delete clone._uriCloudOwnerId;delete clone._uriCloudPending;
  clone.title=(title(e)||'Wedding')+' (Copy)';
  clone.guests=[];clone.households=[];delete clone.rsvpAnswers;
  state.events.push(clone);
  if(!saveSafely()){state.events.pop();return}
  activeFilter='all';query='';renderDashboard();return;
 }
 if(action==='delete'){
  if(published(e)){alert('Unpublish this wedding in the Publish tab before deleting its local draft. This avoids leaving an unmanaged public website.');return}
  if(!confirm('Permanently delete "'+title(e)+'" from this browser and your cloud account (if synchronized)? This cannot be undone.'))return;
  if(e._uriCloudRevision){
   try{
    if(!window.URICloudDrafts?.deleteDraft)throw Error('Cloud deletion is not available.');
    await window.URICloudDrafts.deleteDraft(e);
   }catch(err){alert('Unable to delete cloud invitation: '+(err.message||'Please try again.'));return}
  }
  const i=state.events.indexOf(e),before=state.current;
  state.events.splice(i,1);
  if(state.current===e.id)state.current=state.events[0]?.id||null;
  if(!saveSafely()){state.events.splice(i,0,e);state.current=before;return}
  renderDashboard();
 }
};
if(window.URIBuilder){
 const beforePersist=window.URIBuilder.persist;
 window.URIBuilder.persist=function(){
  const e=current(),prior=e?.updatedAt;
  if(e)e.updatedAt=Date.now();
  const ok=beforePersist();
  if(!ok&&e)e.updatedAt=prior;
  return ok;
 };
}
if(location.hash==='#dashboard')renderDashboard();
})();
