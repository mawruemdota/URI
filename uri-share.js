/* URI Invitation Sharing 2.0: native PNG export, QR guest passes, shareable metadata URL.
 * Canvas exports are generated client-side and never upload private guest data. */
(function(){
'use strict';
const T=v=>esc(v==null?'':String(v));
const PROJECT='sclthfeqievigrcjoohh';
const FONT_STACKS={cormorant:'"Cormorant Garamond", Georgia, serif',playfair:'"Playfair Display", Georgia, serif',allura:'"Allura", cursive',barlow:'"Barlow Condensed", Arial, sans-serif',montserrat:'Montserrat, Arial, sans-serif',dm:'"DM Sans", Arial, sans-serif'};
const fontFor=(id,fallback)=>FONT_STACKS[id]||fallback;
const shapes={portrait:[1080,1350],square:[1080,1080],story:[1080,1920]};
const clean=v=>String(v||'').replace(/[\r\n\t]+/g,' ').slice(0,180);
const name=e=>[e?.name1,e?.name2].filter(Boolean).join(' & ')||'Our Celebration';
const initials=e=>[e?.name1,e?.name2].filter(Boolean).map(n=>String(n).trim().charAt(0).toUpperCase()).join('  &  ')||'✦';
function displayDate(e){
 let day=clean(e?.date||'');
 if(/^\d{4}-\d{2}-\d{2}$/.test(day)){
  const parsed=new Date(day+'T00:00:00Z');
  if(!Number.isNaN(parsed.getTime()))day=new Intl.DateTimeFormat('en-PH',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(parsed);
 }
 let time='';
 if(/^([01]\d|2[0-3]):[0-5]\d$/.test(String(e?.time||''))){
  const [h,m]=e.time.split(':').map(Number);
  time=((h%12)||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM');
 }
 return (day||'SAVE THE DATE')+(time?' · '+time:'');
}
const url=e=>e?.cloudPublished&&e?.cloudSlug?window.URICloud?.publicLink?.(e.cloudSlug)||'':'';
const social=e=>url(e)?'https://'+PROJECT+'.supabase.co/functions/v1/uri-share?slug='+encodeURIComponent(e.cloudSlug):'';
const status=message=>{const n=document.getElementById('uriExportStatus');if(n)n.textContent=message};
const colors=e=>{
 const d=window.URIBuilder?.design?.(e)||{bg:'#f6f0e8',ink:'#333333',accent:'#a78c73'};
 return {bg:d.bg,ink:d.ink,accent:d.accent,heading:d.heading,body:d.body};
};
const rect=(ctx,x,y,w,h,fill)=>{ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)};
function rounded(ctx,x,y,w,h,r,fill){
 ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function text(ctx,value,x,y,limit,initialSize,opts={}){
 ctx.save();
 const words=clean(value).split(/\s+/).filter(Boolean);
 ctx.fillStyle=opts.color||'#222';ctx.textAlign=opts.align||'center';
 const setFont=size=>{ctx.font=(opts.weight||'normal')+' '+size+'px '+(opts.font||'Georgia')};
 setFont(initialSize);
 const lines=[];let line='';
 for(const word of words){
  const attempt=line?line+' '+word:word;
  if(ctx.measureText(attempt).width>limit&&line){lines.push(line);line=word}else line=attempt;
 }
 if(line)lines.push(line);
 const visible=lines.slice(0,Math.max(1,opts.maxLines||3));
 let yy=y;
 for(let i=0;i<visible.length;i++){
  let s=visible[i];if(i===visible.length-1&&lines.length>visible.length)s+='…';
  let sz=initialSize;setFont(sz);
  while(sz>18&&ctx.measureText(s).width>limit){sz-=2;setFont(sz)}
  ctx.fillText(s,x,yy);yy+=(opts.lineHeight||initialSize*1.2);
 }
 ctx.restore();
 return yy;
}
async function image(source){
 if(!source||!/^(https:\/\/|data:image\/)/.test(source))return null;
 const img=new Image();
 img.crossOrigin='anonymous';
 img.decoding='async';
 return new Promise(resolve=>{img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=source});
}
function crop(ctx,img,x,y,w,h,settings={}){
 if(!img)return false;
 const zoom=Math.max(1,Math.min(3,Number(settings.zoom)||1));
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
 const aspect=Math.max(w/iw,h/ih)*zoom;
 const dw=iw*aspect,dh=ih*aspect,fx=Math.max(0,Math.min(100,Number(settings.x??50)))/100,fy=Math.max(0,Math.min(100,Number(settings.y??50)))/100;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 ctx.drawImage(img,x+(w-dw)*fx,y+(h-dh)*fy,dw,dh);ctx.restore();return true;
}
function drawQR(ctx,qr,x,y,size){
 if(!qr)return;
 rounded(ctx,x-15,y-15,size+30,size+30,13,'#ffffff');
 ctx.drawImage(qr,x,y,size,size);
}
async function makeQR(raw){
 if(!raw)return null;
 if(!window.QRCode)throw Error('QR generator is unavailable. Reconnect and reload URI.');
 const hidden=document.createElement('div');hidden.style.cssText='position:fixed;left:-9999px;top:-9999px;width:256px;height:256px;visibility:hidden';
 document.body.appendChild(hidden);
 try{
  new window.QRCode(hidden,{text:raw,width:256,height:256,colorDark:'#171a19',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel?.M||0});
  for(let i=0;i<12&&!hidden.querySelector('canvas,img');i++)await new Promise(r=>setTimeout(r,25));
  const canvas=hidden.querySelector('canvas');
  if(canvas)return canvas;
  const img=hidden.querySelector('img');
  if(img){await img.decode?.().catch(()=>{});return img}
  throw Error('QR image could not be generated.');
 }finally{
  // Keep the hidden element until canvas draw completes; browsers usually copy
  // decoded canvas pixels synchronously even when detached.
  hidden.remove();
 }
}
// Keep date and venue text clear of the QR badge at all export sizes.
function footerLayout(w,h,hasQR){
 const qrSize=hasQR?Math.min(155,Math.round(h*.135)):0;
 const qrX=hasQR?w-qrSize-65:0;
 const textLeft=65,textRight=hasQR?qrX-35:w-65;
 return {qrSize,qrX,qrY:h-qrSize-55,textX:(textLeft+textRight)/2,textWidth:textRight-textLeft,dateY:h-166,venueY:h-111};
}
async function card(e,format='portrait',guest=null){
 const [w,h]=shapes[format]||shapes.portrait,c=document.createElement('canvas');
 c.width=w;c.height=h;
 const ctx=c.getContext('2d');if(!ctx)throw Error('Your browser cannot export this image.');
 const d=colors(e),theme=window.URIBuilder?.baseTemplate?.(e)||e.template||'classic';
 const short=h<=1100,headingFont=fontFor(d.heading,theme==='nightfall'?'Arial':'Georgia'),bodyFont=fontFor(d.body,'Arial');
 rect(ctx,0,0,w,h,d.bg);
 const photo=await image(e.heroPhoto||'');
 const qr=await makeQR(guest?.checkinToken?
  'uri-checkin|v1|'+(e._uriCloudOwnerId||window.URICloudDrafts?.getUser?.()?.id||'')+'|'+e.id+'|'+guest.checkinToken
  :url(e));
 ctx.textBaseline='alphabetic';
 if(theme==='nightfall'){
  rect(ctx,0,0,w,h,'#131515');
  if(photo)crop(ctx,photo,0,0,w,h*0.76,e.heroSettings);
  const gradient=ctx.createLinearGradient(0,h*.13,0,h*.92);
  gradient.addColorStop(0,'rgba(12,12,12,.26)');gradient.addColorStop(.45,'rgba(12,12,12,.65)');gradient.addColorStop(1,'rgba(12,12,12,.99)');
  rect(ctx,0,0,w,h,gradient);
  ctx.strokeStyle='#ffffff77';ctx.lineWidth=2;ctx.strokeRect(43,43,w-86,h-86);
  text(ctx,guest?'YOUR PERSONAL EVENT PASS':'YOU ARE INVITED',w/2,h*.22,w-180,30,{color:'#fff',font:'Arial',weight:'bold'});
  text(ctx,name(e).toUpperCase(),w/2,h*.43,w-150,short?74:92,{color:'#ffffff',font:headingFont,weight:'bold',lineHeight:short?84:103,maxLines:2});
 }else if(theme==='garden'){
  rect(ctx,25,25,w-50,h-50,d.bg);
  ctx.strokeStyle=d.ink;ctx.lineWidth=3;ctx.strokeRect(34,34,w-68,h-68);
  text(ctx,'THE WEDDING EDITION',w/2,h*.105,w-120,28,{color:d.ink,font:'Arial',weight:'bold'});
  if(photo)crop(ctx,photo,108,h*.15,w-216,h*.33,e.heroSettings);
  else{
   rect(ctx,108,h*.15,w-216,h*.33,'#e4dfd6');
   text(ctx,initials(e),w/2,h*.35,w-280,85,{color:d.accent,font:headingFont});
  }
  text(ctx,name(e),w/2,h*.60,w-150,short?65:75,{color:d.ink,maxLines:2,font:headingFont,lineHeight:short?74:89});
 }else if(theme==='adventure'){
  const grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#7bc8d5');grad.addColorStop(.58,'#d2e6c0');grad.addColorStop(1,'#4d9a74');
  rect(ctx,0,0,w,h,grad);
  ctx.fillStyle='#375f56';
  for(let x=0;x<w;x+=86)ctx.fillRect(x,h*.67+(x%172),50,90);
  rounded(ctx,60,h*.18,w-120,h*.42,18,'#f8e6b8');
  ctx.strokeStyle='#583c27';ctx.lineWidth=9;ctx.strokeRect(70,h*.19,w-140,h*.4);
  text(ctx,'THE ADVENTURE BEGINS',w/2,h*.26,w-180,39,{color:'#71543e',font:'monospace',weight:'bold'});
  text(ctx,name(e),w/2,h*.42,w-180,63,{color:'#4d3b30',font:'monospace',weight:'bold'});
 }else{
  rect(ctx,0,0,w,h,d.bg);
  ctx.strokeStyle=d.accent;ctx.lineWidth=3;ctx.strokeRect(39,39,w-78,h-78);
  if(photo)crop(ctx,photo,75,h*.105,w-150,h*.37,e.heroSettings);
  else{
   rect(ctx,75,h*.105,w-150,h*.37,'#d8c4b1');
   text(ctx,'✦',w/2,h*.36,w-180,92,{color:d.accent});
  }
  text(ctx,'TOGETHER WITH OUR FAMILIES',w/2,h*.57,w-170,27,{color:d.accent,font:'Arial',weight:'bold'});
  text(ctx,name(e),w/2,h*.67,w-150,short?62:80,{color:d.ink,font:headingFont,maxLines:2,lineHeight:short?70:95});
 }
 const footerColor=theme==='nightfall'?'#ffffff':theme==='adventure'?'#163c32':d.ink;
 const foot=footerLayout(w,h,!!qr);
 text(ctx,guest?'GUEST PASS · '+clean(guest.name):displayDate(e),foot.textX,foot.dateY,foot.textWidth,guest?27:30,{color:footerColor,font:bodyFont,weight:'bold',maxLines:1});
 text(ctx,clean(e.venue||'VENUE TO BE ANNOUNCED'),foot.textX,foot.venueY,foot.textWidth,24,{color:footerColor,font:bodyFont,maxLines:2,lineHeight:27});
 if(qr)drawQR(ctx,qr,foot.qrX,foot.qrY,foot.qrSize);
 else text(ctx,'Made with URI',w/2,h-49,w-100,20,{color:footerColor,font:bodyFont,maxLines:1});
 return c;
}
function download(canvas,filename){
 const a=document.createElement('a');a.download=filename;a.href=canvas.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();
}
window.uriShareExport=async()=>{
 const e=current(),sel=document.getElementById('uriExportSize');
 if(!e)return;
 status('Rendering your invitation…');
 try{const c=await card(e,sel?.value||'portrait');download(c,'uri-'+(e.cloudSlug||'invitation')+'-'+(sel?.value||'portrait')+'.png');status('PNG invitation exported.')}
 catch(err){status('Export failed: '+(err.message||'Please try again.'))}
};
window.uriShareCopy=async mode=>{
 const e=current(),link=mode==='preview'?social(e):url(e);
 if(!link){status('Publish this invitation first to share a live link.');return}
 try{await navigator.clipboard.writeText(link);status(mode==='preview'?'Social preview link copied.':'Invitation URL copied.')}
 catch{prompt('Copy your invitation link:',link)}
};
window.uriShareNative=async()=>{
 const e=current(),link=social(e)||url(e);
 if(!link){status('Publish this invitation first.');return}
 if(navigator.share){try{await navigator.share({title:name(e),url:link})}catch(err){if(err.name!=='AbortError')status('Could not share: '+err.message)}}
 else window.uriShareCopy('preview');
};
window.uriShareGuestPass=async id=>{
 const e=current(),guest=e?.guests?.find(g=>String(g.id)===String(id));
 if(!guest)return;
 try{
  if(!e._uriCloudRevision)throw Error('Save this event to the cloud before issuing guest passes.');
  await window.URICloudDrafts.flushCurrent();
  if(!/^[a-f0-9]{64}$/.test(guest.checkinToken||''))throw Error('Secure check-in pass is not ready.');
  const c=await card(e,'portrait',guest);
  download(c,'uri-guest-pass-'+String(guest.name||'guest').replace(/[^a-z0-9]+/gi,'-').slice(0,45)+'.png');
 }catch(err){alert('Guest pass unavailable: '+(err.message||'Please try again.'))}
};
window.URIShare={
 url,social,card,footerLayout,
 panel:e=>'<section class="uri-ops-panel"><h3>Invitation Sharing 2.0</h3><p>Download a matching invitation image, optionally with a QR code. PNG exports stay on your device.</p>'
 +'<div class="uri-ops-actions"><label>Export format<select id="uriExportSize"><option value="portrait">Portrait · 1080 × 1350</option><option value="square">Square · 1080 × 1080</option><option value="story">Story · 1080 × 1920</option></select></label>'
 +'<button class="btn primary" type="button" onclick="uriShareExport()">Download PNG</button>'
 +'<button class="btn" type="button" onclick="uriShareCopy(\'direct\')" '+(!url(e)?'disabled':'')+'>Copy event link</button>'
 +'<button class="btn" type="button" onclick="uriShareCopy(\'preview\')" '+(!social(e)?'disabled':'')+'>Copy rich-preview link</button>'
 +'<button class="btn" type="button" onclick="uriShareNative()" '+(!url(e)?'disabled':'')+'>Share</button></div>'
 +'<p class="uri-ops-note">The rich-preview link includes public event details and the published cover photo when available. It currently uses the URI sharing service address; a custom-domain host with rewrites can later show previews on /event-name directly.</p>'
 +'<p id="uriExportStatus" role="status" aria-live="polite"></p></section>'
};
})();