import { editorState, markDirty } from './state.js';

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return 'obj-' + window.crypto.randomUUID();
  return 'obj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function baseObject(type, page, point) {
  return {
    id: makeId(),
    type,
    page,
    pageId: editorState.pages[page - 1] && editorState.pages[page - 1].id,
    x: point[0],
    y: point[1],
    originalX: point[0],
    originalY: point[1],
    width: 120,
    height: 44,
    rotation: 0,
    opacity: 1,
    modified: true,
    isNew: true
  };
}

export function pagePointFromClient(viewport, layer, clientX, clientY) {
  const rect = layer.getBoundingClientRect();
  return viewport.convertToPdfPoint(clientX - rect.left, clientY - rect.top);
}

export function createTextObject(page, point, values = {}) {
  const object = baseObject('new-text', page, point);
  Object.assign(object, {
    text: values.text || 'New text',
    originalText: '',
    transform: [values.fontSize || 18, 0, 0, values.fontSize || 18, point[0], point[1]],
    fontName: '',
    fontFamily: values.fontFamily || 'Helvetica',
    fontQuality: 'matched',
    fontSize: values.fontSize || 18,
    colorHex: values.colorHex || '#1F1F1F',
    color: { rgb: [31, 31, 31], hex: values.colorHex || '#1F1F1F', quality: 'user' },
    colorQuality: 'user',
    bold: false,
    italic: false,
    alignment: 'left',
    ascent: 0.8,
    descent: -0.2,
    height: 22,
    width: 120,
    originalWidth: 120
  });
  editorState.objects.push(object);
  markDirty();
  return object;
}

export function createShapeObject(page, point, shape = 'rectangle', values = {}) {
  const object = baseObject(shape === 'whiteout' ? 'whiteout' : shape === 'highlight' ? 'highlight' : 'shape', page, point);
  Object.assign(object, {
    shape,
    width: Math.max(2, values.width || 120),
    height: Math.max(2, values.height || 42),
    strokeColor: values.strokeColor || '#2563EB',
    fillColor: values.fillColor || (shape === 'highlight' ? '#FFE45C' : shape === 'whiteout' ? '#FFFFFF' : 'transparent'),
    strokeWidth: Math.max(0, Number(values.strokeWidth ?? 2)),
    opacity: Math.max(0, Math.min(1, Number(values.opacity ?? (shape === 'highlight' ? 0.35 : 1)))),
    rotation: 0,
    text: ''
  });
  editorState.objects.push(object);
  markDirty();
  return object;
}

export function createImageObject(page, point, image) {
  const object = baseObject('image', page, point);
  const maxWidth = 160;
  const ratio = Math.max(0.05, image.width / Math.max(1, image.height));
  object.width = Math.min(maxWidth, maxWidth * ratio);
  object.height = object.width / ratio;
  object.imageData = image.data;
  object.imageFormat = 'png';
  object.imageWidth = image.width;
  object.imageHeight = image.height;
  object.opacity = 1;
  editorState.objects.push(object);
  markDirty();
  return object;
}

export function createDrawObject(page, points, values = {}) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const object = baseObject('draw', page, points[0]);
  const xValues = points.map((point) => point[0]);
  const yValues = points.map((point) => point[1]);
  object.x = Math.min(...xValues);
  object.y = Math.min(...yValues);
  object.originalX = object.x;
  object.originalY = object.y;
  object.width = Math.max(1, Math.max(...xValues) - object.x);
  object.height = Math.max(1, Math.max(...yValues) - object.y);
  object.points = points.map((point) => point.slice());
  object.strokeColor = values.strokeColor || '#1D4ED8';
  object.strokeWidth = Math.max(0.5, Number(values.strokeWidth || 2.5));
  object.opacity = Math.max(0, Math.min(1, Number(values.opacity ?? 1)));
  editorState.objects.push(object);
  markDirty();
  return object;
}

export function createHighlightFromText(object, color = '#FFE45C', opacity = 0.38) {
  if (!object || !['text', 'new-text', 'ocr-text'].includes(object.type)) return null;
  const highlight = createShapeObject(object.page, [object.x, object.y - Math.max(1, object.height * 0.22)], 'highlight', {
    width: Math.max(object.width, object.fontSize * 0.4),
    height: Math.max(object.height, object.fontSize),
    fillColor: color,
    opacity
  });
  highlight.isNew = true;
  return highlight;
}

export function addExistingObject(object) {
  if (!object || editorState.objects.some((entry) => entry.id === object.id)) return null;
  editorState.objects.push(object);
  return object;
}

export function createObjectCopy(object) {
  if (!object) return null;
  const copy = {
    ...object,
    id: makeId(),
    type: object.type === 'text' || object.type === 'ocr-text' ? 'new-text' : object.type,
    x: object.x + 18,
    y: object.y - 18,
    originalX: object.x + 18,
    originalY: object.y - 18,
    originalText: '',
    isNew: true,
    modified: true,
    moved: false,
    transform: object.transform ? object.transform.slice() : null,
    points: Array.isArray(object.points) ? object.points.map((point) => point.slice()) : object.points,
    color: object.color ? { ...object.color, rgb: object.color.rgb ? object.color.rgb.slice() : undefined } : object.color,
    background: null
  };
  editorState.objects.push(copy);
  markDirty();
  return copy;
}
