import { markDirty } from './state.js';
import { normalizeColor } from './color-extractor.js';
import { descriptorForFamily, getPreviewFontFamily } from './font-resolver.js';

let measureCanvas = null;

function descriptorKey(object) {
  const descriptor = object && object.fontDescriptor;
  if (!descriptor) return '';
  const exported = descriptor.exportFont || {};
  return [descriptor.detectedFamily, descriptor.matchQuality, exported.type, exported.family, exported.src, object.fontRestyled ? 'restyled' : 'source'].join('|');
}

function applyDescriptor(object, descriptor, explicitReplacement = false) {
  if (!descriptor) return;
  object.fontDescriptor = descriptor;
  object.detectedFontFamily = descriptor.detectedFamily;
  object.fontFamily = descriptor.previewFont.family;
  object.fontQuality = descriptor.matchQuality;
  if (explicitReplacement) object.fontRestyled = true;
}

function measureTextWidth(object) {
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  const context = measureCanvas.getContext('2d');
  if (!context) return object.width;
  const style = [object.italic ? 'italic' : '', object.bold ? '700' : '400'].filter(Boolean).join(' ');
  context.font = style + ' ' + object.fontSize + 'px "' + String(getPreviewFontFamily(object)).replace(/["\\]/g, '') + '", sans-serif';
  return Math.max(object.fontSize * 0.35, context.measureText(object.text || '').width + Math.max(-4, Math.min(24, Number(object.letterSpacing || 0))) * Math.max(0, [...String(object.text || '')].length - 1));
}

export function applyTextProperties(object, values) {
  if (!object) return false;
  const previous = JSON.stringify({
    text: object.text,
    fontFamily: object.fontFamily,
    fontSize: object.fontSize,
    colorHex: object.colorHex,
    rotation: object.rotation,
    bold: object.bold,
    italic: object.italic,
    alignment: object.alignment,
    letterSpacing: object.letterSpacing,
    opacity: object.opacity,
    fontDescriptor: descriptorKey(object)
  });
  if (typeof values.text === 'string') object.text = values.text;
  if (values.fontDescriptor && typeof values.fontDescriptor === 'object') {
    applyDescriptor(object, values.fontDescriptor, true);
  }
  if (typeof values.fontFamily === 'string' && values.fontFamily.trim() && object.fontFamily !== values.fontFamily.trim()) {
    const requestedFamily = values.fontFamily.trim();
    const descriptor = descriptorForFamily(values.fontFamily.trim(), {
      bold: typeof values.bold === 'boolean' ? values.bold : object.bold,
      italic: typeof values.italic === 'boolean' ? values.italic : object.italic
    });
    applyDescriptor(object, descriptor);
    object.fontRestyled = requestedFamily !== (object.originalFontDescriptor && object.originalFontDescriptor.detectedFamily);
  }
  if (Number.isFinite(values.fontSize)) object.fontSize = Math.max(1, Math.min(200, values.fontSize));
  if (typeof values.colorHex === 'string') {
    const normalized = normalizeColor(values.colorHex);
    if (normalized) {
      object.color = { ...normalized, quality: 'user' };
      object.colorHex = normalized.hex;
      object.colorQuality = 'user';
    }
  }
  if (Number.isFinite(values.rotation)) object.rotation = Math.max(-360, Math.min(360, values.rotation));
  if (typeof values.bold === 'boolean') object.bold = values.bold;
  if (typeof values.italic === 'boolean') object.italic = values.italic;
  if (object.fontDescriptor && (typeof values.bold === 'boolean' || typeof values.italic === 'boolean')) {
    const descriptor = descriptorForFamily(object.detectedFontFamily || object.fontFamily, { bold: object.bold, italic: object.italic });
    applyDescriptor(object, descriptor, object.fontRestyled);
  }
  if (['left', 'center', 'right'].includes(values.alignment)) object.alignment = values.alignment;
  if (Number.isFinite(values.letterSpacing)) object.letterSpacing = Math.max(-4, Math.min(24, values.letterSpacing));
  if (Number.isFinite(values.opacity)) object.opacity = Math.max(0, Math.min(1, values.opacity));
  if (['text', 'new-text', 'ocr-text'].includes(object.type)) {
    const minimumWidth = object.originalWidth || (object.type === 'new-text' ? object.width : 0);
    object.editedWidth = Math.max(minimumWidth, measureTextWidth(object));
    object.editedHeight = Math.max(object.originalHeight || object.height || object.fontSize, object.fontSize);
    object.width = object.editedWidth;
    object.height = object.editedHeight;
  }

  const next = JSON.stringify({
    text: object.text,
    fontFamily: object.fontFamily,
    fontSize: object.fontSize,
    colorHex: object.colorHex,
    rotation: object.rotation,
    bold: object.bold,
    italic: object.italic,
    alignment: object.alignment,
    letterSpacing: object.letterSpacing,
    opacity: object.opacity,
    fontDescriptor: descriptorKey(object)
  });
  if (previous === next) return false;
  object.modified = true;
  markDirty();
  return true;
}

export function moveTextObject(object, x, y) {
  if (!object || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const changed = Math.abs(object.x - x) > 0.01 || Math.abs(object.y - y) > 0.01;
  if (!changed) return false;
  object.x = x;
  object.y = y;
  object.moved = Math.abs(object.originalX - x) > 0.01 || Math.abs(object.originalY - y) > 0.01;
  object.modified = true;
  markDirty();
  return true;
}

export function setObjectBackground(object, background) {
  if (!object || !background) return;
  object.background = {
    rgb: Array.isArray(background.rgb) ? background.rgb.slice() : [255, 255, 255],
    hex: background.hex || '#FFFFFF',
    quality: background.quality || 'estimated',
    complex: Boolean(background.complex),
    spread: background.spread
  };
}
