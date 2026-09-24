import { editorState, getPageState } from './state.js';
import { extractTextForPage } from './text-extractor.js';

function createBlankViewport(metadata, scale) {
  const baseWidth = metadata.baseWidth || metadata.width;
  const baseHeight = metadata.baseHeight || metadata.height;
  const rotation = ((Number(metadata.rotation || 0) - Number(metadata.baseRotation || 0)) % 360 + 360) % 360;
  const sideways = rotation === 90 || rotation === 270;
  const width = (sideways ? baseHeight : baseWidth) * scale;
  const height = (sideways ? baseWidth : baseHeight) * scale;
  let transform;
  if (rotation === 90) transform = [0, scale, scale, 0, 0, 0];
  else if (rotation === 180) transform = [-scale, 0, 0, scale, baseWidth * scale, 0];
  else if (rotation === 270) transform = [0, -scale, -scale, 0, baseHeight * scale, baseWidth * scale];
  else transform = [scale, 0, 0, -scale, 0, baseHeight * scale];
  const toViewport = (x, y) => [transform[0] * x + transform[2] * y + transform[4], transform[1] * x + transform[3] * y + transform[5]];
  const toPdf = (x, y) => {
    if (rotation === 90) return [y / scale, x / scale];
    if (rotation === 180) return [baseWidth - x / scale, y / scale];
    if (rotation === 270) return [baseWidth - y / scale, baseHeight - x / scale];
    return [x / scale, baseHeight - y / scale];
  };
  return {
    width,
    height,
    scale,
    rotation: metadata.rotation || 0,
    transform,
    convertToViewportPoint: toViewport,
    convertToPdfPoint: toPdf,
    convertToViewportRectangle(rect) {
      const first = this.convertToViewportPoint(rect[0], rect[1]);
      const second = this.convertToViewportPoint(rect[2], rect[3]);
      return [first[0], first[1], second[0], second[1]];
    }
  };
}

export function getTextScreenBox(object, viewport) {
  const transform = object.transform.slice();
  const originalAngle = Math.atan2(transform[1], transform[0]);
  const requestedAngle = Number.isFinite(object.rotation) ? object.rotation * Math.PI / 180 : originalAngle;
  const delta = requestedAngle - originalAngle;
  const cosine = Math.cos(delta);
  const sine = Math.sin(delta);
  const a = transform[0];
  const b = transform[1];
  const c = transform[2];
  const d = transform[3];
  transform[0] = a * cosine - b * sine;
  transform[1] = a * sine + b * cosine;
  transform[2] = c * cosine - d * sine;
  transform[3] = c * sine + d * cosine;
  transform[4] = object.x;
  transform[5] = object.y;
  const tx = window.pdfjsLib.Util.transform(viewport.transform, transform);
  const fontSize = Math.max(1, Math.hypot(tx[0], tx[1]));
  const height = Math.max(fontSize * (object.ascent - object.descent), fontSize);
  const width = Math.max(Math.abs(object.width * viewport.scale), fontSize * 0.35);
  return {
    left: tx[4],
    top: tx[5] - fontSize * object.ascent,
    width,
    height,
    baselineX: tx[4],
    baselineY: tx[5],
    fontSize,
    angle: Math.atan2(tx[1], tx[0]) * 180 / Math.PI
  };
}

function makeTextButton(object, box, selectedId, onSelect, onDoubleClick, onDragStart) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pdf-text-hit' + (object.id === selectedId ? ' is-selected' : '');
  button.setAttribute('aria-label', 'Select PDF text: ' + object.text.slice(0, 80));
  button.dataset.objectId = object.id;
  button.style.left = box.left + 'px';
  button.style.top = box.top + 'px';
  button.style.width = box.width + 'px';
  button.style.height = box.height + 'px';
  button.style.transform = 'rotate(' + box.angle + 'deg)';
  button.style.setProperty('--text-hit-angle', box.angle + 'deg');
  button.addEventListener('click', (event) => {
    if (Date.now() < Number(editorState.ignoreObjectClickUntil || 0)) return;
    if (editorState.mode !== 'select') return;
    event.stopPropagation();
    onSelect(object.id);
  });
  button.addEventListener('dblclick', (event) => {
    if (editorState.mode !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    onDoubleClick(object.id);
  });
  button.addEventListener('pointerdown', (event) => {
    if (editorState.mode === 'select' && event.button === 0 && object.id === selectedId) onDragStart(event, object.id);
  });
  return button;
}

