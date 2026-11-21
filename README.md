# Blank Browser Game

This repository is now an **empty Vite browser-game starting point**. The previous Verdant Vale gameplay, character, world, and artwork have been removed. The page is intentionally plain white, with no visible UI or gameplay.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174/ to see the blank page.

## Verify

```sh
npm test
npm run build
```

## Deployment and refresh

GitHub Actions checks pull requests and deploys merges to `main` to GitHub Pages:

https://opdev444.github.io/html-live-refresh/

The existing `version.json` check remains in the production entry point so already-open hosted pages refresh when new builds are deployed. Local Vite reload and the separately maintained PC launcher are unaffected. An unmerged PR does not change the hosted game or a local clone syncing `main`.
