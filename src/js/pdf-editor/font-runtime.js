import { ensureFontkit } from './vendor-loader.js';
import { getBundledFontSource } from './font-resolver.js';
import { getEmbeddedFont } from './embedded-fonts.js';

const byteCache = new Map();
const parsedFontCache = new Map();

export async function loadLocalFontBytes(src) {
  if (!src) throw new Error('No local font source is available.');
  if (!byteCache.has(src)) {
    byteCache.set(src, fetch(src, { credentials: 'same-origin' }).then(async (response) => {
      if (!response.ok) throw new Error('The local font file could not be loaded.');
      return new Uint8Array(await response.arrayBuffer());
    }).catch((error) => {
      byteCache.delete(src);
      throw error;
    }));
  }
  return byteCache.get(src);
}

async function getParsedBundledFont(object) {
  const src = getBundledFontSource(object && object.fontDescriptor, object && object.bold, object && object.italic);
  if (!src) return null;
  if (!parsedFontCache.has(src)) {
    parsedFontCache.set(src, (async () => {
      const [fontkit, bytes] = await Promise.all([ensureFontkit(), loadLocalFontBytes(src)]);
      if (!fontkit || typeof fontkit.create !== 'function') throw new Error('The local font engine is unavailable.');
      return fontkit.create(bytes);
    })().catch((error) => {
      parsedFontCache.delete(src);
      throw error;
    }));
  }
  return parsedFontCache.get(src);
}

function uniqueCodePoints(text) {
  return [...new Set(Array.from(String(text || ''), (character) => character.codePointAt(0)))];
}

export async function checkGlyphCoverage(object, text) {
  const source = getEmbeddedFont(object);
  if (source) {
    const unsupported = uniqueCodePoints(text).filter(codePoint => !source.parsed.hasGlyphForCodePoint(codePoint));
    return { supported: unsupported.length === 0, unsupported, source: { type: 'source-embedded', family: source.parsed.familyName } };
  }
  const descriptor = object && object.fontDescriptor;
  if (!descriptor) return { supported: true, unsupported: [], source: null };
  const exportFont = descriptor.exportFont || {};
  if (exportFont.type === 'source-standard') {
    const unsupported = uniqueCodePoints(text).filter((codePoint) => codePoint < 0x20 || codePoint > 0x7E);
    return { supported: unsupported.length === 0, unsupported, source: exportFont };
  }
  if (exportFont.type !== 'bundled') return { supported: true, unsupported: [], source: exportFont };
  const font = await getParsedBundledFont(object);
  if (!font || typeof font.hasGlyphForCodePoint !== 'function') return { supported: false, unsupported: uniqueCodePoints(text), source: exportFont };
  const unsupported = uniqueCodePoints(text).filter((codePoint) => !font.hasGlyphForCodePoint(codePoint));
  return { supported: unsupported.length === 0, unsupported, source: exportFont };
}

export function formatUnsupportedGlyphs(codePoints) {
  return codePoints.slice(0, 8).map((codePoint) => {
    const character = String.fromCodePoint(codePoint);
    return character.trim() ? character : 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');
  }).join(' ');
}
