import { editorState, getTextObject, markDirty, resetEditorState } from './state.js';
import { loadPdfFile } from './pdf-loader.js';
import { initializePageMetadata, extractAllText } from './text-extractor.js';
import { PageRenderer, getTextScreenBox } from './page-renderer.js';
import { sampleBackgroundFromCanvas } from './color-extractor.js';
import { applyTextProperties, moveTextObject, setObjectBackground } from './text-editor.js';
import { resetHistory, recordHistory, undo, redo, canUndo, canRedo, rememberObjectsForHistory } from './history.js';
import { exportEditedPdf } from './exporter.js';
import { getFontMatchLabel, getFontMatchDescription } from './font-resolver.js';
import { pagePointFromClient, createTextObject, createShapeObject, createImageObject, createDrawObject, createHighlightFromText, createObjectCopy } from './object-editor.js';
import { recognizePageText } from './ocr-editor.js';
import { rotatePage as rotatePdfPage, movePage as reorderPdfPage, duplicatePage as duplicatePdfPage, insertBlankPageAfter, deletePage as removePdfPage } from './page-manager.js';

const byId = (id) => document.getElementById(id);
const refs = {
  uploadCard: byId('pdf-upload-card'),
  fileInput: byId('pdf-file-input'),
  uploadStatus: byId('pdf-load-status'),
  uploadError: byId('pdf-upload-error'),
  workspace: byId('pdf-editor-workspace'),
  documentName: byId('pdf-document-name'),
  openAnother: byId('open-another-button'),
  download: byId('download-pdf-button'),
  pagesPanel: byId('pdf-pages-panel'),
  thumbnails: byId('pdf-thumbnails'),
  pageScroll: byId('pdf-page-scroll'),
  pagesContainer: byId('pdf-pages-container'),
  stageStatus: byId('pdf-stage-status'),
  currentPage: byId('current-page-input'),
  runOcr: byId('run-page-ocr-button'),
  totalPages: byId('total-page-count'),
  pagesCount: byId('pages-panel-count'),
  mobilePageCount: byId('mobile-page-count'),
  zoomLevel: byId('zoom-level'),
  undoButton: byId('undo-button'),
  redoButton: byId('redo-button'),
  propertiesPanel: byId('pdf-properties-panel'),
  selectionEmpty: byId('pdf-selection-empty'),
  propertiesForm: byId('pdf-text-properties'),
  objectProperties: byId('pdf-object-properties'),
  objectKind: byId('pdf-object-kind'),
  objectWidth: byId('object-width-input'),
  objectHeight: byId('object-height-input'),
  objectRotation: byId('object-rotation-input'),
  objectOpacity: byId('object-opacity-input'),
  objectStroke: byId('object-stroke-input'),
  objectFill: byId('object-fill-input'),
  objectStrokeWidth: byId('object-stroke-width-input'),
  objectLockAspect: byId('object-lock-aspect-input'),
  objectNoFill: byId('object-no-fill-input'),
  objectStrokeRow: byId('object-stroke-row'),
  whiteoutWarning: byId('pdf-whiteout-warning'),
  applyObjectProperties: byId('apply-object-properties-button'),
  duplicateObject: byId('duplicate-object-button'),
  deleteObject: byId('delete-object-button'),
  highlightSelected: byId('highlight-selected-button'),
  imageInput: byId('image-file-input'),
  shapeType: byId('shape-type-select'),
  signatureDialog: byId('pdf-signature-dialog'),
  signatureText: byId('signature-text-input'),
  signatureCanvas: byId('signature-canvas'),
  signatureFile: byId('signature-file-input'),
  signatureClear: byId('clear-signature-button'),
  signatureUse: byId('use-signature-button'),
  signatureClose: byId('close-signature-button'),
  textValue: byId('selected-text-value'),
  originalText: byId('original-text-display'),
  fontFamily: byId('font-family-input'),
  fontSize: byId('font-size-input'),
  textColor: byId('text-color-input'),
  textColorValue: byId('text-color-value'),
  textRotation: byId('text-rotation-input'),
  textAlignment: byId('text-alignment-input'),
  textLetterSpacing: byId('text-letter-spacing-input'),
  textOpacity: byId('text-opacity-input'),
  bold: byId('text-bold-input'),
  italic: byId('text-italic-input'),
  fontMatch: byId('pdf-font-match'),
  colorMatch: byId('pdf-color-match'),
  backgroundWarning: byId('pdf-background-warning'),
  applyText: byId('apply-text-button'),
  findToggle: byId('find-toggle-button'),
  findPanel: byId('pdf-find-panel'),
  findText: byId('find-text-input'),
  replaceText: byId('replace-text-input'),
  findPrevious: byId('find-previous-button'),
  findNext: byId('find-next-button'),
  replaceAll: byId('replace-all-button'),
  findStatus: byId('find-result-status'),
  exportNotice: byId('pdf-export-notice'),
  passwordDialog: byId('pdf-password-dialog'),
  passwordForm: byId('pdf-password-form'),
  passwordInput: byId('pdf-password-input'),
  passwordError: byId('pdf-password-error'),
  passwordCancel: byId('cancel-password-button'),
  pagesDrawer: byId('pages-drawer-button'),
  rotatePage: byId('rotate-page-button'),
  movePageUp: byId('move-page-up-button'),
  movePageDown: byId('move-page-down-button'),
  duplicatePage: byId('duplicate-page-button'),
  insertBlankPage: byId('insert-blank-page-button'),
  deletePage: byId('delete-page-button'),
  propertiesDrawer: byId('properties-drawer-button'),
  closeProperties: byId('close-properties-button')
};

let renderer = null;
let thumbnailObserver = null;
let currentFindMatches = [];
let currentFindIndex = -1;
let pendingFindFocusId = null;
let findTimer = 0;
let dragSession = null;
let stageSession = null;
let pendingImage = null;
let signatureHasInk = false;
let editorClipboard = null;
let passwordWasCancelled = false;
let loading = false;
let rendererLayoutRevision = -1;
let pageJumpTimer = 0;

function isTextObject(object) {
  return Boolean(object && ['text', 'new-text', 'ocr-text'].includes(object.type));
}

if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/vendor/pdfjs/pdf.worker.min.js';
}

function setUploadStatus(message, visible = true) {
  refs.uploadStatus.textContent = message;
  refs.uploadStatus.hidden = !visible;
}

function showUploadError(message) {
  refs.uploadError.textContent = message;
  refs.uploadError.hidden = false;
  refs.uploadCard.hidden = false;
  refs.workspace.hidden = true;
  refs.uploadStatus.hidden = true;
}

function setBusy(value, message) {
  editorState.busy = value;
  refs.download.disabled = value || !editorState.dirty;
  refs.openAnother.disabled = value;
  refs.fileInput.disabled = value;
  refs.applyText.disabled = value;
  if (message) {
    refs.stageStatus.textContent = message;
    refs.stageStatus.hidden = false;
  } else {
    refs.stageStatus.textContent = '';
    refs.stageStatus.hidden = true;
  }
  updateFindButtons();
}

function updateHistoryButtons() {
  refs.undoButton.disabled = !canUndo() || editorState.busy;
  refs.redoButton.disabled = !canRedo() || editorState.busy;
}

