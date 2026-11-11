/* Browser QA: playable Adventure Invitation through Phaser and guest-accessible HTML.
 * Installed dependencies in CI: playwright@1.56.1 and phaser@3.90.0.
 */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),screens=path.join(base,'artifacts','adventure-browser');
fs.mkdirSync(screens,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
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
  assert.equal(await page.locator('.uri-adventure-owner-card').count(),8,
    'Only the invitation owner has the eight-character selection panel');
  await page.locator('.uri-adventure-owner-card[data-uri-character="gown"]').click();
  assert.match(await page.locator('.uri-adventure-default-preview').innerText(),/Female in Gown/);
  assert.match(await page.locator('.uri-adventure-default-preview .uri-real-avatar').getAttribute('style'),/gown-idle\.png/);
  await page.locator('.uri-adventure-owner-card[data-uri-character="barong"]').click();
  assert.match(await page.locator('.uri-adventure-default-preview').innerText(),/Male in Barong/);
  assert.match(await page.locator('.uri-adventure-default-preview .uri-real-avatar').getAttribute('style'),/barong-idle\.png/);
  await page.locator('.uri-adventure-owner-card[data-uri-character="floral"]').click();
  await page.locator('.uri-adventure-variant-row button').filter({hasText:'Pastel'}).click();
  assert.equal(await page.locator('.uri-adventure-owner-card[data-uri-character="floral"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('.uri-adventure-default-preview').innerText(),/Floral Traveler/);
  assert.equal(await page.locator('.uri-adventure-owner-card .uri-real-avatar').count(),8,
    'Owner picker uses real PNG portraits for all eight characters');
  await page.locator('.uri-adventure-setting').filter({hasText:'Mobile movement'}).locator('select').selectOption('joystick');
  const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('uri-prototype-v1')).events[0].adventure);
  assert.equal(settings.world,'sunset');
  assert.equal(settings.character,'floral');
  assert.equal(settings.characterVariant,1);
  assert.equal(settings.guestChoice,false);
  assert.equal(settings.touch,'joystick');
  assert.equal(await page.locator('#wbLivePreview .uri-character-select').count(),0,
    'Viewers and previews must not receive the client-only character picker');
  await page.locator('#wbLivePreview [data-adventure-action="play"]').click();
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').waitFor({timeout:25000});
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site').getAttribute('data-adventure-character'),'floral');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site').getAttribute('data-adventure-variant'),'1');
  await page.waitForFunction(()=>!!document.querySelector('#wbLivePreview .uri-adventure-site')?._uriAdventure?.scene?.player,{timeout:15000});
  const art=await page.evaluate(()=>{
   const scene=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene;
   return {role:scene.uriRealCharacter?.name||null,selected:scene.uriRealCharacter?.texture||null,
     animated:!!scene.player.anims?.currentAnim,
     terrain:scene.textures.exists('uri-pf-terrain'),
     checkpoint:scene.textures.exists('uri-wedding-sign-heart-sunset'),
     idle:scene.textures.exists('uri-pf-pink-idle'),
     run:scene.textures.exists('uri-pf-pink-run'),
     jump:scene.textures.exists('uri-pf-pink-jump'),
     sky:scene.textures.exists('uri-artpack-sky-sunset')};
  });
  assert.equal(art.role,'pink','The selected owner avatar uses real authored PNG sprite sheets: '+JSON.stringify(art));
  assert.ok(art.animated&&art.idle&&art.run&&art.jump,'Phaser animates actual PNG sprite frames: '+JSON.stringify(art));
  assert.ok(art.terrain&&art.checkpoint,'The terrain PNG and pixel-heart sign assets load: '+JSON.stringify(art));
  assert.ok(art.sky,'Parallax background remains available');

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
  // Walking is required: map items are status-only, and details have no skip button.
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site dialog').count(),0);
  assert.equal(await page.locator('#wbLivePreview [data-adventure-action="details"]').count(),0);
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-directory').isVisible(),false);
  assert.match(await page.locator('#wbLivePreview .uri-adventure-cover-label').count().then(String),/0/,
    'Dashboard cover elements should never interfere with the playable viewport');
  await page.locator('#wbLivePreview [data-adventure-action="map"]').click();
  await page.locator('#wbLivePreview .uri-adventure-stage[data-interior-type="map"] .uri-adventure-map-list').waitFor({state:'visible'});
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-map-list button').count(),0,
    'Journey map must not provide teleport buttons');
  assert.match(await page.locator('#wbLivePreview .uri-adventure-map-sheet').innerText(),/does not skip ahead/);
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-map-stop[data-visited="true"]').count(),0);
  await page.locator('#wbLivePreview [data-adventure-action="room-exit"]').click();
  await page.evaluate(()=>{
    const root=document.querySelector('#wbLivePreview .uri-adventure-site');
    window.URIAdventure.openStation(root,'rsvp');
  });
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-stage.uri-adventure-inside').count(),0,
    'Guests cannot open the RSVP checkpoint from a distant location');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-tools .uri-adventure-rsvp-link').isVisible(),false,
    'Personal RSVP link is not a shortcut outside its checkpoint');

  // Browser test fast-forwards the physics player to the venue sign, exactly
  // as a guest reaches it by walking; the UI itself has no teleport option.
  await page.evaluate(()=>{
    const scene=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene;
    scene.player.setX(scene.checkpoints.find(x=>x.id==='details').x-30);
    scene.player.setVelocityX(0);
  });
  await page.waitForFunction(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.near==='details');
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').focus();
  await page.keyboard.press('e');
  await page.locator('#wbLivePreview .uri-adventure-stage[data-interior-type="details"] .uri-adventure-room-body').waitFor({state:'visible'});
  assert.match(await page.locator('#wbLivePreview .uri-adventure-room-body').innerText(),/Garden Pavilion/);
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-hud').isVisible(),false,
    'Overworld movement HUD should not clutter an open invitation room');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-room-content > h2').count(),0,
    'In-game rooms should not duplicate their headings');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-room-content .wb-visual-toolbar').count(),0);
  assert.equal(await page.evaluate(()=>{
    const inst=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure;
    return inst.view==='station'&&inst.visited.has('details')&&inst.scene.player.body.allowGravity===false;
  }),true,'Venue is marked visited only after a real in-world proximity interaction');
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
  await page.locator('#wbLivePreview [data-adventure-action="room-exit"]').click();
  await page.evaluate(()=>{
    const scene=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene;
    scene.player.setX(scene.checkpoints.find(x=>x.id==='rsvp').x-30);
    scene.player.setVelocityX(0);
  });
  await page.waitForFunction(()=>document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.near==='rsvp');
  await page.locator('#wbLivePreview .uri-adventure-stage canvas').focus();
  await page.keyboard.press('e');
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp form').waitFor({state:'visible'});
  assert.match(await page.locator('#wbLivePreview .uri-adventure-inline-rsvp').innerText(),/Guest Explorer/);
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp input[value="attending"]').check();
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp button[type="submit"]').click();
  await page.locator('#wbLivePreview .uri-adventure-inline-rsvp .uri-online-status').getByText(/Your RSVP was saved/).waitFor();
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-site dialog').count(),0);
  await page.locator('#wbLivePreview [data-adventure-action="room-exit"]').click();
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-interior').evaluate(el=>el.hidden),true,
    'Back to world closes the in-game room, without navigating away');
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-hud').isVisible(),true,
    'Returning to the world restores its HUD and controls');
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
  // Wait for actual progress instead of assuming a fixed number of rendered
  // frames in 550ms: the shared CI software renderer can be much slower than
  // a normal device after the venue screenshot and mock online RSVP.
  await page.keyboard.down('ArrowLeft');
  let moved=false;
  try{
    await page.waitForFunction(x=>{
      const s=document.querySelector('#wbLivePreview .uri-adventure-site')?._uriAdventure?.scene;
      return s?.player?.x < x-12;
    },restartX,{timeout:8000,polling:100});
    moved=true;
  }catch(_){}
  finally{await page.keyboard.up('ArrowLeft')}
  if(!moved){
    const diagnostic=await page.evaluate(()=>{
      const i=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure,s=i.scene;
      return {x:s.player.x,velocity:s.player.body.velocity.x,frame:s.game.loop.frame,
        active:s.scene.isActive(),view:i.view,errors:[]};
    });
    console.log('Room exit movement diagnostics',JSON.stringify({restartX,diagnostic,errors}));
  }
  assert.ok(moved,'The character must respond to ArrowLeft again after exiting the in-game room');
  assert.equal(await page.locator('#wbLivePreview [data-adventure-action="details"]').count(),0);
  assert.equal(await page.locator('#wbLivePreview .uri-adventure-directory').isVisible(),false);
  await page.screenshot({path:path.join(screens,'01-adventure-desktop.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Full-page preview/}).click();
  await page.locator('.wf-full-content .uri-adventure-site').waitFor();
  assert.equal(await page.locator('.wf-full-content .uri-character-select').count(),0,
    'Published invitation preview never exposes a character-selection screen');
  await page.locator('.wf-full-content .uri-adventure-stage canvas').waitFor({timeout:25000});
  assert.equal(await page.locator('.wf-full-content .uri-adventure-site').getAttribute('data-adventure-character'),'floral');

  await page.getByRole('button',{name:'Mobile'}).click();
  await page.waitForFunction(()=>document.getElementById('wfFullContent')?.style.width==='390px');
  await page.locator('.wf-full-content .uri-adventure-joystick').waitFor({state:'visible'});
  await page.waitForFunction(()=>{
   const root=document.querySelector('.wf-full-content .uri-adventure-site'),stage=root?.querySelector('.uri-adventure-stage');
   if(!root||!stage)return false;
   const ratio=stage.getBoundingClientRect().width/stage.getBoundingClientRect().height;
   return Math.abs(ratio-1.5)<.04&&root._uriAdventure?.viewportWidth===720;
  },{timeout:10000});
  assert.equal(await page.locator('.wf-full-content .uri-adventure-mobile-hint').count(),1,
    'Mobile players see touch instructions instead of desktop keyboard instructions');
  // Verify Phaser and the CSS container query agree at narrow/boundary widths.
  for(const width of [320,375,390,430,680,705,735]){
   await page.evaluate(w=>{document.getElementById('wfFullContent').style.width=w+'px'},width);
   await page.waitForFunction(()=>{
    const root=document.querySelector('.wf-full-content .uri-adventure-site'),stage=root?.querySelector('.uri-adventure-stage');
    if(!stage||!root?._uriAdventure?.game)return false;
    const expected=root.clientWidth<=690?720:960;
    const ratio=stage.getBoundingClientRect().width/stage.getBoundingClientRect().height;
    return root._uriAdventure.viewportWidth===expected&&Math.abs(ratio-expected/480)<.05;
   },undefined,{timeout:10000});
   const dimensions=await page.evaluate(()=>{
    const root=document.querySelector('.wf-full-content .uri-adventure-site');
    const buttons=[...root.querySelectorAll('.uri-adventure-controls button')];
    return {width:root.clientWidth,overflow:root.scrollWidth-root.clientWidth,
     controls:buttons.map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))};
   });
   assert.ok(dimensions.overflow<=5,'Horizontal overflow at '+width+'px: '+JSON.stringify(dimensions));
   assert.ok(dimensions.controls.every(b=>b.width>=42&&b.height>=48),
    'Controls too small at '+width+'px: '+JSON.stringify(dimensions));
  }
  await page.evaluate(()=>{document.getElementById('wfFullContent').style.width='390px'});
  await page.waitForFunction(()=>document.querySelector('.wf-full-content .uri-adventure-site')?._uriAdventure?.viewportWidth===720);

  // Releasing a finger OUTSIDE the joystick must immediately clear direction
  // even in iOS/Facebook in-app browsers where pointer capture is unreliable.
  await page.locator('.wf-full-content .uri-adventure-joystick').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,pointerId:971,pointerType:'touch',
    clientX:r.right-7,clientY:r.top+r.height/2,button:0,buttons:1
   }));
  });
  await page.waitForFunction(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls.right===true);
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{
   bubbles:true,cancelable:true,pointerId:971,pointerType:'touch',buttons:0
  })));
  await page.waitForFunction(()=>{
   const i=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure;
   return !i.controls.left&&!i.controls.right&&i.scene?.player?.body?.velocity.x===0;
  });
  const stoppedAt=await page.evaluate(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.scene.player.x);
  await page.waitForTimeout(180);
  const stoppedAfter=await page.evaluate(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.scene.player.x);
  assert.ok(Math.abs(stoppedAfter-stoppedAt)<3,'Player must stop after pointer release anywhere on the screen');
  // Two-finger movement + Jump: lifting Jump must not stop the held joystick.
  await page.locator('.wf-full-content .uri-adventure-joystick').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,
    pointerId:981,pointerType:'touch',clientX:r.right-6,clientY:r.top+r.height/2,button:0,buttons:1}));
  });
  await page.locator('.wf-full-content [data-adventure-control="jump"]').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,
    pointerId:982,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0,buttons:1}));
  });
  assert.equal(await page.evaluate(()=>{
   const c=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls;
   return c.right&&c.jump;
  }),true,'Two-finger movement and jump register together');
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{
   bubbles:true,cancelable:true,pointerId:982,pointerType:'touch',buttons:0
  })));
  assert.equal(await page.evaluate(()=>{
   const c=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls;
   return c.right&&!c.jump;
  }),true,'Releasing Jump preserves the held joystick');
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{
   bubbles:true,cancelable:true,pointerId:981,pointerType:'touch',buttons:0
  })));
  await page.waitForFunction(()=>{
   const i=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure;
   return !i.controls.left&&!i.controls.right&&i.scene.player.body.velocity.x===0;
  },undefined,{timeout:5000});
  await page.locator('.wf-full-content .uri-adventure-joystick').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,
    pointerId:983,pointerType:'touch',clientX:r.left+6,clientY:r.top+r.height/2,button:0,buttons:1}));
  });
  await page.evaluate(()=>window.dispatchEvent(new Event('orientationchange')));
  assert.equal(await page.evaluate(()=>{
   const c=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls;
   return !c.left&&!c.right&&!c.jump;
  }),true,'Orientation change releases touch movement');

  // A second gesture that is cancelled by the browser must also stop walking.
  await page.locator('.wf-full-content .uri-adventure-joystick').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,pointerId:972,pointerType:'touch',
    clientX:r.left+6,clientY:r.top+r.height/2,button:0,buttons:1
   }));
  });
  await page.waitForFunction(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls.left===true);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(()=>{
   const i=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure;
   return !i.controls.left&&!i.controls.right&&i.scene?.player?.body?.velocity.x===0;
  });
  await page.screenshot({path:path.join(screens,'02-adventure-mobile.png'),fullPage:true,animations:'disabled'});
  await page.locator('.wf-full-content [data-adventure-action="map"]').click();
  await page.locator('.wf-full-content .uri-adventure-stage.uri-adventure-inside .uri-adventure-map-list').waitFor({state:'visible'});
  assert.equal(await page.locator('.wf-full-content .uri-adventure-map-list button').count(),0);
  await page.locator('.wf-full-content [data-adventure-action="room-exit"]').click();
  await page.evaluate(()=>{
   const scene=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.scene;
   scene.player.setX(scene.checkpoints.find(x=>x.id==='story').x-30);
  });
  await page.waitForFunction(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.near==='story');
  await page.locator('.wf-full-content [data-adventure-action="interact"]').click();
  await page.locator('.wf-full-content .uri-adventure-stage[data-interior-type="story"] .uri-adventure-room-body').waitFor({state:'visible'});
  assert.match(await page.locator('.wf-full-content .uri-adventure-room-body').innerText(),/Our own adventure/);
  assert.equal(await page.locator('.wf-full-content .uri-adventure-room-content h2').filter({hasText:'Our Story'}).count(),0,
    'The story room has one scene title, not an extra duplicated content heading');
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
  // Test default left/right button controls separately from virtual joystick.
  await page.locator('.uri-adventure-setting').filter({hasText:'Mobile movement'}).locator('select').selectOption('buttons');
  await page.getByRole('button',{name:/Full-page preview|Preview website/}).first().click();
  await page.locator('.wf-full-content .uri-adventure-site').waitFor();
  await page.waitForFunction(()=>{
    const p=document.getElementById('wfFullContent');
    return p?.style.transform==='scale(1)';
  },{timeout:10000});
  const mobileDefault=await page.evaluate(()=>{
    const c=document.getElementById('wfFullCanvas'),p=document.getElementById('wfFullContent');
    return {mode:c?.dataset.mode,preview:p?.getBoundingClientRect().width,
      available:c?.getBoundingClientRect().width,scale:p?.style.transform};
  });
  assert.equal(mobileDefault.mode,'mobile','Phone opens the real mobile preview by default');
  assert.equal(mobileDefault.scale,'scale(1)','Mobile preview renders at native size, not 33%');
  assert.ok(mobileDefault.preview<=mobileDefault.available+1,'Mobile preview fits the phone without horizontal scrolling');
  await page.locator('.wf-full-content [data-adventure-control="right"]').waitFor({state:'visible'});
  await page.locator('.wf-full-content [data-adventure-control="right"]').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,pointerId:973,pointerType:'touch',
    clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0,buttons:1
   }));
  });
  await page.waitForFunction(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls.right===true);
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{
   bubbles:true,cancelable:true,pointerId:973,pointerType:'touch',buttons:0
  })));
  await page.waitForFunction(()=>{
   const i=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure;
   return i.controls.right===false&&i.scene?.player?.body?.velocity.x===0;
  });
  await page.locator('.wf-full-content [data-adventure-control="left"]').evaluate(el=>{
   const r=el.getBoundingClientRect();
   el.dispatchEvent(new PointerEvent('pointerdown',{
    bubbles:true,cancelable:true,pointerId:974,pointerType:'touch',
    clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0,buttons:1
   }));
  });
  await page.waitForFunction(()=>document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure.controls.left===true);
  await page.evaluate(()=>window.dispatchEvent(new Event('touchcancel')));
  await page.waitForFunction(()=>{
   const i=document.querySelector('.wf-full-content .uri-adventure-site')._uriAdventure;
   return !i.controls.left&&!i.controls.right&&i.scene?.player?.body?.velocity.x===0;
  });

  await page.getByRole('button',{name:/Back to editor/}).click();
  await page.locator('.wb-editor').waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=4,'Mobile site overflows by '+overflow+' pixels');
  await page.screenshot({path:path.join(screens,'03-adventure-mobile-editor.png'),fullPage:true,animations:'disabled'});
  // Both new characters must actually play in Phaser, not merely appear
  // in the client's editor. Each has independent transparent PNG animations.
  for(const role of ['gown','barong']){
   const characterPage=await context.newPage();
   characterPage.on('pageerror',err=>errors.push(err.message));
   try{
    await characterPage.goto(url,{waitUntil:'domcontentloaded'});
    await characterPage.evaluate(role=>{
     const invitation={...defaults(),id:'custom-'+role,type:'Wedding',template:'adventure',
      name1:'Maya',name2:'Emir',date:'2032-09-18',time:'16:00',venue:'Garden Pavilion',
      adventure:{world:'meadow',character:role,characterVariant:0,touch:'buttons'}};
     state.events=[invitation];state.current=invitation.id;tab='edit';save();location.hash='#event';render();
    },role);
    await characterPage.locator('#wbLivePreview .uri-adventure-site').waitFor();
    await characterPage.locator('#wbLivePreview [data-adventure-action="play"]').click();
    await characterPage.waitForFunction(role=>{
     const scene=document.querySelector('#wbLivePreview .uri-adventure-site')?._uriAdventure?.scene;
     return scene?.uriRealCharacter?.name===role&&scene?.player?.anims?.currentAnim;
    },role,{timeout:20000});
    const actual=await characterPage.evaluate(()=>{
     const scene=document.querySelector('#wbLivePreview .uri-adventure-site')._uriAdventure.scene;
     return {role:scene.uriRealCharacter?.name,texture:scene.player.texture.key,
      idle:scene.textures.get('uri-pf-'+scene.uriRealCharacter.name+'-idle').frameTotal,
      run:scene.textures.get('uri-pf-'+scene.uriRealCharacter.name+'-run').frameTotal};
    });
    assert.equal(actual.role,role,'New character must be selected and animated in Phaser');
    assert.ok(actual.texture.startsWith('uri-pf-'+role+'-'),
      'Phaser is showing the selected character animation, not a placeholder: '+actual.texture);
    assert.ok(actual.idle>=4&&actual.run>=6,'New character has distinct idle and running frames');
    await characterPage.locator('#wbLivePreview .uri-adventure-stage').screenshot({
     path:path.join(screens,'04-'+role+'-playable.png'),animations:'disabled'
    });
   }finally{await characterPage.close()}
  }
  assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('; '));
  console.log('Adventure Phaser pixel QA passed: owner-only avatar selection, saved costume, playable movement, in-game rooms, inline RSVP, mobile controls and world resuming.');
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);process.exitCode=1;server.close()});
