import { editorState } from './state.js';
import { getTextScreenBox } from './page-renderer.js';
import { resolveStandardFont } from './font-resolver.js';
import { sampleBackgroundFromCanvas } from './color-extractor.js';

const fontCache = new Map();
let devanagariFontBytes = null;

function colorFromHex(PDFLib, value) {
  const digits = String(value || '#1F1F1F').replace('#', '');
  const full = digits.length === 3 ? digits.split('').map((digit) => digit + digit).join('') : digits;
  const channels = [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
  return PDFLib.rgb(channels[0], channels[1], channels[2]);
}

function cleanFileBase(filename) {
  const base = String(filename || 'document.pdf')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\.pdf$/i, '')
    .replace(/[. ]+$/g, '')
    .slice(0, 100);
  return base || 'document';
}

function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

async function getDevanagariFont(pdfDocument) {
  if (!window.fontkit) return null;
  try {
    if (!devanagariFontBytes) {
      const response = await fetch('/fonts/NotoSansDevanagari-Regular.ttf', { credentials: 'same-origin' });
      if (!response.ok) return null;
      devanagariFontBytes = new Uint8Array(await response.arrayBuffer());
    }
    if (typeof pdfDocument.registerFontkit === 'function') pdfDocument.registerFontkit(window.fontkit);
    const cacheKey = 'noto-devanagari';
    if (!fontCache.has(cacheKey)) {
      const embedded = await pdfDocument.embedFont(devanagariFontBytes, { subset: true });
      fontCache.set(cacheKey, embedded);
    }
    return fontCache.get(cacheKey);
  } catch (error) {
    console.warn('[PDF Editor] Local Devanagari font could not be embedded.', error);
    return null;
  }
}

async function getEditableFont(pdfDocument, PDFLib, object) {
  if (String(object.fontFamily || '').toLowerCase() === 'noto sans devanagari') {
    const embedded = await getDevanagariFont(pdfDocument);
    if (embedded) return embedded;
  }
  const standard = resolveStandardFont(PDFLib, object);
  const key = String(standard);
  if (!fontCache.has(key)) fontCache.set(key, await pdfDocument.embedFont(standard));
  return fontCache.get(key);
}

async function renderBackgroundSamples(pdfPage, objects) {
  const scale = Math.min(1, 1200 / Math.max(pdfPage.view[2] - pdfPage.view[0], pdfPage.view[3] - pdfPage.view[1]));
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  try {
    await pdfPage.render({ canvasContext: context, viewport }).promise;
    const backgrounds = objects.map((object) => {
      const sampleObject = { ...object, x: object.originalX, y: object.originalY, rotation: object.originalRotation };
      return sampleBackgroundFromCanvas(canvas, getTextScreenBox(sampleObject, viewport));
    });
    canvas.width = 0;
    canvas.height = 0;
    return backgrounds;
  } catch (error) {
    canvas.width = 0;
    canvas.height = 0;
    console.warn('[PDF Editor] Background sample could not be rendered.', error);
    return objects.map(() => ({ rgb: [255, 255, 255], hex: '#FFFFFF', quality: 'estimated', complex: true }));
  }
}

function getOriginalCoverBox(object, replacementWidth) {
  const size = Math.max(1, object.fontSize);
  const pad = Math.max(0.8, size * 0.055);
  const originalWidth = Math.max(object.width, size * 0.35);
  const width = Math.max(originalWidth, replacementWidth || 0) + pad * 2;
  const height = Math.max(object.height, size * (object.ascent - object.descent), size * 1.1) + pad * 2;
  return {
    x: object.originalX - pad,
    y: object.originalY - size * Math.max(0.2, Math.abs(object.descent)) - pad,
    width,
    height,
    rotation: object.originalRotation,
    pad
  };
}

function addWarning(warnings, message) {
  if (!warnings.includes(message)) warnings.push(message);
}

function colorOrNull(PDFLib, value) {
  return value && value !== 'transparent' ? colorFromHex(PDFLib, value) : undefined;
}

