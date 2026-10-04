import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const fixture = path.join(root, '.tmp-pdf-editor-fidelity.pdf');
const pdf = await PDFDocument.create();
pdf.registerFontkit(fontkit);
const font = await pdf.embedFont(fs.readFileSync(path.join(root, 'src/fonts/pdf-editor/Tinos-Regular.ttf')), { subset: false });
const sheet = pdf.addPage([612, 792]);
sheet.drawText('15% discount', { x: 72, y: 700, size: 20, font });
sheet.drawText('15% discount', { x: 72, y: 660, size: 20, font });
sheet.drawText('DEMO NAME', { x: 72, y: 600, size: 20, font });
sheet.drawText('DEPARTMENT OF', { x: 72, y: 540, size: 20, font, color: rgb(0.75, 0, 0) });
sheet.drawRectangle({ x: 60, y: 450, width: 320, height: 55, color: rgb(0.1, 0.4, 0.7) });
sheet.drawText('COLORED BACKGROUND', { x: 72, y: 470, size: 20, font, color: rgb(1, 1, 1) });
fs.writeFileSync(fixture, await pdf.save());
const tailOffset = font.widthOfTextAtSize('15%', 20);
const server = http.createServer((request, response) => {
  const filename = path.resolve(site, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!filename.startsWith(site + path.sep) || !fs.existsSync(filename)) return response.writeHead(404).end();
  response.setHeader('Content-Type', { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html' }[path.extname(filename)] || 'application/octet-stream');
  fs.createReadStream(filename).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(`http://127.0.0.1:${server.address().port}/tools/pdf-editor.html`);
  await (await page.$('#pdf-file-input')).uploadFile(fixture);
  await page.waitForSelector('.pdf-text-hit[aria-label*=discount]', { timeout: 30000 });
  const before = await page.evaluate(async () => {
    const { editorState } = await import('/js/pdf-editor/state.js');
    return editorState.objects.map(o => ({ text: o.text, key: o.sourceFontKey, family: o.sourcePreviewFont, color: o.colorHex }));
  });
  assert.ok(before.every(o => o.key && o.family.startsWith('PDFSource')));
  assert.equal(before.find(o => o.text === 'DEPARTMENT OF').color, '#BF0000');
  assert.equal(before.find(o => o.text === 'COLORED BACKGROUND').color, '#FFFFFF');
  console.log('PASS embedded font is available for direct preview/export; red and white text colors follow the original PDF');

  const hits = await page.$$('.pdf-text-hit[aria-label*=discount]');
  await hits[1].click();
  await page.waitForSelector('.pdf-inline-text-input');
  assert.match(await page.$eval('.pdf-inline-text-input', el => getComputedStyle(el).fontFamily), /PDFSource/);
  assert.equal(await page.$eval('.pdf-inline-text-mask', el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
  await page.$eval('.pdf-inline-text-input', el => { el.textContent = '20% discount'; el.dispatchEvent(new InputEvent('input', { bubbles: true })); });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => [...document.querySelectorAll('.pdf-text-preview-glyph')].some(el => el.textContent === '20% discount'));
  assert.match(await page.$eval('.pdf-text-preview-glyph', el => getComputedStyle(el).fontFamily), /PDFSource/);
  console.log('PASS changing 15 to 20 retains the source typeface and white preview background');

  await page.click('.pdf-text-hit[aria-label*="DEMO NAME"]');
  await page.waitForSelector('.pdf-inline-text-input');
  assert.equal(await page.$eval('.pdf-inline-text-mask', el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
  await page.keyboard.press('Escape');
  await page.click('.pdf-text-hit[aria-label*="COLORED BACKGROUND"]');
  await page.waitForSelector('.pdf-inline-text-input');
  const previewBlue = await page.$eval('.pdf-inline-text-mask', el => getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number));
  assert.ok(previewBlue.every((value, channel) => Math.abs(value - [26, 102, 179][channel]) <= 1));
  await page.$eval('.pdf-inline-text-input', el => { el.textContent = 'COLORED PAGE'; el.dispatchEvent(new InputEvent('input', { bubbles: true })); });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => [...document.querySelectorAll('.pdf-text-preview-glyph')].some(el => el.textContent === 'COLORED PAGE'));

  const sampling = await page.evaluate(async () => {
    const { sampleBackgroundFromCanvas } = await import('/js/pdf-editor/color-extractor.js');
    const canvas = document.createElement('canvas'); canvas.width = 220; canvas.height = 70;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, 220, 70);
    // Adjacent blue/yellow labels contaminate two perimeter samples.
    context.fillStyle = '#0000ff'; context.fillRect(15, 30, 7, 15);
    context.fillStyle = '#ffc000'; context.fillRect(178, 30, 7, 15);
    const white = sampleBackgroundFromCanvas(canvas, { left: 20, top: 25, width: 160, height: 20 });
    context.clearRect(0, 0, 220, 70);
    const transparent = sampleBackgroundFromCanvas(canvas, { left: 20, top: 25, width: 160, height: 20 });
    return { white, transparent };
  });
  assert.equal(sampling.white.hex, '#FFFFFF');
  assert.equal(sampling.white.complex, false);
  assert.equal(sampling.transparent.hex, '#FFFFFF');
  console.log('PASS neighboring glyph colors and transparent pixels cannot tint a white text background');

  const coverage = await page.evaluate(async () => {
    const { editorState } = await import('/js/pdf-editor/state.js');
    const { checkGlyphCoverage } = await import('/js/pdf-editor/font-runtime.js');
    const { getEmbeddedFont } = await import('/js/pdf-editor/embedded-fonts.js');
    const object = editorState.objects.find(o => o.text === '20% discount');
    const result = await checkGlyphCoverage(object, '20% discount 😀');
    const restyled = getEmbeddedFont({ ...object, bold: !object.bold });
    // An inaccurate UI sample must not leak into the exported PDF.
    object.background = { rgb: [255, 220, 100], hex: '#FFDC64', complex: false };
    return { supported: result.supported, unsupported: result.unsupported, restyled: Boolean(restyled) };
  });
  assert.equal(coverage.supported, false);
  assert.ok(coverage.unsupported.includes(0x1F600));
  assert.equal(coverage.restyled, false);
  await page.evaluate(() => {
    const original = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href.startsWith('blob:')) {
        window.savedPdf = fetch(this.href).then(r => r.arrayBuffer()).then(bytes => [...new Uint8Array(bytes)]); return;
      }
      return original.call(this);
    };
  });
  await page.click('#download-pdf-button');
  await page.waitForFunction(() => Boolean(window.savedPdf), { timeout: 30000 });
  const result = await page.evaluate(async tail => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await window.savedPdf) }).promise;
    const first = await doc.getPage(1);
    const text = (await first.getTextContent()).items;
    const edited = text.find(item => item.str === '20% discount');
    const original = text.find(item => item.str === '15% discount');
    const canvas = document.createElement('canvas'); const vp = first.getViewport({ scale: 2 });
    canvas.width = vp.width; canvas.height = vp.height;
    await first.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    const context = canvas.getContext('2d');
    const crop = y => context.getImageData(Math.round((72 + tail + 5) * 2), Math.round((792 - y - 24) * 2), 150, 60).data;
    const a = crop(700), b = crop(660);
    let same = 0; for (let index = 0; index < a.length; index++) if (a[index] === b[index]) same++;
    const white = [...context.getImageData(146, (792 - 660 + 2) * 2, 1, 1).data].slice(0, 3);
    const blue = [...context.getImageData(146, (792 - 470 + 2) * 2, 1, 1).data].slice(0, 3);
    await doc.destroy();
    return { same: same / a.length, size: edited.transform[0], baseline: edited.transform[5], originalSize: original.transform[0], white, blue };
  }, tailOffset);
  assert.equal(result.size, result.originalSize);
  assert.equal(result.baseline, 660);
  assert.ok(result.same > 0.99, `Unchanged discount glyphs match the original rendering: ${result.same}`);
  assert.deepEqual(result.white, [255, 255, 255]);
  assert.ok(result.blue.every((value, channel) => Math.abs(value - [26, 102, 179][channel]) <= 1));
  assert.deepEqual(errors, []);
  console.log('PASS saved PDF keeps the same discount glyphs, point size, baseline and original white/blue backgrounds');
  console.log('PASS missing source glyphs require replacement; explicit style changes do not silently reuse the wrong font');

  await (await page.$('#pdf-file-input')).uploadFile(fixture);
  await page.waitForFunction(async previous => {
    const { editorState } = await import('/js/pdf-editor/state.js');
    const object = editorState.objects.find(o => o.text === '15% discount');
    return object?.sourcePreviewFont && object.sourcePreviewFont !== previous;
  }, { timeout: 30000 }, before[0].family);
  assert.equal(await page.evaluate(previous => [...document.fonts].some(face => face.family === previous), before[0].family), false);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  // Changing emulation mode reloads the browser page. Upload again and install
  // capture in this fresh context; the previous check verifies font cleanup.
  await (await page.$('#pdf-file-input')).uploadFile(fixture);
  await page.waitForSelector('.pdf-text-hit[aria-label*=discount]', { timeout: 30000 });
  await page.evaluate(() => {
    const original = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href.startsWith('blob:')) {
        window.savedPdf = fetch(this.href).then(r => r.arrayBuffer()).then(bytes => [...new Uint8Array(bytes)]); return;
      }
      return original.call(this);
    };
  });
  const mobileHits = await page.$$('.pdf-text-hit[aria-label*=discount]');
  await mobileHits[1].tap();
  await page.waitForSelector('.pdf-inline-text-input');
  assert.match(await page.$eval('.pdf-inline-text-input', el => getComputedStyle(el).fontFamily), /PDFSource/);
  assert.equal(await page.$eval('.pdf-inline-text-mask', el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
  await page.$eval('.pdf-inline-text-input', el => { el.textContent = '20% discount'; el.dispatchEvent(new InputEvent('input', { bubbles: true })); });
  await page.evaluate(() => { window.savedPdf = null; });
  await page.tap('#download-pdf-button');
  await page.waitForFunction(() => Boolean(window.savedPdf), { timeout: 30000 });
  const mobileText = await page.evaluate(async () => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await window.savedPdf) }).promise;
    const items = (await (await doc.getPage(1)).getTextContent()).items;
    const match = items.find(item => item.str === '20% discount');
    await doc.destroy();
    return match && { size: match.transform[0], y: match.transform[5] };
  });
  assert.deepEqual(mobileText, { size: 20, y: 660 });
  assert.deepEqual(errors, []);
  console.log('PASS phone tap/edit/download retains the source font and baseline; reopening a document releases old font faces');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  fs.unlinkSync(fixture);
}
