/* Fast URI public username and pretty-route checks with no browser or network. */
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const origin='https://mawruemdota.github.io';
const event={id:'test1',name1:'Maya',name2:'Emir'};
const win={
 URI_CLOUD_CONFIG:{},
 URIBuilder:{payload:()=>({name1:'Maya',name2:'Emir'}),persist:()=>true},
 addEventListener(){},
 uriCloudOpenPublished(v){this.opened=v}
};
const sandbox={
 window:win,document:{currentScript:{src:origin+'/URI/cloud.js'}},
 location:{origin,pathname:'/URI/',href:origin+'/URI/',hash:'',search:''},
 URL,esc:v=>String(v),current:()=>event,app:{innerHTML:''},
 render(){},setTimeout(){},console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('cloud.js','utf8'),sandbox,{filename:'cloud.js'});
assert.equal(win.URICloud.publicLink('maya-and-emir'),origin+'/URI/maya-and-emir');
assert.equal(win.URICloud.draftUsername(event),'maya-and-emir');
assert.equal(win.URICloud.isValidUsername('maya-and-emir'),true);
for(const name of ['home','rsvp','admin','my--event','A-bad','a','-starts','ends-'])
 assert.equal(win.URICloud.isValidUsername(name),false,name+' must be rejected');
vm.runInContext('uriCloudUsernameChanged("maya-and-emir-2027")',sandbox);
assert.equal(event.publicUsername,'maya-and-emir-2027');
assert.equal(win.URICloud.publicationState(event),'draft');
event.cloudSlug='maya-and-emir';event.cloudPublished=true;
assert.equal(win.URICloud.publicationState(event),'changed');
const published=[];
const publicWin={uriCloudOpenPublished:value=>published.push(value),addEventListener(){}};
const publicSandbox={
 window:publicWin,
 document:{currentScript:{src:origin+'/URI/public-routes.js'}},
 location:{origin,pathname:'/URI/maya-and-emir',hash:'',search:'?rsvp=token',href:origin+'/URI/maya-and-emir?rsvp=token',replace(){}},
 URL,render(){published.push('old')}
};
vm.createContext(publicSandbox);
vm.runInContext(fs.readFileSync('public-routes.js','utf8'),publicSandbox,{filename:'public-routes.js'});
assert.equal(publicWin.URI_PUBLIC_ROUTE,'maya-and-emir');
assert.deepEqual(published,['maya-and-emir?rsvp=token']);
const fallback=fs.readFileSync('404.html','utf8');
assert.ok(fallback.includes('document.write')&&fallback.includes('index.html'),'GitHub Pages fallback must load index');
assert.ok(fs.readFileSync('supabase/schema.sql','utf8').includes('uri_pub_slug_format'),'Database rule must be documented');
console.log('Public username smoke checks passed: canonical links, validation, persistence, rename state, direct path and query token.');
