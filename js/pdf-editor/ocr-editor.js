import { editorState, getPageState } from './state.js';

function makeId(pageNumber, index) {
  return 'p' + pageNumber + '-ocr-' + index + '-' + Date.now().toString(36);
}

export async function recognizePageText(pageNumber, canvas, onProgress = () => {}) {
  if (!window.Tesseract || typeof window.Tesseract.recognize !== 'function') {
    throw new Error('The bundled local OCR engine did not load. Refresh this page and try again.');
  }
  const pageState = getPageState(pageNumber);
  if (!pageState || !pageState.viewport || !canvas) throw new Error('Render this page before running OCR.');
  onProgress('Starting local OCR…');
  const result = await window.Tesseract.recognize(canvas, 'eng', {
    workerPath: '/js/vendor/tesseract/worker.min.js',
    corePath: '/js/vendor/tesseract/tesseract-core.wasm.js',
    langPath: '/js/vendor/tesseract/',
    logger: (message) => {
      if (message && message.status === 'recognizing text' && Number.isFinite(message.progress)) {
        onProgress('Recognizing text locally… ' + Math.round(message.progress * 100) + '%');
      }
    }
  });
  const viewport = pageState.viewport;
  const scaleX = canvas.width / Math.max(1, viewport.width);
  const scaleY = canvas.height / Math.max(1, viewport.height);
  const words = result && result.data && Array.isArray(result.data.words) ? result.data.words : [];
  const objects = [];
  words.forEach((word, index) => {
    const text = String(word.text || '').trim();
    if (!text || !word.bbox || Number(word.confidence || 0) < 18) return;
    const left = Number(word.bbox.x0) / scaleX;
    const right = Number(word.bbox.x1) / scaleX;
    const top = Number(word.bbox.y0) / scaleY;
    const bottom = Number(word.bbox.y1) / scaleY;
    const lowerLeft = viewport.convertToPdfPoint(left, bottom);
    const upperRight = viewport.convertToPdfPoint(right, top);
    const fontSize = Math.max(1, Math.abs(upperRight[1] - lowerLeft[1]));
    objects.push({
      id: makeId(pageNumber, index),
      type: 'ocr-text',
      page: pageNumber,
      pageId: pageState.id,
      text,
      originalText: text,
      parentText: text,
      x: Math.min(lowerLeft[0], upperRight[0]),
      y: Math.min(lowerLeft[1], upperRight[1]),
      originalX: Math.min(lowerLeft[0], upperRight[0]),
      originalY: Math.min(lowerLeft[1], upperRight[1]),
      width: Math.max(1, Math.abs(upperRight[0] - lowerLeft[0])),
      originalWidth: Math.max(1, Math.abs(upperRight[0] - lowerLeft[0])),
      height: fontSize,
      fontName: '',
      fontFamily: 'Helvetica',
      fontQuality: 'fallback',
      fontSize,
      color: { rgb: [31, 31, 31], hex: '#1F1F1F', quality: 'estimated' },
      colorHex: '#1F1F1F',
      colorQuality: 'estimated',
      rotation: 0,
      originalRotation: 0,
      transform: [fontSize, 0, 0, fontSize, lowerLeft[0], lowerLeft[1]],
      ascent: 0.8,
      descent: -0.2,
      bold: false,
      italic: false,
      alignment: 'left',
      letterSpacing: 0,
      opacity: 1,
      modified: false,
      isNew: false,
      ocrAssisted: true,
      ocrConfidence: Math.max(0, Math.min(100, Number(word.confidence) || 0)),
      moved: false,
      background: null,
      warnings: ['OCR-assisted text; font and position are approximate.']
    });
  });
  const existing = new Set(editorState.objects.map((object) => object.id));
  const fresh = objects.filter((object) => !existing.has(object.id));
  editorState.objects.push(...fresh);
  pageState.ocrReady = true;
  return fresh;
}
