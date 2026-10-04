import { getTextScreenBox } from './page-renderer.js';
import { getPreviewFontFamily } from './font-resolver.js';

function safeFamily(value) {
  return String(value || 'Helvetica').replace(/["\\]/g, '');
}

function applyTextStyle(element, object, box, viewport) {
  element.style.left = box.left + 'px';
  element.style.top = box.top + 'px';
  element.style.minWidth = Math.max(box.width, box.fontSize * 0.35) + 'px';
  element.style.minHeight = box.height + 'px';
  element.style.transform = 'rotate(' + box.angle + 'deg)';
  element.style.fontFamily = '"' + safeFamily(getPreviewFontFamily(object)) + '", sans-serif';
  element.style.fontSize = box.fontSize + 'px';
  element.style.fontWeight = object.bold ? '700' : '400';
  element.style.fontStyle = object.italic ? 'italic' : 'normal';
  element.style.color = object.colorHex || '#1F1F1F';
  element.style.opacity = String(Number(object.opacity ?? 1));
  element.style.textAlign = object.alignment || 'left';
  element.style.letterSpacing = (Number(object.letterSpacing || 0) * viewport.scale) + 'px';
  element.style.lineHeight = box.height + 'px';
}

function selectAllText(element) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

export class InlineTextEditor {
  constructor({ getObject, onCommit, onCancel, onDraftChange }) {
    this.getObject = getObject;
    this.onCommit = onCommit;
    this.onCancel = onCancel;
    this.onDraftChange = onDraftChange;
    this.session = null;
    this.mask = null;
    this.input = null;
    this.ending = false;
    this.refreshing = false;
    this.pendingCommit = Promise.resolve();
  }

  get active() {
    return Boolean(this.session);
  }

  get activeObjectId() {
    return this.session ? this.session.objectId : null;
  }

  start(object, layer, viewport, point = null) {
    if (!object || !layer || !viewport) return false;
    if (this.session && this.session.objectId === object.id && this.input) {
      this.input.focus({ preventScroll: true });
      if (!point) selectAllText(this.input);
      return true;
    }
    if (this.session && this.session.objectId !== object.id) this.commit('switch');
    this.session = {
      objectId: object.id,
      page: object.page,
      draft: object.text,
      originalText: object.text
    };
    this.mount(layer, viewport, !point);
    if (point && this.input) {
      const range = document.caretRangeFromPoint && document.caretRangeFromPoint(point.clientX, point.clientY);
      if (range && this.input.contains(range.startContainer)) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    return true;
  }

  mount(layer, viewport, selectText = false) {
    if (!this.session) return;
    const object = this.getObject(this.session.objectId);
    if (!object) {
      this.cancel('missing-object');
      return;
    }
    // Removing a focused input fires blur; it must not commit a zoom remount.
    this.ending = true;
    this.removeNodes();
    this.ending = false;
    this.refreshing = false;

    if (object.type !== 'new-text') {
      const source = {
        ...object,
        x: object.originalX,
        y: object.originalY,
        width: object.originalWidth || object.width,
        height: object.originalHeight || object.height,
        fontSize: object.originalFontSize || object.fontSize,
        rotation: object.originalRotation
      };
      const cover = getTextScreenBox(source, viewport);
      const mask = document.createElement('div');
      mask.className = 'pdf-inline-text-mask';
      mask.style.left = cover.left + 'px';
      mask.style.top = cover.top + 'px';
      mask.style.width = Math.max(cover.width, cover.fontSize * 0.35) + 'px';
      mask.style.height = cover.height + 'px';
      mask.style.transform = 'rotate(' + cover.angle + 'deg)';
      mask.style.backgroundColor = object.background && object.background.hex ? object.background.hex : '#FFFFFF';
      layer.appendChild(mask);
      this.mask = mask;
    }

    const box = getTextScreenBox(object, viewport);
    const input = document.createElement('div');
    input.className = 'pdf-inline-text-input';
    input.contentEditable = 'plaintext-only';
    if (input.contentEditable !== 'plaintext-only') input.contentEditable = 'true';
    input.setAttribute('role', 'textbox');
    input.setAttribute('aria-label', 'Edit PDF text');
    input.setAttribute('spellcheck', 'false');
    input.textContent = this.session.draft;
    applyTextStyle(input, object, box, viewport);
    input.addEventListener('input', () => {
      if (!this.session) return;
      this.session.draft = input.textContent || '';
      if (this.onDraftChange) this.onDraftChange(object, this.session.draft);
    });
    input.addEventListener('paste', (event) => {
      const text = event.clipboardData && event.clipboardData.getData('text/plain');
      if (typeof text !== 'string') return;
      event.preventDefault();
      document.execCommand('insertText', false, text);
    });
    input.addEventListener('keydown', (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.stopPropagation();
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        this.commit('enter');
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancel('escape');
      }
    });
    input.addEventListener('pointerdown', (event) => event.stopPropagation());
    input.addEventListener('click', (event) => event.stopPropagation());
    input.addEventListener('blur', () => {
      if (!this.ending && !this.refreshing && this.session) this.commit('blur');
    });
    layer.appendChild(input);
    this.input = input;
    input.focus({ preventScroll: true });
    if (selectText) selectAllText(input);
    else if (this.session.selection && input.firstChild) {
      const range = document.createRange();
      const length = input.firstChild.textContent.length;
      range.setStart(input.firstChild, Math.min(length, this.session.selection.start));
      range.setEnd(input.firstChild, Math.min(length, this.session.selection.end));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  rememberSelection() {
    if (!this.session || !this.input) return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!this.input.contains(range.startContainer) || !this.input.contains(range.endContainer)) return;
    const prefix = range.cloneRange();
    prefix.selectNodeContents(this.input);
    prefix.setEnd(range.startContainer, range.startOffset);
    const start = prefix.toString().length;
    this.session.selection = { start, end: start + range.toString().length };
  }

  reattach(layer, viewport) {
    if (!this.session || !layer || !viewport) return;
    if (this.input) this.session.draft = this.input.textContent || '';
    this.mount(layer, viewport, false);
  }

  prepareForRefresh() {
    if (!this.session) return;
    this.rememberSelection();
    this.refreshing = true;
  }

  commit(reason = 'commit') {
    if (!this.session || this.ending) return this.pendingCommit;
    this.ending = true;
    const session = this.session;
    if (this.input) session.draft = this.input.textContent || '';
    this.session = null;
    this.removeNodes();
    this.ending = false;
    // Serialize commits: slow font validation must not reorder document undo
    // history or let an older draft overwrite a newer one.
    this.pendingCommit = this.pendingCommit.then(() => this.onCommit && this.onCommit({ ...session, reason }));
    return this.pendingCommit;
  }

  cancel(reason = 'cancel') {
    if (!this.session || this.ending) return;
    this.ending = true;
    const session = this.session;
    this.session = null;
    this.removeNodes();
    this.ending = false;
    if (this.onCancel) this.onCancel({ ...session, reason });
  }

  removeNodes() {
    if (this.mask && this.mask.isConnected) this.mask.remove();
    if (this.input && this.input.isConnected) this.input.remove();
    this.mask = null;
    this.input = null;
  }

  destroy() {
    this.session = null;
    this.removeNodes();
  }
}
