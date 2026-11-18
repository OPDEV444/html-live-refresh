import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const file = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(file(path), 'utf8');

test('empty workspace contains no game assets', () => {
  assert.equal(existsSync(file('public/assets')), false);
  assert.equal(existsSync(file('public/assets/rem-idle.png')), false);
  for (const tag of ['<img', '<canvas', '<video']) {
    assert.ok(!read('index.html').includes(tag), tag);
  }
});

test('Vite preview and 10-second hosted refresh are preserved', () => {
  assert.ok(read('package.json').includes('"dev": "vite'));
  assert.ok(read('src/main.js').includes('version.json'));
  assert.ok(read('src/main.js').includes('10_000'));
  assert.ok(read('src/main.js').includes('window.location.replace'));
  assert.ok(read('vite.config.js').includes('__BUILD_ID__'));
});

test('GitHub Pages deployment workflow remains configured', () => {
  const workflow = read('.github/workflows/deploy.yml');
  for (const command of ['npm ci', 'npm test', 'npm run build', 'deploy-pages']) {
    assert.ok(workflow.includes(command), command);
  }
});