function makePreview(object, viewport) {
  const preview = document.createElement('div');
  preview.className = 'pdf-text-preview';
  const x = object.originalX;
  const y = object.originalY;
  const originalState = {
    ...object,
    x,
    y,
    rotation: object.originalRotation
  };
  const cover = getTextScreenBox(originalState, viewport);
  preview.style.left = cover.left + 'px';
  preview.style.top = cover.top + 'px';
  preview.style.width = Math.max(cover.width, object.fontSize * 0.4) + 'px';
  preview.style.height = cover.height + 'px';
  preview.style.transform = 'rotate(' + cover.angle + 'deg)';
  preview.style.backgroundColor = ['text', 'ocr-text'].includes(object.type) && object.background && object.background.hex ? object.background.hex : 'transparent';
  preview.style.color = object.colorHex || '#1F1F1F';
  preview.style.fontFamily = '"' + String(object.fontFamily || 'Helvetica').replace(/["\\]/g, '') + '", Arial, sans-serif';
  preview.style.fontSize = cover.fontSize + 'px';
  preview.style.fontWeight = object.bold ? '700' : '400';
  preview.style.fontStyle = object.italic ? 'italic' : 'normal';
  preview.style.opacity = String(Number(object.opacity ?? 1));
  preview.style.textAlign = object.alignment || 'left';
  preview.style.letterSpacing = (Number(object.letterSpacing || 0) * viewport.scale) + 'px';
  preview.style.lineHeight = cover.height + 'px';
  preview.style.whiteSpace = 'pre';
  preview.textContent = object.text;
  return preview;
}

function viewportBox(object, viewport) {
  const width = Math.max(1, object.width || 1);
  const height = Math.max(1, object.height || 1);
  const rect = viewport.convertToViewportRectangle([object.x, object.y, object.x + width, object.y + height]);
  return {
    left: Math.min(rect[0], rect[2]),
    top: Math.min(rect[1], rect[3]),
    width: Math.max(1, Math.abs(rect[2] - rect[0])),
    height: Math.max(1, Math.abs(rect[3] - rect[1]))
  };
}

function makeObjectElement(object, viewport, selectedId, onSelect, onDragStart) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'pdf-object-hit pdf-object-hit-' + object.type + (object.shape ? ' pdf-object-hit-' + object.shape : '') + (object.id === selectedId ? ' is-selected' : '');
  const label = object.type === 'image' ? 'image' : object.type === 'draw' ? 'drawing' : object.type === 'whiteout' ? 'whiteout' : object.type === 'highlight' ? 'highlight' : 'shape';
  element.setAttribute('aria-label', 'Select ' + label);
  element.dataset.objectId = object.id;
  const box = viewportBox(object, viewport);
  element.style.left = box.left + 'px';
  element.style.top = box.top + 'px';
  element.style.width = box.width + 'px';
  element.style.height = box.height + 'px';
  element.style.opacity = String(Number.isFinite(object.opacity) ? object.opacity : 1);
  element.style.transform = 'rotate(' + (-Number(object.rotation || 0)) + 'deg)';
  element.style.setProperty('--object-stroke', object.strokeColor || '#2563EB');
  element.style.setProperty('--object-fill', object.fillColor || 'transparent');
  element.style.setProperty('--object-stroke-width', Math.max(0.5, Number(object.strokeWidth || 2) * viewport.scale) + 'px');

  if (object.type === 'image' && object.imageData) {
    element.style.backgroundImage = 'url("' + object.imageData.replace(/["\\]/g, '') + '")';
  } else if (object.type === 'shape' || object.type === 'highlight' || object.type === 'whiteout') {
    element.classList.add('pdf-object-shape-' + (object.shape || 'rectangle'));
    if (object.type === 'whiteout' || object.type === 'highlight') element.style.borderColor = 'transparent';
    if (object.shape === 'line' || object.shape === 'arrow') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      svg.setAttribute('aria-hidden', 'true');
      const start = viewport.convertToViewportPoint(object.x, object.y);
      const end = viewport.convertToViewportPoint(object.x + (object.width || 1), object.y + (object.height || 1));
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(start[0] - box.left));
      line.setAttribute('y1', String(start[1] - box.top));
      line.setAttribute('x2', String(end[0] - box.left));
      line.setAttribute('y2', String(end[1] - box.top));
      line.setAttribute('stroke', object.strokeColor || '#2563EB');
      line.setAttribute('stroke-width', String(Math.max(0.5, Number(object.strokeWidth || 2) * viewport.scale)));
      line.setAttribute('stroke-linecap', 'round');
      svg.append(line);
      if (object.shape === 'arrow') {
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        const length = 11 * viewport.scale;
        const points = [-1, 1].map((side) => {
          const headAngle = angle + Math.PI + side * Math.PI / 6;
          return (end[0] - box.left + Math.cos(headAngle) * length) + ',' + (end[1] - box.top + Math.sin(headAngle) * length);
        });
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        head.setAttribute('points', points.join(' '));
        head.setAttribute('fill', 'none');
        head.setAttribute('stroke', object.strokeColor || '#2563EB');
        head.setAttribute('stroke-width', String(Math.max(0.5, Number(object.strokeWidth || 2) * viewport.scale)));
        head.setAttribute('stroke-linecap', 'round');
        svg.append(head);
      }
      element.append(svg);
    }
  } else if (object.type === 'draw' && Array.isArray(object.points)) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const points = object.points.map((point) => {
      const screen = viewport.convertToViewportPoint(point[0], point[1]);
      return (screen[0] - box.left) + ',' + (screen[1] - box.top);
    }).join(' ');
    path.setAttribute('points', points);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', object.strokeColor || '#1D4ED8');
    path.setAttribute('stroke-width', String(Math.max(0.5, Number(object.strokeWidth || 2.5) * viewport.scale)));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
    element.append(svg);
  }

  element.addEventListener('click', (event) => {
    if (Date.now() < Number(editorState.ignoreObjectClickUntil || 0)) return;
    if (editorState.mode !== 'select') return;
    event.stopPropagation();
    onSelect(object.id);
  });
  element.addEventListener('pointerdown', (event) => {
    if (editorState.mode === 'select' && event.button === 0 && object.id === selectedId) onDragStart(event, object.id);
  });
  return element;
}

