import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
const file = path => new URL(`../${path}`, import.meta.url);
const read = path => readFileSync(file(path),'utf8');
const manifest=JSON.parse(read('public/assets/manifest.json'));

test('four real 400×512 transparent PNG direction assets exist',()=>{
  const views=manifest.views;
  assert.deepEqual(Object.keys(views).sort(), ['down','left','right','up']);
  for(const facing of ['down','up','left','right']){
    const entry=views[facing];
    assert.equal(entry.width,400);assert.equal(entry.height,512);
    assert.deepEqual(entry.pivot,{x:200,y:500});
    const bytes=readFileSync(file(`public/${entry.file}`));
    assert.ok(bytes.length>45000,`empty ${facing} file`);
    assert.equal(bytes.toString('ascii',1,4),'PNG');
    assert.equal(bytes.readUInt32BE(16),400);
    assert.equal(bytes.readUInt32BE(20),512);
    assert.equal(bytes[25],6,'RGBA color mode required');
  }
});
test('the separate staff and source reference exist',()=>{
  assert.ok(statSync(file('public/assets/design4-staff.png')).size>20000);
  assert.ok(statSync(file('public/assets/approved-design-4.webp')).size>20000);
  assert.ok(existsSync(file('public/assets/turnaround-source.webp')));
});
test('direction controls and 10-second deployed refresh are connected',()=>{
  const html=read('index.html');const js=read('src/main.js');
  for(const facing of ['up','down','left','right']) {
    assert.ok(html.includes(`data-facing="${facing}"`));
    assert.ok(js.includes(`'${facing}'`));
  }
  for(const signal of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','setFacing','version.json','10000']){
    assert.ok(js.includes(signal),signal);
  }
  assert.equal(manifest.rigged,false);
  assert.deepEqual(manifest.animationClips,[]);
});
