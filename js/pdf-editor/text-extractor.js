import { editorState, getPageState } from './state.js';
import { resolveFont } from './font-resolver.js';
import { extractTextColors, getEstimatedTextColor } from './color-extractor.js';

let measureCanvas = null;

function splitTextItem(item, fontFamily, fontSize) {
  const text = item.str;
  if (item.dir === 'rtl' || !/\s/.test(text)) return [{ text, offset: 0, width: Math.abs(Number(item.width) || 0) }];
  const pieces = text.match(/\S+|\s+/gu) || [text];
  if (pieces.filter((piece) => /\S/.test(piece)).length < 2) return [{ text, offset: 0, width: Math.abs(Number(item.width) || 0) }];
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  const context = measureCanvas.getContext('2d');
  context.font = fontSize + 'px "' + String(fontFamily).replace(/["\\]/g, '') + '", Arial, sans-serif';
  const measured = pieces.map((piece) => context.measureText(piece).width);
  const measuredTotal = measured.reduce((sum, width) => sum + width, 0);
  const sourceWidth = Math.abs(Number(item.width) || 0);
  if (!measuredTotal || !sourceWidth) return [{ text, offset: 0, width: sourceWidth }];
  const factor = sourceWidth / measuredTotal;
  let offset = 0;
  const segments = [];
  pieces.forEach((piece, index) => {
    const width = measured[index] * factor;
    if (/\S/.test(piece)) segments.push({ text: piece, offset, width });
    offset += width;
  });
  return segments.length ? segments : [{ text, offset: 0, width: sourceWidth }];
}

export async function initializePageMetadata(pdfDocument, pageCount, onProgress = () => {}) {
  const pages = new Array(pageCount);
  const batchSize = 4;
  for (let start = 1; start <= pageCount; start += batchSize) {
    const end = Math.min(pageCount, start + batchSize - 1);
    const batch = await Promise.all(Array.from({ length: end - start + 1 }, async (_, offset) => {
      const pageNumber = start + offset;
      const pdfPage = await pdfDocument.getPage(pageNumber);
      const viewport = pdfPage.getViewport({ scale: 1 });
      return {
        pageNumber,
        id: 'page-' + pageNumber,
        sourcePageNumber: pageNumber,
        isBlank: false,
        width: viewport.width,
        height: viewport.height,
        baseWidth: viewport.width,
        baseHeight: viewport.height,
        rotation: pdfPage.rotate || 0,
        baseRotation: pdfPage.rotate || 0,
        view: pdfPage.view ? pdfPage.view.slice() : [0, 0, viewport.width, viewport.height],
        viewport: null,
        renderedScale: 0,
        canvas: null,
        renderTask: null,
        objects: [],
        textLoaded: false,
        textLoading: null,
        thumbnailRendered: false
      };
    }));
    batch.forEach((metadata) => { pages[metadata.pageNumber - 1] = metadata; });
    onProgress(end, pageCount);
  }
  editorState.pages = pages;
  editorState.pageCount = pageCount;
  editorState.originalPageStructure = JSON.stringify(pages.map((page) => ({
    sourcePageNumber: page.sourcePageNumber,
    isBlank: false,
    rotation: page.rotation
  })));
  editorState.pageStructureChanged = false;
  return pages;
}

export async function extractTextForPage(pdfPage, pageNumber, { withColors = true } = {}) {
  const pageState = getPageState(pageNumber);
  if (!pageState) return [];
  if (pageState.textLoaded) return pageState.objects.map((id) => editorState.objects.find((object) => object.id === id)).filter(Boolean);
  if (pageState.textLoading) return pageState.textLoading;

  pageState.textLoading = (async () => {
    const textContent = await pdfPage.getTextContent({ includeMarkedContent: false, disableNormalization: false });
    const textItems = textContent.items || [];
    const colorMap = withColors
      ? await extractTextColors(pdfPage, textItems, window.pdfjsLib)
      : new Map();
    const styles = textContent.styles || {};
    const objects = [];

    textItems.forEach((item, itemIndex) => {
      if (!item || typeof item.str !== 'string' || !item.str.trim() || !Array.isArray(item.transform)) return;
      const transform = item.transform.map(Number);
      const [a, b, c, d, baseX, baseY] = transform;
      const fontSize = Math.max(1, Math.hypot(a, b) || item.height || 10);
      const style = styles[item.fontName] || {};
      const font = resolveFont(style, item.fontName);
      const detectedColor = colorMap.get(itemIndex) || getEstimatedTextColor();
      const segments = splitTextItem(item, font.family, fontSize);
      segments.forEach((segment, segmentIndex) => {
        const x = baseX + (a / fontSize) * segment.offset;
        const y = baseY + (b / fontSize) * segment.offset;
        const segmentTransform = transform.slice();
        segmentTransform[4] = x;
        segmentTransform[5] = y;
        objects.push({
          id: 'p' + pageNumber + '-t' + itemIndex + '-s' + segmentIndex,
          type: 'text',
          page: pageNumber,
          pageId: pageState.id,
          itemIndex,
          segmentIndex,
          parentText: item.str,
          originalText: segment.text,
          text: segment.text,
          x,
          y,
          originalX: x,
          originalY: y,
          width: Math.max(0.1, segment.width),
          originalWidth: Math.max(0.1, segment.width),
          height: Math.max(0.1, Math.abs(Number(item.height) || fontSize)),
          fontName: item.fontName || '',
          fontFamily: font.family,
          fontQuality: font.quality,
          fontSize,
          color: detectedColor,
          colorHex: detectedColor.hex,
          colorQuality: detectedColor.quality,
          rotation: Math.atan2(b, a) * 180 / Math.PI,
          originalRotation: Math.atan2(b, a) * 180 / Math.PI,
          transform: segmentTransform,
          ascent: Number.isFinite(style.ascent) ? style.ascent : 0.8,
          descent: Number.isFinite(style.descent) ? style.descent : -0.2,
          bold: font.bold,
          italic: font.italic,
          alignment: 'left',
          letterSpacing: 0,
          opacity: 1,
          modified: false,
          moved: false,
          background: null,
          warnings: []
        });
      });
    });

    const existing = new Set(editorState.objects.map((object) => object.id));
    objects.forEach((object) => {
      if (!existing.has(object.id)) editorState.objects.push(object);
    });
    pageState.objects = objects.map((object) => object.id);
    pageState.textLoaded = true;
    pageState.textLoading = null;
    return objects;
  })();

  try {
    return await pageState.textLoading;
  } catch (error) {
    pageState.textLoading = null;
    throw error;
  }
}

export async function extractAllText(pdfDocument, { onProgress = () => {} } = {}) {
  const all = [];
  for (let pageNumber = 1; pageNumber <= editorState.pageCount; pageNumber += 1) {
    const pdfPage = await pdfDocument.getPage(pageNumber);
    const objects = await extractTextForPage(pdfPage, pageNumber);
    all.push(...objects);
    onProgress(pageNumber, editorState.pageCount);
    if (pageNumber % 5 === 0) await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return all;
}
