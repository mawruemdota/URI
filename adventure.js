/* URI Adventure Invitation 1.0
 * Original light platformer with Phaser Arcade Physics.
 * Wedding content stays in shared URI sections and is readable without gameplay.
 * The engine is lazily loaded only for an actual playable invitation.
 */
(function(){
'use strict';
const U=window.URIBuilder;if(!U)return;
const BASE='adventure';
const PHASER_URL='https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
const WORLDS={
 meadow:{name:'Meadow Journey',sky:0x9bd6ed,hill:0x86c896,hill2:0x58a47a,ground:0x7e5b43,grass:0x64a957,decor:0xffe2a2},
 sunset:{name:'Sunset Village',sky:0xf7bd95,hill:0xd7a2a0,hill2:0x9e7994,ground:0x785c65,grass:0xc89069,decor:0xffecc4},
 starlight:{name:'Starlight Kingdom',sky:0x233b65,hill:0x3a5680,hill2:0x293f6b,ground:0x36465d,grass:0x7394af,decor:0xe2d4ff}
};
const PX=window.URIAdventurePixels;
const CHARACTERS=Object.fromEntries(Object.entries(PX?.ROLES||{
 explorer:{name:'Explorer'},partner:{name:'Celebration Guest'},dreamer:{name:'Dreamer'}
}).map(([id,v])=>[id,v.name]));
const TITLE={hero:'Welcome',story:'Our Story',gallery:'Photo Gallery',countdown:'Countdown',details:'Event Details',
 timeline:'Event Timeline',dress:'Dress Code',gifts:'Gifts',rsvp:'RSVP'};
const DEFAULTS={world:'meadow',character:'explorer',characterVariant:0,guestChoice:true,touch:'buttons',pace:'normal',collectibles:true};
const instances=new Set();
let enginePromise=null, scheduled=false;
const T=v=>esc(v==null?'':String(v));
const uid=x=>String(x||'').replace(/[^a-z0-9-]/gi,'').slice(0,48);
function normalize(v){
 const x=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 return {
  world:Object.hasOwn(WORLDS,x.world)?x.world:DEFAULTS.world,
  character:Object.hasOwn(CHARACTERS,x.character)?x.character:DEFAULTS.character,
  characterVariant:Number.isInteger(Number(x.characterVariant))&&Number(x.characterVariant)>=0&&Number(x.characterVariant)<=2?Number(x.characterVariant):0,
  guestChoice:typeof x.guestChoice==='boolean'?x.guestChoice:true,
  touch:['buttons','joystick'].includes(x.touch)?x.touch:DEFAULTS.touch,
  pace:['gentle','normal','brisk'].includes(x.pace)?x.pace:DEFAULTS.pace,
  collectibles:typeof x.collectibles==='boolean'?x.collectibles:DEFAULTS.collectibles
 };
}
function active(e){return e?.type==='Wedding'&&U.baseTemplate(e)===BASE}
function features(e){return U.compose(e).map((x,i)=>({
 id:uid(x.id),title:TITLE[x.id]||(U.customItem(e,x.id)?.title||'Extra Information').slice(0,60),
 html:x.html,index:i
})).filter(x=>x.id&&x.html)}
function characterSelection(a){
 const options=Object.entries(CHARACTERS);
 return '<section class="uri-character-select" hidden aria-label="Choose your playable wedding adventure character">'
  +'<div class="uri-character-select-top"><span class="uri-char-crest" aria-hidden="true">♡</span><h2 tabindex="-1">Choose Your Character</h2>'
  +'<p>Select an avatar for your wedding adventure. Every character moves and jumps the same way.</p></div>'
  +'<div class="uri-char-cards" role="group" aria-label="Available characters">'
  +options.map(([id,label])=>'<button type="button" class="uri-char-card'+(id===a.character?' selected':'')+'" aria-pressed="'+(id===a.character)+'" data-adventure-role="'+id+'">'
   +'<span class="uri-char-card-art">'+(PX?.svg(id,a.characterVariant)||'✿')+'</span>'
   +'<span class="uri-char-card-label">'+T(label)+'</span></button>').join('')
  +'</div>'
  +'<div class="uri-char-detail"><div class="uri-char-large-avatar">'+(PX?.svg(a.character,a.characterVariant)||'✿')+'</div>'
  +'<div class="uri-char-description"><div class="uri-char-name-row"><strong class="uri-char-active-name">'+T(CHARACTERS[a.character])+'</strong>'
  +'<div class="uri-char-variations"><button type="button" data-adventure-action="variant-prev" aria-label="Previous outfit color">◀</button>'
  +'<span class="uri-char-variation-label">Variation 1/3</span><button type="button" data-adventure-action="variant-next" aria-label="Next outfit color">▶</button></div></div>'
  +'<p class="uri-char-active-tag">'+T(PX?.ROLES[a.character]?.tag||'Your story begins here')+'</p>'
  +'<dl><div><dt>Style</dt><dd class="uri-char-style-value">'+T(PX?.ROLES[a.character]?.detail||'Wedding adventure')+'</dd></div>'
  +'<div><dt>Vibe</dt><dd>Curious, warm, and ready to celebrate</dd></div>'
  +'<div><dt>Special look</dt><dd class="uri-char-variant-name">Original colors</dd></div></dl>'
  +'</div></div>'
  +'<div class="uri-char-select-actions"><button type="button" data-adventure-action="character-back">← Back to invitation</button>'
  +'<button type="button" data-adventure-action="confirm-character">Confirm Character →</button></div>'
  +'</section>';
}
const originalModel=U.model;
U.model=function(e){const result=originalModel(e);if(active(e))e.adventure=normalize(e.adventure);return result};
const originalRender=U.render,originalCover=U.cover,originalPayload=U.payload;
function preview(e){
 const d=U.design(e),a=normalize(e.adventure),world=WORLDS[a.world],parts=features(e);
 const style='--wb-bg:'+d.bg+';--wb-ink:'+d.ink+';--wb-accent:'+d.accent+
  ';--wb-heading:'+U.fonts[d.heading]+';--wb-body:'+U.fonts[d.body]+';';
 return '<article class="uri-builder-site uri-adventure-site wb-theme-adventure wb-spacing-'+d.spacing+'" data-visible-features="'+parts.length+'" data-adventure-world="'+a.world+'" data-adventure-character="'+a.character+'" data-adventure-variant="'+a.characterVariant+'" data-adventure-guest-choice="'+a.guestChoice+'" data-adventure-touch="'+a.touch+'" data-adventure-pace="'+a.pace+'" data-adventure-collectibles="'+a.collectibles+'" style="'+style+'">'
  +'<header class="uri-adventure-heading">'
  +'<div class="uri-pixel-topbar"><div class="uri-pixel-brand"><span class="uri-pixel-brand-flower">✿</span><div><strong>URI ADVENTURE</strong><small>WEDDING INVITATION QUEST</small></div></div>'
  +'<div class="uri-pixel-topnav"><span class="uri-pixel-topmemories"><span class="uri-pixel-nav-icon">✧</span> <strong>Memories</strong><span class="uri-pixel-memory-count">0 / 0</span></span>'
  +'<button type="button" data-adventure-action="map"><span class="uri-pixel-nav-icon">▤</span> World Map [M]</button>'
  +'<a href="#home" class="uri-pixel-home"><span class="uri-pixel-nav-icon">⌂</span> Home [Esc]</a></div></div>'
  +'<div class="uri-pixel-banner"><span class="uri-pixel-wedding-rings" aria-hidden="true">♡</span><span class="uri-adventure-eyebrow">THE ADVENTURE BEGINS</span>'
  +'<h1>'+T(e.name1||'Your Name')+' <em>&amp;</em> '+T(e.name2||'Partner Name')+'</h1>'
  +'<p class="uri-pixel-event-meta"><span>▣ '+T(e.date?fmt(e.date):'Save the date')+'</span><span>⌖ '+T(e.venue||'Venue to be announced')+'</span></p></div>'
  +'</header>'
  +'<div class="wb-flow"><div class="uri-adventure-world" role="region" aria-label="Playable wedding invitation">'
  +'<div class="uri-adventure-intro"><strong>✦ A CELEBRATION ADVENTURE ✦</strong><span>Move, jump and explore the signposts to uncover the invitation.</span></div>'
  +'<div class="uri-adventure-stage" role="group" aria-label="Playable platform game with explorable invitation areas">'
  +'<div class="uri-adventure-load"><span class="uri-adventure-loading-icon" aria-hidden="true">✦</span><span>Step into your story</span><button type="button" data-adventure-action="play">Play adventure</button></div>'
  +characterSelection(a)
  +'<section class="uri-adventure-interior" hidden role="region" aria-label="Inside an adventure area">'
  +'<div class="uri-adventure-interior-scenery" aria-hidden="true"><span class="uri-adventure-interior-window"></span><span class="uri-adventure-interior-banner"></span></div>'
  +'<header class="uri-adventure-room-head"><span class="uri-adventure-room-eyebrow">INSIDE THE ADVENTURE</span><h2 class="uri-adventure-room-title" tabindex="-1">Welcome</h2><button type="button" data-adventure-action="room-exit">← Return to world</button></header>'
  +'<div class="uri-adventure-room-body" tabindex="0"></div>'
  +'<nav class="uri-adventure-room-nav" aria-label="Navigate adventure areas"><button type="button" data-adventure-action="room-prev">← Previous area</button><button type="button" data-adventure-action="room-map">World map</button><button type="button" data-adventure-action="room-next">Next area →</button></nav>'
  +'</section></div>'
  +'<div class="uri-adventure-hud"><span class="uri-adventure-position" aria-live="off">Starting meadow</span><span class="uri-adventure-stars" aria-live="polite">'+(a.collectibles?'Memories: 0':'A celebration awaits')+'</span><span class="uri-adventure-prompt">Approach a sign and press E or Interact</span></div>'
  +'<div class="uri-adventure-controls" aria-label="Game controls">'
  +(a.touch==='joystick'?'<div class="uri-adventure-joystick" data-adventure-control="joystick" role="group" aria-label="Movement joystick"><span class="uri-adventure-stick" aria-hidden="true"></span><small>Move</small></div>'
   :'<div class="uri-adventure-dpad"><button type="button" data-adventure-control="left" aria-label="Move left">◀</button><button type="button" data-adventure-control="right" aria-label="Move right">▶</button></div>')
  +'<div class="uri-adventure-actions"><button type="button" data-adventure-control="jump" aria-label="Jump">Jump</button><button type="button" data-adventure-action="interact" aria-label="Interact with nearby invitation sign">Interact</button></div></div>'
  +'<div class="uri-adventure-tools"><button type="button" data-adventure-action="character">✿ Character</button><button type="button" data-adventure-action="details">View all details / Skip game</button><a class="uri-adventure-rsvp-link" hidden href="#home">RSVP now</a><span>Move: ← → / A D · Jump: Space · Interact: E</span></div>'
  +'</div><details class="uri-adventure-directory"><summary>View all invitation information without playing</summary><div class="uri-adventure-pages">'
  +parts.map(p=>'<div class="uri-adventure-page" data-adventure-id="'+p.id+'"><h2>'+T(p.title)+'</h2>'+p.html+'</div>').join('')
  +(parts.length===0?'<p>Add invitation sections in the Features tab.</p>':'')+'</div></details></div>'
  +'<footer class="wb-footer">URI · Your celebration, your adventure</footer></article>';
}
U.render=e=>active(e)?preview(e):originalRender(e);
U.cover=e=>{
 if(!active(e))return originalCover(e);
 const d=U.design(e),a=normalize(e.adventure);
 return '<div class="wb-cover-mini uri-adventure-mini" data-adventure-world="'+a.world+'" style="--wb-bg:'+d.bg+';--wb-ink:'+d.ink+';--wb-accent:'+d.accent+'">'
  +'<div class="uri-adventure-mini-cloud"></div><div class="uri-adventure-mini-hills"></div>'
  +'<div class="uri-adventure-mini-sign">THE ADVENTURE BEGINS</div><div class="uri-adventure-mini-hero" aria-hidden="true"><i></i></div>'
  +'<div class="uri-adventure-mini-title">'+T(e.name1||'Maya')+' <em>&amp;</em> '+T(e.name2||'Emir')+'</div>'
  +'<div class="uri-adventure-mini-floor"></div></div>';
};
U.payload=e=>({...originalPayload(e),adventure:normalize(e.adventure)});
const controls=(key,label,options,a)=>'<label class="wb-field uri-adventure-setting"><span>'+label+'</span><select onchange="uriAdventureSet(\''+key+'\',this.value)">'+options.map(([id,title])=>'<option value="'+id+'"'+(String(a[key])===String(id)?' selected':'')+'>'+title+'</option>').join('')+'</select></label>';
function manager(e){
 if(!active(e))return '';
 const a=normalize(e.adventure),parts=features(e);
 return '<section class="uri-adventure-manager" aria-labelledby="uriAdventureManagerTitle"><h3 id="uriAdventureManagerTitle">Game Template Manager</h3>'
  +'<p>Design a playable invitation. All checkpoints use your existing Content and Features settings.</p>'
  +'<div class="uri-adventure-setting-grid">'
  +controls('world','World appearance',Object.entries(WORLDS).map(([id,v])=>[id,v.name]),a)
  +controls('character','Default playable character',Object.entries(CHARACTERS).map(([id,label])=>[id,label]),a)
  +controls('characterVariant','Default outfit color', [['0','Original'],['1','Pastel'],['2','Evening']],a)
  +controls('touch','Mobile movement', [['buttons','Left / Right buttons'],['joystick','Virtual joystick']],a)
  +controls('pace','Movement speed',[['gentle','Gentle'],['normal','Normal'],['brisk','Brisk']],a)
  +'</div><label class="uri-adventure-checkbox"><input type="checkbox" onchange="uriAdventureSet(\'guestChoice\',this.checked)"'+(a.guestChoice?' checked':'')+'> Let guests choose their own character before starting</label>'
  +'<label class="uri-adventure-checkbox"><input type="checkbox" onchange="uriAdventureSet(\'collectibles\',this.checked)"'+(a.collectibles?' checked':'')+'> Collectible memories (optional)</label>'
  +'<div class="uri-adventure-stations"><strong>Active checkpoints ('+parts.length+')</strong><p>Show, hide and reorder these stations in the Features tab.</p><ol>'
  +parts.map(p=>'<li>'+T(p.title)+'</li>').join('')+'</ol></div>'
  +'<p class="uri-adventure-editor-help">Use <b>Play adventure</b> in the preview to test movement. Guests can always skip to event details and RSVP.</p></section>';
}
window.uriAdventureSet=(key,value)=>{
 const e=current();if(!active(e))return;
 const next=normalize({...normalize(e.adventure),[key]:value});
 if(!['world','character','characterVariant','guestChoice','touch','pace','collectibles'].includes(key))return;
 if(['collectibles','guestChoice'].includes(key)&&typeof value!=='boolean')return;
 if(!['collectibles','guestChoice','characterVariant'].includes(key)&&next[key]!==value)return;
 const previous=e.adventure;e.adventure=next;
 if(!U.persist()){e.adventure=previous;eventPage();return}
 eventPage();
};
function loadPhaser(){
 if(window.Phaser?.Game)return Promise.resolve(window.Phaser);
 if(enginePromise)return enginePromise;
 enginePromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=PHASER_URL;script.async=true;
  script.onload=()=>window.Phaser?.Game?resolve(window.Phaser):reject(Error('Phaser could not initialize'));
  script.onerror=()=>reject(Error('Phaser could not be loaded'));
  document.head.appendChild(script);
 }).catch(e=>{enginePromise=null;throw e});
 return enginePromise;
}
function stationNodes(root){return [...root.querySelectorAll('.uri-adventure-page[data-adventure-id]')]}
/* Each checkpoint is an explorable room within the game stage, never a modal.
 * Phaser pauses at the doorway. The native HTML content stays accessible and scrollable. */
