import { editorState } from './state.js';
import { ensureFontkit } from './vendor-loader.js';
import { descriptorForFamily } from './font-resolver.js';

let sourceDocument = null;
let sourceBytes = null;
let generation = 0;
const pageFonts = new Map();
const fontPrograms = new Map();
const pendingPrograms = new Map();
const faces = new Set();
let familyIndex = 0;

function fontName(value) {
  return String(value || '').replace(/^\//, '').replace(/^[A-Z]{6}\+/, '');
}

function compactFontKey(value) {
  return fontName(value).replace(/[\s,_-]+/g, '').toLowerCase();
}

function safeGet(fn, fallback = null) {
  try {
    const value = fn();
    return value === undefined || value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function safeFontProp(parsed, prop) {
  return String(safeGet(() => parsed[prop], '') || '');
}

export function safeHasGlyph(parsed, codePoint) {
  try {
    if (!parsed || !parsed.directory || !parsed.directory.tables || !parsed.directory.tables.cmap) return false;
    if (typeof parsed.hasGlyphForCodePoint !== 'function') return false;
    return Boolean(parsed.hasGlyphForCodePoint(codePoint));
  } catch (error) {
    return false;
  }
}

function measureGlyphOutlineStrokeRatio(parsed) {
  try {
    if (!parsed || typeof parsed.getGlyph !== 'function') return 0;
    const upem = Number(parsed.unitsPerEm) || 1000;
    const numGlyphs = Number(parsed.numGlyphs) || 0;
    const limit = Math.min(numGlyphs, 64);
    const ratios = [];
    for (let gid = 1; gid < limit; gid += 1) {
      let glyph = null;
      try {
        glyph = parsed.getGlyph(gid);
      } catch (error) {
        continue;
      }
      const commands = glyph && glyph.path && glyph.path.commands;
      if (!Array.isArray(commands) || commands.length < 4) continue;
      const bbox = glyph.bbox;
      const height = bbox ? (Number(bbox.maxY) - Number(bbox.minY)) : 0;
      if (!Number.isFinite(height) || height < upem * 0.35) continue;
      let area2 = 0;
      let perimeter = 0;
      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      const addSegment = (nextX, nextY) => {
        area2 += (currentX * nextY - nextX * currentY);
        perimeter += Math.hypot(nextX - currentX, nextY - currentY);
        currentX = nextX;
        currentY = nextY;
      };
      for (const cmd of commands) {
        const args = cmd.args || [];
        if (cmd.command === 'moveTo') {
          startX = currentX = Number(args[0]) || 0;
          startY = currentY = Number(args[1]) || 0;
        } else if (cmd.command === 'lineTo') {
          addSegment(Number(args[0]) || 0, Number(args[1]) || 0);
        } else if (cmd.command === 'quadraticCurveTo') {
          const x0 = currentX;
          const y0 = currentY;
          const cx = Number(args[0]) || 0;
          const cy = Number(args[1]) || 0;
          const x1 = Number(args[2]) || 0;
          const y1 = Number(args[3]) || 0;
          for (let step = 1; step <= 4; step += 1) {
            const t = step / 4;
            const mt = 1 - t;
            addSegment(
              mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
              mt * mt * y0 + 2 * mt * t * cy + t * t * y1
            );
          }
        } else if (cmd.command === 'bezierCurveTo') {
          const x0 = currentX;
          const y0 = currentY;
          const c1x = Number(args[0]) || 0;
          const c1y = Number(args[1]) || 0;
          const c2x = Number(args[2]) || 0;
          const c2y = Number(args[3]) || 0;
          const x1 = Number(args[4]) || 0;
          const y1 = Number(args[5]) || 0;
          for (let step = 1; step <= 4; step += 1) {
            const t = step / 4;
            const mt = 1 - t;
            addSegment(
              mt * mt * mt * x0 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x1,
              mt * mt * mt * y0 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y1
            );
          }
        } else if (cmd.command === 'closePath') {
          addSegment(startX, startY);
        }
      }
      if (perimeter > 0) {
        const strokeWidth = Math.abs(area2) / perimeter;
        ratios.push(strokeWidth / upem);
      }
    }
    if (!ratios.length) return 0;
    ratios.sort((a, b) => a - b);
    return ratios[Math.floor(ratios.length / 2)];
  } catch (error) {
    return 0;
  }
}

function measureCanvasStrokeWeight(fontSpec, sampleText) {
  if (typeof document === 'undefined' || !sampleText) return 0;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 90;
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.font = fontSpec;
    context.fillStyle = '#000';
    context.textBaseline = 'alphabetic';
    context.fillText(sampleText, 16, 60);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    let ink = 0;
    let edge = 0;
    for (let y = 1; y < height; y += 1) {
      for (let x = 1; x < width; x += 1) {
        const index = (y * width + x) * 4 + 3;
        const alpha = data[index];
        ink += alpha;
        edge += Math.abs(alpha - data[index - 4]) + Math.abs(alpha - data[index - width * 4]);
      }
    }
    return edge > 0 ? ink / (0.5 * edge) : 0;
  } catch (error) {
    return 0;
  }
}

function detectVisualBoldFromFontFace(family, parsed, isSerif) {
  try {
    if (!parsed || !parsed.directory || !parsed.directory.tables || !parsed.directory.tables.cmap) return false;
    const charset = Array.isArray(parsed.characterSet) ? parsed.characterSet : [];
    const sampleChars = [];
    for (const codePoint of charset) {
      if (
        ((codePoint >= 0x30 && codePoint <= 0x39) ||
          (codePoint >= 0x41 && codePoint <= 0x5A) ||
          (codePoint >= 0x61 && codePoint <= 0x7A)) &&
        safeHasGlyph(parsed, codePoint)
      ) {
        sampleChars.push(String.fromCodePoint(codePoint));
        if (sampleChars.length >= 12) break;
      }
    }
    if (sampleChars.length < 2) return false;
    const sample = sampleChars.join('');
    const embeddedStroke = measureCanvasStrokeWeight('48px "' + family + '"', sample);
    const baselineStack = isSerif ? 'Tinos, "Times New Roman", serif' : 'Arimo, Arial, sans-serif';
    const regularStroke = measureCanvasStrokeWeight('400 48px ' + baselineStack, sample);
    return embeddedStroke > 0 && regularStroke > 0 && embeddedStroke >= regularStroke * 1.11;
  } catch (error) {
    return false;
  }
}

export function clearEmbeddedFonts() {
  generation += 1;
  faces.forEach(face => document.fonts.delete(face));
  faces.clear();
  pageFonts.clear();
  fontPrograms.clear();
  pendingPrograms.clear();
  sourceDocument = null;
  sourceBytes = null;
}

async function fontsForPage(sourcePageNumber) {
  if (sourceBytes !== editorState.originalBytes) {
    clearEmbeddedFonts();
    sourceBytes = editorState.originalBytes;
  }
  if (!sourceBytes || !window.PDFLib) return new Map();
  if (!pageFonts.has(sourcePageNumber)) pageFonts.set(sourcePageNumber, (async () => {
    const documentGeneration = generation;
    const PDFLib = window.PDFLib;
    if (!sourceDocument) sourceDocument = PDFLib.PDFDocument.load(sourceBytes.slice(), { updateMetadata: false });
    const source = await sourceDocument;
    const resources = source.getPage(sourcePageNumber - 1).node.Resources();
    const fonts = resources && resources.lookupMaybe(PDFLib.PDFName.of('Font'), PDFLib.PDFDict);
    const result = new Map();
    if (!fonts) return result;
    const fontkit = await ensureFontkit();
    if (documentGeneration !== generation) return result;
    for (const [resource, reference] of fonts.entries()) {
      try {
        const parent = source.context.lookup(reference, PDFLib.PDFDict);
        const descendants = parent.lookupMaybe(PDFLib.PDFName.of('DescendantFonts'), PDFLib.PDFArray);
        const font = descendants ? descendants.lookup(0, PDFLib.PDFDict) : parent;
        const descriptor = font.lookupMaybe(PDFLib.PDFName.of('FontDescriptor'), PDFLib.PDFDict);
        if (!descriptor) continue;
        const programRef = descriptor.get(PDFLib.PDFName.of('FontFile2')) || descriptor.get(PDFLib.PDFName.of('FontFile3'));
        if (!programRef) continue;
        const key = documentGeneration + ':' + programRef.toString();
        if (!pendingPrograms.has(key)) pendingPrograms.set(key, (async () => {
          const stream = source.context.lookup(programRef, PDFLib.PDFRawStream);
          const bytes = PDFLib.decodePDFRawStream(stream).decode();
          const parsed = fontkit.create(bytes);
          const parentBase = parent.lookupMaybe(PDFLib.PDFName.of('BaseFont'), PDFLib.PDFName)?.asString() || '';
          const childBase = font !== parent ? (font.lookupMaybe(PDFLib.PDFName.of('BaseFont'), PDFLib.PDFName)?.asString() || '') : '';
          const descriptorFontName = descriptor.lookupMaybe(PDFLib.PDFName.of('FontName'), PDFLib.PDFName)?.asString() || '';
          const resourceName = resource.asString().replace(/^\//, '');
          const baseName = parentBase || childBase || descriptorFontName;
          const postscriptName = safeFontProp(parsed, 'postscriptName');
          const parsedFullName = safeFontProp(parsed, 'fullName');
          const parsedFamilyName = safeFontProp(parsed, 'familyName');
          const parsedSubfamilyName = safeFontProp(parsed, 'subfamilyName');
          const fullName = [postscriptName, parsedFullName, parsedFamilyName, parsedSubfamilyName, parentBase, childBase, descriptorFontName, resourceName].filter(Boolean).join(' ');
          const os2 = safeGet(() => parsed['OS/2'], null);
          const head = safeGet(() => parsed.head, null);
          const parsedItalicAngle = Number(safeGet(() => parsed.italicAngle, 0) || 0);
          const weightClass = Number((os2 && os2.usWeightClass) || 0);
          const panoseWeight = Array.isArray(os2 && os2.panose) ? Number(os2.panose[2] || 0) : 0;
          const pdfWeight = Number(descriptor.lookupMaybe(PDFLib.PDFName.of('FontWeight'), PDFLib.PDFNumber)?.asNumber() || 0);
          const stemV = Number(descriptor.lookupMaybe(PDFLib.PDFName.of('StemV'), PDFLib.PDFNumber)?.asNumber() || 0);
          const flags = Number(descriptor.lookupMaybe(PDFLib.PDFName.of('Flags'), PDFLib.PDFNumber)?.asNumber() || 0);
          const pdfItalicAngle = Number(descriptor.lookupMaybe(PDFLib.PDFName.of('ItalicAngle'), PDFLib.PDFNumber)?.asNumber() || 0);
          const macBold = Boolean(head && head.macStyle && (typeof head.macStyle === 'object' ? head.macStyle.bold : (head.macStyle & 1)));
          const macItalic = Boolean(head && head.macStyle && (typeof head.macStyle === 'object' ? head.macStyle.italic : (head.macStyle & 2)));
          const os2Bold = Boolean(os2 && os2.fsSelection && (typeof os2.fsSelection === 'object' ? os2.fsSelection.bold : (os2.fsSelection & 32)));
          const os2Italic = Boolean(os2 && os2.fsSelection && (typeof os2.fsSelection === 'object' ? (os2.fsSelection.italic || os2.fsSelection.oblique) : (os2.fsSelection & 513)));
          const numericWeight = weightClass >= 100
            ? weightClass
            : pdfWeight >= 100
              ? pdfWeight
              : /bold|black|heavy/i.test(fullName)
                ? 700
                : /semibold|demibold|demi/i.test(fullName)
                  ? 600
                  : /medium/i.test(fullName) || panoseWeight >= 6 || stemV >= 88
                    ? 500
                    : 400;
          const italic = parsedItalicAngle !== 0
            || pdfItalicAngle !== 0
            || macItalic
            || os2Italic
            || Boolean(flags & 64)
            || /italic|oblique|slanted/i.test(fullName);
          const isSerif = Boolean(flags & 2)
            || /serif|times|tinos|georgia|garamond|baskerville|palatino|bookman|playfair|instrument|merriweather|lora|charter|cambria|caladea|century|minion|caslon|didot|bodoni|spectral|crimson/i.test(fullName);
          const family = 'PDFSource' + documentGeneration + '-' + familyIndex++;
          const hasCmap = Boolean(parsed && parsed.directory && parsed.directory.tables && parsed.directory.tables.cmap);
          let canEmbed = false;
          if (hasCmap && typeof FontFace !== 'undefined') {
            try {
              const face = new FontFace(family, bytes.slice().buffer, { weight: '100 900', style: italic ? 'italic' : 'normal' });
              await face.load();
              if (documentGeneration !== generation) throw new Error('The previous PDF was closed.');
              document.fonts.add(face);
              faces.add(face);
              canEmbed = true;
            } catch (faceError) {
              canEmbed = false;
            }
          }
          const outlineStrokeRatio = measureGlyphOutlineStrokeRatio(parsed);
          let bold = numericWeight >= 500
            || macBold
            || os2Bold
            || panoseWeight >= 6
            || Boolean(flags & 262144)
            || /bold|black|heavy|demi|semibold|medium/i.test(fullName)
            || outlineStrokeRatio >= (isSerif ? 0.075 : 0.083);
          if (!bold && canEmbed && detectVisualBoldFromFontFace(family, parsed, isSerif)) {
            bold = true;
          }
          const entry = {
            key,
            bytes,
            parsed,
            family,
            canEmbed,
            bold,
            italic,
            weight: bold ? 700 : (numericWeight || 400),
            explicitWeightClass: weightClass,
            outlineStrokeRatio,
            isSerif,
            detectedFamily: parsedFamilyName || fontName(baseName) || ''
          };
          if (canEmbed) fontPrograms.set(key, entry);
          return entry;
        })());
        const entry = await pendingPrograms.get(key);
        const registerCandidate = (nameKey, candidate) => {
          if (!nameKey) return;
          if (!result.has(nameKey)) {
            result.set(nameKey, candidate);
          } else {
            const existing = result.get(nameKey);
            if (!existing.candidates) existing.candidates = [existing];
            if (!existing.candidates.includes(candidate)) existing.candidates.push(candidate);
          }
        };
        const namesToRegister = [
          parent.lookupMaybe(PDFLib.PDFName.of('BaseFont'), PDFLib.PDFName)?.asString(),
          font !== parent ? font.lookupMaybe(PDFLib.PDFName.of('BaseFont'), PDFLib.PDFName)?.asString() : null,
          descriptor.lookupMaybe(PDFLib.PDFName.of('FontName'), PDFLib.PDFName)?.asString(),
          safeFontProp(entry.parsed, 'postscriptName'),
          safeFontProp(entry.parsed, 'familyName'),
          resource.asString()
        ].filter(Boolean);
        for (const candidateName of namesToRegister) {
          const clean = String(candidateName).replace(/^\//, '');
          registerCandidate(clean, entry);
          registerCandidate(fontName(clean), entry);
          registerCandidate(compactFontKey(clean), entry);
        }
      } catch (error) {
        console.debug('[PDF Editor] An embedded font is unavailable for direct reuse.', error.message);
      }
    }
    const uniqueEntries = new Set();
    for (const value of result.values()) {
      if (value && Array.isArray(value.candidates)) value.candidates.forEach(c => uniqueEntries.add(c));
      else if (value) uniqueEntries.add(value);
    }
    const pageStrokeRatios = [...uniqueEntries].map(e => e.outlineStrokeRatio).filter(r => r > 0);
    if (pageStrokeRatios.length >= 2) {
      const minRatio = Math.min(...pageStrokeRatios);
      for (const entry of uniqueEntries) {
        if (!entry.bold && (!entry.explicitWeightClass || entry.explicitWeightClass > 400) && entry.outlineStrokeRatio >= minRatio * 1.08) {
          entry.bold = true;
          entry.weight = 700;
        }
      }
    }
    return documentGeneration === generation ? result : new Map();
  })().catch(() => new Map()));
  return pageFonts.get(sourcePageNumber);
}

function pickBestCandidateForText(entryOrGroup, text) {
  if (!entryOrGroup) return null;
  const candidates = Array.isArray(entryOrGroup.candidates) ? entryOrGroup.candidates : [entryOrGroup];
  if (candidates.length === 1) return candidates[0];
  const chars = [...String(text || '')].filter(ch => ch.trim().length > 0);
  if (!chars.length) return candidates[0];
  let best = candidates[0];
  let bestScore = -1;
  for (const candidate of candidates) {
    let covered = 0;
    for (const ch of chars) {
      if (safeHasGlyph(candidate.parsed, ch.codePointAt(0))) covered += 1;
    }
    const score = covered / chars.length;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

export async function attachEmbeddedFonts(objects, sourcePageNumber) {
  const fonts = await fontsForPage(sourcePageNumber);
  objects.forEach(object => {
    const rawMatch = fonts.get(object.fontName)
      || fonts.get(fontName(object.fontName))
      || fonts.get(compactFontKey(object.fontName))
      || fonts.get(object.pdfJsFontId)
      || fonts.get(compactFontKey(object.pdfJsFontId));
    const source = pickBestCandidateForText(rawMatch, object.text);
    if (!source) return;
    if (source.bold && !object.bold) {
      object.bold = true;
      object.originalBold = true;
    }
    if (source.italic && !object.italic) {
      object.italic = true;
      object.originalItalic = true;
    }
    object.fontWeight = object.bold ? 700 : Math.max(Number(object.fontWeight || 400), Number(source.weight || 400));
    object.originalFontWeight = object.fontWeight;
    if (source.isSerif && object.fontDescriptor) {
      object.fontDescriptor.isSerif = true;
      if (object.fontFamily === 'Arimo') {
        object.fontFamily = 'Tinos';
        object.originalFontFamily = 'Tinos';
      }
    }
    if (object.fontDescriptor) {
      const updatedDescriptor = descriptorForFamily(object.detectedFontFamily || object.fontFamily, {
        bold: object.bold,
        italic: object.italic,
        weight: object.fontWeight,
        isSerif: Boolean(source.isSerif || object.fontDescriptor.isSerif)
      });
      object.fontDescriptor = {
        ...updatedDescriptor,
        rawPdfFontName: object.fontDescriptor.rawPdfFontName || updatedDescriptor.rawPdfFontName,
        subset: object.fontDescriptor.subset
      };
      object.originalFontDescriptor = object.fontDescriptor;
      object.fontFamily = object.fontDescriptor.previewFont.family;
      object.originalFontFamily = object.fontFamily;
    }
    if (!source.canEmbed) return;
    if ([...object.text].some(character => !safeHasGlyph(source.parsed, character.codePointAt(0)))) return;
    object.sourceFontKey = source.key;
    object.sourcePreviewFont = source.family;
    object.fontQuality = 'exact';
    object.fontDescriptor = {
      ...object.fontDescriptor,
      bold: object.bold,
      italic: object.italic,
      weight: object.fontWeight,
      isSerif: Boolean(source.isSerif || (object.fontDescriptor && object.fontDescriptor.isSerif)),
      embedded: true,
      matchQuality: 'exact',
      fallbackReason: null,
      previewFont: { type: 'source-embedded', family: object.detectedFontFamily, quality: 'exact' },
      exportFont: { type: 'source-embedded', family: object.detectedFontFamily, quality: 'exact' }
    };
    object.originalFontDescriptor = object.fontDescriptor;
  });
}

export function getEmbeddedFont(object) {
  if (!object || object.fontRestyled || object.bold !== object.originalBold || object.italic !== object.originalItalic) return null;
  return fontPrograms.get(object.sourceFontKey) || null;
}
