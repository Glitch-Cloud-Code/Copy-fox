import test from 'node:test';
import assert from 'node:assert/strict';
import { getDimensions, pixelsToText, STYLES } from '../dist/js/text-art.js';

test('Transparent backgrounds stay blank in all three styles', () => {
  for (const style of STYLES) assert.equal(pixelsToText(new Uint8Array(32), 2, 4, style).trim(), '');
});
test('ASCII preserves vertical orientation, dark silhouettes, and luminance', () => {
  const pixels = new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255]);
  assert.equal(pixelsToText(pixels, 1, 2, 'ascii'), '@\n.');
  assert.equal(pixelsToText(pixels, 1, 2, 'blocks'), '█\n░');
});
test('All eight Braille dots occupy the correct character positions', () => {
  const dots = [[0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8], [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128]];
  for (const [x, y, bit] of dots) {
    const pixels = new Uint8Array(32);
    pixels.fill(255, ((3 - y) * 2 + x) * 4, ((3 - y) * 2 + x) * 4 + 4);
    assert.equal(pixelsToText(pixels, 2, 4, 'braille'), String.fromCodePoint(0x2800 + bit));
  }
});
test('Presets have consistent character dimensions and stay below our 4000-character budget', () => {
  for (const preset of ['small', 'medium', 'large']) {
    for (const style of STYLES) {
      const { width, height, columns, rows } = getDimensions(style, preset);
      const text = pixelsToText(new Uint8Array(width * height * 4).fill(255), width, height, style);
      const lines = text.split('\n');
      assert.equal(lines.length, rows);
      assert.ok(lines.every(line => line.length === columns));
      assert.ok(text.length < 4000);
    }
  }
});
test('Invalid dimensions and modes fail explicitly', () => {
  assert.throws(() => getDimensions('unknown', 'small'), RangeError);
  assert.throws(() => pixelsToText(new Uint8Array(4), 1, 1, 'braille'), RangeError);
});
