import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { WORLD_ASSETS } from '../src/environment.js';

test('world artwork is stored one image per asset', () => {
  const entries = Object.entries(WORLD_ASSETS);
  assert.ok(entries.length >= 20);
  const files = entries.map(([, file]) => file);
  assert.equal(new Set(files).size, files.length);
  for (const file of files) {
    const url = new URL('../public/assets/world/' + file, import.meta.url);
    assert.ok(existsSync(url), 'missing asset ' + file);
    if (file.endsWith('.svg')) {
      const xml = readFileSync(url, 'utf8');
      assert.match(xml, /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.doesNotMatch(xml, /<image[^>]+href=/);
    }
  }
});

test('environment assets load relative to the Vite deployment base', () => {
  const code = readFileSync(new URL('../src/environment.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(code, /import\.meta\.env\.BASE_URL/);
  assert.match(code, /paintEnvironment/);
  assert.match(main, /loadWorldAssets/);
  assert.match(main, /paintEnvironment/);
  assert.match(main, /version\.json/);
});
