/* Browser QA: playable Adventure Invitation through Phaser and guest-accessible HTML.
 * Installed dependencies in CI: playwright@1.56.1 and phaser@3.90.0.
 */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),screens=path.join(base,'artifacts','adventure-browser');
fs.mkdirSync(screens,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/URI\/?/,'').replace(/^\/+/, '')||'index.html';
 const file=path.resolve(base,name);
 if(!file.startsWith(base+path.sep)&&file!==path.join(base,'index.html')){res.writeHead(403);res.end('Forbidden');return}
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);res.end('Missing');return}
  res.writeHead(200,{'content-type':(types[path.extname(file)]||'text/plain')+'; charset=utf-8'});res.end(body);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/URI/';
 const phaser=fs.readFileSync(path.join(base,'node_modules','phaser','dist','phaser.min.js'));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:850},deviceScaleFactor:1});
 let errors=[];
 try{
  await context.route('**/cloud-config.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.URI_CLOUD_CONFIG={url:"",publishableKey:""};'}));
  await context.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
  await context.route('https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:phaser}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   const e={...defaults(),id:'adventure-qa',type:'Wedding',template:'adventure',name1:'Maya',name2:'Emir',
    date:'2032-09-18',time:'16:00',venue:'Garden Pavilion',message:'Our own adventure.',
    photos:[{id:'p1',src:'https://example.test/one.jpg',alt:'Our memory'}],
    featureOrder:window.URIBuilder.ids.slice()};
   state.events=[e];state.current=e.id;tab='edit';save();location.hash='#event';render();
  });
  await page.locator('#wbLivePreview .uri-adventure-site').waitFor();
  await page.locator('.wb-tabs button').filter({hasText:'Design'}).click();
  await page.locator('.uri-adventure-manager').waitFor();
  assert.match(await page.locator('.uri-adventure-stations').innerText(),/Welcome/);
  assert.match(await page.locator('.uri-adventure-stations').innerText(),/RSVP/);
  await page.locator('.uri-adventure-setting select').first().selectOption('sunset');
  await page.locator('#wbLivePreview [data-adventure-world="sunset"]').waitFor();
  await page.locator('.uri-adventure-setting select').nth(1).selectOption('dreamer');
  await page.locator('.uri-adventure-setting select').nth(2).selectOption('joystick');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-joystick').count(),1,'Mobile joystick option is rendered in the editor preview');
  const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('uri-prototype-v1')).events[0].adventure);
  assert.equal(settings.world,'sunset');
  assert.equal(settings.character,'dreamer');
  assert.equal(settings.touch,'joystick');
  await page.locator('#wbLivePreview [data-adventure-action="play"]').click();
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').waitFor({timeout:25000});
  await page.waitForFunction(()=>!!document.querySelector('#wbLivePreview .uri-adventure-site')?._uriAdventure?.scene?.player,{timeout:15000});
  const posBefore=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(750);
  await page.keyboard.up('ArrowRight');
  const posAfter=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  assert.ok(posAfter>posBefore+40,'Keyboard input moves the Phaser player: '+posBefore+' => '+posAfter);
  await page.locator('#wbLivePreview [data-adventure-action="map"]').click();
  await page.locator('#wbLivePreview .uri-adventure-map').waitFor({state:'visible'});
  await page.locator('#wbLivePreview [data-adventure-station="details"]').click();
  await page.locator('#wbLivePreview .uri-adventure-dialog').waitFor({state:'visible'});
  assert.match(await page.locator('#wbLivePreview .uri-adventure-dialog').innerText(),/Garden Pavilion/);
  await page.locator('#wbLivePreview .uri-adventure-dialog [data-adventure-action="close"]').click();
  await page.locator('#wbLivePreview [data-adventure-action="details"]').click();
  assert.ok(await page.locator('#wbLivePreview .uri-adventure-directory').evaluate(el=>el.open));
  await page.screenshot({path:path.join(screens,'01-adventure-desktop.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Full-page preview/}).click();
  await page.locator('.wf-full-content .uri-adventure-site').waitFor();
  await page.locator('.wf-full-content .uri-adventure-stage canvas').waitFor({timeout:25000});
  await page.getByRole('button',{name:'Mobile'}).click();
  await page.waitForFunction(()=>document.getElementById('wfFullContent')?.style.width==='390px');
  await page.screenshot({path:path.join(screens,'02-adventure-mobile.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Back to editor/}).click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('.wb-editor').waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=4,'Mobile site overflows by '+overflow+' pixels');
  await page.screenshot({path:path.join(screens,'03-adventure-mobile-editor.png'),fullPage:true,animations:'disabled'});
  assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('; '));
  console.log('Adventure Phaser QA passed: controls, player movement, checkpoint details, world manager, keyboard, full and mobile previews.');
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
