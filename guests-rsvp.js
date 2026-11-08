/* URI Guest Management / RSVP 2.0 — browser-local test implementation.
   NO secure sharing or remote collection; public guest URLs require authenticated backend. */
(function(){
'use strict';
const T=x=>esc(x==null?'':String(x));
const token=prefix=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const number=(v,max=500)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
const statusSet=['pending','attending','declined'];
let filter='all',search='',editing='',notice='';
function getEvent(){const e=current();return e&&e.type==='Wedding'?ensure(e):null}
function ensure(e){
 if(!e||e.type!=='Wedding')return e;
 if(!Array.isArray(e.guests))e.guests=[];
 if(!Array.isArray(e.households))e.households=[];
 if(!e.rsvpSettings||typeof e.rsvpSettings!=='object')e.rsvpSettings={};
 const s=e.rsvpSettings;if(!Number.isFinite(Number(s.capacity)))s.capacity=0;
 if(!Array.isArray(s.questions))s.questions=[{id:'dietary',label:'Dietary requirements or allergies',type:'text',options:[],required:false}];
 s.questions=s.questions.filter(q=>q&&typeof q==='object').slice(0,12);
 for(const g of e.guests){
  if(typeof g.status!=='string'||!statusSet.includes(g.status))g.status='pending';
  g.plusOnesAllowed=number(g.plusOnesAllowed??0,5);
  g.plusOnesConfirmed=number(g.plusOnesConfirmed??0,g.plusOnesAllowed);
  if(!g.answers||typeof g.answers!=='object')g.answers={};
  if(!g.category)g.category='General';
  if(!g.householdId&&typeof g.group==='string'&&g.group.trim()){
   let h=e.households.find(h=>h.name.toLowerCase()===g.group.trim().toLowerCase());
   if(!h){h={id:token('h'),name:g.group.trim().slice(0,100),seatLimit:0};e.households.push(h)}
   g.householdId=h.id;
  }
 }
 return e;
}
function household(e,id){return e.households.find(h=>h.id===id)}
function usage(e){
 const attending=e.guests.filter(g=>g.status==='attending');
 const reserved=e.guests.reduce((n,g)=>n+1+number(g.plusOnesAllowed,5),0);
 const confirmed=attending.reduce((n,g)=>n+1+number(g.plusOnesConfirmed,g.plusOnesAllowed),0);
 return {people:e.guests.length,attending:attending.length,confirmed,declined:e.guests.filter(g=>g.status==='declined').length,pending:e.guests.filter(g=>g.status==='pending').length,reserved,capacity:number(e.rsvpSettings.capacity,10000)};
}
function success(msg){notice=msg;eventPage()}
function persist(fn){
 const e=getEvent();if(!e)return false;
 const old={guests:JSON.parse(JSON.stringify(e.guests)),households:JSON.parse(JSON.stringify(e.households)),rsvpSettings:JSON.parse(JSON.stringify(e.rsvpSettings))};
 fn(e);
 try{save();return true}catch(_){e.guests=old.guests;e.households=old.households;e.rsvpSettings=old.rsvpSettings;notice='Browser storage is full. Your changes were not saved.';eventPage();return false}
}
function stats(e){const u=usage(e);return '<div class="uri-guest-stats">'+[['Invited',u.people],['Accepted',u.attending],['Seats confirmed',u.confirmed],['Pending',u.pending],['Declined',u.declined]].map(([k,v])=>'<div><strong>'+v+'</strong><span>'+k+'</span></div>').join('')+'</div>'}
function options(items,selected,empty){return (empty?'<option value="">'+T(empty)+'</option>':'')+items.map(item=>'<option value="'+T(item.id)+'" '+(item.id===selected?'selected':'')+'>'+T(item.name)+'</option>').join('')}
function guestForm(e,guest){
 const g=guest||{},edit=!!guest;
 return '<form class="uri-guest-form" onsubmit="'+(edit?'uriGuestsUpdate(event)':'uriGuestsAdd(event)')+'"><h3>'+(edit?'Edit guest':'Add a guest')+'</h3>'
  +'<div class="uri-guest-form-grid"><label>Full name<input name="name" maxlength="120" required value="'+T(g.name||'')+'" placeholder="e.g. Sofia Cruz"></label>'
  +'<label>Email (optional)<input name="email" type="email" maxlength="160" value="'+T(g.email||'')+'" placeholder="Only for local planning"></label>'
  +'<label>Household<select name="householdId">'+options(e.households,g.householdId||'','No household')+'</select></label>'
  +'<label>Category<select name="category">'+['General','Family','Friends','Entourage','VIP','Colleagues'].map(x=>'<option '+(g.category===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'
  +'<label>Extra seats / plus-ones<input name="plusOnesAllowed" type="number" min="0" max="5" value="'+number(g.plusOnesAllowed||0,5)+'"></label></div>'
  +'<div class="uri-guest-form-actions"><button type="submit" class="btn primary">'+(edit?'Save guest':'Add guest')+'</button>'+(edit?'<button type="button" class="btn" onclick="uriGuestsCancel()">Cancel</button>':'')+'</div></form>';
}
function guestRows(e){
 const q=search.toLowerCase().trim();
 const guests=e.guests.filter(g=>(filter==='all'||g.status===filter)&&(!q||(g.name+' '+(g.email||'')+' '+(household(e,g.householdId)?.name||'')+' '+(g.category||'')).toLowerCase().includes(q)));
 return guests.length?guests.map(g=>'<article class="uri-guest-row" data-guest-id="'+T(g.id)+'">'
  +'<div class="uri-guest-main"><strong>'+T(g.name)+'</strong><small>'+T(household(e,g.householdId)?.name||'Individual')+' · '+T(g.category||'General')+(g.plusOnesAllowed?' · +'+number(g.plusOnesAllowed,5)+' allowed':'')+'</small></div>'
  +'<span class="uri-guest-status uri-guest-status-'+T(g.status)+'">'+T(g.status)+'</span>'
  +'<div class="uri-guest-row-actions"><button type="button" onclick="uriGuestsTest(this.closest(\'[data-guest-id]\').dataset.guestId)">Test RSVP</button><button type="button" onclick="uriGuestsEdit(this.closest(\'[data-guest-id]\').dataset.guestId)">Edit</button><button type="button" onclick="uriGuestsRemove(this.closest(\'[data-guest-id]\').dataset.guestId)">Remove</button></div></article>').join(''):'<div class="uri-guests-blank">No guests match. Add someone or clear the filters.</div>';
}
function questionRows(e){
 return e.rsvpSettings.questions.map((q,i)=>'<div class="uri-question-row"><div><strong>'+T(q.label)+'</strong><small>'+T(q.type==='choice'?'Multiple choice: '+(Array.isArray(q.options)?q.options.join(', '):''):'Short answer')+(q.required?' · Required':'')+'</small></div><button type="button" onclick="uriGuestsRemoveQuestion('+i+')">Remove</button></div>').join('');
}
function panel(e){
 ensure(e);
 const u=usage(e);
 const edit=e.guests.find(g=>g.id===editing);
 return '<div class="uri-guests"><div class="uri-guests-heading"><span class="eyebrow">Guest planning</span><h2>Guests & RSVP</h2><p>Manage households, additional seats and test responses. All guest details stay in this browser.</p></div>'
  +'<div class="uri-guests-warning"><strong>Local testing only.</strong> Guest links are not secure, cannot work across different browsers, and must not be sent to real guests. Secure RSVP will require a backend.</div>'
  +(notice?'<p class="uri-guest-notice" role="status">'+T(notice)+'</p>':'')
  +stats(e)
  +'<div class="uri-guest-layout"><section class="uri-guest-panel">'+guestForm(e,edit)+'</section>'
  +'<section class="uri-guest-panel"><h3>Households</h3><p>Group invitees and optionally limit seats in each household.</p>'
  +'<form class="uri-household-form" onsubmit="uriHouseholdAdd(event)"><label>Household name<input required name="household" maxlength="100" placeholder="e.g. Cruz Family"></label><label>Seats (0 = unlimited)<input name="seats" type="number" value="0" min="0" max="50"></label><button class="btn" type="submit">Add</button></form>'
  +'<div class="uri-household-list">'+(e.households.length?e.households.map(h=>'<div class="uri-household-row"><span><strong>'+T(h.name)+'</strong><small>'+e.guests.filter(g=>g.householdId===h.id).length+' guests · '+(number(h.seatLimit,50)?number(h.seatLimit,50)+' seats':'No seat limit')+'</small></span><button type="button" onclick="uriHouseholdRemove(\''+T(h.id)+'\')">Remove</button></div>').join(''):'<small>No households added.</small>')+'</div></section></div>'
  +'<section class="uri-guest-panel"><div class="uri-guest-tools"><div><h3>Guest list</h3><small>'+u.people+' invited · '+u.reserved+' allocated seats · '+u.confirmed+' confirmed</small></div><div class="uri-guest-import"><button type="button" class="btn small" onclick="uriGuestsExport()">Export CSV</button><label class="uri-import-label">Import CSV<input type="file" accept=".csv,text/csv" onchange="uriGuestsImport(event)"></label></div></div>'
  +'<div class="uri-guest-toolbar"><label>Find guests<input type="search" placeholder="Search name, household, category" value="'+T(search)+'" oninput="uriGuestsSearch(this.value)"></label><label>Status<select onchange="uriGuestsFilter(this.value)">'+['all','pending','attending','declined'].map(x=>'<option value="'+x+'" '+(x===filter?'selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'
  +'<div class="uri-guest-rows">'+guestRows(e)+'</div></section>'
  +'<section class="uri-guest-panel"><h3>RSVP setup & questions</h3><p>Configure local demo responses and seat limits. A blank maximum means there is no overall limit.</p>'
  +'<label class="uri-guest-capacity">Maximum confirmed seats<input type="number" min="0" max="10000" value="'+(u.capacity||'')+'" placeholder="No overall limit" onchange="uriGuestsCapacity(this.value)"></label>'
  +'<div class="uri-questions">'+questionRows(e)+'</div>'
  +'<form class="uri-question-form" onsubmit="uriGuestsAddQuestion(event)"><label>New question<input required name="label" maxlength="120" placeholder="e.g. Which meal would you prefer?"></label><label>Answer type<select name="type"><option value="text">Short answer</option><option value="choice">Choose one</option></select></label><label>Choices (separate with |)<input name="options" placeholder="Chicken | Fish | Vegetarian"></label><label class="uri-checkline"><input type="checkbox" name="required"> Required</label><button type="submit" class="btn">Add question</button></form></section></div>';
}
window.uriGuestsAdd=ev=>{ev.preventDefault();const form=new FormData(ev.target),name=String(form.get('name')||'').trim().slice(0,120);if(!name)return;
 if(persist(e=>e.guests.push({id:token('g'),name,email:String(form.get('email')||'').trim().slice(0,160),householdId:String(form.get('householdId')||''),category:String(form.get('category')||'General'),plusOnesAllowed:number(form.get('plusOnesAllowed'),5),plusOnesConfirmed:0,status:'pending',answers:{}})))success('Guest added.')};
window.uriGuestsEdit=id=>{editing=id;notice='';eventPage()};
window.uriGuestsCancel=()=>{editing='';eventPage()};
window.uriGuestsUpdate=ev=>{ev.preventDefault();const fd=new FormData(ev.target),id=editing;const name=String(fd.get('name')||'').trim().slice(0,120);if(!name)return;
 if(persist(e=>{const g=e.guests.find(x=>x.id===id);if(!g)return;g.name=name;g.email=String(fd.get('email')||'').trim().slice(0,160);g.householdId=String(fd.get('householdId')||'');g.category=String(fd.get('category')||'General');g.plusOnesAllowed=number(fd.get('plusOnesAllowed'),5);g.plusOnesConfirmed=Math.min(g.plusOnesConfirmed,g.plusOnesAllowed)})){editing='';success('Guest updated.')}};
window.uriGuestsRemove=id=>{if(!confirm('Remove this guest and their local test response?'))return;if(persist(e=>{e.guests=e.guests.filter(x=>x.id!==id)})){editing='';success('Guest removed.')}};
window.uriHouseholdAdd=ev=>{ev.preventDefault();const fd=new FormData(ev.target),name=String(fd.get('household')||'').trim().slice(0,100);if(!name)return;const e=getEvent();if(e.households.some(h=>h.name.toLowerCase()===name.toLowerCase())){notice='That household already exists.';eventPage();return}
 if(persist(e=>e.households.push({id:token('h'),name,seatLimit:number(fd.get('seats'),50)})))success('Household created.')};
window.uriHouseholdRemove=id=>{const e=getEvent();if(e.guests.some(g=>g.householdId===id)){notice='Move the guests to another household before removing this one.';eventPage();return}if(persist(e=>{e.households=e.households.filter(h=>h.id!==id)}))success('Household removed.')};
window.uriGuestsCapacity=value=>{if(persist(e=>{e.rsvpSettings.capacity=number(value,10000)}))success('Guest capacity saved.')};
window.uriGuestsAddQuestion=ev=>{ev.preventDefault();const fd=new FormData(ev.target),label=String(fd.get('label')||'').trim().slice(0,120),type=fd.get('type')==='choice'?'choice':'text';const options=String(fd.get('options')||'').split('|').map(x=>x.trim()).filter(Boolean).slice(0,12);const e=getEvent();if(!label||e.rsvpSettings.questions.length>=12){notice='A maximum of 12 questions is supported.';eventPage();return}if(type==='choice'&&options.length<2){notice='Provide at least two choices separated by |.';eventPage();return}
 if(persist(e=>e.rsvpSettings.questions.push({id:token('q'),label,type,options,required:fd.has('required')})))success('Question added.')};
window.uriGuestsRemoveQuestion=i=>{if(persist(e=>{e.rsvpSettings.questions.splice(i,1)}))success('Question removed.')};
window.uriGuestsSearch=v=>{search=String(v||'').slice(0,100);eventPage()};
window.uriGuestsFilter=v=>{filter=statusSet.includes(v)?v:'all';eventPage()};
window.uriGuestsTest=id=>{const e=getEvent();if(!e?.guests.find(g=>g.id===id))return;location.hash='#invite/'+encodeURIComponent(e.id)+'.'+encodeURIComponent(id);render()};
function guestPage(input){
 const bits=String(input||'').split('.'),eventId=decodeURIComponent(bits[0]||''),guestId=decodeURIComponent(bits[1]||'');
 const e=state.events.find(x=>x.id===eventId&&x.type==='Wedding'),g=e?.guests.find(x=>x.id===guestId);
 if(!e||!g){app.innerHTML='<div class="wrap center"><h2>Test invitation unavailable</h2><p>This local guest invitation is not available in this browser.</p></div>';return}
 ensure(e);
 const h=household(e,g.householdId),u=usage(e);
 const questions=e.rsvpSettings.questions.map(q=>'<label class="uri-rsvp-question">'+T(q.label)+(q.required?' *':'')
  +(q.type==='choice'?'<select name="q_'+T(q.id)+'" '+(q.required?'required':'')+'><option value="">Choose an answer</option>'+q.options.map(x=>'<option value="'+T(x)+'" '+(g.answers[q.id]===x?'selected':'')+'>'+T(x)+'</option>').join('')+'</select>'
  :'<textarea name="q_'+T(q.id)+'" rows="2" maxlength="400" '+(q.required?'required':'')+'>'+T(g.answers[q.id]||'')+'</textarea>')+'</label>').join('');
 app.innerHTML='<main class="wrap uri-rsvp-test"><div class="uri-guests-warning"><strong>Same-browser RSVP preview only.</strong> This is not a secure invitation link. Responses are saved only in this browser.</div>'
  +'<div class="uri-rsvp-paper"><span class="eyebrow">A personal invitation</span><h1>'+T(g.name)+'</h1><p>You are invited to celebrate '+T([e.name1,e.name2].filter(Boolean).join(' & '))+'.</p><p>'+T(e.date?fmt(e.date):'Date to be announced')+' · '+T(e.venue||'Venue to be announced')+'</p>'
  +(h?'<p class="uri-rsvp-household">Household: '+T(h.name)+'</p>':'')
  +'<form onsubmit="uriGuestsRespond(event)"><input type="hidden" name="eventId" value="'+T(e.id)+'"><input type="hidden" name="guestId" value="'+T(g.id)+'">'
  +'<fieldset><legend>Will you join us?</legend><label><input type="radio" name="response" value="attending" '+(g.status==='attending'?'checked':'')+' required> Joyfully accepts</label><label><input type="radio" name="response" value="declined" '+(g.status==='declined'?'checked':'')+'> Regretfully declines</label></fieldset>'
  +(g.plusOnesAllowed?'<label>Additional guests (up to '+g.plusOnesAllowed+')<input name="plusOnes" type="number" min="0" max="'+g.plusOnesAllowed+'" value="'+g.plusOnesConfirmed+'"></label>':'')
  +'<div class="uri-rsvp-questions">'+questions+'</div><button class="btn primary" type="submit">Save test response</button></form>'
  +'<p class="uri-rsvp-footer">Seats confirmed: '+u.confirmed+(u.capacity?' / '+u.capacity:'')+' · Local demonstration only.</p></div></main>';
}
window.uriGuestsRespond=ev=>{
 ev.preventDefault();const fd=new FormData(ev.target),e=state.events.find(x=>x.id===fd.get('eventId')),g=e?.guests.find(x=>x.id===fd.get('guestId'));
 if(!e||!g)return;ensure(e);
 const response=fd.get('response');if(!['attending','declined'].includes(response))return;
 const plus=response==='attending'?number(fd.get('plusOnes'),g.plusOnesAllowed):0;
 const answers={};
 if(response==='attending')for(const q of e.rsvpSettings.questions){let value=String(fd.get('q_'+q.id)||'').trim().slice(0,400);if(q.required&&!value){alert('Please complete: '+q.label);return}if(q.type==='choice'&&value&&!q.options.includes(value)){alert('Choose a valid answer.');return}answers[q.id]=value}
 const other=e.guests.filter(x=>x!==g&&x.status==='attending');
 const current=other.reduce((n,x)=>n+1+number(x.plusOnesConfirmed,x.plusOnesAllowed),0);
 const total=current+(response==='attending'?1+plus:0);
 const cap=number(e.rsvpSettings.capacity,10000);
 if(cap&&total>cap){alert('This response would exceed the event capacity.');return}
 const h=household(e,g.householdId);
 if(h&&number(h.seatLimit,50)){
  const occupied=other.filter(x=>x.householdId===h.id).reduce((n,x)=>n+1+number(x.plusOnesConfirmed,x.plusOnesAllowed),0);
  if(occupied+(response==='attending'?1+plus:0)>number(h.seatLimit,50)){alert('This response exceeds the household seat limit.');return}
 }
 const old={status:g.status,plus:g.plusOnesConfirmed,answers:g.answers,at:g.respondedAt};
 g.status=response;g.plusOnesConfirmed=plus;g.answers=answers;g.respondedAt=Date.now();
 try{save();notice='Local test response saved.';guestPage(e.id+'.'+g.id)}catch(_){Object.assign(g,{status:old.status,plusOnesConfirmed:old.plus,answers:old.answers,respondedAt:old.at});alert('Unable to save this response in this browser.')}
};
function summary(e){ensure(e);const u=usage(e);return '<div class="uri-guests-summary"><strong>'+u.people+' guests</strong> · '+u.confirmed+' confirmed seats · '+u.pending+' pending<button type="button" class="btn small" onclick="tab=\'guests\';eventPage()">Manage guests →</button></div>'}
function csvCell(value){let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
window.uriGuestsExport=()=>{
 const e=getEvent();if(!e)return;
 const head=['Name','Email','Household','Category','Plus Ones Allowed','Plus Ones Confirmed','Status'];
 const records=e.guests.map(g=>[g.name,g.email||'',household(e,g.householdId)?.name||'',g.category||'',g.plusOnesAllowed,g.plusOnesConfirmed,g.status]);
 const csv=[head,...records].map(row=>row.map(csvCell).join(',')).join('\r\n');
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='uri-guests.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
};
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(!quoted&&c===','){row.push(cell);cell=''}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('Malformed CSV quote');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
window.uriGuestsImport=async ev=>{
 const file=ev.target.files?.[0];if(!file)return;
 try{
  if(file.size>1024*1024)throw Error('CSV must be smaller than 1 MB');
  const rows=parseCSV((await file.text()).replace(/^\ufeff/,''));
  if(rows.length<2)throw Error('CSV needs a header and at least one guest');
  const cols=rows.shift().map(x=>x.trim().toLowerCase());
  const nameIndex=cols.indexOf('name');if(nameIndex<0)throw Error('CSV must contain a Name column');
  const col=(row,key)=>row[cols.indexOf(key)]||'';
  const list=rows.slice(0,500).map(row=>({
   name:String(row[nameIndex]||'').trim().slice(0,120),
   email:String(col(row,'email')).trim().slice(0,160),
   household:String(col(row,'household')).trim().slice(0,100),
   category:String(col(row,'category')||'General').trim().slice(0,40),
   plus:number(col(row,'plus ones allowed')||0,5)
  })).filter(x=>x.name);
  if(!list.length)throw Error('No valid guest names found');
  const e=getEvent();if(e.guests.length+list.length>500)throw Error('Local prototype supports up to 500 guests');
  if(!persist(event=>{
   for(const item of list){
    let h=event.households.find(x=>x.name.toLowerCase()===item.household.toLowerCase());
    if(item.household&&!h){h={id:token('h'),name:item.household,seatLimit:0};event.households.push(h)}
    event.guests.push({id:token('g'),name:item.name,email:item.email,householdId:h?.id||'',category:item.category,plusOnesAllowed:item.plus,plusOnesConfirmed:0,status:'pending',answers:{}});
   }
  }))return;
  success(list.length+' guests imported for local planning.');
 }catch(err){notice=err.message;eventPage()}finally{ev.target.value=''}
};
window.URIGuests={ensure,panel,guestPage,summary,usage,parseCSV};
})();