function setMode(mode) {
  editorState.mode = mode;
  const buttons = [
    ['select', 'mode-select-button'],
    ['text', 'mode-text-button'],
    ['image', 'mode-image-button'],
    ['draw', 'mode-draw-button'],
    ['highlight', 'mode-highlight-button'],
    ['shape', 'mode-shape-button'],
    ['whiteout', 'mode-whiteout-button'],
    ['signature', 'mode-signature-button']
  ];
  buttons.forEach(([toolMode, id]) => {
    const button = byId(id);
    if (!button) return;
    const active = toolMode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  refs.pagesContainer.dataset.mode = mode;
  refs.pagesContainer.querySelectorAll('.pdf-text-layer').forEach((layer) => {
    layer.style.pointerEvents = mode === 'select' ? 'none' : 'auto';
  });
}

function updateZoomLabel() {
  refs.zoomLevel.textContent = Math.round(editorState.zoom * 100) + '%';
}

function fitScale(pageNumber, fitPage) {
  const page = editorState.pages[pageNumber - 1];
  if (!page) return 1;
  const scrollRect = refs.pageScroll.getBoundingClientRect();
  const availableWidth = Math.max(220, scrollRect.width - 52);
  const availableHeight = Math.max(260, scrollRect.height - 52);
  const widthScale = availableWidth / page.width;
  const heightScale = availableHeight / page.height;
  return Math.max(0.35, Math.min(2.5, fitPage ? Math.min(widthScale, heightScale) : widthScale));
}

function changeZoom(value, mode = 'manual') {
  if (!renderer) return;
  renderer.setZoom(value, mode);
  updateZoomLabel();
}

function fitCurrentPage(fitPage) {
  const mode = fitPage ? 'fit-page' : 'fit-width';
  changeZoom(fitScale(editorState.currentPage, fitPage), mode);
}

function updatePageIndicators(pageNumber = editorState.currentPage) {
  const total = editorState.pageCount;
  editorState.currentPage = Math.max(1, Math.min(total || 1, pageNumber));
  refs.currentPage.value = String(editorState.currentPage);
  refs.currentPage.max = String(total || 1);
  refs.currentPage.min = '1';
  refs.totalPages.textContent = '/ ' + (total || 1);
  refs.pagesCount.textContent = String(total || 0);
  refs.mobilePageCount.textContent = 'Page ' + editorState.currentPage + ' of ' + (total || 1);
  refs.thumbnails.querySelectorAll('.pdf-thumbnail').forEach((button) => {
    button.classList.toggle('is-current', Number(button.dataset.pageNumber) === editorState.currentPage);
  });
  refs.movePageUp.disabled = editorState.currentPage <= 1 || editorState.busy;
  refs.movePageDown.disabled = editorState.currentPage >= total || editorState.busy;
  refs.deletePage.disabled = total <= 1 || editorState.busy;
  updateZoomLabel();
}

function openPropertiesPanel() {
  refs.propertiesPanel.classList.add('is-open');
  refs.propertiesDrawer.setAttribute('aria-expanded', 'true');
}

function closePropertiesPanel() {
  refs.propertiesPanel.classList.remove('is-open');
  refs.propertiesDrawer.setAttribute('aria-expanded', 'false');
}

function selectTextObject(id) {
  const object = getTextObject(id);
  if (!object) return;
  editorState.selectedObjectId = id;
  if (!isTextObject(object)) {
    refs.selectionEmpty.hidden = true;
    refs.propertiesForm.hidden = true;
    refs.objectProperties.hidden = false;
    const labels = { image: 'Image', signature: 'Signature', draw: 'Drawing', shape: 'Shape', highlight: 'Highlight', whiteout: 'Whiteout cover' };
    refs.objectKind.textContent = labels[object.type] || 'Object';
    refs.objectWidth.value = String(Math.round(object.width || 1));
    refs.objectHeight.value = String(Math.round(object.height || 1));
    refs.objectRotation.value = String(Math.round(object.rotation || 0));
    refs.objectOpacity.value = String(Number(object.opacity ?? 1));
    refs.objectStroke.value = /^#[0-9a-f]{6}$/i.test(object.strokeColor || '') ? object.strokeColor : '#2563eb';
    refs.objectFill.value = /^#[0-9a-f]{6}$/i.test(object.fillColor || '') ? object.fillColor : '#ffffff';
    refs.objectStrokeWidth.value = String(Number(object.strokeWidth || 0));
    refs.objectLockAspect.checked = ['image', 'signature'].includes(object.type);
    refs.objectLockAspect.closest('label').hidden = !['image', 'signature'].includes(object.type);
    refs.objectNoFill.checked = object.fillColor === 'transparent';
    refs.objectNoFill.closest('label').hidden = ['image', 'signature', 'draw', 'highlight', 'whiteout'].includes(object.type);
    refs.objectStrokeRow.hidden = ['image', 'signature'].includes(object.type);
    refs.whiteoutWarning.hidden = object.type !== 'whiteout';
    refs.applyObjectProperties.disabled = false;
    openPropertiesPanel();
    if (renderer) renderer.setSelectedText(id);
    return;
  }
  refs.objectProperties.hidden = true;
  const pageState = editorState.pages[object.page - 1];
  const canvas = renderer && renderer.getPageCanvas(object.page);
  if (['text', 'ocr-text'].includes(object.type) && pageState && pageState.viewport && canvas && object.background === null) {
    const box = getTextScreenBox(object, pageState.viewport);
    setObjectBackground(object, sampleBackgroundFromCanvas(canvas, box));
  }

  refs.selectionEmpty.hidden = true;
  refs.propertiesForm.hidden = false;
  refs.textValue.value = object.text;
  refs.originalText.textContent = object.ocrAssisted
    ? 'OCR-assisted editing · confidence ' + Math.round(object.ocrConfidence || 0) + '% · font and position are approximate.'
    : 'Original: ' + (object.originalText || '(empty)');
  let option = Array.from(refs.fontFamily.options).find((entry) => entry.value === object.fontFamily);
  if (!option) {
    option = document.createElement('option');
    option.value = object.fontFamily;
    option.textContent = object.fontFamily + ' (detected)';
    refs.fontFamily.add(option);
  }
  refs.fontFamily.value = object.fontFamily;
  refs.fontSize.value = String(Math.round(object.fontSize * 100) / 100);
  refs.textColor.value = /^#[0-9a-f]{6}$/i.test(object.colorHex) ? object.colorHex : '#1f1f1f';
  refs.textColorValue.textContent = refs.textColor.value.toUpperCase();
  refs.textRotation.value = String(Math.round(object.rotation * 100) / 100);
  refs.textAlignment.value = object.alignment || 'left';
  refs.textLetterSpacing.value = String(Number(object.letterSpacing || 0));
  refs.textOpacity.value = String(Number(object.opacity ?? 1));
  refs.bold.checked = object.bold;
  refs.italic.checked = object.italic;
  const matchLabel = getFontMatchLabel(object);
  refs.fontMatch.replaceChildren();
  const matchStrong = document.createElement('strong');
  matchStrong.textContent = matchLabel;
  const matchDescription = document.createElement('span');
  matchDescription.textContent = getFontMatchDescription(object);
  refs.fontMatch.append(matchStrong, matchDescription);
  refs.colorMatch.textContent = object.colorQuality === 'exact'
    ? 'Color read from the PDF text fill state.'
    : 'Original text color is estimated; verify this color in the page preview.';
  refs.backgroundWarning.hidden = !(object.background && object.background.complex);
  refs.applyText.textContent = object.modified ? 'Update change' : 'Apply change';
  openPropertiesPanel();
  if (renderer) renderer.setSelectedText(id);
}

function beginInlineTextEdit(id) {
  selectTextObject(id);
  refs.textValue.focus();
  refs.textValue.select();
}

function commitSelectedText(event) {
  if (event) event.preventDefault();
  const object = getTextObject(editorState.selectedObjectId);
  if (!object || editorState.busy) return;
  rememberObjectsForHistory([object]);
  const changed = applyTextProperties(object, {
    text: refs.textValue.value,
    fontFamily: refs.fontFamily.value,
    fontSize: Number(refs.fontSize.value),
    colorHex: refs.textColor.value,
    rotation: Number(refs.textRotation.value),
    alignment: refs.textAlignment.value,
    letterSpacing: Number(refs.textLetterSpacing.value),
    opacity: Number(refs.textOpacity.value),
    bold: refs.bold.checked,
    italic: refs.italic.checked
  });
  if (changed) {
    recordHistory();
    refs.applyText.textContent = 'Update change';
    renderer.refreshTextLayers();
    selectTextObject(object.id);
  }
  updateDirtyUi();
}

function commitObjectProperties(event) {
  if (event) event.preventDefault();
  const object = getTextObject(editorState.selectedObjectId);
  if (!object || isTextObject(object) || editorState.busy) return;
  rememberObjectsForHistory([object]);
  const oldWidth = Math.max(1, Number(object.width) || 1);
  const oldHeight = Math.max(1, Number(object.height) || 1);
  let width = Math.max(1, Math.min(1200, Number(refs.objectWidth.value) || oldWidth));
  let height = Math.max(1, Math.min(1200, Number(refs.objectHeight.value) || oldHeight));
  if (refs.objectLockAspect.checked && ['image', 'signature'].includes(object.type)) {
    const ratio = oldWidth / oldHeight;
    if (Math.abs(width - oldWidth) > 0.01 && Math.abs(height - oldHeight) <= 0.01) height = width / ratio;
    else if (Math.abs(height - oldHeight) > 0.01 && Math.abs(width - oldWidth) <= 0.01) width = height * ratio;
    else height = width / ratio;
  }
  const values = {
    width,
    height,
    rotation: Math.max(-360, Math.min(360, Number(refs.objectRotation.value) || 0)),
    opacity: Math.max(0, Math.min(1, Number(refs.objectOpacity.value))),
    strokeColor: refs.objectStroke.value,
    fillColor: refs.objectNoFill.checked ? 'transparent' : refs.objectFill.value,
    strokeWidth: Math.max(0, Math.min(40, Number(refs.objectStrokeWidth.value) || 0))
  };
  const changed = Object.keys(values).some((key) => object[key] !== values[key]);
  if (changed) {
    Object.assign(object, values);
    object.modified = true;
    markDirty();
    recordHistory();
    renderer && renderer.refreshTextLayers();
    selectTextObject(object.id);
  }
  updateDirtyUi();
}

function deleteSelectedObject() {
  const object = getTextObject(editorState.selectedObjectId);
  if (!object || isTextObject(object)) return;
  rememberObjectsForHistory([object]);
  editorState.objects = editorState.objects.filter((entry) => entry.id !== object.id);
  editorState.selectedObjectId = null;
  markDirty();
  recordHistory();
  refs.objectProperties.hidden = true;
  refs.selectionEmpty.hidden = false;
  renderer && renderer.refreshTextLayers();
  renderer && renderer.setSelectedText(null);
  updateDirtyUi();
}

function duplicateSelectedObject() {
  const object = getTextObject(editorState.selectedObjectId);
  if (!object) return;
  rememberObjectsForHistory([object]);
  const copy = createObjectCopy(object);
  if (!copy) return;
  recordHistory();
  renderer && renderer.refreshTextLayers();
  selectTextObject(copy.id);
  updateDirtyUi();
}

function highlightSelectedText() {
  const object = getTextObject(editorState.selectedObjectId);
  if (!object || !isTextObject(object)) return;
  const highlight = createHighlightFromText(object, '#FFE45C', 0.38);
  if (!highlight) return;
  recordHistory();
  renderer && renderer.refreshTextLayers();
  selectTextObject(highlight.id);
  updateDirtyUi();
}

function finishObjectCreation(object, modeAfter = 'select') {
  if (!object) return;
  editorState.ignoreObjectClickUntil = Date.now() + 350;
  recordHistory();
  if (renderer) renderer.refreshTextLayers();
  selectTextObject(object.id);
  setMode(modeAfter);
  updateDirtyUi();
}

function makeTemporaryRect(layer) {
  const preview = document.createElement('div');
  preview.className = 'pdf-object-drag-preview';
  layer.append(preview);
  return preview;
}

function updateDragPreview(session, point) {
  session.currentPoint = point;
  if (session.mode === 'draw') {
    const distance = Math.hypot(point[0] - session.points[session.points.length - 1][0], point[1] - session.points[session.points.length - 1][1]);
    if (distance > 0.8) session.points.push(point);
    const path = session.preview.querySelector('polyline');
    if (path) {
      path.setAttribute('points', session.points.map((item) => {
        const screen = session.viewport.convertToViewportPoint(item[0], item[1]);
        return screen[0] + ',' + screen[1];
      }).join(' '));
    }
    return;
  }
  const start = session.viewport.convertToViewportPoint(session.startPoint[0], session.startPoint[1]);
  const end = session.viewport.convertToViewportPoint(point[0], point[1]);
  session.preview.style.left = Math.min(start[0], end[0]) + 'px';
  session.preview.style.top = Math.min(start[1], end[1]) + 'px';
  session.preview.style.width = Math.max(1, Math.abs(end[0] - start[0])) + 'px';
  session.preview.style.height = Math.max(1, Math.abs(end[1] - start[1])) + 'px';
}

function finishStageSession(event) {
  if (!stageSession || (event && event.pointerId !== undefined && event.pointerId !== stageSession.pointerId)) return;
  const session = stageSession;
  stageSession = null;
  session.layer.removeEventListener('pointermove', onStagePointerMove);
  session.layer.removeEventListener('pointerup', finishStageSession);
  session.layer.removeEventListener('pointercancel', finishStageSession);
  if (session.preview && session.preview.isConnected) session.preview.remove();
  if (event && event.pointerId !== undefined) {
    try { session.layer.releasePointerCapture(event.pointerId); } catch (error) {}
  }
  const end = session.currentPoint || session.startPoint;
  let object = null;
  if (session.mode === 'draw') {
    if (session.points.length > 1) object = createDrawObject(session.page, session.points);
  } else {
    const x = Math.min(session.startPoint[0], end[0]);
    const y = Math.min(session.startPoint[1], end[1]);
    const width = Math.abs(end[0] - session.startPoint[0]);
    const height = Math.abs(end[1] - session.startPoint[1]);
    if (width > 2 && height > 2) {
      let shape = session.mode === 'highlight' ? 'highlight' : session.mode === 'whiteout' ? 'whiteout' : refs.shapeType.value;
      object = createShapeObject(session.page, [x, y], shape, {
        width,
        height,
        strokeColor: '#2563EB',
        fillColor: shape === 'highlight' ? '#FFE45C' : shape === 'whiteout' ? '#FFFFFF' : 'transparent',
        strokeWidth: shape === 'whiteout' || shape === 'highlight' ? 0 : 2,
        opacity: shape === 'highlight' ? 0.38 : 1
      });
    }
  }
  if (object) finishObjectCreation(object);
  else setMode('select');
}

function onStagePointerMove(event) {
  if (!stageSession || event.pointerId !== stageSession.pointerId) return;
  updateDragPreview(stageSession, pagePointFromClient(stageSession.viewport, stageSession.layer, event.clientX, event.clientY));
  event.preventDefault();
}

function onStagePointerDown(event, pageNumber, viewport, layer) {
  if (event.button !== 0 || !viewport || !editorState.mode || editorState.mode === 'select') return;
  const point = pagePointFromClient(viewport, layer, event.clientX, event.clientY);
  const mode = editorState.mode;
  if (mode === 'text') {
    finishObjectCreation(createTextObject(pageNumber, point));
    return;
  }
  if (mode === 'image' || mode === 'signature') {
    if (!pendingImage) return;
    const object = createImageObject(pageNumber, point, pendingImage);
    if (mode === 'signature') object.type = 'signature';
    pendingImage = null;
    refs.stageStatus.textContent = '';
    refs.stageStatus.hidden = true;
    finishObjectCreation(object);
    return;
  }
  if (!['draw', 'highlight', 'shape', 'whiteout'].includes(mode)) return;
  event.preventDefault();
  event.stopPropagation();
  const preview = mode === 'draw' ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : makeTemporaryRect(layer);
  if (mode === 'draw') {
    preview.classList.add('pdf-live-draw-preview');
    preview.setAttribute('viewBox', '0 0 ' + viewport.width + ' ' + viewport.height);
    preview.setAttribute('aria-hidden', 'true');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#1D4ED8');
    polyline.setAttribute('stroke-width', String(2.5 * viewport.scale));
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');
    preview.append(polyline);
    layer.append(preview);
  } else {
    preview.classList.add('is-' + mode);
  }
  stageSession = {
    mode,
    page: pageNumber,
    viewport,
    layer,
    startPoint: point,
    currentPoint: point,
    points: [point],
    pointerId: event.pointerId,
    preview
  };
  try { layer.setPointerCapture(event.pointerId); } catch (error) {}
  layer.addEventListener('pointermove', onStagePointerMove);
  layer.addEventListener('pointerup', finishStageSession);
  layer.addEventListener('pointercancel', finishStageSession);
}

function onStageClick(event, pageNumber, viewport, layer) {
  if (!viewport || !editorState.mode || editorState.mode === 'select') return;
  const point = pagePointFromClient(viewport, layer, event.clientX, event.clientY);
  let object = null;
  if (editorState.mode === 'text') object = createTextObject(pageNumber, point);
  else if ((editorState.mode === 'image' || editorState.mode === 'signature') && pendingImage) {
    object = createImageObject(pageNumber, point, pendingImage);
    if (editorState.mode === 'signature') object.type = 'signature';
    pendingImage = null;
  } else if (editorState.mode === 'highlight') {
    object = createShapeObject(pageNumber, point, 'highlight', { width: 120, height: 20, fillColor: '#FFE45C', opacity: 0.38, strokeWidth: 0 });
  } else if (editorState.mode === 'whiteout') {
    object = createShapeObject(pageNumber, point, 'whiteout', { width: 120, height: 36, fillColor: '#FFFFFF', opacity: 1, strokeWidth: 0 });
  } else if (editorState.mode === 'shape') {
    const shape = refs.shapeType.value;
    object = createShapeObject(pageNumber, point, shape, {
      width: 120,
      height: shape === 'line' ? 1 : 60,
      strokeColor: '#2563EB',
      fillColor: 'transparent',
      strokeWidth: 2,
      opacity: 1
    });
  } else if (editorState.mode === 'draw') {
    object = createDrawObject(pageNumber, [point, [point[0] + 2, point[1] + 2]], { strokeColor: '#1D4ED8', strokeWidth: 2.5 });
  }
  if (object) {
    event.stopPropagation();
    finishObjectCreation(object);
    refs.stageStatus.textContent = 'Object added. Drag to move it or use the properties panel to size it.';
    refs.stageStatus.hidden = false;
  }
}

async function decodeLocalImage(file) {
  if (!file || !/^image\/(png|jpeg|webp)$/i.test(file.type)) throw new Error('Choose a PNG, JPG, or WebP image.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Image files must be smaller than 20 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 6000 || bitmap.height > 6000 || bitmap.width * bitmap.height > 32000000) throw new Error('This image is too large to place safely. Resize it to 6,000 pixels or less on each side.');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This image could not be decoded in the current browser.');
    context.drawImage(bitmap, 0, 0);
    return { data: canvas.toDataURL('image/png'), width: bitmap.width, height: bitmap.height };
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

function openSignatureDialog() {
  pendingImage = null;
  if (!refs.signatureDialog.open) refs.signatureDialog.showModal();
  refs.signatureText.value = '';
  signatureHasInk = false;
  const context = refs.signatureCanvas.getContext('2d');
  if (context) context.clearRect(0, 0, refs.signatureCanvas.width, refs.signatureCanvas.height);
  refs.signatureFile.value = '';
}

function useSignature() {
  const context = refs.signatureCanvas.getContext('2d');
  const typedName = refs.signatureText.value.trim();
  if (typedName) {
    context.clearRect(0, 0, refs.signatureCanvas.width, refs.signatureCanvas.height);
    context.fillStyle = '#172554';
    context.font = 'italic 58px cursive';
    context.textBaseline = 'middle';
    context.fillText(typedName, 28, 92, 540);
    signatureHasInk = true;
  }
  if (!pendingImage && signatureHasInk) {
    pendingImage = {
      data: refs.signatureCanvas.toDataURL('image/png'),
      width: refs.signatureCanvas.width,
      height: refs.signatureCanvas.height
    };
  }
  if (!pendingImage) {
    refs.stageStatus.textContent = 'Draw or type a signature, or choose an image, before placing it.';
    refs.stageStatus.hidden = false;
    return;
  }
  if (refs.signatureDialog.open) refs.signatureDialog.close();
  setMode('signature');
  refs.stageStatus.textContent = 'Click a page to place the signature.';
  refs.stageStatus.hidden = false;
}

function copySelectedObject() {
  const object = getTextObject(editorState.selectedObjectId);
  if (!object) return;
  editorClipboard = { ...object, transform: object.transform ? object.transform.slice() : null, points: object.points ? object.points.map((point) => point.slice()) : object.points };
}

function pasteSelectedObject() {
  if (!editorClipboard) return;
  const source = { ...editorClipboard, page: editorState.currentPage };
  const copy = createObjectCopy(source);
  if (!copy) return;
  recordHistory();
  renderer && renderer.refreshTextLayers();
  selectTextObject(copy.id);
  updateDirtyUi();
}

function updateDirtyUi() {
  refs.download.disabled = editorState.busy || !editorState.dirty;
  if (editorState.dirty) refs.documentName.dataset.dirty = 'true';
  else delete refs.documentName.dataset.dirty;
  updateHistoryButtons();
}

function createPageRenderer() {
  return new PageRenderer({
    container: refs.pagesContainer,
    scrollRoot: refs.pageScroll,
    onPageReady: updatePageTextStatus,
    onPageChange: updatePageIndicators,
    onSelectText: selectTextObject,
    onDoubleClickText: beginInlineTextEdit,
    onDragStart: startTextDrag,
    onStagePointerDown,
    onStageClick
  });
}

function rebuildPageView(pageNumber = editorState.currentPage) {
  if (renderer) renderer.destroy();
  if (thumbnailObserver) {
    thumbnailObserver.disconnect();
    thumbnailObserver = null;
  }
  renderer = createPageRenderer();
  renderer.createPageShells();
  createThumbnails();
  rendererLayoutRevision = editorState.pageLayoutRevision;
  renderer.goToPage(pageNumber);
  updatePageIndicators(pageNumber);
}

function runPageOperation(operation, message) {
  if (editorState.busy || !operation(editorState.currentPage)) return;
  recordHistory();
  rebuildPageView(editorState.currentPage);
  updateDirtyUi();
  refs.stageStatus.textContent = message;
  refs.stageStatus.hidden = false;
}

function startTextDrag(event, id) {
  const object = getTextObject(id);
  const pageState = object && editorState.pages[object.page - 1];
  if (!object || !pageState || !pageState.viewport || event.button !== 0) return;
  event.preventDefault();
  rememberObjectsForHistory([object]);
  const layer = event.currentTarget.closest('.pdf-text-layer');
  const rect = layer.getBoundingClientRect();
  const startPoint = pageState.viewport.convertToPdfPoint(event.clientX - rect.left, event.clientY - rect.top);
  dragSession = {
    object,
    pointerId: event.pointerId,
    layer,
    pageState,
    startX: object.x,
    startY: object.y,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPoint,
    moved: false,
    button: event.currentTarget
  };
  try { event.currentTarget.setPointerCapture(event.pointerId); } catch (error) {}
  event.currentTarget.addEventListener('pointermove', moveSelectedText);
  event.currentTarget.addEventListener('pointerup', finishTextDrag, { once: true });
  event.currentTarget.addEventListener('pointercancel', finishTextDrag, { once: true });
}

function moveSelectedText(event) {
  if (!dragSession || event.pointerId !== dragSession.pointerId) return;
  const { layer, pageState, startPoint, object, button } = dragSession;
  const rect = layer.getBoundingClientRect();
  const point = pageState.viewport.convertToPdfPoint(event.clientX - rect.left, event.clientY - rect.top);
  const x = dragSession.startX + point[0] - startPoint[0];
  const y = dragSession.startY + point[1] - startPoint[1];
  if (Math.abs(event.clientX - dragSession.startClientX) + Math.abs(event.clientY - dragSession.startClientY) > 2) dragSession.moved = true;
  if (!dragSession.moved) return;
  moveTextObject(object, x, y);
  const dx = event.clientX - dragSession.startClientX;
  const dy = event.clientY - dragSession.startClientY;
  button.style.translate = dx + 'px ' + dy + 'px';
  event.preventDefault();
}

function finishTextDrag(event) {
  if (!dragSession || (event && event.pointerId !== undefined && event.pointerId !== dragSession.pointerId)) return;
  const session = dragSession;
  dragSession = null;
  session.button.removeEventListener('pointermove', moveSelectedText);
  session.button.style.translate = '';
  if (session.moved) {
    recordHistory();
    renderer.refreshTextLayers();
    selectTextObject(session.object.id);
    updateDirtyUi();
  }
}

function updateFindButtons() {
  const hasMatches = currentFindMatches.length > 0;
  refs.findPrevious.disabled = !hasMatches;
  refs.findNext.disabled = !hasMatches;
  refs.replaceAll.disabled = !hasMatches || editorState.busy;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
}

async function runFind() {
  const needle = refs.findText.value;
  currentFindMatches = [];
  currentFindIndex = -1;
  updateFindButtons();
  if (!needle) {
    refs.findStatus.textContent = '';
    return;
  }
  refs.findStatus.textContent = 'Detecting text…';
  setBusy(true, 'Detecting text…');
  try {
    const extractedObjects = await extractAllText(editorState.pdfDocument, {
      onProgress: (pageNumber, total) => {
        refs.findStatus.textContent = 'Detecting text… ' + pageNumber + ' / ' + total;
      }
    });
    const byId = new Map(extractedObjects.map((object) => [object.id, object]));
    editorState.objects.filter((object) => object.ocrAssisted).forEach((object) => byId.set(object.id, object));
    const allObjects = Array.from(byId.values());
    const target = needle.toLocaleLowerCase();
    allObjects.forEach((object) => {
      const haystack = object.text.toLocaleLowerCase();
      let from = 0;
      while (from <= haystack.length) {
        const at = haystack.indexOf(target, from);
        if (at < 0) break;
        currentFindMatches.push({ objectId: object.id, page: object.page, offset: at });
        from = at + Math.max(1, target.length);
      }
    });
    const pages = new Set(currentFindMatches.map((match) => match.page)).size;
    refs.findStatus.textContent = currentFindMatches.length
      ? currentFindMatches.length + ' matches found across ' + pages + ' ' + (pages === 1 ? 'page' : 'pages')
      : 'No matches found.';
    updateFindButtons();
    if (currentFindMatches.length) showFindMatch(0);
  } catch (error) {
    refs.findStatus.textContent = 'Text could not be analyzed: ' + error.message;
  } finally {
    setBusy(false);
  }
}

function showFindMatch(index) {
  if (!currentFindMatches.length || !renderer) return;
  currentFindIndex = (index + currentFindMatches.length) % currentFindMatches.length;
  const match = currentFindMatches[currentFindIndex];
  pendingFindFocusId = match.objectId;
  renderer.goToPage(match.page);
  selectTextObject(match.objectId);
  requestAnimationFrame(() => {
    const hit = Array.from(refs.pagesContainer.querySelectorAll('[data-object-id]'))
      .find((button) => button.dataset.objectId === match.objectId);
    if (hit) {
      hit.classList.add('is-search-hit');
      hit.focus({ preventScroll: true });
      window.setTimeout(() => hit.classList.remove('is-search-hit'), 1800);
    }
    refs.findStatus.textContent = (currentFindIndex + 1) + ' of ' + currentFindMatches.length + ' matches';
  });
}

function scheduleFind() {
  window.clearTimeout(findTimer);
  findTimer = window.setTimeout(runFind, 320);
}

function replaceAllMatches() {
  if (!currentFindMatches.length || editorState.busy) return;
  const needle = refs.findText.value;
  const replacement = refs.replaceText.value;
  if (!needle) return;
  const uniqueObjects = Array.from(new Set(currentFindMatches.map((match) => match.objectId)))
    .map((id) => getTextObject(id))
    .filter(Boolean);
  rememberObjectsForHistory(uniqueObjects);
  const expression = new RegExp(escapeRegExp(needle), 'gi');
  let replaced = 0;
  uniqueObjects.forEach((object) => {
    const matches = object.text.match(expression);
    if (!matches) return;
    replaced += matches.length;
    applyTextProperties(object, { text: object.text.replace(expression, replacement) });
  });
  if (replaced) {
    recordHistory();
    renderer.refreshTextLayers();
    if (editorState.selectedObjectId) selectTextObject(editorState.selectedObjectId);
    updateDirtyUi();
  }
  refs.findStatus.textContent = replaced + ' replacements applied. Each text item keeps its own formatting.';
  currentFindMatches = [];
  currentFindIndex = -1;
  updateFindButtons();
}

function toggleFindPanel() {
  const open = refs.findPanel.hidden;
  refs.findPanel.hidden = !open;
  refs.findToggle.setAttribute('aria-expanded', String(open));
  if (open) refs.findText.focus();
}

function createThumbnails() {
  refs.thumbnails.replaceChildren();
  if (thumbnailObserver) thumbnailObserver.disconnect();
  editorState.pages.forEach((metadata) => { metadata.thumbnailRendered = false; });
  thumbnailObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNumber = Number(entry.target.dataset.pageNumber);
          renderThumbnail(pageNumber, entry.target);
          thumbnailObserver.unobserve(entry.target);
        }
      });
    }, { root: refs.thumbnails, rootMargin: '240px 0px' })
    : null;

  const fragment = document.createDocumentFragment();
  editorState.pages.forEach((metadata) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pdf-thumbnail';
    button.dataset.pageNumber = String(metadata.pageNumber);
    button.setAttribute('aria-label', 'Go to page ' + metadata.pageNumber);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = 'Page ' + metadata.pageNumber;
    button.append(canvas, label);
    button.addEventListener('click', () => {
      renderer.goToPage(metadata.pageNumber);
      refs.pagesPanel.classList.remove('is-open');
      refs.pagesDrawer.setAttribute('aria-expanded', 'false');
    });
    fragment.appendChild(button);
    if (thumbnailObserver) thumbnailObserver.observe(button);
    else if (metadata.pageNumber <= 3) renderThumbnail(metadata.pageNumber, button);
  });
  refs.thumbnails.appendChild(fragment);
  updatePageIndicators();
}

