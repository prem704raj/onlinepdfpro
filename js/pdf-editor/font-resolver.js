const FONT_ALIASES = [
  [/^helvetica(?:[-, ].*)?$/i, 'Helvetica', 'matched'],
  [/^arialmt$/i, 'Arial', 'matched'],
  [/^arial(?:[-, ].*)?$/i, 'Arial', 'matched'],
  [/^timesnewromanpsmt$/i, 'Times New Roman', 'matched'],
  [/^times(?:newroman)?(?:ps)?[-, ].*$/i, 'Times New Roman', 'matched'],
  [/^times-roman$/i, 'Times New Roman', 'matched'],
  [/^courier(?:new)?(?:[-, ].*)?$/i, 'Courier New', 'matched'],
  [/^calibri(?:[-, ].*)?$/i, 'Calibri', 'matched'],
  [/^cambria(?:[-, ].*)?$/i, 'Cambria', 'matched'],
  [/^roboto(?:[-, ].*)?$/i, 'Roboto', 'matched'],
  [/^montserrat(?:[-, ].*)?$/i, 'Montserrat', 'matched'],
  [/^notosansdevanagari(?:[-, ].*)?$/i, 'Noto Sans Devanagari', 'matched']
];

const FAMILY_TO_STANDARD = {
  helvetica: 'Helvetica',
  arial: 'Helvetica',
  'times new roman': 'TimesRoman',
  times: 'TimesRoman',
  'courier new': 'Courier',
  courier: 'Courier',
  calibri: 'Helvetica',
  cambria: 'TimesRoman',
  roboto: 'Helvetica',
  montserrat: 'Helvetica'
};

function cleanFontName(value) {
  return String(value || '')
    .replace(/^[A-Z]{4,8}\+/i, '')
    .replace(/^[A-Z]{4,8}\+/i, '')
    .replace(/[,].*$/, '')
    .replace(/[_]/g, ' ')
    .trim();
}

function findStyleSuffix(value) {
  const name = cleanFontName(value).toLowerCase();
  return {
    bold: /bold|black|heavy|demi|semibold/.test(name),
    italic: /italic|oblique|slanted/.test(name)
  };
}

export function resolveFont(style = {}, pdfFontName = '') {
  const rawName = cleanFontName(style.fontFamily || pdfFontName || '');
  const compact = rawName.replace(/[-, ]?(regular|normal|bold|italic|oblique|medium|light|book|roman)$/i, '').trim();
  const candidate = compact || rawName;
  let family = candidate || 'Helvetica';
  let match = 'fallback';
  for (const [pattern, resolvedFamily, quality] of FONT_ALIASES) {
    if (pattern.test(candidate) || pattern.test(rawName)) {
      family = resolvedFamily;
      match = quality;
      break;
    }
  }
  const suffix = findStyleSuffix(rawName + ' ' + pdfFontName);
  const normalized = rawName.toLowerCase();
  const isStandardPdfFont = /^(helvetica|times-roman|times-bold|times-italic|times-bolditalic|courier|courier-bold|courier-oblique)$/.test(normalized);
  if (isStandardPdfFont && family === 'Helvetica') match = 'exact';
  if (/^times-/.test(normalized)) match = 'exact';
  if (/^courier/.test(normalized)) match = 'exact';

  return {
    rawName: String(pdfFontName || style.fontFamily || ''),
    family,
    quality: match,
    bold: Boolean(style.fontWeight >= 600 || suffix.bold),
    italic: Boolean(style.italic || suffix.italic)
  };
}

export function resolveStandardFont(PDFLib, object) {
  const family = String(object.fontFamily || '').toLowerCase();
  const standardName = FAMILY_TO_STANDARD[family] || 'Helvetica';
  const bold = Boolean(object.bold);
  const italic = Boolean(object.italic);
  const standard = PDFLib.StandardFonts;

  if (standardName === 'TimesRoman') {
    if (bold && italic) return standard.TimesRomanBoldItalic;
    if (bold) return standard.TimesRomanBold;
    if (italic) return standard.TimesRomanItalic;
    return standard.TimesRoman;
  }
  if (standardName === 'Courier') {
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
  if (object.fontQuality === 'exact') return '✓ Original font';
  if (object.fontQuality === 'matched') return '≈ Matched font';
  return '⚠ Fallback font';
}

export function getFontMatchDescription(object) {
  if (object && object.ocrAssisted) return 'OCR-assisted text has no original font metadata. A built-in font will be used for edits.';
  if (object.fontQuality === 'exact') return 'This PDF uses a standard font that can be reused in the exported file.';
  if (object.fontQuality === 'matched') return 'The closest available built-in PDF font will be used for replacement text.';
  return 'This PDF uses a custom or subset font that cannot be reused safely by the current exporter.';
}
