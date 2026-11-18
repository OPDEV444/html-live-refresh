# Verdant Vale — 2D Asset Quality Update

This remains a small playable top-down 2D movement test, with one original female character (Liora), WASD/arrow-key movement, four facing directions, diagonal input, camera follow and world collisions. No combat, quests or other game systems have been added.

## Art revision

The original low-resolution character sprites and terrain textures have been replaced with the approved detailed chibi artwork and woodland tileset.

- `liora-walk.png`: 4 directions × 4 **independently illustrated** frames, RGBA 1024×1280, individual frame 256×320.
- `liora-idle.png`: 4 directions × 1 illustrated still each, RGBA 256×1280. One idle frame per facing—no simulated fake animation.
- `liora-portrait.png`: transparent down-facing portrait from the same approved art.
- Eight seamless 128×128 ground tiles extracted from the new landscape art; four grass variants and four earth path variants.
- Real transparent scenery PNGs: tree, bush, rock, flowers. Additional cleaned props (lantern, fence, signpost, cherry canopy) are included in the asset library for future approved world improvements but not yet spawned.
- Source sheets in `source-art/` are losslessly compressed WebP images; `build_assets_v2.py` regenerates transparent sprites, tile textures and prop assets, requiring Pillow, NumPy and OpenCV.
- `public/assets/manifest.json` documents exact frame counts, image dimensions, pivots, source provenance and tile paths.

The illustrated walk frames have not been re-rigged or interpolated. They are a first revision for visual approval, not certified skeletal locomotion.

## Run locally

Install Node.js >=22.12, then:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174/ and use **W A S D** (or arrow keys). Diagonal speed is normalized, idle resumes on release, obstacle collision and camera follow are unchanged.

## Hosted GitHub preview

https://opdev444.github.io/html-live-refresh/

GitHub Actions runs the tests, builds the project, and publishes pushes to `main`; already-open hosted previews check for changes every 10 seconds.

## Verify

Run `npm test` and `npm run build`. For art acceptance, manually inspect the four directional frames while moving in the live build and check tile seams, color/scale, collision and draw order. Passing source tests alone does not establish artistic approval.
