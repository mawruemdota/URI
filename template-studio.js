/* URI Template Studio — import design tokens, create and reuse themed recipes.
 * Actual external website extraction is done through MiroMiro, not through a
 * client-side cross-origin fetch. Each recipe is a safe variation of a built-in
 * responsive structure, not a copied page/source. */
(function(){
'use strict';
const U=window.URIBuilder,T=v=>esc(v==null?'':String(v)),KEY='uri-template-recipes-v1';
const bases=[['classic','Romantic Botanical'],['garden','Minimalist Editorial'],['nightfall','Nightfall']];
const palette=['bg','ink','accent'];
const hex=v=>/^#[0-9a-fA-F]{6}$/.test(String(v||''))?String(v).toLowerCase():'';
const goodUrl=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u.toString():''}catch(_){return ''}};
const uuid=()=> 'tpl-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
let library=[];
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))library=raw.slice(0,24).map(sanitize).filter(Boolean)}catch(_){}
function sanitize(x){
 if(!x||typeof x!=='object'||!Object.hasOwn(U.presets,x.base))return null;
 const id=/^tpl-[a-z0-9-]{3,35}$/i.test(String(x.id||''))?String(x.id):uuid();
 const p=U.presets[x.base],s=x.style&&typeof x.style==='object'?x.style:{};
 return {id,name:String(x.name||'Custom Design').trim().slice(0,60)||'Custom Design',base:x.base,
   sourceUrl:goodUrl(x.sourceUrl),notes:String(x.notes||'').slice(0,300),
   style:{bg:hex(s.bg)||p.bg,ink:hex(s.ink)||p.ink,accent:hex(s.accent)||p.accent,
     heading:U.fonts[s.heading]?s.heading:p.heading,
     body:U.fonts[s.body]?s.body:p.body,
     spacing:['compact','balanced','airy'].includes(s.spacing)?s.spacing:p.spacing}};
}
const saved=e=>Array.isArray(e.templateRecipes)?e.templateRecipes.map(sanitize).filter(Boolean):[];
function list(e){
 const current=saved(e);
 const recipes=[...current,...library.filter(x=>!current.some(y=>y.id===x.id))];
 return [...bases.map(([id,name])=>({id,name})),...recipes.map(x=>({id:x.id,name:x.name,base:x.base,sourceUrl:x.sourceUrl}))];
}
function edit(action){
 const e=current();if(e?.type!=='Wedding')return false;
 U.model(e);
 const old={recipes:JSON.stringify(e.templateRecipes),template:e.template};
 action(e);
 if(U.persist()){eventPage();return true}
 e.templateRecipes=JSON.parse(old.recipes);e.template=old.template;eventPage();return false;
}
function pickColor(tokens,names){
 if(!tokens||typeof tokens!=='object')return '';
 for(const name of names){
  const candidate=tokens[name];
  if(typeof candidate==='string'&&hex(candidate))return hex(candidate);
  if(candidate&&typeof candidate==='object'){
   if(hex(candidate.hex))return hex(candidate.hex);
   if(hex(candidate.value))return hex(candidate.value);
  }
 }
 return '';
}
function parseTokens(raw,base){
 const preset=U.presets[base]||U.presets.classic;
 const fallback={...preset};
 if(!String(raw||'').trim())return fallback;
 const txt=String(raw).trim();
 if(txt.length>20000)throw Error('Token file is too large.');
 let data;
 try{data=JSON.parse(txt)}catch(_){
  // Accept CSS custom properties, but never use the CSS as a stylesheet.
  const get=key=>{
    const re=new RegExp('--(?:'+key+')\\s*:\\s*(#[0-9a-fA-F]{6})(?:\\s|;|$)','i');
    return txt.match(re)?.[1]||'';
  };
  const b=get('background|bg|surface'),i=get('text|ink|foreground'),a=get('accent|primary');
  if(!b&&!i&&!a)throw Error('Paste JSON tokens or CSS variables with hex colors.');
  return {...fallback,bg:b||fallback.bg,ink:i||fallback.ink,accent:a||fallback.accent};
 }
 if(typeof data!=='object'||!data)throw Error('Invalid token file.');
 const roles=data.role_colors||data.roleColors||data.colors_by_role||data.theme||data.tokens||data;
 const colors=roles.colors||roles.palette||roles;
 const source={...colors,...data};
 const bg=pickColor(source,['background','bg','backgroundColor','surface','background_color'])||preset.bg;
 const ink=pickColor(source,['text','ink','foreground','textColor','text_color'])||preset.ink;
 const accent=pickColor(source,['accent','primary','highlight','accentColor','accent_color'])||preset.accent;
 const fonts=data.fonts||roles.fonts||{};
 const fontString=String(fonts.heading?.family||fonts.heading||fonts.display?.family||fonts.display||'').toLowerCase();
 const bodyString=String(fonts.body?.family||fonts.body||'').toLowerCase();
 const fontId=str=>str.includes('barlow')?'barlow':str.includes('montserrat')?'montserrat':str.includes('cormorant')?'cormorant':str.includes('playfair')?'playfair':str.includes('allura')?'allura':str.includes('dm sans')?'dm':null;
 return {...fallback,bg,ink,accent,heading:fontId(fontString)||preset.heading,body:fontId(bodyString)||preset.body};
}
function saveLibrary(recipe){
 const next=[recipe,...library.filter(x=>x.id!==recipe.id)].slice(0,24);
 try{localStorage.setItem(KEY,JSON.stringify(next));library=next;return true}catch(_){return false}
}
window.uriTemplateStudioApply=id=>{
 const e=current();if(!e)return;
 if(U.presets[id]){window.uriBTemplate?.(id);return}
 const recipe=saved(e).find(x=>x.id===id)||library.find(x=>x.id===id);
 if(!recipe)return;
 edit(e=>{
  if(!e.templateRecipes.some(x=>x.id===id))e.templateRecipes.push(recipe);
  e.template=id;
 });
};
window.uriTemplateStudioCreate=ev=>{
 ev.preventDefault();
 const data=new FormData(ev.target),base=String(data.get('base')||'classic');
 if(!Object.hasOwn(U.presets,base))return;
 const name=String(data.get('name')||'').trim().slice(0,60);
 if(!name){alert('Choose a name for your design.');return}
 let style;
 try{style=parseTokens(data.get('tokens'),base)}catch(err){alert(err.message);return}
 const recipe=sanitize({id:uuid(),name,base,style,sourceUrl:String(data.get('source')||''),notes:String(data.get('notes')||'')});
 if(!recipe)return;
 if(current()?.templateRecipes?.length>=16){alert('This invitation already has 16 designs.');return}
 if(edit(e=>{e.templateRecipes.push(recipe);e.template=recipe.id}))saveLibrary(recipe);
};
window.uriTemplateStudioExport=id=>{
 const e=current(),recipe=saved(e||{}).find(x=>x.id===id)||library.find(x=>x.id===id);
 if(!recipe)return;
 const blob=new Blob([JSON.stringify({schema:'uri-template-recipe-v1',recipe},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='uri-'+recipe.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
};
window.uriTemplateStudioImport=async ev=>{
 const file=ev.target?.files?.[0];if(!file)return;
 try{
  if(file.size>30000)throw Error('Recipe must be smaller than 30 KB.');
  const data=JSON.parse(await file.text());
  if(data.schema!=='uri-template-recipe-v1')throw Error('Not a URI template recipe.');
  const recipe=sanitize({...data.recipe,id:uuid()});
  if(!recipe)throw Error('Invalid template recipe.');
  const e=current();if(!e||e.templateRecipes?.length>=16)throw Error('Design limit reached.');
  if(edit(e=>{e.templateRecipes.push(recipe);e.template=recipe.id}))saveLibrary(recipe);
 }catch(err){alert(err.message)}finally{ev.target.value=''}
};
window.uriTemplateStudioRemove=id=>{
 if(!id.startsWith('tpl-'))return;
 const e=current();if(!e)return;
 if(!confirm('Remove this design from the current invitation?'))return;
 const recipe=saved(e).find(x=>x.id===id);
 if(!recipe)return;
 edit(e=>{
  e.templateRecipes=e.templateRecipes.filter(x=>x.id!==id);
  if(e.template===id)e.template=recipe.base;
 });
};
window.uriTemplateStudioResetLibrary=()=>{if(!confirm('Clear saved custom designs on this device?'))return;
 try{localStorage.removeItem(KEY);library=[];eventPage()}catch(_){}};
function studio(e){
 const currentRecipe=saved(e).find(x=>x.id===e.template);
 return '<details class="uri-template-studio"><summary>Template Studio <small>Create a reusable design</small></summary>'
  +'<div class="uri-template-studio-body"><p>Start with one of URI’s responsive layouts. Paste color and font tokens extracted by MiroMiro, or set your colors manually in Design.</p>'
  +'<form onsubmit="uriTemplateStudioCreate(event)"><label class="wb-field">Design name<input name="name" required maxlength="60" placeholder="e.g. Moonlit Garden"></label>'
  +'<label class="wb-field">Base layout<select name="base">'+bases.map(([id,name])=>'<option value="'+id+'" '+(U.baseTemplate(e)===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'
  +'<label class="wb-field">Reference website<input name="source" type="url" placeholder="https://example.com" maxlength="500"></label>'
  +'<label class="wb-field">Design tokens <span>(MiroMiro JSON or CSS variables)</span><textarea name="tokens" rows="4" maxlength="20000" placeholder=\'{"background":"#121212","text":"#ffffff","accent":"#d07e70"}\'></textarea></label>'
  +'<label class="wb-field">Notes<input name="notes" maxlength="300" placeholder="Optional design notes"></label>'
  +'<button type="submit" class="btn primary">Create design</button></form>'
  +'<div class="uri-template-library"><strong>Saved designs</strong>'
  +(library.length?library.map(x=>'<div class="uri-template-library-row"><span>'+T(x.name)+'</span><button class="btn small" type="button" onclick="uriTemplateStudioApply(\''+x.id+'\')">Use</button></div>').join(''):'<small>No saved designs yet.</small>')
  +'<label class="uri-recipe-import">Import a URI design file<input type="file" accept="application/json,.json" onchange="uriTemplateStudioImport(event)"></label>'
  +(currentRecipe?'<div class="uri-recipe-actions"><button type="button" class="btn small" onclick="uriTemplateStudioExport(\''+T(currentRecipe.id)+'\')">Export current design</button><button type="button" class="btn small" onclick="uriTemplateStudioRemove(\''+T(currentRecipe.id)+'\')">Remove current design</button></div>':'')
  +'</div></div></details>';
}
window.URITemplateStudio={list,sanitize,parseTokens,studio,library:()=>library.slice(),recipe:(e,id)=>saved(e).find(x=>x.id===id)||library.find(x=>x.id===id)||null};
})();