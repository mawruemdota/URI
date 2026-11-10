/* URI Adventure pixel environment
 * Original procedural pixel scenery drawn with Phaser Graphics; no downloaded
 * Nintendo sprites, backgrounds, characters, or game artwork. */
(function(){
'use strict';
const palette={
 meadow:{dark:0x355b48,tree:0x558c58,leaf:0x75a66a,roof:0xb97956,wall:0xf5dfb3,stone:0x8c9290,stone2:0xb3b5a2,river:0x70c0d3,flower:0xffe7bd},
 sunset:{dark:0x604b61,tree:0x786b76,leaf:0xc69b7a,roof:0x995e60,wall:0xfae0bc,stone:0x9d8390,stone2:0xc5b3a3,river:0x95b9cd,flower:0xffe6b6},
 starlight:{dark:0x283d5d,tree:0x3a5971,leaf:0x5c7694,roof:0x6e5274,wall:0xd2ccbd,stone:0x53697d,stone2:0x8998a5,river:0x5a90b3,flower:0xf1d8d4}
};
function paint(scene,world,width,groundY){
 const p=palette[world]||palette.meadow,g=scene.add.graphics().setDepth(-4);
 const rect=(x,y,w,h,c,alpha=1)=>{g.fillStyle(c,alpha);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
 const rand=n=>{const x=Math.sin(n*10.443+7.31)*43758.5453;return x-Math.floor(x)};
 const outline=0x382f34;
 function flower(x,y,color){
  rect(x+5,y,4,4,color);rect(x+5,y+9,4,4,color);
  rect(x,y+5,4,4,color);rect(x+10,y+5,4,4,color);
  rect(x+5,y+5,4,4,0xf0c261);rect(x+6,y+9,2,12,p.dark)
 }
 function bushes(x,y){
  rect(x,y+22,100,20,p.dark);rect(x+9,y+9,36,24,p.tree);
  rect(x+31,y+3,36,33,p.leaf);rect(x+61,y+12,31,23,p.tree);
  for(let j=0;j<9;j++){
   const bx=x+Math.round(rand(x+j*7)*85),by=y+Math.round(rand(j+x/2)*20);
   rect(bx,by,6,6,j%2?p.leaf:p.tree);
  }
  flower(x+22,y+4,p.flower);
  flower(x+75,y+6,0xf8c6b2);
 }
 function cloud(x,y){
  rect(x+21,y,62,17,0xf8fbf0,.9);
  rect(x+6,y+15,98,20,0xf8fbf0,.9);
  rect(x,y+23,116,9,0xe5f0ec,.9);
  rect(x+34,y-12,25,15,0xf9fbf4,.9);
 }
 function castle(x){
  const y=202;
  rect(x+7,y+25,150,107,p.stone);
  rect(x+10,y+36,145,96,p.stone2);
  rect(x-10,y+9,40,123,p.stone2);
  rect(x+139,y+9,40,123,p.stone2);
  rect(x-16,y+1,50,12,p.stone);rect(x+133,y+1,51,12,p.stone);
  rect(x+40,y-21,88,62,p.wall);rect(x+47,y-35,72,14,p.roof);
  for(const dx of [1,39,133,171])rect(x+dx,y-6,7,12,p.roof);
  for(const dx of [0,137]){
   rect(x+dx,y-32,33,15,p.roof);
   rect(x+dx+8,y-39,19,12,p.roof);
  }
  rect(x+69,y+75,35,57,p.dark);
  rect(x+78,y+79,20,50,p.roof);
  for(const wx of [30,115])for(const wy of [50,83]){
   rect(x+wx,y+wy,12,22,p.dark);
   rect(x+wx+3,y+wy+2,6,16,0xf3dba7);
  }
  rect(x+82,y-51,3,20,p.dark);
  rect(x+85,y-51,27,13,0xf1dca0);rect(x+88,y-48,7,7,p.roof);
 }
 function cottage(x){
  const y=groundY-200;
  rect(x+17,y+57,177,147,outline);
  rect(x+21,y+61,169,141,p.wall);
  rect(x+25,y+61,11,140,p.stone2);
  rect(x+180,y+64,10,138,p.stone2);
  rect(x+31,y+80,150,7,p.roof);
  // Pixel stairs of a timber roof.
  for(let row=0;row<16;row++){
   const left=x+18+row*7,right=x+185-row*7;
   rect(left,y+row*4,Math.max(5,right-left),8,p.roof);
   if(row%2===0)rect(left+7,y+row*4+4,Math.max(6,right-left-14),2,0x8a5347);
  }
  rect(x+93,y+115,48,87,outline);
  rect(x+99,y+123,36,80,0x926347);
  rect(x+113,y+133,9,13,0xf1dc9a);
  rect(x+119,y+164,4,4,0xffc879);
  for(const dx of [41,147]){
   rect(x+dx,y+123,24,39,outline);
   rect(x+dx+5,y+127,14,29,0xffe0a2);
   rect(x+dx+10,y+127,4,29,p.stone);
  }
  rect(x+20,y+192,170,12,p.stone);rect(x+12,y+204,185,11,p.stone2);
  flower(x+7,y+197,p.flower);flower(x+178,y+198,p.flower);
  // Wreath on the door.
  rect(x+110,y+136,14,4,p.leaf);rect(x+108,y+141,5,15,p.leaf);
  rect(x+122,y+141,5,15,p.leaf);rect(x+112,y+155,11,4,p.leaf);
  flower(x+112,y+140,p.flower);
  // Hanging lantern by the entry.
  rect(x+70,y+100,4,22,p.dark);rect(x+59,y+119,28,24,outline);
  rect(x+63,y+122,20,16,0xffd892);
 }
 function tree(x,y,large){
  const h=large?190:137,r=large?92:62;
  rect(x-14,y-h,27,h,p.dark);
  rect(x-6,y-h,14,h,0x815e49);
  rect(x-14,y-h+33,54,12,p.dark);
  rect(x-45,y-h+8,48,10,p.dark);
  const cx=x+2,cy=y-h;
  rect(cx-r+18,cy-25,r*2-36,38,p.dark);
  rect(cx-r+5,cy-5,r*2-10,44,p.tree);
  rect(cx-r+26,cy-53,r*2-52,41,p.leaf);
  rect(cx-r+42,cy-73,r*2-84,31,p.tree);
  for(let j=0;j<(large?30:19);j++){
   const xx=cx-r+rand(x+j*13)*(r*2-12);
   const yy=cy-55+rand(x-j*17)*65;
   rect(Math.round(xx/5)*5,Math.round(yy/5)*5,10,10,j%3?p.leaf:p.tree);
  }
  rect(x+18,y-h+54,5,27,0x44372b);
  rect(x+8,y-h+75,23,30,outline);
  rect(x+12,y-h+80,16,18,0xf4d18e);
  rect(x+14,y-h+80,3,18,0xc88c4d);
 }
 function bridge(x,y){
  const len=290;
  rect(x,y,len,24,p.stone);
  rect(x+7,y+7,len-14,10,p.stone2);
  for(let i=0;i<3;i++){
   const bx=x+24+i*100;
   rect(bx,y+22,20,68,p.stone);
   rect(bx+20,y+27,47,12,p.stone);
   rect(bx+23,y+39,42,8,p.stone2);
  }
  for(let i=0;i<20;i++)rect(x+i*14,y+4,2,10,i%2?p.stone2:p.dark);
 }
 function waterfall(x,y){
  rect(x-40,y-23,175,75,p.stone);
  rect(x-35,y-14,161,59,p.stone2);
  rect(x+15,y-18,87,115,p.river);
  for(let i=0;i<13;i++){
   const px=x+16+i*6;
   rect(px,y+8,3,67,i%3===0?0xd6f0ea:0x8cd8de,.8);
   rect(px-4,y+73,10,7,0xb2e8ea);
  }
  rect(x-21,y+91,149,16,0xb1e0df);
  rect(x-14,y+97,174,7,0xeaf9e4);
 }
 function meadowBed(x){
  for(let j=0;j<11;j++){
   const xx=x+j*15;
   rect(xx,groundY-9,4,8,p.dark);
   rect(xx-3,groundY-13,9,7,j%3===0?0xf4d5a0:p.leaf);
   if(j%4===0)flower(xx,groundY-25,p.flower);
  }
 }
 // Clouds at several depths, without any repeated bitmap textures or UI text.
 for(let i=0;i<Math.ceil(width/740);i++){
  cloud(210+i*720,41+(i%3)*18);
  cloud(570+i*720,79+(i%2)*24);
 }
 // A church-like castle in the distance, with a stone bridge and waterfall.
 for(let x=950;x<width+400;x+=1450){
  castle(x+170);
  bridge(x+310,343);
  waterfall(x+650,328);
 }
 // Houses and ancient trees in the foreground are spaced for playable paths.
 for(let x=0;x<width;x+=1600){
  cottage(x+10);
  tree(x+345,groundY-8,true);
  tree(x+820,groundY-8,false);
  bushes(x+530,groundY-44);
  bushes(x+1110,groundY-41);
 }
 for(let x=140;x<width;x+=310){
  meadowBed(x);
 }
 return g;
}
window.URIAdventureLandscape={paint};
})();
