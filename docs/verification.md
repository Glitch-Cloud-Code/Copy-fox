# Verification: 2026-10-04

## Evidence

- `npm test`: five conversion tests pass. They cover transparent backgrounds, row orientation, luminance, every Braille dot, presets, and invalid input.
- `npm run check`: five valid glTF 2.0 GLBs with matching source hashes and credits. Local asset paths, complete vendored imports, and JavaScript syntax pass.
- `COPYFOX_BROWSER_CHANNEL=msedge npm run test:browser`: real Edge browser assertions pass at a desktop viewport and a 393 by 851 touch viewport.
- Every model produces more than 50 nonblank characters and a distinct frame.
- All three styles produce the correct character repertoire and preset dimensions.
- Actual mouse dragging, wheel zoom, keyboard controls, rotation buttons, and Reset work.
- CDP-generated single-finger touch rotates the fox. Two-finger pinch increases zoom.
- Palettes leave the text unchanged.
- Walking changes the displayed frame. Copy pauses and passes the exact frame to the Clipboard API. The clipboard round trip preserves the full grid. Windows normalizes LF to CRLF.
- Denied clipboard permission exposes the exact text selected for manual copying.
- Delayed obsolete model loads cannot replace the newest model. A failed load disables Copy and permits recovery.
- Repeated animated/static swaps return to the same GPU geometry and texture counts. The regression test catches retained skeleton bone textures.
- Large Braille rendering measured a 0.6 ms p95 on this desktop during a 30-frame local sample. This measurement is not an Android hardware claim.
- Still views make no continuous DOM updates. Animation produced 17 frames in approximately 700 ms, within the 24 fps cap.
- Axe reports no automated accessibility violations on desktop or the touch viewport.
- Reduced-motion preference starts still. A 200% text-size check has no page overflow or overlapping control labels.
- Desktop, mobile, ASCII, blocks, Braille, all-model, and enlarged-text screenshots were inspected. Screenshots and detailed output live in ignored `test-results/`.

## Resolved findings

1. Enlarged labels overlapped in a narrow two-column desktop layout. Responsive stacking and container-based control layouts fix this. The browser test now asserts control-label bounds.
2. Animated model replacement retained skeleton bone textures. Explicit skeleton disposal fixes this. Decoded ImageBitmaps are also closed.
3. Windows clipboard reads use CRLF. The test checks the exact submitted string and the round trip with only line-ending normalization.

## Residual validation

An actual Android device and Telegram desktop/Android paste were not available in this session. Browser touch emulation and plain-text clipboard checks establish app behavior. Telegram controls monospace formatting, glyph metrics, and line wrapping. Test a real message with each style before assuming identical presentation on both clients.
