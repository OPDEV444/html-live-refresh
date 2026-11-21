# Verdant Vale — The Meadows

A pixel-art, top-down ground tilemap built with Vite. This is the first terrain-only scene: no character, buildings, trees, NPCs, or gameplay systems yet.

## Current terrain

- 84 × 64 tiles, drawn at 16 × 16 pixels each.
- Several grass shades, long-grass patches, tiny ground flowers, and intersecting dirt trails.
- Deterministic tile generation and hand-drawn pixel textures rendered on Canvas 2D.
- No image downloads or runtime asset dependencies.

## Explore the map

- Drag with your mouse or finger to pan.
- Use WASD or the arrow keys to pan with a keyboard.
- Select **Recenter** to return to the middle.

## Run locally

Requires Node.js 22.12 or newer.

    npm ci
    npm run dev

Open http://127.0.0.1:5174/ to see the map.

## Verify

    npm test
    npm run build

## Deployment and refresh

GitHub Actions tests pull requests and deploys merges to main on GitHub Pages:

https://opdev444.github.io/html-live-refresh/

The existing version.json check in the production entry point refreshes already-open hosted pages after a new build is deployed. The separately maintained PC launcher is local-only. A pull request alone does not update GitHub Pages or the local clone that syncs main.
