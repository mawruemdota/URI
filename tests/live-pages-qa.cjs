/* Check what GitHub Pages actually serves, not just that main contains code.
 * Run on main pushes only: PRs intentionally differ from the live branch. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const base=process.env.URI_LIVE_URL||'https://mawruemdota.github.io/URI/';
const critical=['index.html','usability.js','usability.css','adventure.js','cloud.js','guests-rsvp.js','cloud-rsvp.js'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function verify(){
 const results=[];
 for(const file of critical){
  const local=await fs.readFile(path.join(root,file));
  const url=new URL(file==='index.html'?'':file,base);
  url.searchParams.set('uri-ci',process.env.GITHUB_SHA||'verify');
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const r=await fetch(url,{signal:controller.signal,headers:{'cache-control':'no-cache'}});
   const bytes=Buffer.from(await r.arrayBuffer());
   const match=r.ok&&sha(bytes)===sha(local);
   results.push({file,status:r.status,bytes:bytes.length,match});
  }catch(err){results.push({file,status:'error',reason:err.message,match:false})}
  finally{clearTimeout(timeout)}
 }
 return results;
}
(async()=>{
 let results;
 for(let attempt=1;attempt<=5;attempt++){
  results=await verify();
  console.log('GitHub Pages deployment check '+attempt+'/5');
  for(const r of results)console.log(JSON.stringify(r));
  if(results.every(r=>r.match)){console.log('PASS: Live GitHub Pages assets match checked-out main.');return}
  if(attempt<5)await pause(18000);
 }
 const failures=results.filter(r=>!r.match);
 console.error('FAIL: These live GitHub Pages assets do not match main:',failures);
 console.error('Check repository Settings > Pages; ensure the source is main/(root) or the proper Pages Actions workflow.');
 process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