async function renderThumbnail(pageNumber, button) {
  const metadata = editorState.pages[pageNumber - 1];
  const canvas = button.querySelector('canvas');
  if (!metadata || !canvas || metadata.thumbnailRendered) return;
  metadata.thumbnailRendered = true;
  try {
    if (metadata.isBlank) {
      const scale = Math.min(0.22, 112 / metadata.width, 144 / metadata.height);
      canvas.width = Math.max(1, Math.ceil(metadata.width * scale));
      canvas.height = Math.max(1, Math.ceil(metadata.height * scale));
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const pdfPage = await editorState.pdfDocument.getPage(metadata.sourcePageNumber || pageNumber);
    const scale = Math.min(0.22, 112 / metadata.width, 144 / metadata.height);
    const viewport = pdfPage.getViewport({ scale, rotation: metadata.rotation });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const task = pdfPage.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport });
    await task.promise;
  } catch (error) {
    metadata.thumbnailRendered = false;
    console.warn('[PDF Editor] Thumbnail render failed.', pageNumber, error);
  }
}

function updatePageTextStatus(pageNumber, objects) {
  if (pageNumber === editorState.currentPage) {
    const page = editorState.pages[pageNumber - 1];
    if (page && page.isBlank) {
      refs.runOcr.hidden = true;
      return;
    }
    const hasOcr = editorState.objects.some((object) => object.page === pageNumber && object.ocrAssisted);
    refs.runOcr.hidden = objects.length > 3 || hasOcr || Boolean(page && page.ocrReady);
    if (objects.length <= 3 && !hasOcr && !(page && page.ocrReady)) {
      refs.stageStatus.textContent = 'This page has little selectable PDF text and may be scanned.';
    } else if (hasOcr) {
      refs.stageStatus.textContent = 'OCR-assisted editing is active on this page. Original fonts cannot be detected from a scan.';
    } else if (!objects.length) refs.stageStatus.textContent = 'No selectable text was detected on this page.';
    else refs.stageStatus.textContent = objects.length + ' text items detected · click to select · double-click to edit';
    refs.stageStatus.hidden = false;
  }
  const selected = getTextObject(editorState.selectedObjectId);
  if (selected && selected.page === pageNumber && selected.background === null) selectTextObject(selected.id);
  if (pendingFindFocusId && selected && selected.id === pendingFindFocusId) {
    const hit = Array.from(refs.pagesContainer.querySelectorAll('[data-object-id]'))
      .find((button) => button.dataset.objectId === pendingFindFocusId);
    if (hit) {
      hit.classList.add('is-search-hit');
      hit.focus({ preventScroll: true });
      window.setTimeout(() => hit.classList.remove('is-search-hit'), 1800);
      pendingFindFocusId = null;
    }
  }
}

