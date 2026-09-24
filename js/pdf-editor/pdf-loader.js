const PDF_HEADER = '%PDF-';

function isPdfFile(file) {
  if (!file) return false;
  const nameLooksPdf = /\.pdf$/i.test(file.name || '');
  return file.type === 'application/pdf' || nameLooksPdf;
}

function isPasswordError(error) {
  return Boolean(error && (error.name === 'PasswordException' || /password|encrypted/i.test(error.message || '')));
}

export async function loadPdfFile(file, onPassword, onProgress = () => {}) {
  if (!isPdfFile(file)) throw new Error('Choose a PDF file to open.');
  if (!window.pdfjsLib) throw new Error('The local PDF reader did not load. Refresh the page and try again.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder('ascii').decode(bytes.subarray(0, Math.min(bytes.length, 1024)));
  if (!header.includes(PDF_HEADER)) throw new Error('This file does not look like a valid PDF.');
  if (bytes.byteLength === 0) throw new Error('This PDF is empty.');

  let password = null;
  let loadingTask = window.pdfjsLib.getDocument({
    data: bytes.slice(),
    disableAutoFetch: true,
    enableXfa: false,
    stopAtErrors: false,
    isEvalSupported: false
  });
  loadingTask.onProgress = (progress) => {
    const total = progress.total || bytes.byteLength;
    onProgress(Math.min(100, Math.round((progress.loaded / total) * 100)));
  };
  loadingTask.onPassword = async (updatePassword, reason) => {
    if (typeof onPassword !== 'function') {
      loadingTask.destroy();
      return;
    }
    try {
      password = await onPassword(reason);
      if (!password) {
        loadingTask.destroy();
        return;
      }
      updatePassword(password);
    } catch (error) {
      loadingTask.destroy();
    }
  };

  try {
    const pdfDocument = await loadingTask.promise;
    return { bytes, pdfDocument, password };
  } catch (error) {
    loadingTask.destroy();
    if (isPasswordError(error)) {
      const passwordError = new Error('This PDF is password protected or encrypted. Enter the password to open it, or unlock it locally first.');
      passwordError.code = 'PDF_PASSWORD';
      throw passwordError;
    }
    if (error && /Invalid PDF|Missing PDF|FormatError/i.test(error.message || '')) {
      throw new Error('PDF.js could not read this file. It may be damaged or use an unsupported PDF feature.');
    }
    throw new Error((error && error.message) || 'The PDF could not be opened. Try a different file.');
  }
}
