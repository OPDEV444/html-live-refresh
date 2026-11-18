# Rem motion asset — prototype 001

- `rem-motion-atlas.webp`: 1536 × 768 transparent atlas containing **24 independent drawn frames** (8 columns × 3 rows, idle/walk/run).
- `rem-motion.json`: clip timings, frame rectangles, dimensions, explicit provenance and QA status.
- `rem-idle.png`: canonical first illustrated character reference; remains unchanged.
- `rem-idle-preview.webp`: original static reference thumbnail; remains unchanged.

The atlas is intended for **visual approval** of Rem's animated silhouette and timing. It uses frame-by-frame animation and is **not** a bone-driven 2.5D cutout rig. No IK, skinning, blend trees or playable-game integration are claimed. The atlas and frames were generated from illustration rather than drawn by hand, with low-opacity edge artifacts removed, baseline alignment and a consistent pixel canvas applied. The exact canonical original portrait and the animated frames differ in viewpoint, so identity consistency should be reviewed before production adoption.

The live HTML player reads the atlas and JSON and tests loops at ~5.6 FPS idle / 8.7 FPS walk / 11.9 FPS run, with pause and speed controls. Local and hosted previews both use Vite's base path handling, and the hosted revision checker polls every **10 seconds**. Animated frames are not included as individual PNGs in this repository; use the separately packaged 24-frame ZIP from the milestone delivery if needed.
