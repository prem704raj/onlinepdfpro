#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, StandardFonts, decodePDFRawStream, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(root, '_site');
const fixturePath = path.join(root, '.tmp-pdf-editor-regression.pdf');
const captureDir = process.env.PDF_EDITOR_CAPTURE_DIR
  ? path.resolve(root, process.env.PDF_EDITOR_CAPTURE_DIR)
  : null;

function pass(message) {
  console.log(`PASS ${message}`);
}

function check(condition, message) {
  assert.ok(condition, message);
  pass(message);
}

async function captureScreenshot(page, filename) {
  if (!captureDir) return;
  fs.mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, filename), fullPage: false });
}

async function createFixture() {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const page = pdf.addPage([612, 792]);
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const arimoBytes = fs.readFileSync(path.join(root, 'src/fonts/pdf-editor/Arimo-Regular.ttf'));
  const arimoSubset = await pdf.embedFont(arimoBytes, { subset: true });
  const wordBold = await pdf.embedFont(fs.readFileSync(path.join(root, 'src/fonts/pdf-editor/Tinos-Bold.ttf')), { subset: true });
  page.drawText('COMPUTER SCIENCE & ENGINEERING', { x: 72, y: 745, size: 14, font: wordBold });
  page.drawText('25BCS12194', { x: 380, y: 700, size: 10, font: helvetica });

  page.drawText('usable', { x: 72, y: 700, size: 18, font: helvetica, color: rgb(0.12, 0.12, 0.12) });
  page.drawText('PREM RAJ', { x: 72, y: 650, size: 18, font: helveticaBold, color: rgb(0.05, 0.05, 0.05) });
  page.drawText('subsetword', { x: 72, y: 600, size: 18, font: arimoSubset, color: rgb(0.1, 0.1, 0.1) });

  for (let index = 0; index < 12; index += 1) {
    page.drawRectangle({
      x: 64 + index * 20,
      y: 525,
      width: 20,
      height: 34,
      color: index % 2 ? rgb(0.16, 0.48, 0.72) : rgb(0.95, 0.72, 0.22)
    });
  }
  page.drawText('complex', { x: 78, y: 535, size: 18, font: helvetica, color: rgb(1, 1, 1) });
  page.drawText('rotated', { x: 315, y: 460, size: 16, font: helvetica, rotate: degrees(25), color: rgb(0.2, 0.2, 0.2) });

  await pdf.flush();
  pdf.context.lookup(wordBold.ref, PDFDict).set(PDFName.of('BaseFont'), PDFName.of('ABCDEF+TimesNewRomanPS-BoldMT'));
  fs.writeFileSync(fixturePath, await pdf.save({ useObjectStreams: false }));
}

function contentType(filename) {
  const extension = path.extname(filename).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.pdf': 'application/pdf',
    '.ttf': 'font/ttf',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp'
  }[extension] || 'application/octet-stream';
}

