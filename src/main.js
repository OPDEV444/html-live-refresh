import './style.css';

// Intentionally no game content: this is a blank starting point.
// Keep the hosted preview's version check so existing tabs refresh after deployment.
if (import.meta.env.PROD) {
  const currentBuild = __BUILD_ID__;
  const base = import.meta.env.BASE_URL;
  let checking = false;

  async function checkForUpdate() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL(`${base}version.json`, location.origin);
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
