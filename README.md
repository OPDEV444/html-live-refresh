# Verdant Vale

A keyboard-driven Vite adventure on the original 84 × 64 meadow. The Garden is the playable area. The location archive lists the approved route through Plantation 13 / Mistilteinn, Cerasus Inner City, Abandoned Town, Gran Crevasse, Mars Orbit, VIRM Homeworld and New Community / Earth. Later maps and buildings await artwork and level design.

## Play

Use WASD or the arrow keys to move one tile at a time. Hold Shift to run. Z interacts, confirms, reveals text or advances dialogue. X cancels or goes back. Esc opens the pause menu. Use W/S or the arrow keys and Z to select an entry. Menu controls also accept mouse input.

Read the relay beside the starting tile to collect the Garden field pass. Bag shows the pass, Party shows the active pilot, and Map displays the actual meadow and current position. Save writes to one browser-local slot and can restore it. Settings changes typewriter speed. Quit returns to the title screen after confirmation. Starting a new session preserves the existing save until you explicitly save again.

## Run and verify

Requires Node.js 22.12 or newer.

    npm ci
    npm run dev
    npm test
    npm run build

The development server uses http://127.0.0.1:5174/. The existing Pages workflow tests PRs and deploys main. Production clients retain the version check for new deployments.

## Art and maps

- `src/world.js` holds the route and Garden definition, including the terrain factory, painter, spawn and solid objects. `src/terrain.js` supplies the existing ground. `src/field.js` composites the terrain, props and actor in foot-depth order.
- `src/assets/pilot-walk.png` uses the supplied ZIP's 896 × 928 RGBA sheet. Its 224 × 232 cells contained soft edge alpha and uneven margins. Each silhouette was cropped, resized with nearest-neighbor sampling, given binary alpha and aligned to a common foot anchor in a 32 × 48 cell. Rows face down, up, left and right. Column zero is the directional idle. Each direction keeps its idle head registered throughout the walk. A shared pixel palette limits edge noise. The source repeats one stepping pose in the front and back rows, so the alternate boot contact is reconstructed from that pose. Side views include both supplied strides.
- `src/pilot.js` defines animation cells, tile timing and the foot anchor. `src/hud.js` supplies the dialogue and panels. `src/assets/zero-two.webp` isolates the pilot portrait from the supplied concept. The HUD frames and icons are rendered with CSS and SVG.
