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
  }

  get active() {
    return Boolean(this.session);
  }

  get activeObjectId() {
    return this.session ? this.session.objectId : null;
  }

  start(object, layer, viewport) {
    if (!object || !layer || !viewport) return false;
    if (this.session && this.session.objectId !== object.id) this.commit('switch');
    this.session = {
      objectId: object.id,
      page: object.page,
      draft: object.text,
      originalText: object.text
    };
    this.mount(layer, viewport, true);
    return true;
  }

  mount(layer, viewport, selectText = false) {
    if (!this.session) return;
    const object = this.getObject(this.session.objectId);
    if (!object) {
      this.cancel('missing-object');
      return;
    }
    this.removeNodes();

    if (object.type !== 'new-text') {
      const source = {
        ...object,
        x: object.originalX,
        y: object.originalY,
        width: object.originalWidth || object.width,
        height: object.originalHeight || object.height,
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
    input.addEventListener('blur', () => {
      if (!this.ending && this.session) this.commit('blur');
    });
    layer.appendChild(input);
    this.input = input;
    input.focus({ preventScroll: true });
    if (selectText) selectAllText(input);
  }

  reattach(layer, viewport) {
    if (!this.session || !layer || !viewport) return;
    this.mount(layer, viewport, false);
  }

  commit(reason = 'commit') {
    if (!this.session || this.ending) return;
    this.ending = true;
    const session = this.session;
    if (this.input) session.draft = this.input.textContent || '';
    this.session = null;
    this.removeNodes();
    this.ending = false;
    if (this.onCommit) this.onCommit({ ...session, reason });
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
