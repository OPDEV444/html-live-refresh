import './style.css';
import { garden, canEnter, adjacentRelay } from './world.js';
import { GROUND, getTile } from './terrain.js';
import { createPilot, beginStep, advance } from './pilot.js';
import { createField } from './field.js';
import { createHud } from './hud.js';
import { readSave, writeSave } from './session.js';

const map = garden.createMap();
const state = { hasPass: false, textSpeed: 'Standard' };
let pilot = createPilot(garden.spawn);
const canvas = document.getElementById('ground-map');
const coordinates = document.getElementById('coords');
const keys = new Map();
const shifts = new Set();
const bindings = { w:'up', a:'left', s:'down', d:'right', arrowup:'up', arrowleft:'left', arrowdown:'down', arrowright:'right' };
let buffered = null;
let field;

function release() {
  keys.clear();
  shifts.clear();
  buffered = null;
}
function interact() {
  if (pilot.step) return;
  if (adjacentRelay(garden, pilot)) {
    const text = state.hasPass
      ? ['That relay already logged our pass. The next stop on the route is Mistilteinn.']
      : ['A Garden relay. Let’s see what it picked up.', 'A field pass, just for us. I’ll keep it in the bag.'];
    hud.talk(text.map(line => ({ text: line })), () => { state.hasPass = true; });
    return;
  }
  const ground = getTile(map, pilot.x, pilot.y);
  const line = ground === GROUND.PATH || ground === GROUND.PATH_EDGE
    ? 'Someone walked this trail before us. I wonder where they went.'
    : ground === GROUND.FLOWERS ? 'Look at those little flowers. They grew all the way out here.' : 'It’s quiet here. You can hear the grass move.';
  hud.talk([{ text: line }]);
}
function update() {
  if (!field) return;
  field.draw(pilot);
  coordinates.textContent = 'X ' + String(pilot.x).padStart(2,'0') + '  /  Y ' + String(pilot.y).padStart(2,'0');
}
const hud = createHud(state, {
  release, interact,
  save: () => writeSave(localStorage, pilot, state),
  load() {
    const save = readSave(localStorage, map);
    if (!save) return false;
    pilot = createPilot(save);
    state.hasPass = save.hasPass;
    state.textSpeed = save.textSpeed;
    update();
    return true;
  },
  reset() {
    pilot = createPilot(garden.spawn);
    state.hasPass = false; state.textSpeed = 'Standard'; update();
  },
});

function step(dir) {
  return beginStep(pilot, dir, shifts.size > 0, (x, y) => canEnter(garden, map, x, y));
}
window.addEventListener('keydown', event => {
  if (event.metaKey || event.altKey || event.ctrlKey || !field) return;
  const k = event.key.toLowerCase();
  if (event.repeat) {
    if (Object.hasOwn(bindings, k) || ['z','x','escape','enter',' '].includes(k)) event.preventDefault();
    return;
  }
  if (hud.key(k, event.shiftKey)) { event.preventDefault(); return; }
  if (k === 'shift') { shifts.add(event.code); return; }
  if (!Object.hasOwn(bindings, k)) return;
  event.preventDefault();
  keys.set(k, bindings[k]);
  if (pilot.step) buffered = bindings[k];
  else step(bindings[k]);
});
window.addEventListener('keyup', event => {
  keys.delete(event.key.toLowerCase());
  if (event.key === 'Shift') shifts.delete(event.code);
});
window.addEventListener('blur', release);
document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

async function start() {
  field = await createField(canvas, document.getElementById('overview'), garden, map);
  function resize() { field.resize(); update(); }
  new ResizeObserver(resize).observe(canvas);
  resize();
  let previous;
  function tick(time) {
    const elapsed = Math.min(50, time - (previous ?? time));
    previous = time;
    if (hud.mode === 'field') {
      const moved = Boolean(pilot.step);
      advance(pilot, elapsed);
      if (!pilot.step) {
        const dir = buffered || [...keys.values()].at(-1);
        buffered = null;
        if (dir) step(dir);
      }
      if (moved || pilot.step || keys.size) update();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
start().catch(() => {
  document.getElementById('speech').textContent = 'Character artwork could not be loaded. Reload the page to retry.';
  document.getElementById('state').textContent = 'Offline';
  document.getElementById('talk').disabled = true;
  document.getElementById('menu-toggle').disabled = true;
});

// Keep the existing hosted-preview refresh mechanism intact.
if (import.meta.env.PROD) {
  const currentBuild = __BUILD_ID__;
  const base = import.meta.env.BASE_URL;
  let checking = false;

  async function checkForUpdate() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL(base + 'version.json', location.origin);
      url.searchParams.set('t', String(Date.now()));
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      const { buildId } = await response.json();
      if (buildId && buildId !== currentBuild) {
        const next = new URL(location.href);
        next.searchParams.set('build', buildId);
        location.replace(next.href);
      }
    } catch {
      // A network error should not interrupt the page.
    } finally {
      checking = false;
    }
  }

  setInterval(checkForUpdate, 10_000);
  document.addEventListener('visibilitychange', checkForUpdate);
  checkForUpdate();
}
