#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { PDFDocument, PDFName, degrees, rgb, pushGraphicsState, popGraphicsState, concatTransformationMatrix, drawObject } from 'pdf-lib';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const fixture = path.join(root, '.tmp-pdf-output.pdf');
const pdf = await PDFDocument.create();
pdf.setTitle('Output fixture');
pdf.setAuthor('Synthetic author');
const pageOne = pdf.addPage([320, 400]);
pageOne.drawText('Searchable original text', { x: 20, y: 355, size: 14 });
const form = pdf.getForm();
const field = form.createTextField('sample');
field.setText('Filled answer');
field.addToPage(pageOne, { x: 20, y: 300, width: 200, height: 25 });
const link = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [20, 270, 120, 290], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: 'https://example.com' } }));
pageOne.node.addAnnot(link);
const pixels = Uint8Array.from({ length: 256 * 256 * 3 }, (_, i) => (i * 73 + Math.floor(i / 127)) % 256);
const image = pdf.context.register(pdf.context.stream(pixels, { Type: 'XObject', Subtype: 'Image', Width: 256, Height: 256, ColorSpace: 'DeviceRGB', BitsPerComponent: 8 }));
pageOne.node.setXObject(PDFName.of('Pattern'), image);
pageOne.pushOperators(pushGraphicsState(), concatTransformationMatrix(150, 0, 0, 150, 20, 70), drawObject('Pattern'), popGraphicsState());
const pageTwo = pdf.addPage([200, 300]);
pageTwo.drawText('Second page', { x: 20, y: 250, size: 12, color: rgb(0, 0, 1) });
pageTwo.setRotation(degrees(90));
fs.writeFileSync(fixture, await pdf.save({ useObjectStreams: false }));

