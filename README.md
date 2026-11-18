# HTML Live Refresh

Fresh, empty project for a future game. All previous character art, sprites, animation atlases, manifests and game-specific viewer code have been removed from the current branch. No game assets or gameplay are included.

## Hosted live preview

https://opdev444.github.io/html-live-refresh/

GitHub Actions builds and deploys every push to `main` using GitHub Pages. The open hosted page checks for a published version every **10 seconds** and reloads when it detects a new build. Deployment and CDN propagation may add extra delay.

## Local preview (Windows)

Install Node.js 24 LTS, then run:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174/ beside ChatGPT. Vite refreshes automatically when project files change. You can also double-click `start-server.bat` from the repository folder.

## Verification

Run `npm test` for the empty-project smoke tests and `npm run build` to produce `dist/`.

The GitHub repository is https://github.com/OPDEV444/html-live-refresh. The Windows local server and hosted GitHub Pages site are separate; commits appear on Pages automatically after deployment, but local files need a Git pull.

Old assets may remain accessible in Git commit history; none are present in the latest source tree.