async function runOcrOnCurrentPage() {
  if (!renderer || editorState.busy) return;
  const pageNumber = editorState.currentPage;
  const canvas = renderer.getPageCanvas(pageNumber);
  refs.runOcr.hidden = true;
  setBusy(true, 'Preparing local OCR…');
  try {
    const objects = await recognizePageText(pageNumber, canvas, (message) => {
      refs.stageStatus.textContent = message;
      refs.stageStatus.hidden = false;
    });
    if (!objects.length) {
      refs.stageStatus.textContent = 'OCR found no confident text on this page. Try a clearer scan or another language.';
      return;
    }
    recordHistory();
    renderer.refreshTextLayers();
    refs.stageStatus.textContent = 'OCR-assisted editing: ' + objects.length + ' words recognized locally. Select a word to edit; font matching is approximate.';
    refs.stageStatus.hidden = false;
  } catch (error) {
    refs.stageStatus.textContent = error.message || 'Local OCR could not read this page.';
    refs.stageStatus.hidden = false;
    const page = editorState.pages[pageNumber - 1];
    if (page) page.ocrReady = false;
    refs.runOcr.hidden = false;
  } finally {
    setBusy(false);
    updateDirtyUi();
  }
}

function askForPassword(reason) {
  return new Promise((resolve) => {
    passwordWasCancelled = false;
    refs.passwordError.hidden = reason !== 2;
    refs.passwordInput.value = '';
    refs.passwordDialog.showModal();
    refs.passwordInput.focus();
    const finish = (value) => {
      refs.passwordForm.removeEventListener('submit', submit);
      refs.passwordCancel.removeEventListener('click', cancel);
      refs.passwordDialog.removeEventListener('cancel', cancel);
      if (refs.passwordDialog.open) refs.passwordDialog.close();
      resolve(value);
    };
    const submit = (event) => {
      event.preventDefault();
      finish(refs.passwordInput.value);
    };
    const cancel = () => {
      passwordWasCancelled = true;
      finish(null);
    };
    refs.passwordForm.addEventListener('submit', submit);
    refs.passwordCancel.addEventListener('click', cancel);
    refs.passwordDialog.addEventListener('cancel', cancel, { once: true });
  });
}

