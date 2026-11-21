import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advance, beginStep, createPilot, pose, sprite } from '../src/pilot.js';
import { canEnter, garden, route, adjacentRelay } from '../src/world.js';
import { readSave, writeSave } from '../src/session.js';

const map = garden.createMap();
const walk = (x,y) => canEnter(garden,map,x,y);

test('tap completes exactly one cardinal tile and rests on its directional idle', () => {
  for (const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]) {
    const p = createPilot({x:10,y:10});
    assert.equal(beginStep(p,dir,false,walk),true);
    assert.equal(beginStep(p,'down',true,walk),false);
    advance(p,107.5);
    assert.deepEqual(pose(p),{x:10+dx/2,y:10+dy/2,frame:1});
    advance(p,1000);
    assert.deepEqual(pose(p),{x:10+dx,y:10+dy,frame:0});
    assert.equal(p.facing,dir);
    beginStep(p,dir,true,walk); advance(p,65);
    assert.equal(pose(p).frame,3);
    advance(p,50); assert.equal(p.step,null);
  }
});

test('area bounds and solid relay block movement but permit turning and interaction', () => {
  const p = createPilot(garden.spawn);
  assert.ok(adjacentRelay(garden,p));
  assert.equal(beginStep(p,'right',false,walk),false);
  assert.equal(p.facing,'right');
  for (const [x,y] of [[-1,0],[0,-1],[map.width,0],[0,map.height]]) assert.equal(walk(x,y),false);
  assert.ok(walk(0,0));
  assert.equal(route[1][1],'Plantation 13 / Mistilteinn');
  assert.equal(route[4][1],'Gran Crevasse');
});

test('runtime atlas dimensions match four directions, four columns and foot anchor', () => {
  const png = readFileSync(new URL('../src/assets/pilot-walk.png',import.meta.url));
  assert.equal(png.readUInt32BE(16), sprite.width*4);
  assert.equal(png.readUInt32BE(20), sprite.height*sprite.rows.length);
  assert.deepEqual(sprite.anchor,[16,46]);
});

test('local saves round trip and reject invalid coordinates or incompatible data', () => {
  let data = null;
  const storage = { getItem:()=>data, setItem:(_,v)=>{data=v;} };
  assert.equal(readSave(storage,map),null);
  const p = createPilot(garden.spawn);
  writeSave(storage,p,{hasPass:true,textSpeed:'Fast'});
  const saved=readSave(storage,map);
  assert.equal(saved.hasPass,true);
  assert.equal(saved.x,p.x);
  for (const change of [{x:-1},{x:garden.objects[0].x,y:garden.objects[0].y},{facing:'constructor'},{version:0},{textSpeed:'bad'}]) {
    data=JSON.stringify({...saved,...change});
    assert.throws(()=>readSave(storage,map));
  }
});
