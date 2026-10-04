# Verification: 2026-10-04

## Evidence

- `npm test`: six conversion tests pass. They cover transparent backgrounds, row orientation, luminance, every Braille dot, presets, invalid input, and protected Blocks spacing.
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
- Large Braille rendering measured a 1.7 ms p95 on this desktop during the final 30-frame local sample. This measurement is not an Android hardware claim.
- Still views make no continuous DOM updates. Animation produced 17 frames in approximately 700 ms, within the 24 fps cap.
- Axe reports no automated accessibility violations on desktop or the touch viewport.
- Reduced-motion preference starts still. A 200% text-size check has no page overflow or overlapping control labels.
- Desktop, mobile, ASCII, blocks, Braille, all-model, and enlarged-text screenshots were inspected. Screenshots and detailed output live in ignored `test-results/`.

## Resolved findings

1. Enlarged labels overlapped in a narrow two-column desktop layout. Responsive stacking and container-based control layouts fix this. The browser test now asserts control-label bounds.
2. Animated model replacement retained skeleton bone textures. Explicit skeleton disposal fixes this. Decoded ImageBitmaps are also closed.
3. Windows clipboard reads use CRLF. The test checks the exact submitted string and the round trip with only line-ending normalization.
4. The user reported compressed Blocks spaces and removed first-row indentation in Telegram. Blocks now uses digit-width figure spaces and a zero-width word joiner at the start. Browser tests verify equal glyph advances, a zero-width marker, trim resistance, and preservation through the actual clipboard. Monospace formatting remains necessary. The user's Telegram client still needs to confirm the workaround.
5. A browser check exposed a first-frame readiness race. Copy now becomes available only after rendering the first visible text frame.

## Publication

Public repository verified at https://github.com/Glitch-Cloud-Code/Copy-fox. The initial Sites deployment succeeded at https://copy-fox.damnredcloud.chatgpt.site. The hosted toy is owner-private by default. The Blocks correction is prepared for publication as the next revision.

On Windows, the Sites packaging helper uses Git Bash and `TAR_OPTIONS=--force-local` to avoid WSL and drive-letter archive-path errors. This is a local packaging adjustment, not an application dependency.

## Residual validation

An actual Android device and Telegram desktop/Android paste were not available in this session. Browser touch emulation and plain-text clipboard checks establish app behavior. Telegram controls monospace formatting, glyph metrics, and line wrapping. Test a real message with each style before assuming identical presentation on both clients.