async function clearCurrentDocument() {
  if (renderer) {
    renderer.destroy();
    renderer = null;
  }
  if (thumbnailObserver) {
    thumbnailObserver.disconnect();
    thumbnailObserver = null;
  }
  resetEditorState();
  setMode('select');
  stageSession = null;
  pendingImage = null;
  editorClipboard = null;
  currentFindMatches = [];
  currentFindIndex = -1;
  pendingFindFocusId = null;
  refs.findText.value = '';
  refs.replaceText.value = '';
  refs.findStatus.textContent = '';
  refs.findPanel.hidden = true;
  refs.findToggle.setAttribute('aria-expanded', 'false');
  refs.propertiesPanel.classList.remove('is-open');
  refs.pagesPanel.classList.remove('is-open');
  refs.selectionEmpty.hidden = false;
  refs.propertiesForm.hidden = true;
  refs.objectProperties.hidden = true;
  refs.pagesContainer.replaceChildren();
  refs.thumbnails.replaceChildren();
}

async function loadFile(file) {
  if (!file || loading) return;
  if (editorState.dirty && !window.confirm('Discard the current PDF edits and open another file?')) return;
  loading = true;
  refs.fileInput.value = '';
  refs.uploadError.hidden = true;
  refs.workspace.hidden = true;
  refs.uploadCard.hidden = false;
  setUploadStatus('Reading PDF locally…');
  try {
    await clearCurrentDocument();
    const loaded = await loadPdfFile(file, askForPassword, (percent) => {
      setUploadStatus('Reading PDF locally… ' + percent + '%');
    });
    editorState.file = file;
    editorState.originalBytes = loaded.bytes;
    editorState.pdfDocument = loaded.pdfDocument;
    editorState.password = loaded.password;
    editorState.pageCount = loaded.pdfDocument.numPages;
    refs.documentName.textContent = file.name;
    refs.documentName.title = file.name;
    refs.uploadCard.hidden = true;
    refs.workspace.hidden = false;
    if (file.size > 50 * 1024 * 1024 || loaded.pdfDocument.numPages > 120) {
      refs.stageStatus.textContent = 'Large PDF — pages render as you scroll to keep memory use lower.';
      refs.stageStatus.hidden = false;
    } else {
      refs.stageStatus.textContent = 'Analyzing page sizes…';
      refs.stageStatus.hidden = false;
    }
    await initializePageMetadata(loaded.pdfDocument, loaded.pdfDocument.numPages, (done, total) => {
      refs.stageStatus.textContent = 'Analyzing page sizes… ' + done + ' / ' + total;
    });
    editorState.currentPage = 1;
    editorState.zoom = fitScale(1, false);
    editorState.zoomMode = 'fit-width';
    rebuildPageView(1);
    refs.stageStatus.textContent = 'Rendering page 1…';
    refs.stageStatus.hidden = false;
    resetHistory();
    updateDirtyUi();
    if (loaded.pdfDocument.numPages > 120 || file.size > 50 * 1024 * 1024) {
      refs.stageStatus.textContent = 'Large PDF — pages render as you scroll to keep memory use lower.';
    }
  } catch (error) {
    if (passwordWasCancelled) {
      await clearCurrentDocument();
      refs.workspace.hidden = true;
      refs.uploadCard.hidden = false;
      refs.uploadError.hidden = true;
    } else {
      await clearCurrentDocument();
      showUploadError((error && error.message) || 'The PDF could not be opened.');
    }
  } finally {
    loading = false;
    setUploadStatus('', false);
  }
}