const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.extname(pathname)) pathname += '.html';
    const target = path.resolve(site, `.${pathname}`);
    if (!target.startsWith(site + path.sep) || !fs.existsSync(target)) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    res.end(fs.readFileSync(target));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
    const page = await browser.newPage();
    const errors = [];
    const alerts = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.dismiss(); });
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url().startsWith(base) || /^(blob:|data:)/.test(request.url())) return request.continue();
        return request.respond({ status: 200, body: '', contentType: request.resourceType() === 'script' ? 'application/javascript' : 'text/plain' });
    });
    const textOf = async bytes => page.evaluate(async bytes => {
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
        try {
            const text = [];
            for (let n = 1; n <= doc.numPages; n++) text.push((await (await doc.getPage(n)).getTextContent()).items.map(item => item.str).join(' '));
            return text.join(' ');
        } finally { await doc.destroy(); }
    }, Array.from(bytes));
    const linksOf = document => (document.getPage(0).node.Annots()?.asArray() || []).filter(ref => document.context.lookup(ref).get(PDFName.of('Subtype')) === PDFName.of('Link')).length;
    const flattenBytes = async () => Uint8Array.from(await page.evaluate(() => Array.from(flattenedBytes)));

    await page.goto(`${base}/flatten-pdf`, { waitUntil: 'load' });
    await (await page.$('#fileInput')).uploadFile(fixture);
    await page.waitForFunction(() => document.querySelector('#optionsBox').style.display === 'block');
    assert.equal(await page.$eval('#flattenMode', el => el.value), 'forms');
    await page.click('.flatten-btn');
    await page.waitForFunction(() => document.querySelector('#resultBox').style.display === 'block');
    const flattened = await flattenBytes();
    const reopened = await PDFDocument.load(flattened, { updateMetadata: false });
    assert.equal(reopened.getPageCount(), 2);
    assert.equal(reopened.getForm().getFields().length, 0);
    assert.equal(linksOf(reopened), 1);
    assert.equal(reopened.getAuthor(), 'Synthetic author');
    assert.equal(reopened.getPage(1).getRotation().angle, 90);
    assert.match(await textOf(flattened), /Searchable original text.*Filled answer.*Second page/);
    console.log('PASS form flattening exports static filled values with searchable text, links, metadata and rotation retained');

    await page.evaluate(() => { document.querySelector('#optionsBox').style.display = 'block'; document.querySelector('#flattenMode').value = 'images'; });
    await page.click('.flatten-btn');
    assert.match(alerts.at(-1), /accept the loss/);
    await page.click('#acceptImageOutput');
    await page.click('#opt5');
    await page.click('.flatten-btn');
    await page.waitForFunction(() => document.querySelector('#resultBox').style.display === 'block');
    const imageBytes = await flattenBytes();
    const imagePdf = await PDFDocument.load(imageBytes, { updateMetadata: false });
    assert.equal(imagePdf.getPageCount(), 2);
    assert.equal(imagePdf.getForm().getFields().length, 0);
    assert.equal(linksOf(imagePdf), 0);
    assert.equal(imagePdf.getAuthor(), undefined);
    assert.equal(await textOf(imageBytes), ' ');
    assert.deepEqual(imagePdf.getPage(1).getSize(), { width: 300, height: 200 });
    const renderError = await page.evaluate(async ({ before, after }) => {
        const render = async bytes => {
            const document = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
            try {
                const source = await document.getPage(1);
                const viewport = source.getViewport({ scale: 1 });
                const canvas = window.document.createElement('canvas');
                canvas.width = viewport.width; canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                await source.render({ canvasContext: context, viewport }).promise;
                return context.getImageData(0, 0, canvas.width, canvas.height).data;
            } finally { await document.destroy(); }
        };
        const original = await render(before);
        const output = await render(after);
        let difference = 0;
        for (let i = 0; i < original.length; i++) difference += Math.abs(original[i] - output[i]);
        return difference / original.length;
    }, { before: Array.from(fs.readFileSync(fixture)), after: Array.from(imageBytes) });
    assert.ok(renderError < 10, `Image output must retain the visible page appearance (mean pixel error ${renderError})`);
    await page.evaluate(() => { document.querySelector('#optionsBox').style.display = 'block'; document.querySelector('#flattenMode').value = 'forms'; });
    await page.click('.flatten-btn');
    await page.waitForFunction(() => document.querySelector('#resultBox').style.display === 'block');
    assert.match(await textOf(await flattenBytes()), /Filled answer/);
    console.log('PASS image mode requires acknowledgement, produces image pages, and does not detach the original before a repeat export');

    await page.goto(`${base}/tools/compress-pdf`, { waitUntil: 'load' });
    await page.evaluate(() => {
        window.__output = null;
        OnlinePDFPro.Downloader.saveBlob = async blob => { window.__output = Array.from(new Uint8Array(await blob.arrayBuffer())); };
    });
    await (await page.$('#uploadZone input[type=file]')).uploadFile(fixture);
    await page.waitForFunction(() => document.querySelector('#fileSection').style.display === 'block');
    assert.equal(await page.$eval('#allowRasterization', el => el.checked), false);
    await page.$eval('#targetSizeInput', el => { el.value = '1'; });
    await page.select('#targetSizeUnit', 'KB');
    await page.click('#compressBtn');
    await page.waitForFunction(() => document.querySelector('#resultsSection').style.display === 'block');
    assert.match(await page.$eval('#resultsList', el => el.textContent), /Above target/);
    await page.click('#resultsList button');
    await page.waitForFunction(() => window.__output !== null);
    const compressed = Uint8Array.from(await page.evaluate(() => window.__output));
    const compressedPdf = await PDFDocument.load(compressed, { updateMetadata: false });
    assert.equal(compressedPdf.getForm().getTextField('sample').getText(), 'Filled answer');
    assert.equal(linksOf(compressedPdf), 1);
    assert.match(await textOf(compressed), /Searchable original text/);
    console.log('PASS default compression retains forms, links and searchable text even when the target cannot be reached');

    await page.click('#compressAnother');
    await (await page.$('#uploadZone input[type=file]')).uploadFile(fixture);
    await page.waitForFunction(() => document.querySelector('#fileSection').style.display === 'block');
    await page.click('#allowRasterization');
    await page.click('#compressBtn');
    await page.waitForFunction(() => document.querySelector('#resultsSection').style.display === 'block');
    assert.match(await page.$eval('#resultsList', el => el.textContent), /Image-based PDF/);
    await page.evaluate(() => { window.__output = null; });
    await page.click('#resultsList button');
    await page.waitForFunction(() => window.__output !== null);
    const rasterized = Uint8Array.from(await page.evaluate(() => window.__output));
    assert.equal(await textOf(rasterized), ' ');
    assert.ok(rasterized.length <= fs.statSync(fixture).size);
    assert.equal((await PDFDocument.load(rasterized)).getPageCount(), 2);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS optional image compression reports its feature loss, never returns a larger file, and preserves the page count');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.unlinkSync(fixture);
}
