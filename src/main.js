import './style.css';
import { TILE_SIZE, createGroundMap, paintGround } from './terrain.js';
import { loadWorldAssets, paintEnvironment } from './environment.js';

const canvas = document.querySelector('#ground-map');
const resetButton = document.querySelector('#reset-view');
const ctx = canvas.getContext('2d', { alpha: false });
const map = createGroundMap();
const worldCanvas = document.createElement('canvas');
worldCanvas.width = map.width * TILE_SIZE;
worldCanvas.height = map.height * TILE_SIZE;
const worldCtx = worldCanvas.getContext('2d', { alpha: false });
paintGround(worldCtx, map);
// Asset loading is asynchronous. The original generated map remains visible until ready.
loadWorldAssets().then((assets) => {
  paintGround(worldCtx, map);
  paintEnvironment(worldCtx, map, assets);
  draw();
}).catch((error) => console.warn('Environment assets could not load:', error));

let cameraX = 0;
let cameraY = 0;
let scale = 3;
let initialized = false;
let dragging = false;
let pointerX = 0;
let pointerY = 0;
let frameId = 0;
let lastFrame = 0;

const heldKeys = new Set();
const movementKeys = new Set([
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd',
]);

function clampCamera() {
  cameraX = Math.max(0, Math.min(cameraX, worldCanvas.width - canvas.width));
  cameraY = Math.max(0, Math.min(cameraY, worldCanvas.height - canvas.height));
}

function draw() {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#7faf5b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(worldCanvas, -Math.round(cameraX), -Math.round(cameraY));
}

function centerMap() {
  cameraX = (worldCanvas.width - canvas.width) * 0.5;
  cameraY = (worldCanvas.height - canvas.height) * 0.5;
  clampCamera();
  draw();
}

function resize() {
  const oldCenterX = cameraX + canvas.width / 2;
  const oldCenterY = cameraY + canvas.height / 2;
  const bounds = canvas.getBoundingClientRect();
  scale = window.innerWidth <= 640 ? 2 : 3;
  canvas.width = Math.max(1, Math.ceil(bounds.width / scale));
  canvas.height = Math.max(1, Math.ceil(bounds.height / scale));
  if (!initialized) {
    initialized = true;
    centerMap();
  } else {
    cameraX = oldCenterX - canvas.width / 2;
    cameraY = oldCenterY - canvas.height / 2;
    clampCamera();
    draw();
  }
}

canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  dragging = true;
  pointerX = event.clientX;
  pointerY = event.clientY;
  canvas.classList.add('dragging');
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  cameraX -= (event.clientX - pointerX) / scale;
  cameraY -= (event.clientY - pointerY) / scale;
  pointerX = event.clientX;
  pointerY = event.clientY;
  clampCamera();
  draw();
});

function stopDragging() {
  dragging = false;
  canvas.classList.remove('dragging');
}
canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
canvas.addEventListener('lostpointercapture', stopDragging);

function step(time) {
  const elapsed = Math.min(0.05, (time - (lastFrame || time)) / 1000);
  lastFrame = time;
  const horizontal = Number(heldKeys.has('d') || heldKeys.has('arrowright'))
    - Number(heldKeys.has('a') || heldKeys.has('arrowleft'));
  const vertical = Number(heldKeys.has('s') || heldKeys.has('arrowdown'))
    - Number(heldKeys.has('w') || heldKeys.has('arrowup'));

  if (horizontal || vertical) {
    const factor = horizontal && vertical ? Math.SQRT1_2 : 1;
    cameraX += horizontal * 170 * elapsed * factor;
    cameraY += vertical * 170 * elapsed * factor;
    clampCamera();
    draw();
  }
  frameId = heldKeys.size ? requestAnimationFrame(step) : 0;
  if (!frameId) lastFrame = 0;
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (!movementKeys.has(key) || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  heldKeys.add(key);
  if (!frameId) frameId = requestAnimationFrame(step);
});
window.addEventListener('keyup', (event) => {
  heldKeys.delete(event.key.toLowerCase());
});
window.addEventListener('blur', () => heldKeys.clear());
window.addEventListener('resize', resize);
resetButton.addEventListener('click', centerMap);
resize();

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