function travelTo(root,id){
 const inst=root._uriAdventure,scene=inst?.scene;
 const cp=scene?.checkpoints?.find?.(c=>c.id===id);
 if(cp&&scene.player){
  scene.player.setX(Math.max(40,cp.x-65));
  scene.player.setVelocityX(0);
 }
}
function enterRoom(root,heading,view){
 const inst=root._uriAdventure,stage=root.querySelector('.uri-adventure-stage');
 const room=stage?.querySelector('.uri-adventure-interior');
 if(!room)return null;
 if(inst){
  if(inst.view==='world'||!inst.view)inst.returnFocus=document.activeElement;
  inst.view=view;
  inst.controls.left=false;inst.controls.right=false;inst.controls.jump=false;
  if(inst.scene?.player&&inst.scene.textures?.exists?.('uri-player-interact'))
   inst.scene.player.setTexture('uri-player-interact');
  if(inst.scene?.scene&&!inst.scene.scene.isPaused?.())inst.scene.scene.pause();
 }
 room.hidden=false;
 stage.classList.add('uri-adventure-inside');
 const title=room.querySelector('.uri-adventure-room-title');
 if(title){title.textContent=heading;title.focus({preventScroll:true})}
 const body=room.querySelector('.uri-adventure-room-body');
 if(body)body.scrollTop=0;
 return room;
}
function exitRoom(root){
 const inst=root._uriAdventure;
 const stage=root.querySelector('.uri-adventure-stage'),room=stage?.querySelector('.uri-adventure-interior');
 if(!room||room.hidden)return;
 room.hidden=true;
 stage.classList.remove('uri-adventure-inside');
 stage.removeAttribute('data-interior-type');
 room.querySelector('.uri-adventure-room-body').replaceChildren();
 if(inst){
  inst.view='world';inst.currentStation=null;
  inst.controls.left=false;inst.controls.right=false;inst.controls.jump=false;
  if(inst.scene?.scene?.isPaused?.())inst.scene.scene.resume();
  inst.scene?.input?.keyboard?.resetKeys?.();
  const preferred=inst.game?.canvas||inst.returnFocus;
  preferred?.focus?.({preventScroll:true});
 }
}
function openStation(root,id){
 const page=stationNodes(root).find(p=>p.dataset.adventureId===id);
 if(!page)return;
 const title=page.querySelector('h2')?.textContent||'Invitation details';
 const room=enterRoom(root,title,'station');if(!room)return;
 const stage=root.querySelector('.uri-adventure-stage');
 stage.dataset.interiorType=id;
 const inst=root._uriAdventure;
 if(inst)inst.currentStation=id;
 const stations=stationNodes(root),index=stations.indexOf(page);
 const prev=room.querySelector('[data-adventure-action="room-prev"]');
 const next=room.querySelector('[data-adventure-action="room-next"]');
 if(prev)prev.disabled=index<=0;
 if(next)next.disabled=index>=stations.length-1;
 room.querySelector('.uri-adventure-room-nav').hidden=false;
 const content=room.querySelector('.uri-adventure-room-body');
 content.innerHTML='<div class="uri-adventure-room-content">'+page.innerHTML+'</div>';
 // The online guest form is rendered in the same game room via the existing
 // token-protected RSVP API; it never requires a dialog or a second website.
 if(id==='rsvp'){
  const link=root.querySelector('.uri-adventure-rsvp-link');
  if(link&&!link.hidden){
   const url=link.getAttribute('href')||'',token=url.startsWith('#rsvp/')?url.slice(6):'';
   if(/^[a-f0-9]{64}$/.test(token)&&window.uriCloudEmbedRSVP){
    const slot=document.createElement('div');slot.className='uri-adventure-inline-rsvp';
    content.appendChild(slot);
    window.uriCloudEmbedRSVP(token,slot).catch(()=>{});
   }else{
    const action=link.cloneNode(true);action.hidden=false;
    action.textContent='Open personalized RSVP form';
    content.appendChild(action);
   }
  }
 }
}
function openMap(root){
 const room=enterRoom(root,'World map','map');if(!room)return;
 const stage=root.querySelector('.uri-adventure-stage');
 stage.dataset.interiorType='map';
 room.querySelector('.uri-adventure-room-nav').hidden=true;
 const list=stationNodes(root).map((p,i)=>
  '<button type="button" data-adventure-station="'+T(p.dataset.adventureId)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+T(p.querySelector('h2')?.textContent||'Invitation area')+'</button>'
 ).join('');
 room.querySelector('.uri-adventure-room-body').innerHTML='<div class="uri-adventure-map-sheet"><p>Select an area to visit it inside the game, or return to the path.</p><div class="uri-adventure-map-list">'+list+'</div></div>';
}
function moveRoom(root,direction){
 const stations=stationNodes(root),id=root._uriAdventure?.currentStation;
 const index=stations.findIndex(p=>p.dataset.adventureId===id);
 const next=stations[index+direction];if(!next)return;
 travelTo(root,next.dataset.adventureId);
 openStation(root,next.dataset.adventureId);
}
function refreshCharacterSelect(inst){
 const root=inst.root,select=root.querySelector('.uri-character-select');
 if(!select)return;
 const id=Object.hasOwn(CHARACTERS,inst.selectedCharacter)?inst.selectedCharacter:'explorer';
 const variant=Math.max(0,Math.min(2,inst.selectedVariant||0));
 const role=PX?.ROLES?.[id];
 select.querySelectorAll('[data-adventure-role]').forEach(button=>{
  const chosen=button.dataset.adventureRole===id;
  button.classList.toggle('selected',chosen);
  button.setAttribute('aria-pressed',String(chosen));
  const art=button.querySelector('.uri-char-card-art');
  if(art&&PX?.svg)art.innerHTML=PX.svg(button.dataset.adventureRole,variant);
 });
 const p=select.querySelector('.uri-char-large-avatar');
 if(p&&PX?.svg)p.innerHTML=PX.svg(id,variant);
 const name=select.querySelector('.uri-char-active-name');if(name)name.textContent=CHARACTERS[id];
 const tag=select.querySelector('.uri-char-active-tag');if(tag)tag.textContent=role?.tag||'Your story begins here';
 const detail=select.querySelector('.uri-char-style-value');if(detail)detail.textContent=role?.detail||'Wedding adventure';
 const change=select.querySelector('.uri-char-variation-label');if(change)change.textContent='Variation '+(variant+1)+'/3';
 const colorName=select.querySelector('.uri-char-variant-name');
 if(colorName)colorName.textContent=(PX?.VARIANTS?.[variant]?.name||'Original')+' colors';
}
function showCharacterSelection(inst){
 if(!inst||inst.destroyed)return;
 const root=inst.root,stage=root.querySelector('.uri-adventure-stage'),panel=root.querySelector('.uri-character-select');
 if(!panel)return;
 if(inst.view!=='character')inst.returnFocus=document.activeElement;
 inst.view='character';
 inst.controls.left=false;inst.controls.right=false;inst.controls.jump=false;
 if(inst.scene?.scene&&!inst.scene.scene.isPaused())inst.scene.scene.pause();
 panel.hidden=false;stage.classList.add('uri-adventure-choosing');
 refreshCharacterSelect(inst);
 panel.querySelector('h2')?.focus?.({preventScroll:true});
}
function hideCharacterSelection(inst){
 const root=inst.root,stage=root.querySelector('.uri-adventure-stage'),panel=root.querySelector('.uri-character-select');
 if(panel)panel.hidden=true;if(stage)stage.classList.remove('uri-adventure-choosing');
 inst.view='world';
 if(inst.scene?.scene?.isPaused?.())inst.scene.scene.resume();
 if(inst.game?.canvas)inst.game.canvas.focus({preventScroll:true});
 else inst.returnFocus?.focus?.({preventScroll:true});
}
function confirmCharacter(inst){
 if(inst.destroyed)return;
 const changed=inst.game&&(inst.playingCharacter!==inst.selectedCharacter||inst.playingVariant!==inst.selectedVariant);
 hideCharacterSelection(inst);
 inst.root.dataset.adventureCharacter=inst.selectedCharacter;
 inst.root.dataset.adventureVariant=String(inst.selectedVariant);
 if(changed){
  inst.game.destroy(true);
  inst.game=null;inst.scene=null;inst.near=null;
 }
 if(!inst.game)startGame(inst);
 else inst.game.canvas?.focus?.({preventScroll:true});
}
function setupUi(root){
 if(root.dataset.adventureWired)return;
 root.dataset.adventureWired='yes';
 const inst={root,scene:null,game:null,controls:{left:false,right:false,jump:false},near:null,view:'world',currentStation:null,
  selectedCharacter:root.dataset.adventureCharacter||'explorer',
  selectedVariant:Math.max(0,Math.min(2,Number(root.dataset.adventureVariant)||0)),
  playingCharacter:null,playingVariant:null,destroyed:false};
 root._uriAdventure=inst;instances.add(inst);
 root.addEventListener('click',ev=>{
  const button=ev.target.closest('button');
  if(!button||!root.contains(button))return;
  const role=button.dataset.adventureRole;
  if(role&&Object.hasOwn(CHARACTERS,role)){inst.selectedCharacter=role;refreshCharacterSelect(inst);return}
  const station=button.dataset.adventureStation;
  if(station){travelTo(root,station);openStation(root,station);return}
  const action=button.dataset.adventureAction;
  if(action==='details'){
   const d=root.querySelector('.uri-adventure-directory');if(d){d.open=true;d.scrollIntoView?.({behavior:'smooth',block:'start'})}
  }else if(action==='interact'){if(inst.near)openStation(root,inst.near)}
  else if(action==='map'||action==='room-map')openMap(root);
  else if(action==='room-exit')exitRoom(root);
  else if(action==='room-prev')moveRoom(root,-1);
  else if(action==='room-next')moveRoom(root,1);
  else if(action==='play'||action==='character')showCharacterSelection(inst);
  else if(action==='variant-prev'||action==='variant-next'){
   inst.selectedVariant=(inst.selectedVariant+(action==='variant-next'?1:2))%3;
   refreshCharacterSelect(inst);
  }
  else if(action==='character-back')hideCharacterSelection(inst);
  else if(action==='confirm-character')confirmCharacter(inst);
 });
 root.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&inst.view&&inst.view!=='world'){
   ev.preventDefault();ev.stopPropagation();exitRoom(root);
  }
 });
 function setControl(control,pressed,ev){
  if(ev?.cancelable)ev.preventDefault();
  if(control==='joystick'){
   if(!pressed){inst.controls.left=false;inst.controls.right=false;root.querySelector('.uri-adventure-stick')?.style.removeProperty('transform');return}
   const bounds=ev.currentTarget.getBoundingClientRect(),mid=bounds.left+bounds.width/2;
   const d=ev.clientX-mid;inst.controls.left=d< -10;inst.controls.right=d>10;
   const dot=root.querySelector('.uri-adventure-stick');if(dot)dot.style.transform='translateX('+Math.max(-23,Math.min(23,d))+'px)';
   return;
  }
  inst.controls[control]=pressed;
 }
 root.querySelectorAll('[data-adventure-control]').forEach(el=>{
  const key=el.dataset.adventureControl;
  if(key==='joystick'){
   el.addEventListener('pointerdown',ev=>{el.setPointerCapture?.(ev.pointerId);setControl(key,true,ev)});
   el.addEventListener('pointermove',ev=>{if(ev.buttons)setControl(key,true,ev)});
  }else el.addEventListener('pointerdown',ev=>{el.setPointerCapture?.(ev.pointerId);setControl(key,true,ev)});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,ev=>setControl(key,false,ev));
 });
}
function drawSprite(scene,key,variant,step,colorVariant=0){
 const g=scene.make.graphics({x:0,y:0,add:false});
 if(PX?.paint){
  PX.paint(g,variant,colorVariant,key,step);
  g.generateTexture('uri-player-'+key,44,50);g.destroy();return;
 }
 const skin=0xf4ceaa,coat=variant==='dreamer'?0x9c80d0:variant==='partner'?0xb38475:0x3f8f9c;
 const hair=variant==='dreamer'?0x69547e:0x4a3a35;
 g.fillStyle(0x283752);g.fillRect(8,32+(step?1:0),7,7);g.fillRect(18,32-(step?1:0),7,7);
 g.fillStyle(coat);g.fillRect(6,17,21,16);g.fillRect(4,20,4,10);g.fillRect(27,20,4,10);
 g.fillStyle(skin);g.fillRect(7,6,20,15);
 g.fillStyle(hair);g.fillRect(6,4,22,7);g.fillRect(6,6,4,7);
 g.fillStyle(0x2d3542);g.fillRect(11,13,2,2);g.fillRect(22,13,2,2);
 if(key==='jump'){g.fillStyle(0x283752);g.fillRect(7,34,7,4);g.fillRect(20,30,7,4)}
 if(key==='interact'){g.fillStyle(skin);g.fillRect(29,13,4,9)}
 g.generateTexture('uri-player-'+key,36,42);g.destroy();
}
function makeScene(P,inst){
 const worldName=inst.root.dataset.adventureWorld,theme=WORLDS[worldName]||WORLDS.meadow;
 const checkpoints=stationNodes(inst.root).map((n,i)=>({id:n.dataset.adventureId,title:n.querySelector('h2')?.textContent||'Invitation',x:300+i*440}));
 const width=Math.max(1600,checkpoints.length*440+620),groundY=418;
 class AdventureScene extends P.Scene{
  constructor(){super({key:'URIAdventureWorld'})}
  create(){
   inst.scene=this;
   this.cameras.main.setBounds(0,0,width,480);
   this.physics.world.setBounds(0,0,width,480);
   this.cameras.main.setBackgroundColor(theme.sky);
   const bg=this.add.graphics();bg.fillStyle(theme.sky);bg.fillRect(0,0,width,480);
   bg.fillStyle(theme.hill,1);
   for(let x=-150;x<width+300;x+=470){bg.fillEllipse(x+170,330,560,220)}
   bg.fillStyle(theme.hill2,1);
   for(let x=-120;x<width+300;x+=350){bg.fillEllipse(x+130,397,460,170)}
   if(worldName==='starlight'){
    bg.fillStyle(0xf3ebcd);
    for(let x=80;x<width;x+=153){bg.fillCircle(x,45+(x%67),2)}
   }else{
    bg.fillStyle(theme.decor);bg.fillCircle(810,84,36);
    bg.fillStyle(0xffffff,.72);
    for(let x=100;x<width;x+=380){bg.fillEllipse(x,83+(x%45),105,26)}
   }
   bg.fillStyle(theme.ground);bg.fillRect(0,groundY,width,62);
   bg.fillStyle(theme.grass);bg.fillRect(0,groundY-7,width,9);
   bg.setDepth(-5);
   // Procedural pixel cottage, castle, bridge, flowers, tree canopies and waterfall.
   window.URIAdventureLandscape?.paint?.(this,worldName,width,groundY);
   const g=this.make.graphics({x:0,y:0,add:false});
   g.fillStyle(theme.ground);g.fillRect(0,0,64,20);g.fillStyle(theme.grass);g.fillRect(0,0,64,6);
   g.generateTexture('uri-platform',64,20);g.destroy();
   const ground=this.physics.add.staticGroup();
   ground.create(width/2,groundY+12,'uri-platform').setDisplaySize(width,34).refreshBody();
   for(let x=530;x<width-240;x+=630){
    const y=300+(x%3)*18;
    ground.create(x,y,'uri-platform').setDisplaySize(120,20).refreshBody();
   }
   const avatar=inst.selectedCharacter||inst.root.dataset.adventureCharacter,variation=inst.selectedVariant||0;
   drawSprite(this,'idle',avatar,0,variation);
   drawSprite(this,'walk0',avatar,0,variation);
   drawSprite(this,'walk1',avatar,1,variation);
   drawSprite(this,'jump',avatar,0,variation);
   drawSprite(this,'interact',avatar,0,variation);
   inst.playingCharacter=avatar;inst.playingVariant=variation;
   this.player=this.physics.add.sprite(88,groundY-44,'uri-player-idle');
   this.player.setSize(28,38).setOffset(8,10).setCollideWorldBounds(true).setBounce(0);
   this.physics.add.collider(this.player,ground);
   this.cameras.main.startFollow(this.player,true,.085,.085,-175,70);
   this.keys=this.input.keyboard?.addKeys('LEFT,RIGHT,UP,SPACE,A,D,W,E');
   const canvas=this.game.canvas;
   if(canvas){canvas.tabIndex=0;canvas.setAttribute('aria-label','Adventure game controls');canvas.focus?.({preventScroll:true})}
   this.checkpoints=checkpoints;
   checkpoints.forEach((cp,i)=>{
    const sign=this.add.container(cp.x,groundY-67);
    const shadow=this.add.rectangle(4,5,155,66,0x3b3033);
    const pole=this.add.rectangle(0,41,10,78,0x63483b);
    const board=this.add.rectangle(0,0,155,66,0xffe8bc).setStrokeStyle(5,0x7a543c);
    const inner=this.add.rectangle(0,0,139,50).setStrokeStyle(2,0xe4b97f);
    const label=this.add.text(0,-15,String(i+1).padStart(2,'0')+'  ✦ '+cp.title.toUpperCase(),
      {fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#644b38',align:'center',wordWrap:{width:130}}).setOrigin(.5,0);
    const dot=this.add.rectangle(0,-44,14,14,theme.decor).setStrokeStyle(3,0xfff0cc);
    this.tweens.add({targets:dot,alpha:.4,duration:800,yoyo:true,repeat:-1});
    board.setInteractive({useHandCursor:true}).on('pointerdown',()=>openStation(inst.root,cp.id));
    sign.add([shadow,pole,board,inner,label,dot]);
   });
   this.collected=0;
   if(inst.root.dataset.adventureCollectibles==='true'){
    const c=this.make.graphics({x:0,y:0,add:false});
    c.fillStyle(0xffd878);c.fillCircle(12,12,11);
    c.lineStyle(2,0xfff6c1);c.strokeCircle(12,12,9);
    c.fillStyle(0xffffff);c.fillCircle(9,9,3);
    c.generateTexture('uri-memory',24,24);c.destroy();
    const items=this.physics.add.staticGroup();
    const total=Math.max(0,Math.ceil((width-510)/380));
    const top=inst.root.querySelector('.uri-pixel-memory-count');
    if(top)top.textContent='0 / '+total;
    for(let x=410;x<width-100;x+=380)items.create(x,groundY-70-(x%3)*33,'uri-memory');
    this.physics.add.overlap(this.player,items,(_,item)=>{
     item.disableBody(true,true);this.collected++;
     const status=inst.root.querySelector('.uri-adventure-stars');
     if(status)status.textContent='Memories: '+this.collected;
     const top=inst.root.querySelector('.uri-pixel-memory-count');
     if(top)top.textContent=this.collected+' / '+total;
    });
   }
   this.input.keyboard?.on('keydown-E',()=>{if(inst.near)openStation(inst.root,inst.near)});
   this.input.keyboard?.on('keydown-M',()=>openMap(inst.root));

   inst.root.querySelector('.uri-adventure-load')?.remove();
   inst.root.querySelector('.uri-adventure-world')?.classList.add('uri-adventure-playing');
  }
  update(){
   if(!this.player?.body)return;
   const keys=this.keys||{},mobile=inst.controls;
   const left=keys.LEFT?.isDown||keys.A?.isDown||mobile.left,right=keys.RIGHT?.isDown||keys.D?.isDown||mobile.right;
   const speed={gentle:175,normal:225,brisk:280}[inst.root.dataset.adventurePace]||225;
   this.player.setVelocityX(left&&!right?-speed:right&&!left?speed:0);
   if(this.player.body.blocked.down&&(keys.UP?.isDown||keys.SPACE?.isDown||keys.W?.isDown||mobile.jump)){
    this.player.setVelocityY(-445);mobile.jump=false;
   }
   if(left!==right){this.player.setFlipX(!!left);this.player.setTexture('uri-player-walk'+(Math.floor(this.time.now/150)%2))}
   else this.player.setTexture('uri-player-idle');
   if(!this.player.body.blocked.down)this.player.setTexture('uri-player-jump');
   const cp=this.checkpoints.reduce((best,c)=>{
    const dist=Math.abs(c.x-this.player.x);
    return dist<110&&(!best||dist<best.dist)?{...c,dist}:best;
   },null);
   inst.near=cp?.id||null;
   const prompt=inst.root.querySelector('.uri-adventure-prompt');
   if(prompt){const label=cp?'Near '+cp.title+' · Press E or Interact':'Move toward a glowing sign to read its details';
    if(prompt.textContent!==label)prompt.textContent=label}
   const locationLabel=inst.root.querySelector('.uri-adventure-position');
   if(locationLabel){
    const progress=Math.min(100,Math.floor(this.player.x/width*100));
    locationLabel.textContent='Journey '+progress+'%';
   }
  }
 }
 return AdventureScene;
}
async function startGame(inst){
 if(inst.destroyed||inst.game)return;
 const root=inst.root,loader=root.querySelector('.uri-adventure-load');
 if(loader){loader.querySelector('span:last-of-type').textContent='Loading the playable world…';const btn=loader.querySelector('button');if(btn)btn.disabled=true}
 try{
  const P=await loadPhaser();
  if(inst.destroyed||!root.isConnected)return;
  const stage=root.querySelector('.uri-adventure-stage');
  inst.game=new P.Game({
   type:P.AUTO,parent:stage,width:960,height:480,backgroundColor:'#9bd6ed',
   pixelArt:true,render:{antialias:false},
   scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH,width:960,height:480},
   physics:{default:'arcade',arcade:{gravity:{y:980},debug:false}},
   scene:[makeScene(P,inst)]
  });
 }catch(err){
  if(loader){loader.innerHTML='<p>Playable mode is unavailable. All invitation details are accessible below.</p>'}
  root.querySelector('.uri-adventure-directory')?.setAttribute('open','');
 }
}
function cleanup(){
 for(const inst of instances)if(!inst.root.isConnected){
  inst.destroyed=true;inst.game?.destroy?.(true);instances.delete(inst);
 }
}
function mount(root=document){
 cleanup();
 const nodes=(root.matches?.('.uri-adventure-site')?[root]:[...root.querySelectorAll?.('.uri-adventure-site')||[]]);
 for(const el of nodes){
  if(el.closest('.template-preview,.wb-cover-mini'))continue;
  setupUi(el);
  if(el.dataset.adventureBootstrapped==='yes')continue;
  el.dataset.adventureBootstrapped='yes';
  if(!el.closest('#wbLivePreview')){
   if(el.dataset.adventureGuestChoice==='true')showCharacterSelection(el._uriAdventure);
   else startGame(el._uriAdventure);
  }
  else{
   const loader=el.querySelector('.uri-adventure-load');
   if(loader)loader.querySelector('span:last-of-type').textContent='Use Play adventure to test this level';
  }
 }
}
function init(){
 const app=document.getElementById('app');if(!app)return;
 mount(app);
 if(window.MutationObserver){
  const observer=new MutationObserver(()=>{
   if(scheduled)return;scheduled=true;
   (window.requestAnimationFrame||setTimeout)(()=>{scheduled=false;mount(app)},16);
  });observer.observe(app,{childList:true,subtree:true});
 }
}
window.URIAdventure={normalize,manager,features,render:preview,mount,openStation,openMap,exitRoom,showCharacterSelection,start:root=>{
 if(!root)return;setupUi(root);return startGame(root._uriAdventure)
},worlds:Object.keys(WORLDS)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();