function resetToPicker() {
  if (editorState.dirty && !window.confirm('Discard the current PDF edits and open another file?')) return;
  clearCurrentDocument();
  refs.workspace.hidden = true;
  refs.uploadCard.hidden = false;
  refs.uploadError.hidden = true;
  refs.fileInput.click();
}

async function exportPdf() {
  if (editorState.busy) return;
  refs.exportNotice.hidden = true;
  setBusy(true, 'Exporting PDF…');
  try {
    const result = await exportEditedPdf({
      onProgress: (done, total) => {
        refs.stageStatus.textContent = 'Exporting PDF… ' + done + ' / ' + total + ' changed pages';
      }
    });
    refs.stageStatus.textContent = 'Saving changes…';
    if (result.warnings.length) {
      refs.exportNotice.textContent = result.warnings.join(' ') + ' The downloaded PDF was reopened locally and passed its integrity check.';
      refs.exportNotice.hidden = false;
    } else {
      refs.exportNotice.textContent = 'Your edited PDF was downloaded and passed a local integrity check.';
      refs.exportNotice.hidden = false;
    }
  } catch (error) {
    refs.exportNotice.textContent = (error && error.message) || 'The PDF could not be exported.';
    refs.exportNotice.hidden = false;
  } finally {
    setBusy(false);
    refs.stageStatus.hidden = true;
    updateDirtyUi();
  }
}

