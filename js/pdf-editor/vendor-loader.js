const pendingScripts = new Map();

function loadLocalScript(src, isReady) {
  if (isReady()) return Promise.resolve();
  if (pendingScripts.has(src)) return pendingScripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pdf-editor-vendor="' + src + '"]');
    const script = existing || document.createElement('script');
    const finish = () => {
      if (isReady()) resolve();
      else reject(new Error('The local editor dependency did not initialize: ' + src));
    };
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('The local editor dependency could not be loaded: ' + src)), { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.dataset.pdfEditorVendor = src;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    pendingScripts.delete(src);
    throw error;
  });
  pendingScripts.set(src, promise);
  return promise;
}

export async function ensureFontkit() {
  await loadLocalScript('/js/vendor/fontkit/regenerator-runtime.js', () => Boolean(window.regeneratorRuntime));
  await loadLocalScript('/js/vendor/fontkit/fontkit.umd.min.js', () => Boolean(window.fontkit));
  return window.fontkit;
}

export async function ensureTesseract() {
  await loadLocalScript('/js/vendor/tesseract/tesseract.min.js', () => Boolean(window.Tesseract && typeof window.Tesseract.recognize === 'function'));
  return window.Tesseract;
}
