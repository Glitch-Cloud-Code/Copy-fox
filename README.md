# Copy-fox

A personal fox text-art toy with a retro terminal interface.

Rotate and zoom five fox models. Choose ASCII, Unicode blocks, or Braille, then select a Small (32 columns), Medium (48 columns), or Large (64 columns) output. Amber, Green, and Ice palettes affect only the preview. The animated fox has selectable clips and stays still until you press Play.

Copy pauses animation and copies the exact displayed frame as plain text. If clipboard access is blocked, a selected text box provides manual copying. No account or saved preferences are needed by the application.

## Telegram

Paste the fox into Telegram. Select the pasted text and apply Monospace formatting before sending. If lines wrap, use Small. Blocks and Braille can differ between desktop and Android because Telegram controls the fonts. No Premium features are required by Copy-fox.
Blocks use Unicode figure spaces (U+2007) for blank cells instead of ordinary spaces. This preserves digit-width spacing and prevents ordinary-space compression. Monospace formatting is still necessary for a uniform grid.
A zero-width word joiner (U+2060) at the start of Blocks output protects the first row from leading-whitespace trimming. It occupies no visible column. ASCII output uses ordinary spaces and has no invisible prefix.

## Controls

- Drag with a mouse or one finger to rotate.
- Scroll or pinch with two fingers to zoom.
- Use the visible rotation buttons, zoom slider, and Reset view.
- Focus the preview for arrow-key rotation, plus/minus zoom, Home reset, and Ctrl+C or Command+C copy.
- Play/Pause and animation selection appear when the model includes animation.

## Local use

Install Node.js 22 or newer, then run:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The `dist` directory is a complete static site. Hosting does not require Node.js, a build, or external runtime services. Assets and Three.js are included locally.

## Verification

```sh
npm test
npm run check
npx playwright install chromium
npm run test:browser
```

The browser test needs the local server running. On Windows, an installed Edge browser can be used by setting `COPYFOX_BROWSER_CHANNEL=msedge`. Set `COPYFOX_URL` to select a different test server. The browser suite checks models, styles, presets, input, animation, clipboard success and failure, load races, errors, accessibility, touch gestures, and responsive layout. Evidence and screenshots are written to ignored `test-results/`.

## Project boundaries

No user model imports, accounts, saved settings, or lighting and contrast controls. Still views render on demand. Animation is capped at 24 frames per second and pauses when the page is hidden. Low-resolution GPU readback keeps the cost independent of screen resolution.

## Hosting

Hosted toy: [Copy-fox](https://copy-fox.pages.dev). Cloudflare Pages serves the static `dist` directory through a Direct Upload project named `copy-fox`. Public source: [Glitch-Cloud-Code/Copy-fox](https://github.com/Glitch-Cloud-Code/Copy-fox).

To publish an update, open Cloudflare **Workers & Pages → copy-fox**. Choose **Create deployment** from the project's **More actions** menu. Upload the contents of `dist`, or a ZIP with `index.html` at its root, and select the production environment. GitHub pushes do not deploy automatically.

The previous Sites deployment remains available at [the original address](https://copy-fox.damnredcloud.chatgpt.site). Its identity is retained in `.openai/hosting.json`. Credentials are never stored in source.

## Licenses

Application code is MIT licensed. Models, Three.js, and the preview font have separate terms in [THIRD_PARTY.md](THIRD_PARTY.md). Model credits are also available within the app.
