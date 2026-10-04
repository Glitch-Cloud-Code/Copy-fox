# Copy-fox delivery status

Product scope confirmed in chat on 2026-10-04. The user then authorized implementation.
Agent-owned technical decisions below support that instruction. They are not separately user-approved gates.

- Product: confirmed.
- Architecture, program design, and slices: recorded for authorized implementation.
- [x] Slice 1: one real fox through the text renderer. Manager ACCEPT after real GLB output and conversion assertions.
- [x] Slice 2: styles, size presets, palettes, and camera controls. Manager ACCEPT after desktop and CDP touch gesture assertions.
- [x] Slice 3: five model assets and animation with copy freeze. Manager ACCEPT after distinct model, animation, clipboard, and resource cleanup assertions.
- [x] Slice 4: accessibility, error paths, responsive and interaction evidence. Manager ACCEPT after browser tests and screenshot inspection.
- [ ] Slice 5: public GitHub repository and verified hosted link.

## Goal contract

GOAL: A hosted, personal fox text-art toy named Copy-fox.
IN SCOPE: Five varied fox models, ASCII/blocks/Braille, size presets, camera controls, palettes, optional model animation, frozen-frame plain-text copy, model credits, public GitHub source.
OUT OF SCOPE: User imports, accounts, persistence, lighting and contrast controls.
DONE WHEN: Each model and style works, camera changes update text, copying freezes and exports the displayed frame, desktop and Android-sized layouts work, public source and hosted link exist.
CONSTRAINTS: Keep Shockwave Fest untouched. No required server or account. Preserve model license terms. Still by default. Keyboard-accessible controls and restrained motion.
EVIDENCE: Text conversion unit tests, real-browser checks, desktop/mobile screenshots, asset provenance, publishing status.

## Joint preflight

ARCHITECTURE: Static client, local model assets and renderer dependency. One model active. Dispose obsolete loads and GPU assets. Render on demand while still, cap animation at 24 frames/second. Use a small render target independent of screen size.
DESIGN: Amber terminal workspace, large text fox, controls beside it on desktop and below on phones. Strong labels and visible focus. No decorative animation or flashing. Preview colors never enter clipboard text.
CODING: Separate pure character conversion from Three.js scene and input logic. Keep presets and model metadata explicit. Use retained static output for hosting.
MANAGEMENT: Accept only after each criterion has named evidence. Actual Android Telegram paste remains a manual validation if no device is available.
CONVERGENCE: One real asset first, then controls, then asset collection and animation, then quality and publication. Reject server rendering and a second visible 3D viewport as unnecessary.

## Review before publication

ARCHITECT: ACCEPT. Separate static project, pure conversion module, sequenced loads, explicit resource disposal, on-demand still rendering, and capped animation. Repeated animated/static swaps return to the graphics resource baseline.
DESIGNER: ACCEPT. All three styles are visible, five silhouettes differ, desktop and phone controls work, reduced motion starts still, and enlarged labels no longer overlap. Representative screenshots inspected.
CODER: ACCEPT. Five conversion tests, static checks, and real Edge browser assertions pass. Loading races, load failure, blocked clipboard, actual clipboard round trip, mouse, keyboard, and CDP touch are covered.
MANAGER: ACCEPT the tested source for publication. Actual Android hardware and Telegram client paste remain a named manual validation. Final release acceptance requires native deployment success and public GitHub source verification.
