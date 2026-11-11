/* Pretty public links: /maya-and-emir on a custom domain,
 * /URI/maya-and-emir on the existing GitHub Pages project URL. */
(function(){
 'use strict';
 const base=new URL('.',document.currentScript?.src||location.href);
 const basePath=base.pathname;
 const reserved=new Set(['home','dashboard','create','cloud','event','events','invite','invites','public','rsvp','admin','login','logout','signup','settings','account','api','assets','static','preview','pricing','features','templates','about','terms','privacy','help','contact','support','www','uri','index','404']);
 const valid=s=>/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/.test(s)&&!s.includes('--')&&!reserved.has(s) || /^uri-[a-z0-9-]{12,80}$/.test(s);
 function pathUsername(){
  const path=location.pathname;
  if(!path.startsWith(basePath))return null;
  const suffix=path.slice(basePath.length).replace(/\/$/,'');
  if(!suffix||suffix.includes('/'))return null;
  try{const name=decodeURIComponent(suffix);return valid(name)?name:null}catch(_){return null}
 }
 window.URI_PUBLIC_ROUTE=pathUsername();
 if(!window.URI_PUBLIC_ROUTE)return;
 let rendered=false;
 const original=render;
 render=function(){
  const slug=pathUsername();window.URI_PUBLIC_ROUTE=slug;
  if(slug){
   const hash=location.hash||'';
   if(hash==='#home'){
    location.replace(base.href+'#home');return;
   }
   // Personal RSVP URLs continue through the existing private token router.
   if(hash.startsWith('#rsvp/'))return original();
   if(hash&&hash!=='#'&&rendered)return;
   rendered=true;
   window.__uriLastRenderedHash=hash;
   return window.uriCloudOpenPublished(slug+location.search);
  }
  return original();
 };
 window.addEventListener('popstate',()=>render());
 render();
})();