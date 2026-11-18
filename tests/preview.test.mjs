import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const path = (relative) => new URL(`../${relative}`, import.meta.url);
const read = (relative) => readFileSync(path(relative), 'utf8');

test('new starting point is empty of game content', () => {
  assert.equal(existsSync(path('public/assets')), false);
  const markup = read('index.html');
  assert.match(markup, /Ready for a new game/);
  for (const tag of ['<img', '<canvas', '<video']) {
    assert.equal(markup.includes(tag), false);
  }
});

test('Vite and hosted automatic refresh remain active', () => {
  assert.ok(read('package.json').includes('"dev": "vite'));
  assert.ok(read('src/main.js').includes('version.json'));
  assert.ok(read('src/main.js').includes('10_000'));
  assert.ok(read('src/main.js').includes('window.location.replace'));
  assert.ok(read('vite.config.js').includes('__BUILD_ID__'));
});

test('GitHub Pages workflow still tests, builds and deploys', () => {
  const workflow = read('.github/workflows/deploy.yml');
  for (const expected of ['npm ci', 'npm test', 'npm run build', 'deploy-pages']) {
    assert.ok(workflow.includes(expected), expected);
  }
});
