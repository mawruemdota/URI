/* URI Wedding Flow 2.0 — guided wedding setup, local draft recovery and full-page preview. */
(function(){
'use strict';
const FLOW_KEY='uri-wedding-wizard-v3';
const HEADS=['Choose your wedding design','Introduce the couple','When and where?','A personal touch','Review your invitation'];
const SUBS=['Pick a starting style. You can change it later without losing your details.',
  'Tell us whose wedding we are celebrating.',
  'Add the essential details your guests will need.',
  'Add a favorite photo, a welcome message, and an RSVP deadline.',
  'Check everything before opening your wedding website builder.'];
let wizardError='',badField='',resumeNotice=false,draftSaved=true;
const T=x=>esc(x==null?'':String(x));
const localToday=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function readDraft(){try{let v=JSON.parse(localStorage.getItem(FLOW_KEY)||'null');if(v&&v.wizard&&v.updated&&Date.now()-v.updated<30*86400000)return v}catch(_){}return null}
function persistDraft(){try{localStorage.setItem(FLOW_KEY,JSON.stringify({wizard,step,updated:Date.now()}));draftSaved=true;return true}catch(err){draftSaved=false;return false}}
function clearDraft(){try{localStorage.removeItem(FLOW_KEY)}catch(_){}try{sessionStorage.removeItem(WIZARD_KEY)}catch(_){}}
function resetWizard(templateId){wizard=defaults();wizard.type='Wedding';wizard.template=['classic','garden'].includes(templateId)?templateId:'classic';wizard.rsvpMode='private';step=0;wizardError='';badField='';persistDraft()}
function migrateLegacy(){try{let v=JSON.parse(sessionStorage.getItem(WIZARD_KEY)||'null');if(v&&v.wizard&&v.wizard.type==='Wedding'&&Date.now()-v.updated<7*86400000)return {...v,step:0}}catch(_){}return null}
function pickField(k,label,type,required,placeholder){let val=wizard[k]||'';return '<label class="wf-field" for="wf-'+k+'"><span>'+label+(required?' <b aria-hidden="true">*</b>':' <small>(optional)</small>')+'</span><input id="wf-'+k+'" name="'+k+'" type="'+type+'" '+(type==='date'&&k==='date'?'min="'+localToday()+'" ':'')+'value="'+T(val)+'" placeholder="'+T(placeholder||'')+'" '+(required?'required ':'')+'aria-invalid="'+(badField===k)+'" oninput="wizardSet(\''+k+'\',this.value)" /></label>'}
function textMessage(){return '<label class="wf-field" for="wf-message"><span>A note to your guests <small>(optional)</small></span><textarea id="wf-message" rows="4" maxlength="1500" oninput="wizardSet(\'message\',this.value)">'+T(wizard.message||'')+'</textarea></label>'}
function detailCard(name,value,edit){return '<div class="wf-review-card"><div><small>'+name+'</small><strong>'+T(value)+'</strong></div><button type="button" class="btn small" onclick="wizardStep('+edit+')">Edit</button></div>'}
function reviewBody(){let t=TEMPLATES.find(x=>x.id===wizard.template)||TEMPLATES[0];return '<div class="wf-review">'+detailCard('Design',t.name,0)+detailCard('Couple',(wizard.name1||'Your name')+' & '+(wizard.name2||'Partner name'),1)+detailCard('Date and time',(wizard.date?fmt(wizard.date):'Choose a date')+' · '+(wizard.time||'To be confirmed'),2)+detailCard('Venue',wizard.venue||'Add a venue',2)+detailCard('Cover photo',wizard.heroPhoto?'Added — ready to personalize':'Optional — add one now or in the editor',3)+detailCard('RSVP deadline',wizard.deadline?fmt(wizard.deadline):'Not specified',3)+'</div><div class="wf-review-actions"><button type="button" class="btn" onclick="uriFlowOpenPreview(\'draft\')">View full wedding website ↗</button></div><p class="wf-helper">Saving will create a private draft in this browser and open the full editor. It will not publish your wedding website or send invitations.</p>'}

function photoBody(){
  let src=typeof wizard.heroPhoto==='string'&&wizard.heroPhoto.startsWith('data:image/')?wizard.heroPhoto:'';
  return '<section class="wf-photo-step"><div class="wf-photo-heading"><div><strong>Your cover photograph</strong><span>Optional · JPEG, PNG or WebP · maximum 12 MB</span></div>'+(src?'<button type="button" class="btn small" onclick="uriFlowClearPhoto()">Remove</button>':'')+'</div>'
    +(src?'<div class="wf-photo-current"><img src="'+T(src)+'" alt="Wedding photograph selected for the invitation cover"><span>Cover photo added. You can change its crop and focus in the editor.</span></div>':'<div class="wf-photo-empty"><span class="wf-photo-glyph" aria-hidden="true">✧</span><strong>Make it personal with a photograph</strong><span>You can skip this and add photos later.</span></div>')
    +'<label class="wf-photo-choose"><span>'+(src?'Replace cover photograph':'Choose a cover photograph')+'</span><input type="file" accept="image/jpeg,image/png,image/webp" onchange="uriFlowPhoto(event)"></label><p id="wfPhotoStatus" class="wf-photo-status" role="status" aria-live="polite"></p></section>';
}
function compressWeddingPhoto(file){
  return new Promise((resolve,reject)=>{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Choose a JPEG, PNG, or WebP photograph.'));
    if(file.size>12*1024*1024)return reject(new Error('The photograph is too large. Choose a file smaller than 12 MB.'));
    if(file.size===0)return reject(new Error('The selected file is empty.'));
    if(typeof URL==='undefined'||!URL.createObjectURL)return reject(new Error('Image upload is not supported by this browser.'));
    const url=URL.createObjectURL(file),image=new Image();
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('The image could not be opened. Try another file.'))};
    image.onload=()=>{
      try{
        let scale=Math.min(1,1300/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*scale));
        canvas.height=Math.max(1,Math.round(image.height*scale));
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        let data=canvas.toDataURL('image/jpeg',.72);
        URL.revokeObjectURL(url);
        resolve(data);
      }catch(err){URL.revokeObjectURL(url);reject(err)}
    };
    image.src=url;
  });
}
window.uriFlowPhoto=async function(ev){
  const file=ev.target.files?.[0],status=document.getElementById('wfPhotoStatus');
  if(!file)return;
  if(status)status.textContent='Preparing your photograph…';
  const previous=wizard.heroPhoto||'',settings=wizard.heroSettings;
  try{
    wizard.heroPhoto=await compressWeddingPhoto(file);
    wizard.heroSettings={...(wizard.heroSettings||{}),x:50,y:50,alt:'Wedding couple'};
    if(!persistDraft()){
      wizard.heroPhoto=previous;wizard.heroSettings=settings;
      persistDraft();
      throw new Error('This browser does not have enough storage. Please use a smaller image or add it after setup.');
    }
    wizardView();
  }catch(err){
    wizard.heroPhoto=previous;wizard.heroSettings=settings;
    if(status)status.textContent=err.message||'Unable to add photograph.';
  }
};
window.uriFlowClearPhoto=function(){
  const prior=wizard.heroPhoto,settings=wizard.heroSettings;
  wizard.heroPhoto='';
  if(!persistDraft()){
    wizard.heroPhoto=prior;wizard.heroSettings=settings;
    alert('Unable to save this change in your browser.');
    return;
  }
  wizardView();
};
function pageBody(){if(step===0)return '<div class="wf-designs">'+TEMPLATES.map(t=>'<button type="button" class="wf-design '+(wizard.template===t.id?'active':'')+'" aria-pressed="'+(wizard.template===t.id)+'" onclick="wizardSet(\'template\',\''+t.id+'\');wizardView()">'+(window.URIBuilder?'<div class="template-preview uri-ref-thumb">'+window.URIBuilder.cover({...wizard,template:t.id})+'</div>':templateThumb(t))+'<strong>'+T(t.name)+'</strong><small>'+T(t.desc)+'</small><span class="wf-selected">'+(wizard.template===t.id?'✓ Selected':'Choose design')+'</span></button>').join('')+'</div>';
if(step===1)return '<div class="wf-two">'+pickField('name1',"Partner one's name",'text',true,'e.g. Maria')+pickField('name2',"Partner two's name",'text',true,'e.g. Juan')+'</div><p class="wf-helper">Names will appear on the wedding cover. You can edit them again later.</p>';
if(step===2)return '<div class="wf-two">'+pickField('date','Wedding date','date',true)+pickField('time','Start time','time',true)+'</div>'+pickField('venue','Ceremony or event venue','text',true,'e.g. The Garden Pavilion')+pickField('address','Venue address','text',false,'City, province')+'<p class="wf-helper">If the ceremony and reception are at different places, you can add that information in the editor.</p>';
if(step===3)return photoBody()+textMessage()+pickField('deadline','RSVP deadline','date',false)+'<p class="wf-helper">Your RSVP settings are a draft. Guests cannot submit responses across devices until the secure RSVP system is complete.</p>';
return reviewBody()}
function validate(at){wizardError='';badField='';if(at===0){if(!TEMPLATES.some(t=>t.id===wizard.template)){wizardError='Please choose a wedding design.';badField='template'}}else if(at===1){if(!(wizard.name1||'').trim()){wizardError="Enter the first partner's name.";badField='name1'}else if(!(wizard.name2||'').trim()){wizardError="Enter the second partner's name.";badField='name2'}}else if(at===2){for(let [key,msg] of [['date','Choose a wedding date.'],['time','Choose a starting time.'],['venue','Enter the event venue.']]){if(!(wizard[key]||'').trim()){wizardError=msg;badField=key;break}}if(!wizardError&&wizard.date<localToday()){wizardError='The wedding date cannot be in the past.';badField='date'}}else if(at===3){if(wizard.deadline&&wizard.date&&wizard.deadline>wizard.date){wizardError='RSVP deadline must be on or before the wedding date.';badField='deadline'}else if(wizard.deadline&&wizard.deadline<localToday()){wizardError='RSVP deadline cannot be in the past.';badField='deadline'}}return !wizardError}
function showError(){wizardView();let f=document.getElementById('wf-'+badField);if(f&&typeof f.focus==='function')f.focus();else{let n=document.getElementById('wf-error');if(n&&typeof n.focus==='function')n.focus()}}
startWizard=function(t){const requested=['classic','garden'].includes(t)?t:null;const prior=readDraft()||migrateLegacy();if(requested){let hasDetails=prior&&prior.wizard&&['name1','name2','date','venue'].some(k=>String(prior.wizard[k]||'').trim());if(hasDetails){wizard=Object.assign(defaults(),prior.wizard,{type:'Wedding',template:requested});step=0;wizardError='';badField='';resumeNotice=true;persistDraft()}else{resetWizard(requested);resumeNotice=false}}
else if(prior){wizard=Object.assign(defaults(),prior.wizard,{type:'Wedding'});if(!['classic','garden'].includes(wizard.template))wizard.template='classic';step=Math.min(4,Math.max(0,prior.step||0));wizardError='';badField='';resumeNotice=true;persistDraft()}
else{resetWizard();resumeNotice=false}route('create')};
wizardSet=function(k,v){if(!['name1','name2','date','time','venue','address','message','deadline','template'].includes(k))return;wizard[k]=v;wizardError='';badField='';persistDraft();let preview=document.getElementById('wizardLive');if(preview)preview.innerHTML=window.URIBuilder?window.URIBuilder.cover(wizard):inv(wizard);let saved=document.getElementById('wf-save');if(saved)saved.textContent=draftSaved?'Draft saved in this browser':'Unable to save draft in this browser';let error=document.getElementById('wf-error');if(error&&error.remove)error.remove();let changed=document.getElementById('wf-'+k);if(changed&&changed.setAttribute)changed.setAttribute('aria-invalid','false');};
wizardStep=function(n){if(n<0||n>4)return;step=n;wizardError='';badField='';persistDraft();wizardView();window.scrollTo(0,0)};
window.uriFlowFresh=function(){if(confirm('Start a new wedding invitation? Your unfinished setup draft will be replaced.')){resetWizard();resumeNotice=false;wizardView()}};
wizardView=function(){let body=pageBody(),preview=window.URIBuilder?window.URIBuilder.cover(wizard):inv(wizard);app.innerHTML='<div class="wrap wizard wf-wizard"><div class="wf-header"><button type="button" class="btn ghost" onclick="route(\'home\')">← Back to home</button><div id="wf-save" class="wf-save" role="status">'+(draftSaved?'Draft saved in this browser':'Unable to save draft in this browser')+'</div></div>'+(resumeNotice?'<div class="wf-resume" role="status">Your unfinished wedding setup has been restored. <button type="button" class="btn small" onclick="uriFlowFresh()">Start fresh</button></div>':'')+'<div class="wf-progress-head"><div><span class="eyebrow">Wedding website · Step '+(step+1)+' of 5</span><h2>'+HEADS[step]+'</h2><p>'+SUBS[step]+'</p></div></div><nav class="wf-steps" aria-label="Wedding setup progress">'+HEADS.map((h,i)=>'<button type="button" class="'+(i===step?'current':i<step?'done':'upcoming')+'" '+(i>step?'disabled':'')+' aria-current="'+(i===step?'step':'false')+'" onclick="wizardStep('+i+')"><span>'+(i<step?'✓':i+1)+'</span><small>'+['Design','Couple','Details','Message','Review'][i]+'</small></button>').join('')+'</nav><div class="wizard-shell"><main class="wizard-main"><div class="panel wf-panel">'+(wizardError?'<div id="wf-error" class="wizard-error" role="alert" tabindex="-1">'+T(wizardError)+'</div>':'')+body+'<div class="wf-actions"><button type="button" class="btn" onclick="wizardStep(step-1)" '+(step===0?'disabled':'')+'>← Back</button><button type="button" class="btn primary" onclick="nextWizard()">'+(step===4?'Save & customize →':'Continue →')+'</button></div></div><button type="button" class="btn wf-preview-mobile" onclick="uriFlowOpenPreview(\'draft\')">Preview your wedding website ↗</button></main><aside class="wizard-side wf-side"><div class="wf-side-head"><h3>Invitation cover</h3><span>Live preview</span></div><div id="wizardLive">'+preview+'</div><button type="button" class="btn small" onclick="uriFlowOpenPreview(\'draft\')">Full website preview ↗</button></aside></div></div>'};
nextWizard=function(){if(step<4){if(!validate(step)){showError();return}step++;persistDraft();wizardView();window.scrollTo(0,0);return}for(let s=0;s<4;s++){if(!validate(s)){step=s;showError();return}}let e={...defaults(),...wizard,type:'Wedding',id:'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),guests:[],status:'draft',created:Date.now()};if(window.URIBuilder)window.URIBuilder.model(e);state.events.push(e);const oldCurrent=state.current;state.current=e.id;try{save()}catch(err){state.events.pop();state.current=oldCurrent;wizardError='Browser storage is full or unavailable. Your draft was not created.';showError();return}clearDraft();resumeNotice=false;tab='edit';route('event');if(window.uriBPanel)window.uriBPanel('content');window.scrollTo(0,0)};
function fullPreview(e,back){let content=window.URIBuilder?window.URIBuilder.render(e):inv(e);app.innerHTML='<div class="wf-full"><div class="wf-full-bar"><button type="button" class="btn" onclick="uriFlowBackPreview()">← '+(back==='draft'?'Back to setup':'Back to editor')+'</button><span>Full wedding website preview · Not published</span><div class="wf-full-modes"><button type="button" class="btn small" aria-pressed="true" data-wf-mode="desktop" onclick="uriFlowMode(\'desktop\')">Desktop</button><button type="button" class="btn small" aria-pressed="false" data-wf-mode="mobile" onclick="uriFlowMode(\'mobile\')">Mobile</button></div></div><div class="wf-full-canvas" id="wfFullCanvas" data-mode="desktop"><div class="wf-full-stage" id="wfFullStage"><div class="wf-full-content" id="wfFullContent">'+content+'</div></div></div><div class="wf-full-hint" id="wfFullScale">1024px desktop layout</div></div>';setTimeout(()=>{if(window.uriFlowFit)window.uriFlowFit()},0)}
let previewFrom='event',previewEvent='';
window.uriFlowOpenPreview=function(which){if(which==='draft'){previewFrom='draft';route('preview-wizard')}else{let e=current();if(!e)return;previewFrom='event';previewEvent=e.id;route('preview/'+e.id)}window.scrollTo(0,0)};
window.uriFlowBackPreview=function(){if(previewFrom==='draft'){route('create')}else{if(previewEvent)state.current=previewEvent;tab='edit';route('event')}window.scrollTo(0,0)};
window.uriFlowFit=function(){
  const canvas=document.getElementById('wfFullCanvas');
  const stage=document.getElementById('wfFullStage');
  const content=document.getElementById('wfFullContent');
  if(!canvas||!stage||!content||!canvas.clientWidth)return;
  const mobile=canvas.dataset.mode==='mobile';
  const width=mobile?390:1080,available=Math.max(0,canvas.clientWidth-24);
  const scale=Math.min(1,available/width);
  content.style.width=width+'px';
  content.style.maxWidth='none';
  content.style.transformOrigin='top left';
  content.style.transform='scale('+scale+')';
  stage.style.width=width*scale+'px';
  stage.style.height=Math.ceil(content.scrollHeight*scale)+'px';
  stage.style.margin='auto';
  const caption=document.getElementById('wfFullScale');
  if(caption)caption.textContent=(mobile?'390px mobile layout':'1080px desktop layout')+' · '+Math.round(scale*100)+'% scale';
  if(content.querySelectorAll)content.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',window.uriFlowFit,{once:true})});
};
window.uriFlowMode=function(mode){
  const c=document.getElementById('wfFullCanvas');
  if(c)c.dataset.mode=mode==='mobile'?'mobile':'desktop';
  document.querySelectorAll('[data-wf-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute('data-wf-mode')===mode)));
  setTimeout(window.uriFlowFit,0);
};
if(window.addEventListener)window.addEventListener('resize',()=>{if(window.uriFlowFit)window.uriFlowFit()});
const oldRender=render;
render=function(){window.__uriLastRenderedHash=location.hash;let r=location.hash.slice(1)||'home';if(r==='preview-wizard'){previewFrom='draft';fullPreview(wizard,'draft');return}if(r.startsWith('preview/')){let id=r.slice(8),e=state.events.find(e=>e.id===id);if(!e){route('dashboard');return}previewFrom='event';previewEvent=id;fullPreview(e,'event');return}return oldRender()};
const currentRoute=location.hash.slice(1);
if(currentRoute==='create'||currentRoute==='preview-wizard'){
  let prior=readDraft()||migrateLegacy();
  if(prior){wizard=Object.assign(defaults(),prior.wizard,{type:'Wedding'});if(!['classic','garden'].includes(wizard.template))wizard.template='classic';step=Math.min(4,Math.max(0,prior.step||0));resumeNotice=true}
  else resetWizard();
}
const basePersist=window.URIBuilder&&window.URIBuilder.persist;
if(basePersist)window.URIBuilder.persist=function(){let ok=basePersist();let status=document.getElementById('wbSaveState');if(status)status.textContent=ok?'✓ Saved in this browser':'Could not save — browser storage full';return ok};
render();
})();
