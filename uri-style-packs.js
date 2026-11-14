/* URI Style Studio 2.0: one-click curated palettes + typography + section rhythm. */
(function(){
'use strict';
const U=window.URIBuilder,studio=window.URITemplateStudio;
if(!U||!studio)return;
const profiles=[
 {id:'ivory',name:'Ivory & Gold',note:'Soft formal',bg:'#f7f2e8',ink:'#443d34',accent:'#af8b59',heading:'cormorant',body:'montserrat',spacing:'airy'},
 {id:'sage',name:'Sage Garden',note:'Organic',bg:'#eef1e5',ink:'#324b3d',accent:'#79907e',heading:'cormorant',body:'dm',spacing:'airy'},
 {id:'midnight',name:'Midnight Rose',note:'Cinematic',bg:'#15191b',ink:'#f6f2eb',accent:'#d17d77',heading:'barlow',body:'montserrat',spacing:'balanced'},
 {id:'clay',name:'Terracotta',note:'Warm modern',bg:'#faf2e9',ink:'#663c35',accent:'#bc775d',heading:'playfair',body:'dm',spacing:'balanced'},
 {id:'ink',name:'Ink & Paper',note:'Editorial',bg:'#fcfbf8',ink:'#252525',accent:'#816f5d',heading:'playfair',body:'montserrat',spacing:'compact'},
 {id:'lavender',name:'Soft Lavender',note:'Dreamy',bg:'#f5f0f7',ink:'#493e59',accent:'#a181b9',heading:'allura',body:'dm',spacing:'airy'}
];
const layoutById={
 ivory:{hero:'split',story:'letter',gallery:'collage',countdown:'classic',rsvp:'framed'},
 sage:{hero:'centered',story:'quote',gallery:'carousel',countdown:'tiles',rsvp:'framed'},
 midnight:{hero:'immersive',story:'quote',gallery:'grid',countdown:'tiles',rsvp:'framed'},
 clay:{hero:'split',story:'columns',gallery:'grid',countdown:'classic',rsvp:'simple'},
 ink:{hero:'split',story:'columns',gallery:'grid',countdown:'tiles',rsvp:'simple'},
 lavender:{hero:'centered',story:'letter',gallery:'carousel',countdown:'classic',rsvp:'framed'}
};
window.uriStyleApply=id=>{
 const e=current(),profile=profiles.find(x=>x.id===id);
 if(!e||!profile)return;
 U.model(e);
 const key=e.template||'classic';
 const oldStyle=e.designByTemplate?.[key]?{...e.designByTemplate[key]}:null;
 const oldLayout=e.layoutByTemplate?.[key]?{...e.layoutByTemplate[key]}:null;
 e.designByTemplate||={};e.layoutByTemplate||={};
 const {id:_id,name:_name,note:_note,...tokens}=profile;
 e.designByTemplate[key]={...e.designByTemplate[key],...tokens};
 // Avoid invalid section variant references in future template extensions.
 e.layoutByTemplate[key]={...e.layoutByTemplate[key],...layoutById[id]};
 if(!U.persist()){
  if(oldStyle)e.designByTemplate[key]=oldStyle;else delete e.designByTemplate[key];
  if(oldLayout)e.layoutByTemplate[key]=oldLayout;else delete e.layoutByTemplate[key];
  alert('Unable to save style. Browser storage may be full.');
  return;
 }
 eventPage();
 window.uriBPanel?.('design');
};
const original=studio.studio;
studio.studio=e=>{
 const currentDesign=U.design(e);
 const options='<section class="uri-style-packs"><div class="uri-style-head"><h4>Instant art directions</h4><p>Choose a coordinated palette, font pairing, and layout rhythm. Photos, guest data, and event details stay unchanged.</p></div>'
  +'<div class="uri-style-grid">'+profiles.map(p=>{
   const selected=currentDesign.bg.toLowerCase()===p.bg.toLowerCase()&&currentDesign.accent.toLowerCase()===p.accent.toLowerCase();
   return '<button type="button" class="uri-style-choice'+(selected?' active':'')+'" aria-pressed="'+selected+'" onclick="uriStyleApply(\''+p.id+'\')">'
    +'<span class="uri-style-sample" style="--sample-bg:'+p.bg+';--sample-ink:'+p.ink+';--sample-accent:'+p.accent+'">'
    +'<i></i><strong>Aa</strong><span>✦</span></span><strong>'+p.name+'</strong><small>'+p.note+'</small></button>';
  }).join('')+'</div></section>';
 return options+original(e);
};
window.URIStylePacks={profiles,layoutById};
})();