function dataUrlBytes(value) {
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(String(value || ''));
  if (!match) throw new Error('This image could not be decoded for the PDF. Choose a PNG, JPG, or WebP image.');
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { bytes, type: match[1] };
}

async function exportOverlayObject(page, pdfDocument, PDFLib, object) {
  if (object.type === 'image' || object.type === 'signature') {
    const imageData = dataUrlBytes(object.imageData);
    const image = imageData.type === 'jpeg'
      ? await pdfDocument.embedJpg(imageData.bytes)
      : await pdfDocument.embedPng(imageData.bytes);
    page.drawImage(image, {
      x: object.x,
      y: object.y,
      width: object.width,
      height: object.height,
      rotate: PDFLib.degrees(object.rotation || 0),
      opacity: Math.max(0, Math.min(1, Number(object.opacity ?? 1)))
    });
    return;
  }

  if (object.type === 'draw') {
    const points = Array.isArray(object.points) ? object.points : [];
    const color = colorFromHex(PDFLib, object.strokeColor || '#1D4ED8');
    for (let index = 1; index < points.length; index += 1) {
      page.drawLine({
        start: { x: points[index - 1][0], y: points[index - 1][1] },
        end: { x: points[index][0], y: points[index][1] },
        thickness: Math.max(0.5, Number(object.strokeWidth || 2.5)),
        color,
        opacity: Math.max(0, Math.min(1, Number(object.opacity ?? 1))),
        lineCap: PDFLib.LineCapStyle.Round
      });
    }
    return;
  }

  if (!['shape', 'highlight', 'whiteout'].includes(object.type)) return;
  const shape = object.shape || 'rectangle';
  const opacity = Math.max(0, Math.min(1, Number(object.opacity ?? 1)));
  const fill = colorOrNull(PDFLib, object.fillColor);
  const border = colorOrNull(PDFLib, object.strokeColor);
  const borderWidth = Math.max(0, Number(object.strokeWidth || 0));
  const x = Number(object.x) || 0;
  const y = Number(object.y) || 0;
  const width = Math.max(1, Number(object.width) || 1);
  const height = Math.max(1, Number(object.height) || 1);
  const rotation = PDFLib.degrees(Number(object.rotation) || 0);

  if (shape === 'line' || shape === 'arrow') {
    const start = { x, y };
    const end = { x: x + width, y: y + height };
    page.drawLine({ start, end, thickness: Math.max(0.5, borderWidth || 2), color: border || fill || PDFLib.rgb(0.15, 0.35, 0.9), opacity, lineCap: PDFLib.LineCapStyle.Round });
    if (shape === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLength = Math.max(6, Math.min(16, width * 0.15, height * 0.4));
      for (const side of [-1, 1]) {
        const headAngle = angle + Math.PI + side * Math.PI / 6;
        page.drawLine({
          start: end,
          end: { x: end.x + Math.cos(headAngle) * headLength, y: end.y + Math.sin(headAngle) * headLength },
          thickness: Math.max(0.5, borderWidth || 2),
          color: border || fill || PDFLib.rgb(0.15, 0.35, 0.9),
          opacity,
          lineCap: PDFLib.LineCapStyle.Round
        });
      }
    }
  } else if (shape === 'ellipse') {
    page.drawEllipse({
      x: x + width / 2,
      y: y + height / 2,
      xScale: width / 2,
      yScale: height / 2,
      rotate: rotation,
      color: fill,
      opacity,
      borderColor: border,
      borderOpacity: opacity,
      borderWidth
    });
  } else {
    page.drawRectangle({
      x, y, width, height,
      rotate: rotation,
      color: fill,
      opacity,
      borderColor: border,
      borderOpacity: opacity,
      borderWidth
    });
  }
}

