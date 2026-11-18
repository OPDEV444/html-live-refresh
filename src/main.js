import './style.css';

const basePath = import.meta.env.BASE_URL;
const sprite = document.querySelector('#character-art');
const fullResolution = document.querySelector('#original-asset');

// The original transparent PNG is stored as a real tracked asset.
// The smaller preview keeps the live HTML page lightweight.
sprite.src = `${basePath}assets/rem-idle-preview.webp`;
fullResolution.href = `${basePath}assets/rem-idle.png`;

const status = document.querySelector('#status');
status.textContent = import.meta.env.DEV
  ? 'LOCAL · Vite live refresh enabled'
  : 'PUBLISHED · Auto-check every 15 seconds';

if (import.meta.env.PROD) {
  const currentBuild = __BUILD_ID__;
  let checking = false;
  async function checkForUpdate() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL(`${import.meta.env.BASE_URL}version.json`, location.origin);
      url.searchParams.set('t', Date.now());
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      const { buildId } = await response.json();
      if (typeof buildId === 'string' && buildId && buildId !== currentBuild) {
        const next = new URL(location.href);
        next.searchParams.set('build', buildId);
        if (next.searchParams.get('build') !== new URL(location.href).searchParams.get('build')) {
          location.replace(next.href);
        }
      }
    } catch {
      // Keep the preview usable during temporary network failures.
    } finally {
      checking = false;
    }
  }
  setInterval(checkForUpdate, 15000);
  document.addEventListener('visibilitychange', checkForUpdate);
  checkForUpdate();
}
