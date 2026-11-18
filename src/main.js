import './style.css';

const base = import.meta.env.BASE_URL;
const asset = (file) => `${base}assets/${file}`;
const currentImage = document.getElementById('character');
const currentText = document.getElementById('current-direction');
const sourceLink = document.getElementById('source-link');
const stage = document.getElementById('stage');
const surfaceToggle = document.getElementById('surface-toggle');
const descriptions = {down: 'FRONT · DOWN', up: 'BACK · UP', left: 'PROFILE · LEFT', right: 'PROFILE · RIGHT'};
const filenames = {down:'design4-front.png',up:'design4-back.png',left:'design4-left.png',right:'design4-right.png'};
let currentFacing = 'down';

function setFacing(facing) {
  if (!Object.hasOwn(filenames,facing)) return;
  currentFacing = facing;
  const file = filenames[facing];
  currentImage.src = asset(file);
  currentImage.alt = `Original chibi shrine guardian facing ${facing}`;
  currentText.textContent = descriptions[facing];
  sourceLink.href = asset(file);
  sourceLink.download = file;
  document.querySelectorAll('[data-facing]').forEach(button => {
    const active = button.dataset.facing === facing;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

document.querySelectorAll('[data-facing]').forEach(button => {
  button.addEventListener('click', () => setFacing(button.dataset.facing));
});
document.querySelectorAll('[data-view-card]').forEach(card => {
  const facing = card.dataset.viewCard;
  document.getElementById(`view-${facing}`).src = asset(filenames[facing]);
  card.addEventListener('click', () => {
    setFacing(facing);
    document.getElementById('stage').scrollIntoView({behavior:'smooth',block:'center'});
  });
});

document.getElementById('staff-image').src = asset('design4-staff.png');
document.getElementById('original-reference').src = asset('approved-design-4.webp');
surfaceToggle.addEventListener('click', () => {
  const checker = stage.dataset.surface !== 'checker';
  stage.dataset.surface = checker ? 'checker' : 'scene';
  surfaceToggle.setAttribute('aria-pressed', String(checker));
  surfaceToggle.textContent = checker ? '✦ ILLUSTRATED STAGE' : '◫ CHECK TRANSPARENCY';
});
window.addEventListener('keydown', event => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '')) return;
  const keys = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  if (Object.hasOwn(keys,event.key)) {
    event.preventDefault();
    setFacing(keys[event.key]);
  }
});
setFacing(currentFacing);

const status = document.getElementById('status');
status.textContent = import.meta.env.DEV
  ? 'LOCAL · Vite live refresh enabled'
  : 'PUBLISHED · Checking for updates every 10 seconds';
if (import.meta.env.PROD) {
  const currentBuild = __BUILD_ID__;
  let checking = false;
  async function checkForUpdate() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL(`${base}version.json`, window.location.origin);
      url.searchParams.set('t', String(Date.now()));
      const response = await fetch(url, {cache:'no-store'});
      if (!response.ok) return;
      const {buildId} = await response.json();
      if (typeof buildId === 'string' && buildId && buildId !== currentBuild) {
        const next = new URL(window.location.href);
        next.searchParams.set('build',buildId);
        window.location.replace(next.href);
      }
    } catch {
      // Remain usable during temporary network failure.
    } finally {
      checking = false;
    }
  }
  window.setInterval(checkForUpdate, 10000);
  document.addEventListener('visibilitychange', checkForUpdate);
  checkForUpdate();
}
