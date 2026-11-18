export const TILE = 64;
export const MAP_W = 38;
export const MAP_H = 30;

function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function isPath(x, y) {
  const vertical = (x >= 17 && x <= 19 && y >= 2 && y <= MAP_H-3);
  const horizontal = (y >= 13 && y <= 15 && x >= 3 && x <= MAP_W-4);
  const sideTrail = (y >= 19 && y <= 20 && x >= 18 && x <= 30);
  return vertical || horizontal || sideTrail;
}

export function makeWorld(seed=1108) {
  const rng=mulberry32(seed);
  const ground=[];
  for(let y=0;y<MAP_H;y++) {
    const row=[];
    for(let x=0;x<MAP_W;x++) row.push({path:isPath(x,y),variant:Math.floor(rng()*4)});
    ground.push(row);
  }
  const props=[];
  const spacing=(x,y,r)=>props.every(p=>Math.hypot(p.x-x,p.y-y)>p.radius+r+19);
  // Each prop is positioned by its real foot anchor, not by its image top-left.
  for(let y=2;y<MAP_H-2;y++) for(let x=2;x<MAP_W-2;x++) {
    const chance=rng();
    const wx=(x+.3+rng()*.4)*TILE, wy=(y+.3+rng()*.4)*TILE;
    const clearPath=(dx,dy)=>isPath(x+dx,y+dy);
    if (clearPath(0,0)||clearPath(1,0)||clearPath(-1,0)||clearPath(0,1)||clearPath(0,-1)) continue;
    if(Math.hypot(wx-18*TILE,wy-14*TILE)<280) continue;
    if(chance<.17 && spacing(wx,wy,30))props.push({kind:'tree',x:wx,y:wy,radius:23,solid:true});
    else if(chance<.25 && spacing(wx,wy,23))props.push({kind:'bush',x:wx,y:wy,radius:20,solid:true});
    else if(chance<.29 && spacing(wx,wy,19))props.push({kind:'stone',x:wx,y:wy,radius:15,solid:true});
    else if(chance<.43)props.push({kind:'flower',x:wx,y:wy,radius:0,solid:false});
  }
  props.sort((a,b)=>a.y-b.y);
  return {ground, props, width:MAP_W*TILE,height:MAP_H*TILE};
}

export function blocked(world,x,y,radius=14) {
  if(x<radius+18||y<radius+18||x>world.width-radius-18||y>world.height-radius-18)return true;
  return world.props.some(p=>p.solid && Math.hypot(x-p.x,y-(p.y-8))<radius+p.radius);
}
