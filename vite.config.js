import { defineConfig } from 'vite';

const buildId = process.env.GITHUB_SHA || new Date().toISOString();

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  plugins: [{
    name: 'preview-version',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId }) });
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  }],
});