async function createServer() {
  const server = http.createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (!relative) relative = 'index.html';
      let filename = path.resolve(siteRoot, relative);
      if (!filename.startsWith(path.resolve(siteRoot))) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      if (fs.existsSync(filename) && fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
      if (!fs.existsSync(filename)) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, { 'Content-Type': contentType(filename), 'Cache-Control': 'no-store' });
      fs.createReadStream(filename).pipe(response);
    } catch (error) {
      response.writeHead(500).end('Server error');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

async function setInlineText(page, value) {
  await page.waitForSelector('.pdf-inline-text-input', { visible: true, timeout: 10000 });
  await page.$eval('.pdf-inline-text-input', (element, text) => {
    element.focus();
    element.textContent = text;
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  }, value);
}

async function beginEdit(page, text) {
  const selector = `.pdf-text-hit[aria-label*="${text}"]`;
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.click(selector);
  await page.waitForSelector('.pdf-inline-text-input', { visible: true, timeout: 10000 });
}

async function commitEdit(page, originalText, replacementText, captureName = '') {
  await beginEdit(page, originalText);
  await setInlineText(page, replacementText);
  check(await page.$eval('.pdf-inline-text-input', (element, value) => element.textContent === value, replacementText), `${originalText} updates directly on the PDF page while typing`);
  if (captureName) await captureScreenshot(page, captureName);
  await page.keyboard.press('Enter');
  await page.waitForFunction((text) => Array.from(document.querySelectorAll('.pdf-text-hit')).some((node) => node.getAttribute('aria-label')?.includes(text)), { timeout: 15000 }, replacementText);
}

async function installDownloadCapture(page) {
  await page.evaluate(() => {
    if (window.__pdfEditorDownloadCaptureInstalled) return;
    window.__pdfEditorDownloadCaptureInstalled = true;
    window.__pdfEditorDownloadedBytes = null;
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function capturePdfDownload() {
      if (this.download && this.href && this.href.startsWith('blob:')) {
        window.__pdfEditorDownloadedBytes = fetch(this.href)
          .then((response) => response.arrayBuffer())
          .then((buffer) => Array.from(new Uint8Array(buffer)));
        return;
      }
      return originalClick.call(this);
    };
  });
}

async function downloadBytes(page) {
  await page.evaluate(() => { window.__pdfEditorDownloadedBytes = null; });
  await page.click('#download-pdf-button');
  await page.waitForFunction(() => Boolean(window.__pdfEditorDownloadedBytes), { timeout: 30000 });
  const bytes = await page.evaluate(async () => window.__pdfEditorDownloadedBytes);
  check(Array.isArray(bytes) && bytes.length > 500, 'Edited PDF download contains PDF bytes');
  return Uint8Array.from(bytes);
}

async function extractWithPdfJs(page, bytes) {
  return page.evaluate(async (values) => {
    const task = window.pdfjsLib.getDocument({ data: new Uint8Array(values) });
    const documentProxy = await task.promise;
    const pdfPage = await documentProxy.getPage(1);
    const content = await pdfPage.getTextContent();
    const items = content.items.map((item) => ({ str: item.str, transform: item.transform, fontName: item.fontName }));
    const fontBold = {};
    for (const item of content.items) {
      try {
        const font = pdfPage.commonObjs.get(item.fontName);
        fontBold[item.str] = Boolean(font && font.bold);
      } catch (error) {}
    }
    await documentProxy.destroy();
    return { text: items.map((item) => item.str).join(' '), items, fontBold };
  }, Array.from(bytes));
}

function trueReplacementUsesBaseFont(pdfDocument, pageIndex, text, baseFontName) {
  const page = pdfDocument.getPage(pageIndex);
  const resources = page.node.Resources();
  const fonts = resources && resources.lookupMaybe(PDFName.of('Font'), PDFDict);
  if (!fonts) return false;
  const matchingResources = fonts.keys().filter((key) => {
    const font = fonts.lookupMaybe(key, PDFDict);
    const baseFont = font && font.lookupMaybe(PDFName.of('BaseFont'), PDFName);
    return baseFont && baseFont.asString().replace(/^\//, '').replace(/^[A-Z]{6}\+/, '') === baseFontName;
  }).map((key) => key.asString());
  if (!matchingResources.length) return false;

  const contents = page.node.Contents();
  const streams = contents instanceof PDFArray
    ? Array.from({ length: contents.size() }, (_, index) => pdfDocument.context.lookup(contents.get(index)))
    : [contents];
  const asciiHex = Array.from(Buffer.from(text, 'latin1'), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return streams.some((stream) => {
    if (!(stream instanceof PDFRawStream)) return false;
    const source = Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1');
    const hasText = source.includes('(' + text + ')') || source.toUpperCase().includes('<' + asciiHex + '>');
    return hasText && matchingResources.some((resource) => source.includes(resource + ' 18 Tf'));
  });
}

async function run() {
  check(fs.existsSync(path.join(siteRoot, 'tools/pdf-editor.html')), 'Built PDF editor exists');
  check(fs.existsSync(path.join(siteRoot, 'fonts/pdf-editor/Arimo-Regular.ttf')), 'Bundled editor fonts are present in the built site');
  const redirectRules = fs.readFileSync(path.join(root, 'src/_redirects'), 'utf8');
  const editorHtml = fs.readFileSync(path.join(siteRoot, 'tools/pdf-editor.html'), 'utf8');
  check(/<link[^>]*href="https:\/\/onlinepdfpro.com\/tools\/pdf-editor"[^>]*rel="canonical"/.test(editorHtml) && !/^\/tools\/pdf-editor\s+\/tools\/pdf-editor\.html/m.test(redirectRules), 'PDF editor uses the clean canonical URL without a redirect back to .html');
  const editorSource = fs.readFileSync(path.join(root, 'src/js/pdf-editor/editor.js'), 'utf8');
  check(editorSource.includes("trackEditorEvent('export_failure')"), 'PDF editor records privacy-safe export failure events');
  await createFixture();
  const server = await createServer();
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  try {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${base}/tools/pdf-editor.html`, { waitUntil: 'domcontentloaded' });
    check(!await page.$('script[src*="tesseract"]'), 'Tesseract is not eagerly loaded for normal PDFs');
    check(!await page.$('script[src*="fontkit"]'), 'Fontkit is not eagerly loaded before custom-font work');
    check(Boolean(await page.$('#pdf-editor-sample-button')), 'PDF editor exposes a local sample PDF entry point');
    await page.click('#pdf-editor-sample-button');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.pdf-text-hit')).some((node) => node.getAttribute('aria-label')?.includes('1234')), { timeout: 20000 });
    pass('Sample PDF opens locally and exposes editable existing text');

    await page.goto(`${base}/tools/pdf-editor.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.OnlinePDFPro?.Analytics?.track), { timeout: 10000 });
    await page.evaluate(() => {
      window.__pdfEditorAnalytics = [];
      window.OnlinePDFPro.Analytics.track = (name, params = {}) => window.__pdfEditorAnalytics.push({ name, params });
    });

    await (await page.$('#pdf-file-input')).uploadFile(fixturePath);
    await page.waitForSelector('#pdf-editor-workspace:not([hidden])', { timeout: 20000 });
    await page.waitForSelector('.pdf-text-hit', { visible: true, timeout: 20000 });
    check(await page.evaluate(() => window.__pdfEditorAnalytics.some((event) => event.name === 'editor_open_success')), 'Editor open success is tracked without document data');
    await installDownloadCapture(page);
    await captureScreenshot(page, '01-before-existing-text.png');

    const fontCases = await page.evaluate(async () => {
      const { createFontDescriptor } = await import('/js/pdf-editor/font-resolver.js');
      return ['ABCDEF+TimesNewRomanPSMT', 'TimesNewRomanPS-BoldMT', 'TimesNewRomanPS-ItalicMT', 'TimesNewRomanPS-BoldItalicMT'].map(pdfFontName => createFontDescriptor({ pdfFontName }));
    });
    check(fontCases.every(font => font.detectedFamily === 'Times New Roman' && font.previewFont.family === 'Tinos' && font.matchQuality === 'matched'), 'Word Times PostScript font names retain a matched serif family in all four styles');
    check(fontCases[1].bold && fontCases[2].italic && fontCases[3].bold && fontCases[3].italic, 'Word PostScript bold and italic styles remain correctly detected');
    const exportedFontCases = await page.evaluate(async () => {
      const { createFontDescriptor } = await import('/js/pdf-editor/font-resolver.js');
      return ['Tinos-Bold-9750', 'Tinos-Italic-12', 'Tinos-BoldItalic-500', 'Tinos-Regular-42'].map(pdfFontName => createFontDescriptor({ pdfFontName }));
    });
    check(exportedFontCases.every(font => font.detectedFamily === 'Tinos' && font.previewFont.family === 'Tinos'), 'Generated font suffixes retain the matched serif when an exported PDF is reopened');
    const headingSelector = '.pdf-text-hit[aria-label*="COMPUTER SCIENCE"]';
    const headingBefore = await page.$eval(headingSelector, node => ({ top: node.getBoundingClientRect().top, left: node.getBoundingClientRect().left }));
    await page.click(headingSelector);
    await page.waitForSelector('.pdf-inline-text-input', { visible: true });
    check(await page.$eval('.pdf-inline-text-input', node => node.textContent === 'COMPUTER SCIENCE & ENGINEERING'), 'One click opens the complete source heading instead of an estimated word box');
    check(await page.$eval('.pdf-inline-text-input', node => getComputedStyle(node).fontFamily.includes('Tinos') && getComputedStyle(node).fontWeight === '700'), 'Embedded Word-style heading uses the matched bold serif in the actual editing input');
    const headingAfter = await page.$eval(headingSelector, node => ({ top: node.getBoundingClientRect().top, left: node.getBoundingClientRect().left }));
    check(Math.abs(headingBefore.top - headingAfter.top) < 1 && Math.abs(headingBefore.left - headingAfter.left) < 1, 'Opening formatting controls does not shift the clicked heading');
    check(await page.$eval('body > .header', node => getComputedStyle(node).display === 'none'), 'Site navigation cannot cover a loaded editor');
    await page.keyboard.press('End');
    for (let index = 0; index < 'ENGINEERING'.length; index += 1) await page.keyboard.press('Backspace');
    await page.keyboard.type('PROGRAMMING');
    check(await page.$eval('.pdf-inline-text-input', node => node.textContent === 'COMPUTER SCIENCE & PROGRAMMING'), 'Caret editing replaces the final word while preserving the rest of the heading');
    // Download while the input is still focused: no separate Enter/Apply step.
    const headingExport = await downloadBytes(page);
    const headingText = await extractWithPdfJs(page, headingExport);
    check(headingText.text.includes('COMPUTER SCIENCE & PROGRAMMING'), 'Download waits for the latest focused draft and embedded-font validation');
    const savedHeading = headingText.items.find(item => item.str === 'COMPUTER SCIENCE & PROGRAMMING');
    check(savedHeading && Math.abs(Math.hypot(savedHeading.transform[0], savedHeading.transform[1]) - 14) < 0.1 && Math.abs(savedHeading.transform[4] - 72) < 0.1 && Math.abs(savedHeading.transform[5] - 745) < 0.1, 'Embedded-font fallback exports at the original 14pt size and baseline, never the 24pt library default');
    await captureScreenshot(page, '07-word-heading-after-edit.png');

    await beginEdit(page, 'COMPUTER SCIENCE');
    await page.keyboard.press('Escape');
    const moveBefore = await page.$eval(headingSelector, node => ({ x: node.getBoundingClientRect().left, y: node.getBoundingClientRect().top }));
    await page.click('#context-move-button');
    await page.mouse.move(moveBefore.x + 10, moveBefore.y + 5);
    await page.mouse.down();
    await page.mouse.move(moveBefore.x + 11, moveBefore.y + 6);
    await page.mouse.up();
    const afterJitter = await page.$eval(headingSelector, node => ({ x: node.getBoundingClientRect().left, y: node.getBoundingClientRect().top }));
    check(Math.abs(afterJitter.x - moveBefore.x) < 1 && Math.abs(afterJitter.y - moveBefore.y) < 1, 'Small pointer jitter does not move selected PDF text');
    await page.mouse.move(moveBefore.x + 10, moveBefore.y + 5);
    await page.mouse.down();
    await page.mouse.move(moveBefore.x + 50, moveBefore.y + 25, { steps: 5 });
    await page.mouse.up();
    const movedHeading = await page.$eval(headingSelector, node => node.getBoundingClientRect().left);
    check(Math.abs(movedHeading - moveBefore.x - 40) < 1, 'Explicit Move action drags a heading without changing its content');
    await page.click('#undo-button');
    await page.waitForFunction((left) => Math.abs(document.querySelector('.pdf-text-hit[aria-label*="COMPUTER SCIENCE"]').getBoundingClientRect().left - left) < 1, {}, moveBefore.x);
    await page.click('#context-move-button');

    await beginEdit(page, '25BCS12194');
    await setInlineText(page, '25BCS12172');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.pdf-text-hit[aria-label*="25BCS12172"]');
    const uidBefore = await page.$eval('.pdf-text-hit[aria-label*="25BCS12172"]', node => node.getBoundingClientRect().width);
    await page.$eval('#context-font-size-input', node => { node.value = '20'; node.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForFunction(() => document.querySelector('.pdf-text-preview-glyph') && [...document.querySelectorAll('.pdf-text-preview-glyph')].some(node => node.textContent === '25BCS12172' && parseFloat(getComputedStyle(node).fontSize) > 20));
    check(await page.$eval('.pdf-text-hit[aria-label*="25BCS12172"]', node => node.getBoundingClientRect().width) > uidBefore * 1.5, 'Changing font size updates the actual page preview and selection geometry');
    check(await page.evaluate(() => {
      const glyph = [...document.querySelectorAll('.pdf-text-preview-glyph')].find(node => node.textContent === '25BCS12172');
      return glyph && parseFloat(glyph.previousElementSibling.style.height) < parseFloat(glyph.style.fontSize) * 0.75;
    }), 'Resizing replacement text keeps the original-text mask at its original size');
    await page.click('#undo-button');

    await commitEdit(page, 'usable', 'used', '02-inline-usable-to-used.png');
    check(await page.$eval('#pdf-text-context-toolbar', (node) => !node.hidden), 'Selecting existing text opens the compact contextual toolbar');
    check(await page.evaluate(() => window.__pdfEditorAnalytics.some((event) => event.name === 'existing_text_selected') && window.__pdfEditorAnalytics.some((event) => event.name === 'inline_edit_started')), 'Existing-text selection and inline editing emit product-only analytics events');

    await page.click('#undo-button');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.pdf-text-hit')).some((node) => node.getAttribute('aria-label')?.includes('usable')), { timeout: 10000 });
    pass('One undo restores the complete inline edit session');
    await page.click('#redo-button');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.pdf-text-hit')).some((node) => node.getAttribute('aria-label')?.includes('used')), { timeout: 10000 });
    pass('Redo reapplies the complete inline edit session');

    await beginEdit(page, 'used');
    await setInlineText(page, 'caret');
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(() => window.dispatchEvent(new Event('pdf-editor:state-restored')));
    await page.keyboard.type('X');
    check(await page.$eval('.pdf-inline-text-input', node => node.textContent === 'careXt'), 'Refreshing the page text layer preserves both the active draft and caret position');
    await setInlineText(page, 'discarded');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.pdf-inline-text-input') && Array.from(document.querySelectorAll('.pdf-text-hit')).some((node) => node.getAttribute('aria-label')?.includes('used')), { timeout: 10000 });
    check(!await page.$('.pdf-text-hit[aria-label*="discarded"]'), 'Escape cancels inline editing without mutating the PDF text object');

    await page.click('.pdf-text-hit[aria-label*="PREM"]');
    check(await page.$eval('#context-bold-button', (node) => node.getAttribute('aria-pressed') === 'true'), 'Bold source styling is detected automatically');
    check(Math.abs(Number(await page.$eval('#context-font-size-input', (node) => node.value)) - 18) < 0.2, 'Source font size is inherited automatically');
    await commitEdit(page, 'PREM', 'AMRIT RAJ', '03-bold-prem-to-amrit.png');
    check(await page.evaluate(() => Array.from(document.querySelectorAll('.pdf-text-preview-glyph')).some((node) => node.textContent === 'AMRIT RAJ' && getComputedStyle(node).fontWeight >= 700)), 'Bold styling remains on the replacement preview');

    await beginEdit(page, 'subsetword');
    await setInlineText(page, 'नमस्ते');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#pdf-font-replacement-dialog[open]', { timeout: 15000 });
    await captureScreenshot(page, '04-font-replacement-dialog.png');
    check(await page.evaluate(() => window.__pdfEditorAnalytics.some((event) => event.name === 'font_replacement_shown')), 'Font replacement prompt emits a product-only analytics event');
    check(await page.$eval('#pdf-font-replacement-select', (node) => node.value === 'Noto Sans Devanagari'), 'Unsupported subset-font glyphs automatically open a suggested font replacement');
    await page.click('#pdf-font-replacement-dialog button[type="submit"]');
    await page.waitForFunction(() => !document.querySelector('#pdf-font-replacement-dialog')?.open, { timeout: 15000 });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.pdf-text-hit')).some((node) => node.getAttribute('aria-label')?.includes('नमस्ते')), { timeout: 15000 });
    check(Boolean(await page.$('script[src*="fontkit"]')), 'Fontkit is lazy-loaded only when custom glyph coverage is required');
    check(!await page.$('script[src*="tesseract"]'), 'OCR remains unloaded after normal and custom-font editing');

    await commitEdit(page, 'complex', 'changed', '05-complex-background-inline-edit.png');
    const firstExport = await downloadBytes(page);
    const analyticsSnapshot = await page.evaluate(() => window.__pdfEditorAnalytics);
    check(analyticsSnapshot.some((event) => event.name === 'export_success'), 'Successful export emits a product-only analytics event');
    check(analyticsSnapshot.every((event) => Object.keys(event.params || {}).every((key) => key === 'tool_name')), 'PDF editor analytics never include filename, PDF text, or document metadata');
    const reopened = await PDFDocument.load(firstExport);
    check(reopened.getPageCount() === 1, 'Exported PDF reopens with pdf-lib');
    const firstText = await extractWithPdfJs(page, firstExport);
    check(firstText.text.includes('used') && !firstText.text.includes('usable'), 'True replacement removes the old usable run from extracted PDF text');
    check(firstText.text.includes('AMRIT') && !firstText.text.includes('PREM'), 'True replacement removes the old bold PREM run from extracted PDF text');
    check(firstText.text.includes('changed') && !firstText.text.includes('complex'), 'True replacement preserves a complex page background by replacing the text operator');
    check(firstText.text.includes('नमस्ते'), 'Fallback overlay text remains extractable after export');
    check((await page.$eval('#pdf-export-notice', node => node.textContent)).includes('Original text or image data may remain recoverable'), 'Overlay fallback warns that original document data may remain recoverable');
    check(trueReplacementUsesBaseFont(reopened, 0, 'AMRIT RAJ', 'Helvetica-Bold'), 'The true-replaced AMRIT text retains the bold source font resource');
    check(firstText.text.includes('25BCS12172'), 'UID edits preserve the typed replacement through later document edits');

    await page.click('.pdf-text-hit[aria-label*="used"]');
    await page.click('#context-more-button');
    await page.$eval('#context-opacity-input', (input) => {
      input.value = '0.5';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.pdf-text-preview-glyph')).some((node) => node.textContent === 'used' && Number(getComputedStyle(node).opacity) === 0.5), { timeout: 10000 });
    const opacityLayers = await page.evaluate(() => {
      const glyph = Array.from(document.querySelectorAll('.pdf-text-preview-glyph')).find((node) => node.textContent === 'used');
      const mask = glyph && Array.from(glyph.parentNode.children).find((node) => node.classList.contains('pdf-text-preview-mask'));
      return { glyph: glyph ? Number(getComputedStyle(glyph).opacity) : null, mask: mask ? Number(getComputedStyle(mask).opacity) : null };
    });
    check(opacityLayers.glyph === 0.5 && opacityLayers.mask === 1, '50% text opacity never makes the original-text mask translucent');
    await captureScreenshot(page, '06-opacity-50-percent-mask-opaque.png');

    await page.$eval('#context-letter-spacing-input', (input) => {
      input.value = '1';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => [...document.querySelectorAll('.pdf-text-preview-glyph')].some(node => node.textContent === 'used' && parseFloat(node.style.letterSpacing) > 0));

    const zoomBefore = await page.$eval('#zoom-level', (node) => node.textContent);
    await page.click('#zoom-in-button');
    await page.click('#zoom-in-button');
    await page.waitForFunction((before) => document.querySelector('#zoom-level')?.textContent !== before, {}, zoomBefore);
    const secondExport = await downloadBytes(page);
    const secondText = await extractWithPdfJs(page, secondExport);
    const usedItems = secondText.items.filter((item) => item.str === 'used');
    check(usedItems.some((item) => Math.abs(item.transform[4] - 72) < 0.5 && Math.abs(item.transform[5] - 700) < 0.5), 'Internal zoom does not change exported PDF text coordinates');
    check(usedItems.some(item => Math.abs(Math.hypot(item.transform[0], item.transform[1]) - 18) < 0.1), 'Styled overlay export preserves its 18pt size after zoom and opacity changes');
    const spacedPdf = await PDFDocument.load(secondExport);
    const spacedContents = spacedPdf.getPage(0).node.Contents();
    const spacedStreams = spacedContents instanceof PDFArray ? spacedContents.asArray().map(ref => spacedPdf.context.lookup(ref)) : [spacedPdf.context.lookup(spacedContents)];
    check(spacedStreams.some(stream => stream instanceof PDFRawStream && /\b1 Tc\b/.test(new TextDecoder().decode(decodePDFRawStream(stream).decode()))), 'Letter spacing is written to the PDF text state instead of an ignored drawText option');

    const rotated = await page.$('.pdf-text-hit[aria-label*="rotated"]');
    check(Boolean(rotated), 'Rotated PDF text remains selectable');
    check(errors.length === 0, `PDF editor browser regression has no uncaught errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(fixturePath, { force: true });
  }
}

await run();
console.log('All PDF editor regression checks passed.');