function hasFormFocus(target) {
  return Boolean(target && (target.matches('input, textarea, select') || target.isContentEditable));
}

function onKeyDown(event) {
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === 'c' && !hasFormFocus(event.target) && editorState.selectedObjectId) {
    event.preventDefault();
    copySelectedObject();
    return;
  }
  if (modifier && event.key.toLowerCase() === 'v' && !hasFormFocus(event.target) && editorClipboard) {
    event.preventDefault();
    pasteSelectedObject();
    return;
  }
  if (modifier && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
    renderer && renderer.refreshTextLayers();
    if (editorState.selectedObjectId) selectTextObject(editorState.selectedObjectId);
    updateDirtyUi();
    return;
  }
  if (modifier && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
    renderer && renderer.refreshTextLayers();
    if (editorState.selectedObjectId) selectTextObject(editorState.selectedObjectId);
    updateDirtyUi();
    return;
  }
  if (modifier && event.key === 'Enter' && editorState.selectedObjectId) {
    event.preventDefault();
    commitSelectedText();
    return;
  }
  if (event.key === 'Escape') {
    editorState.selectedObjectId = null;
    refs.selectionEmpty.hidden = false;
    refs.propertiesForm.hidden = true;
    refs.objectProperties.hidden = true;
    setMode('select');
    closePropertiesPanel();
    renderer && renderer.setSelectedText(null);
    return;
  }
  const object = getTextObject(editorState.selectedObjectId);
  if (!object || hasFormFocus(event.target) || !renderer) return;
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    if (!isTextObject(object)) {
      deleteSelectedObject();
      return;
    }
    rememberObjectsForHistory([object]);
    if (applyTextProperties(object, { text: '' })) {
      recordHistory();
      refs.textValue.value = '';
      renderer.refreshTextLayers();
      updateDirtyUi();
    }
    return;
  }
  const arrowDeltas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  if (arrowDeltas[event.key]) {
    event.preventDefault();
    rememberObjectsForHistory([object]);
    const multiplier = event.shiftKey ? 10 : 1;
    const delta = arrowDeltas[event.key];
    if (moveTextObject(object, object.x + delta[0] * multiplier, object.y + delta[1] * multiplier)) {
      recordHistory();
      renderer.refreshTextLayers();
      selectTextObject(object.id);
      updateDirtyUi();
    }
  }
}

