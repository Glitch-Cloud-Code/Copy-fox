# Program design: Copy-fox

## Files
- dist/index.html: accessible single-screen workspace and import map.
- dist/styles.css: responsive terminal theme.
- dist/js/text-art.js: pure pixel-to-character conversion and presets.
- dist/js/fox-scene.js: asset lifecycle, projection, camera, and animation.
- dist/js/app.js: controls, pointer gestures, frame scheduling, and clipboard.
- dist/models.json and dist/assets/models/: model collection and provenance.
- dist/vendor/: pinned Three.js runtime, loaders, and license.
- scripts/: local server, vendor refresh, and static checks.
- tests/: conversion and real-browser evidence.
- README.md and LICENSE: use, development, deployment, and source license.

## Types and signatures
```js
getDimensions(style, preset) // { columns, rows, width, height }
pixelsToText(pixels, width, height, style) // string, pixels in WebGL bottom-up order
FoxScene.load(model) // Promise with animation clip names
FoxScene.render(style, preset) // exact visible text string
FoxScene.dispose() // release runtime resources
```

## Call stack
Selection -> scene.load -> normalize -> update controls -> request render -> pixelsToText -> pre.textContent.
Pointer/keyboard control -> update camera -> request render.
Play -> requestAnimationFrame -> mixer.update -> render, capped at 24 fps.
Copy -> pause -> capture pre.textContent -> clipboard write or selection fallback.

## Test plan
1. Transparent pixels remain blank for every style.
2. Luminance mapping preserves dark and light regions and vertical orientation.
3. Each Braille sample maps to its correct dot position.
4. Presets produce fixed dimensions under a compact character budget.
5. Every real model loads and produces measurable nonblank output.
6. Styles, gestures, zoom, keyboard controls, and reset change or restore output.
7. Playing changes output. Copy pauses and writes the exact frame.
8. Fast model changes cannot apply stale loads. Failed loads and clipboard permissions remain usable.
9. Desktop, phone, reduced-motion, and large text layouts remain usable.

## Least confident decisions
1. Unicode glyph metrics vary between Telegram clients. Instructions and actual client validation remain necessary.
2. Model orientations and formats need runtime inspection. Store a per-model default view.
3. Mobile GPU readback cost. Keep the render target small and render still scenes only on demand.
