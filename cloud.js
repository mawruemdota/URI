/* Optional Supabase publishing: authentication, public storage, and public event pages. */
(function(){
'use strict';
const config=window.URI_CLOUD_CONFIG||{};
const U=window.URIBuilder;
const T=v=>esc(v==null?'':String(v));
// Node smoke tests stub URL as an object; browsers provide the URL constructor.
const SITE_BASE=typeof URL==='function'&&document.currentScript?.src
 ?new URL('.',document.currentScript.src).href
 :(location.origin||'')+(location.pathname||'/').replace(/[^/]*$/,'');
const RESERVED_NAMES=new Set(['home','dashboard','create','cloud','event','events','invite','invites','public','rsvp','admin','login','logout','signup','settings','account','api','assets','static','preview','pricing','features','templates','about','terms','privacy','help','contact','support','www','uri','index','404']);
const normalizeUsername=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,'-');
const isValidUsername=s=>/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/.test(s)&&!s.includes('--')&&!RESERVED_NAMES.has(s);
const suggestedUsername=e=>{
 const text=[e.name1,e.name2].filter(Boolean).join('-and-').toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32).replace(/-$/,'');
 return isValidUsername(text)?text:'our-wedding-'+String(e.id||'event').replace(/[^a-z0-9]/gi,'').slice(-8).toLowerCase();
};
const draftUsername=e=>String(e.publicUsername||suggestedUsername(e));
const prettyPublicLink=slug=>SITE_BASE+encodeURIComponent(slug);

