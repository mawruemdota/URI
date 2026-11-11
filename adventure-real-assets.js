/* URI Adventure Art Pack 2.0 — actual local PNG game assets.
 * Pixel Frog's "Pixel Adventure 1" character animations and terrain.
 * Source: https://pixelfrog-assets.itch.io/pixel-adventure-1
 * License: CC0 1.0 (commercial use and modification permitted; credit optional).
 * The source assets are vendored under adventure-assets/pixel-frog/ so no
 * third-party network, CDN or AI sprite service is needed at runtime.
 */
(function(){
'use strict';
const BASE='adventure-assets/pixel-frog/';
const ROLE={explorer:'frog',partner:'pink',dreamer:'virtual',formal:'mask',floral:'pink',royal:'mask',gown:'gown',barong:'barong'};
const ROLE_FILTER={explorer:'none',partner:'none',dreamer:'none',formal:'none',floral:'hue-rotate(72deg)',royal:'hue-rotate(240deg)'};
const PALETTE=['none','saturate(.85) brightness(1.1)','saturate(1.35)'];
const STATES={idle:11,run:12,jump:1,fall:1};
const WEDDING_STATES={idle:4,run:6,jump:1,fall:1};
const CUSTOM_WEDDING=new Set(['gown','barong']);
const WEDDING_BASE='adventure-assets/wedding-characters/';
const TERRAIN_TILE=16;
function role(character){return ROLE[character]||'frog'}
function path(key,state){return (CUSTOM_WEDDING.has(key)?WEDDING_BASE:BASE)+key+'-'+state+'.png'}
function frameCounts(key){return CUSTOM_WEDDING.has(key)?WEDDING_STATES:STATES}
function portrait(character,variant){
 const p=path(role(character),'idle');
 const filter=[ROLE_FILTER[character]||'none',PALETTE[Number(variant)||0]||'none'].filter(x=>x!=='none').join(' ');
 return '<span class="uri-real-avatar" aria-hidden="true" style="background-image:url(&quot;'+p+'&quot;);filter:'+filter+'"></span>';
}
function coverSprite(character,variant){
 const key=role(character),p=path(key,'idle'),filter=ROLE_FILTER[character]||'none';
 // Crop the first 32px of either the original 11-frame or new 4-frame PNG sheet.
 return '<svg x="200" y="231" width="82" height="82" viewBox="0 0 32 32" overflow="hidden" shape-rendering="crispEdges">'
  +'<image href="'+p+'" x="0" y="0" width="'+(32*frameCounts(key).idle)+'" height="32" preserveAspectRatio="none"'
  +(filter!=='none'?' style="filter:'+filter+'"':'')+' /></svg>';
}
function preload(scene,character){
 const key=role(character);
 for(const state of Object.keys(frameCounts(key)))
  scene.load.spritesheet('uri-pf-'+key+'-'+state,path(key,state),{frameWidth:32,frameHeight:32});
 scene.load.spritesheet('uri-pf-terrain',BASE+'terrain.png',{frameWidth:TERRAIN_TILE,frameHeight:TERRAIN_TILE});
 // Old racing checkpoint flags are intentionally excluded from wedding art.
 scene.load.image('uri-pf-background',BASE+'bg-green.png');
 scene.load.on('loaderror',file=>console.warn('URI: illustration asset unavailable',file?.key));
}
function character(scene,characterId,variant){
 const name=role(characterId),prefix='uri-pf-'+name+'-';
 for(const state of Object.keys(frameCounts(name)))if(!scene.textures.exists(prefix+state))return null;
 const keys={};
 for(const [state,count] of Object.entries(frameCounts(name))){
  const texture=prefix+state,key='uri-pf-animation-'+name+'-'+state;
  if(!scene.anims.exists(key)){
   scene.anims.create({key,frames:scene.anims.generateFrameNumbers(texture,{start:0,end:count-1}),
    frameRate:state==='run'?15:state==='idle'?9:1,repeat:state==='idle'||state==='run'?-1:0});
  }
  keys[state]=key;
 }
 const roleHue={floral:0xa2f6bd,royal:0xffd1a7};
 const shades=[0xffffff,0xe5dfed,0xffd7b1];
 return {name,keys,texture:prefix+'idle',tint:roleHue[characterId]||shades[Number(variant)||0]||0xffffff};
}
function drawWorld(scene,world,width,groundY,platforms){
 if(!scene.textures.exists('uri-pf-terrain'))return false;
 const tint={meadow:0xffffff,sunset:0xffdcc9,starlight:0xa7b5d8}[world]||0xffffff;
 // Use actual 16x16 terrain frames as repeated foreground tiles; no scaled
 // single procedural rectangle is used for the ground appearance.
 for(let x=0;x<width;x+=48){
  scene.add.image(x,groundY-7,'uri-pf-terrain',6)
    .setOrigin(0,0).setDisplaySize(48,48).setTint(tint).setDepth(-.35);
  scene.add.image(x,groundY+41,'uri-pf-terrain',28)
    .setOrigin(0,0).setDisplaySize(48,48).setTint(tint).setDepth(-.35);
 }
 for(const p of platforms){
  for(let i=0;i<3;i++){
   scene.add.image(p.x-60+i*40,p.y-10,'uri-pf-terrain',6)
    .setOrigin(0,0).setDisplaySize(40,20).setTint(tint).setDepth(-.35);
  }
 }
 return true;
}
// An original pixel-heart sign topper replaces Pixel Frog's racing flag.
// Keep a shared two-pixel grid across the three world palettes.
function decorateSign(scene,world,x,y){
 const key='uri-wedding-sign-heart-'+(world||'meadow');
 if(!scene.textures.exists(key)){
  const g=scene.make.graphics({x:0,y:0,add:false});
  const colors={
   meadow:[0x573b39,0xd87589,0xffd9d5],
   sunset:[0x67444a,0xe7a28f,0xffe8c4],
   starlight:[0x413c62,0xaf92d7,0xf5d8ed]
  }[world]||[0x573b39,0xd87589,0xffd9d5];
  const rows=[
   '...###...###...',
   '..#####.#####..',
   '.#############.',
   '.#############.',
   '..###########..',
   '...#########...',
   '....#######....',
   '.....#####.....',
   '......###......',
   '.......#.......'
  ];
  g.fillStyle(colors[0]);
  rows.forEach((row,iy)=>[...row].forEach((v,ix)=>{
   if(v==='#')g.fillRect(ix*2+1,iy*2+6,2,2);
  }));
  g.fillStyle(colors[1]);
  rows.forEach((row,iy)=>[...row].forEach((v,ix)=>{
   if(v==='#')g.fillRect(ix*2+1,iy*2+4,2,2);
  }));
  g.fillStyle(colors[2]);
  g.fillRect(7,8,7,3);g.fillRect(20,8,5,3);
  g.generateTexture(key,32,32);g.destroy();
 }
 return scene.add.image(x,y-70,key).setDepth(.3).setScale(.9);
}
window.URIAdventureRealAssets={version:'2.0',preload,character,drawWorld,decorateSign,portrait,coverSprite,roles:ROLE};
})();
