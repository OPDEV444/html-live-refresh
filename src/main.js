import './style.css';

const base = import.meta.env.BASE_URL;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canvas = $('#motion-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const stage = $('#stage');
const loadingMessage = $('#loading-message');
const clipName = $('#clip-name');
const frameCounter = $('#frame-counter');
const playButton = $('#toggle-play');
const speedInput = $('#speed');
const speedLabel = $('#speed-value');
const surfaceButton = $('#surface-toggle');
const status = $('#status');

$('#original-asset').href = `${base}assets/rem-idle.png`;
$('#atlas-asset').href = `${base}assets/rem-motion-atlas.webp`;

let sheet = null;
let definitions = null;
let clipKey = 'idle';
let frameIndex = 0;
let elapsed = 0;
let speed = 1;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastTick = null;

function currentClip() { return definitions?.animationClips?.[clipKey] ?? null; }
function labelFrame() {
  const clip = currentClip();
  clipName.textContent = clipKey.toUpperCase();
  frameCounter.textContent = `FRAME ${String(frameIndex + 1).padStart(2,'0')} / ${String(clip?.frameCount || 8).padStart(2,'0')}`;
}
function updateButtons() {
  $$('[data-clip]').forEach((button) => {
    const active = button.dataset.clip === clipKey;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed', String(active));
  });
  playButton.innerHTML = playing ? 'Ⅱ <span>Pause</span>' : '▶ <span>Play</span>';
  playButton.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
}
function drawFrame() {
  if (!sheet || !ctx) return;
  const frame = currentClip()?.frames[frameIndex];
  if (!frame) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sheet,frame.x,frame.y,frame.w,frame.h,0,0,canvas.width,canvas.height);
  labelFrame();
}
function selectClip(key) {
  if (!definitions?.animationClips?.[key]) return;
  clipKey = key;
  frameIndex = 0;
  elapsed = 0;
  lastTick = null;
  updateButtons();
  drawFrame();
}
function togglePlayback() {
  playing = !playing;
  lastTick = null;
  updateButtons();
}

$$('[data-clip]').forEach(button => button.addEventListener('click',() => selectClip(button.dataset.clip)));
playButton.addEventListener('click',togglePlayback);
speedInput.addEventListener('input',() => {
  speed = Number(speedInput.value);
  speedLabel.textContent = `${speed.toFixed(2).replace(/\.00$/,'').replace(/0$/,'')}×`;
});
surfaceButton.addEventListener('click',() => {
  const checker = stage.dataset.surface !== 'checker';
  stage.dataset.surface = checker ? 'checker' : 'scene';
  surfaceButton.setAttribute('aria-pressed',String(checker));
  surfaceButton.textContent = checker ? 'Illustrated stage' : 'Transparency check';
});
document.addEventListener('keydown',(e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
  if (e.key === '1') selectClip('idle');
  if (e.key === '2') selectClip('walk');
  if (e.key === '3') selectClip('run');
  if (e.code === 'Space') { e.preventDefault(); togglePlayback(); }
});

function render(now) {
  if (lastTick == null) lastTick = now;
  const dt = Math.min(now-lastTick,120);
  lastTick = now;
  const clip = currentClip();
  if (clip && playing && !document.hidden) {
    elapsed += dt * speed;
    const duration = clip.frames[frameIndex].durationMs;
    if (elapsed >= duration) {
      elapsed %= duration;
      frameIndex = (frameIndex + 1) % clip.frameCount;
      drawFrame();
    }
  }
  window.requestAnimationFrame(render);
}

async function start() {
  try {
    if (!ctx) throw new Error('Canvas 2D is unavailable.');
    const response = await fetch(`${base}assets/rem-motion.json`,{ cache: 'no-store' });
    if (!response.ok) throw new Error(`Motion manifest HTTP ${response.status}`);
    definitions = await response.json();
    const clips = definitions.animationClips;
    if (!clips || !['idle','walk','run'].every(name => clips[name]?.frames?.length === 8)) throw new Error('Incomplete animation clips.');
    sheet = new Image();
    sheet.src = `${base}assets/rem-motion-atlas.webp`;
    await sheet.decode();
    const expected = definitions.dimensions;
    if (sheet.naturalWidth !== expected.atlasWidth || sheet.naturalHeight !== expected.atlasHeight) throw new Error('Unexpected animation atlas dimensions.');
    loadingMessage.hidden = true;
    updateButtons();
    drawFrame();
    window.requestAnimationFrame(render);
  } catch(error) {
    loadingMessage.hidden = false;
    loadingMessage.textContent = `Unable to load animation: ${error.message}`;
    $('#animation-status').textContent = 'Load failed — preview unavailable';
    console.error('Rem animation loading failed',error);
  }
}

status.textContent = import.meta.env.DEV
  ? 'LOCAL · Vite live refresh enabled'
  : 'PUBLISHED · Auto-check every 10 seconds';

if (import.meta.env.PROD) {
  const currentBuild = __BUILD_ID__;
  let checking = false;
  async function checkForUpdate() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL(`${base}version.json`, location.origin);
      url.searchParams.set('t',String(Date.now()));
      const response = await fetch(url,{ cache:'no-store' });
      if (!response.ok) return;
      const { buildId } = await response.json();
      if (typeof buildId === 'string' && buildId && buildId !== currentBuild) {
        const next = new URL(location.href);
        if (next.searchParams.get('build') !== buildId) {
          next.searchParams.set('build',buildId);
          location.replace(next.href);
        }
      }
    } catch(error) {
      console.debug('Preview update check deferred', error);
    } finally { checking = false; }
  }
  window.setInterval(checkForUpdate,10000);
  document.addEventListener('visibilitychange',checkForUpdate);
  checkForUpdate();
}
start();