const configured=()=>/^https:\/\/[a-z0-9.-]+\/?$/.test(config.url||'')&&!!config.publishableKey;
let client=null,session=null,initialized=false,working=false,message='';
function db(){if(!configured()||!window.supabase?.createClient)return null;if(!client){client=window.supabase.createClient(config.url.replace(/\/$/,''),config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}if(!initialized){initialized=true;client.auth.onAuthStateChange((_event,s)=>{session=s;setTimeout(refresh,0)});client.auth.getSession().then(({data})=>{session=data.session;refresh()}).catch(()=>{})}return client}
function refresh(){let n=document.getElementById('uriCloudRoot');if(n&&current())n.innerHTML=markup(current())}
function stateMessage(s){message=s;refresh()}
// Local fingerprint is a freshness indicator, never an authorization check.
function publicationFingerprint(e){
 const payload=JSON.stringify(U.payload(e));
 let h=2166136261;
 for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}
 return (h>>>0).toString(16)+'-'+payload.length;
}
function publicationState(e){
 if(!e?.cloudPublished||!e.cloudSlug)return 'draft';
 if(e.publicUsername&&e.publicUsername!==e.cloudSlug)return 'changed';
 if(!e.uriPublishFingerprint)return 'legacy';
 return e.uriPublishFingerprint===publicationFingerprint(e)?'current':'changed';
}
function usernameMarkup(e){return '<div class="uri-publish-username"><label for="uriPublicUsername"><strong>Public event username</strong></label><div class="uri-publish-username-row"><span>'+T(SITE_BASE)+'</span><input id="uriPublicUsername" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="32" value="'+T(draftUsername(e))+'" oninput="uriCloudUsernameChanged(this.value)" aria-describedby="uriUsernameNote" placeholder="maya-and-emir"></div><small id="uriUsernameNote" role="status">'+(e.cloudPublished&&e.cloudSlug!==draftUsername(e)?'The old link remains active until you publish the new username. After publishing, the old link will stop working.':'Use 3–32 lowercase letters, numbers or single hyphens. Each username must be unique.')+'</small></div>';}
function markup(e){
 if(!configured())return '<div class="banner notice" role="status"><strong>Publishing is not available on this site yet.</strong><p>Your invitation can still be edited and saved in this browser. An administrator must connect online publishing before guests can open a public link.</p></div>';
 const c=db();
 if(!c)return '<div class="banner notice" role="status">Online publishing could not connect. Check your internet connection and reload.</div>';
 const state=publicationState(e),isLive=state!=='draft';
 if(!session?.user)return '<section class="wb-cloud-auth uri-publish-steps"><p><strong>1. Choose your event username</strong></p><p>Reserve your preferred public address when you publish. You can edit this username before signing in.</p>'+usernameMarkup(e)+'<p><strong>2. Sign in to publish</strong></p><p>Your draft is saved locally, but guests cannot open it yet. Enter your email to receive a secure sign-in link.</p><label class="wb-field"><span>Your email</span><input id="uriCloudEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><button class="btn primary" type="button" onclick="uriCloudSignIn()">Email me a sign-in link</button></section>'+(message?'<p role="status">'+T(message)+'</p>':'');
 const status=state==='draft'?['Not published','Guests cannot view this invitation yet.']:state==='changed'?['Live, with unpublished changes','Your online invitation still shows the last published version. Publish updates to share your latest edits.']:state==='legacy'?['Live invitation','You may have made changes since publishing. Publish updates to ensure the online copy is current.']:['Live and up to date','Your invitation is published. Share the public link or create personal guest RSVP links.'];
 return '<div class="wb-cloud-auth uri-publish-steps">'
  +'<div class="uri-publish-state" data-publish-state="'+state+'" role="status"><strong>'+status[0]+'</strong><p>'+status[1]+'</p></div>'
  +'<p class="uri-publish-account">Signed in as '+T(session.user.email||'your account')+'</p>'
  +usernameMarkup(e)
  +'<p><strong>2. '+(isLive?'Update your invitation':'Publish your invitation')+'</strong></p><p>Publishing makes your wedding details and selected media publicly viewable. Your private guest list stays private.</p>'
  +'<div class="uri-publish-actions"><button type="button" class="btn primary" onclick="uriCloudPublish()" '+(working?'disabled':'')+'>'+(working?'Publishing…':state==='draft'?'Publish invitation':'Publish updates')+'</button>'
  +(isLive?'<button type="button" class="btn" onclick="uriCloudUnpublish()" '+(working?'disabled':'')+'>Unpublish</button>':'')+'</div>'
  +(isLive?'<div class="uri-share-panel"><p><strong>3. Share your invitation</strong></p><p>Use the public link to show the event. For personal RSVP links, add guests and copy each guest\'s private link.</p><div class="uri-publish-actions"><button type="button" class="btn primary" onclick="uriCloudCopyLink()">Copy public link</button><a class="btn" target="_blank" rel="noopener" href="'+T(publicLink(e.cloudSlug))+'">Open invitation</a><button type="button" class="btn" onclick="tab=\'guests\';eventPage()">Manage guests & RSVP</button></div></div>':'<p class="uri-publish-next">3. After publishing, use the public link or share personal RSVP links from Guests & RSVP.</p>')
  +'<details class="uri-publish-account-tools"><summary>Account and advanced options</summary><button class="btn small" type="button" onclick="uriCloudSignOut()">Sign out</button><p>Editing your saved draft does not automatically update the public invitation. Publish updates when you are ready.</p></details>'
  +(message?'<p role="status" class="uri-publish-message">'+T(message)+'</p>':'')+'</div>';
}
function publicLink(slug){return prettyPublicLink(slug)}
async function uploadAudio(file,eventId){
 const types={mp3:'audio/mpeg',m4a:'audio/mp4',ogg:'audio/ogg',wav:'audio/wav',webm:'audio/webm'};
 const ext=String(file?.name||'').split('.').pop().toLowerCase(),mime=types[ext];
 if(!mime||!file||file.size<=0||file.size>15*1024*1024)throw Error('Choose an MP3, M4A, OGG, WAV or WebM file under 15 MB.');
 if(file.type&&!['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/ogg','audio/wav','audio/x-wav','audio/webm','application/ogg'].includes(file.type))throw Error('The selected file is not a supported audio recording.');
 const c=db();if(!c)throw Error('Cloud storage is not configured.');
 const {data,error}=await c.auth.getUser();
 if(error||!data?.user)throw Error('Open Publish and sign in before uploading audio.');
 const name=data.user.id+'/'+String(eventId).replace(/[^a-z0-9-]/gi,'')+'/'+slug()+'.'+ext;
 const {error:uploadError}=await c.storage.from('uri-wedding-audio').upload(name,file,{contentType:mime,upsert:false,cacheControl:'3600'});
 if(uploadError)throw new Error('Audio upload failed: '+uploadError.message);
 return c.storage.from('uri-wedding-audio').getPublicUrl(name).data.publicUrl;
}
window.URICloud={panel:e=>'<div id="uriCloudRoot">'+markup(e)+'</div>'+(window.URICloudDrafts?'<p class="uri-cloud-sync-link"><a href="#cloud">Manage cloud drafts and guest sync</a></p>':''),configured,uploadAudio,client:db,publicationState,publicLink,baseUrl:SITE_BASE,isValidUsername,draftUsername};
window.uriCloudUsernameChanged=value=>{
 const e=current();if(!e)return;
 e.publicUsername=normalizeUsername(value);
 U.persist();
 const note=document.getElementById('uriUsernameNote');
 if(note)note.textContent=isValidUsername(e.publicUsername)
  ?(e.cloudPublished&&e.cloudSlug!==e.publicUsername?'Publish updates to activate this new address. The previous link will then stop working.':'Username will be checked for uniqueness when you publish.')
  :'Use 3–32 lowercase letters, numbers or single hyphens, without reserved names.';
 const input=document.getElementById('uriPublicUsername');
 if(input)input.setAttribute('aria-invalid',String(!isValidUsername(e.publicUsername)));
};
window.uriCloudSignIn=async()=>{let c=db(),email=document.getElementById('uriCloudEmail')?.value.trim();if(!c||!email){stateMessage('Enter a valid email address.');return}let {error}=await c.auth.signInWithOtp({email,options:{emailRedirectTo:SITE_BASE}});stateMessage(error?error.message:'Check your email for a sign-in link. Return to URI after signing in.')};
window.uriCloudSignOut=async()=>{let c=db();if(c)await c.auth.signOut();session=null;stateMessage('Signed out.')};
function slug(){if(typeof crypto!=='undefined'&&crypto.randomUUID)return 'uri-'+crypto.randomUUID();let a=new Uint8Array(20);crypto.getRandomValues(a);return 'uri-'+Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')}
async function imageToCloud(source,uid,id){if(!source||!source.startsWith('data:image/'))return source||'';let c=db(),blob=await (await fetch(source)).blob(),filename=uid+'/'+id+'/'+slug()+'.jpg';let {error}=await c.storage.from('uri-wedding-public').upload(filename,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;return c.storage.from('uri-wedding-public').getPublicUrl(filename).data.publicUrl}
window.uriCloudPublish=async()=>{let e=current(),c=db();if(!e||!c||working)return;
 const username=normalizeUsername(draftUsername(e));
 if(!isValidUsername(username)){stateMessage('Choose a valid event username: 3–32 lowercase letters, numbers, or single hyphens.');return}
 if(e.cloudPublished&&e.cloudSlug&&e.cloudSlug!==username&&!confirm('Change this event URL from /'+e.cloudSlug+' to /'+username+'? The old public link will stop working, including links already sent to guests.'))return;
 const check=window.URIReadiness?.status(e);if(check&&!check.ready){stateMessage('Complete the required invitation details before publishing. Open the Review tab to fix '+check.blockers.map(x=>x.label).join(', ')+'.');return}working=true;stateMessage('Uploading media and publishing…');const publishFingerprint=publicationFingerprint(e);try{let {data,error}=await c.auth.getUser();if(error||!data.user)throw new Error('Sign in again.');if(window.URICloudDrafts?.flushCurrent)await window.URICloudDrafts.flushCurrent();let payload=U.payload(e),id=data.user.id;payload.heroPhoto=await imageToCloud(payload.heroPhoto,id,e.id);payload.photos=await Promise.all((payload.photos||[]).map(async p=>({...p,src:await imageToCloud(p.src,id,e.id)})));if(payload.backgroundByTemplate&&typeof payload.backgroundByTemplate==='object'){
  for(const background of Object.values(payload.backgroundByTemplate)){
   if(background&&typeof background==='object'&&typeof background.source==='string'){
    background.source=await imageToCloud(background.source,id,e.id);
   }
  }
}let newSlug=username;let {error:writeError}=await c.from('uri_publications').upsert({owner_id:id,local_event_id:e.id,slug:newSlug,title:[e.name1,e.name2].filter(Boolean).join(' & ')||'Wedding Invitation',payload,published:true},{onConflict:'owner_id,local_event_id'});if(writeError){if(writeError.code==='23505')throw new Error('This username is already taken. Choose a different username.');throw writeError}e.cloudSlug=newSlug;e.publicUsername=newSlug;e.cloudPublished=true;e.uriPublishFingerprint=publishFingerprint;e.uriPublishedAt=Date.now();U.persist();stateMessage('Published successfully. Copy the public link below, or open Guests & RSVP to send personal invitations.')}catch(err){stateMessage('Publishing failed: '+(err.message||'Unknown error'))}finally{working=false;refresh()}};
window.uriCloudCopyLink=async()=>{
 const e=current();if(!e?.cloudPublished||!e.cloudSlug){stateMessage('Publish your invitation before copying a public link.');return}
 const url=publicLink(e.cloudSlug);
 if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(url);stateMessage('Public invitation link copied.');return}catch(_){}}
 prompt('Copy your public invitation link:',url);
};
window.uriCloudUnpublish=async()=>{let e=current(),c=db();if(!e||!c||working||!e.cloudSlug)return;if(!confirm('Unpublish this invitation? Guests will no longer be able to open the public link.'))return;working=true;stateMessage('Unpublishing…');try{let {data,error}=await c.auth.getUser();if(error||!data.user)throw new Error('Sign in again.');let {error:writeError}=await c.from('uri_publications').update({published:false}).eq('owner_id',data.user.id).eq('local_event_id',e.id);if(writeError)throw writeError;e.cloudPublished=false;U.persist();stateMessage('This invitation is no longer publicly available.')}catch(err){stateMessage('Unpublishing failed: '+(err.message||'Unknown error'))}finally{working=false;refresh()}};
window.uriCloudOpenPublished=async slugValue=>{
 const raw=String(slugValue||''),sep=raw.indexOf('?'),publicSlug=sep<0?raw:raw.slice(0,sep);
 const params=new URLSearchParams(sep<0?'':raw.slice(sep+1));
 const personalToken=String(params.get('rsvp')||'').toLowerCase();app.innerHTML='<div class="wrap center"><h2>Opening invitation</h2><p>Loading the wedding website…</p></div>';let c=db();if(!c){app.innerHTML='<div class="wrap center"><h2>Invitation unavailable</h2><p>Cloud publishing is not configured on this website.</p></div>';return}try{let {data,error}=await c.from('uri_publications').select('payload,title').eq('slug',publicSlug).eq('published',true).maybeSingle();if(error)throw error;if(!data)throw new Error('This invitation is private, unpublished, or no longer available.');if(location.hash!=='#public/'+slugValue&&!(window.URI_PUBLIC_ROUTE===publicSlug&&location.search===(sep<0?'':raw.slice(sep))))return;let e=Object.assign({type:'Wedding'},data.payload);app.innerHTML='<div class="wrap" style="max-width:1100px;padding-top:25px"><div class="uri-public-back" style="margin-bottom:17px"><a href="#home"> URI</a></div>'+U.render(e)+'</div>';
 if(U.baseTemplate(e)==='adventure'&&/^[a-f0-9]{64}$/.test(personalToken)){
  const link=app.querySelector('.uri-adventure-rsvp-link');
  if(link){link.href='#rsvp/'+personalToken;link.hidden=false}
 }}catch(err){app.innerHTML='<div class="wrap center"><h2>Invitation unavailable</h2><p>'+T(err.message||'Unable to load invitation.')+'</p></div>'}};
if(configured())db();
if(location.hash.startsWith('#public/'))render();
})();
