/* URI Music Manager 1.0: guest-controlled audio and safe, portable playlist metadata. */
(function(){
'use strict';
const U=window.URIBuilder;if(!U)return;
const text=v=>typeof esc==='function'?esc(String(v)):String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validKeys=['enabled','autoplay','loop','volume'];
const loopTypes=['off','track','playlist'];
const uid=()=> 'music-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
function safeUrl(value){
 const src=String(value||'').trim();
 try{const url=new URL(src);return url.protocol==='https:'&&!url.username&&!url.password&&src.length<=1800?url.href:''}catch(_){return ''}
}
function normalize(raw){
 const m=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const tracks=Array.isArray(m.tracks)?m.tracks.slice(0,12).filter(x=>x&&typeof x==='object').map((item,i)=>({
  id:/^music-[a-z0-9-]{3,50}$/i.test(String(item.id||''))?String(item.id):'music-import-'+i,
  title:String(item.title||'Track '+(i+1)).slice(0,100),
  url:safeUrl(item.url)
 })):[];
 return {enabled:m.enabled===true,autoplay:m.autoplay===true,
   loop:loopTypes.includes(m.loop)?m.loop:'playlist',
   volume:Number.isFinite(Number(m.volume))?Math.max(0,Math.min(1,Number(m.volume))):0.6,
   tracks};
}
const read=e=>normalize(e?.music);
const model=U.model;
U.model=e=>{const result=model(e);if(!e.music||typeof e.music!=='object')e.music=normalize(null);return result};
const originalPayload=U.payload;
U.payload=e=>({...originalPayload(e),music:read(e)});
function usable(config){return config.enabled?config.tracks.filter(t=>!!t.url):[]}
function player(e){
 const music=read(e),tracks=usable(music);
 if(!tracks.length)return '';
 const first=tracks[0],disabled=tracks.length===1?' disabled':'';
 return '<section class="uri-music-player" aria-label="Background music" data-uri-autoplay="'+music.autoplay+'" data-uri-loop="'+music.loop+'" data-uri-volume="'+music.volume+'">'
 +'<audio class="uri-music-audio" preload="none" src="'+text(first.url)+'"></audio>'
 +'<div class="uri-music-info"><span>Music</span><strong class="uri-music-title">'+text(first.title)+'</strong></div>'
 +'<div class="uri-music-buttons"><button type="button" data-music-action="prev" aria-label="Previous track"'+disabled+'>Previous</button>'
 +'<button type="button" class="uri-music-play" data-music-action="play" aria-label="Play music">Play</button>'
 +'<button type="button" data-music-action="next" aria-label="Next track"'+disabled+'>Next</button></div>'
 +'<label class="uri-music-volume"><span>Volume</span><input aria-label="Music volume" type="range" min="0" max="100" step="5" value="'+Math.round(music.volume*100)+'"></label>'
 +'<div class="uri-music-message" aria-live="polite" role="status"></div>'
 +'<script type="application/json" class="uri-music-data">'+JSON.stringify(tracks).replace(/</g,'\\u003c')+'</script></section>';
}
const oldRender=U.render;
U.render=e=>{
 const html=oldRender(e),music=player(e);
 return music?html.replace('<footer class="wb-footer">',music+'<footer class="wb-footer">'):html;
};
function persist(change,rerender=false){
 const e=current();if(!e||e.type!=='Wedding')return false;
 const before=JSON.stringify(e.music);
 e.music=read(e);
 change(e.music);
 e.music=normalize(e.music);
 if(!U.persist()){e.music=JSON.parse(before);eventPage();return false}
 if(rerender)eventPage();else U.refresh?.();
 return true;
}
window.uriMusicSet=(key,value)=>{
 if(!validKeys.includes(key))return;
 if(key==='loop'&&!loopTypes.includes(value))return;
 if(key==='enabled'||key==='autoplay')value=value===true;
 if(key==='volume'){const n=Number(value);if(!Number.isFinite(n)||n<0||n>100)return;value=n/100}
 if(persist(m=>{m[key]=value},key==='enabled')){
  if(key==='volume'){const label=document.getElementById('uriMusicVolumeValue');if(label)label.textContent=Math.round(value*100)+'%'}
 }
};
window.uriMusicAdd=()=>persist(m=>{
 if(m.tracks.length>=12)return;
 m.tracks.push({id:uid(),title:'Track '+(m.tracks.length+1),url:''});
 m.enabled=true;
},true);
window.uriMusicRemove=id=>persist(m=>{m.tracks=m.tracks.filter(t=>t.id!==id)},true);
window.uriMusicMove=(id,dir)=>persist(m=>{
 const i=m.tracks.findIndex(t=>t.id===id),j=i+dir;
 if(i<0||j<0||j>=m.tracks.length)return;
 [m.tracks[i],m.tracks[j]]=[m.tracks[j],m.tracks[i]];
},true);
window.uriMusicTrackSet=(id,key,value)=>{
 if(!['title','url'].includes(key))return;
 persist(m=>{
  const t=m.tracks.find(t=>t.id===id);if(!t)return;
  t[key]=key==='url'?safeUrl(value):String(value).slice(0,100);
 });
};
window.uriMusicUpload=async(ev,id)=>{
 const file=ev.target?.files?.[0],e=current(),eventId=e?.id;
 const status=document.getElementById('uriMusicStatus');
 if(!file||!e)return;
 if(status)status.textContent='Uploading audio…';
 try{
  if(!window.URICloud?.uploadAudio)throw Error('Cloud publishing is not available.');
  const url=await window.URICloud.uploadAudio(file,eventId);
  if(current()?.id!==eventId)return;
  const track=read(current()).tracks.find(x=>x.id===id);
  if(!track)return;
  if(persist(m=>{
   const t=m.tracks.find(x=>x.id===id);
   if(t){t.url=url;if(!t.title||/^Track \d+$/.test(t.title))t.title=file.name.replace(/\.[^.]+$/,'').slice(0,100)}
  },true)){const n=document.getElementById('uriMusicStatus');if(n)n.textContent='Track uploaded. Changes are saved locally; republish to update the public invitation.'}
 }catch(err){if(status)status.textContent=err.message||'Unable to upload audio.'}
 finally{if(ev.target)ev.target.value=''}
};
function manager(e){
 const m=read(e),tracks=m.tracks,check=(label,key)=>'<label class="uri-music-switch"><span>'+label+'</span><input type="checkbox" '+(m[key]?'checked':'')+' onchange="uriMusicSet(\''+key+'\',this.checked)"></label>';
 return '<section class="uri-music-manager"><div class="uri-music-manager-head"><h3>Background music</h3><p>Add your own licensed audio tracks or direct HTTPS audio links.</p></div>'
 +check('Enable music player','enabled')+check('Try autoplay on invitation opening','autoplay')
 +'<div class="uri-music-controls"><label class="uri-music-field">Repeat behavior<select onchange="uriMusicSet(\'loop\',this.value)">'
 +[['off','Play through once'],['track','Loop current track'],['playlist','Loop entire playlist']].map(([v,label])=>'<option value="'+v+'" '+(m.loop===v?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'
 +'<label class="uri-music-field">Starting volume <output id="uriMusicVolumeValue">'+Math.round(m.volume*100)+'%</output><input type="range" min="0" max="100" step="5" value="'+Math.round(m.volume*100)+'" oninput="uriMusicSet(\'volume\',this.value)"></label></div>'
 +'<div class="uri-music-track-head"><strong>Playlist ('+tracks.length+'/12)</strong><button type="button" class="btn small" onclick="uriMusicAdd()" '+(tracks.length>=12?'disabled':'')+'>Add track</button></div>'
 +'<div class="uri-music-track-list">'+(tracks.length?tracks.map((t,i)=>'<div class="uri-music-track" data-music-id="'+text(t.id)+'"><div class="uri-music-track-title"><strong>'+(i+1)+'. '+text(t.title)+'</strong><div><button type="button" aria-label="Move music track up" '+(i===0?'disabled':'')+' onclick="uriMusicMove(\''+t.id+'\',-1)">Up</button><button type="button" aria-label="Move music track down" '+(i===tracks.length-1?'disabled':'')+' onclick="uriMusicMove(\''+t.id+'\',1)">Down</button><button type="button" aria-label="Remove music track" onclick="uriMusicRemove(\''+t.id+'\')">Remove</button></div></div>'
 +'<label class="uri-music-field">Track title<input type="text" maxlength="100" value="'+text(t.title)+'" oninput="uriMusicTrackSet(\''+t.id+'\',\'title\',this.value)"></label>'
 +'<label class="uri-music-field">Direct audio URL (MP3, WAV, OGG, etc.)<input type="url" value="'+text(t.url)+'" placeholder="https://example.com/song.mp3" onchange="uriMusicTrackSet(\''+t.id+'\',\'url\',this.value)"></label>'
 +'<label class="uri-music-audio-upload">Upload audio to URI<input aria-label="Upload audio for track '+(i+1)+'" type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.ogg,.wav,.webm" onchange="uriMusicUpload(event,\''+t.id+'\')"></label></div>').join(''):'<p class="uri-music-empty">No tracks yet. Add a track to start your playlist.</p>')+'</div>'
 +'<p role="status" aria-live="polite" id="uriMusicStatus"></p>'
 +'<p class="uri-music-warning">Autoplay may be blocked by mobile browsers. Guests will always have Play/Pause controls. Uploading requires sign-in under Publish; audio files are publicly accessible after upload and must be yours or licensed for use.</p>'
 +'</section>';
}
let activePlayer=null;
function setup(player){
 if(player.dataset.uriMusicMounted==='yes')return;
 player.dataset.uriMusicMounted='yes';
 const audio=player.querySelector('audio'),status=player.querySelector('.uri-music-message');
 let tracks=[];
 try{tracks=JSON.parse(player.querySelector('.uri-music-data')?.textContent||'[]').filter(t=>t&&safeUrl(t.url))}catch(_){}
 if(!audio||!tracks.length)return;
 if(activePlayer&&activePlayer!==player&&(!document.body?.contains?.(activePlayer)||activePlayer.closest('#wbLivePreview'))){
  activePlayer.querySelector('audio')?.pause?.();
 }
 activePlayer=player;
 let index=0;
 const button=player.querySelector('[data-music-action="play"]');
 const volume=player.querySelector('.uri-music-volume input');
 const show=message=>{if(status)status.textContent=message};
 audio.volume=Math.max(0,Math.min(1,Number(player.dataset.uriVolume)||0.6));
 const update=()=>{if(button){button.textContent=audio.paused?'Play':'Pause';button.setAttribute('aria-label',audio.paused?'Play music':'Pause music')}};
 async function play(){
  try{const result=audio.play();if(result&&typeof result.then==='function')await result;show('');update()}
  catch(err){show(err?.name==='NotAllowedError'?'Tap Play to start music.':'This audio could not be played. Check the file or link.');update()}
 }
 function select(i,start){
  index=(i+tracks.length)%tracks.length;
  audio.src=tracks[index].url;
  player.querySelector('.uri-music-title').textContent=tracks[index].title;
  audio.load?.();
  if(start)play();else update();
 }
 player.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-music-action]')?.dataset.musicAction;
  if(!action)return;
  if(action==='play'){if(audio.paused)play();else{audio.pause();update()}}
  else if(action==='next')select(index+1,true);
  else if(action==='prev')select(index-1,true);
 });
 volume?.addEventListener('input',()=>{audio.volume=Math.max(0,Math.min(1,Number(volume.value)/100))});
 audio.addEventListener('play',update);audio.addEventListener('pause',update);
 audio.addEventListener('error',()=>show('Unable to load this audio file.'));
 audio.addEventListener('ended',()=>{
  const loop=player.dataset.uriLoop;
  if(loop==='track')select(index,true);
  else if(index<tracks.length-1)select(index+1,true);
  else if(loop==='playlist')select(0,true);
  else{show('Playlist finished.');update()}
 });
 update();
 if(player.dataset.uriAutoplay==='true'&&!player.closest?.('#wbLivePreview'))play();
}
function mount(root=document){
 if(root?.matches?.('.uri-music-player'))setup(root);
 root?.querySelectorAll?.('.uri-music-player').forEach(setup);
 if(activePlayer&&!document.body?.contains?.(activePlayer)){activePlayer.querySelector('audio')?.pause?.();activePlayer=null}
}
window.URIMusic={normalize,read,manager,safeUrl,player,mount};
function init(){
 const app=document.getElementById?.('app');if(!app)return;
 mount(app);
 if(typeof window.MutationObserver==='function'){
  const obs=new window.MutationObserver(()=>mount(app));
  obs.observe(app,{childList:true,subtree:true});
 }
}
if(document.readyState==='loading')document.addEventListener?.('DOMContentLoaded',init,{once:true});else init();
})();