/* Template picker browser QA: home, wedding wizard, design editor.
   Screenshots and layout checks in desktop and phone viewports.
   Offline test server: no production accounts or customer data are accessed. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const screenshots=path.join(root,'artifacts/thumbnail-refresh');
fs.mkdirSync(screenshots,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/URI\/?/,'').replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,data)=>{
  if(err){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'text/plain','cache-control':'no-store'});res.end(data)
 })
});
const themes=['uri-mini-botanical','uri-mini-editorial','uri-mini-nightfall','uri-mini-adventure'];
const assertTiles=async (page,selector)=>{
 const cards=page.locator(selector);assert.equal(await cards.count(),4,selector+' must show all four designs');
 for(let i=0;i<themes.length;i++){
  const thumb=cards.nth(i).locator('.uri-template-mini');
  assert.ok(await thumb.isVisible(),themes[i]+' is visible');
  assert.ok((await thumb.getAttribute('class')).includes(themes[i]),themes[i]+' has matching artwork');
  const dims=await thumb.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,scroll:el.scrollWidth}));
  assert.ok(dims.width>=90&&dims.height>=110,selector+' card '+i+' must have a readable size '+JSON.stringify(dims));
  assert.ok(dims.scroll<=dims.width+2,selector+' card '+i+' must not overflow '+JSON.stringify(dims));
 }
};
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const v of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
   const page=await browser.newPage({viewport:{width:v.width,height:v.height},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/cloud-config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.URI_CLOUD_CONFIG={url:"",publishableKey:""};'}));
   await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/URI/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>Boolean(window.URIBuilder?.thumbnail),null,{timeout:15000});
   await assertTiles(page,'#templates .template');
   await page.locator('#templates .templates').screenshot({path:path.join(screenshots,'landing-'+v.name+'.png'),animations:'disabled'});
   await page.evaluate(()=>startWizard('classic'));
   await page.locator('.wf-design').first().waitFor();
   await assertTiles(page,'.wf-design');
   assert.equal(await page.locator('.wf-design[aria-pressed="true"]').count(),1);
   assert.equal(await page.locator('.wf-design[aria-pressed="true"]').first().innerText().then(s=>s.includes('Romantic Botanical')),true);
   await page.locator('.wf-design').nth(2).click();
   assert.equal(await page.locator('.wf-design[aria-pressed="true"]').count(),1);
   await page.locator('.wf-designs').screenshot({path:path.join(screenshots,'wizard-'+v.name+'.png'),animations:'disabled'});
   await page.evaluate(()=>{
    const e={...defaults(),id:'thumbnail-qa',type:'Wedding',name1:'Maya',name2:'Emir',
      date:'2032-09-18',time:'16:00',venue:'The Garden Pavilion',template:'classic'};
    state.events.push(e);state.current=e.id;tab='edit';
    route('event');window.uriBPanel('design');
   });
   await page.locator('.wb-template-pick').first().waitFor();
   await assertTiles(page,'.wb-template-pick');
   assert.equal(await page.locator('.wb-template-pick[aria-pressed="true"]').count(),1);
   await page.locator('.wb-template-choices').screenshot({path:path.join(screenshots,'editor-'+v.name+'.png'),animations:'disabled'});
   const before=await page.evaluate(()=>JSON.stringify({name1:current().name1,name2:current().name2,date:current().date}));
   await page.locator('.wb-template-pick').nth(1).click();
   const after=await page.evaluate(()=>JSON.stringify({name1:current().name1,name2:current().name2,date:current().date}));
   assert.equal(after,before,'Switching templates preserves event content');
   assert.equal(await page.locator('.wb-template-pick[aria-pressed="true"]').count(),1);
   assert.deepEqual(errors,[],v.name+' should not throw errors: '+errors.join('; '));
   await page.close();
   console.log(v.name+' template thumbnails passed: 4 distinct previews in landing, wizard, editor, intact selection and event data.');
  }
 }finally{if(browser)await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
