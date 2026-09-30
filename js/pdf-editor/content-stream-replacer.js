function isAsciiText(value) {
  return typeof value === 'string' && /^[\x20-\x7E]*$/.test(value);
}

function isWhitespace(code) {
  return code === 0 || code === 9 || code === 10 || code === 12 || code === 13 || code === 32;
}

function isDelimiter(code) {
  return code === 40 || code === 41 || code === 60 || code === 62 || code === 91 || code === 93 || code === 123 || code === 125 || code === 47 || code === 37;
}

function bytesToBinaryString(bytes) {
  let result = '';
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    result += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return result;
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xFF;
  return bytes;
}

function decodeLiteral(source, start) {
  let depth = 1;
  let index = start + 1;
  let value = '';
  while (index < source.length && depth > 0) {
    const code = source.charCodeAt(index);
    if (code === 92) {
      index += 1;
      if (index >= source.length) break;
      const escaped = source.charCodeAt(index);
      if (escaped === 110) value += '\n';
      else if (escaped === 114) value += '\r';
      else if (escaped === 116) value += '\t';
      else if (escaped === 98) value += '\b';
      else if (escaped === 102) value += '\f';
      else if (escaped === 10) {}
      else if (escaped === 13) {
        if (source.charCodeAt(index + 1) === 10) index += 1;
      } else if (escaped >= 48 && escaped <= 55) {
        let octal = source[index];
        let count = 1;
        while (count < 3 && index + 1 < source.length) {
          const next = source.charCodeAt(index + 1);
          if (next < 48 || next > 55) break;
          index += 1;
          count += 1;
          octal += source[index];
        }
        value += String.fromCharCode(parseInt(octal, 8) & 0xFF);
      } else value += String.fromCharCode(escaped);
    } else if (code === 40) {
      depth += 1;
      value += '(';
    } else if (code === 41) {
      depth -= 1;
      if (depth > 0) value += ')';
    } else {
      value += source[index];
    }
    index += 1;
  }
  if (depth !== 0) return null;
  return { end: index, value };
}

function decodeHex(source, start) {
  const close = source.indexOf('>', start + 1);
  if (close < 0) return null;
  let hex = source.slice(start + 1, close).replace(/[\x00\t\n\f\r ]/g, '');
  if (!/^[0-9A-Fa-f]*$/.test(hex)) return null;
  if (hex.length % 2) hex += '0';
  let value = '';
  for (let index = 0; index < hex.length; index += 2) value += String.fromCharCode(parseInt(hex.slice(index, index + 2), 16));
  return { end: close + 1, value };
}

function decodeName(raw) {
  return raw.replace(/#([0-9A-Fa-f]{2})/g, (_match, value) => String.fromCharCode(parseInt(value, 16)));
}

function tokenize(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const code = source.charCodeAt(index);
    if (isWhitespace(code)) {
      index += 1;
      continue;
    }
    if (code === 37) {
      while (index < source.length && ![10, 13].includes(source.charCodeAt(index))) index += 1;
      continue;
    }
    if (code === 40) {
      const literal = decodeLiteral(source, index);
      if (!literal) return null;
      tokens.push({ type: 'string', start: index, end: literal.end, value: literal.value, encoding: 'literal' });
      index = literal.end;
      continue;
    }
    if (code === 60 && source.charCodeAt(index + 1) !== 60) {
      const hex = decodeHex(source, index);
      if (!hex) return null;
      tokens.push({ type: 'string', start: index, end: hex.end, value: hex.value, encoding: 'hex' });
      index = hex.end;
      continue;
    }
    if (code === 47) {
      const start = index;
      index += 1;
      while (index < source.length && !isWhitespace(source.charCodeAt(index)) && !isDelimiter(source.charCodeAt(index))) index += 1;
      tokens.push({ type: 'name', start, end: index, value: decodeName(source.slice(start + 1, index)) });
      continue;
    }
    if (code === 91 || code === 93) {
      tokens.push({ type: code === 91 ? 'array-start' : 'array-end', start: index, end: index + 1, value: source[index] });
      index += 1;
      continue;
    }
    if ((code === 60 && source.charCodeAt(index + 1) === 60) || (code === 62 && source.charCodeAt(index + 1) === 62)) {
      tokens.push({ type: 'dict-marker', start: index, end: index + 2, value: source.slice(index, index + 2) });
      index += 2;
      continue;
    }
    const start = index;
    while (index < source.length && !isWhitespace(source.charCodeAt(index)) && !isDelimiter(source.charCodeAt(index))) index += 1;
    if (start === index) {
      tokens.push({ type: 'delimiter', start: index, end: index + 1, value: source[index] });
      index += 1;
    } else {
      tokens.push({ type: 'word', start, end: index, value: source.slice(start, index) });
    }
  }
  return tokens;
}

