import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const metadata = JSON.parse(read('public/assets/rem-motion.json').toString('utf8'));

test('motion atlas is a genuine WebP image', () => {
  const atlas = read('public/assets/rem-motion-atlas.webp');
  assert.equal(atlas.toString('ascii',0,4),'RIFF');
  assert.equal(atlas.toString('ascii',8,12),'WEBP');
  assert.ok(atlas.byteLength > 30000,'nontrivial frame atlas must be present');
});

test('idle, walk and run each have 8 independent positive-duration frames', () => {
  assert.equal(metadata.rigged,false);
  assert.equal(metadata.animationType,'frame-by-frame');
  assert.equal(metadata.dimensions.atlasWidth,1536);
  assert.equal(metadata.dimensions.atlasHeight,768);
  const seen = new Set();
  for (const name of ['idle','walk','run']) {
    const clip=metadata.animationClips[name];
    assert.equal(clip.frameCount,8,`${name} must have 8 frames`);
    assert.equal(clip.frames.length,8);
    for (const f of clip.frames) {
      assert.ok(Number.isInteger(f.durationMs) && f.durationMs > 0);
      assert.ok(f.x >= 0 && f.y >= 0);
      assert.ok(f.x+f.w <= 1536 && f.y+f.h <= 768);
      const key = `${f.x},${f.y},${f.w},${f.h}`;
      assert.equal(seen.has(key),false,'frame rectangle reused across clips');
      seen.add(key);
    }
  }
  assert.equal(seen.size,24);
});

test('preview has state controls and 10-second hosted refresh', () => {
  const html=read('index.html').toString('utf8');
  const js=read('src/main.js').toString('utf8');
  for(const clip of ['idle','walk','run']) assert.match(html,new RegExp(`data-clip="${clip}"`));
  assert.match(html,/<canvas id="motion-canvas"/);
  assert.match(js,/setInterval\(checkForUpdate,10000\)/);
  assert.match(js,/sheet\.decode\(\)/);
  assert.match(js,/ctx\.drawImage\(/);
});
