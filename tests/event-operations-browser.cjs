/* Browser smoke for URI's seven operational features; no live accounts or real database writes. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/event-operations');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/URI\/?/,'').replace(/^\/+/,'')||'index.html';
 const file=path.resolve(root,p);
 if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html')){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,b)=>{if(err){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':mime[path.extname(file)]||'text/plain'});res.end(b)});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const view of [{name:'desktop',width:1280,height:900},{name:'mobile',width:390,height:844}]){
   const context=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:1});
   await context.route('**/cloud-config.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.URI_CLOUD_CONFIG={url:"",publishableKey:""};'}));
   await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:
     'window.QRCode=class QRCode{constructor(el){const c=document.createElement("canvas");c.width=256;c.height=256;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,256,256);x.fillStyle="#000";x.fillRect(30,30,190,190);el.append(c)}};window.QRCode.CorrectLevel={M:1};'}));
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/URI/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>Boolean(window.URIShare&&window.URIEventOps&&window.URIStylePacks),null,{timeout:12000});
   await page.evaluate(()=>{
    const e={...defaults(),id:'ops-e1',type:'Wedding',template:'classic',name1:'Maya',name2:'Emir',
      date:'2032-09-18',time:'16:00',venue:'Garden Pavilion',address:'Cavite',guests:[
      {id:'g1',name:'Anna',status:'attending',plusOnesConfirmed:1,plusOnesAllowed:1,answers:{}},
      {id:'g2',name:'Ben',status:'pending',plusOnesConfirmed:0,plusOnesAllowed:0,answers:{}}
      ],households:[],rsvpSettings:{capacity:10,questions:[]}};
    state.events=[e];state.current=e.id;tab='operations';save();eventPage();
   });
   assert.equal(await page.locator('[data-uri-ops-tab]').count(),1);
   assert.match(await page.locator('.uri-ops-main').innerText(),/Event operations/);
   assert.match(await page.locator('.uri-ops-main').innerText(),/QR guest check-in/);
   assert.match(await page.locator('.uri-ops-main').innerText(),/Collaborators/);
   assert.match(await page.locator('.uri-ops-main').innerText(),/Invitation Sharing 2.0/);
   await page.locator('.uri-ops-main').screenshot({path:path.join(out,'operations-'+view.name+'.png'),animations:'disabled'});
   await page.evaluate(()=>{current().cloudPublished=true;current().cloudSlug='maya-and-emir'});
   const canvas=await page.evaluate(async()=>{
    const e=current(),a=await window.URIShare.card(e,'portrait'),b=await window.URIShare.card(e,'square'),c=await window.URIShare.card(e,'story');
    return [a.width,a.height,b.width,b.height,c.width,c.height,a.toDataURL('image/png').startsWith('data:image/png;base64,')];
   });
   assert.deepEqual(canvas,[1080,1350,1080,1080,1080,1920,true],'Three genuine browser PNG formats');
   await page.evaluate(()=>{tab='guests';eventPage()});
   await page.locator('#uriGuestProgress').waitFor();
   await page.getByRole('button',{name:'Mark sent'}).first().click();
   assert.equal(await page.evaluate(()=>Boolean(current().guests[0].inviteSentAt)),true);
   await page.evaluate(()=>{tab='edit';eventPage();window.uriBPanel?.('design')});
   await page.locator('.uri-style-choice').first().waitFor();
   assert.equal(await page.locator('.uri-style-choice').count(),6);
   await page.getByRole('button',{name:/Sage Garden/}).click();
   assert.equal(await page.evaluate(()=>current().designByTemplate.classic.bg),'#eef1e5');
   assert.equal(await page.evaluate(()=>current().name1),'Maya');
   await page.evaluate(()=>{tab='share';eventPage()});
   assert.match(await page.locator('body').innerText(),/Copy rich-preview link/);
   const actualWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert.ok(actualWidth<=view.width+4,'No horizontal overflow at '+view.name+': '+actualWidth);
   assert.deepEqual(errors,[],view.name+' browser errors: '+errors.join('; '));
   await page.screenshot({path:path.join(out,'sharing-'+view.name+'.png'),fullPage:true,animations:'disabled'});
   console.log('Event operations '+view.name+' passed: PNG export, dashboard, guest delivery, style directions and responsive layout.');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
