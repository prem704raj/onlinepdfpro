export const editorState = {
  file: null,
  originalBytes: null,
  pdfDocument: null,
  pageCount: 0,
  pages: [],
  originalPageStructure: '',
  pageStructureChanged: false,
  pageLayoutRevision: 0,
  objects: [],
  selectedObjectId: null,
  currentPage: 1,
  zoom: 1,
  zoomMode: 'fit-width',
  mode: 'select',
  dirty: false,
  busy: false,
  password: null,
  history: [],
  historyIndex: -1,
  renderEpoch: 0
};

export function resetEditorState() {
  if (editorState.pdfDocument && typeof editorState.pdfDocument.destroy === 'function') {
    editorState.pdfDocument.destroy().catch(() => {});
  }
  editorState.file = null;
  editorState.originalBytes = null;
  editorState.pdfDocument = null;
  editorState.pageCount = 0;
  editorState.pages = [];
  editorState.originalPageStructure = '';
  editorState.pageStructureChanged = false;
  editorState.pageLayoutRevision = 0;
  editorState.objects = [];
  editorState.selectedObjectId = null;
  editorState.currentPage = 1;
  editorState.zoom = 1;
  editorState.zoomMode = 'fit-width';
  editorState.mode = 'select';
  editorState.dirty = false;
  editorState.busy = false;
  editorState.password = null;
  editorState.history = [];
  editorState.historyIndex = -1;
  editorState.renderEpoch += 1;
}

export function getTextObject(id) {
  return editorState.objects.find((object) => object.id === id) || null;
}

export function getPageState(pageNumber) {
  return editorState.pages[pageNumber - 1] || null;
}

export function markDirty() {
  editorState.dirty = true;
}

export function pageStructureSignature(pages = editorState.pages) {
  return JSON.stringify(pages.map((page) => ({
    sourcePageNumber: page.sourcePageNumber ?? null,
    isBlank: Boolean(page.isBlank),
    rotation: ((Number(page.rotation) || 0) % 360 + 360) % 360
  })));
}

export function updatePageStructureChanged() {
  editorState.pageStructureChanged = pageStructureSignature() !== editorState.originalPageStructure;
  return editorState.pageStructureChanged;
}