function escapeLiteral(value) {
  return '(' + value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n') + ')';
}

function encodeStringToken(value, encoding) {
  if (encoding === 'hex') {
    let hex = '';
    for (let index = 0; index < value.length; index += 1) hex += (value.charCodeAt(index) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
    return '<' + hex + '>';
  }
  return escapeLiteral(value);
}

function countOccurrences(value, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = value.indexOf(needle, offset)) >= 0) {
    count += 1;
    offset += Math.max(1, needle.length);
  }
  return count;
}

function candidateReplacement(token, object) {
  const original = object.originalText || '';
  const parent = object.parentText || original;
  if (!original || !isAsciiText(original) || !isAsciiText(parent) || !isAsciiText(object.text)) return null;
  if (parent && countOccurrences(token.value, parent) === 1 && countOccurrences(parent, original) === 1) {
    const nextParent = parent.replace(original, object.text);
    return token.value.replace(parent, nextParent);
  }
  if (parent === original && countOccurrences(token.value, original) === 1) return token.value.replace(original, object.text);
  return null;
}

function collectShowCandidates(tokens, object) {
  const matches = [];
  let inText = false;
  let activeFont = null;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'word') continue;
    if (token.value === 'BT') {
      inText = true;
      activeFont = null;
      continue;
    }
    if (token.value === 'ET') {
      inText = false;
      activeFont = null;
      continue;
    }
    if (!inText) continue;
    if (token.value === 'Tf' && tokens[index - 2] && tokens[index - 2].type === 'name') {
      activeFont = tokens[index - 2].value;
      continue;
    }
    if (token.value === 'Tj' || token.value === "'" || token.value === '"') {
      const stringToken = tokens[index - 1];
      if (stringToken && stringToken.type === 'string') {
        const replacement = candidateReplacement(stringToken, object);
        if (replacement !== null) matches.push({ token: stringToken, replacement, fontName: activeFont });
      }
      continue;
    }
    if (token.value === 'TJ') {
      let cursor = index - 1;
      while (cursor >= 0 && tokens[cursor].type !== 'array-start') cursor -= 1;
      if (cursor < 0) continue;
      for (let itemIndex = cursor + 1; itemIndex < index; itemIndex += 1) {
        const stringToken = tokens[itemIndex];
        if (stringToken.type !== 'string') continue;
        const replacement = candidateReplacement(stringToken, object);
        if (replacement !== null) matches.push({ token: stringToken, replacement, fontName: activeFont });
      }
    }
  }
  return matches;
}

function unchangedSourceStyle(object) {
  const same = (left, right, tolerance = 0.01) => Math.abs(Number(left) - Number(right)) <= tolerance;
  return !object.fontRestyled
    && same(object.x, object.originalX)
    && same(object.y, object.originalY)
    && same(object.rotation, object.originalRotation)
    && same(object.fontSize, object.originalFontSize ?? object.fontSize)
    && String(object.fontFamily || '') === String(object.originalFontFamily || object.fontFamily || '')
    && String(object.colorHex || '').toUpperCase() === String(object.originalColorHex || object.colorHex || '').toUpperCase()
    && Boolean(object.bold) === Boolean(object.originalBold ?? object.bold)
    && Boolean(object.italic) === Boolean(object.originalItalic ?? object.italic)
    && same(object.letterSpacing || 0, object.originalLetterSpacing || 0)
    && same(object.opacity ?? 1, object.originalOpacity ?? 1);
}