refs.fileInput.addEventListener('change', (event) => loadFile(event.target.files && event.target.files[0]));
refs.uploadCard.addEventListener('dragover', (event) => {
  event.preventDefault();
  refs.uploadCard.classList.add('is-dragging');
});
refs.uploadCard.addEventListener('dragleave', (event) => {
  if (!refs.uploadCard.contains(event.relatedTarget)) refs.uploadCard.classList.remove('is-dragging');
});
refs.uploadCard.addEventListener('drop', (event) => {
  event.preventDefault();
  refs.uploadCard.classList.remove('is-dragging');
  loadFile(event.dataTransfer && event.dataTransfer.files[0]);
});
refs.openAnother.addEventListener('click', resetToPicker);
refs.download.addEventListener('click', exportPdf);
byId('zoom-in-button').addEventListener('click', () => changeZoom(editorState.zoom * 1.15));
byId('zoom-out-button').addEventListener('click', () => changeZoom(editorState.zoom / 1.15));
byId('fit-width-button').addEventListener('click', () => fitCurrentPage(false));
byId('fit-page-button').addEventListener('click', () => fitCurrentPage(true));
byId('previous-page-button').addEventListener('click', () => renderer && renderer.goToPage(editorState.currentPage - 1));
byId('next-page-button').addEventListener('click', () => renderer && renderer.goToPage(editorState.currentPage + 1));
const commitPageJump = () => {
  window.clearTimeout(pageJumpTimer);
  const pageNumber = Number(refs.currentPage.value);
  if (renderer && Number.isFinite(pageNumber) && pageNumber >= 1 && pageNumber <= editorState.pageCount) {
    renderer.goToPage(pageNumber);
  } else {
    refs.currentPage.value = String(editorState.currentPage);
  }
};
refs.currentPage.addEventListener('input', () => {
  window.clearTimeout(pageJumpTimer);
  pageJumpTimer = window.setTimeout(commitPageJump, 180);
});
refs.currentPage.addEventListener('change', commitPageJump);
refs.rotatePage.addEventListener('click', () => runPageOperation((page) => rotatePdfPage(page, 90), 'Page rotated 90° clockwise.'));
refs.movePageUp.addEventListener('click', () => runPageOperation((page) => reorderPdfPage(page, -1), 'Page moved earlier.'));
refs.movePageDown.addEventListener('click', () => runPageOperation((page) => reorderPdfPage(page, 1), 'Page moved later.'));
refs.duplicatePage.addEventListener('click', () => runPageOperation(duplicatePdfPage, 'Page duplicated.'));
refs.insertBlankPage.addEventListener('click', () => runPageOperation(insertBlankPageAfter, 'A blank page was inserted.'));
refs.deletePage.addEventListener('click', () => runPageOperation(removePdfPage, 'Page deleted.'));
refs.undoButton.addEventListener('click', () => {
  if (undo()) {
    renderer && renderer.refreshTextLayers();
    if (editorState.selectedObjectId) selectTextObject(editorState.selectedObjectId);
    updateDirtyUi();
  }
});
refs.redoButton.addEventListener('click', () => {
  if (redo()) {
    renderer && renderer.refreshTextLayers();
    if (editorState.selectedObjectId) selectTextObject(editorState.selectedObjectId);
    updateDirtyUi();
  }
});
refs.propertiesForm.addEventListener('submit', commitSelectedText);
refs.objectProperties.addEventListener('submit', commitObjectProperties);
refs.deleteObject.addEventListener('click', deleteSelectedObject);
refs.duplicateObject.addEventListener('click', duplicateSelectedObject);
refs.highlightSelected.addEventListener('click', highlightSelectedText);
refs.runOcr.addEventListener('click', runOcrOnCurrentPage);
refs.textColor.addEventListener('input', () => { refs.textColorValue.textContent = refs.textColor.value.toUpperCase(); });
byId('mode-select-button').addEventListener('click', () => setMode('select'));
byId('mode-text-button').addEventListener('click', () => setMode('text'));
byId('mode-draw-button').addEventListener('click', () => setMode('draw'));
byId('mode-highlight-button').addEventListener('click', () => setMode('highlight'));
byId('mode-shape-button').addEventListener('click', () => setMode('shape'));
byId('mode-whiteout-button').addEventListener('click', () => {
  setMode('whiteout');
  refs.stageStatus.textContent = 'Whiteout visually covers content only; it is not secure redaction. Drag over an area to cover it.';
  refs.stageStatus.hidden = false;
});
byId('mode-image-button').addEventListener('click', () => refs.imageInput.click());
byId('mode-signature-button').addEventListener('click', openSignatureDialog);
refs.imageInput.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  refs.imageInput.value = '';
  if (!file) return;
  try {
    pendingImage = await decodeLocalImage(file);
    setMode('image');
    refs.stageStatus.textContent = 'Click a page to place the image.';
    refs.stageStatus.hidden = false;
  } catch (error) {
    refs.stageStatus.textContent = error.message || 'The image could not be opened.';
    refs.stageStatus.hidden = false;
  }
});
refs.signatureCanvas.addEventListener('pointerdown', (event) => {
  const canvas = refs.signatureCanvas;
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  context.strokeStyle = '#172554';
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
  signatureHasInk = true;
  try { canvas.setPointerCapture(event.pointerId); } catch (error) {}
  event.preventDefault();
});
refs.signatureCanvas.addEventListener('pointermove', (event) => {
  if (!event.buttons && event.pointerType !== 'touch') return;
  const canvas = refs.signatureCanvas;
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  context.lineTo((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
  context.stroke();
  event.preventDefault();
});
refs.signatureCanvas.addEventListener('pointerup', (event) => {
  try { refs.signatureCanvas.releasePointerCapture(event.pointerId); } catch (error) {}
});
refs.signatureClear.addEventListener('click', () => {
  const context = refs.signatureCanvas.getContext('2d');
  if (context) context.clearRect(0, 0, refs.signatureCanvas.width, refs.signatureCanvas.height);
  signatureHasInk = false;
  pendingImage = null;
});
refs.signatureFile.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  refs.signatureFile.value = '';
  if (!file) return;
  try {
    pendingImage = await decodeLocalImage(file);
    refs.stageStatus.textContent = 'Signature image ready. Select Use signature, then click the page to place it.';
    refs.stageStatus.hidden = false;
  } catch (error) {
    refs.stageStatus.textContent = error.message || 'The signature image could not be opened.';
    refs.stageStatus.hidden = false;
  }
});
refs.signatureUse.addEventListener('click', useSignature);
refs.signatureClose.addEventListener('click', () => {
  if (refs.signatureDialog.open) refs.signatureDialog.close();
});
refs.findToggle.addEventListener('click', toggleFindPanel);
refs.findText.addEventListener('input', scheduleFind);
refs.findPrevious.addEventListener('click', () => showFindMatch(currentFindIndex - 1));
refs.findNext.addEventListener('click', () => showFindMatch(currentFindIndex + 1));
refs.replaceAll.addEventListener('click', replaceAllMatches);
refs.pagesDrawer.addEventListener('click', () => {
  const open = !refs.pagesPanel.classList.contains('is-open');
  refs.pagesPanel.classList.toggle('is-open', open);
  refs.pagesDrawer.setAttribute('aria-expanded', String(open));
});
refs.propertiesDrawer.addEventListener('click', () => {
  if (refs.propertiesPanel.classList.contains('is-open')) closePropertiesPanel();
  else openPropertiesPanel();
});
refs.closeProperties.addEventListener('click', closePropertiesPanel);
refs.passwordForm.addEventListener('submit', (event) => event.preventDefault());
refs.passwordCancel.addEventListener('click', () => {
  if (refs.passwordDialog.open) refs.passwordDialog.close();
});
window.addEventListener('keydown', onKeyDown);
window.addEventListener('resize', () => {
  if (renderer && editorState.zoomMode !== 'manual') {
    const fitPage = editorState.zoomMode === 'fit-page';
    changeZoom(fitScale(editorState.currentPage, fitPage), editorState.zoomMode);
  }
});
window.addEventListener('pdf-editor:state-restored', () => {
  if (renderer && rendererLayoutRevision !== editorState.pageLayoutRevision) {
    rebuildPageView(editorState.currentPage);
  } else {
    renderer && renderer.refreshTextLayers();
    if (editorState.selectedObjectId) selectTextObject(editorState.selectedObjectId);
  }
  updatePageIndicators();
  updateDirtyUi();
});
