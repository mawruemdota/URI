/* Browser-engine mobile release QA. WebKit approximates Safari and Chromium
 * approximates Android Chrome; neither is a physical-device test.
 * No production login, guest records or database writes are performed. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const root=path.resolve(__dirname,'..');
const shots=path.join(root,'artifacts','mobile-release');
fs.mkdirSync(shots,{recursive:true});
const phaser=fs.readFileSync(path.join(root,'node_modules','phaser','dist','phaser.min.js'));
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/URI\/?/,'').replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end('Forbidden');return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Missing');return}
  res.writeHead(200,{'content-type':(types[path.extname(file)]||'application/octet-stream'),'cache-control':'no-store'});res.end(data);
 });
});
function checkOverflow(page,label){
 return page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}))
  .then(v=>assert.ok(v.scroll-v.width<=6,label+' horizontal overflow: '+JSON.stringify(v)));
}
async function shot(page,label,name){
 await page.screenshot({path:path.join(shots,label+'-'+name+'.png'),fullPage:true,animations:'disabled'});
}
async function mobileJourney(engine,name,device){
 const browser=await engine.launch({headless:true,args:engine===chromium?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']:[]});
 const context=await browser.newContext({...devices[device],locale:'en-PH',reducedMotion:'reduce'});
 const errors=[];
 try{
  await context.route('**/cloud-config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.URI_CLOUD_CONFIG={url:"",publishableKey:""};'}));
  await context.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await context.route('https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:phaser}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port+'/URI/';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  assert.equal(await page.getByRole('button',{name:'Create wedding website'}).count(),1);
  await checkOverflow(page,name+' home');
  await shot(page,name,'01-home');
  await page.locator('#templates .template').first().click();
  await page.locator('#wf-name1').waitFor({state:'visible',timeout:1000}).catch(async()=>{
   await page.locator('.wf-design').first().click(); await page.locator('.wf-actions .btn.primary').click();
  });
  await page.locator('#wf-name1').fill('Maya');
  await page.locator('#wf-name2').fill('Emir');
  await page.locator('.wf-actions .btn.primary').click();
  await page.locator('#wf-date').fill('2032-09-18');
  await page.locator('#wf-time').fill('16:00');
  await page.locator('#wf-venue').fill('Garden Pavilion');
  await page.locator('.wf-actions .btn.primary').click();
  await page.locator('#wf-message').fill('Join our celebration.');
  await page.locator('.wf-actions .btn.primary').click();
  await page.locator('.wf-review').waitFor();
  await shot(page,name,'02-review');
  await page.locator('.wf-actions .btn.primary').click();
  await page.locator('.wb-editor').waitFor();
  assert.equal(await page.locator('.wb-tabs button').count(),5,'Essential creator steps must be five');
  assert.match(await page.locator('.uri-creator-guide').innerText(),/one step at a time/i);
  await checkOverflow(page,name+' editor');
  await shot(page,name,'03-editor');
  await page.getByRole('button',{name:'Show advanced tools'}).click();
  assert.equal(await page.locator('.wb-tabs button').count(),7,'Advanced creator tools must be optional');
  await page.getByRole('button',{name:'Show essential steps'}).click();
  await page.locator('.wb-tabs button').filter({hasText:'Publish'}).click();
  assert.match(await page.locator('#uriCloudRoot').innerText(),/Publishing is not available/i);
  await page.locator('.sidebar button').filter({hasText:'Guests & RSVP'}).click();
  await page.locator('.uri-guest-form input[name="name"]').fill('Sofia Cruz');
  await page.locator('.uri-guest-form button[type="submit"]').click();
  const link=page.locator('.uri-guest-row .uri-online-link');
  assert.equal(await link.count(),1);
  assert.equal(await link.isDisabled(),true,'Unpublished invitations must not expose usable guest links');
  const addTop=await page.locator('.uri-guest-fast-add').evaluate(el=>el.getBoundingClientRect().top);
  const statTop=await page.locator('.uri-guest-stats').evaluate(el=>el.getBoundingClientRect().top);
  assert.ok(addTop<statTop,'Add Guest should precede guest stats on a phone');
  await checkOverflow(page,name+' guests');
  await shot(page,name,'04-guests');
  await page.goto(base+'#rsvp/invalid',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Invitation unavailable'}).waitFor({timeout:10000});
  await page.waitForFunction(()=>document.body.classList.contains('uri-guest-view'));
  assert.equal(await page.locator('body > header.top').isVisible(),false,'Guest header should not contain creator links');
  await shot(page,name,'05-guest-error');
  // In-game onboarding and actual Phaser movement with no shortcuts.
  await page.goto(base+'#event',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   const e={...defaults(),id:'mobile-qa-adventure',type:'Wedding',template:'adventure',
    name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',
    venue:'Garden Pavilion',message:'Explore our story!'};
   state.events.push(e);state.current=e.id;tab='edit';save();route('event');
  });
  await page.locator('#wbLivePreview .uri-adventure-guide-text').waitFor({timeout:12000});
  assert.match(await page.locator('#wbLivePreview .uri-adventure-guide-text').innerText(),/Step 1 of 3/);
  await page.locator('#wbLivePreview [data-adventure-action="play"]').click();
  const canvas=page.locator('#wbLivePreview .uri-adventure-stage canvas');
  await canvas.waitFor({timeout:25000});
  await page.waitForFunction(()=>Boolean(document.querySelector('#wbLivePreview .uri-adventure-site')?._uriAdventure?.scene?.player),null,{timeout:20000});
  const before=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  await page.locator('#wbLivePreview [data-adventure-control="right"]').evaluate(el=>{
   const r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,pointerId:345,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2,buttons:1,button:0
   }));
  });
  await page.waitForTimeout(750);
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:345,pointerType:'touch',buttons:0})));
  const after=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  assert.ok(after>before+8,name+' gameplay right movement did not respond: '+before+' => '+after);
  await page.waitForFunction(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.controls.right===false);
  assert.match(await page.locator('#wbLivePreview .uri-adventure-guide-text').innerText(),/Step 2 of 3/);
  await shot(page,name,'06-adventure');
  assert.deepEqual(errors,[],name+' JavaScript errors: '+errors.join('; '));
  console.log(name+' passed: wizard, editor, sharing, guest shell, Phaser movement and no horizontal overflow.');
 }finally{await browser.close()}
}
(async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 try{
  await mobileJourney(webkit,'ios-webkit','iPhone 13');
  await mobileJourney(chromium,'android-chromium','Pixel 7');
 }finally{server.close()}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
