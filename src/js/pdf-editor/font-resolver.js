const BUNDLED_FONTS = {
  Tinos: {
    family: 'Tinos',
    files: {
      regular: '/fonts/pdf-editor/Tinos-Regular.ttf',
      bold: '/fonts/pdf-editor/Tinos-Bold.ttf',
      italic: '/fonts/pdf-editor/Tinos-Italic.ttf',
      boldItalic: '/fonts/pdf-editor/Tinos-BoldItalic.ttf'
    }
  },
  Arimo: {
    family: 'Arimo',
    files: {
      regular: '/fonts/pdf-editor/Arimo-Regular.ttf',
      bold: '/fonts/pdf-editor/Arimo-Bold.ttf',
      italic: '/fonts/pdf-editor/Arimo-Italic.ttf',
      boldItalic: '/fonts/pdf-editor/Arimo-BoldItalic.ttf'
    }
  },
  Carlito: {
    family: 'Carlito',
    files: {
      regular: '/fonts/pdf-editor/Carlito-Regular.ttf',
      bold: '/fonts/pdf-editor/Carlito-Bold.ttf',
      italic: '/fonts/pdf-editor/Carlito-Italic.ttf',
      boldItalic: '/fonts/pdf-editor/Carlito-BoldItalic.ttf'
    }
  },
  Caladea: {
    family: 'Caladea',
    files: {
      regular: '/fonts/pdf-editor/Caladea-Regular.ttf',
      bold: '/fonts/pdf-editor/Caladea-Bold.ttf',
      italic: '/fonts/pdf-editor/Caladea-Italic.ttf',
      boldItalic: '/fonts/pdf-editor/Caladea-BoldItalic.ttf'
    }
  },
  'Noto Sans Devanagari': {
    family: 'Noto Sans Devanagari',
    files: {
      regular: '/fonts/NotoSansDevanagari-Regular.ttf',
      bold: '/fonts/NotoSansDevanagari-Regular.ttf',
      italic: '/fonts/NotoSansDevanagari-Regular.ttf',
      boldItalic: '/fonts/NotoSansDevanagari-Regular.ttf'
    }
  }
};

const ALIASES = [
  [/^arial(?:mt)?$/i, 'Arial'],
  [/^helvetica$/i, 'Helvetica'],
  [/^calibri$/i, 'Calibri'],
  [/^cambria$/i, 'Cambria'],
  [/^times(?:newroman)?(?:psmt)?$/i, 'Times New Roman'],
  [/^timesroman$/i, 'Times New Roman'],
  [/^timesnewromanps(?:bold|italic|bolditalic)?mt$/i, 'Times New Roman'],
  [/^arial(?:bold|italic|bolditalic)mt$/i, 'Arial'],
  [/^couriernewps(?:bold|italic|bolditalic)?mt$/i, 'Courier New'],
  [/^tinos$/i, 'Tinos'],
  [/^courier(?:new)?$/i, 'Courier New'],
  [/^roboto$/i, 'Roboto'],
  [/^montserrat$/i, 'Montserrat'],
  [/^arimo$/i, 'Arimo'],
  [/^carlito$/i, 'Carlito'],
  [/^caladea$/i, 'Caladea'],
  [/^notosansdevanagari$/i, 'Noto Sans Devanagari']
];

const STANDARD_BASE_FAMILIES = new Map([
  ['helvetica', 'Helvetica'],
  ['helvetica-bold', 'Helvetica'],
  ['helvetica-oblique', 'Helvetica'],
  ['helvetica-boldoblique', 'Helvetica'],
  ['times-roman', 'Times New Roman'],
  ['times-bold', 'Times New Roman'],
  ['times-italic', 'Times New Roman'],
  ['times-bolditalic', 'Times New Roman'],
  ['courier', 'Courier New'],
  ['courier-bold', 'Courier New'],
  ['courier-oblique', 'Courier New'],
  ['courier-boldoblique', 'Courier New']
]);

function stripSubsetPrefix(value) {
  return String(value || '').replace(/^[A-Z]{6}\+/, '');
}

function stripStyleSuffix(value) {
  return value
    .replace(/[-_, ]+(regular|normal|roman|book|medium|light|semibold|demibold|demi|bold|black|heavy|italic|oblique|slanted|bolditalic|boldoblique)$/i, '')
    .replace(/(BoldItalic|BoldOblique|SemiBold|DemiBold|Bold|Italic|Oblique)$/i, '')
    .trim();
}

function compactName(value) {
  return String(value || '').replace(/[\s,_-]+/g, '').toLowerCase();
}

