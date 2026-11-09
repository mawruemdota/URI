/* URI wedding engine: shared features rendered through template-specific styles. */
(function(){
'use strict';
const U=window.URIBuilder={};
U.features=[
{id:'hero',name:'Welcome / Hero',variants:[['split','Split photo'],['centered','Centered'],['immersive','Immersive photo']]},
{id:'story',name:'Our Story',variants:[['letter','Letter'],['quote','Quote'],['columns','Columns']]},
{id:'gallery',name:'Photo Gallery',variants:[['carousel','Carousel'],['grid','Grid'],['collage','Collage']]},
{id:'countdown',name:'Wedding Countdown',variants:[['classic','Classic'],['tiles','Tiles']]},
{id:'details',name:'Event Details',variants:[['columns','Columns'],['cards','Cards']]},
{id:'timeline',name:'Event Timeline',variants:[['vertical','Vertical'],['horizontal','Horizontal']]},
{id:'dress',name:'Dress Code',variants:[['simple','Simple'],['palette','Palette']]},
{id:'gifts',name:'Gift Registry',variants:[['note','Note'],['card','Card']]},
{id:'rsvp',name:'RSVP',variants:[['simple','Simple'],['framed','Framed']]}];
U.ids=U.features.map(f=>f.id);
U.presets={classic:{bg:'#f6f0e8',ink:'#49483d',accent:'#967c72',heading:'cormorant',body:'cormorant',spacing:'airy'},garden:{bg:'#ffffff',ink:'#272727',accent:'#585248',heading:'allura',body:'montserrat',spacing:'balanced'},nightfall:{bg:'#0f0f0f',ink:'#f3f3f3',accent:'#ff6046',heading:'barlow',body:'montserrat',spacing:'airy'}};
U.fonts={cormorant:"'Cormorant Garamond',serif",allura:"'Allura',cursive",playfair:"'Playfair Display',serif",montserrat:"'Montserrat',sans-serif",dm:"'DM Sans',sans-serif",barlow:"'Barlow Condensed','Arial Narrow',sans-serif"};
const variants={classic:{hero:'split',story:'letter',gallery:'carousel',countdown:'classic',details:'columns',timeline:'vertical',dress:'palette',gifts:'note',rsvp:'framed'},garden:{hero:'split',story:'columns',gallery:'collage',countdown:'tiles',details:'cards',timeline:'horizontal',dress:'simple',gifts:'card',rsvp:'simple'},nightfall:{hero:'immersive',story:'quote',gallery:'grid',countdown:'tiles',details:'cards',timeline:'vertical',dress:'simple',gifts:'card',rsvp:'framed'}};
const enabledDefaults={hero:true,story:true,gallery:true,countdown:true,details:true,timeline:true,dress:false,gifts:false,rsvp:true};
/* Each template arranges existing sections differently. A missing pair expands to full width. */
U.templateLayout={
 classic:{wide:['hero','story','gallery','countdown','rsvp'],pairs:['details','timeline','dress','gifts']},
 garden:{wide:['hero','story','gallery','rsvp'],pairs:['countdown','details','timeline','dress','gifts']},
 nightfall:{wide:['hero','story','gallery','countdown','rsvp'],pairs:['details','timeline','dress','gifts']}
};
const T=v=>esc(v==null?'':String(v));
const color=(v,def)=>/^#[0-9a-fA-F]{6}$/.test(v||'')?v:def;
const clamped=v=>Math.min(100,Math.max(0,Number(v)||0));
function imgurl(v){return typeof v==='string'&&(/^(https:\/\/[^<>"']+)$/.test(v)||/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v))?v:''}
U.photo=(p,i=0)=>typeof p==='string'?{id:'legacy-'+i,src:p,alt:'Wedding photo',x:50,y:50,zoom:1,crop:'landscape'}:{id:String(p?.id||'photo-'+i),src:String(p?.src||''),alt:String(p?.alt||''),x:clamped(p?.x??50),y:clamped(p?.y??50),zoom:Math.min(3,Math.max(1,Number(p?.zoom)||1)),crop:['landscape','square','portrait'].includes(p?.crop)?p.crop:'landscape'};
U.baseTemplate=(e,id=e.template)=>Object.hasOwn(U.presets,id)?id:(Array.isArray(e.templateRecipes)?e.templateRecipes.find(x=>x&&x.id===id&&Object.hasOwn(U.presets,x.base))?.base:null)||'classic';
U.templateExists=(e,id)=>Object.hasOwn(U.presets,id)||!!(Array.isArray(e.templateRecipes)&&e.templateRecipes.some(x=>x&&x.id===id&&Object.hasOwn(U.presets,x.base)));
U.customItem=(e,id)=>Array.isArray(e.customSections)?e.customSections.find(x=>x&&x.id===id):null;
U.model=e=>{
 e.featureConfig=e.featureConfig&&typeof e.featureConfig==='object'&&!Array.isArray(e.featureConfig)?e.featureConfig:{};
 e.customSections=Array.isArray(e.customSections)?e.customSections.filter(x=>x&&typeof x==='object'&&/^cs-[a-z0-9-]{3,35}$/i.test(String(x.id||''))).slice(0,16):[];
 e.templateRecipes=Array.isArray(e.templateRecipes)?e.templateRecipes.filter(x=>x&&typeof x==='object'&&/^tpl-[a-z0-9-]{3,35}$/i.test(String(x.id||''))&&Object.hasOwn(U.presets,x.base)).slice(0,16):[];
 const ids=[...U.ids,...e.customSections.map(x=>x.id)];
 e.featureOrder=Array.isArray(e.featureOrder)?[...new Set(e.featureOrder.filter(x=>ids.includes(x))),...ids.filter(x=>!e.featureOrder.includes(x))]:ids.slice();
 e.layoutByTemplate=e.layoutByTemplate&&typeof e.layoutByTemplate==='object'?e.layoutByTemplate:{};
 e.designByTemplate=e.designByTemplate&&typeof e.designByTemplate==='object'?e.designByTemplate:{};
 e.photos=Array.isArray(e.photos)?e.photos.map(U.photo):[];
 e.heroSettings||={x:50,y:50,alt:'Wedding couple'};
 if(U.ensureDetails)U.ensureDetails(e);
 return e;
};
U.enabled=(e,id)=>{U.model(e);const item=U.customItem(e,id);if(item)return item.enabled!==false;return typeof e.featureConfig[id]==='boolean'?e.featureConfig[id]:enabledDefaults[id]===true};
U.variant=(e,id)=>{U.model(e);const item=U.customItem(e,id);if(item)return item.layout==='wide'?'wide':'auto';let v=e.layoutByTemplate[e.template]?.[id],f=U.features.find(f=>f.id===id),base=U.baseTemplate(e);return f?.variants.some(a=>a[0]===v)?v:variants[base][id]};
U.design=e=>{U.model(e);const base=U.baseTemplate(e),recipe=e.templateRecipes.find(x=>x.id===e.template),defaultStyle=U.presets[base],d={...defaultStyle,...(recipe?.style||{})},c=e.designByTemplate[e.template]||{};return {bg:color(c.bg,d.bg),ink:color(c.ink,d.ink),accent:color(c.accent,d.accent),heading:U.fonts[c.heading]?c.heading:U.fonts[d.heading]?d.heading:defaultStyle.heading,body:U.fonts[c.body]?c.body:U.fonts[d.body]?d.body:defaultStyle.body,spacing:['compact','balanced','airy'].includes(c.spacing)?c.spacing:['compact','balanced','airy'].includes(d.spacing)?d.spacing:defaultStyle.spacing}};
U.picture=(p,cls='',placeholder='Add a wedding photo')=>{p=U.photo(p||{});let url=imgurl(p.src);return '<div class="wb-photo '+cls+'">'+(url?'<img loading="lazy" draggable="false" src="'+T(url)+'" alt="'+T(p.alt)+'" style="object-position:'+p.x+'% '+p.y+'%;transform-origin:'+p.x+'% '+p.y+'%;transform:scale('+p.zoom+')">':'<div class="wb-photo-empty">'+T(placeholder)+'</div>')+'</div>'};
const head=(t)=>'<span class="wb-kicker">'+T(t)+'</span>';

/* Original botanical illustration and editorial cover compositions.
   Content remains attached to common URI features, never hardcoded in a template. */
const botanicalSprig='<svg viewBox="0 0 175 238" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g fill="none" stroke="#877E70" stroke-width="1.55" stroke-linecap="round"><path d="M18 231C47 190 53 147 77 100C94 67 111 41 145 8"/><path d="M48 176C31 148 18 135 7 121"/><path d="M65 132C91 126 117 119 138 101"/><path d="M96 68C78 52 73 32 77 12"/><path d="M116 46C142 50 155 43 165 28"/></g><g fill="#68796C" fill-opacity=".77"><path d="M47 184C26 180 16 156 13 141C35 148 48 164 47 184Z"/><path d="M67 137C89 116 111 115 128 117C112 135 91 140 67 137Z"/><path d="M90 77C71 64 69 45 72 30C86 42 94 56 90 77Z"/><path d="M115 46C132 32 151 29 164 32C150 46 135 51 115 46Z"/></g><g fill="#AC847F" fill-opacity=".7"><path d="M25 213C16 194 26 181 39 178C44 195 35 208 25 213Z"/><path d="M86 107C100 94 116 93 127 97C119 109 103 114 86 107Z"/></g><g fill="#C99E92" fill-opacity=".67" stroke="#AD817A" stroke-width=".6"><path d="M135 20C123 12 126 3 132 1C142 3 149 10 145 20C156 11 165 17 165 25C160 33 151 32 145 26C147 38 137 43 129 38C124 30 129 24 135 20Z"/><path d="M11 121C2 115 2 105 11 101C20 101 23 111 19 118C30 115 35 125 29 132C22 135 16 131 14 125C10 137 2 136 0 127Z"/></g><g fill="#E9D5C7" fill-opacity=".75"><circle cx="143" cy="23" r="4"/><circle cx="15" cy="121" r="3"/></g></svg>';
const lovelyNames=e=>'<span>'+T(e.name1||'Your Name')+'</span><i>and</i><span>'+T(e.name2||'Partner Name')+'</span>';
const simpleMonogram=e=>T((e.name1||'Y').trim().charAt(0).toUpperCase()+'  '+(e.name2||'Y').trim().charAt(0).toUpperCase());
function teaserDetails(e){return U.enabled(e,'details')?'<div class="wb-editorial-detail-teaser"><div class="wb-editorial-side-title">The Details</div><div class="wb-editorial-rule"></div><strong>'+T(e.date?fmt(e.date):'Date to be announced')+'</strong><span>'+T(e.time||'Time to be confirmed')+'</span><span class="wb-editorial-rule"></span><span class="wb-kicker">VENUE</span><strong>'+T(e.venue||'Venue to be announced')+'</strong><span>'+T(e.address||'Address to follow')+'</span></div>':'<div class="wb-editorial-detail-teaser"><div class="wb-editorial-side-title">Welcome</div><div class="wb-editorial-rule"></div><p>We are delighted to celebrate with you.</p></div>'}
function teaserTimeline(e){if(window.URIWeddingDetails)return window.URIWeddingDetails.renderTimelineTeaser(e);if(!U.enabled(e,'timeline'))return '<div class="wb-editorial-timeline-teaser"><div class="wb-editorial-side-title">Our Day</div></div>';let lines=String(e.featureConfig.timeline??'2:00 PM | Ceremony\n4:00 PM | Reception\n6:00 PM | Dinner').split('\n').filter(Boolean).slice(0,4),items=lines.map((line,i)=>{let parts=line.split('|');return '<div class="wb-editorial-timeline-row"><span class="wb-editorial-icon" aria-hidden="true">'+['','','',''][i%4]+'</span><div><strong>'+T(parts[0].trim())+'</strong><small>'+T(parts.slice(1).join('|').trim()||'Celebration')+'</small></div></div>'}).join('');return '<div class="wb-editorial-timeline-teaser"><div class="wb-editorial-side-title">The Timeline</div><div class="wb-editorial-rule"></div>'+items+'</div>'}
/* Nightfall: an original wedding adaptation of the cinematic, dark layout style. */
function nightfallHero(e,v,hp){
 let name1=T(e.name1||'Your Name'),name2=T(e.name2||'Partner Name');
 return '<section data-feature="hero" class="wb-unit wb-hero wb-hero-'+v+' wb-nightfall-hero">'
  +'<div class="wb-nightfall-media">'+U.picture(hp,'wb-hero-image wb-nightfall-portrait','Add your wedding photograph')+'</div>'
  +'<div class="wb-nightfall-shadow" aria-hidden="true"></div>'
  +'<div class="wb-nightfall-side" aria-hidden="true"><span>URI WEDDING</span></div>'
  +'<div class="wb-nightfall-main"><span class="wb-nightfall-tag">THE WEDDING OF</span>'
  +'<h1 class="wb-nightfall-names"><span>'+name1+'</span><em>&amp;</em><span>'+name2+'</span></h1>'
  +'<span class="wb-nightfall-line" aria-hidden="true"></span>'
  +'<div class="wb-nightfall-meta"><span>'+T(e.date?fmt(e.date):'Date to be announced')+'</span><span>'+T(e.venue||'Venue to be announced')+'</span></div>'
  +'</div>'
  +'<div class="wb-nightfall-bottom" aria-hidden="true"><span>OUR STORY</span><span class="wb-nightfall-bottom-line"></span></div>'
  +'</section>';
}
function nightfallStory(e,v,storyText){
 let name1=T(e.name1||'Your Name'),name2=T(e.name2||'Partner Name');
 return '<section data-feature="story" class="wb-unit wb-story wb-story-'+v+' wb-nightfall-story">'
  +'<div class="wb-nightfall-story-heading"><span>OUR STORY</span><h2>'+name1+' <em>&amp;</em> '+name2+'</h2></div>'
  +'<div class="wb-nightfall-story-body"><p>'+storyText+'</p></div>'
  +'</section>';
}
function hero(e,v){let hp=U.photo({src:e.heroPhoto||'',...e.heroSettings});if(U.baseTemplate(e)==='nightfall')return nightfallHero(e,v,hp);if(U.baseTemplate(e)==='garden'){
const showDetails=U.enabled(e,'details'),showTimeline=U.enabled(e,'timeline')&&(!window.URIWeddingDetails||window.URIWeddingDetails.getTimeline(e).length>0);
const sides=showDetails?(showTimeline?'both':'details'):(showTimeline?'timeline':'none');
return '<section data-feature="hero" class="wb-unit wb-hero wb-hero-'+v+' wb-editorial-cover wb-editorial-sides-'+sides+'">'+(showDetails?'<aside class="wb-editorial-side wb-editorial-left">'+teaserDetails(e)+'</aside>':'')+'<div class="wb-editorial-middle"><div class="wb-editorial-landscape">'+U.picture(hp,'wb-hero-image','Add your wedding photograph')+'</div><div class="wb-editorial-main"><h1 class="wb-names">'+lovelyNames(e)+'</h1><span class="wb-editorial-fine-rule"></span><div class="wb-editorial-date">'+T(e.date?fmt(e.date):'Save the date')+'</div>'+(U.enabled(e,'details')?'':'<p>'+T(e.venue||'Venue to be announced')+'</p>')+'</div></div>'+(showTimeline?'<aside class="wb-editorial-side wb-editorial-right">'+teaserTimeline(e)+'</aside>':'')+'</section>'}
return '<section data-feature="hero" class="wb-unit wb-hero wb-hero-'+v+' wb-botanical-cover">'+U.picture(hp,'wb-hero-image','Add your wedding portrait')+'<div class="wb-hero-copy"><span class="wb-botanical-art wb-botanical-art-top">'+botanicalSprig+'</span><span class="wb-botanical-art wb-botanical-art-side">'+botanicalSprig+'</span><h1 class="wb-names">'+lovelyNames(e)+'</h1><strong class="wb-botanical-date">'+T(e.date?fmt(e.date):'Save the date')+'</strong><p class="wb-botanical-venue">'+T(e.venue||'Venue to be announced')+'</p>'+(U.enabled(e,'gallery')&&e.photos.some(p=>imgurl(U.photo(p).src))?'<div class="wb-botanical-round-photo">'+U.picture(e.photos[0]||{src:'',alt:'Wedding photograph'},'wb-portrait-small','Add a photo')+'</div>':'')+'</div></section>'}
function story(e,v){let storyText=T(e.message||'Together with our families, we joyfully invite you to celebrate with us.');if(U.baseTemplate(e)==='nightfall')return nightfallStory(e,v,storyText);if(U.baseTemplate(e)==='garden'){let photo=e.photos.length&&U.enabled(e,'gallery')?e.photos[0]:{src:e.heroPhoto||'',...e.heroSettings};return '<section data-feature="story" class="wb-unit wb-story wb-story-'+v+' wb-editorial-story"><div class="wb-editorial-story-photo">'+U.picture(photo,'wb-story-image','A moment together')+'</div><div class="wb-editorial-story-center"><div class="wb-editorial-story-monogram"><span>'+simpleMonogram(e)+'</span></div><p>'+storyText+'</p></div><div class="wb-editorial-story-names"><span class="wb-kicker">OUR STORY</span><strong>'+T(e.name1||'Your Name')+'<span>&amp;</span>'+T(e.name2||'Partner Name')+'</strong></div></section>'}
return '<section data-feature="story" class="wb-unit wb-story wb-story-'+v+' wb-botanical-story"><span class="wb-botanical-art wb-botanical-art-story">'+botanicalSprig+'</span><h2>Our Story</h2><p>'+storyText+'</p><span class="wb-botanical-signature">'+T(e.name1||'Your Name')+' &amp; '+T(e.name2||'Partner Name')+'</span></section>'}
function gallery(e,v){let photos=e.photos.filter(p=>imgurl(p.src));if(!photos.length)return '';let items=photos.map((p,i)=>'<figure class="wb-slide wb-crop-'+p.crop+'" '+(v==='carousel'&&i?'hidden':'')+'>'+U.picture(p,'wb-gallery-image')+'<figcaption>'+T(p.alt)+'</figcaption></figure>').join('');return '<section data-feature="gallery" class="wb-unit wb-gallery wb-gallery-'+v+'">'+''+'<h2>Photo Gallery</h2>'+(photos.length?'<div class="wb-gallery-items" data-index="0">'+items+'</div>'+(v==='carousel'?'<div class="wb-gallery-controls"><button type="button" aria-label="Previous photo" onclick="uriBSlide(this,-1)">‹</button><span class="wb-gallery-status">1 / '+photos.length+'</span><button type="button" aria-label="Next photo" onclick="uriBSlide(this,1)">›</button></div>':''):'<div class="wb-empty">Add photos in the Photo Manager</div>')+'</section>'}
function countdown(e,v){let when=e.date?new Date(e.date+'T'+(e.time||'00:00')+':00'):null,ms=when&&!isNaN(+when)?Math.max(0,+when-Date.now()):0,values=[Math.floor(ms/86400000),Math.floor(ms%86400000/3600000),Math.floor(ms%3600000/60000),Math.floor(ms%60000/1000)];return '<section data-feature="countdown" class="wb-unit wb-countdown wb-countdown-'+v+'">'+''+'<h2>Until Our Wedding</h2><div class="wb-counts">'+values.map((x,i)=>'<div><strong>'+String(x).padStart(2,'0')+'</strong><small>'+['Days','Hours','Minutes','Seconds'][i]+'</small></div>').join('')+'</div></section>'}
function details(e,v){return window.URIWeddingDetails?window.URIWeddingDetails.renderDetails(e,v):'<section data-feature="details" class="wb-unit wb-details wb-details-'+v+'">'+''+'<h2>Wedding Details</h2><p>'+T(e.venue||'Venue to be announced')+'</p></section>'}
function timeline(e,v){return window.URIWeddingDetails?window.URIWeddingDetails.renderTimeline(e,v):'<section data-feature="timeline" class="wb-unit wb-timeline wb-timeline-'+v+'"><h2>Wedding Timeline</h2></section>'}
function dress(e,v){let c=e.featureConfig,colors=String(c.dressColors||'#B5A48B,#D4C5B3,#667C68,#A57C74').split(',').slice(0,6).map(x=>color(x.trim(),'#D4C5B3'));return '<section data-feature="dress" class="wb-unit wb-dress wb-dress-'+v+'">'+''+'<h2>Dress Code</h2><p>'+T(c.dress??'Formal attire · Earth tones and neutrals')+'</p>'+(v==='palette'?'<div class="wb-swatches">'+colors.map(x=>'<span style="background:'+x+'" title="'+x+'"></span>').join('')+'</div>':'')+'</section>'}
function gifts(e,v){let c=e.featureConfig,url=String(c.registryUrl||'');return '<section data-feature="gifts" class="wb-unit wb-gifts wb-gifts-'+v+'">'+''+'<h2>Gift Registry</h2><p>'+T(c.gifts??'Your presence is our greatest gift.')+'</p>'+(url.startsWith('https://')?'<a target="_blank" rel="noopener noreferrer" href="'+T(url)+'">View registry </a>':'')+'</section>'}
function rsvp(e,v){return '<section data-feature="rsvp" class="wb-unit wb-rsvp wb-rsvp-'+v+'">'+''+'<h2>Kindly RSVP</h2><p>'+(e.deadline?'Please reply by '+T(fmt(e.deadline))+'.':'Please let us know if you can celebrate with us.')+'</p><small>Online RSVP collection is not active yet. Please contact the hosts directly to respond.</small></section>'}
const views={hero,story,gallery,countdown,details,timeline,dress,gifts,rsvp};
/* Compose actual renderable sections first: disabled/empty features leave no holes.
   Pairs only form between adjacent compatible sections in the user's order. */
U.compose=e=>{
 U.model(e);
 const layout=U.templateLayout[U.baseTemplate(e)]||U.templateLayout.classic;
 const list=e.featureOrder.filter(id=>U.enabled(e,id)).map(id=>{
  const item=U.customItem(e,id);
  return {id,variant:U.variant(e,id),html:item?(U.renderCustom?U.renderCustom(e,item):''):views[id]?views[id](e,U.variant(e,id)):''};
 }).filter(x=>x.html&&x.html.trim());
 const canPair=id=>{
  const item=U.customItem(e,id);
  return item?item.layout!=='wide'&&['text','faq','map','button'].includes(item.type):layout.pairs.includes(id);
 };
 for(let i=0;i<list.length;i++){
  const item=list[i];
  item.width='wide';item.pair='single';
  if(canPair(item.id)&&i+1<list.length&&canPair(list[i+1].id)){
   item.width='half';item.pair='first';
   list[i+1].width='half';list[i+1].pair='second';
   i++;
  }
 }
 return list.map((item,index)=>({...item,
  html:item.html.replace('<section ','<section data-layout-width="'+item.width+'" data-layout-pair="'+item.pair+'" data-layout-index="'+index+'" ')
 }));
};
U.render=e=>{U.model(e);let d=U.design(e),style='--wb-bg:'+d.bg+';--wb-ink:'+d.ink+';--wb-accent:'+d.accent+';--wb-heading:'+U.fonts[d.heading]+';--wb-body:'+U.fonts[d.body]+';';const plan=U.compose(e);return '<article class="uri-builder-site wb-theme-'+(U.baseTemplate(e)==='garden'?'editorial':U.baseTemplate(e)==='nightfall'?'nightfall':'botanical')+' wb-spacing-'+d.spacing+'" data-visible-features="'+plan.length+'" style="'+style+'"><div class="wb-flow">'+plan.map(x=>x.html).join('')+'</div><footer class="wb-footer">URI</footer></article>'};
U.cover=e=>{let title=T(e.name1||'Maya'),other=T(e.name2||'Emir'),date=T(e.date?fmt(e.date):'SAVE THE DATE'),src=imgurl(e.heroPhoto||'');let x=clamped(e.heroSettings?.x??50),y=clamped(e.heroSettings?.y??50),zoom=Math.min(3,Math.max(1,Number(e.heroSettings?.zoom)||1)),photo=src?'<img src="'+T(src)+'" alt="Wedding couple portrait" style="object-position:'+x+'% '+y+'%;transform-origin:'+x+'% '+y+'%;transform:scale('+zoom+')">':'';
if(U.baseTemplate(e)==='nightfall')return '<div class="wb-cover-mini wb-mini-nightfall"><div class="wb-mini-nightfall-photo">'+photo+'</div><div class="wb-mini-nightfall-shade"></div><div class="wb-mini-nightfall-content"><span>THE WEDDING OF</span><strong>'+title+'<em>&amp;</em>'+other+'</strong><i></i><small>'+date+'</small></div></div>';
if(U.baseTemplate(e)==='garden'){
 const hasDetails=U.enabled(e,'details'),hasTimeline=U.enabled(e,'timeline')&&(!window.URIWeddingDetails||window.URIWeddingDetails.getTimeline(e).length>0);
 const sides=hasDetails?(hasTimeline?'both':'details'):(hasTimeline?'timeline':'none');
 return '<div class="wb-cover-mini wb-cover-editorial wb-mini-stationery wb-mini-sides-'+sides+'">'
 +(hasDetails?'<div class="wb-mini-details"><span class="wb-editorial-side-title">The Details</span><small>THE WEDDING</small><strong>'+date+'</strong><small>'+T(e.venue||'THE VENUE')+'</small></div>':'')
 +'<div class="wb-mini-main"><div class="wb-mini-landscape">'+photo+'</div><strong>'+title+' <em>&amp;</em> '+other+'</strong><span class="wb-mini-date">'+date+'</span></div>'
 +(hasTimeline?'<div class="wb-mini-timeline"><span class="wb-editorial-side-title">Timeline</span><small>CEREMONY</small><small>RECEPTION</small></div>':'')
 +'</div>';
}
return '<div class="wb-cover-mini wb-cover-botanical wb-mini-romance"><div class="wb-cover-photo">'+photo+'</div><div class="wb-cover-copy"><span class="wb-mini-flowers" aria-hidden="true">'+botanicalSprig+'</span><strong>'+title+'<em>and</em>'+other+'</strong><span class="wb-mini-date">'+date+'</span></div></div>'};
window.uriBuilderInv=U.render;
window.uriBSlide=(btn,delta)=>{let g=btn.closest('.wb-gallery'),slides=[...g.querySelectorAll('.wb-slide')];if(!slides.length)return;let area=g.querySelector('.wb-gallery-items'),next=((Number(area.dataset.index)||0)+delta+slides.length)%slides.length;slides.forEach((s,i)=>s.hidden=i!==next);area.dataset.index=next;g.querySelector('.wb-gallery-status').textContent=(next+1)+' / '+slides.length};
U.persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));U.lastSaveFailed=false;return true}catch(err){U.lastSaveFailed=true;alert('Unable to save changes in this browser. Remove some photos or free up storage.');return false}};
U.refresh=()=>{let e=current(),el=document.getElementById('wbLivePreview');if(e&&el){el.innerHTML=U.render(e);if(window.uriBPreviewFit)setTimeout(window.uriBPreviewFit,0)}};
U.payload=e=>{U.model(e);let keys=['type','name1','name2','title','date','time','venue','address','template','deadline','message','featureConfig','featureOrder','layoutByTemplate','designByTemplate','heroPhoto','heroSettings','photos','weddingDetails','timelineItems','customSections','templateRecipes'];return Object.fromEntries(keys.map(k=>[k,JSON.parse(JSON.stringify(e[k]??null))]))};
render();
})();
