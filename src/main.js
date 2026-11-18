import './style.css';

const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const base = import.meta.env.BASE_URL;
const canvas = $('#game-canvas');
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: false });
const stage = $('#stage');
const info = $('#frame-info');
const motionLabel = $('#motion-label');
const status = $('#status');
const label = $('#loading');
const directionOrder = ['down','down-right','right','up-right','up','up-left','left','down-left'];
const directions = {
  down: [0,1], 'down-right': [1,1], right:[1,0], 'up-right':[1,-1],
  up:[0,-1], 'up-left':[-1,-1], left:[-1,0], 'down-left':[-1,1]
};
const state = { ready: false, desiredClip:'idle', clip:'idle', direction:'down', speed:1, playing:!window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  pressed: new Set(), pointer:null, pointerDir:null, x:480, y:430, elapsed:0, frame:0, lastFrame:0, frameMs:0, renderFps:60, showTransparency:false };
const atlases = {};
let manifest = null;

function setDirection(name) {
  if (!directions[name]) return;
  state.direction = name;
  $$('[data-dir]').forEach(b => {
    const selected = b.dataset.dir === name;
    b.classList.toggle('is-active',selected);
    b.setAttribute('aria-pressed',String(selected));
  });
}
function setClip(clip) {
  if (!['idle','walk','run'].includes(clip)) return;
  state.desiredClip = clip;
  $$('[data-clip]').forEach(button => {
    const selected=button.dataset.clip===clip;
    button.classList.toggle('is-active',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
}
function keyVector() {
  const keys=state.pressed;
  let x=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
  let y=Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'));
  if (state.pointerDir) [x,y]=directions[state.pointerDir];
  const length=Math.hypot(x,y);
  return length ? [x/length,y/length]:[0,0];
}
function directionFromVector(dx,dy) {
  if (!dx && !dy) return state.direction;
  const x=Math.sign(dx),y=Math.sign(dy);
  return Object.keys(directions).find(key=>directions[key][0]===x && directions[key][1]===y) || state.direction;
}
function renderBackdrop() {
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  if (state.showTransparency) return;
  const bg=ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'#1d2943');bg.addColorStop(0.52,'#29334e');bg.addColorStop(1,'#19283f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(162,183,226,.09)';
  for(let i=0;i<12;i++) {const x=i*109+30,y=24+((i*71)%190); ctx.beginPath();ctx.arc(x,y,1.8+(i%3),0,Math.PI*2);ctx.fill();}
  // Ground plane: orthographic 2.5D cues, not part of Rem's texture assets.
  ctx.beginPath();ctx.moveTo(0,285);ctx.lineTo(w,285);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();
  ctx.fillStyle='rgba(10,16,36,.24)';ctx.fill();
  ctx.lineWidth=1;ctx.strokeStyle='rgba(226,227,255,.11)';
  for(let x=-w;x<w*2;x+=92){ctx.beginPath();ctx.moveTo(x,285);ctx.lineTo(x+w*.26,h);ctx.stroke();}
  for(let y=310;y<h;y+=56){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.strokeStyle='rgba(220,218,255,.28)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(480,445,285,104,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(205,213,252,.60)';ctx.font='600 13px Georgia,serif';ctx.textAlign='left';ctx.fillText('SANCTUARY · CHARACTER TEST FLOOR',30,54);
}
function drawCharacter() {
  if (!state.ready) return;
  const atlas=atlases[state.clip];
  const clip=manifest.clips[state.clip];
  if (!atlas || !clip) return;
  const w=manifest.frame.width,h=manifest.frame.height;
  const row=directionOrder.indexOf(state.direction);
  const col=state.frame%clip.frameCount;
  const renderScale=1.37;
  const size=w*renderScale;
  ctx.fillStyle='rgba(5,8,24,.43)';ctx.beginPath();ctx.ellipse(state.x,state.y+5,48,13,0,0,Math.PI*2);ctx.fill();
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(atlas,col*w,row*h,w,h,state.x-size*.5,state.y-244*renderScale,size,size);
  ctx.strokeStyle='rgba(229,208,251,.40)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(state.x-11,state.y+23);ctx.lineTo(state.x+11,state.y+23);ctx.stroke();
  motionLabel.textContent=`${state.clip.toUpperCase()} · ${state.direction.toUpperCase().replace('-', ' / ')}`;
  info.textContent=`FRAME ${String(col+1).padStart(2,'0')}/${String(clip.frameCount).padStart(2,'0')} · ${clip.fps} FPS · 8-WAY`;
}
function tick(now) {
  const dt=state.lastFrame===0?0:Math.min(0.05,(now-state.lastFrame)/1000);
  state.lastFrame=now;
  if(dt>0)state.renderFps=state.renderFps*.92 + (1/dt)*.08;
  const [dx,dy]=keyVector();
  const moving=Math.hypot(dx,dy)>0;
  let effective=state.desiredClip;
  if(moving){setDirection(directionFromVector(dx,dy));effective=state.pressed.has('ShiftLeft')||state.pressed.has('ShiftRight')?'run':state.desiredClip==='run'?'run':'walk';}
  if(effective!==state.clip){state.clip=effective;state.elapsed=0;state.frame=0;}
  if(moving && state.playing){
    const velocity=effective==='run'?190:115;
    state.x=Math.max(100,Math.min(860,state.x+dx*velocity*dt));
    state.y=Math.max(320,Math.min(512,state.y+dy*velocity*.73*dt));
  }
  if(state.ready && state.playing){
    const clip=manifest.clips[state.clip];
    state.elapsed+=dt*state.speed;
    state.frame=Math.floor(state.elapsed*clip.fps)%clip.frameCount;
  }
  if(ctx){renderBackdrop();drawCharacter();}
  requestAnimationFrame(tick);
}
$$('[data-clip]').forEach(b=>b.addEventListener('click',()=>setClip(b.dataset.clip)));
$$('[data-dir]').forEach(b=>{
  b.addEventListener('click',()=>setDirection(b.dataset.dir));
  b.addEventListener('pointerdown',ev=>{
    if(ev.button!==0 && ev.pointerType==='mouse')return;
    b.setPointerCapture(ev.pointerId);
    state.pointer=ev.pointerId;state.pointerDir=b.dataset.dir;setDirection(b.dataset.dir);
  });
  const stop=ev=>{if(state.pointer===ev.pointerId){state.pointer=null;state.pointerDir=null;}};
  b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);
});
$('#toggle-play').addEventListener('click',()=>{
  state.playing=!state.playing;
  $('#toggle-play').textContent=state.playing?'Ⅱ Pause':'▶ Play';
  $('#toggle-play').setAttribute('aria-pressed',String(state.playing));
});
$('#speed').addEventListener('input',ev=>{state.speed=Number(ev.target.value);$('#speed-value').textContent=`${state.speed.toFixed(2).replace(/0$/,'').replace(/\.0$/,'')}×`;});
$('#toggle-surface').addEventListener('click',()=>{
  state.showTransparency=!state.showTransparency;
  stage.dataset.surface=state.showTransparency?'checker':'scene';
  $('#toggle-surface').setAttribute('aria-pressed',String(state.showTransparency));
  $('#toggle-surface').textContent=state.showTransparency?'✦ Illustrated stage':'◫ Transparency check';
});
window.addEventListener('keydown',ev=>{
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName??''))return;
  if(ev.key.startsWith('Arrow')||ev.code==='Space')ev.preventDefault();
  if(ev.key.startsWith('Arrow')||ev.code==='ShiftLeft'||ev.code==='ShiftRight')state.pressed.add(ev.code);
  if(ev.code==='Digit1')setClip('idle');
  if(ev.code==='Digit2')setClip('walk');
  if(ev.code==='Digit3')setClip('run');
  if(ev.code==='Space'&&!ev.repeat)$('#toggle-play').click();
});
window.addEventListener('keyup',ev=>state.pressed.delete(ev.code));
window.addEventListener('blur',()=>state.pressed.clear());

async function loadAtlas(src,clip) {
  const image=new Image();
  image.src=`${base}${src}`;
  await image.decode();
  const spec=manifest.atlases[clip];
  if(image.naturalWidth!==spec.pixelWidth||image.naturalHeight!==spec.pixelHeight)throw Error(`Bad ${clip} atlas dimensions`);
  return image;
}
async function start() {
  try {
    if(!ctx)throw Error('Canvas 2D unavailable');
    const response=await fetch(`${base}assets/rem-chibi-8way.json`,{cache:'no-store'});
    if(!response.ok)throw Error(`Manifest HTTP ${response.status}`);
    manifest=await response.json();
    if(manifest.directionOrder.join(',')!==directionOrder.join(','))throw Error('Eight-direction manifest mismatch');
    await Promise.all(['idle','walk','run'].map(async c=>{atlases[c]=await loadAtlas(manifest.atlases[c].file,c);}));
    state.ready=true;label.hidden=true;
    setDirection(state.direction);setClip('idle');
  }catch(error){label.hidden=false;label.textContent=`Animation unavailable: ${error.message}`;console.error(error);}
  requestAnimationFrame(tick);
}
$('#source-asset').href=`${base}assets/rem-idle.png`;
$('#sheet-asset').href=`${base}assets/rem-chibi-walk-8way.webp`;
status.textContent=import.meta.env.DEV?'LOCAL · Vite auto-refresh':'PUBLISHED · Auto-check every 10 seconds';
if(import.meta.env.PROD){
  const currentBuild=__BUILD_ID__;
  let checking=false;
  async function checkForUpdate(){
    if(checking||document.hidden)return;
    checking=true;
    try{
      const url=new URL(`${base}version.json`,location.origin);url.searchParams.set('t',String(Date.now()));
      const res=await fetch(url,{cache:'no-store'});if(!res.ok)return;
      const {buildId}=await res.json();
      if(typeof buildId==='string'&&buildId&&buildId!==currentBuild){
        const next=new URL(location.href);next.searchParams.set('build',buildId);location.replace(next.href);
      }
    }catch(err){console.debug('Preview refresh check deferred',err);}finally{checking=false;}
  }
  setInterval(checkForUpdate,10000);
  document.addEventListener('visibilitychange',checkForUpdate);
  checkForUpdate();
}
start();
