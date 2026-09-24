import { editorState } from './state.js';

const MAX_HISTORY = 60;

function cloneObject(object) {
  return {
    ...object,
    transform: object.transform ? object.transform.slice() : null,
    points: Array.isArray(object.points) ? object.points.map((point) => point.slice()) : object.points,
    color: object.color ? { ...object.color, rgb: object.color.rgb ? object.color.rgb.slice() : undefined } : object.color,
    background: object.background ? { ...object.background, rgb: object.background.rgb ? object.background.rgb.slice() : undefined } : object.background
  };
}

function snapshot() {
  return {
    objects: editorState.objects.map(cloneObject),
    pages: editorState.pages.map((page) => ({
      id: page.id,
      pageNumber: page.pageNumber,
      sourcePageNumber: page.sourcePageNumber ?? null,
      isBlank: Boolean(page.isBlank),
      width: page.width,
      height: page.height,
      baseWidth: page.baseWidth,
      baseHeight: page.baseHeight,
      rotation: page.rotation,
      baseRotation: page.baseRotation,
      view: page.view ? page.view.slice() : null,
      textLoaded: Boolean(page.textLoaded),
      ocrReady: Boolean(page.ocrReady),
      objects: Array.isArray(page.objects) ? page.objects.slice() : []
    })),
    selectedObjectId: editorState.selectedObjectId,
    currentPage: editorState.currentPage,
    pageStructureChanged: editorState.pageStructureChanged,
    dirty: editorState.dirty
  };
}

function restore(value) {
  const previousLayout = JSON.stringify(editorState.pages.map((page) => [page.id, page.sourcePageNumber, page.rotation]));
  editorState.objects = value.objects.map(cloneObject);
  const restoredPages = value.pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    viewport: null,
    renderedScale: 0,
    loadingScale: 0,
    canvas: null,
    renderTask: null,
    textLoading: null,
    thumbnailRendered: false,
    objects: page.objects.slice()
  }));
  const nextLayout = JSON.stringify(restoredPages.map((page) => [page.id, page.sourcePageNumber, page.rotation]));
  if (previousLayout !== nextLayout) editorState.pages = restoredPages;
  editorState.pageCount = editorState.pages.length;
  editorState.currentPage = Math.max(1, Math.min(editorState.pageCount, value.currentPage || 1));
  editorState.pageStructureChanged = Boolean(value.pageStructureChanged);
  editorState.selectedObjectId = value.selectedObjectId;
  editorState.dirty = value.dirty;
  if (previousLayout !== nextLayout) editorState.pageLayoutRevision += 1;
  window.dispatchEvent(new CustomEvent('pdf-editor:state-restored'));
}

export function rememberObjectsForHistory(objects) {
  if (!editorState.history.length) resetHistory();
  editorState.history.forEach((entry) => {
    const known = new Set(entry.objects.map((object) => object.id));
    objects.forEach((object) => {
      if (!known.has(object.id)) {
        entry.objects.push(cloneObject(object));
      }
    });
  });
}

export function resetHistory() {
  editorState.history = [snapshot()];
  editorState.historyIndex = 0;
}

export function recordHistory() {
  const next = snapshot();
  const current = editorState.history[editorState.historyIndex];
  if (current && JSON.stringify(current) === JSON.stringify(next)) return;
  editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
  editorState.history.push(next);
  if (editorState.history.length > MAX_HISTORY) editorState.history.shift();
  editorState.historyIndex = editorState.history.length - 1;
}

export function undo() {
  if (editorState.historyIndex <= 0) return false;
  editorState.historyIndex -= 1;
  restore(editorState.history[editorState.historyIndex]);
  return true;
}

export function redo() {
  if (editorState.historyIndex >= editorState.history.length - 1) return false;
  editorState.historyIndex += 1;
  restore(editorState.history[editorState.historyIndex]);
  return true;
}

export function canUndo() {
  return editorState.historyIndex > 0;
}

export function canRedo() {
  return editorState.historyIndex >= 0 && editorState.historyIndex < editorState.history.length - 1;
}
