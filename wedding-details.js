/* URI Wedding Details 2.0 — same event data used in both wedding designs. */
(function(){
'use strict';
const U=window.URIBuilder, T=v=>esc(v==null?'':String(v));
const textDate=d=>d?fmt(d):'Date to be announced';
const safeUrl=url=>typeof url==='string'&&/^https:\/\/[^\s<>"']+$/i.test(url.trim())?url.trim():'';
const rid=()=> 'schedule-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
function ensure(e){
 if(!e.weddingDetails||typeof e.weddingDetails!=='object')e.weddingDetails={};
 if(!e.weddingDetails.ceremony||typeof e.weddingDetails.ceremony!=='object')e.weddingDetails.ceremony={};
 if(!e.weddingDetails.reception||typeof e.weddingDetails.reception!=='object')e.weddingDetails.reception={enabled:false,date:'',time:'',venue:'',address:'',mapUrl:'',instructions:''};
 if(!Array.isArray(e.timelineItems)){
   const raw=typeof e.featureConfig?.timeline==='string'?e.featureConfig.timeline:'2:00 PM | Ceremony\n4:00 PM | Reception\n6:00 PM | Dinner';
   e.timelineItems=raw.split('\n').map((str,i)=>{
     const [time,...parts]=str.split('|'),title=parts.join('|').trim()||'Celebration';
     return {id:'migrated-'+i,time:time.trim(),title,note:'',date:'',location:/reception|dinner|party/i.test(title)?'reception':'ceremony'};
   }).filter(x=>x.title||x.time).slice(0,30);
 }
 return e.weddingDetails;
}
const getTimeline=e=>{ensure(e);return e.timelineItems};
const places=e=>{
 const d=ensure(e),c=d.ceremony,r=d.reception;
 const ceremony={key:'ceremony',label:'Ceremony',date:e.date||'',time:e.time||'',venue:e.venue||'',address:e.address||'',mapUrl:c.mapUrl||'',instructions:c.instructions||''};
 const reception={key:'reception',label:'Reception',date:r.date||e.date||'',time:r.time||'',venue:r.venue||'',address:r.address||'',mapUrl:r.mapUrl||'',instructions:r.instructions||''};
 return r.enabled?[ceremony,reception]:[ceremony];
};
function venueCard(v){
 const map=safeUrl(v.mapUrl);
 return '<article class="wb-venue-card wb-venue-'+v.key+'"><div class="wb-venue-head"><span class="wb-kicker">'+v.label+'</span><span aria-hidden="true">✧</span></div>'
  +'<h3>'+T(v.venue||'Venue to be announced')+'</h3>'
  +'<div class="wb-venue-when"><strong>'+T(textDate(v.date))+'</strong>'+(v.time?'<span>'+T(v.time)+'</span>':'')+'</div>'
  +(v.address?'<p class="wb-venue-address">'+T(v.address)+'</p>':'')
  +(v.instructions?'<p class="wb-venue-instructions">'+T(v.instructions)+'</p>':'')
  +(map?'<a class="wb-map-link" href="'+T(map)+'" target="_blank" rel="noopener noreferrer" aria-label="Open directions for '+T(v.label)+'">View directions ↗</a>':'')
  +'</article>';
}
function renderDetails(e,variant){
 return '<section data-feature="details" class="wb-unit wb-details wb-details-'+variant+' wb-wedding-venues"><span class="wb-kicker">Where we celebrate</span><h2>Wedding Details</h2>'
 +'<div class="wb-venues">'+places(e).map(venueCard).join('')+'</div></section>';
}
function renderTimeline(e,variant){
 const items=getTimeline(e);
 if(!items.length)return '';
 return '<section data-feature="timeline" class="wb-unit wb-timeline wb-timeline-'+variant+' wb-wedding-schedule"><span class="wb-kicker">Order of events</span><h2>Wedding Timeline</h2><ol>'
  +items.map((item,i)=>{
   const location=places(e).find(v=>v.key===item.location);
   const date=item.date?textDate(item.date):'';
   return '<li class="wb-schedule-item"><div class="wb-schedule-time">'+(date?'<small>'+T(date)+'</small>':'')+'<strong>'+T(item.time||'Time TBA')+'</strong></div>'
     +'<div class="wb-schedule-copy"><b>'+T(item.title||'Activity')+'</b>'
     +(item.note?'<p>'+T(item.note)+'</p>':'')
     +(location&&location.venue?'<small>'+T(location.label)+' · '+T(location.venue)+'</small>':'')
     +'</div></li>';
  }).join('')+'</ol></section>';
}
function renderTimelineTeaser(e){
 if(!U.enabled(e,'timeline'))return '<div class="wb-editorial-timeline-teaser"><div class="wb-editorial-side-title">Our Day</div><span class="wb-editorial-heart">♡</span></div>';
 const rows=getTimeline(e).slice(0,4);
 return '<div class="wb-editorial-timeline-teaser"><div class="wb-editorial-side-title">The Timeline</div><div class="wb-editorial-rule"></div>'
  +(rows.length?rows.map((item,i)=>'<div class="wb-editorial-timeline-row"><span class="wb-editorial-icon" aria-hidden="true">'+['✧','♡','❀','✦'][i%4]+'</span><div><strong>'+T(item.time||'Time TBA')+'</strong><small>'+T(item.title||'Activity')+'</small></div></div>').join(''):'<p>Timeline details to follow.</p>')
  +'</div>';
}
function input(section,key,label,type='text',placeholder=''){
 const a=section==='reception'?ensure(current()).reception:ensure(current()).ceremony;
 const val=section==='ceremony'&&['date','time','venue','address'].includes(key)?current()[key]||'':a[key]||'';
 return '<label class="wb-field"><span>'+label+'</span><input type="'+type+'" value="'+T(val)+'" placeholder="'+T(placeholder)+'" oninput="uriWeddingDetailSet(\''+section+'\',\''+key+'\',this.value)"></label>';
}
function notes(section){
 const val=ensure(current())[section].instructions||'';
 return '<label class="wb-field"><span>Guest instructions</span><textarea rows="2" maxlength="750" placeholder="Parking, entrance, meeting point, or arrival notes" oninput="uriWeddingDetailSet(\''+section+'\',\'instructions\',this.value)">'+T(val)+'</textarea></label>';
}
function sectionEditor(e,section){
 const isCeremony=section==='ceremony';
 return '<div class="wb-venue-editor"><div class="wb-venue-editor-title"><strong>'+(isCeremony?'Ceremony':'Reception')+'</strong><small>'+(isCeremony?'Main wedding details':'Separate venue and schedule (optional)')+'</small></div>'
  +'<div class="wb-fieldgrid">'+input(section,'date','Date','date')+input(section,'time','Start time','time')
  +input(section,'venue','Venue')+input(section,'address','Address')+'</div>'
  +input(section,'mapUrl','Directions / map URL','url','https://maps.google.com/...')
  +notes(section)
  +'</div>';
}
function scheduleRow(item,i,total){
 const opts=[['ceremony','Ceremony'],['reception','Reception'],['custom','Other location']];
 return '<article class="wb-schedule-editor-row"><div class="wb-schedule-editor-head"><strong>Activity '+(i+1)+'</strong><div>'
 +'<button type="button" aria-label="Move activity '+(i+1)+' up" '+(i===0?'disabled':'')+' onclick="uriWeddingTimelineMove('+i+',-1)">↑</button>'
 +'<button type="button" aria-label="Move activity '+(i+1)+' down" '+(i===total-1?'disabled':'')+' onclick="uriWeddingTimelineMove('+i+',1)">↓</button>'
 +'<button type="button" aria-label="Remove activity '+(i+1)+'" onclick="uriWeddingTimelineRemove('+i+')">Remove</button></div></div>'
 +'<div class="wb-fieldgrid">'
 +'<label class="wb-field"><span>Time</span><input value="'+T(item.time||'')+'" placeholder="e.g. 4:30 PM" maxlength="60" oninput="uriWeddingTimelineSet('+i+',\'time\',this.value)"></label>'
 +'<label class="wb-field"><span>Activity</span><input value="'+T(item.title||'')+'" placeholder="e.g. Reception" maxlength="120" oninput="uriWeddingTimelineSet('+i+',\'title\',this.value)"></label>'
 +'<label class="wb-field"><span>Different date (optional)</span><input type="date" value="'+T(item.date||'')+'" oninput="uriWeddingTimelineSet('+i+',\'date\',this.value)"></label>'
 +'<label class="wb-field"><span>Location</span><select onchange="uriWeddingTimelineSet('+i+',\'location\',this.value)">'+opts.map(([key,label])=>'<option value="'+key+'" '+(item.location===key?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'
 +'<label class="wb-field"><span>Activity notes (optional)</span><textarea rows="2" maxlength="400" oninput="uriWeddingTimelineSet('+i+',\'note\',this.value)" placeholder="More details for your guests">'+T(item.note||'')+'</textarea></label></article>';
}
function editor(e){
 ensure(e);
 const r=e.weddingDetails.reception;
 return '<div class="wb-details-editor"><div class="wb-details-editor-head"><h3>Ceremony & reception</h3><p>Add separate locations, directions and helpful information for guests.</p></div>'
  +sectionEditor(e,'ceremony')
  +'<label class="wb-reception-toggle"><input type="checkbox" '+(r.enabled?'checked':'')+' onchange="uriWeddingReception(this.checked)"><span><strong>Include a separate reception</strong><small>Turn this on if your reception has its own venue or schedule.</small></span></label>'
  +(r.enabled?sectionEditor(e,'reception'):'')
  +'<div class="wb-details-editor-head wb-schedule-editor-title"><h3>Wedding timeline</h3><p>Add as many activities as needed, with optional dates, venues and notes.</p></div>'
  +'<div class="wb-schedule-editor-list">'+getTimeline(e).map((item,i)=>scheduleRow(item,i,e.timelineItems.length)).join('')+'</div>'
  +'<button type="button" class="btn wb-add-schedule" onclick="uriWeddingTimelineAdd()">+ Add activity</button>'
  +'</div>';
}
function persistChange(fn,refresh=true){
 const e=current();if(!e||e.type!=='Wedding')return false;
 ensure(e);
 const old={base:{date:e.date,time:e.time,venue:e.venue,address:e.address},weddingDetails:JSON.parse(JSON.stringify(e.weddingDetails)),timelineItems:JSON.parse(JSON.stringify(e.timelineItems))};
 fn(e);
 if(U.persist()){if(refresh)U.refresh();return true}
 Object.assign(e,old.base);e.weddingDetails=old.weddingDetails;e.timelineItems=old.timelineItems;return false;
}
window.uriWeddingDetailSet=(section,key,value)=>{
 if(!['ceremony','reception'].includes(section)||!['date','time','venue','address','mapUrl','instructions'].includes(key))return;
 persistChange(e=>{
  if(section==='ceremony'&&['date','time','venue','address'].includes(key))e[key]=value;
  else e.weddingDetails[section][key]=value;
 });
 if(window.uriBuilderUpdateReadiness)window.uriBuilderUpdateReadiness(current());
};
window.uriWeddingReception=flag=>{if(persistChange(e=>{e.weddingDetails.reception.enabled=!!flag},false))eventPage()};
window.uriWeddingTimelineSet=(i,key,value)=>{
 if(!Number.isInteger(i)||!['time','title','date','location','note'].includes(key))return;
 if(key==='location'&&!['ceremony','reception','custom'].includes(value))return;
 persistChange(e=>{if(!e.timelineItems[i])return;e.timelineItems[i][key]=String(value).slice(0,key==='note'?400:120)});
};
window.uriWeddingTimelineAdd=()=>{
 if(persistChange(e=>{if(e.timelineItems.length<30)e.timelineItems.push({id:rid(),time:'',title:'New activity',date:'',location:'ceremony',note:''})},false))eventPage();
};
window.uriWeddingTimelineRemove=i=>{if(persistChange(e=>{if(e.timelineItems[i])e.timelineItems.splice(i,1)},false))eventPage()};
window.uriWeddingTimelineMove=(i,dir)=>{if(persistChange(e=>{let j=i+dir;if(i>=0&&j>=0&&j<e.timelineItems.length){const [item]=e.timelineItems.splice(i,1);e.timelineItems.splice(j,0,item)}},false))eventPage()};
window.URIWeddingDetails={ensure,places,getTimeline,renderDetails,renderTimeline,renderTimelineTeaser,editor,safeUrl};
U.ensureDetails=ensure;
})();
