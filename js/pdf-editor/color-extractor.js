const DEFAULT_TEXT_COLOR = { rgb: [31, 31, 31], hex: '#1F1F1F', quality: 'estimated' };

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
}

function toHex(rgb) {
  return '#' + rgb.map((part) => clampByte(part).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function normalizeColor(value, type) {
  if (typeof value === 'number' && type === 'gray') {
    const gray = clampByte(value * 255);
    const rgb = [gray, gray, gray];
    return { rgb, hex: toHex(rgb), quality: 'exact' };
  }
  if (Array.isArray(value)) {
    const numbers = value.map(Number);
    if (type === 'gray' || numbers.length === 1) {
      const gray = clampByte(numbers[0] * 255);
      const rgb = [gray, gray, gray];
      return { rgb, hex: toHex(rgb), quality: 'exact' };
    }
    if (type === 'cmyk' || numbers.length === 4) {
      const [c, m, y, k] = numbers;
      const rgb = [
        clampByte(255 * (1 - Math.min(1, c * (1 - k) + k))),
        clampByte(255 * (1 - Math.min(1, m * (1 - k) + k))),
        clampByte(255 * (1 - Math.min(1, y * (1 - k) + k)))
      ];
      return { rgb, hex: toHex(rgb), quality: 'exact' };
    }
    if (numbers.length >= 3) {
      const rgb = numbers.slice(0, 3).map((number) => clampByte(number <= 1 ? number * 255 : number));
      return { rgb, hex: toHex(rgb), quality: 'exact' };
    }
  }

  if (typeof value === 'string') {
    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const digits = hex[1].length === 3 ? hex[1].split('').map((digit) => digit + digit).join('') : hex[1];
      const rgb = [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16));
      return { rgb, hex: toHex(rgb), quality: 'exact' };
    }
    const rgb = value.match(/rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i);
    if (rgb) {
      const channels = rgb.slice(1, 4).map(clampByte);
      return { rgb: channels, hex: toHex(channels), quality: 'exact' };
    }
  }
  return null;
}

function getOperatorFillColor(operatorList, pdfjsLib) {
  const OPS = pdfjsLib.OPS || {};
  let current = null;
  const colors = [];
  const textOps = new Set([OPS.showText, OPS.showSpacedText, OPS.nextLineShowText, OPS.nextLineSetSpacingShowText].filter((value) => value !== undefined));

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index];
    const args = operatorList.argsArray[index];
    if (fn === OPS.setFillRGBColor) current = normalizeColor(args && args[0], 'rgb') || normalizeColor(args, 'rgb');
    else if (fn === OPS.setFillGray) current = normalizeColor(args && args[0], 'gray');
    else if (fn === OPS.setFillCMYKColor) current = normalizeColor(args, 'cmyk') || normalizeColor(args && args[0], 'cmyk');
    else if (fn === OPS.setFillColor) current = normalizeColor(args, null) || current;
    else if (textOps.has(fn)) colors.push(current);
  }
  return colors;
}

export async function extractTextColors(page, textItems, pdfjsLib) {
  const result = new Map();
  if (!page || !textItems || !textItems.length || typeof page.getOperatorList !== 'function') return result;
  try {
    const operatorList = await page.getOperatorList();
    const colors = getOperatorFillColor(operatorList, pdfjsLib);
    if (colors.length === textItems.length) {
      textItems.forEach((item, index) => {
        if (colors[index]) result.set(index, colors[index]);
      });
      return result;
    }
    // PDF.js may group text-content and operator-list runs differently. When
    // there is no one-to-one correspondence, preserve an estimated color
    // rather than attaching a neighboring run's fill color to the wrong text.
  } catch (error) {
    console.debug('[PDF Editor] Text color analysis was unavailable.', error);
  }
  return result;
}

export function getEstimatedTextColor() {
  return { ...DEFAULT_TEXT_COLOR, rgb: DEFAULT_TEXT_COLOR.rgb.slice() };
}

export function sampleBackgroundFromCanvas(canvas, rect) {
  const context = canvas && canvas.getContext && canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !rect || !rect.width || !rect.height) {
    return { rgb: [255, 255, 255], hex: '#FFFFFF', quality: 'estimated', complex: true };
  }
  const scaleX = canvas.width / Math.max(1, canvas.clientWidth || canvas.width);
  const scaleY = canvas.height / Math.max(1, canvas.clientHeight || canvas.height);
  const x = rect.left * scaleX;
  const y = rect.top * scaleY;
  const width = rect.width * scaleX;
  const height = rect.height * scaleY;
  const insetX = Math.max(2, Math.min(width * 0.12, 8));
  const insetY = Math.max(2, Math.min(height * 0.16, 5));
  const gap = Math.max(2, Math.min(Math.min(width, height) * 0.08, 5));
  const points = [
    [x + insetX, y - gap], [x + width / 2, y - gap], [x + width - insetX, y - gap],
    [x + insetX, y + height + gap], [x + width / 2, y + height + gap], [x + width - insetX, y + height + gap],
    [x - gap, y + height / 2], [x + width + gap, y + height / 2]
  ];
  const samples = [];
  try {
    points.forEach(([pointX, pointY]) => {
      const px = Math.max(0, Math.min(canvas.width - 1, Math.round(pointX)));
      const py = Math.max(0, Math.min(canvas.height - 1, Math.round(pointY)));
      const data = context.getImageData(px, py, 1, 1).data;
      samples.push([data[0], data[1], data[2]]);
    });
  } catch (error) {
    return { rgb: [255, 255, 255], hex: '#FFFFFF', quality: 'estimated', complex: true };
  }
  const mean = [0, 1, 2].map((channel) => Math.round(samples.reduce((sum, sample) => sum + sample[channel], 0) / samples.length));
  const spread = Math.max(...[0, 1, 2].map((channel) => {
    const values = samples.map((sample) => sample[channel]);
    return Math.max(...values) - Math.min(...values);
  }));
  return { rgb: mean, hex: toHex(mean), quality: spread <= 14 ? 'sampled' : 'estimated', complex: spread > 14, spread };
}
