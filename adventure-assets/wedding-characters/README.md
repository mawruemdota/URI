# URI Adventure — Formal Wedding Characters

Two original, independently created 32×32 pixel-art playable characters, designed for URI Adventure Invitation:

- **Female in Gown** (`gown`): ivory full-length gown with soft rose details, long hair and a jeweled headpiece.
- **Male in Barong** (`barong`): embroidered ivory Filipino barong, dark formal trousers and black shoes.

Each character has four transparent RGBA PNG animation sheets: `idle` (4 frames), `run` (6 frames), `jump` (1 frame), `fall` (1 frame). Each frame is 32×32 and the frames are arranged horizontally. Character assets were designed and generated specifically for URI and do **not** belong to the Pixel Frog third-party art pack.

They appear **only in the event owner's Game Template Manager**. Viewers see the selected playable main character directly and never choose their own. The owner selection is persisted as `adventure.character = "gown" | "barong"`.

`adventure-real-assets.js` preloads the corresponding PNG animation sheets into Phaser, creates state animations with the correct frame count, and uses the first idle frame for the selection portrait and dashboard cover. A distinct pixel-painted fallback exists in `adventure-pixels.js`.
