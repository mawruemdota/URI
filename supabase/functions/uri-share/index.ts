// URI social-preview share endpoint.
// Dynamic Open Graph tags require server-rendered HTML: GitHub Pages cannot
// attach unique meta tags to /URI/:slug without a rewrite-capable host.
const PROJECT=String(Deno.env.get('SUPABASE_URL')||'').replace(/\/+$/,'');
const PUBLIC_KEY=String(Deno.env.get('SUPABASE_ANON_KEY')||'');
const WEB='https://mawruemdota.github.io/URI/';
const esc=(s:string)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const plain=(s:unknown,max=160)=>String(s??'').replace(/[\r\n\t]+/g,' ').slice(0,max).trim();
const safeImage=(raw:unknown)=>{
 try{
  const u=new URL(String(raw||''));
  const root=new URL(PROJECT);
  if(u.protocol!=='https:'||u.hostname!==root.hostname||
   !u.pathname.startsWith('/storage/v1/object/public/'))return '';
  return u.href;
 }catch{return ''}
};
const error=(status:number,msg:string)=>new Response('<!doctype html><html lang="en"><meta charset="utf-8"><title>Invitation unavailable</title><body><h1>Invitation unavailable</h1><p>'+esc(msg)+'</p></body></html>',{
 status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
Deno.serve(async req=>{
 if(!['GET','HEAD'].includes(req.method))return error(405,'Method not supported.');
 const u=new URL(req.url),slug=u.searchParams.get('slug')||'';
 if(!/^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/.test(slug)||slug.includes('--'))return error(400,'Invalid event link.');
 if(!PROJECT||!PUBLIC_KEY)return error(503,'Sharing service is not configured.');
 try{
  const endpoint=PROJECT+'/rest/v1/uri_publications?select=title,payload&published=eq.true&slug=eq.'+encodeURIComponent(slug)+'&limit=1';
  const response=await fetch(endpoint,{headers:{'apikey':PUBLIC_KEY,'accept':'application/json'}});
  if(!response.ok)return error(503,'Unable to retrieve invitation.');
  const rows=await response.json();
  if(!Array.isArray(rows)||!rows.length)return error(404,'This event is not published.');
  const pub=rows[0],data=pub.payload||{};
  const title=plain(pub.title||[data.name1,data.name2].filter(Boolean).join(' & ')||'Invitation',130);
  const date=plain(data.date||'',50),venue=plain(data.venue||'',90);
  const description=plain(['You are invited!',date,venue].filter(Boolean).join(' · '),190);
  const destination=WEB+encodeURIComponent(slug);
  const preview=PROJECT+'/functions/v1/uri-share?slug='+encodeURIComponent(slug);
  const photo=safeImage(data.heroPhoto);
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'
   +'<meta name="viewport" content="width=device-width,initial-scale=1">'
   +'<title>'+esc(title)+' — URI Invitation</title>'
   +'<meta name="description" content="'+esc(description)+'">'
   +'<meta property="og:type" content="website">'
   +'<meta property="og:site_name" content="URI Invitations">'
   +'<meta property="og:title" content="'+esc(title)+' — You’re invited">'
   +'<meta property="og:description" content="'+esc(description)+'">'
   +'<meta property="og:url" content="'+esc(preview)+'">'
   +(photo?'<meta property="og:image" content="'+esc(photo)+'"><meta name="twitter:card" content="summary_large_image">':'<meta name="twitter:card" content="summary">')
   +'<link rel="canonical" href="'+esc(destination)+'">'
   +'<meta name="robots" content="noindex,follow">'
   +'</head><body style="font:16px system-ui;max-width:580px;margin:14vh auto;padding:24px;text-align:center">'
   +'<h1>'+esc(title)+'</h1><p>'+esc(description)+'</p>'
   +'<p><a href="'+esc(destination)+'">Open your invitation</a></p>'
   +'<script>location.replace('+JSON.stringify(destination).replace(/</g,'\\u003c')+');</script>'
   +'</body></html>';
  return new Response(req.method==='HEAD'?null:html,{
   status:200,headers:{'content-type':'text/html; charset=utf-8',
   'cache-control':'public, max-age=120','x-content-type-options':'nosniff'}});
 }catch{return error(503,'Please try the invitation link again.')}
});
