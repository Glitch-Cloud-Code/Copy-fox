export const PRESETS = Object.freeze({ small: 32, medium: 48, large: 64 });
export const STYLES = Object.freeze(['ascii', 'blocks', 'braille']);

export function getDimensions(style, preset) {
  if (!STYLES.includes(style) || !(preset in PRESETS)) throw new RangeError('Unknown text style or size.');
  const columns = PRESETS[preset];
  const rows = columns / 2;
  return { columns, rows, width: style === 'braille' ? columns * 2 : columns,
    height: style === 'braille' ? rows * 4 : rows };
}

// GPU readback starts at the bottom. Text starts at the top.
function sample(pixels, width, height, x, y) {
  const offset = ((height - 1 - y) * width + x) * 4;
  if (pixels[offset + 3] < 32) return null;
  return (pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722) / 255;
}

export function pixelsToText(pixels, width, height, style) {
  if (!STYLES.includes(style) || pixels.length !== width * height * 4) throw new RangeError('Invalid text image.');
  if (style === 'braille' && (width % 2 || height % 4)) throw new RangeError('Braille needs groups of 2 by 4 pixels.');
  const lines = [];
  if (style === 'braille') {
    const dots = [[0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8], [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128]];
    const thresholds = [[0.18, 0.57], [0.76, 0.37], [0.47, 0.08], [0.28, 0.66]];
    for (let y = 0; y < height; y += 4) {
      let line = '';
      for (let x = 0; x < width; x += 2) {
        let bits = 0;
        for (const [dx, dy, bit] of dots) {
          const value = sample(pixels, width, height, x + dx, y + dy);
          if (value !== null && Math.max(0.22, value) >= thresholds[dy][dx]) bits |= bit;
        }
        line += bits ? String.fromCodePoint(0x2800 + bits) : ' ';
      }
      lines.push(line);
    }
  } else {
    const ramp = style === 'ascii' ? '.:-=+*#%@' : '░▒▓█';
    for (let y = 0; y < height; y++) {
      let line = '';
      for (let x = 0; x < width; x++) {
        const value = sample(pixels, width, height, x, y);
        line += value === null ? ' ' : ramp[Math.min(ramp.length - 1, Math.floor(value * ramp.length))];
      }
      lines.push(line);
    }
  }
  // Keep interior and leading spaces, including full row widths.
  return lines.join('\n');
}