export class PageRenderer {
  constructor({ container, scrollRoot, onPageReady, onPageChange, onSelectText, onDoubleClickText, onDragStart, onStagePointerDown, onStageClick }) {
    this.container = container;
    this.scrollRoot = scrollRoot;
    this.onPageReady = onPageReady;
    this.onPageChange = onPageChange;
    this.onSelectText = onSelectText;
    this.onDoubleClickText = onDoubleClickText;
    this.onDragStart = onDragStart;
    this.onStagePointerDown = onStagePointerDown;
    this.onStageClick = onStageClick;
    this.renderObserver = null;
    this.pageObserver = null;
    this.shells = new Map();
    this.disposed = false;
  }

  createPageShells() {
    this.container.replaceChildren();
    this.shells.clear();
    const fragment = document.createDocumentFragment();
    editorState.pages.forEach((metadata) => {
      const shell = document.createElement('article');
      shell.className = 'pdf-page-shell';
      shell.dataset.pageNumber = String(metadata.pageNumber);
      shell.setAttribute('aria-label', 'PDF page ' + metadata.pageNumber);
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      const textLayer = document.createElement('div');
      textLayer.className = 'pdf-text-layer';
      textLayer.dataset.pageNumber = String(metadata.pageNumber);
      textLayer.addEventListener('pointerdown', (event) => {
        if (editorState.mode !== 'select' && this.onStagePointerDown) {
          this.onStagePointerDown(event, metadata.pageNumber, metadata.viewport, textLayer);
        }
      });
      textLayer.addEventListener('click', (event) => {
        if (editorState.mode !== 'select' && this.onStageClick) {
          this.onStageClick(event, metadata.pageNumber, metadata.viewport, textLayer);
        }
      });
      shell.append(canvas, textLayer);
      fragment.appendChild(shell);
      metadata.canvas = canvas;
      this.shells.set(metadata.pageNumber, { shell, canvas, textLayer });
      this.setShellSize(metadata);
    });
    this.container.appendChild(fragment);
    this.observePages();
  }

  setShellSize(metadata) {
    const entry = this.shells.get(metadata.pageNumber);
    if (!entry) return;
    const scale = editorState.zoom || 1;
    entry.shell.style.width = Math.round(metadata.width * scale) + 'px';
    entry.shell.style.height = Math.round(metadata.height * scale) + 'px';
    entry.canvas.style.width = Math.round(metadata.width * scale) + 'px';
    entry.canvas.style.height = Math.round(metadata.height * scale) + 'px';
    entry.textLayer.style.width = Math.round(metadata.width * scale) + 'px';
    entry.textLayer.style.height = Math.round(metadata.height * scale) + 'px';
  }

