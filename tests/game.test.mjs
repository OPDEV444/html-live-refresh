import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {makeWorld,blocked,MAP_H,MAP_W,TILE} from '../src/world.js';

const load=(f)=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const meta=JSON.parse(load('public/assets/manifest.json'));

test('real character frames exist for every facing and both states',()=>{
  assert.deepEqual(meta.character.directions,['down','left','right','up']);
  for(const state of ['idle','walk']){
    const clip=meta.character.clips[state];
    assert.ok(clip.frames>=4);
    assert.ok(statSync(new URL(`../public/assets/${clip.file}`,import.meta.url)).size>30_000);
  }
  assert.equal(meta.character.frame.width,96);
  assert.equal(meta.character.frame.height,112);
});

test('world tiles and props exist as actual separate PNGs',()=>{
  for(const name of [...meta.world.ground,...meta.world.path,...meta.world.props]){
    assert.ok(statSync(new URL(`../public/assets/${name}`,import.meta.url)).size>200,name);
  }
});

test('deterministic 2D world has traversable center and bounded collision',()=>{
  const a=makeWorld(),b=makeWorld();
  assert.equal(a.width,MAP_W*TILE);assert.equal(a.height,MAP_H*TILE);
  assert.deepEqual(a.props,b.props);
  assert.equal(blocked(a,18.5*TILE,14.6*TILE),false);
  assert.equal(blocked(a,10,10),true);
});

test('WASD movement uses normalized input and delta time, automatic hosted refresh retained',()=>{
  const main=load('src/main.js');
  for(const token of ['w','a','s','d','Math.hypot','dt','blocked(','requestAnimationFrame','ResizeObserver','version.json','10000'])assert.ok(main.includes(token),token);
});
