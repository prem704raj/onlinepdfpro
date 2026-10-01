#!/usr/bin/env node
// Synthetic PDFs and intercepted providers: no paid inference, OCR uploads,
// real verification tokens, customer data or production requests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import puppeteer from 'puppeteer';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const longFixture = path.join(root, '.tmp-ai-long.pdf');
const scannedFixture = path.join(root, '.tmp-ai-scanned.pdf');
const long = await PDFDocument.create();
for (let n = 1; n <= 20; n++) {
    const page = long.addPage([600, 780]);
    for (let line = 0; line < 15; line++) page.drawText(`Page ${n} line ${line}: ` + 'Synthetic document words for scope testing. '.repeat(3), { x: 20, y: 740 - line * 30, size: 7 });
}
fs.writeFileSync(longFixture, await long.save());
const scanned = await PDFDocument.create();
for (let n = 0; n < 7; n++) scanned.addPage([200, 250]);
fs.writeFileSync(scannedFixture, await scanned.save());
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
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
    const requests = [];
    const errors = [];
    let ocrCalls = 0;
    let failAi = true;
    const cors = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Turnstile-Token' };
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url().startsWith(base) || /^(blob:|data:)/.test(request.url())) return request.continue();
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers: cors });
        if (request.url().includes('api.ocr.space')) {
            ocrCalls++;
            return request.respond({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ ParsedResults: [{ ParsedText: 'Synthetic scanned text. '.repeat(30) }] }) });
        }
        if (request.url().includes('/ai/')) {
            requests.push({ url: request.url(), body: JSON.parse(request.postData()) });
            return request.respond({ status: failAi ? 429 : 200, headers: cors, contentType: 'application/json', body: JSON.stringify(failAi ? { error: 'Request quota reached. Try later.' } : { choices: [{ message: { content: 'Synthetic answer from the supplied portion.' } }] }) });
        }
        return request.respond({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : 'text/plain', body: '' });
    });
    const token = () => page.evaluate(() => window.onTurnstileSuccess('synthetic-fixture-token'));
    await page.goto(`${base}/tools/pdf-summarizer.html`, { waitUntil: 'load' });
    await token();
    await (await page.$('#fileInput')).uploadFile(longFixture);
    await page.waitForFunction(() => document.querySelector('#loadingText').textContent.includes('Request quota reached'));
    const summaryRequest = requests.at(-1).body;
    assert.equal(summaryRequest.messages[1].content.replace(/^DOCUMENT:\n/, '').length, 25000);
    assert.match(await page.$eval('#documentScope', el => el.textContent), /of 20 pages.*truncated/);
    assert.match(summaryRequest.messages[0].content, /only the supplied document portion/);
    assert.equal(await page.$eval('#uploadZone', el => el.style.display), 'block');
    assert.equal(await page.$eval('#loadingState .spinner', el => el.style.display), 'none');
    failAi = false;
    await token();
    await (await page.$('#fileInput')).uploadFile(longFixture);
    await page.waitForFunction(() => document.querySelector('#summaryResult').style.display === 'block');
    assert.match(await page.$eval('#summaryContent', el => el.textContent), /Synthetic answer/);
    console.log('PASS summarizer bounds supplied text, reports partial coverage, displays string errors and supports retry');

    await page.goto(`${base}/tools/chat-with-pdf.html`, { waitUntil: 'load' });
    assert.ok(await page.$eval('#cloudOcrConsent', el => Boolean(el.getBoundingClientRect().height)), 'OCR choice is visible before upload');
    await (await page.$('#fileInput')).uploadFile(scannedFixture);
    await page.waitForFunction(() => document.querySelector('#loadingText').textContent.includes('Enable the optional OCR.space consent'));
    assert.equal(ocrCalls, 0);
    await page.click('#cloudOcrConsent');
    await (await page.$('#fileInput')).uploadFile(scannedFixture);
    await page.waitForFunction(() => document.querySelector('#chatContainer').style.display === 'flex');
    assert.equal(ocrCalls, 5);
    assert.match(await page.$eval('#documentScope', el => el.textContent), /first 5 of 7 pages.*first 3 captured pages/);
    console.log('PASS scanned chat requires visible opt-in before OCR and reports its five-of-seven-page scope');

    const send = async question => {
        await token();
        await page.type('#chatInput', question);
        const count = requests.length;
        await page.click('#sendBtn');
        await page.waitForFunction(() => !document.querySelector('#sendBtn').disabled);
        assert.equal(requests.length, count + 1);
        return requests.at(-1).body;
    };
    await send('What is the first topic?');
    const followup = await send('Explain that answer.');
    assert.ok(followup.messages.some(message => message.role === 'user' && message.content === 'What is the first topic?'));
    assert.ok(followup.messages.some(message => message.role === 'assistant' && message.content.includes('Synthetic answer')));
    failAi = true;
    const vision = await send('Describe the diagram on page 7.');
    const images = vision.messages.at(-1).content.filter(part => part.type === 'image_url');
    assert.equal(images.length, 3);
    assert.match(vision.messages[0].content, /partial document/);
    assert.match(await page.$eval('#chatMessages', el => el.textContent), /Request quota reached.*no text fallback/);
    failAi = false;
    for (let n = 0; n < 4; n++) await send(`Follow-up ${n}`);
    assert.ok(requests.at(-1).body.messages.length <= 8, 'Conversation context is bounded to three previous turns');
    assert.deepEqual(errors, []);
    console.log('PASS chat includes bounded prior turns, limits vision pages and reports provider errors without a hidden fallback request');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.unlinkSync(longFixture);
    fs.unlinkSync(scannedFixture);
}
