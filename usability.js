/* URI Usability 1.0: public invitations are guest-facing, not creator workspaces. */
(function(){
 'use strict';
 function updateGuestShell(){
  const path=location.hash.slice(1);
  const guest=/^(?:public\/|rsvp\/|invite\/)/.test(path);
  document.body.classList.toggle('uri-guest-view',guest);
  const header=document.querySelector('body > header.top');
  if(header){
   if(guest&&header.contains(document.activeElement))document.activeElement.blur?.();
   header.setAttribute('aria-hidden',String(guest));
  }
  const footer=document.querySelector('body > footer');
  if(footer)footer.setAttribute('aria-hidden',String(guest));
 }
 window.addEventListener('hashchange',updateGuestShell);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateGuestShell,{once:true});
 else updateGuestShell();
})();
