import './style.css';
import {TILE,MAP_W,MAP_H,makeWorld,blocked} from './world.js';

const base=import.meta.env.BASE_URL;
const canvas=document.querySelector('#game');
const ctx=canvas.getContext('2d',{alpha:false});
const errorBanner=document.querySelector('#error-banner');
const motionStatus=document.querySelector('#motion-status');
const coord=document.querySelector('#coord');
const facingLabel=document.querySelector('#facing-label');
const animationLabel=document.querySelector('#animation-label');
const portrait=document.querySelector('#portrait');
const world=makeWorld();
const keys=new Set();
let lastPressed='s';
const player={x:18.5*TILE,y:14.6*TILE,facing:'down',clip:'idle',frame:0,elapsed:0};
const camera={x:0,y:0};
const frameSpec={width:96,height:112,pivotX:48,pivotY:92};
const facingRow={down:0,left:1,right:2,up:3};
const IMG={};
let ready=false,manifest=null,clock=0;
const sheetNames={idle:'liora-idle.png',walk:'liora-walk.png'};
const terrain={grass:['grass-0.png','grass-1.png','grass-2.png','grass-3.png'],path:['path-0.png','path-1.png','path-2.png','path-3.png']};
const props={tree:'oak-tree.png',bush:'bush.png',flower:'wildflowers.png',stone:'stone.png'};

function loadImage(name){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(`Failed to load ${name}`));im.src=`${base}assets/${name}`;});}
function resizeCanvas(){const rect=canvas.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(320,Math.round(rect.width*dpr));canvas.height=Math.max(220,Math.round(rect.height*dpr));}
function inputVector(){const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const length=Math.hypot(x,y);return length?[x/length,y/length]:[0,0];}
function direction(dx,dy){if(dx===0)return dy>0?'down':'up';if(dy===0)return dx>0?'right':'left';if('wasd'.includes(lastPressed))return {w:'up',s:'down',a:'left',d:'right'}[lastPressed];return dx>0?'right':'left';}
function update(dt){const [dx,dy]=inputVector();const moving=dx!==0||dy!==0;const desired=moving?'walk':'idle';if(moving){player.facing=direction(dx,dy);const speed=205;let nx=player.x+dx*speed*dt;let ny=player.y+dy*speed*dt;if(!blocked(world,nx,player.y))player.x=nx;if(!blocked(world,player.x,ny))player.y=ny;}
  if(player.clip!==desired){player.clip=desired;player.frame=0;player.elapsed=0;}
  const spec=manifest?.character?.clips?.[player.clip];if(spec){player.elapsed+=dt;player.frame=Math.floor(player.elapsed*spec.fps)%spec.frames;}
  const vpW=canvas.width,vpH=canvas.height;
  const scale=vpW/960; // A consistent world-to-pixel ratio regardless of viewport DPI.
  const worldW=world.width*scale,worldH=world.height*scale;
  const targetX=Math.max(0,Math.min(worldW-vpW,player.x*scale-vpW/2));
  const targetY=Math.max(0,Math.min(worldH-vpH,player.y*scale-vpH/2));
  const blend=1-Math.exp(-Math.max(0,dt)*12);
  camera.x+=(targetX-camera.x)*blend;camera.y+=(targetY-camera.y)*blend;
  facingLabel.textContent=player.facing[0].toUpperCase()+player.facing.slice(1);
  animationLabel.textContent=player.clip==='walk'?'Walking':'Idle';
  motionStatus.textContent=`${player.facing.toUpperCase()} · ${player.clip.toUpperCase()} ${String(player.frame+1).padStart(2,'0')}`;
  coord.textContent=`X ${Math.round(player.x).toString().padStart(3,'0')} · Y ${Math.round(player.y).toString().padStart(3,'0')}`;
}
function render(){const vpW=canvas.width,vpH=canvas.height;ctx.fillStyle='#579967';ctx.fillRect(0,0,vpW,vpH);if(!ready)return;
  const scale=vpW/960;const t=TILE*scale;const startX=Math.max(0,Math.floor(camera.x/t)-1),endX=Math.min(MAP_W,Math.ceil((camera.x+vpW)/t)+2);const startY=Math.max(0,Math.floor(camera.y/t)-1),endY=Math.min(MAP_H,Math.ceil((camera.y+vpH)/t)+2);
  ctx.imageSmoothingEnabled=false;
  for(let y=startY;y<endY;y++)for(let x=startX;x<endX;x++){const ground=world.ground[y][x];const im=IMG[(ground.path?'path-':'grass-')+ground.variant+'.png'];ctx.drawImage(im,Math.round(x*t-camera.x),Math.round(y*t-camera.y),Math.ceil(t)+1,Math.ceil(t)+1);}
  // Natural path edges are softened with grass strands at boundaries (no canvas texture substitutions).
  for(let y=startY;y<endY;y++)for(let x=startX;x<endX;x++){
    if(!world.ground[y][x].path)continue;
    const px=x*t-camera.x,py=y*t-camera.y;
    ctx.strokeStyle='rgba(61,126,78,.38)';ctx.lineWidth=3*scale;
    if(!world.ground[y-1]?.[x]?.path){ctx.beginPath();ctx.moveTo(px,py+1);ctx.lineTo(px+t,py+1);ctx.stroke();}
    if(!world.ground[y+1]?.[x]?.path){ctx.beginPath();ctx.moveTo(px,py+t-1);ctx.lineTo(px+t,py+t-1);ctx.stroke();}
    if(!world.ground[y]?.[x-1]?.path){ctx.beginPath();ctx.moveTo(px+1,py);ctx.lineTo(px+1,py+t);ctx.stroke();}
    if(!world.ground[y]?.[x+1]?.path){ctx.beginPath();ctx.moveTo(px+t-1,py);ctx.lineTo(px+t-1,py+t);ctx.stroke();}
  }
  const visible=world.props.filter(p=>{const sx=p.x*scale-camera.x,sy=p.y*scale-camera.y;return sx>-180&&sx<vpW+180&&sy>-180&&sy<vpH+180;});
  const ordered=[...visible,{kind:'player',x:player.x,y:player.y}].sort((a,b)=>a.y-b.y);
  for(const item of ordered){const x=item.x*scale-camera.x,y=item.y*scale-camera.y;ctx.imageSmoothingEnabled=true;
    if(item.kind==='player'){
      // Contact shadow stays under the character's pivot, independent of sprite animation.
      ctx.fillStyle='rgba(21,46,40,.25)';ctx.beginPath();ctx.ellipse(x,y+2*scale,27*scale,9*scale,0,0,Math.PI*2);ctx.fill();
      const im=IMG[sheetNames[player.clip]],srcX=player.frame*frameSpec.width,srcY=facingRow[player.facing]*frameSpec.height;
      const s=1.26*scale;ctx.drawImage(im,srcX,srcY,frameSpec.width,frameSpec.height,x-frameSpec.pivotX*s,y-frameSpec.pivotY*s,frameSpec.width*s,frameSpec.height*s);
    }else{
      const im=IMG[props[item.kind]];const h=im.height*scale,w=im.width*scale;
      // PNG props use their bottom center as the world coordinate.
      ctx.drawImage(im,x-w/2,y-h+4*scale,w,h);
    }
  }
}
function frame(now){const dt=clock?Math.min(.06,(now-clock)/1000):0;clock=now;if(ready)update(dt);render();requestAnimationFrame(frame);}
const supported=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
window.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(!supported.has(key))return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;event.preventDefault();if(!keys.has(key))lastPressed=key;keys.add(key);});
window.addEventListener('keyup',event=>{keys.delete(event.key.toLowerCase());});
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();clock=0;}});
new ResizeObserver(resizeCanvas).observe(canvas);resizeCanvas();