function styleFromName(value, style = {}) {
  const raw = String(value || '');
  const bold = Number(style.fontWeight || 0) >= 600 || /bold|black|heavy|demi|semibold/i.test(raw);
  const italic = Boolean(style.italic) || /italic|oblique|slanted/i.test(raw);
  return { bold, italic, weight: bold ? 700 : 400 };
}

function normalizedFamily(value) {
  let base = stripSubsetPrefix(value).replace(/,/g, ' ').replace(/_/g, ' ');
  // pdf-lib adds a numeric suffix to embedded font names. Recognize it only
  // for known families so reopening an exported PDF retains the same preview.
  const withoutSuffix = base.replace(/-\d+$/, '');
  const knownFamily = stripStyleSuffix(withoutSuffix);
  if (ALIASES.some(([pattern]) => pattern.test(compactName(knownFamily)) || pattern.test(knownFamily))) base = withoutSuffix;
  const stripped = stripStyleSuffix(base).trim();
  const compact = compactName(stripped);
  for (const [pattern, family] of ALIASES) {
    if (pattern.test(compact) || pattern.test(stripped)) return family;
  }
  return stripped || 'Helvetica';
}

function fileKey(bold, italic) {
  if (bold && italic) return 'boldItalic';
  if (bold) return 'bold';
  if (italic) return 'italic';
  return 'regular';
}

function bundledPlan(family, bold, italic, quality, reason, detectedFamily = family) {
  const bundle = BUNDLED_FONTS[family];
  const src = bundle.files[fileKey(bold, italic)];
  return {
    detectedFamily,
    previewFont: { type: 'bundled', family, src, quality },
    exportFont: { type: 'bundled', family, src, quality },
    matchQuality: quality,
    fallbackReason: reason || null
  };
}

function standardPlan(family, rawName) {
  return {
    detectedFamily: family,
    previewFont: {
      type: 'css-fallback',
      family: family === 'Times New Roman' ? 'Tinos' : family === 'Courier New' ? 'Courier New' : 'Arimo',
      quality: 'matched'
    },
    exportFont: { type: 'source-standard', family, quality: 'exact', rawName },
    matchQuality: 'matched',
    fallbackReason: 'The PDF standard font is retained for supported true replacements; the browser preview uses a metric-compatible family.'
  };
}

function resolvePlan(detectedFamily, rawName, bold, italic) {
  const rawBase = stripSubsetPrefix(String(rawName || '')).toLowerCase();
  const standardFamily = STANDARD_BASE_FAMILIES.get(rawBase);
  if (standardFamily) return standardPlan(standardFamily, rawName);
  if (detectedFamily === 'Arial' || detectedFamily === 'Arimo') {
    return bundledPlan('Arimo', bold, italic, detectedFamily === 'Arimo' ? 'exact' : 'matched', detectedFamily === 'Arial' ? 'Arimo is used as an Arial-compatible substitute for preview and overlay export.' : null, detectedFamily);
  }
  if (detectedFamily === 'Calibri' || detectedFamily === 'Carlito') {
    return bundledPlan('Carlito', bold, italic, detectedFamily === 'Carlito' ? 'exact' : 'matched', detectedFamily === 'Calibri' ? 'Carlito is used as a Calibri-compatible substitute for preview and overlay export.' : null, detectedFamily);
  }
  if (detectedFamily === 'Cambria' || detectedFamily === 'Caladea') {
    return bundledPlan('Caladea', bold, italic, detectedFamily === 'Caladea' ? 'exact' : 'matched', detectedFamily === 'Cambria' ? 'Caladea is used as a Cambria-compatible substitute for preview and overlay export.' : null, detectedFamily);
  }
  if (detectedFamily === 'Times New Roman' || detectedFamily === 'Tinos') {
    return bundledPlan('Tinos', bold, italic, detectedFamily === 'Tinos' ? 'exact' : 'matched', detectedFamily === 'Tinos' ? null : 'Tinos is used as a Times New Roman-compatible substitute for preview and overlay export.', detectedFamily);
  }
  if (detectedFamily === 'Noto Sans Devanagari') return bundledPlan('Noto Sans Devanagari', false, false, 'exact', null, detectedFamily);
  if (detectedFamily === 'Roboto' || detectedFamily === 'Montserrat') {
    return bundledPlan('Arimo', bold, italic, 'fallback', 'The original family is not bundled as a static export font yet. Arimo is used consistently for preview and overlay export.', detectedFamily);
  }
  return bundledPlan('Arimo', bold, italic, 'fallback', 'The original font could not be reused safely. Arimo is used consistently for preview and overlay export.', detectedFamily);
}

