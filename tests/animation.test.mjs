import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('public/assets/rem-chibi-8way.json'));
test('eight directions including diagonals are present',()=>{
 assert.deepEqual(manifest.directionOrder,['down','down-right','right','up-right','up','up-left','left','down-left']);
});
test('idle walk run reference real, nonempty atlases and frame descriptions',()=>{
 for(const clip of ['idle','walk','run']){
  const spec=manifest.atlases[clip];
  assert.equal(spec.rows,8);assert.equal(spec.columns,8);
  assert.equal(spec.pixelWidth,2048);assert.equal(spec.pixelHeight,2048);
  assert.equal(manifest.clips[clip].frameCount,8);
  assert.ok(statSync(new URL('../public/'+spec.file,import.meta.url)).size>100_000);
 }
});
test('eight-way player has keyboard and pointer controls, delta-time playback and hosted reload',()=>{
 const js=read('src/main.js');
 for(const s of ['requestAnimationFrame','pointerdown','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Math.hypot','clip.fps','version.json','10000'])assert.ok(js.includes(s),s);
});
