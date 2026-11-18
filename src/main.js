import './style.css';

const status = document.querySelector('#status');
status.textContent = import.meta.env.DEV
  ? 'LOCAL · Vite live refresh enabled'
  : 'PUBLISHED · Checking for updates every 10 seconds';

if (import.meta.env.PROD) {
  const currentBuild = __BUILD_ID__;
  const base = import.meta.env.BASE_URL;
  let checking = false;

  async function checkForUpdate() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL(`${base}version.json`, window.location.origin);
      url.searchParams.set('t', String(Date.now()));
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;
      const { buildId } = await response.json();
      if (typeof buildId === 'string' && buildId && buildId !== currentBuild) {
        const next = new URL(window.location.href);
        next.searchParams.set('build', buildId);
        window.location.replace(next.href);
      }
    } catch {
      // Keep the preview usable during a temporary network interruption.
    } finally {
      checking = false;
    }
  }

  window.setInterval(checkForUpdate, 10_000);
  document.addEventListener('visibilitychange', checkForUpdate);
  checkForUpdate();
}
