/* Public RSVP 1.0 — bearer-token access without exposing the private guest list.
   Every lookup and response is validated again by the Supabase server. */
(function(){
'use strict';
let activeToken='',activeInvite=null,submitting=false;
const T=v=>esc(v==null?'':String(v));
const client=()=>window.URICloud?.client?.();
function unavailable(reason='This invitation may be unpublished, revoked, or unavailable.'){
 app.innerHTML='<main class="wrap uri-online-rsvp"><div class="uri-rsvp-paper"><h2>Invitation unavailable</h2><p>'+T(reason)+'</p><p><a href="#home">Back to URI</a></p></div></main>';
}
function formMarkup(v){
 const questions=Array.isArray(v.questions)?v.questions.slice(0,12):[];
 const options=questions.map(q=>{
  if(!q||typeof q!=='object'||!String(q.id||'').match(/^[a-z0-9-]{1,64}$/i))return '';
  const required=q.required===true?' required':'';
  const label='<span>'+T(q.label||'Question')+(q.required?' *':'')+'</span>';
  const previous=String(v.answers?.[q.id]||'');
  if(q.type==='choice'){
   const opts=Array.isArray(q.options)?q.options.slice(0,12):[];
   return '<label class="uri-rsvp-question">'+label+'<select name="q_'+T(q.id)+'"'+required+'><option value="">Choose one</option>'+
    opts.map(x=>'<option value="'+T(x)+'"'+(String(x)===previous?' selected':'')+'>'+T(x)+'</option>').join('')+'</select></label>';
  }
  return '<label class="uri-rsvp-question">'+label+'<textarea name="q_'+T(q.id)+'" maxlength="400" rows="2"'+required+'>'+T(previous)+'</textarea></label>';
 }).join('');
 const plus=Math.min(5,Math.max(0,Number(v.plusOnesAllowed)||0));
 return '<main class="wrap uri-online-rsvp"><div class="uri-rsvp-paper"><p class="eyebrow">Personal invitation</p>'+
  '<h1>'+T(v.name)+'</h1><p>You are invited to celebrate <strong>'+T(v.eventName)+'</strong>.</p>'+
  '<p>'+T(v.date||'Date to be announced')+(v.venue?' · '+T(v.venue):'')+'</p>'+
  (v.deadline?'<p class="uri-rsvp-deadline">RSVP by '+T(v.deadline)+'</p>':'')+
  '<form id="uriOnlineRsvpForm" onsubmit="uriOnlineRSVPSubmit(event)"><fieldset><legend>Will you attend?</legend>'+
  '<label><input type="radio" name="response" value="attending" required'+(v.status==='attending'?' checked':'')+'> Joyfully accepts</label>'+
  '<label><input type="radio" name="response" value="declined"'+(v.status==='declined'?' checked':'')+'> Regretfully declines</label></fieldset>'+
  (plus?'<label class="uri-online-plus">Additional guests (maximum '+plus+')<input name="plusOnes" type="number" min="0" max="'+plus+'" value="'+Math.min(plus,Math.max(0,Number(v.plusOnesConfirmed)||0))+'"></label>':'')+
  '<div class="uri-rsvp-questions">'+options+'</div>'+
  '<button type="submit" class="btn primary">Save RSVP</button></form>'+
  '<p class="uri-online-status" id="uriOnlineRsvpStatus" role="status" aria-live="polite"></p>'+
  '<p class="uri-online-private">This personal link may be used to update your response. Keep it private.</p></div></main>';
}
window.uriCloudOpenRSVP=async function(token){
 activeToken=String(token||'').trim().toLowerCase();activeInvite=null;
 if(!/^[a-f0-9]{64}$/.test(activeToken)){unavailable();return}
 const c=client();if(!c){unavailable('Online RSVP is not configured.');return}
 app.innerHTML='<div class="wrap center"><h2>Opening your invitation</h2><p>Loading RSVP details…</p></div>';
 const lookupToken=activeToken;
 try{
  const {data,error}=await c.rpc('uri_rsvp_lookup',{p_token:lookupToken});
  if(error)throw error;
  if(location.hash!=='#rsvp/'+lookupToken)return;
  if(!data){unavailable();return}
  activeInvite=data;app.innerHTML=formMarkup(data);
 }catch(err){unavailable('Unable to load your RSVP. Please check the link or try again.')}
};
window.uriOnlineRSVPSubmit=async ev=>{
 ev.preventDefault();
 if(submitting||!activeInvite||!activeToken)return;
 const f=new FormData(ev.target),response=f.get('response');
 if(!['attending','declined'].includes(response))return;
 const plus=response==='attending'?Math.max(0,Number(f.get('plusOnes')||0)):0;
 const answers={};
 if(response==='attending'){
  for(const q of (activeInvite.questions||[])){
   if(!q?.id)continue;
   answers[q.id]=String(f.get('q_'+q.id)||'').trim().slice(0,400);
  }
 }
 const status=document.getElementById('uriOnlineRsvpStatus'),button=ev.target.querySelector('[type=submit]');
 submitting=true;if(button)button.disabled=true;
 if(status)status.textContent='Saving your RSVP…';
 try{
  const {data,error}=await client().rpc('uri_rsvp_respond',
    {p_token:activeToken,p_response:response,p_plus_ones:plus,p_answers:answers});
  if(error)throw error;
  activeInvite={...activeInvite,status:response,plusOnesConfirmed:data.plusOnesConfirmed,answers};
  if(status)status.textContent='Your RSVP was saved. You can return to this link to update your response.';
 }catch(err){if(status)status.textContent='Unable to save RSVP: '+(err.message||'Please try again.')}
 finally{submitting=false;if(button)button.disabled=false}
};
window.uriCloudGuestCopy=async id=>{
 const e=current(),g=e?.guests?.find(x=>x.id===id);
 if(!e||!g)return;
 if(!window.URICloudDrafts?.getUser()){alert('Sign in under Cloud to enable cross-device RSVP.');location.hash='#cloud';render();return}
 if(!e.cloudPublished||!e.cloudSlug){alert('Publish this invitation before sharing online RSVP links.');return}
 try{
  await window.URICloudDrafts.flushCurrent();
  if(!/^[a-f0-9]{64}$/.test(g.onlineToken||''))throw Error('The secure guest link is not ready. Sync again.');
  const game=window.URIBuilder?.baseTemplate?.(e)==='adventure';
  const route=game?'#public/'+encodeURIComponent(e.cloudSlug)+'?rsvp='+g.onlineToken:'#rsvp/'+g.onlineToken;
  const url=location.origin+location.pathname+route;
  if(navigator.clipboard&&window.isSecureContext){
   try{await navigator.clipboard.writeText(url);alert('Personal online RSVP link copied. Share only with this guest.');return}catch(_){}
  }
  prompt('Copy this personal RSVP link:',url);
 }catch(err){alert('Could not create the guest link: '+(err.message||'Please retry.'))}
};
const oldRender=render;
render=function(){
 const path=location.hash.slice(1);
 if(path.startsWith('rsvp/')){
  window.__uriLastRenderedHash=location.hash;
  return window.uriCloudOpenRSVP(path.slice(5));
 }
 return oldRender();
};
if(location.hash.startsWith('#rsvp/'))render();
})();