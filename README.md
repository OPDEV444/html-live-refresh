# Verdant Vale — First Steps (2D)

A deliberately small **playable top-down 2D movement test**. Contains an original female character (Liora), transparent 4-way idle/walk sprite atlases, layered grass/dirt tiles, trees, rocks, bushes and flowers, collision, camera follow, and WASD controls. No enemies, quests, or other systems yet.

## Run locally

Install Node.js >=22.12, then:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174/. Use **W A S D** (also arrow keys) to move. Diagonals normalize to the same speed; releasing keys returns Liora to idle. Camera tracks the character and stops at world bounds.

## Hosted GitHub Preview

https://opdev444.github.io/html-live-refresh/

Pushes to `main` trigger the existing GitHub Actions test/build/Pages deployment. The hosted preview checks for new deployments every 10 seconds.

## Assets and source

- `public/assets/liora-idle.png`: 4x4 atlas (down, left, right, up; four idle frames)
- `public/assets/liora-walk.png`: 8x4 atlas (eight walk frames per facing)
- `public/assets/liora-*-source.svg`: editable animation source example for each facing
- `public/assets/grass-*.png`, `path-*.png`: repeating world tiles
- `public/assets/oak-tree.png`, `bush.png`, `stone.png`, `wildflowers.png`: separate scenery sprites
- `public/assets/manifest.json`: asset dimensions, pivots, frame rates and world parameters
- `generate_assets.py`: editable procedural source for runtime assets
- `src/world.js`: deterministic map and obstacle collision
- `src/main.js`: frame-rate-independent movement, animation and camera

Use `python generate_assets.py` to regenerate assets (requires Pillow and CairoSVG).

## Verification

Run `npm test` and `npm run build`. Browser tests should check scene loading, all WASD directions, diagonal speed normalization, obstacle collision and responsive display. These are genuine hand-authored 2D game assets, not a generated mock gameplay screenshot. The game is not a finished RPG.
