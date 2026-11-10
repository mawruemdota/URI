/* URI Adventure Pixel Art — original, asset-free sprites shared by
 * character selection cards and Phaser's Arcade player.
 * Each role shares identical collision dimensions and movement. */
(function(){
'use strict';
const ROLES={
 explorer:{name:'Explorer',tag:'A curious traveler',detail:'Scarf, satchel and a keepsake charm',icon:'✧',skin:'#efb997',hair:'#50352c',outfit:'#f3dfbd',secondary:'#b94f42',trim:'#604a34'},
 partner:{name:'Celebration Guest',tag:'Dressed for the occasion',detail:'Ribbon, festive dress and a little sparkle',icon:'♡',skin:'#e8b38e',hair:'#75442f',outfit:'#efe1b6',secondary:'#759d70',trim:'#b67b6a'},
 dreamer:{name:'Dreamer',tag:'A keeper of stories',detail:'Sage beret, storybook and star charm',icon:'✦',skin:'#f2c6a7',hair:'#b18450',outfit:'#789b76',secondary:'#d2c392',trim:'#384b7c'},
 formal:{name:'Formal Adventurer',tag:'A gentleman of the journey',detail:'Tailored vest, emerald cape and polished boots',icon:'♜',skin:'#dba982',hair:'#37343a',outfit:'#f1e5c8',secondary:'#4b8468',trim:'#423c3b'},
 floral:{name:'Floral Traveler',tag:'A lover of petals and memories',detail:'Flower crown, bouquet and flowing dress',icon:'✿',skin:'#e6ad8d',hair:'#684334',outfit:'#f4dfba',secondary:'#85a974',trim:'#b97b55'},
 royal:{name:'Royal Guest',tag:'A royal invitation awaits',detail:'Golden crown, velvet robe and jewel',icon:'♕',skin:'#deb08a',hair:'#3d353c',outfit:'#f4ebc8',secondary:'#4b825d',trim:'#b88743'}
};
const VARIANTS=[
 {name:'Original',label:'Classic tones'},
 {name:'Pastel',label:'Soft wedding colors'},
 {name:'Evening',label:'Deep emerald and gold'}
];
const tint=(hex,factor)=>{
 const x=hex.replace('#','');
 const channels=[0,2,4].map(i=>parseInt(x.slice(i,i+2),16));
 return '#'+channels.map(v=>Math.max(0,Math.min(255,Math.round(v*factor))).toString(16).padStart(2,'0')).join('');
};
function palette(id,variant=0){
 const base=ROLES[id]||ROLES.explorer;
 if(Number(variant)===1)return {...base,outfit:tint(base.outfit,1.06),secondary:'#a586ad',trim:'#a4826d'};
 if(Number(variant)===2)return {...base,outfit:'#d4d6bf',secondary:'#39735f',trim:'#ab863b'};
 return base;
}
function shapes(id,variant=0,motion='idle',step=0){
 const p=palette(id,variant),parts=[];
 const r=(x,y,w,h,c)=>parts.push({x,y,w,h,c});
 const o='#3b3035',shoe='#4a3932',shine='#fff4ca';
 // Shadow, capes and a clear 4px-grid silhouette.
 r(10,46,19,2,'#5d684b');
 if(['formal','royal'].includes(id)){
  r(4,25,6,18,p.secondary);r(30,25,6,18,p.secondary);
 }
 if(id==='explorer'){
  r(3,24,8,18,'#7d5b3d');r(5,27,7,10,'#be9556');
  r(4,28,3,3,'#e5be77');
 }
 // Dark sprite silhouette first, then layers.
 r(9,40+(step?2:0),9,7,o);r(23,40-(step?2:0),9,7,o);
 r(10,40+(step?2:0),7,5,shoe);r(24,40-(step?2:0),7,5,shoe);
 r(8,26,26,18,o);
 r(10,27,22,13,p.outfit);
 r(12,34,18,5,p.secondary);
 r(9,26,6,11,p.skin);r(29,26,6,11,p.skin);
 if(motion==='interact')r(32,19,4,13,p.skin);
 // Head silhouette and face.
 r(10,9,22,18,o);
 r(12,12,18,14,p.skin);
 r(12,18,3,3,'#c67d65');
 r(17,18,2,3,o);r(27,18,2,3,o);
 r(22,23,5,1,'#9e614d');
 // Hair and accessories.
 r(10,8,23,9,p.hair);r(9,12,5,9,p.hair);
 r(14,6,14,5,p.hair);r(26,10,6,4,p.hair);
 if(['partner','floral'].includes(id)){
  r(9,22,6,19,p.hair);r(29,20,6,18,p.hair);
  r(10,30,25,13,p.outfit);
  r(9,36,28,9,p.secondary);r(12,38,22,7,p.outfit);
 }
 if(id==='explorer'){
  r(11,26,21,4,p.secondary);r(27,29,7,6,p.secondary);
  r(14,36,4,5,'#9c7148');r(16,37,9,3,'#d8ba76');
 }
 if(id==='partner'){
  r(8,9,7,5,'#fff0d0');r(29,9,7,5,'#fff0d0');r(13,10,17,3,'#f9e9c5');
  r(5,24,7,9,'#e9bf63');
 }
 if(id==='dreamer'){
  r(8,7,25,5,'#637d6b');r(12,2,17,9,'#86aa8b');
  r(4,28,12,12,'#2f4f78');r(6,30,8,8,'#5873a3');r(8,32,4,3,'#efc765');
  r(32,9,3,3,'#eac678');
 }
 if(id==='formal'){
  r(17,27,8,9,'#3e5045');r(19,30,4,3,shine);
  r(10,23,24,5,p.secondary);
  r(20,40,3,4,'#a7a59b');
 }
 if(id==='floral'){
  for(const [x,y] of [[13,7],[18,4],[24,6],[30,8]]){
   r(x,y,4,4,'#fff4dc');r(x+1,y+1,2,2,'#dda98e');
  }
  r(3,28,10,9,'#9f7646');r(4,27,8,4,'#67925a');
  for(const [x,y] of [[2,23],[7,20],[12,24]]){r(x,y,5,5,'#f5ddbb');r(x+2,y+2,2,2,'#eb9b8a')}
 }
 if(id==='royal'){
  r(12,4,20,6,'#dca84b');r(12,1,5,5,'#f0c95f');r(20,0,5,6,'#f0c95f');r(28,1,5,5,'#f0c95f');
  r(21,6,4,3,'#a65b63');
  r(5,30,5,10,shine);r(32,30,5,10,shine);
  r(35,14,3,29,'#947243');r(33,9,7,7,'#eacb6e');r(35,11,3,4,'#a64e86');
 }
 if(motion==='jump'){
  r(9,45,8,3,shoe);r(25,40,7,3,shoe);
 }
 return parts;
}
function svg(id,variant=0,kind='portrait'){
 const blocks=shapes(id,variant,'idle',0);
 const rects=blocks.map(p=>'<rect x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.h+'" fill="'+p.c+'"/>').join('');
 return '<svg class="uri-pixel-avatar-svg" viewBox="0 0 44 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" shape-rendering="crispEdges">'+rects+'</svg>';
}
function paint(graphics,id,variant=0,motion='idle',step=0){
 for(const p of shapes(id,variant,motion,step)){
  graphics.fillStyle(parseInt(p.c.slice(1),16),1);
  graphics.fillRect(p.x,p.y,p.w,p.h);
 }
}
window.URIAdventurePixels={ROLES,VARIANTS,palette,svg,paint,shapes};
})();
