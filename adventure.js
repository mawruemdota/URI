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
const DEFAULTS={world:'meadow',character:'explorer',characterVariant:0,guestChoice:false,touch:'buttons',pace:'normal',collectibles:true};
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
  guestChoice:false, // Legacy published drafts must not let guests change the owner's character.
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
const originalModel=U.model;
U.model=function(e){const result=originalModel(e);if(active(e))e.adventure=normalize(e.adventure);return result};
const originalRender=U.render,originalCover=U.cover,originalPayload=U.payload;
function preview(e){
 const d=U.design(e),a=normalize(e.adventure),world=WORLDS[a.world],parts=features(e);
 const style='--wb-bg:'+d.bg+';--wb-ink:'+d.ink+';--wb-accent:'+d.accent+
  ';--wb-heading:'+U.fonts[d.heading]+';--wb-body:'+U.fonts[d.body]+';';
 return '<article class="uri-builder-site uri-adventure-site wb-theme-adventure wb-spacing-'+d.spacing+'" data-visible-features="'+parts.length+'" data-adventure-world="'+a.world+'" data-adventure-character="'+a.character+'" data-adventure-variant="'+a.characterVariant+'" data-adventure-touch="'+a.touch+'" data-adventure-pace="'+a.pace+'" data-adventure-collectibles="'+a.collectibles+'" style="'+style+'">'
  +'<header class="uri-adventure-heading">'
  +'<div class="uri-pixel-topbar"><div class="uri-pixel-brand"><span class="uri-pixel-brand-flower">✿</span><div><strong>URI ADVENTURE</strong><small>WEDDING INVITATION QUEST</small></div></div>'
  +'<div class="uri-pixel-topnav"><span class="uri-pixel-topmemories"><span class="uri-pixel-nav-icon">✧</span> <strong>Memories</strong><span class="uri-pixel-memory-count">0 / 0</span></span>'
  +'<button type="button" data-adventure-action="map"><span class="uri-pixel-nav-icon">▤</span> Journey [M]</button>'
  +'<a href="#home" class="uri-pixel-home"><span class="uri-pixel-nav-icon">⌂</span> URI Home</a></div></div>'
  +'<div class="uri-pixel-banner"><span class="uri-pixel-wedding-rings" aria-hidden="true">♡</span><span class="uri-adventure-eyebrow">THE ADVENTURE BEGINS</span>'
  +'<h1>'+T(e.name1||'Your Name')+' <em>&amp;</em> '+T(e.name2||'Partner Name')+'</h1>'
  +'<p class="uri-pixel-event-meta"><span>▣ '+T(e.date?fmt(e.date):'Save the date')+'</span><span>⌖ '+T(e.venue||'Venue to be announced')+'</span></p></div>'
  +'</header>'
  +'<div class="wb-flow"><div class="uri-adventure-world" role="region" aria-label="Playable wedding invitation">'
  +'<div class="uri-adventure-intro"><strong>✦ A CELEBRATION ADVENTURE ✦</strong><span>Move, jump and explore the signposts to uncover the invitation.</span></div>'
  +'<div class="uri-adventure-stage" role="group" aria-label="Playable platform game with explorable invitation areas">'
  +'<div class="uri-adventure-load"><span class="uri-adventure-loading-icon" aria-hidden="true">✦</span><span>Step into your story</span><button type="button" data-adventure-action="play">Play adventure</button></div>'
  +'<section class="uri-adventure-interior" hidden role="region" aria-label="Inside an adventure area">'
  +'<div class="uri-adventure-interior-scenery" aria-hidden="true"><span class="uri-adventure-interior-window"></span><span class="uri-adventure-interior-banner"></span></div>'
  +'<header class="uri-adventure-room-head"><span class="uri-adventure-room-eyebrow">INSIDE THE ADVENTURE</span><h2 class="uri-adventure-room-title" tabindex="-1">Welcome</h2><button type="button" data-adventure-action="room-exit">← Return to world</button></header>'
  +'<div class="uri-adventure-room-body" tabindex="0"></div>'
  +'<nav class="uri-adventure-room-nav" aria-label="Continue exploring"><span>Return to the path to discover the next checkpoint.</span><button type="button" data-adventure-action="room-map">Journey map</button></nav>'
  +'</section></div>'
  +'<div class="uri-adventure-hud"><span class="uri-adventure-position" aria-live="off">Starting meadow</span><span class="uri-adventure-stars" aria-live="polite">'+(a.collectibles?'Memories: 0':'A celebration awaits')+'</span><span class="uri-adventure-prompt">Approach a sign and press E or Interact</span></div>'
  +'<div class="uri-adventure-controls" aria-label="Game controls">'
  +(a.touch==='joystick'?'<div class="uri-adventure-joystick" data-adventure-control="joystick" role="group" aria-label="Movement joystick"><span class="uri-adventure-stick" aria-hidden="true"></span><small>Move</small></div>'
   :'<div class="uri-adventure-dpad"><button type="button" data-adventure-control="left" aria-label="Move left">◀</button><button type="button" data-adventure-control="right" aria-label="Move right">▶</button></div>')
  +'<div class="uri-adventure-actions"><button type="button" data-adventure-control="jump" aria-label="Jump">Jump</button><button type="button" data-adventure-action="interact" aria-label="Interact with nearby invitation sign">Interact</button></div></div>'
  +'<div class="uri-adventure-tools"><a class="uri-adventure-rsvp-link" hidden href="#home">RSVP now</a><span class="uri-adventure-keyboard-hint">Move: ← → / A D · Jump: Space · Interact: E · Journey: M</span><span class="uri-adventure-mobile-hint">Walk toward a sign, then tap Interact to discover each part of the invitation.</span></div>'
  +'</div><div class="uri-adventure-directory" hidden aria-hidden="true"><div class="uri-adventure-pages">'
  +parts.map(p=>'<div class="uri-adventure-page" data-adventure-id="'+p.id+'"><h2>'+T(p.title)+'</h2>'+p.html+'</div>').join('')
  +(parts.length===0?'<p>Add invitation sections in the Features tab.</p>':'')+'</div></div></div>'
  +'<footer class="wb-footer">URI · Your celebration, your adventure</footer></article>';
}
U.render=e=>active(e)?preview(e):originalRender(e);
U.cover=e=>{
 if(!active(e))return originalCover(e);
 const d=U.design(e),a=normalize(e.adventure);
 const illustration=window.URIAdventureArtPack?.cover?.(a.world,a.character,a.characterVariant)||'';
 return '<div class="wb-cover-mini uri-adventure-mini uri-adventure-cover-v2" data-adventure-world="'+a.world+'" style="--wb-bg:'+d.bg+';--wb-ink:'+d.ink+';--wb-accent:'+d.accent+'">'
  +illustration
  +'<div class="uri-adventure-cover-label"><small>URI · ADVENTURE INVITATION</small><strong>'+T(e.name1||'Maya')+' <em>&amp;</em> '+T(e.name2||'Emir')+'</strong><span>THE ADVENTURE BEGINS</span></div>'
  +'</div>';
};
U.payload=e=>({...originalPayload(e),adventure:normalize(e.adventure)});
const controls=(key,label,options,a)=>'<label class="wb-field uri-adventure-setting"><span>'+label+'</span><select onchange="uriAdventureSet(\''+key+'\',this.value)">'+options.map(([id,title])=>'<option value="'+id+'"'+(String(a[key])===String(id)?' selected':'')+'>'+title+'</option>').join('')+'</select></label>';
function ownerCharacterChooser(a){
 return '<fieldset class="uri-adventure-owner-chooser"><legend>Main character — selected by the invitation owner</legend>'
  +'<p>Every guest will play as this character. Guests cannot change the character.</p>'
  +'<div class="uri-adventure-owner-roster" role="group" aria-label="Choose the main playable character">'
  +Object.entries(CHARACTERS).map(([id,label])=>
   '<button type="button" class="uri-adventure-owner-card'+(id===a.character?' selected':'')+
   '" data-uri-character="'+id+'" aria-pressed="'+(id===a.character)+'" onclick="uriAdventureSet(\'character\',\''+id+'\')">'
   +'<span class="uri-adventure-owner-avatar">'+(PX?.svg(id,a.characterVariant)||'✿')+'</span>'
   +'<strong>'+T(label)+'</strong></button>'
  ).join('')
  +'</div><div class="uri-adventure-variant-row"><strong>Outfit palette</strong>'
  +[0,1,2].map(i=>'<button type="button" class="'+(a.characterVariant===i?'selected':'')+
   '" aria-pressed="'+(a.characterVariant===i)+'" onclick="uriAdventureSet(\'characterVariant\','+i+')">'
   +T(PX?.VARIANTS[i]?.name||'Original')+'</button>').join('')
  +'</div></fieldset>';
}
function manager(e){
 if(!active(e))return '';
 const a=normalize(e.adventure),parts=features(e);
 return '<section class="uri-adventure-manager" aria-labelledby="uriAdventureManagerTitle"><h3 id="uriAdventureManagerTitle">Game Template Manager</h3>'
  +'<p>Customize the playable invitation. The client chooses one main character for all guests.</p>'
  +ownerCharacterChooser(a)
  +'<div class="uri-adventure-setting-grid">'
  +controls('world','World appearance',Object.entries(WORLDS).map(([id,v])=>[id,v.name]),a)
  +controls('touch','Mobile movement',[['buttons','Left / Right buttons'],['joystick','Virtual joystick']],a)
  +controls('pace','Movement speed',[['gentle','Gentle'],['normal','Normal'],['brisk','Brisk']],a)
  +'</div><div class="uri-adventure-default-preview" aria-label="Main character preview">'
  +'<div class="uri-adventure-default-avatar">'+(PX?.svg(a.character,a.characterVariant)||'✿')+'</div>'
  +'<div><strong>'+T(CHARACTERS[a.character])+'</strong><p>'+T(PX?.ROLES[a.character]?.tag||'Your invitation main character')+'</p>'
  +'<small>'+T(PX?.VARIANTS[a.characterVariant]?.name||'Original')+' outfit · Shown to all guests</small></div></div>'
  +'<label class="uri-adventure-checkbox"><input type="checkbox" onchange="uriAdventureSet(\'collectibles\',this.checked)"'+(a.collectibles?' checked':'')+'> Collectible memories (optional)</label>'
  +'<div class="uri-adventure-stations"><strong>Active checkpoints ('+parts.length+')</strong><p>Show, hide and reorder these stations in the Features tab.</p><ol>'
  +parts.map(p=>'<li>'+T(p.title)+'</li>').join('')+'</ol></div>'
  +'<p class="uri-adventure-editor-help">Press <b>Play adventure</b> to preview the client-selected main character. Guests enter the game directly.</p></section>';
}
window.uriAdventureSet=(key,value)=>{
 const e=current();if(!active(e))return;
 const next=normalize({...normalize(e.adventure),[key]:value});
 if(!['world','character','characterVariant','touch','pace','collectibles'].includes(key))return;
 if(key==='collectibles'&&typeof value!=='boolean')return;
 if(!['collectibles','characterVariant'].includes(key)&&next[key]!==value)return;
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
function enterRoom(root,heading,view){
 const inst=root._uriAdventure,stage=root.querySelector('.uri-adventure-stage');
 const room=stage?.querySelector('.uri-adventure-interior');
 if(!room)return null;
 if(inst){
  if(inst.view==='world'||!inst.view)inst.returnFocus=document.activeElement;
  inst.view=view;
  inst.controls.left=false;inst.controls.right=false;inst.controls.jump=false;
  if(inst.scene?.player){
   inst.scene.player.setVelocity(0,0);
   inst.scene.player.body?.setAllowGravity?.(false);
   if(inst.scene.uriArtCharacter)
    inst.scene.player.setTexture(inst.scene.uriArtCharacter.key,inst.scene.uriArtCharacter.frame('interact'));
   else if(inst.scene.textures?.exists?.('uri-player-interact'))
    inst.scene.player.setTexture('uri-player-interact');
  }
  // Keep Phaser's global loop running; view-mode gating in update() freezes
  // movement while the HTML area is being read without a fragile scene pause.
 }
 room.hidden=false;
 stage.classList.add('uri-adventure-inside');
 root.querySelector('.uri-adventure-world')?.classList.add('uri-adventure-room-open');
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
 root.querySelector('.uri-adventure-world')?.classList.remove('uri-adventure-room-open');
 stage.removeAttribute('data-interior-type');
 room.querySelector('.uri-adventure-room-body').replaceChildren();
 // A room can be taller than the landscape viewport, especially on phones.
 // Bring the canvas back into view after the room collapses.
 stage.scrollIntoView?.({behavior:'auto',block:'nearest'});
 if(inst){
  inst.view='world';inst.currentStation=null;
  inst.controls.left=false;inst.controls.right=false;inst.controls.jump=false;
  inst.scene?.player?.body?.setAllowGravity?.(true);
  inst.scene?.player?.setVelocity?.(0,0);
  inst.scene?.input?.keyboard?.resetKeys?.();
  const preferred=inst.game?.canvas||inst.returnFocus;
  preferred?.focus?.({preventScroll:true});
 }
}
function openStation(root,id){
 const inst=root._uriAdventure,scene=inst?.scene;
 const checkpoint=scene?.checkpoints?.find(c=>c.id===id);
 // No remote sign clicks, direct map jumping, or out-of-order station access.
 // The character must physically reach the checkpoint in the playable world.
 if(!scene?.player||!checkpoint||Math.abs(scene.player.x-checkpoint.x)>150)return;
 const page=stationNodes(root).find(p=>p.dataset.adventureId===id);
 if(!page)return;
 inst.visited?.add(id);
 const title=page.querySelector('h2')?.textContent||'Invitation details';
 const room=enterRoom(root,title,'station');if(!room)return;
 const stage=root.querySelector('.uri-adventure-stage');
 stage.dataset.interiorType=id;
 if(inst)inst.currentStation=id;
 room.querySelector('.uri-adventure-room-nav').hidden=false;
 const content=room.querySelector('.uri-adventure-room-body');
 // The room itself already supplies a title. Reusing the source heading makes
 // every area look doubled-up. Clone the actual invitation content instead,
 // stripping builder-only edit controls from its read-only presentation.
 const paper=document.createElement('div');paper.className='uri-adventure-room-content';
 const source=page.cloneNode(true);
 source.querySelector(':scope > h2')?.remove();
 source.querySelectorAll('.wb-visual-toolbar,.wb-inline-edit').forEach(el=>el.remove());
 while(source.firstChild)paper.appendChild(source.firstChild);
 // The themed room header already shows the checkpoint name. Omit an identical
 // heading inside the copied content, retaining differently named subheadings.
 const firstHeading=paper.querySelector('h1,h2,h3');
 if(firstHeading?.textContent?.trim().replace(/\s+/g,' ').toLowerCase()===title.trim().replace(/\s+/g,' ').toLowerCase())
  firstHeading.remove();
 content.replaceChildren(paper);
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
 const inst=root._uriAdventure;
 const room=enterRoom(root,'Your Journey','map');if(!room)return;
 root.querySelector('.uri-adventure-stage').dataset.interiorType='map';
 room.querySelector('.uri-adventure-room-nav').hidden=true;
 const list=stationNodes(root).map((p,i)=>{
  const visited=inst?.visited?.has(p.dataset.adventureId)||false;
  return '<div class="uri-adventure-map-stop" data-visited="'+visited+'"><span class="uri-adventure-map-index">'+String(i+1).padStart(2,'0')+'</span><span>'+T(p.querySelector('h2')?.textContent||'Invitation area')+'</span><small>'+(visited?'DISCOVERED':'UNEXPLORED')+'</small></div>';
 }).join('');
 room.querySelector('.uri-adventure-room-body').innerHTML='<div class="uri-adventure-map-sheet"><p>Discover each chapter by walking to its signpost. The journey map shows your progress but does not skip ahead.</p><div class="uri-adventure-map-list">'+list+'</div></div>';
}
function setupUi(root){
 if(root.dataset.adventureWired)return;
 root.dataset.adventureWired='yes';
 const inst={root,scene:null,game:null,controls:{left:false,right:false,jump:false},near:null,view:'world',currentStation:null,visited:new Set(),
  selectedCharacter:root.dataset.adventureCharacter||'explorer',
  selectedVariant:Math.max(0,Math.min(2,Number(root.dataset.adventureVariant)||0)),
  playingCharacter:null,playingVariant:null,destroyed:false};
 root._uriAdventure=inst;instances.add(inst);
 root.addEventListener('click',ev=>{
  const button=ev.target.closest('button');
  if(!button||!root.contains(button))return;
  const action=button.dataset.adventureAction;
  if(action==='interact'){if(inst.near)openStation(root,inst.near)}
  else if(action==='map'||action==='room-map')openMap(root);
  else if(action==='room-exit')exitRoom(root);
  else if(action==='play')startGame(inst);

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
   const artPack=window.URIAdventureArtPack;
   const hasArtPack=!!artPack?.decorate;
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
   bg.setDepth(-15);
   // Generated reusable sprite textures and parallax art replace the old shape scenery.
   // Preserve the legacy painter as a fallback if canvas generation is unavailable.
   let artwork=null;
   try{if(hasArtPack)artwork=artPack.decorate(this,worldName,width,groundY)}catch(err){console.warn('Adventure art pack fallback:',err)}
   if(!artwork)window.URIAdventureLandscape?.paint?.(this,worldName,width,groundY);
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
   let artCharacter=null;
   try{artCharacter=artPack?.character?.(this,avatar,variation,PX)}catch(err){console.warn('Adventure sprite sheet fallback:',err)}
   if(!artCharacter){
    drawSprite(this,'idle',avatar,0,variation);
    drawSprite(this,'walk0',avatar,0,variation);
    drawSprite(this,'walk1',avatar,1,variation);
    drawSprite(this,'jump',avatar,0,variation);
    drawSprite(this,'interact',avatar,0,variation);
   }
   this.uriArtCharacter=artCharacter;
   inst.playingCharacter=avatar;inst.playingVariant=variation;
   this.player=this.physics.add.sprite(88,groundY-44,artCharacter?.key||'uri-player-idle',0);
   this.player.setSize(28,38).setOffset(8,10).setCollideWorldBounds(true).setBounce(0);
   this.physics.add.collider(this.player,ground);
   this.cameras.main.startFollow(this.player,true,.085,.085,inst.viewportWidth===720?-90:-175,70);
   this.keys=this.input.keyboard?.addKeys('LEFT,RIGHT,UP,SPACE,A,D,W,E');
   const canvas=this.game.canvas;
   if(canvas){canvas.tabIndex=0;canvas.setAttribute('aria-label','Adventure game controls');canvas.focus?.({preventScroll:true})}
   this.checkpoints=checkpoints;
   checkpoints.forEach((cp,i)=>{
    const sign=this.add.container(cp.x,groundY-67);
    const shadow=this.add.rectangle(4,5,178,72,0x3b3033,artwork?.sign?0:.7);
    const pole=this.add.rectangle(0,41,10,78,0x63483b,artwork?.sign?0:1);
    const board=this.add.rectangle(0,0,178,72,0xffe8bc,artwork?.sign?0:1).setStrokeStyle(artwork?.sign?0:5,0x7a543c);
    const inner=this.add.rectangle(0,0,162,56,0xffe8bc,artwork?.sign?0:1).setStrokeStyle(artwork?.sign?0:2,0xe4b97f);
    const illustrated=artwork?.sign?.(cp.x,groundY-67);
    const label=this.add.text(0,-16,String(i+1).padStart(2,'0')+'  ✦ '+cp.title.toUpperCase(),
      {fontFamily:'Pixelify Sans, monospace',fontSize:'16px',fontStyle:'bold',color:'#4c382b',align:'center',wordWrap:{width:156}}).setOrigin(.5,0);
    const dot=this.add.rectangle(0,-44,14,14,theme.decor).setStrokeStyle(3,0xfff0cc);
    if(!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
     this.tweens.add({targets:dot,alpha:.4,duration:800,yoyo:true,repeat:-1});
    board.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
     if(this.player&&Math.abs(this.player.x-cp.x)<=145)openStation(inst.root,cp.id);
    });
    sign.add([shadow,pole,board,inner,label,dot]);
    // The illustrated sign is placed behind the interactive text and hit target.
    if(illustrated)illustrated.setDepth(-.2);
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
   if(inst.view!=='world'){
    this.player.setVelocityX(0);
    return;
   }
   const keys=this.keys||{},mobile=inst.controls;
   const left=keys.LEFT?.isDown||keys.A?.isDown||mobile.left,right=keys.RIGHT?.isDown||keys.D?.isDown||mobile.right;
   const speed={gentle:175,normal:225,brisk:280}[inst.root.dataset.adventurePace]||225;
   this.player.setVelocityX(left&&!right?-speed:right&&!left?speed:0);
   if(this.player.body.blocked.down&&(keys.UP?.isDown||keys.SPACE?.isDown||keys.W?.isDown||mobile.jump)){
    this.player.setVelocityY(-445);mobile.jump=false;
   }
   const state=left!==right?'walk'+(Math.floor(this.time.now/150)%2):'idle';
   this.player.setFlipX(!!left);
   const pose=!this.player.body.blocked.down?'jump':state;
   if(this.uriArtCharacter)this.player.setTexture(this.uriArtCharacter.key,this.uriArtCharacter.frame(pose));
   else this.player.setTexture('uri-player-'+pose);
   const cp=this.checkpoints.reduce((best,c)=>{
    const dist=Math.abs(c.x-this.player.x);
    return dist<145&&(!best||dist<best.dist)?{...c,dist}:best;
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
  const viewportWidth=stage.clientWidth<700?720:960;
  inst.viewportWidth=viewportWidth;
  inst.game=new P.Game({
   type:P.AUTO,parent:stage,width:viewportWidth,height:480,backgroundColor:'#9bd6ed',
   pixelArt:true,render:{antialias:false},
   scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH,width:viewportWidth,height:480},
   physics:{default:'arcade',arcade:{gravity:{y:980},debug:false}},
   scene:[makeScene(P,inst)]
  });
  // A full-page preview can switch between 1024px desktop and 390px mobile
  // without remounting the invitation. Keep game and CSS aspect ratios paired.
  if(window.ResizeObserver){
   inst.viewportObserver?.disconnect?.();
   inst.viewportObserver=new ResizeObserver(()=>{
    if(inst.destroyed||!inst.game||!stage.isConnected)return;
    const nextWidth=stage.clientWidth<700?720:960;
    if(inst.viewportWidth===nextWidth)return;
    inst.viewportWidth=nextWidth;
    inst.game.scale.resize(nextWidth,480);
    if(inst.scene?.cameras?.main){
     inst.scene.cameras.main.setSize(nextWidth,480);
     inst.scene.cameras.main.followOffset.x=nextWidth===720?-90:-175;
    }
   });
   inst.viewportObserver.observe(stage);
  }
 }catch(err){
  if(loader){loader.innerHTML='<p>Playable mode is unavailable. All invitation details are accessible below.</p>'}
  root.querySelector('.uri-adventure-directory')?.setAttribute('open','');
 }
}
function cleanup(){
 for(const inst of instances)if(!inst.root.isConnected){
  inst.destroyed=true;inst.viewportObserver?.disconnect?.();inst.game?.destroy?.(true);instances.delete(inst);
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
  if(!el.closest('#wbLivePreview'))startGame(el._uriAdventure);
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
window.URIAdventure={normalize,manager,features,render:preview,mount,openStation,openMap,exitRoom,start:root=>{
 if(!root)return;setupUi(root);return startGame(root._uriAdventure)
},worlds:Object.keys(WORLDS)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();