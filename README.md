# HTML Live Refresh

Empty project scaffold for a new game. All previous game assets, character designs and game-specific preview components have been removed from the current branch. No replacement game has been started.

## Hosted preview

https://opdev444.github.io/html-live-refresh/

Every push to `main` triggers a GitHub Actions build and GitHub Pages deployment. An open hosted preview checks for new builds every **10 seconds**, and refreshes automatically when a new published revision is available. Deployment and caching may add additional delay.

## Local Vite preview

Install Node.js 24 LTS. From a checkout of this repository:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174/. Alternatively run `start-server.bat` on Windows. Files saved locally trigger Vite hot reload. Pull new commits to synchronize local files with the GitHub repository.

## Build and smoke tests

```sh
npm test
npm run build
```

The old game art remains in Git history, but no old assets are tracked in the current branch.
