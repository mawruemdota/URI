/* URI Event Operations — invitation tracking, check-in, cohosts, event analytics.
 * Security boundaries are server-side Supabase RPCs and RLS policies. */
(function(){
'use strict';
const T=v=>esc(v==null?'':String(v));
const api=()=>window.URICloud?.client?.()||null;
const who=()=>window.URICloudDrafts?.getUser?.()||null;
const key=(owner,eventId)=>owner+'/'+eventId;
const names=new Map(),attendance=new Map();
let scanStream=null,scanFrame=0,scanBusy=false;
const number=v=>Math.max(0,Math.floor(Number(v)||0));
const ownerOf=e=>e?e._uriCloudOwnerId||who()?.id||'':'';
const emailValid=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||''));
const timeString=v=>v?new Date(v).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const setText=(id,text)=>{const n=document.getElementById(id);if(n)n.textContent=text};
const activeGuestList=e=>Array.isArray(e?.guests)?e.guests:[];
const calc=e=>{
 const all=activeGuestList(e),pending=all.filter(x=>x.status==='pending').length;
 const accepted=all.filter(x=>x.status==='attending').length,declined=all.filter(x=>x.status==='declined').length;
 const sent=all.filter(x=>x.inviteSentAt).length,reminded=all.filter(x=>x.reminderAt).length;
 const seats=all.filter(x=>x.status==='attending').reduce((n,g)=>n+1+number(g.plusOnesConfirmed),0);
 const checked=attendance.get(key(ownerOf(e),e.id))||[];
 return {total:all.length,pending,accepted,declined,sent,reminded,seats,checked:checked.length};
};
function progress(e){
 const n=calc(e),percent=n.total?Math.round(100*(n.accepted+n.declined)/n.total):0;
 return '<section class="uri-ops-progress" aria-label="Event progress">'
 +[['Invited',n.total],['Sent',n.sent],['RSVP replies',n.accepted+n.declined],['Accepted',n.accepted],['Confirmed seats',n.seats],['Checked in',n.checked]]
 .map(([label,val])=>'<div><strong>'+val+'</strong><span>'+label+'</span></div>').join('')
 +'</section><div class="uri-ops-bar" role="progressbar" aria-label="RSVP response rate" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><span style="width:'+percent+'%"></span></div>'
 +'<p class="uri-ops-note">'+percent+'% response rate · '+n.pending+' still awaiting RSVP. Invitation sending and reminders are tracked manually; URI does not send messages automatically.</p>';
}
const actionButton=(id,label,handler)=>'<button class="btn small" type="button" onclick="'+handler+'(\''+T(id)+'\')">'+label+'</button>';
function guestTools(e){
 const people=activeGuestList(e),n=calc(e);
 return '<section class="uri-ops-panel" id="uriGuestProgress"><h3>Invitation delivery & follow-ups</h3><p>Track who received their invitation and who needs a manual reminder. Use the secure personal link for guest responses.</p>'
 +'<div class="uri-ops-summary"><strong>'+n.sent+' / '+n.total+'</strong><span>invitations marked sent</span><strong>'+n.pending+'</strong><span>pending responses</span></div>'
 +(people.length?'<div class="uri-ops-list">'+people.map(g=>'<div class="uri-ops-guest" data-guest-id="'+T(g.id)+'"><div><strong>'+T(g.name)+'</strong><small>'+T(g.status)+' · '+(g.inviteSentAt?'Sent '+T(timeString(g.inviteSentAt)):'Not marked sent')+(g.reminderAt?' · Reminded '+T(timeString(g.reminderAt)):'')+'</small></div><div class="uri-ops-row-actions">'
 +actionButton(g.id,'Mark sent','uriOpsMarkSent')
 +(g.status==='pending'?actionButton(g.id,'Mark reminded','uriOpsMarkReminder'):'')
 +'<button type="button" class="btn small" onclick="uriShareGuestPass(this.closest(\'.uri-ops-guest\').dataset.guestId)" '+(!e._uriCloudRevision?'disabled title="Save the event to cloud first"':'')+'>Guest QR pass</button></div></div>).join('')+'</div>'
 :'<p>Add guests above to track delivery and create individual check-in passes.</p>')
 +'</section>';
}
function editGuest(id,prop){
 const e=current(),g=e?.guests?.find(x=>String(x.id)===String(id));
 if(!g)return;
 const before=g[prop];g[prop]=Date.now();
 try{if(!window.URIBuilder?.persist?.())throw Error('Unable to save');eventPage()}
 catch(err){g[prop]=before;alert(err.message)}
}
window.uriOpsMarkSent=id=>editGuest(id,'inviteSentAt');
window.uriOpsMarkReminder=id=>editGuest(id,'reminderAt');
async function checkins(owner,eventId){
 const c=api();if(!c||!who())return [];
 const {data,error}=await c.from('uri_guest_checkins').select('guest_id,checked_in_at,checked_in_by')
 .eq('owner_id',owner).eq('local_event_id',eventId);
 if(error)throw error;
 const rows=data||[];attendance.set(key(owner,eventId),rows);
 return rows;
}
window.uriOpsRefreshAttendance=async()=>{
 const e=current();if(!e)return;
 try{await checkins(ownerOf(e),e.id);eventPage()}
 catch(err){setText('uriOpsMessage','Unable to load attendance: '+(err.message||'Please try again.'))}
};
function staffPanel(owner,eventId,e){
 const c=attendance.get(key(owner,eventId))||[];
 const roster=e?activeGuestList(e):[];
 return '<section class="uri-ops-panel" id="uriCheckinPanel">'
 +'<h3>QR guest check-in</h3><p>Event staff must sign in. Scan an individual guest pass to record arrival. Each pass is unique to this event and repeated scans do not create duplicate attendance.</p>'
 +'<div class="uri-ops-summary"><strong>'+c.length+'</strong><span>guests checked in</span><strong>'+roster.length+'</strong><span>guests on local roster</span></div>'
 +'<div class="uri-ops-actions"><button type="button" class="btn primary" onclick="uriOpsStartScan()">Start QR camera</button><button type="button" class="btn" onclick="uriOpsStopScan()">Stop camera</button>'
 +'<button type="button" class="btn" onclick="uriOpsReloadStaff()">Refresh attendance</button></div>'
 +'<video id="uriCheckinVideo" class="uri-ops-camera" playsinline muted hidden></video>'
 +'<form class="uri-ops-code" onsubmit="uriOpsCheckin(event)"><label>Paste or scan guest QR pass<input name="code" aria-label="QR pass content" autocomplete="off" placeholder="Paste code from the guest QR pass" required></label><button type="submit" class="btn primary">Check in</button></form>'
 +'<p id="uriOpsMessage" role="status" aria-live="polite"></p>'
 +(c.length?'<div class="uri-ops-attendance"><h4>Recorded arrivals</h4><div class="uri-ops-list">'+c.slice().sort((a,b)=>String(b.checked_in_at).localeCompare(String(a.checked_in_at))).slice(0,40).map(x=>'<div><strong>'+T(roster.find(g=>String(g.id)===x.guest_id)?.name||'Guest '+String(x.guest_id).slice(0,10))+'</strong><small>'+T(timeString(x.checked_in_at))+'</small></div>').join('')+'</div></div>':'<p class="uri-ops-note">No arrivals recorded yet.</p>')
 +'</section>';
}
window.uriOpsStopScan=()=>{
 if(scanFrame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(scanFrame);
 scanFrame=0;scanBusy=false;
 if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}
 const video=document.getElementById('uriCheckinVideo');
 if(video){video.pause?.();video.srcObject=null;video.hidden=true}
};
window.uriOpsStartScan=async()=>{
 if(!navigator.mediaDevices?.getUserMedia||!window.BarcodeDetector){setText('uriOpsMessage','Camera QR scanning is not supported in this browser. Use the code field below or another QR scanner to paste the pass.');return}
 if(scanStream)return;
 const video=document.getElementById('uriCheckinVideo');
 if(!video)return;
 try{
  scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
  video.srcObject=scanStream;video.hidden=false;await video.play();
  const detector=new BarcodeDetector({formats:['qr_code']});
  async function frame(){
   if(!scanStream||scanBusy)return;
   try{
    const found=await detector.detect(video);
    if(found.length&&found[0].rawValue){
     scanBusy=true;window.uriOpsStopScan();
     const input=document.querySelector('#uriCheckinPanel [name=code]');
     if(input)input.value=found[0].rawValue;
     setText('uriOpsMessage','QR detected. Select Check in to confirm this guest.');
     return;
    }
   }catch(_){}
   if(scanStream)scanFrame=requestAnimationFrame(frame);
  }
  scanFrame=requestAnimationFrame(frame);
 }catch(err){window.uriOpsStopScan();setText('uriOpsMessage','Camera unavailable: '+(err.message||'Permission denied.'))}
};
function currentStaff(){
 if(location.hash.startsWith('#ops-checkin/')){
  const parts=location.hash.slice('#ops-checkin/'.length).split('/');
  if(parts.length!==2||!/^[a-f0-9-]{36}$/.test(parts[0]))return null;
  const eventId=decodeURIComponent(parts[1]);
  if(!/^[a-zA-Z0-9-]{1,100}$/.test(eventId))return null;
  return {owner:parts[0],eventId,e:null};
 }
 const e=current();if(!e||e.type!=='Wedding')return null;
 return {owner:ownerOf(e),eventId:e.id,e};
}
window.uriOpsCheckin=async ev=>{
 ev.preventDefault();
 const staff=currentStaff(),c=api();if(!staff||!c)return;
 const input=ev.target.elements.code;
 const raw=String(input?.value||'').trim();
 const match=/^uri-checkin\|v1\|([a-f0-9-]{36})\|([a-zA-Z0-9-]{1,100})\|([a-f0-9]{64})$/.exec(raw);
 if(!match||match[1]!==staff.owner||match[2]!==staff.eventId){
  setText('uriOpsMessage','This is not a valid guest pass for the selected event.');return;
 }
 const button=ev.target.querySelector('[type=submit]');
 if(button)button.disabled=true;setText('uriOpsMessage','Verifying pass…');
 try{
  const {data,error}=await c.rpc('uri_checkin_guest',{p_owner_id:staff.owner,p_event_id:staff.eventId,p_code:match[3]});
  if(error)throw error;
  input.value='';
  await checkins(staff.owner,staff.eventId);
  if(staff.e){eventPage()}else{app.innerHTML=staffView(staff.owner,staff.eventId)}
  setText('uriOpsMessage',(data.alreadyCheckedIn?'Already checked in: ':'Checked in: ')+data.name);
 }catch(err){setText('uriOpsMessage','Check-in unsuccessful: '+(err.message||'Unable to verify guest pass.'))}
 finally{if(button)button.disabled=false}
};
window.uriOpsReloadStaff=async()=>{
 const s=currentStaff();if(!s)return;
 try{await checkins(s.owner,s.eventId);if(s.e)eventPage();else app.innerHTML=staffView(s.owner,s.eventId)}
 catch(err){setText('uriOpsMessage','Attendance refresh failed: '+err.message)}
};
function staffView(owner,eventId){
 return '<div class="wrap uri-ops-page"><div class="actions"><button class="btn" onclick="route(\'cloud\')">Back to Cloud</button></div><h2>Event check-in</h2><p>Event '+T(eventId)+' · authenticated event staff only.</p>'+staffPanel(owner,eventId,null)+'</div>';
}
function permission(e){const u=who();return !e._uriCloudOwnerId||u?.id===e._uriCloudOwnerId?'owner':e._uriCloudRole||'viewer'}
function memberSection(e){
 const owner=permission(e)==='owner';
 return '<section class="uri-ops-panel"><h3>Collaborators & event staff</h3>'
 +(owner?'<p>Invite another URI account to manage event details and RSVPs, or grant check-in-only access. The recipient must first sign in to URI with the email address below.</p>'
 +'<form class="uri-ops-code" onsubmit="uriOpsInvite(event)"><label>Cohost email<input name="email" type="email" required maxlength="254" placeholder="cohost@example.com"></label>'
 +'<label>Role<select name="role"><option value="editor">Editor — manage invitation and guests</option><option value="checkin">Check-in staff — scan guest passes</option></select></label>'
 +'<button class="btn primary" type="submit">Invite cohost</button></form>':'<p>You have accepted editor access. The event owner retains publishing and collaborator controls.</p>')
 +'<p id="uriOpsCohostMessage" role="status"></p><div id="uriOpsMemberList"><p class="uri-ops-note">Sign in and save this invitation in the cloud to manage cohosts.</p></div></section>';
}
async function listMembers(e){
 const c=api(),u=who();if(!c||!u||!e)return;
 const owner=ownerOf(e);
 if(!e._uriCloudRevision){setText('uriOpsCohostMessage','Save your event to the cloud before inviting cohosts.');return}
 const {data,error}=await c.from('uri_event_members').select('member_id,member_email,role,accepted_at,invited_at')
  .eq('owner_id',owner).eq('local_event_id',e.id);
 if(error){setText('uriOpsCohostMessage','Unable to load cohosts: '+error.message);return}
 const list=document.getElementById('uriOpsMemberList');
 if(!list)return;
 list.innerHTML=!data?.length?'<p class="uri-ops-note">No collaborators invited.</p>'
 :'<div class="uri-ops-list">'+data.map(m=>'<div class="uri-ops-member"><div><strong>'+T(m.member_id.slice(0,8))+'…</strong><small>'+T(m.role)+' · '+(m.accepted_at?'Accepted':'Awaiting acceptance')+'</small></div>'
 +(permission(e)==='owner'?'<button class="btn small" onclick="uriOpsRemoveCohost(\''+T(m.member_id)+'\')">Remove</button>':'')+'</div>').join('')+'</div>';
}
window.uriOpsInvite=async ev=>{
 ev.preventDefault();const e=current(),c=api(),u=who();
 if(!e||!c||!u){setText('uriOpsCohostMessage','Sign in under Cloud first.');return}
 if(e._uriCloudOwnerId&&e._uriCloudOwnerId!==u.id){setText('uriOpsCohostMessage','Only the event owner can invite cohosts.');return}
 const fd=new FormData(ev.target),email=String(fd.get('email')||'').trim().toLowerCase(),role=String(fd.get('role')||'editor');
 if(!emailValid(email))return;
 if(!e._uriCloudRevision){setText('uriOpsCohostMessage','Save this event to the cloud first.');return}
 try{
  const {error}=await c.rpc('uri_invite_cohost',{p_event_id:e.id,p_email:email,p_role:role});
  if(error)throw error;
  setText('uriOpsCohostMessage','Invitation created. Ask '+email+' to sign in to URI and accept it from Cloud.');
  await listMembers(e);
 }catch(err){setText('uriOpsCohostMessage','Unable to invite: '+(err.message||'Try again.'))}
};
window.uriOpsRemoveCohost=async memberId=>{
 const e=current(),c=api();if(!e||!c||!confirm('Revoke this collaborator’s access to the event?'))return;
 const {error}=await c.rpc('uri_remove_cohost',{p_event_id:e.id,p_member_id:memberId});
 if(error)setText('uriOpsCohostMessage','Unable to revoke: '+error.message);
 else{setText('uriOpsCohostMessage','Access revoked.');await listMembers(e)}
};
async function memberInvites(){
 const c=api();if(!c)return [];
 const {data,error}=await c.from('uri_event_members').select('owner_id,local_event_id,role,accepted_at,invited_at').order('invited_at',{ascending:false});
 if(error)throw error;
 return data||[];
}
async function cloudMembers(){
 const el=document.getElementById('uriOpsCloudMembers');if(!el)return;
 try{
  const c=api(),{data}=await c.auth.getUser();
  if(!data?.user){el.innerHTML='<p>Sign in to view invitations from other event organizers.</p>';return}
  const invites=(await memberInvites()).filter(m=>m.owner_id!==data.user.id);
  el.innerHTML=invites.length?'<div class="uri-ops-list">'+invites.map(m=>'<div class="uri-ops-member"><div><strong>'+T(m.role==='editor'?'Event editor':'Check-in staff')+'</strong><small>Event '+T(m.local_event_id)+' · '+(m.accepted_at?'Accepted':'Invitation pending')+'</small></div><div class="uri-ops-row-actions">'
   +(m.accepted_at?'<button type="button" class="btn small" onclick="uriOpsOpenShared(\''+T(m.owner_id)+'\',\''+T(m.local_event_id)+'\',\''+T(m.role)+'\')">Open</button>'
    :'<button type="button" class="btn primary small" onclick="uriOpsAccept(\''+T(m.owner_id)+'\',\''+T(m.local_event_id)+'\')">Accept invitation</button>')
   +'<button type="button" class="btn small" onclick="uriOpsLeave(\''+T(m.owner_id)+'\',\''+T(m.local_event_id)+'\')">Leave</button></div></div>').join('')+'</div>'
   :'<p>No cohost invitations for this account.</p>';
 }catch(err){el.innerHTML='<p>Unable to load collaborator invitations: '+T(err.message)+'</p>'}
}
window.uriOpsAccept=async(owner,eventId)=>{
 const c=api(),{error}=await c.rpc('uri_accept_cohost',{p_owner_id:owner,p_event_id:eventId});
 if(error){alert(error.message);return}
 await window.URICloudDrafts?.pull?.(true);
 await cloudMembers();
};
window.uriOpsLeave=async(owner,eventId)=>{
 if(!confirm('Leave this shared event and lose access?'))return;
 const {error}=await api().rpc('uri_leave_cohost',{p_owner_id:owner,p_event_id:eventId});
 if(error){alert(error.message);return}
 await window.URICloudDrafts?.pull?.(true);await cloudMembers();
};
window.uriOpsOpenShared=async(owner,eventId,role)=>{
 if(role==='checkin'){location.hash='#ops-checkin/'+owner+'/'+encodeURIComponent(eventId);render();await checkins(owner,eventId).then(()=>render()).catch(()=>{});return}
 await window.URICloudDrafts?.pull?.(true);
 const e=state.events.find(e=>e.id===eventId&&e._uriCloudOwnerId===owner);
 if(!e){alert('Shared event not yet available. Try Restore cloud copies.');return}
 state.current=e.id;tab='operations';save();route('event');
};
function opsPanel(e){
 const o=ownerOf(e);
 Promise.resolve().then(()=>{listMembers(e);checkins(o,e.id).then(()=>{const n=document.getElementById('uriOpsLiveCount');if(n)n.textContent=String((attendance.get(key(o,e.id))||[]).length)}).catch(()=>{})});
 return '<div class="uri-ops-main"><h2>Event operations</h2><p>Manage invitations, event staff, and guest arrivals from one place.</p>'
 +progress(e)+window.URIShare?.panel?.(e)
 +'<div class="uri-ops-panel"><strong id="uriOpsLiveCount">'+(attendance.get(key(o,e.id))||[]).length+'</strong> attendees checked in on this account’s event.</div>'
 +staffPanel(o,e.id,e)
 +memberSection(e)+'</div>';
}
const oldEventPage=eventPage;
eventPage=function(){
 const e=current();if(tab!=='operations')window.uriOpsStopScan();
 oldEventPage();
 if(!e||e.type!=='Wedding'||!app.querySelector('.workspace'))return;
 const side=app.querySelector('.workspace .sidebar'),main=app.querySelector('.workspace>div:last-child');
 if(side&&!side.querySelector('[data-uri-ops-tab]')){
  const btn=document.createElement('button');btn.type='button';btn.textContent='Event operations';
  btn.dataset.uriOpsTab='1';btn.className=tab==='operations'?'active':'';
  btn.onclick=()=>{tab='operations';eventPage()};side.appendChild(btn);
 }
 if(!main)return;
 if(tab==='operations')main.innerHTML=opsPanel(e);
 else if(tab==='overview')main.insertAdjacentHTML('beforeend',progress(e));
 else if(tab==='share')main.insertAdjacentHTML('beforeend',window.URIShare?.panel?.(e)||'');
};
const oldGuestPanel=window.URIGuests?.panel;
if(oldGuestPanel)window.URIGuests.panel=e=>oldGuestPanel(e)+guestTools(e);
const oldAnalytics=window.URIGuests?.analytics;
if(oldAnalytics)window.URIGuests.analytics=e=>progress(e)+oldAnalytics(e);
const oldDashboard=dashboard;
dashboard=function(){
 oldDashboard();
 const el=app.querySelector('.uri-dash-heading');
 if(el){
  const events=(state.events||[]).filter(e=>e.type==='Wedding'&&(!e._uriCloudOwnerId||e._uriCloudOwnerId===who()?.id||e._uriCloudRole==='editor'));
  const invited=events.reduce((n,e)=>n+activeGuestList(e).length,0);
  const pending=events.reduce((n,e)=>n+activeGuestList(e).filter(g=>g.status==='pending').length,0);
  el.insertAdjacentHTML('afterend','<div class="uri-ops-dashboard-metrics"><span><strong>'+invited+'</strong> guests across invitations</span><span><strong>'+pending+'</strong> awaiting RSVP</span></div>');
 }
};
const oldRender=render;
render=function(){
 if(location.hash.startsWith('#ops-checkin/')){
  window.uriOpsStopScan();
  const staff=currentStaff();
  app.innerHTML=staff?staffView(staff.owner,staff.eventId):'<div class="wrap"><p>Invalid check-in event.</p></div>';
  return;
 }
 const result=oldRender();
 if(location.hash==='#cloud'){
  app.insertAdjacentHTML('beforeend','<div class="wrap uri-ops-cloud"><section class="uri-ops-panel"><h3>Invitations to cohost</h3><p>Accept a private invitation from another organizer to edit their event or help with QR check-in.</p><div id="uriOpsCloudMembers">Loading invitations…</div></section></div>');
  cloudMembers();
 }
 return result;
};
window.addEventListener?.('hashchange',()=>{if(!location.hash.startsWith('#event')&&!location.hash.startsWith('#ops-checkin/'))window.uriOpsStopScan()});
window.URIEventOps={calc,progress,checkins,guestTools,staffPanel,memberInvites};
})();