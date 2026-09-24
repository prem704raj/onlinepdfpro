import { editorState, markDirty, updatePageStructureChanged } from './state.js';

function makePageId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return 'page-' + window.crypto.randomUUID();
  return 'page-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function cloneEditorObject(object, pageId, pageNumber) {
  return {
    ...object,
    id: 'obj-' + makePageId(),
    pageId,
    page: pageNumber,
    transform: object.transform ? object.transform.slice() : null,
    points: Array.isArray(object.points) ? object.points.map((point) => point.slice()) : object.points,
    color: object.color ? { ...object.color, rgb: object.color.rgb ? object.color.rgb.slice() : undefined } : object.color,
    background: object.background ? { ...object.background, rgb: object.background.rgb ? object.background.rgb.slice() : undefined } : object.background
  };
}

function cleanPageCopy(page, id) {
  return {
    ...page,
    id,
    pageNumber: 0,
    viewport: null,
    renderedScale: 0,
    loadingScale: 0,
    canvas: null,
    renderTask: null,
    textLoading: null,
    thumbnailRendered: false,
    ocrReady: Boolean(page.ocrReady),
    objects: []
  };
}

function reindexPages() {
  const pageNumbers = new Map();
  editorState.pages.forEach((page, index) => {
    page.pageNumber = index + 1;
    pageNumbers.set(page.id, index + 1);
  });
  editorState.objects.forEach((object) => {
    if (!object.pageId) {
      const oldPage = editorState.pages[Math.max(0, (Number(object.page) || 1) - 1)];
      if (oldPage) object.pageId = oldPage.id;
    }
    const pageNumber = pageNumbers.get(object.pageId);
    object.page = pageNumber || object.page;
  });
  editorState.pages.forEach((page) => {
    page.objects = editorState.objects
      .filter((object) => object.pageId === page.id && ['text', 'ocr-text'].includes(object.type))
      .map((object) => object.id);
  });
  editorState.pageCount = editorState.pages.length;
  editorState.currentPage = Math.max(1, Math.min(editorState.pageCount, editorState.currentPage));
}

function finishPageChange() {
  reindexPages();
  updatePageStructureChanged();
  editorState.pageLayoutRevision += 1;
  editorState.renderEpoch += 1;
  markDirty();
}

export function rotatePage(pageNumber, degrees = 90) {
  const page = editorState.pages[pageNumber - 1];
  if (!page) return false;
  const oldRotation = ((Number(page.rotation) || 0) % 360 + 360) % 360;
  const nextRotation = ((oldRotation + degrees) % 360 + 360) % 360;
  const baseRotation = ((Number(page.baseRotation) || 0) % 360 + 360) % 360;
  const relative = ((nextRotation - baseRotation) % 180 + 180) % 180;
  page.rotation = nextRotation;
  page.width = relative === 90 ? page.baseHeight : page.baseWidth;
  page.height = relative === 90 ? page.baseWidth : page.baseHeight;
  page.viewport = null;
  page.renderedScale = 0;
  page.thumbnailRendered = false;
  finishPageChange();
  return true;
}

export function movePage(pageNumber, offset) {
  const index = pageNumber - 1;
  const target = index + Math.sign(offset);
  if (index < 0 || target < 0 || target >= editorState.pages.length) return false;
  const [page] = editorState.pages.splice(index, 1);
  editorState.pages.splice(target, 0, page);
  editorState.currentPage = target + 1;
  finishPageChange();
  return true;
}

export function duplicatePage(pageNumber) {
  const source = editorState.pages[pageNumber - 1];
  if (!source) return false;
  const duplicate = cleanPageCopy(source, makePageId());
  const targetPageNumber = pageNumber + 1;
  editorState.pages.splice(pageNumber, 0, duplicate);
  const sourceObjects = editorState.objects.filter((object) => object.pageId === source.id);
  const copies = sourceObjects.map((object) => cloneEditorObject(object, duplicate.id, targetPageNumber));
  editorState.objects.push(...copies);
  duplicate.objects = copies.filter((object) => ['text', 'ocr-text'].includes(object.type)).map((object) => object.id);
  duplicate.textLoaded = Boolean(source.textLoaded);
  editorState.currentPage = targetPageNumber;
  finishPageChange();
  return true;
}

export function insertBlankPageAfter(pageNumber) {
  const source = editorState.pages[pageNumber - 1];
  if (!source) return false;
  const width = 595.28;
  const height = 841.89;
  const page = {
    id: makePageId(),
    pageNumber: pageNumber + 1,
    sourcePageNumber: null,
    isBlank: true,
    width,
    height,
    baseWidth: width,
    baseHeight: height,
    rotation: 0,
    baseRotation: 0,
    view: [0, 0, width, height],
    viewport: null,
    renderedScale: 0,
    loadingScale: 0,
    canvas: null,
    renderTask: null,
    objects: [],
    textLoaded: true,
    textLoading: null,
    thumbnailRendered: false,
    ocrReady: true
  };
  editorState.pages.splice(pageNumber, 0, page);
  editorState.currentPage = pageNumber + 1;
  finishPageChange();
  return true;
}

export function deletePage(pageNumber) {
  if (editorState.pages.length <= 1) return false;
  const index = pageNumber - 1;
  const page = editorState.pages[index];
  if (!page) return false;
  editorState.pages.splice(index, 1);
  editorState.objects = editorState.objects.filter((object) => object.pageId !== page.id);
  editorState.currentPage = Math.min(pageNumber, editorState.pages.length);
  editorState.selectedObjectId = null;
  finishPageChange();
  return true;
}
