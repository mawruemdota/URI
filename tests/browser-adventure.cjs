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
  assert.equal(await page.locator('.wb-template-pick').count(),4,'All four wedding templates must appear in the editor');
  assert.equal(await page.locator('.wb-template-pick.selected').count(),1,'Adventure is the active design');
  assert.match(await page.locator('.uri-adventure-stations').innerText(),/Welcome/);
  assert.match(await page.locator('.uri-adventure-stations').innerText(),/RSVP/);
  await page.locator('.uri-adventure-setting select').first().selectOption('sunset');
  await page.locator('#wbLivePreview [data-adventure-world="sunset"]').waitFor();
  await page.locator('.uri-adventure-setting select').nth(1).selectOption('dreamer');
  await page.locator('.uri-adventure-setting').filter({hasText:'Mobile movement'}).locator('select').selectOption('joystick');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-joystick').count(),1,'Mobile joystick option is rendered in the editor preview');
  const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('uri-prototype-v1')).events[0].adventure);
  assert.equal(settings.world,'sunset');
  assert.equal(settings.character,'dreamer');
  assert.equal(settings.touch,'joystick');
  await page.locator('#wbLivePreview [data-adventure-action="play"]').click();
  await page.locator('#wbLivePreview .uri-character-select').waitFor({state:'visible'});
  assert.equal(await page.locator('#wbLivePreview .uri-char-card').count(),6,'Six pixel-art characters are selectable');
  assert.equal(await page.locator('#wbLivePreview .uri-char-card .uri-pixel-avatar-svg').count(),6,'Character images render as functional vector pixel sprites');
  await page.screenshot({path:path.join(screens,'00-character-select-desktop.png'),fullPage:true,animations:'disabled'});
  await page.locator('#wbLivePreview [data-adventure-role="floral"]').click();
  assert.equal(await page.locator('#wbLivePreview [data-adventure-role="floral"]').getAttribute('aria-pressed'),'true');
  await page.locator('#wbLivePreview [data-adventure-action="variant-next"]').click();
  await page.locator('#wbLivePreview [data-adventure-action="confirm-character"]').click();
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').waitFor({timeout:25000});
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site').getAttribute('data-adventure-character'),'floral');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site').getAttribute('data-adventure-variant'),'1');
  await page.waitForFunction(()=>!!document.querySelector('#wbLivePreview .uri-adventure-site')?._uriAdventure?.scene?.player,{timeout:15000});
  try{
    await page.waitForFunction(()=>!document.querySelector('#wbLivePreview .uri-adventure-load'),{timeout:8000});
  }catch(err){
    console.log('Adventure Phaser initialization errors:',errors);
    console.log('Adventure stage:',await page.locator('#wbLivePreview .uri-adventure-stage').innerText());
    throw err;
  }
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').click({position:{x:120,y:110}});
  const posBefore=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(750);
  await page.keyboard.up('ArrowRight');
  const posAfter=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  if(!(posAfter>posBefore+40))console.log('Adventure movement diagnostics',await page.evaluate(()=>{
    const s=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene;
    return {active:s.scene.isActive(),paused:s.scene.isPaused(),gameFrame:s.game.loop.frame,velocity:s.player.body.velocity.x,focus:document.activeElement?.tagName,
      keyboard:s.input.keyboard?.enabled,keys:Object.fromEntries(Object.entries(s.keys||{}).map(([k,v])=>[k,!!v?.isDown]))};
  }));
  assert.ok(posAfter>posBefore+40,'Keyboard input moves the Phaser player: '+posBefore+' => '+posAfter);
  // The map and every checkpoint must be INSIDE the Phaser viewport, with no dialog.
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site dialog').count(),0,
    'Checkpoint experience must not use popups or modal dialogs');
  await page.locator('#wbLivePreview [data-adventure-action="map"]').click();
  await page.locator('#wbLivePreview .uri-adventure-stage.uri-adventure-inside[data-interior-type="map"] .uri-adventure-map-list').waitFor({state:'visible'});
  await page.locator('#wbLivePreview .uri-adventure-room-body [data-adventure-station="details"]').click();
  await page.locator('#wbLivePreview .uri-adventure-stage.uri-adventure-inside[data-interior-type="details"] .uri-adventure-room-body').waitFor({state:'visible'});
  assert.match(await page.locator('#wbLivePreview .uri-adventure-room-body').innerText(),/Garden Pavilion/);
  assert.equal(await page.evaluate(()=>{
    const inst=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure;
    return inst.view==='station'&&inst.scene.player.body.allowGravity===false&&inst.scene.scene.isActive();
  }),true,'Player controls and gravity are safely frozen inside a room, while the Phaser scene continues');
  await page.locator('#wbLivePreview .uri-adventure-stage').screenshot({path:path.join(screens,'01b-in-game-venue.png'),animations:'disabled'});
  // Checkpoint navigation stays inside the stage; even personalized RSVP is inline.
  const token='a'.repeat(64);
  await page.evaluate(t=>{
    const root=document.querySelector('#wbLivePreview .uri-adventure-site'),link=root.querySelector('.uri-adventure-rsvp-link');
    link.href='#rsvp/'+t;link.hidden=false;
    window.URICloud={client:()=>({rpc:async(name,args)=>{
      if(name==='uri_rsvp_lookup')return {data:{name:'Guest Explorer',eventName:'Maya & Emir',date:'2032-09-18',
        venue:'Garden Pavilion',status:'pending',plusOnesAllowed:1,plusOnesConfirmed:0,
        answers:{},questions:[]},error:null};
      if(name==='uri_rsvp_respond')return {data:{plusOnesConfirmed:args.p_plus_ones},error:null};
      return {data:null,error:{message:'Unknown RPC'}};
    }})};
  },token);
  await page.locator('#wbLivePreview [data-adventure-action="room-map"]').click();
  await page.locator('#wbLivePreview .uri-adventure-room-body [data-adventure-station="rsvp"]').click();
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp form').waitFor({state:'visible'});
  assert.match(await page.locator('#wbLivePreview .uri-adventure-inline-rsvp').innerText(),/Guest Explorer/);
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp input[value="attending"]').check();
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp button[type="submit"]').click();
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp .uri-online-status').getByText(/Your RSVP was saved/).waitFor();
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site dialog').count(),0);
  await page.locator('#wbLivePreview [data-adventure-action="room-exit"]').click();
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-interior').evaluate(el=>el.hidden),true,
    'Back to world closes the in-game room, without navigating away');
  await page.waitForFunction(()=>{
    const inst=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure;
    return inst.view==='world'&&inst.scene.player.body.allowGravity&&inst.scene.scene.isActive();
  },{timeout:5000});
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{
   const game=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.game;
   return game&&game.loop.running&&!game.isPaused;
  },{timeout:5000});
  await page.waitForTimeout(120);
  const restartX=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(550);
  const whileHeld=await page.evaluate(()=>{
   const inst=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure,s=inst.scene;
   return {x:s.player.x,bodyX:s.player.body.position.x,velocityX:s.player.body.velocity.x,
    paused:s.scene.isPaused(),active:s.scene.isActive(),leftDown:s.keys.LEFT.isDown,
    leftEnabled:s.keys.LEFT.enabled,keyboardEnabled:s.input.keyboard.enabled,
    canvasFocused:document.activeElement===inst.game.canvas,activeTag:document.activeElement?.tagName,
    frame:s.game.loop.frame,gameRunning:s.game.loop.running,gamePaused:s.game.isPaused,
    physicsPaused:s.physics.world.isPaused,view:inst.view,documentVisibility:document.visibilityState,near:inst.near};
  });
  await page.keyboard.up('ArrowLeft');
  const afterRestartX=await page.evaluate(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene.player.x);
  if(!(afterRestartX<restartX-20))console.log('Room exit movement diagnostics',JSON.stringify({restartX,afterRestartX,whileHeld,errors}));
  assert.ok(afterRestartX<restartX-20,'The character can move again after exiting the in-game room');
  await page.locator('#wbLivePreview [data-adventure-action="details"]').click();
  assert.ok(await page.locator('#wbLivePreview .uri-adventure-directory').evaluate(el=>el.open));
  await page.screenshot({path:path.join(screens,'01-adventure-desktop.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Full-page preview/}).click();
  await page.locator('.wf-full-content .uri-adventure-site').waitFor();
  await page.locator('.wf-full-content .uri-character-select').waitFor({state:'visible'});
  await page.locator('.wf-full-content [data-adventure-role="explorer"]').click();
  await page.locator('.wf-full-content [data-adventure-action="confirm-character"]').click();
  await page.locator('.wf-full-content .uri-adventure-stage canvas').waitFor({timeout:25000});
  await page.getByRole('button',{name:'Mobile'}).click();
  await page.waitForFunction(()=>document.getElementById('wfFullContent')?.style.width==='390px');
  await page.locator('.wf-full-content .uri-adventure-joystick').waitFor({state:'visible'});
  await page.screenshot({path:path.join(screens,'02-adventure-mobile.png'),fullPage:true,animations:'disabled'});
  await page.locator('.wf-full-content [data-adventure-action="map"]').click();
  await page.locator('.wf-full-content .uri-adventure-stage.uri-adventure-inside .uri-adventure-map-list').waitFor({state:'visible'});
  await page.locator('.wf-full-content .uri-adventure-room-body [data-adventure-station="story"]').click();
  await page.locator('.wf-full-content .uri-adventure-stage[data-interior-type="story"] .uri-adventure-room-body').waitFor({state:'visible'});
  assert.match(await page.locator('.wf-full-content .uri-adventure-room-body').innerText(),/Our own adventure/);
  const legible=await page.evaluate(()=>{
    const room=document.querySelector('.wf-full-content .uri-adventure-room-body');
    const paragraph=room?.querySelector('.wb-botanical-story p');
    const decoration=room?.querySelector('.wb-botanical-art');
    if(!room||!paragraph)return false;
    const a=paragraph.getBoundingClientRect(),b=room.getBoundingClientRect();
    return (!decoration||getComputedStyle(decoration).display==='none')&&
      a.height>0&&a.top>=b.top&&a.top<b.bottom;
  });
  assert.ok(legible,'Mobile story text must appear immediately within the game room, without oversized decorations');
  await page.screenshot({path:path.join(screens,'02b-in-game-story-mobile.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Back to editor/}).click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('.wb-editor').waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=4,'Mobile site overflows by '+overflow+' pixels');
  await page.screenshot({path:path.join(screens,'03-adventure-mobile-editor.png'),fullPage:true,animations:'disabled'});
  assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('; '));
  console.log('Adventure Phaser pixel QA passed: six avatar choices, color variations, playable movement, in-game rooms, inline RSVP, mobile controls and world resuming.');
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
