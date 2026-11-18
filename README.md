# Moonlit Shrine Guardian — Design 4 Chibi Turnaround

The original female character **Design 4** was chosen by the user. This milestone is a four-direction chibi **visual approval** review, not an animated or playable movement build.

## Preview

- Hosted: https://opdev444.github.io/html-live-refresh/
- Local: `npm ci && npm run dev`, then http://127.0.0.1:5174/
- Arrow keys or on-screen buttons change the facing pose. They **do not** animate locomotion yet.
- GitHub Pages checks for deployed revisions every **10 seconds**; local Vite hot-reloads saved files.

## Assets

`public/assets/` contains four separated transparent directional PNGs, each 400×512 with shared foot alignment / pivot x=200, y=500. A separate staff PNG is 256×512. `manifest.json` is the authoritative source of directional file paths and status. Approved original concept image is provided as a smaller web reference; `turnaround-source.webp` preserves the generated turnaround composition for review.

## Quality / status

Original concept identity: approved. Chibi turnaround: **pending user approval**. No skeletal rig, walking, running, or individual animation frames have been authored. Separate cutout parts, independent legs, skinning, real locomotion loops, and actual in-game movement require further work **after** the chibi look and all facing angles are approved.

`npm test` validates asset dimensions and preview wiring; `npm run build` builds the site. The build tests do not by themselves establish artistic quality or runtime performance.
