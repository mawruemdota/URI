/* URI Cloud Drafts 1.0
   Owner-scoped, versioned drafts. Local editing stays usable while offline.
   Guest tokens are generated with WebCrypto and never put in public publication payloads. */
(function(){
'use strict';
const U=window.URIBuilder;
const stateKey='uri-prototype-v1';
if(!U)return;
let user=null,dirty=new Set(),timer=0,working=false,flushPromise=null,loading=false,conflicts=new Set(),message='',initialized=false;
const editEpoch=new Map();
const out=v=>esc(v==null?'':String(v));
const client=()=>window.URICloud?.client?.()||null;
const local=()=>Array.isArray(state.events)?state.events:[];
const store=()=>{try{localStorage.setItem(stateKey,JSON.stringify(state))}catch(_){}};
function stamp(messageText){message=messageText;const n=document.getElementById('uriDraftStatus');if(n)n.textContent=message;const s=document.getElementById('wbSaveState');if(s&&user)s.textContent=message;}
function randomToken(){
 if(!window.crypto?.getRandomValues)throw Error('Secure invitation links require HTTPS.');
 const bytes=new Uint8Array(32);window.crypto.getRandomValues(bytes);
 return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
}
async function sha256(v){
 if(!window.crypto?.subtle?.digest)throw Error('Secure hashing is not available in this browser.');
 const bytes=new TextEncoder().encode(v);
 return Array.from(new Uint8Array(await window.crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
}
function ensureGuestTokens(e){
 let changed=false;
 if(!Array.isArray(e.guests))e.guests=[];
 for(const guest of e.guests){
  if(!/^[a-f0-9]{64}$/.test(String(guest.onlineToken||''))){
   guest.onlineToken=randomToken();changed=true;
  }
 }
 if(changed)store();
}
async function syncGuests(c,e){
 const rows=[];
 for(const g of e.guests||[]){
  if(!g?.id||!g.name)continue;
  rows.push({
   guest_id:String(g.id),
   token_hash:await sha256(g.onlineToken),name:String(g.name).slice(0,120),
   email:String(g.email||'').slice(0,160),
   household_id:String(g.householdId||'').slice(0,100),
   plus_ones_allowed:Math.max(0,Math.min(5,Number(g.plusOnesAllowed)||0))
  });
 }
 const {error:syncError}=await c.rpc('uri_sync_guest_tokens',{p_event_id:e.id,p_guests:rows});
 if(syncError)throw syncError;
 await cloudGuestRefresh(e);
}

async function saveEvent(e,c){
 if(!user||!e||e.type!=='Wedding')return;
 if(e._uriCloudOwnerId&&e._uriCloudOwnerId!==user.id)throw Error('This draft belongs to a different cloud account.');
 ensureGuestTokens(e);
 const epoch=editEpoch.get(e.id)||0;
 const revision=Number(e._uriCloudRevision)||0;
 const payload=JSON.parse(JSON.stringify(e));
 delete payload._uriCloudRevision;delete payload._uriCloudSyncedAt;delete payload._uriCloudOwnerId;
 // Guard against oversized local data URL uploads; the server has the same limit.
 if(JSON.stringify(payload).length>7900000)throw Error('This invitation exceeds cloud draft size. Reduce the number or size of photos.');
 const {data,error}=await c.rpc('uri_save_draft',{p_event_id:e.id,p_payload:payload,p_revision:revision});
 if(error){if(/conflict/i.test(error.message))conflicts.add(e.id);throw error}
 e._uriCloudRevision=Number(data);
 e._uriCloudOwnerId=user.id;
 e._uriCloudSyncedAt=new Date().toISOString();
 await syncGuests(c,e);
 if((editEpoch.get(e.id)||0)===epoch){dirty.delete(e.id);e._uriCloudPending=false}
 else e._uriCloudPending=true;
 conflicts.delete(e.id);store();
}
async function flush(){
 if(working){if(flushPromise)await flushPromise;
  if([...dirty].some(id=>!conflicts.has(id)))return flush();return;
 }
 if(!user||!dirty.size)return;
 const c=client();if(!c)return;
 working=true;
 let release;flushPromise=new Promise(resolve=>{release=resolve});
 try{
  for(const id of [...dirty]){
   const e=local().find(x=>x.id===id);
   if(!e){dirty.delete(id);continue}
   if(e._uriCloudOwnerId&&e._uriCloudOwnerId!==user.id){dirty.delete(id);stamp('A local draft belongs to another account and was not uploaded.');continue}
   if(conflicts.has(id))continue;
   try{await saveEvent(e,c)}catch(err){stamp('Cloud sync failed: '+(err.message||'Please retry.'));continue}
  }
  if(!dirty.size)stamp('Saved on this device and in your cloud account.');
 }finally{working=false;release();flushPromise=null}
}
function queueSave(){
 const e=current();if(!e?.id||e.type!=='Wedding')return;
 if(!user){if(e._uriCloudOwnerId){e._uriCloudPending=true;store()}return}
 if(e._uriCloudOwnerId&&e._uriCloudOwnerId!==user.id){stamp('Draft belongs to another account; sync blocked.');return}
 e._uriCloudPending=true;store();dirty.add(e.id);
 editEpoch.set(e.id,(editEpoch.get(e.id)||0)+1);
 stamp('Saved locally · Syncing to cloud…');
 if(timer)clearTimeout(timer);
 timer=setTimeout(flush,1200);
}
async function cloudGuestRefresh(e){
 const c=client();if(!user||!e)return;
 const {data,error}=await c.from('uri_guest_tokens')
  .select('guest_id,status,plus_ones_confirmed,answers,responded_at')
  .eq('owner_id',user.id).eq('local_event_id',e.id);
 if(error)throw error;
 for(const row of data||[]){
  const g=e.guests?.find(x=>String(x.id)===row.guest_id);if(!g)continue;
  g.status=row.status;g.plusOnesConfirmed=row.plus_ones_confirmed;
  g.answers=row.answers||{};g.respondedAt=row.responded_at?Date.parse(row.responded_at):undefined;
 }
 store();
}
async function pull(force=false){
 if(!user||loading)return 0;
 const c=client();if(!c)return 0;loading=true;
 try{
  const {data,error}=await c.from('uri_drafts')
    .select('local_event_id,payload,revision,updated_at').eq('owner_id',user.id)
    .order('updated_at',{ascending:false});
  if(error)throw error;
  let count=0,skipped=0;
  for(const row of data||[]){
   const incoming=row.payload;
   if(!incoming||incoming.id!==row.local_event_id||incoming.type!=='Wedding')continue;
   const i=local().findIndex(e=>e.id===row.local_event_id);
   const old=i>=0?local()[i]:null;
   if(old&&old._uriCloudOwnerId&&old._uriCloudOwnerId!==user.id){skipped++;continue}
   if(old&&!force&&(old._uriCloudPending||dirty.has(old.id)||
      ((!old._uriCloudRevision||Number(old._uriCloudRevision)===0)&&i>=0&&
       !old._uriCloudSyncedAt)||Number(old._uriCloudRevision)>Number(row.revision))){skipped++;continue}
   if(old&&Number(old._uriCloudRevision)===Number(row.revision)&&!force)continue;
   const next={...incoming,_uriCloudRevision:Number(row.revision),_uriCloudOwnerId:user.id,_uriCloudSyncedAt:row.updated_at};
   if(i>=0)state.events[i]=next;else state.events.push(next);
   await cloudGuestRefresh(next);
   dirty.delete(next.id);conflicts.delete(next.id);count++;
  }
  store();
  if(count&&['#dashboard','#cloud','#event'].includes(location.hash))render();
  stamp(count?'Restored '+count+' cloud invitation'+(count===1?'':'s')+'.':
    skipped?'Some local drafts differ from the cloud copy. Use Restore cloud copies to replace them.':'Cloud drafts are up to date.');
  return count;
 }catch(err){stamp('Cloud restore failed: '+(err.message||'Network error.'));return 0}
 finally{loading=false}
}
async function deleteDraft(e){
 if(!e||!e.id||!e._uriCloudRevision)return;
 if(!user)await signedIn();
 if(!user)throw Error('Sign in to remove a cloud-saved invitation.');
 if(e._uriCloudOwnerId&&e._uriCloudOwnerId!==user.id)throw Error('This invitation belongs to another account.');
 const c=client();if(!c)throw Error('Cloud connection unavailable.');
 const {data:publication,error:readError}=await c.from('uri_publications')
  .select('published').eq('owner_id',user.id).eq('local_event_id',e.id).maybeSingle();
 if(readError)throw readError;
 if(publication?.published)throw Error('Unpublish this invitation before deleting its cloud draft.');
 const {error}=await c.from('uri_drafts').delete()
  .eq('owner_id',user.id).eq('local_event_id',e.id);
 if(error)throw error;
 dirty.delete(e.id);conflicts.delete(e.id);
}

async function signedIn(){
 const c=client();if(!c)return null;
 const {data,error}=await c.auth.getUser();
 user=error?null:data?.user||null;
 return user;
}
async function activate(){
 try{
  await signedIn();
  if(user){for(const e of local())if(e.type==='Wedding'&&e._uriCloudOwnerId===user.id&&e._uriCloudPending)dirty.add(e.id);
   await pull(false);
   await flush();
  }else stamp('Local drafts only. Sign in to synchronize across devices.');
 }catch(err){stamp('Cloud account check failed: '+(err.message||'Unknown error'))}
 if(['#cloud','#dashboard','#event'].includes(location.hash))render();
}
function accountPanel(){
 const logged=!!user;
 return '<div class="wrap uri-cloud-workspace"><h2>Cloud drafts</h2>'
  +'<p>Save invitations privately to your account, then open them on another device.</p>'
  +(logged?'<p>Signed in as <strong>'+out(user.email||'Account')+'</strong></p>'
   +'<div class="actions"><button class="btn primary" onclick="uriCloudSyncNow()">Save local drafts to cloud</button>'
   +'<button class="btn" onclick="uriCloudRestore()">Restore cloud copies</button>'
   +'<button class="btn" onclick="uriCloudSignOut();setTimeout(uriCloudActivate,400)">Sign out</button></div>'
   :'<label class="uri-cloud-login">Email address<input id="uriCloudAccountEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>'
   +'<div class="actions"><button class="btn primary" onclick="uriCloudAccountSignIn()">Email a sign-in link</button></div>')
  +'<p class="uri-cloud-status" id="uriDraftStatus" role="status" aria-live="polite">'+out(message||'')+'</p>'
  +'<p class="uri-cloud-note">Offline changes stay in this browser until you reconnect. If another device changed the same draft, URI will ask you to restore the cloud version rather than silently overwrite it.</p>'
  +'<p><a href="#dashboard">My Events</a></p></div>';
}
window.uriCloudAccountSignIn=async()=>{
 const email=document.getElementById('uriCloudAccountEmail')?.value?.trim();
 if(!email)return stamp('Enter a valid email address.');
 const c=client();if(!c)return stamp('Supabase connection unavailable.');
 const {error}=await c.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
 stamp(error?error.message:'Check your email for the sign-in link.');
};
window.uriCloudRestore=async()=>{
 if(!confirm('Restore cloud versions? Local copies with matching IDs will be replaced.'))return;
 dirty.clear();conflicts.clear();await pull(true);
};
window.uriCloudSyncNow=async()=>{
 if(!user)await signedIn();
 if(!user)return stamp('Sign in to sync.');
 for(const e of local())if(e.type==='Wedding'&&(!e._uriCloudOwnerId||e._uriCloudOwnerId===user.id))dirty.add(e.id);
 await flush();
};
window.uriCloudActivate=activate;
window.uriCloudRefreshGuests=async()=>{
 const e=current();if(!e||!user)return stamp('Sign in to refresh guest responses.');
 try{await cloudGuestRefresh(e);stamp('Online RSVP responses refreshed.');eventPage()}
 catch(err){stamp('Unable to refresh guests: '+err.message)}
};
window.URICloudDrafts={queueSave,pull,deleteDraft,flushCurrent:async()=>{
 if(!user)await signedIn();
 if(!user)throw Error('Sign in to publish your invitation.');
 const e=current();if(!e)return;
 if(e._uriCloudOwnerId&&e._uriCloudOwnerId!==user.id)throw Error('This event belongs to a different cloud account.');
 dirty.add(e.id);await flush();
 if(dirty.has(e.id))throw Error('Cloud sync did not complete. Resolve the draft conflict before publishing.');
},getUser:()=>user,isSynced:e=>!!user&&!!e?!!e._uriCloudRevision:false,cloudGuestRefresh,refreshAccount:activate,hashToken:sha256,randomToken};
const oldPersist=U.persist;
U.persist=function(){const ok=oldPersist();if(ok)queueSave();return ok};
const oldRender=render;
render=function(){
 if(location.hash==='#cloud'){app.innerHTML=accountPanel();return}
 return oldRender();
};
function init(){
 if(initialized)return;initialized=true;
 const c=client();if(!c)return;
 c.auth.onAuthStateChange(()=>setTimeout(activate,0));
 activate();
}
if(window.addEventListener)window.addEventListener('online',()=>{
 if(!user)return;
 for(const e of local())if(e._uriCloudOwnerId===user.id&&e._uriCloudPending)dirty.add(e.id);
 if(dirty.size)flush();
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
if(location.hash==='#cloud')render();
})();