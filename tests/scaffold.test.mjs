import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('index.html');
const main = read('src/main.js');

test('HTML keeps a valid Vite entry point', () => {
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<script type="module" src="\/src\/main\.js"><\/script>/);
});

test('the body is visually empty', () => {
  const body = html.match(/<body>([\s\S]*?)<\/body>/i);
  assert.ok(body);
  assert.match(body[1], /^\s*<script type="module" src="\/src\/main\.js"><\/script>\s*$/);
  assert.doesNotMatch(html, /Verdant Vale|Liora|<canvas|game-panel/i);
});

test('the runtime contains no gameplay or world imports', () => {
  assert.doesNotMatch(main, /world\.js|manifest\.json|requestAnimationFrame|addEventListener\('keydown'/);
  assert.match(read('src/style.css'), /background:\s*#ffffff/);
});

test('old game data and original artwork are removed', () => {
  for (const path of ['src/world.js', 'public/assets', 'source-art', 'build_assets_v2.py', 'tests/game.test.mjs']) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false, path);
  }
});

test('hosted previews continue checking for updates', () => {
  assert.match(main, /version\.json/);
  assert.match(main, /setInterval\(checkForUpdate, 10_000\)/);
  assert.match(main, /location\.replace\(/);
});

test('the Vite and Pages deployment workflow remain configured', () => {
  const vite = read('vite.config.js');
  const workflow = read('.github/workflows/deploy.yml');
  assert.match(vite, /BASE_PATH/);
  assert.match(vite, /version\.json/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /deploy-pages/);
});
