# Verdant Vale — Plantation Environment

A top-down Vite browser game with a deterministic 84 × 64 ground tilemap and a first-pass, sci-fi anime-inspired environment. This branch adds the environment independently from the character/HUD work.

## Environment asset pack

Each asset lives in its **own image file** at `public/assets/world/`. There is no atlas or combined sprite sheet.

- Eight individual 16×16 terrain textures (grass shades, tall grass, path, edge, flowers, paving and water)
- Four sci-fi facilities, including an individually generated transparent Plantation building PNG
- Twelve separate landscape/prop sprites (cherry blossom tree, pine tree, bushes, flowers, rocks, terminal, lamp, bench, fence, banner, sign, planter)

The scene includes a small lake, paved entrance, a main Plantation building, dormitory, clinic and research lab, plus environmental props. The building assets use the established bright white/pink/cyan aesthetic; the art is an original game interpretation rather than extracted anime artwork.

### Technical details

- `src/terrain.js` remains the deterministic ground generator and canvas fallback.
- `src/environment.js` loads separate images using `import.meta.env.BASE_URL`, overlays them on the same canvas and places decorative props.
- Images are loaded once and painted into the off-screen map canvas; missing assets fall back to the original terrain.
- This is *visual scenery only*. Buildings and props do not yet have collision data or interaction scripts. Character animation, UI and future areas can be integrated in separate PRs.

## Run

Requires Node.js 22.12+.

```sh
npm ci
npm run dev
npm test
npm run build
```

Open http://127.0.0.1:5174/ .

## GitHub Pages

https://opdev444.github.io/html-live-refresh/

GitHub Actions tests PRs and deploys merges into `main`. The existing `version.json` check remains unchanged for automatic reloads.