export async function exportEditedPdf({ onProgress = () => {} } = {}) {
  const PDFLib = window.PDFLib;
  if (!PDFLib || !editorState.originalBytes) throw new Error('There is no PDF open to export.');
  fontCache.clear();
  const changed = editorState.objects.filter((object) => object.modified || object.isNew);
  if (!changed.length && !editorState.pageStructureChanged) throw new Error('Make a text or page change before downloading the edited PDF.');

  let pdfDocument;
  let sourcePdfDocument = null;
  try {
    sourcePdfDocument = await PDFLib.PDFDocument.load(editorState.originalBytes.slice());
    if (editorState.pageStructureChanged) {
      pdfDocument = await PDFLib.PDFDocument.create();
      for (const metadata of editorState.pages) {
        let outputPage;
        if (metadata.isBlank || !metadata.sourcePageNumber) {
          outputPage = pdfDocument.addPage([metadata.baseWidth || metadata.width, metadata.baseHeight || metadata.height]);
        } else {
          const [copiedPage] = await pdfDocument.copyPages(sourcePdfDocument, [metadata.sourcePageNumber - 1]);
          outputPage = pdfDocument.addPage(copiedPage);
        }
        if (typeof outputPage.setRotation === 'function') outputPage.setRotation(PDFLib.degrees(Number(metadata.rotation) || 0));
      }
      const metadataPairs = [
        ['setTitle', 'getTitle'],
        ['setAuthor', 'getAuthor'],
        ['setSubject', 'getSubject'],
        ['setKeywords', 'getKeywords'],
        ['setCreator', 'getCreator'],
        ['setProducer', 'getProducer']
      ];
      metadataPairs.forEach(([setter, getter]) => {
        if (typeof sourcePdfDocument[getter] !== 'function' || typeof pdfDocument[setter] !== 'function') return;
        try {
          const value = sourcePdfDocument[getter]();
          if (value !== undefined && value !== null && value !== '') pdfDocument[setter](value);
        } catch (error) {}
      });
    } else {
      pdfDocument = sourcePdfDocument;
      sourcePdfDocument = null;
    }
  } catch (error) {
    if (/encrypt|password/i.test((error && error.message) || '')) {
      throw new Error('This PDF is encrypted. Remove its password protection before editing and exporting it.');
    }
    throw new Error('The PDF could not be prepared for export. It may use encryption or an unsupported feature.');
  }

  const warnings = [];
  if (editorState.pageStructureChanged) {
    addWarning(warnings, 'Page order or page count changed. Review copied forms, annotations, bookmarks, and page links in the exported file.');
  }
  const grouped = new Map();
  changed.forEach((object) => {
    if (!grouped.has(object.page)) grouped.set(object.page, []);
    grouped.get(object.page).push(object);
  });
  const pdfjsDocument = editorState.pdfDocument;
  let completedPages = 0;

  for (const [pageNumber, objects] of grouped) {
    const page = pdfDocument.getPage(pageNumber - 1);
    const pageMetadata = editorState.pages[pageNumber - 1];
    const sourcePage = pageMetadata && pageMetadata.sourcePageNumber
      ? await pdfjsDocument.getPage(pageMetadata.sourcePageNumber)
      : null;
    const textToCover = objects.filter((object) => ['text', 'ocr-text'].includes(object.type) && object.modified);
    const pageSamples = sourcePage && textToCover.length ? await renderBackgroundSamples(sourcePage, textToCover) : [];
    const backgrounds = new Map(textToCover.map((object, index) => [object.id, object.background || pageSamples[index]]));
    for (const object of objects) {
      if (!['text', 'new-text', 'ocr-text'].includes(object.type)) {
        await exportOverlayObject(page, pdfDocument, PDFLib, object);
        continue;
      }
      const sampledBackground = backgrounds.get(object.id) || { rgb: [255, 255, 255], quality: 'estimated', complex: false };
      if (sampledBackground.complex) {
        addWarning(warnings, 'Complex background detected. Text replacement may not perfectly match the original background.');
      }
      const font = await getEditableFont(pdfDocument, PDFLib, object);
      let encodedText;
      try {
        encodedText = object.text;
        font.encodeText(encodedText);
      } catch (error) {
        if (hasDevanagari(object.text)) {
          const devanagari = await getDevanagariFont(pdfDocument);
          if (devanagari) {
            try {
              devanagari.encodeText(object.text);
              addWarning(warnings, 'A local Devanagari fallback font was used for new characters. Check the exported text shaping before sharing.');
              // Use the fallback only for the text in this object.
              if (object.type === 'text' || object.type === 'ocr-text') {
                const fallbackWidth = devanagari.widthOfTextAtSize(object.text, object.fontSize);
                const fallbackCover = getOriginalCoverBox(object, fallbackWidth);
                const back = sampledBackground.rgb || [255, 255, 255];
                page.drawRectangle({
                  x: fallbackCover.x,
                  y: fallbackCover.y,
                  width: fallbackCover.width,
                  height: fallbackCover.height,
                  rotate: PDFLib.degrees(fallbackCover.rotation),
                  color: PDFLib.rgb(back[0] / 255, back[1] / 255, back[2] / 255)
                });
              }
              page.drawText(encodedText, {
                x: object.x,
                y: object.y,
                font: devanagari,
                fontSize: object.fontSize,
                color: colorFromHex(PDFLib, object.colorHex),
                rotate: PDFLib.degrees(object.rotation),
                opacity: Math.max(0, Math.min(1, Number(object.opacity ?? 1))),
                characterSpacing: Math.max(-4, Math.min(24, Number(object.letterSpacing || 0)))
              });
              continue;
            } catch (fallbackError) {
              throw new Error('The selected font cannot encode every new character. This PDF was not downloaded so its text is not silently changed.');
            }
          }
        }
        throw new Error('The selected font cannot encode every new character. This PDF was not downloaded so its text is not silently changed.');
      }

      const replacementWidth = object.text ? font.widthOfTextAtSize(object.text, object.fontSize) : 0;
      if (object.type === 'text' || object.type === 'ocr-text') {
        const cover = getOriginalCoverBox(object, replacementWidth);
        const backgroundRgb = sampledBackground.rgb || [255, 255, 255];
        page.drawRectangle({
          x: cover.x,
          y: cover.y,
          width: cover.width,
          height: cover.height,
          rotate: PDFLib.degrees(cover.rotation),
          color: PDFLib.rgb(backgroundRgb[0] / 255, backgroundRgb[1] / 255, backgroundRgb[2] / 255)
        });
      }
      if (object.text) {
        let drawX = object.x;
        if (object.type === 'new-text' && object.alignment === 'center') drawX += (object.width - replacementWidth) / 2;
        else if (object.type === 'new-text' && object.alignment === 'right') drawX += object.width - replacementWidth;
        page.drawText(encodedText, {
          x: drawX,
          y: object.y,
          font,
          fontSize: object.fontSize,
          color: colorFromHex(PDFLib, object.colorHex),
          rotate: PDFLib.degrees(object.rotation),
          opacity: Math.max(0, Math.min(1, Number(object.opacity ?? 1))),
          characterSpacing: Math.max(-4, Math.min(24, Number(object.letterSpacing || 0)))
        });
      }
      if (object.fontQuality !== 'exact') {
        addWarning(warnings, 'Some edited text uses a built-in substitute font because the original custom or subset font could not be reused.');
      }
    }
    completedPages += 1;
    onProgress(completedPages, grouped.size);
    if (sourcePage) sourcePage.cleanup();
  }

  let savedBytes;
  try {
    savedBytes = await pdfDocument.save({ useObjectStreams: true });
  } catch (error) {
    throw new Error('The edited PDF could not be saved. ' + ((error && error.message) || 'Try another file.'));
  }

  // Re-open with both local parsers before the download starts.
  try {
    const checkPdf = await PDFLib.PDFDocument.load(savedBytes.slice());
    if (checkPdf.getPageCount() !== editorState.pages.length) throw new Error('Page count changed unexpectedly.');
    const validationTask = window.pdfjsLib.getDocument({ data: savedBytes.slice() });
    const checkPdfJs = await validationTask.promise;
    if (checkPdfJs.numPages !== editorState.pages.length) throw new Error('The exported PDF has a different page count.');
    await checkPdfJs.destroy();
  } catch (error) {
    throw new Error('The exported PDF did not pass a local integrity check, so it was not downloaded.');
  }

  const blob = new Blob([savedBytes], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = cleanFileBase(editorState.file && editorState.file.name) + '_edited.pdf';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
  return { warnings, byteLength: savedBytes.byteLength };
}
