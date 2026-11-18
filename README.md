# HTML live refresh — Rem animation preview

A Vite-powered live HTML viewer for a future game. The current visual milestone contains **only Rem** (Re:Zero) and a prototype idle/walk/run animation atlas. No game environment, collision/gameplay or other character assets are present.

## Hosted preview

https://opdev444.github.io/html-live-refresh/

Push a milestone to `main` to run GitHub Actions (`npm ci`, `npm test`, `npm run build`) and deploy to GitHub Pages. Already-open hosted tabs poll `version.json` every **10 seconds** and refresh when the published build ID changes. Deployment and CDN propagation may add delay. Chat messages alone do not modify project files.

## Local preview

Node.js 24 LTS recommended. Run `npm ci` and `npm run dev` or double-click `start-server.bat` on Windows. Open http://127.0.0.1:5174/ beside ChatGPT. Vite updates HTML/CSS/JavaScript on save. `git pull` is needed to retrieve new GitHub commits into an existing local checkout; the local Vite server does not pull from GitHub automatically.

## Animation controls

Select **Idle**, **Walk**, or **Run**; pause/play, adjust playback speed, toggle transparency checkerboard. Use keyboard `1`, `2`, `3` to switch clips and `Space` to pause/play outside inputs. Rem's canonical original illustration is available separately via the Original PNG link.

The motion atlas in `public/assets/rem-motion-atlas.webp` contains 24 frame drawings, packed 8 columns by 3 rows at 192 × 256 px per frame. Its timings and coordinates live in `public/assets/rem-motion.json`. See `public/assets/README.md` for exact asset specifications and limitations. The frames are a **visual approval prototype**: frame-by-frame, not a 2D or 3D bone rig, not gameplay-integrated, and not yet approved for production.

## Checks and build

`npm test` validates the atlas signature, 24 unique frame records, and preview controls. `npm run build` generates `dist`. `npm run preview` serves production output at http://127.0.0.1:4173/. Vite's `BASE_PATH` environment variable sets the GitHub Pages project-root path; GitHub Actions supplies it.

## Publishing

Repository **Settings → Pages → Source = GitHub Actions**. The workflow checks pull requests and deploys pushes to `main`. The GitHub Pages URL is for a web preview; packaging this into a Windows EXE needs a separate, verified desktop build.

## Provenance

The animation frames were independently generated from the original illustrated Rem reference; they are not skinned/re-rigged transformations of the original source PNG. An independent appearance and movement approval step is required before these frames become canonical.
