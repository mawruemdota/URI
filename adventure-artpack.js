/* URI Adventure Art Pack 1.0 — original offline-generated pixel sprites and scenery.
 * No external sprite service, paid API, or runtime network dependency.
 * Character frames are generated into a genuine Phaser sprite sheet; landscape
 * objects are reusable transparent canvas textures, not CSS/SVG game scenery.
 */
(function(){
'use strict';
const TILE=4,FRAME_W=44,FRAME_H=50,STATES=['idle','walk0','walk1','jump','interact'];
const COLORS={
 meadow:{sky:'#b9e1d4',far:'#a0c7ae',mid:'#6f9f80',dark:'#385f4c',grass:'#81ac66',earth:'#8a674b',stone:'#aaa997',roof:'#b86f56',wall:'#f2dfb9',water:'#83cbd2',flower:'#ffe0bd'},
 sunset:{sky:'#f5c6a5',far:'#dfb49b',mid:'#b78d87',dark:'#73536a',grass:'#ba9b76',earth:'#976a61',stone:'#b9a5a2',roof:'#9e6170',wall:'#ffe2c2',water:'#91bfd0',flower:'#ffe4bd'},
 starlight:{sky:'#354b6c',far:'#536886',mid:'#455d76',dark:'#293e59',grass:'#688b80',earth:'#5b6470',stone:'#8297a4',roof:'#755a83',wall:'#dcd4c2',water:'#609dbb',flower:'#f4d3dd'}
};
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function fill(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function seed(n){const v=Math.sin(n*18.271+4.732)*48391.211;return v-Math.floor(v)}
function flower(c,x,y,p){fill(c,x+3,y,4,4,p.flower);fill(c,x,y+3,10,4,'#f8eee0');fill(c,x+3,y+3,4,4,'#e7b96c');fill(c,x+4,y+7,2,11,p.dark)}
function texture(scene,key,w,h,paint){
 if(scene.textures.exists(key))return key;
 const c=canvas(w,h),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
 paint(ctx,w,h);scene.textures.addCanvas(key,c);return key;
}
function character(scene,id,variant,px){
 if(!px?.shapes)return false;
 const key='uri-artpack-character-'+id+'-'+variant;
 if(!scene.textures.exists(key)){
  const atlas=canvas(FRAME_W*STATES.length,FRAME_H),g=atlas.getContext('2d');g.imageSmoothingEnabled=false;
  STATES.forEach((motion,index)=>{
   const moving=motion.startsWith('walk'),pose=moving?'walk':motion,step=moving&&motion==='walk1'?1:0;
   const blocks=px.shapes(id,variant,pose,step),offset=index*FRAME_W;
   // Painted pixel highlights and ambient occlusion sit behind the authored silhouette.
   for(const p of blocks){fill(g,offset+p.x,p.y,p.w,p.h,p.c)}
   const costume=px.palette(id,variant);
   fill(g,offset+13,28,15,2,'#fff4d1');
   fill(g,offset+11,30,3,8,costume.trim);
   fill(g,offset+27,32,3,5,costume.trim);
   fill(g,offset+15,13,5,2,'#fff1ce');
   fill(g,offset+13,44+(step?1:0),4,2,'#2e3436');
   fill(g,offset+25,44-(step?1:0),4,2,'#2e3436');
   if(motion==='jump'){fill(g,offset+7,42,8,3,'#5a4439')}
   if(motion==='interact'){fill(g,offset+34,17,3,3,'#f8d8b2')}
  });
  scene.textures.addSpriteSheet(key,atlas,{frameWidth:FRAME_W,frameHeight:FRAME_H,endFrame:STATES.length-1,margin:0,spacing:0});
 }
 return {key,frame:state=>Math.max(0,STATES.indexOf(state))};
}
function makeSky(scene,world,width){
 const p=COLORS[world]||COLORS.meadow,unit=720;
 const key='uri-artpack-sky-'+world;
 texture(scene,key,unit,350,(g,w,h)=>{
  fill(g,0,0,w,h,p.sky);
  // Horizon bands and distant rolling mountains use pixel-aligned silhouettes.
  for(let x=0;x<w;x+=8){
   const ridge=178+Math.round(30*Math.sin(x/85)+13*Math.sin(x/29));
   fill(g,x,ridge,8,h-ridge,p.far);
   const ridge2=255+Math.round(23*Math.sin(x/52+2)+8*Math.sin(x/21));
   fill(g,x,ridge2,8,h-ridge2,p.mid);
  }
  for(let i=0;i<15;i++){
   const x=18+i*53,y=30+Math.round(seed(i+2)*90);
   if(world==='starlight'){fill(g,x,y,4,4,'#fff1c8');fill(g,x+1,y-3,2,10,'#fff1c8')}
   else{
    fill(g,x,y,40,10,'#f7f1de');fill(g,x+8,y-7,22,8,'#fff8e9');
    fill(g,x+3,y+10,33,3,'#dfebe0');
   }
  }
  if(world!=='starlight'){fill(g,540,44,60,60,'#fff0c4');fill(g,532,54,76,38,'#fff0c4')}
  else{fill(g,555,44,40,40,'#fff2cf');fill(g,568,34,40,40,p.sky)}
 });
 for(let x=0;x<width+unit;x+=unit){
  scene.add.image(x,0,key).setOrigin(0,0).setDepth(-14).setScrollFactor(.22,1);
 }
}
function tree(scene,world,x,groundY,scale=1){
 const p=COLORS[world]||COLORS.meadow,key='uri-artpack-tree-'+world;
 texture(scene,key,144,204,g=>{
  fill(g,64,85,22,117,p.dark);fill(g,72,90,9,108,'#916f4f');
  fill(g,39,128,45,11,p.dark);fill(g,76,116,44,11,p.dark);
  const clumps=[[20,62,60,53],[52,30,69,65],[4,88,74,55],[79,76,60,61],[35,3,75,56]];
  clumps.forEach(([x,y,w,h],i)=>{
   fill(g,x+4,y+8,w,h,p.dark);fill(g,x,y,w,h,i%2?p.mid:p.grass);
   fill(g,x+8,y+8,w-16,8,p.far);fill(g,x+10,y+24,14,7,'#a5bd81');
  });
  for(let i=0;i<65;i++){
   const x=8+Math.floor(seed(i*3+17)*123/4)*4,y=12+Math.floor(seed(i*7+19)*126/4)*4;
   if(x>22&&x<125&&y<126)fill(g,x,y,4,4,i%4===0?'#d1d8a2':i%3===0?p.dark:p.grass);
  }
  fill(g,76,150,6,6,'#e9d0a3');
 });
 return scene.add.image(x,groundY,key).setOrigin(.5,1).setScale(scale).setDepth(-3);
}
function cottage(scene,world,x,groundY){
 const p=COLORS[world]||COLORS.meadow,key='uri-artpack-cottage-'+world;
 texture(scene,key,244,232,g=>{
  fill(g,30,86,185,133,'#483d39');fill(g,36,92,173,121,p.wall);
  for(let row=0;row<13;row++){
   fill(g,12+row*8,76+row*4,220-row*16,10,p.roof);
   if(row%2===0)fill(g,18+row*8,80+row*4,208-row*16,2,'#7e5348');
  }
  fill(g,29,94,9,119,p.stone);fill(g,202,94,8,119,p.stone);
  for(const wx of [51,169]){
   fill(g,wx,127,29,42,'#554d48');fill(g,wx+4,131,21,34,'#ffe5ab');
   fill(g,wx+12,131,4,34,p.stone);
   fill(g,wx+4,147,21,3,p.stone);
  }
  fill(g,99,147,47,68,'#53413a');fill(g,105,152,35,63,'#9b6a4a');
  fill(g,135,183,4,4,'#f8d080');
  fill(g,98,143,45,5,'#d8b58a');
  fill(g,16,216,211,10,p.stone);fill(g,8,226,228,6,'#e2d1ac');
  fill(g,66,115,5,24,p.dark);fill(g,57,133,25,24,'#5d483d');
  fill(g,62,137,15,15,'#ffe5a1');fill(g,66,141,7,7,'#fff8cc');
  for(let i=0;i<12;i++){
   const xx=40+i*13;
   fill(g,xx,108,7,3,i%2?'#d1a77d':'#fdf0cf');
  }
  for(let i=0;i<4;i++)flower(g,21+i*59,208,p);
 });
 return scene.add.image(x,groundY+4,key).setOrigin(0,1).setDepth(-3);
}
function sign(scene,world,x,y){
 const p=COLORS[world]||COLORS.meadow,key='uri-artpack-sign-'+world;
 texture(scene,key,188,110,g=>{
  fill(g,86,54,16,55,'#493a36');fill(g,90,54,8,55,'#ad8056');
  fill(g,4,7,180,69,'#4d3b37');fill(g,9,12,170,59,'#a47950');
  fill(g,15,18,158,47,'#f5e4bb');
  fill(g,19,22,150,39,'#fff0d0');
  for(let i=0;i<9;i++){fill(g,22+i*16,22,7,3,'#e8ce9d');fill(g,22+i*16,58,7,3,'#e8ce9d')}
  fill(g,12,14,5,5,p.flower);fill(g,170,14,5,5,p.flower);
 });
 return scene.add.image(x,y,key).setOrigin(.5,.5).setDepth(0);
}
function decorate(scene,world,width,groundY){
 const p=COLORS[world]||COLORS.meadow;
 makeSky(scene,world,width);
 for(let x=0;x<width;x+=1580){
  cottage(scene,world,x+20,groundY);
  tree(scene,world,x+360,groundY,.97);
  tree(scene,world,x+815,groundY,.78);
  tree(scene,world,x+1290,groundY,.86);
 }
 const shrub='uri-artpack-shrub-'+world;
 texture(scene,shrub,96,50,g=>{
  fill(g,4,27,88,19,p.dark);fill(g,13,15,70,29,p.mid);
  fill(g,24,5,45,34,p.grass);
  for(let i=0;i<18;i++){const x=8+Math.floor(seed(i+43)*20)*4,y=8+Math.floor(seed(i+62)*9)*4;fill(g,x,y,4,4,i%3?'#b5ca8b':p.dark)}
  flower(g,26,13,p);flower(g,68,15,p);
 });
 for(let x=440;x<width;x+=330){
  scene.add.image(x,groundY-5,shrub).setOrigin(.5,1).setDepth(-2);
 }
 const path='uri-artpack-path-'+world;
 texture(scene,path,128,42,g=>{
  fill(g,0,0,128,42,p.earth);
  fill(g,0,0,128,8,p.grass);fill(g,0,8,128,5,p.dark);
  for(let i=0;i<44;i++){
   const x=Math.floor(seed(i+92)*32)*4,y=12+Math.floor(seed(i+112)*7)*4;
   fill(g,x,y,8,3,i%3===0?'#d7b78b':'#73583f');
  }
  for(let i=0;i<12;i++)fill(g,i*12,1,5,4,i%2?'#c5d394':'#dce4ae');
 });
 for(let x=0;x<width;x+=128)scene.add.image(x,groundY-7,path).setOrigin(0,0).setDepth(-1);
 return {sign:(x,y)=>sign(scene,world,x,y)};
}
window.URIAdventureArtPack={version:'1.0',character,decorate,colors:COLORS,states:STATES};
})();