async function start(){try{const response=await fetch(`${base}assets/manifest.json`,{cache:'no-store'});if(!response.ok)throw Error('Asset manifest HTTP '+response.status);manifest=await response.json();const fileNames=[...Object.values(sheetNames),...Object.values(terrain).flat(),...Object.values(props)];await Promise.all(fileNames.map(async name=>{IMG[name]=await loadImage(name);}));portrait.src=`${base}assets/liora-portrait.png`;
    ready=true;canvas.focus({preventScroll:true});
  }catch(err){errorBanner.hidden=false;errorBanner.textContent=`Assets could not load: ${err.message}`;motionStatus.textContent='Asset load failed';console.error(err);}}
start();requestAnimationFrame(frame);

// Keep the previously verified GitHub Pages deployment refresh behavior.
const status=document.querySelector('#deploy-status');
status.textContent=import.meta.env.DEV?'VITE · Local auto refresh':'PUBLISHED · Auto-check every 10s';
if(import.meta.env.PROD){const currentBuild=__BUILD_ID__;let checking=false;async function checkForUpdate(){if(checking||document.hidden)return;checking=true;try{const url=new URL(`${base}version.json`,location.origin);url.searchParams.set('t',String(Date.now()));const res=await fetch(url,{cache:'no-store'});if(!res.ok)return;const {buildId}=await res.json();if(buildId&&buildId!==currentBuild){const next=new URL(location.href);next.searchParams.set('build',buildId);location.replace(next.href);}}catch{ /* Remain playable if update checks fail. */ }finally{checking=false;}}
  setInterval(checkForUpdate,10000);document.addEventListener('visibilitychange',checkForUpdate);checkForUpdate();}
