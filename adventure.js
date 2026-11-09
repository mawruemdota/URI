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
const CHARACTERS={explorer:'Explorer',partner:'Celebration Guest',dreamer:'Dreamer'};
const TITLE={hero:'Welcome',story:'Our Story',gallery:'Photo Gallery',countdown:'Countdown',details:'Event Details',
 timeline:'Event Timeline',dress:'Dress Code',gifts:'Gifts',rsvp:'RSVP'};
const DEFAULTS={world:'meadow',character:'explorer',touch:'buttons',pace:'normal',collectibles:true};
const instances=new Set();
let enginePromise=null, scheduled=false;
const T=v=>esc(v==null?'':String(v));
const uid=x=>String(x||'').replace(/[^a-z0-9-]/gi,'').slice(0,48);
function normalize(v){
 const x=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 return {
  world:Object.hasOwn(WORLDS,x.world)?x.world:DEFAULTS.world,
  character:Object.hasOwn(CHARACTERS,x.character)?x.character:DEFAULTS.character,
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
 return '<article class="uri-builder-site uri-adventure-site wb-theme-adventure wb-spacing-'+d.spacing+'" data-visible-features="'+parts.length+'" data-adventure-world="'+a.world+'" data-adventure-character="'+a.character+'" data-adventure-touch="'+a.touch+'" data-adventure-pace="'+a.pace+'" data-adventure-collectibles="'+a.collectibles+'" style="'+style+'">'
  +'<header class="uri-adventure-heading"><span class="uri-adventure-eyebrow">THE CELEBRATION JOURNEY</span><h1>'+T(e.name1||'Your Name')+' <em>&amp;</em> '+T(e.name2||'Partner Name')+'</h1><p>'+T(e.date?fmt(e.date):'Save the date')+' · '+T(e.venue||'Venue to be announced')+'</p></header>'
  +'<div class="wb-flow"><div class="uri-adventure-world" role="region" aria-label="Playable wedding invitation">'
  +'<div class="uri-adventure-intro"><strong>Explore our invitation</strong><span>Move, jump and visit the glowing signs to uncover the celebration.</span></div>'
  +'<div class="uri-adventure-stage" role="img" aria-label="Original side-scrolling platform game. You can also read all details below.">'
  +'<div class="uri-adventure-load"><span class="uri-adventure-loading-icon" aria-hidden="true">✦</span><span>Preparing your adventure…</span><button type="button" data-adventure-action="play">Play adventure</button></div></div>'
  +'<div class="uri-adventure-hud"><span class="uri-adventure-position" aria-live="off">Starting meadow</span><span class="uri-adventure-stars" aria-live="polite">'+(a.collectibles?'Memories: 0':'A celebration awaits')+'</span><span class="uri-adventure-prompt">Approach a sign and press E or Interact</span></div>'
  +'<div class="uri-adventure-controls" aria-label="Game controls">'
  +(a.touch==='joystick'?'<div class="uri-adventure-joystick" data-adventure-control="joystick" role="group" aria-label="Movement joystick"><span class="uri-adventure-stick" aria-hidden="true"></span><small>Move</small></div>'
   :'<div class="uri-adventure-dpad"><button type="button" data-adventure-control="left" aria-label="Move left">◀</button><button type="button" data-adventure-control="right" aria-label="Move right">▶</button></div>')
  +'<div class="uri-adventure-actions"><button type="button" data-adventure-control="jump" aria-label="Jump">Jump</button><button type="button" data-adventure-action="interact" aria-label="Interact with nearby invitation sign">Interact</button></div></div>'
  +'<div class="uri-adventure-tools"><button type="button" data-adventure-action="map">World map</button><button type="button" data-adventure-action="details">View all details / Skip game</button><span>Desktop: ← → / A D, Space to jump, E to interact</span></div>'
  +'</div><details class="uri-adventure-directory"><summary>View all invitation information without playing</summary><div class="uri-adventure-pages">'
  +parts.map(p=>'<div class="uri-adventure-page" data-adventure-id="'+p.id+'"><h2>'+T(p.title)+'</h2>'+p.html+'</div>').join('')
  +(parts.length===0?'<p>Add invitation sections in the Features tab.</p>':'')+'</div></details></div>'
  +'<dialog class="uri-adventure-dialog" aria-label="Invitation information"><div class="uri-adventure-dialog-head"><strong class="uri-adventure-dialog-title">Invitation details</strong><button type="button" data-adventure-action="close" aria-label="Close invitation details">Close</button></div><div class="uri-adventure-dialog-body"></div></dialog>'
  +'<dialog class="uri-adventure-map" aria-label="Adventure world map"><h2>Choose a destination</h2><p>Jump directly to any invitation detail.</p><div class="uri-adventure-map-list">'
  +parts.map((p,i)=>'<button type="button" data-adventure-station="'+p.id+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+T(p.title)+'</button>').join('')
  +'</div><button type="button" data-adventure-action="close">Back to game</button></dialog>'
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
const controls=(key,label,options,a)=>'<label class="wb-field uri-adventure-setting"><span>'+label+'</span><select onchange="uriAdventureSet(\''+key+'\',this.value)">'+options.map(([id,title])=>'<option value="'+id+'"'+(a[key]===id?' selected':'')+'>'+title+'</option>').join('')+'</select></label>';
function manager(e){
 if(!active(e))return '';
 const a=normalize(e.adventure),parts=features(e);
 return '<section class="uri-adventure-manager" aria-labelledby="uriAdventureManagerTitle"><h3 id="uriAdventureManagerTitle">Game Template Manager</h3>'
  +'<p>Design a playable invitation. All checkpoints use your existing Content and Features settings.</p>'
  +'<div class="uri-adventure-setting-grid">'
  +controls('world','World appearance',Object.entries(WORLDS).map(([id,v])=>[id,v.name]),a)
  +controls('character','Playable character',Object.entries(CHARACTERS).map(([id,label])=>[id,label]),a)
  +controls('touch','Mobile movement', [['buttons','Left / Right buttons'],['joystick','Virtual joystick']],a)
  +controls('pace','Movement speed',[['gentle','Gentle'],['normal','Normal'],['brisk','Brisk']],a)
  +'</div><label class="uri-adventure-checkbox"><input type="checkbox" onchange="uriAdventureSet(\'collectibles\',this.checked)"'+(a.collectibles?' checked':'')+'> Collectible memories (optional)</label>'
  +'<div class="uri-adventure-stations"><strong>Active checkpoints ('+parts.length+')</strong><p>Show, hide and reorder these stations in the Features tab.</p><ol>'
  +parts.map(p=>'<li>'+T(p.title)+'</li>').join('')+'</ol></div>'
  +'<p class="uri-adventure-editor-help">Use <b>Play adventure</b> in the preview to test movement. Guests can always skip to event details and RSVP.</p></section>';
}
window.uriAdventureSet=(key,value)=>{
 const e=current();if(!active(e))return;
 const next=normalize({...normalize(e.adventure),[key]:value});
 if(!['world','character','touch','pace','collectibles'].includes(key))return;
 if(key==='collectibles'&&typeof value!=='boolean')return;
 if(key!=='collectibles'&&next[key]!==value)return;
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
function closeDialog(root,dialog){
 if(dialog?.open)dialog.close();
 else if(dialog)dialog.removeAttribute('data-fallback-open');
 const inst=root._uriAdventure;
 if(inst?.scene?.scene?.isPaused?.())inst.scene.scene.resume();
 inst?.scene?.input?.keyboard?.resetKeys?.();
}
function openStation(root,id){
 const page=stationNodes(root).find(p=>p.dataset.adventureId===id);
 if(!page)return;
 const dialog=root.querySelector('.uri-adventure-dialog');
 if(!dialog)return;
 root._uriAdventure?.scene?.scene?.pause?.();
 dialog.querySelector('.uri-adventure-dialog-title').textContent=page.querySelector('h2')?.textContent||'Invitation details';
 dialog.querySelector('.uri-adventure-dialog-body').innerHTML=page.innerHTML;
 if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();
 else dialog.setAttribute('data-fallback-open','yes');
 dialog.querySelector('[data-adventure-action="close"]')?.focus();
}
function openMap(root){
 const map=root.querySelector('.uri-adventure-map');if(!map)return;
 root._uriAdventure?.scene?.scene?.pause?.();
 if(typeof map.showModal==='function'&&!map.open)map.showModal();
 else map.setAttribute('data-fallback-open','yes');
 map.querySelector('button')?.focus();
}
function setupUi(root){
 if(root.dataset.adventureWired)return;
 root.dataset.adventureWired='yes';
 const inst={root,scene:null,game:null,controls:{left:false,right:false,jump:false},near:null,destroyed:false};
 root._uriAdventure=inst;instances.add(inst);
 root.addEventListener('click',ev=>{
  const button=ev.target.closest('button');
  if(!button||!root.contains(button))return;
  const station=button.dataset.adventureStation;
  if(station){closeDialog(root,root.querySelector('.uri-adventure-map'));openStation(root,station);return}
  const action=button.dataset.adventureAction;
  if(action==='details'){
   const d=root.querySelector('.uri-adventure-directory');if(d){d.open=true;d.scrollIntoView?.({behavior:'smooth',block:'start'})}
  }else if(action==='interact'){if(inst.near)openStation(root,inst.near)}
  else if(action==='map')openMap(root);
  else if(action==='close')closeDialog(root,button.closest('dialog'));
  else if(action==='play')startGame(inst);
 });
 root.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{if(inst.scene?.scene?.isPaused?.())inst.scene.scene.resume()}));
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
function drawSprite(scene,key,variant,step){
 const g=scene.make.graphics({x:0,y:0,add:false});
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
   for(let x=190;x<width;x+=260){
    bg.fillStyle(0x634b40);bg.fillRect(x,groundY-57,10,50);
    bg.fillStyle(theme.hill2);bg.fillCircle(x+5,groundY-69,29);
   }
   bg.setDepth(-5);
   const g=this.make.graphics({x:0,y:0,add:false});
   g.fillStyle(theme.ground);g.fillRect(0,0,64,20);g.fillStyle(theme.grass);g.fillRect(0,0,64,6);
   g.generateTexture('uri-platform',64,20);g.destroy();
   const ground=this.physics.add.staticGroup();
   ground.create(width/2,groundY+12,'uri-platform').setDisplaySize(width,34).refreshBody();
   for(let x=530;x<width-240;x+=630){
    const y=300+(x%3)*18;
    ground.create(x,y,'uri-platform').setDisplaySize(120,20).refreshBody();
   }
   drawSprite(this,'idle',inst.root.dataset.adventureCharacter,0);
   drawSprite(this,'walk0',inst.root.dataset.adventureCharacter,0);
   drawSprite(this,'walk1',inst.root.dataset.adventureCharacter,1);
   drawSprite(this,'jump',inst.root.dataset.adventureCharacter,0);
   drawSprite(this,'interact',inst.root.dataset.adventureCharacter,0);
   this.player=this.physics.add.sprite(88,groundY-40,'uri-player-idle');
   this.player.setSize(25,36).setOffset(5,4).setCollideWorldBounds(true).setBounce(0);
   this.physics.add.collider(this.player,ground);
   this.cameras.main.startFollow(this.player,true,.085,.085,-175,70);
   this.keys=this.input.keyboard?.addKeys('LEFT,RIGHT,UP,SPACE,A,D,W,E');
   this.checkpoints=checkpoints;
   checkpoints.forEach((cp,i)=>{
    const sign=this.add.container(cp.x,groundY-67);
    const pole=this.add.rectangle(0,31,7,64,0x654f45);
    const board=this.add.rectangle(0,0,124,53,0xffe7b1).setStrokeStyle(3,0x705740);
    const label=this.add.text(0,-12,String(i+1).padStart(2,'0')+'  '+cp.title.toUpperCase(),
      {fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#493b35',align:'center',wordWrap:{width:112}}).setOrigin(.5,0);
    const dot=this.add.circle(0,-42,8,theme.decor).setStrokeStyle(2,0xffffff);
    this.tweens.add({targets:dot,alpha:.4,duration:800,yoyo:true,repeat:-1});
    board.setInteractive({useHandCursor:true}).on('pointerdown',()=>openStation(inst.root,cp.id));
    sign.add([pole,board,label,dot]);
   });
   this.collected=0;
   if(inst.root.dataset.adventureCollectibles==='true'){
    const c=this.make.graphics({x:0,y:0,add:false});
    c.fillStyle(0xffd878);c.fillStar(12,12,5,5,11);c.generateTexture('uri-memory',24,24);c.destroy();
    const items=this.physics.add.staticGroup();
    for(let x=410;x<width-100;x+=380)items.create(x,groundY-70-(x%3)*33,'uri-memory');
    this.physics.add.overlap(this.player,items,(_,item)=>{
     item.disableBody(true,true);this.collected++;
     const status=inst.root.querySelector('.uri-adventure-stars');
     if(status)status.textContent='Memories: '+this.collected;
    });
   }
   this.input.keyboard?.on('keydown-E',()=>{if(inst.near)openStation(inst.root,inst.near)});
   this.input.keyboard?.on('keydown-UP',()=>{if(inst.near&&this.player.body.blocked.down===false)return});
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
window.URIAdventure={normalize,manager,features,render:preview,mount,start:root=>{
 if(!root)return;setupUi(root);return startGame(root._uriAdventure)
},worlds:Object.keys(WORLDS)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();