export function createFontDescriptor({ style = {}, pdfFontName = '', requestedFamily = '', bold, italic } = {}) {
  const rawPdfFontName = String(pdfFontName || style.fontFamily || requestedFamily || '');
  const sourceName = requestedFamily || style.fontFamily || rawPdfFontName;
  const detectedFamily = normalizedFamily(sourceName);
  const sourceStyle = styleFromName(rawPdfFontName + ' ' + sourceName, style);
  const resolvedBold = typeof bold === 'boolean' ? bold : sourceStyle.bold;
  const resolvedItalic = typeof italic === 'boolean' ? italic : sourceStyle.italic;
  const plan = resolvePlan(detectedFamily, rawPdfFontName, resolvedBold, resolvedItalic);
  return {
    rawPdfFontName,
    normalizedFamily: detectedFamily,
    detectedFamily,
    weight: resolvedBold ? 700 : 400,
    bold: resolvedBold,
    italic: resolvedItalic,
    subset: /^[A-Z]{6}\+/.test(rawPdfFontName),
    embedded: typeof style.embedded === 'boolean' ? style.embedded : null,
    glyphCoverage: 'unchecked',
    previewFont: plan.previewFont,
    exportFont: plan.exportFont,
    matchQuality: plan.matchQuality,
    fallbackReason: plan.fallbackReason
  };
}

export function resolveFont(style = {}, pdfFontName = '') {
  const descriptor = createFontDescriptor({ style, pdfFontName });
  return {
    rawName: descriptor.rawPdfFontName,
    family: descriptor.previewFont.family,
    detectedFamily: descriptor.detectedFamily,
    quality: descriptor.matchQuality,
    bold: descriptor.bold,
    italic: descriptor.italic,
    descriptor
  };
}

export function descriptorForFamily(family, { bold = false, italic = false } = {}) {
  return createFontDescriptor({ requestedFamily: family, pdfFontName: family, bold, italic });
}

export function getBundledFontSource(descriptor, bold, italic) {
  if (!descriptor) return null;
  const family = descriptor.exportFont && descriptor.exportFont.type === 'bundled'
    ? descriptor.exportFont.family
    : descriptor.previewFont && descriptor.previewFont.type === 'bundled'
      ? descriptor.previewFont.family
      : null;
  const bundle = family && BUNDLED_FONTS[family];
  return bundle ? bundle.files[fileKey(Boolean(bold), Boolean(italic))] : null;
}

export function getPreviewFontFamily(object) {
  return object && object.fontDescriptor && object.fontDescriptor.previewFont
    ? object.fontDescriptor.previewFont.family
    : object && object.fontFamily
      ? object.fontFamily
      : 'Arimo';
}

export function resolveStandardFont(PDFLib, object) {
  const detected = String((object.fontDescriptor && object.fontDescriptor.detectedFamily) || object.detectedFontFamily || object.fontFamily || '').toLowerCase();
  const bold = Boolean(object.bold);
  const italic = Boolean(object.italic);
  const standard = PDFLib.StandardFonts;
  if (detected === 'times new roman' || detected === 'cambria' || detected === 'caladea') {
    if (bold && italic) return standard.TimesRomanBoldItalic;
    if (bold) return standard.TimesRomanBold;
    if (italic) return standard.TimesRomanItalic;
    return standard.TimesRoman;
  }
  if (detected === 'courier new' || detected === 'courier') {
    if (bold && italic) return standard.CourierBoldOblique;
    if (bold) return standard.CourierBold;
    if (italic) return standard.CourierOblique;
    return standard.Courier;
  }
  if (bold && italic) return standard.HelveticaBoldOblique;
  if (bold) return standard.HelveticaBold;
  if (italic) return standard.HelveticaOblique;
  return standard.Helvetica;
}

export function getFontMatchLabel(object) {
  const descriptor = object && object.fontDescriptor;
  const quality = descriptor ? descriptor.matchQuality : object && object.fontQuality;
  if (quality === 'exact') return '✓ Original font';
  if (quality === 'matched') return '≈ Matched font';
  return '⚠ Fallback font';
}

export function getFontMatchDescription(object) {
  if (object && object.ocrAssisted) return 'OCR-assisted text has no source font metadata. The selected local font is used for preview and export.';
  const descriptor = object && object.fontDescriptor;
  if (descriptor && descriptor.fallbackReason) return descriptor.fallbackReason;
  if (descriptor && descriptor.matchQuality === 'exact') return 'The same bundled font is used for browser preview and overlay export.';
  if (descriptor && descriptor.matchQuality === 'matched') return 'A local metric-compatible font is used consistently for browser preview and overlay export.';
  return 'The original font could not be reused safely. A local fallback is used consistently for preview and overlay export.';
}

export { BUNDLED_FONTS };
