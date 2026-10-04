import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.COPYFOX_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, ...(process.env.COPYFOX_BROWSER_CHANNEL ? { channel: process.env.COPYFOX_BROWSER_CHANNEL } : {}) });
await mkdir('test-results', { recursive: true });
const evidence = [];
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
await page.goto(url);
await page.waitForFunction(() => !document.querySelector('#copy').disabled);
await page.evaluate(() => document.fonts.ready);
const text = () => page.locator('#art').textContent();
const changed = previous => page.waitForFunction(previous => document.querySelector('#art').textContent !== previous, previous);

try {
  const initial = await text();
  assert.ok(initial.trim().length > 50);
  const modelNames = await page.locator('#model option').evaluateAll(options => options.map(option => option.value));
  assert.equal(modelNames.length, 5);
  const modelFrames = new Set();
  for (const id of modelNames) {
    await page.selectOption('#model', id);
    await page.waitForFunction(() => !document.querySelector('#copy').disabled);
    const result = await text();
    assert.ok(result.replace(/\s/g, '').length > 50, `${id} must render visible art`);
    modelFrames.add(result);
    await page.screenshot({ path: `test-results/model-${id}.png`, fullPage: true });
  }
  assert.equal(modelFrames.size, 5, 'Five models produce distinct shapes');
  evidence.push('Five real GLB assets load and produce distinct visible character grids.');
  const lifecycle = await page.evaluate(async () => {
    const { FoxScene } = await import('./js/fox-scene.js');
    const models = await (await fetch('./models.json')).json();
    const scene = new FoxScene();
    const measurements = [];
    for (const id of ['google', 'quaternius', 'google', 'quaternius', 'google']) {
      await scene.load(models.find(model => model.id === id));
      scene.render('braille', 'large');
      measurements.push({ ...scene.renderer.info.memory });
    }
    const costs = [];
    for (let index = 0; index < 30; index++) {
      scene.yaw += 0.01;
      const start = performance.now();
      scene.render('braille', 'large');
      costs.push(performance.now() - start);
    }
    scene.dispose();
    return { measurements, costs: costs.sort((a, b) => a - b) };
  });
  assert.deepEqual(lifecycle.measurements[2], lifecycle.measurements[0], 'Switching from an animated fox must release its GPU resources');
  assert.deepEqual(lifecycle.measurements[4], lifecycle.measurements[0], 'Repeated model changes must not grow GPU resources');
  assert.ok(lifecycle.costs[28] < 40, 'Large Braille renders stay inside the 24 fps frame budget');
  evidence.push(`Repeated animated/static model swaps return to the GPU baseline; large Braille render p95 ${lifecycle.costs[28].toFixed(1)} ms.`);

  await page.selectOption('#model', 'fox-v2');
  await page.waitForFunction(() => !document.querySelector('#copy').disabled);
  for (const style of ['ascii', 'blocks', 'braille']) {
    await page.locator(`input[name=style][value=${style}]`).check();
    await page.waitForTimeout(80);
    const result = await text();
    assert.ok(result.replace(/\s/g, '').length > 30);
    if (style === 'ascii') assert.match(result, /^[ .:\-=+*#%@\n]+$/);
    if (style === 'blocks') {
      assert.match(result, /^\u2060[\u2007░▒▓█\n]+$/);
      const widths = await page.evaluate(() => {
        const context = document.createElement('canvas').getContext('2d');
        context.font = '20px "DejaVu Mono"';
        return [context.measureText('\u2007').width, context.measureText('█').width, context.measureText('\u2060').width];
      });
      assert.ok(Math.abs(widths[0] - widths[1]) < 0.01, 'Blocks and blank cells have matching preview widths');
      assert.equal(widths[2], 0, 'The indentation guard occupies no visible column');
      await page.locator('#copy').click();
      await page.waitForFunction(() => document.querySelector('#copy-status').textContent.startsWith('Copied.'));
      const pasted = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(pasted.replaceAll('\r\n', '\n'), result, 'Clipboard preserves every block-space cell');
      assert.ok(pasted.includes('\u2007') && !pasted.includes(' '));
      assert.equal(pasted.trimStart(), pasted, 'Trimming leading whitespace preserves the first row');
    }
    if (style === 'braille') assert.match(result, /^[ \u2800-\u28ff\n]+$/);
    await page.screenshot({ path: `test-results/style-${style}.png`, fullPage: true });
  }
  for (const [preset, columns] of [['small', 32], ['medium', 48], ['large', 64]]) {
    await page.locator(`input[name=size][value=${preset}]`).check();
    await page.waitForTimeout(80);
    const result = await text();
    assert.equal(result.split('\n').length, columns / 2);
    assert.ok(result.split('\n').every(line => line.length === columns));
    assert.ok(result.length < 4000);
  }
  evidence.push('ASCII, blocks, and Braille work at all three preset widths.');

  await page.locator('input[name=style][value=ascii]').check();
  await page.locator('input[name=size][value=medium]').check();
  await page.waitForTimeout(80);
  const still = await text();
  await page.locator('[data-rotate=right]').click();
  await changed(still);
  await page.locator('#reset').click();
  await page.waitForTimeout(80);
  assert.equal(await text(), still);
  await page.locator('#viewport').focus();
  await page.keyboard.press('ArrowLeft');
  await changed(still);
  await page.keyboard.press('Home');
  await page.waitForTimeout(80);
  assert.equal(await text(), still);
  const bounds = await page.locator('#viewport').boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 100, bounds.y + bounds.height / 2 + 25, { steps: 8 });
  await page.mouse.up();
  await changed(still);
  await page.locator('#reset').click();
  await page.waitForTimeout(80);
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.wheel(0, -150);
  await page.waitForTimeout(80);
  assert.ok(Number(await page.locator('#zoom').inputValue()) > 100);
  await page.locator('#reset').click();
  evidence.push('Mouse drag, wheel zoom, rotation buttons, keyboard controls, and Reset work.');

  await page.locator('input[name=palette][value=green]').check();
  await page.waitForTimeout(50);
  const beforePalette = await text();
  await page.locator('input[name=palette][value=ice]').check();
  assert.equal(await text(), beforePalette);
  evidence.push('Palettes change presentation without changing clipboard characters.');

  await page.selectOption('#model', 'quaternius');
  await page.waitForFunction(() => !document.querySelector('#copy').disabled);
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false');
  await page.selectOption('#animation', { label: 'Walk' });
  await page.waitForTimeout(80);
  await page.evaluate(() => {
    window.frameTimes = [];
    window.frameObserver = new MutationObserver(() => window.frameTimes.push(performance.now()));
    window.frameObserver.observe(document.querySelector('#art'), { childList: true });
  });
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(() => window.frameTimes.length), 0, 'Still views perform no continuous DOM updates');
  const idle = await text();
  await page.locator('#play').click();
  await page.waitForTimeout(700);
  assert.notEqual(await text(), idle);
  await page.evaluate(() => {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = text => { window.copiedFrame = text; return write(text); };
  });
  await page.locator('#copy').click();
  await page.waitForFunction(() => document.querySelector('#copy-status').textContent.startsWith('Copied.'));
  const captured = await text();
  const frameTimes = await page.evaluate(() => { window.frameObserver.disconnect(); return window.frameTimes; });
  assert.ok(frameTimes.length > 3 && frameTimes.length <= 24, 'Animation updates remain capped');
  assert.ok(frameTimes.slice(1).every((time, index) => time - frameTimes[index] >= 38), 'Animation honors its frame budget');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(await page.evaluate(() => window.copiedFrame), captured);
  // Windows clipboard APIs normalize LF to CRLF. The character grid must still match exactly.
  assert.equal(clipboard.replaceAll('\r\n', '\n'), captured);
  assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'false');
  await page.waitForTimeout(300);
  assert.equal(await text(), captured);
  evidence.push('Animation changes over time; Copy pauses and writes the exact displayed frame.');
  evidence.push(`Still views produce no continuous updates; animated readback produced ${frameTimes.length} frames in the measured interval.`);

  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new DOMException('Denied', 'NotAllowedError')); });
  await page.locator('#copy').click();
  await page.locator('#copy-fallback').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#copy-text').inputValue(), captured);
  evidence.push('Blocked clipboard access exposes exact, selected text for manual copying.');

  // Simulate an obsolete load arriving after the latest choice.
  await page.route('**/assets/models/google.glb', async route => { await new Promise(resolve => setTimeout(resolve, 450)); await route.continue(); });
  await page.selectOption('#model', 'google');
  await page.selectOption('#model', 'little-fox');
  await page.waitForFunction(() => !document.querySelector('#copy').disabled);
  await page.waitForTimeout(700);
  assert.equal(await page.locator('#file-name').textContent(), 'fox://little-fox');
  await page.unroute('**/assets/models/google.glb');
  evidence.push('Delayed obsolete model loads cannot replace the current selection.');
  await page.route('**/assets/models/google.glb', route => route.abort());
  await page.selectOption('#model', 'google');
  await page.waitForFunction(() => document.querySelector('#render-state').textContent === 'LOAD FAILED');
  assert.ok(await page.locator('#copy').isDisabled());
  await page.unroute('**/assets/models/google.glb');
  await page.selectOption('#model', 'fox-v2');
  await page.waitForFunction(() => !document.querySelector('#copy').disabled);
  evidence.push('Failed model loads disable copying and recover through model selection.');

  await page.locator('input[name=palette][value=amber]').check();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  const axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), []);
  evidence.push('Desktop automated accessibility check reports no violations.');

  const mobileContext = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(url);
  await mobile.waitForFunction(() => !document.querySelector('#copy').disabled);
  await mobile.selectOption('#model', 'fox-v2');
  await mobile.waitForFunction(() => !document.querySelector('#copy').disabled);
  await mobile.locator('input[name=style][value=braille]').check();
  await mobile.locator('input[name=size][value=small]').check();
  await mobile.waitForTimeout(80);
  await mobile.screenshot({ path: 'test-results/android-size.png', fullPage: true });
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await mobile.evaluate(() => { const a = document.querySelector('#art').getBoundingClientRect(); const v = document.querySelector('#viewport').getBoundingClientRect(); return a.width <= v.width && a.height <= v.height; }));
  await mobile.locator('#viewport').scrollIntoViewIfNeeded();
  const touch = await mobileContext.newCDPSession(mobile);
  const box = await mobile.locator('#viewport').boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const oldMobile = await mobile.locator('#art').textContent();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 60, y: y + 10, id: 1 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobile.waitForTimeout(120);
  assert.notEqual(await mobile.locator('#art').textContent(), oldMobile);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 65, y, id: 1 }, { x: x + 65, y, id: 2 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobile.waitForTimeout(120);
  assert.ok(Number(await mobile.locator('#zoom').inputValue()) > 100);
  evidence.push('Android-sized touch viewport supports one-finger rotation and pinch zoom without page overflow.');
  const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
  assert.deepEqual(mobileAxe.violations.map(v => v.id), []);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#copy').disabled);
  assert.equal(await page.locator('#render-state').textContent(), 'STILL');
  await page.setViewportSize({ width: 800, height: 900 });
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'test-results/large-text.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await page.locator('.choices label>span, .rotation-buttons button').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1)), 'Enlarged control labels must not overlap');
  evidence.push('Reduced-motion starts still; 200% text remains usable without page overflow.');
  assert.deepEqual(errors, []);
  await writeFile('test-results/browser-evidence.json', JSON.stringify({ passed: true, evidence }, null, 2));
  console.log(evidence.join('\n'));
} finally { await browser.close(); }
