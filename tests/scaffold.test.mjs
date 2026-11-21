import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GROUND, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, createGroundMap, groundAt, getTile } from '../src/terrain.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('index.html');
const main = read('src/main.js');

test('HTML retains the Vite entry and provides a top-down ground canvas', () => {
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /id="ground-map"/);
  assert.match(html, /<script type="module" src="\/src\/main\.js"><\/script>/);
  assert.match(html, /Verdant Vale/);
});

test('the map uses fixed-size tiles with valid dimensions', () => {
  const map = createGroundMap();
  assert.equal(TILE_SIZE, 16);
  assert.equal(map.width, MAP_WIDTH);
  assert.equal(map.height, MAP_HEIGHT);
  assert.equal(map.tiles.length, MAP_WIDTH * MAP_HEIGHT);
  assert.ok([...map.tiles].every((tile) => Object.values(GROUND).includes(tile)));
});

test('ground generation is deterministic and contains distinct terrain', () => {
  const first = createGroundMap();
  const second = createGroundMap();
  assert.deepEqual(first.tiles, second.tiles);
  const types = new Set(first.tiles);
  assert.ok(types.has(GROUND.GRASS));
  assert.ok(types.has(GROUND.LONG_GRASS));
  assert.ok(types.has(GROUND.LIGHT_GRASS));
  assert.ok(types.has(GROUND.PATH));
  assert.ok(types.has(GROUND.PATH_EDGE));
  assert.ok(types.has(GROUND.FLOWERS));
});

test('tile lookup handles borders and custom map dimensions', () => {
  const map = createGroundMap(10, 7);
  assert.equal(map.tiles.length, 70);
  assert.equal(getTile(map, 0, 0), groundAt(0, 0));
  assert.equal(getTile(map, 9, 6), groundAt(9, 6));
  assert.equal(getTile(map, -1, 0), null);
  assert.equal(getTile(map, 10, 0), null);
  assert.equal(getTile(map, 0, 7), null);
  assert.throws(() => createGroundMap(0, 7), RangeError);
  assert.throws(() => createGroundMap(10.5, 7), RangeError);
});

test('rendering is pixelated and ground-only, with panning but no character', () => {
  const style = read('src/style.css');
  const terrain = read('src/terrain.js');
  assert.match(style, /image-rendering: pixelated/);
  assert.match(main, /paintGround/);
  assert.match(main, /pointermove/);
  assert.match(main, /requestAnimationFrame/);
  assert.doesNotMatch(html, /<img|id="player"|character-sprite/i);
  assert.doesNotMatch(terrain, /new Player|new Enemy|createNPC|treeSprite/i);
});

test('hosted previews continue checking for deployed updates', () => {
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
