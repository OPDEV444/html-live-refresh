# Rem · 2.5D Chibi Eight-Direction Animation Preview

The live GitHub Pages preview now presents Rem in a consistent chibi anime style across eight compass directions. The previous user-rejected walking atlas remains in the repository only for version history and is no longer used by the player.

## Preview

https://opdev444.github.io/html-live-refresh/

Use the on-screen 8-way D-pad, or hold arrow keys to move. Two arrow keys combine into a diagonal. Hold Shift while moving to run. Select Idle, Walk, or Run explicitly to preview loops, adjust playback speed, and toggle the transparency checker.

## Architecture

- Vite local hot-reload; GitHub Actions deploys pushes to main. Hosted preview checks new builds every **10 seconds**.
- Chibi art: one eight-angle character turnaround, with matching hairstyle, clothes, decorations and proportions across directions.
- Runtime: 3 transparent WebP atlases, 8 compass directions × 8 frames for each Idle / Walk / Run clip; requestAnimationFrame loop with delta-time movement and keyboard/pointer controls.
- Frames: 256×256 normalized pivots, per-clip FPS metadata, 8-way frame coordinates. The animation frames use deterministic mesh deformation derived from one directional source per facing. This is **not** a skeletal rig or final foot-locked locomotion.
- New art replaces the prior character animation viewer; the original full-resolution Rem PNG is retained as a reference.

## Verification and limitations

`npm ci && npm test && npm run build` runs source/asset verification and the production build. The still artwork and direction switching are ready to inspect. The walk/run gait and cloth motion remain prototypes needing professional rigging, foot planting, and final animation approval; successful automated tests do not prove artistic quality.

Windows local preview: `npm ci && npm run dev` and open http://127.0.0.1:5174/. GitHub Pages preview updates after deployment; it does not directly change your PC files.
