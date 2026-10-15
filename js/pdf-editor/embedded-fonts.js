import { editorState } from './state.js';
import { ensureFontkit } from './vendor-loader.js';

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
        // TrueType/OpenType programs have Unicode cmaps usable by FontFace and
        // fontkit. CFF/Type1 and unresolved Form resources keep the explicit fallback.
        const programRef = descriptor.get(PDFLib.PDFName.of('FontFile2'));
        if (!programRef) continue;
        const key = documentGeneration + ':' + programRef.toString();
        if (!pendingPrograms.has(key)) pendingPrograms.set(key, (async () => {
          const stream = source.context.lookup(programRef, PDFLib.PDFRawStream);
          const bytes = PDFLib.decodePDFRawStream(stream).decode();
          const parsed = fontkit.create(bytes);
          const name = parsed.postscriptName || '';
          const bold = /bold|black|heavy|demi/i.test(name);
          const italic = /italic|oblique/i.test(name);
          const family = 'PDFSource' + documentGeneration + '-' + familyIndex++;
          const face = new FontFace(family, bytes.slice().buffer, { weight: bold ? '700' : '400', style: italic ? 'italic' : 'normal' });
          await face.load();
          if (documentGeneration !== generation) throw new Error('The previous PDF was closed.');
          document.fonts.add(face);
          faces.add(face);
          const entry = { key, bytes, parsed, family, bold, italic };
          fontPrograms.set(key, entry);
          return entry;
        })());
        const entry = await pendingPrograms.get(key);
        const base = parent.lookupMaybe(PDFLib.PDFName.of('BaseFont'), PDFLib.PDFName);
        if (base) {
          result.set(base.asString().replace(/^\//, ''), entry);
          if (!result.has(fontName(base.asString()))) result.set(fontName(base.asString()), entry);
        }
        result.set(resource.asString().replace(/^\//, ''), entry);
      } catch (error) {
        console.debug('[PDF Editor] An embedded font is unavailable for direct reuse.', error.message);
      }
    }
    return documentGeneration === generation ? result : new Map();
  })().catch(() => new Map()));
  return pageFonts.get(sourcePageNumber);
}

export async function attachEmbeddedFonts(objects, sourcePageNumber) {
  const fonts = await fontsForPage(sourcePageNumber);
  objects.forEach(object => {
    const source = fonts.get(object.fontName) || fonts.get(fontName(object.fontName));
    if (!source || [...object.text].some(character => !source.parsed.hasGlyphForCodePoint(character.codePointAt(0)))) return;
    object.sourceFontKey = source.key;
    object.sourcePreviewFont = source.family;
    object.fontQuality = 'exact';
    object.fontDescriptor = {
      ...object.fontDescriptor, embedded: true, matchQuality: 'exact', fallbackReason: null,
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