  observePages() {
    if (this.renderObserver) this.renderObserver.disconnect();
    if (this.pageObserver) this.pageObserver.disconnect();
    this.renderObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const pageNumber = Number(entry.target.dataset.pageNumber);
        if (entry.isIntersecting) {
          const metadata = getPageState(pageNumber);
          if (metadata) metadata.releaseWhenRendered = false;
          this.renderPage(pageNumber);
        }
        else if (Math.abs(pageNumber - editorState.currentPage) > 4) this.releasePage(pageNumber);
      });
    }, { root: this.scrollRoot, rootMargin: '1400px 0px', threshold: 0 });
    this.pageObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible) {
        const pageNumber = Number(visible.target.dataset.pageNumber);
        if (pageNumber !== editorState.currentPage) {
          editorState.currentPage = pageNumber;
          this.releaseDistantPages();
          this.onPageChange(pageNumber);
        }
      }
    }, { root: this.scrollRoot, rootMargin: '-15% 0px -65% 0px', threshold: [0, 0.2, 0.5] });
    this.shells.forEach(({ shell }) => {
      this.renderObserver.observe(shell);
      this.pageObserver.observe(shell);
    });
  }

  async renderPage(pageNumber) {
    const entry = this.shells.get(pageNumber);
    const metadata = getPageState(pageNumber);
    if (!entry || !metadata || this.disposed) return;
    metadata.releaseWhenRendered = false;
    const scale = editorState.zoom || 1;
    if (metadata.loadingScale === scale || (metadata.renderedScale === scale && metadata.viewport)) return;
    if (metadata.renderTask) metadata.renderTask.cancel();
    const renderEpoch = editorState.renderEpoch;
    this.setShellSize(metadata);
    metadata.loadingScale = scale;
    try {
      const pdfPage = metadata.isBlank ? null : await editorState.pdfDocument.getPage(metadata.sourcePageNumber || pageNumber);
      if (renderEpoch !== editorState.renderEpoch || this.disposed) {
        metadata.loadingScale = 0;
        return;
      }
      const viewport = pdfPage
        ? pdfPage.getViewport({ scale, rotation: metadata.rotation })
        : createBlankViewport(metadata, scale);
      const cssPixels = Math.max(viewport.width, viewport.height);
      const cssArea = Math.max(1, viewport.width * viewport.height);
      const dpr = Math.max(0.5, Math.min(
        2,
        window.devicePixelRatio || 1,
        4096 / Math.max(1, cssPixels),
        Math.sqrt(16000000 / cssArea)
      ));
      const hiResViewport = pdfPage
        ? pdfPage.getViewport({ scale: scale * dpr, rotation: metadata.rotation })
        : createBlankViewport(metadata, scale * dpr);
      const context = entry.canvas.getContext('2d', { alpha: false });
      entry.canvas.width = Math.ceil(hiResViewport.width);
      entry.canvas.height = Math.ceil(hiResViewport.height);
      entry.canvas.style.width = viewport.width + 'px';
      entry.canvas.style.height = viewport.height + 'px';
      entry.textLayer.style.width = viewport.width + 'px';
      entry.textLayer.style.height = viewport.height + 'px';
      metadata.viewport = viewport;
      metadata.renderedScale = scale;
      metadata.loadingScale = 0;
      if (pdfPage) {
        metadata.renderTask = pdfPage.render({ canvasContext: context, viewport: hiResViewport });
        await metadata.renderTask.promise;
        metadata.renderTask = null;
      } else {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, entry.canvas.width, entry.canvas.height);
      }
      if (renderEpoch !== editorState.renderEpoch || this.disposed) return;
      const objects = pdfPage ? await extractTextForPage(pdfPage, pageNumber) : [];
      this.renderTextLayer(pageNumber);
      this.onPageReady(pageNumber, objects, entry.canvas);
      if (metadata.releaseWhenRendered || Math.abs(pageNumber - editorState.currentPage) > 4) {
        this.releasePage(pageNumber);
      }
    } catch (error) {
      metadata.renderTask = null;
      metadata.loadingScale = 0;
      if (error && error.name === 'RenderingCancelledException') {
        if (metadata.releaseWhenRendered) this.releasePage(pageNumber);
        return;
      }
      metadata.renderedScale = 0;
      metadata.viewport = null;
      console.error('[PDF Editor] Page render failed.', pageNumber, error);
      const entryShell = this.shells.get(pageNumber);
      if (entryShell) entryShell.shell.classList.add('is-render-error');
    }
  }

  renderTextLayer(pageNumber) {
    const metadata = getPageState(pageNumber);
    const entry = this.shells.get(pageNumber);
    if (!metadata || !metadata.viewport || !entry) return;
    const layer = entry.textLayer;
    layer.replaceChildren();
    const objects = editorState.objects.filter((object) => object.page === pageNumber);
    objects.forEach((object) => {
      if (object.type === 'text' || object.type === 'new-text' || object.type === 'ocr-text') {
        if (object.modified) layer.appendChild(makePreview(object, metadata.viewport));
        const box = getTextScreenBox(object, metadata.viewport);
        layer.appendChild(makeTextButton(object, box, editorState.selectedObjectId, this.onSelectText, this.onDoubleClickText, this.onDragStart));
      } else {
        layer.appendChild(makeObjectElement(object, metadata.viewport, editorState.selectedObjectId, this.onSelectText, this.onDragStart));
      }
    });
  }

  refreshTextLayers() {
    this.shells.forEach((_, pageNumber) => this.renderTextLayer(pageNumber));
  }

  releaseDistantPages() {
    this.shells.forEach((_, pageNumber) => {
      if (Math.abs(pageNumber - editorState.currentPage) > 4) this.releasePage(pageNumber);
    });
  }

  setSelectedText(id) {
    this.shells.forEach(({ textLayer }) => {
      textLayer.querySelectorAll('.pdf-text-hit, .pdf-object-hit').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.objectId === id);
      });
    });
  }

  releasePage(pageNumber) {
    const metadata = getPageState(pageNumber);
    const entry = this.shells.get(pageNumber);
    if (!metadata || !entry || !metadata.canvas) return;
    if (metadata.renderTask) {
      metadata.releaseWhenRendered = true;
      return;
    }
    if (metadata.renderedScale === 0) return;
    entry.canvas.width = 0;
    entry.canvas.height = 0;
    entry.canvas.style.width = '0px';
    entry.canvas.style.height = '0px';
    entry.textLayer.replaceChildren();
    metadata.renderedScale = 0;
    metadata.viewport = null;
    metadata.releaseWhenRendered = false;
  }

  setZoom(value, mode = 'manual') {
    editorState.zoom = Math.max(0.35, Math.min(3.25, value));
    editorState.zoomMode = mode;
    editorState.renderEpoch += 1;
    editorState.pages.forEach((metadata) => {
      if (metadata.renderTask) {
        metadata.renderTask.cancel();
        metadata.renderTask = null;
      }
      this.setShellSize(metadata);
      if (metadata.canvas) {
        metadata.canvas.width = 0;
        metadata.canvas.height = 0;
      }
      const entry = this.shells.get(metadata.pageNumber);
      if (entry) entry.textLayer.replaceChildren();
      metadata.renderedScale = 0;
      metadata.loadingScale = 0;
      metadata.viewport = null;
    });
    this.observePages();
  }

  goToPage(pageNumber) {
    const clamped = Math.max(1, Math.min(editorState.pageCount, pageNumber));
    const entry = this.shells.get(clamped);
    if (!entry) return;
    const jumpDistance = Math.abs(clamped - editorState.currentPage);
    editorState.currentPage = clamped;
    this.releaseDistantPages();
    if (jumpDistance > 2) {
      const rootRect = this.scrollRoot.getBoundingClientRect();
      const shellRect = entry.shell.getBoundingClientRect();
      const previousBehavior = this.scrollRoot.style.scrollBehavior;
      this.scrollRoot.style.scrollBehavior = 'auto';
      this.scrollRoot.scrollTop = Math.max(0, this.scrollRoot.scrollTop + shellRect.top - rootRect.top);
      this.scrollRoot.style.scrollBehavior = previousBehavior;
    } else {
      entry.shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.renderPage(clamped);
    this.onPageChange(clamped);
  }

  getPageCanvas(pageNumber) {
    const entry = this.shells.get(pageNumber);
    return entry ? entry.canvas : null;
  }

  destroy() {
    this.disposed = true;
    if (this.renderObserver) this.renderObserver.disconnect();
    if (this.pageObserver) this.pageObserver.disconnect();
    editorState.pages.forEach((metadata) => {
      if (metadata.renderTask) {
        metadata.renderTask.cancel();
        metadata.renderTask = null;
      }
      metadata.loadingScale = 0;
      metadata.renderedScale = 0;
      metadata.viewport = null;
    });
    this.shells.clear();
  }
}
