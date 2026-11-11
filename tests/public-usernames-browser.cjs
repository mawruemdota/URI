/* Deep-link and editable-username acceptance test on simulated GitHub Pages.
 * No production database is accessed; the Supabase client is mocked. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const name=decodeURIComponent(pathname).replace(/^\/URI\/?/,'').replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end('Forbidden');return}
 fs.readFile(file,(err,body)=>{
  if(err){
   const fallback=fs.readFileSync(path.join(root,'404.html'));
   res.writeHead(404,{'content-type':'text/html'});res.end(fallback);return;
  }
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 });
});
async function journey(engine,name){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
   window.supabase={createClient:()=>({
    auth:{
     onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
     getSession:async()=>({data:{session:null}}),
     getUser:async()=>({data:{user:null},error:null})
    },
    from:table=>({
     select(){return this},
     eq(k,v){if(k==='slug')this.slug=v;return this},
     async maybeSingle(){
      if(table==='uri_publications'&&this.slug==='maya-and-emir')
       return {data:{title:'Maya & Emir',payload:{type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',venue:'Garden Pavilion'}},error:null};
      return {data:null,error:null};
     }
    })
   })};
  });
  await context.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,body:'',contentType:'application/javascript'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port+'/URI/';
  let response=await page.goto(base+'maya-and-emir',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),404,'GitHub Pages fallback deliberately returns HTTP 404; host migration is recommended for SEO');
  await page.waitForFunction(()=>document.querySelector('.uri-builder-site')?.textContent?.includes('Maya'),null,{timeout:15000});
  assert.equal(new URL(page.url()).pathname,'/URI/maya-and-emir','Direct URL should remain pretty (no hash redirect)');
  assert.equal(await page.locator('body > header.top').isVisible(),false,'Public event must hide creator navigation');
  assert.equal(await page.evaluate(()=>window.URI_PUBLIC_ROUTE),'maya-and-emir');
  assert.equal(await page.evaluate(()=>URICloud.publicLink('maya-and-emir')),base+'maya-and-emir');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.uri-builder-site')?.textContent?.includes('Maya'),null,{timeout:15000});
  assert.equal(new URL(page.url()).pathname,'/URI/maya-and-emir','Refresh keeps the pretty URL');
  await page.goto(base+'not-found',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Invitation unavailable'}).waitFor({timeout:15000});
  await page.goto(base+'#public/maya-and-emir',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.uri-builder-site')?.textContent?.includes('Maya'),null,{timeout:15000});
  assert.equal(await page.locator('body > header.top').isVisible(),false,'Legacy hash-based invite still works');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   const e={...defaults(),id:'slug-test',type:'Wedding',name1:'Maya',name2:'Emir',
    date:'2032-09-18',time:'16:00',venue:'Garden Pavilion',template:'classic'};
   state.events.push(e);state.current=e.id;tab='edit';save();route('event');
   window.uriBPanel('publish');
  });
  await page.locator('#uriPublicUsername').waitFor({timeout:15000});
  assert.equal(await page.locator('#uriPublicUsername').inputValue(),'maya-and-emir');
  await page.locator('#uriPublicUsername').fill('maya-and-emir-2027');
  assert.equal(await page.evaluate(()=>current().publicUsername),'maya-and-emir-2027');
  assert.equal(await page.evaluate(()=>window.URICloud.isValidUsername('home')),false);
  assert.equal(await page.evaluate(()=>window.URICloud.isValidUsername('my--event')),false);
  assert.equal(await page.evaluate(()=>window.URICloud.isValidUsername('maya-and-emir-2027')),true);
  assert.equal(await page.evaluate(()=>window.URICloud.publicLink('maya-and-emir-2027')),base+'maya-and-emir-2027');
  await page.locator('#uriPublicUsername').fill('home');
  assert.equal(await page.locator('#uriPublicUsername').getAttribute('aria-invalid'),'true');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('uri-prototype-v1')).events[0].publicUsername),'home');
  assert.deepEqual(errors,[],name+' JavaScript exceptions: '+errors.join('; '));
  console.log(name+' passed: direct /username, reload, legacy hash, unavailable, editable username, reserved names');
 }finally{await browser.close()}
}
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{await journey(chromium,'chromium');await journey(webkit,'webkit')}
 finally{server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
