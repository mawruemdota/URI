/* URI invitation readiness — advisory checks and essential publish safeguards. */
(function(){
'use strict';
const T=x=>esc(x==null?'':String(x));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const has=x=>typeof x==='string'&&x.trim().length>0;
function items(e){
 if(!e||e.type!=='Wedding')return [];
 const U=window.URIBuilder,ds=e.weddingDetails||{},r=ds.reception||{},gallery=Array.isArray(e.photos)?e.photos:[];
 const enabled=id=>U?U.enabled(e,id):true;
 const add=(id,label,done,blocking,panel,target,help)=>({id,label,done:!!done,blocking:!!blocking,panel,target,help});
 const req=[
  add('names','Both partners’ names',has(e.name1)&&has(e.name2),true,'content','name1','Enter both names'),
  add('date','Wedding date',has(e.date)&&e.date>=today(),true,'content','ceremony-date','Choose a current or future date'),
  add('time','Ceremony time',has(e.time),true,'content','ceremony-time','Add a ceremony start time'),
  add('venue','Ceremony venue',has(e.venue),true,'content','ceremony-venue','Add the venue name'),
  add('deadline','RSVP deadline',!has(e.deadline)||(!has(e.date)||e.deadline<=e.date),true,'content','deadline','Deadline must not be after the wedding'),
  add('reception','Reception details',!r.enabled||(has(r.venue)&&has(r.time)),!!r.enabled,'content','reception-venue','Add reception venue and start time')
 ];
 const rec=[
  add('cover','Cover photograph',has(e.heroPhoto),false,'photos','cover','Add a photo to personalize the cover'),
  add('address','Venue address',has(e.address),false,'content','ceremony-address','Guests will need the location'),
  add('directions','Directions link',has(ds.ceremony?.mapUrl),false,'content','ceremony-mapUrl','Link to the venue on a map'),
  add('story','Personal story',has(e.message),false,'content','message','Write a message to guests')
 ];
 if(enabled('gallery'))rec.push(add('gallery','Gallery photographs',gallery.some(p=>p&&typeof p.src==='string'&&p.src),false,'photos','gallery','The gallery stays hidden until it has photos'));
 if(enabled('timeline'))rec.push(add('timeline','Timeline activities',Array.isArray(e.timelineItems)&&e.timelineItems.some(x=>has(x.title)&&has(x.time)),false,'content','timeline','Add at least one activity with a time'));
 if(enabled('rsvp'))rec.push(add('guestlist','Test guest list',Array.isArray(e.guests)&&e.guests.length>0,false,'guests','guests','Add invitees to plan allocations and test RSVP'));
 return [...req,...rec];
}
function status(e){const list=items(e),done=list.filter(x=>x.done).length,blockers=list.filter(x=>!x.done&&x.blocking);
 return {list,done,total:list.length,blockers,ready:blockers.length===0,percent:list.length?Math.round(done/list.length*100):100};
}
function summary(e){const s=status(e);return '<div class="uri-ready-bar"><div><strong>'+s.done+' of '+s.total+' checklist items complete</strong><small>'+(s.ready?'Essential details ready · '+(s.total-s.done)+' suggested improvement(s)':'Review '+s.blockers.length+' essential detail(s) before publishing')+'</small></div><span class="uri-ready-meter" aria-label="'+s.percent+' percent complete"><span style="width:'+s.percent+'%"></span></span><button type="button" class="btn small" onclick="uriReadinessShow()">Review checklist →</button></div>'}
function panel(e){
 const s=status(e);
 return '<section class="uri-ready-panel"><div class="uri-ready-heading"><h3>Invitation readiness</h3><p>Check the essential information, then complete the optional details that make guests’ experience smoother.</p></div>'
  +'<div class="uri-ready-progress"><strong>'+s.done+' / '+s.total+'</strong><div role="progressbar" aria-valuenow="'+s.percent+'" aria-valuemin="0" aria-valuemax="100" aria-label="Checklist completion"><span style="width:'+s.percent+'%"></span></div><small>'+s.percent+'% complete</small></div>'
  +'<div class="uri-ready-group"><h4>Required for publishing</h4>'+s.list.filter(x=>x.blocking).map(row).join('')+'</div>'
  +'<div class="uri-ready-group"><h4>Recommended</h4>'+s.list.filter(x=>!x.blocking).map(row).join('')+'</div>'
  +'<p class="uri-ready-security">Guest RSVP links and responses are still local testing features. Completing this checklist does not activate online guest responses.</p></section>';
}
function row(x){return '<article class="uri-ready-item '+(x.done?'is-done':'needs-work')+'"><span aria-hidden="true">'+(x.done?'✓':'○')+'</span><div><strong>'+T(x.label)+'</strong><small>'+(x.done?'Complete':T(x.help))+'</small></div>'+(x.done?'':'<button type="button" onclick="uriReadinessFix(\''+x.panel+'\',\''+x.target+'\')">Fix →</button>')+'</article>'}
window.URIReadiness={items,status,summary,panel};
window.uriReadinessShow=()=>{if(window.uriBPanel)window.uriBPanel('review');else{tab='edit';eventPage();window.uriBPanel?.('review')}};
window.uriReadinessFix=(panel,target)=>{
 if(panel==='guests'){tab='guests';eventPage();return}
 if(window.uriBEditTarget)window.uriBEditTarget(panel,target);
 else if(window.uriBPanel)window.uriBPanel(panel==='content'||panel==='photos'?panel:'content');
};
})();