function standardFontResource(page, fontName, PDFLib) {
  if (!fontName) return false;
  const resources = page.node.Resources();
  if (!resources) return false;
  const fontDict = resources.lookupMaybe(PDFLib.PDFName.of('Font'), PDFLib.PDFDict);
  if (!fontDict) return false;
  const font = fontDict.lookupMaybe(PDFLib.PDFName.of(fontName), PDFLib.PDFDict);
  if (!font) return false;
  const subtype = font.lookupMaybe(PDFLib.PDFName.of('Subtype'), PDFLib.PDFName);
  const baseFont = font.lookupMaybe(PDFLib.PDFName.of('BaseFont'), PDFLib.PDFName);
  const subtypeName = subtype ? subtype.asString().replace(/^\//, '') : '';
  const baseName = baseFont ? baseFont.asString().replace(/^\//, '').replace(/^[A-Z]{6}\+/, '') : '';
  return subtypeName === 'Type1' && /^(Helvetica|Helvetica-Bold|Helvetica-Oblique|Helvetica-BoldOblique|Times-Roman|Times-Bold|Times-Italic|Times-BoldItalic|Courier|Courier-Bold|Courier-Oblique|Courier-BoldOblique)$/.test(baseName);
}

function streamCanBeRewritten(stream) {
  const allowed = new Set(['Length', 'Filter', 'DecodeParms']);
  return stream.dict.keys().every((key) => allowed.has(key.asString().replace(/^\//, '')));
}

function contentStreamEntries(page, PDFLib) {
  const context = page.doc.context;
  const contents = page.node.Contents();
  if (!contents) return [];
  if (contents instanceof PDFLib.PDFArray) {
    const entries = [];
    for (let index = 0; index < contents.size(); index += 1) {
      const ref = contents.get(index);
      if (!(ref instanceof PDFLib.PDFRef)) return [];
      const stream = context.lookup(ref);
      if (!(stream instanceof PDFLib.PDFRawStream)) return [];
      entries.push({ ref, stream });
    }
    return entries;
  }
  const raw = page.node.get(PDFLib.PDFName.of('Contents'));
  if (!(raw instanceof PDFLib.PDFRef) || !(contents instanceof PDFLib.PDFRawStream)) return [];
  return [{ ref: raw, stream: contents }];
}

export function attemptTrueTextReplacement(pdfDocument, page, object, PDFLib) {
  if (!pdfDocument || !page || !object || !PDFLib) return { success: false, reason: 'missing-input' };
  if (object.type !== 'text' || !object.modified || object.ocrAssisted) return { success: false, reason: 'unsupported-object' };
  if (!unchangedSourceStyle(object)) return { success: false, reason: 'restyled-or-moved' };
  if (!isAsciiText(object.text) || !isAsciiText(object.originalText) || !isAsciiText(object.parentText || object.originalText)) {
    return { success: false, reason: 'non-ascii-encoding' };
  }
  const streams = contentStreamEntries(page, PDFLib);
  if (!streams.length) return { success: false, reason: 'unsupported-content-stream' };

  const candidates = [];
  try {
    streams.forEach((entry) => {
      if (!streamCanBeRewritten(entry.stream)) return;
      const decoded = PDFLib.decodePDFRawStream(entry.stream).decode();
      const source = bytesToBinaryString(decoded);
      const tokens = tokenize(source);
      if (!tokens) return;
      collectShowCandidates(tokens, object).forEach((match) => {
        if (standardFontResource(page, match.fontName, PDFLib)) candidates.push({ ...entry, source, ...match });
      });
    });
  } catch (error) {
    return { success: false, reason: 'stream-decode-failed' };
  }
  if (candidates.length !== 1) return { success: false, reason: candidates.length ? 'ambiguous-source-run' : 'source-run-not-found' };

  const candidate = candidates[0];
  const encoded = encodeStringToken(candidate.replacement, candidate.token.encoding);
  const nextSource = candidate.source.slice(0, candidate.token.start) + encoded + candidate.source.slice(candidate.token.end);
  const nextStream = pdfDocument.context.stream(binaryStringToBytes(nextSource));
  pdfDocument.context.assign(candidate.ref, nextStream);
  return {
    success: true,
    mode: 'true-text-replacement',
    fontResource: candidate.fontName,
    originalText: object.originalText,
    replacementText: object.text
  };
}
