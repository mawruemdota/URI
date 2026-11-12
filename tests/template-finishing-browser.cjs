/* Wedding visual regression: three redesigned invitation templates, desktop and phone.
 * Runs in CI Chromium; no customer data, real publication or Supabase connection. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'artifacts/template-refresh');
fs.mkdirSync(shots,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/URI\/?/,'').replace(/^\/+/, '')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);res.end('Missing');return}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'text/plain','cache-control':'no-store'});res.end(body)
 })
});
const demo={
 type:'Wedding',name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',
 venue:'The Garden Pavilion',address:'Cavite, Philippines',
 message:'Some stories begin with hello. Ours became a lifetime. We would love to celebrate this new chapter with you.',
 deadline:'2032-09-01',heroPhoto:'',photos:[],
 featureConfig:{},layoutByTemplate:{},designByTemplate:{}
};
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const size of [{name:'desktop',width:1120,height:900},{name:'mobile',width:390,height:844}]){
   const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
   let errors=[];page.on('pageerror',err=>errors.push(err.message));
   await page.route('**/cloud-config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.URI_CLOUD_CONFIG={url:"",publishableKey:""};'}));
   await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/URI/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>Boolean(window.URIBuilder?.render),null,{timeout:12000});
   for(const tpl of ['classic','garden','nightfall']){
    await page.evaluate(({tpl,demo})=>{
     window.scrollTo(0,0);
     document.body.classList.add('uri-guest-view');
     document.getElementById('app').innerHTML=window.URIBuilder.render({...demo,template:tpl});
    },{tpl,demo});
    const article=page.locator('#app .uri-builder-site'),hero=article.locator('[data-feature="hero"]');
    await hero.waitFor();
    assert.equal(await article.count(),1, 'Exactly one invitation should render');
    assert.equal(await article.locator('[data-feature="hero"] h1').count(),1);
    assert.equal(await article.locator('[data-feature="rsvp"]').count(),1);
    assert.match(await article.locator('[data-feature="rsvp"]').innerText(),/personal RSVP link/);
    if(tpl==='classic')assert.equal(await hero.locator('.wb-botanical-intro').count(),1);
    if(tpl==='garden')assert.equal(await hero.locator('.wb-editorial-invite-label').count(),1);
    if(tpl==='nightfall')assert.match(await hero.locator('.wb-nightfall-side').innerText(),/AN INVITATION/);
    const measurements=await page.evaluate(()=>{
     const article=document.querySelector('#app .uri-builder-site');
     const hero=article.querySelector('[data-feature="hero"]');
     return {width:article.getBoundingClientRect().width,
      scrollWidth:article.scrollWidth,
      bodyWidth:document.documentElement.scrollWidth,
      viewport:window.innerWidth,
      heroHeight:hero.getBoundingClientRect().height,
      sheet:getComputedStyle(document.querySelector('.wb-botanical-intro, .wb-editorial-invite-label, .wb-nightfall-tag')).fontSize
     }
    });
    assert.ok(measurements.heroHeight>180, tpl+' should have a substantial cover');
    assert.ok(measurements.scrollWidth<=measurements.width+2, tpl+' invitation should not overflow its own width: '+JSON.stringify(measurements));
    assert.ok(measurements.bodyWidth<=size.width+4, tpl+' should not cause page horizontal scrolling: '+JSON.stringify(measurements));
    await page.screenshot({path:path.join(shots,tpl+'-'+size.name+'.png'),fullPage:true,animations:'disabled'});
    console.log(tpl+' '+size.name+' OK:',JSON.stringify(measurements));
   }
   assert.deepEqual(errors,[],size.name+' JS errors: '+errors.join('; '));
   await page.close();
  }
  console.log('Template visual QA passed: 3 themes x 2 viewport widths.');
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
