# HTML live refresh

A blank HTML project for a future game. No game assets are included.

## Local preview

Use Node.js 24 LTS. Run `npm ci`, then `npm run dev`, and open http://127.0.0.1:5174. Saving HTML, CSS or JavaScript updates the preview automatically.

## Hosted preview

https://OPDEV444.github.io/html-live-refresh/

Push a milestone to `main` to build and deploy through GitHub Actions. The open hosted page checks for a new build every 15 seconds and reloads after publication. Deployment and CDN propagation can add delay. Chat messages alone do not change the preview.

## Build

`npm run build` creates `dist`; `npm run preview` serves it at http://127.0.0.1:4173.

## Deployment configuration

Repository Settings → Pages → Source must be GitHub Actions. The workflow builds pull requests without publishing and deploys pushes to main. It uses the repository name as the URL base path. For a custom domain or user-root site, change BASE_PATH to `/` in the workflow.

Edit `index.html`, `src/main.js`, and `src/style.css` to begin development. Future static files can go in `public/`.


## Verification

Verified on 2026-11-18: clean npm install, production build with the repository base path, local HTTP 200, HTML edit appearing automatically in the open browser, and successful GitHub Actions build and Pages deployment. Local port is 5174 to avoid another running application.

