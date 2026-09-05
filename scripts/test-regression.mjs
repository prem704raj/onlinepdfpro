#!/usr/bin/env node

/**
 * High-risk regression checks for OnlinePDFPro.
 *
 * The checks intentionally combine source assertions with a small browser
 * smoke suite. They are deterministic and do not call paid/cloud providers:
 * network requests used by the QR upload test are stubbed in the browser.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

function check(condition, message) {
    assert.ok(condition, message);
    console.log(`PASS ${message}`);
}

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        cwd: root,
        encoding: 'utf8',
        shell: false,
        ...options
    });
    if (result.status !== 0) {
        const detail = `${result.stdout || ''}${result.stderr || ''}`.trim();
        throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
    }
    return result.stdout || '';
}

function filePrefix(relative, bytes) {
    const data = fs.readFileSync(path.join(root, relative));
    return bytes.every((value, index) => data[index] === value);
}

// Source-level guardrails catch regressions even when a browser is not
// available in CI.
const qr = read('src/tools/qr-code-generator.html');
check(!/\binnerHTML\s*=/.test(qr), 'QR generator does not assign innerHTML');
check(!/escapeHTML|&times;/.test(qr), 'QR generator has no legacy HTML escaping/interpolation');
check(/textContent\s*=/.test(qr) && /createElement\(/.test(qr), 'QR generator builds user-visible output with DOM APIs');
check(/tmpfiles\.org/.test(qr) && /api\.imgbb\.com/.test(qr), 'QR upload providers are present in CSP and implementation');
check(/MAX_QR_UPLOAD_SIZE\s*=\s*100\s*\*/.test(qr), 'QR uploads enforce a 100 MB limit');

const htmlToPdf = read('src/tools/html-to-pdf.html');
check(/function sanitizeHTML\s*\(/.test(htmlToPdf), 'HTML-to-PDF has an explicit sanitizer');
check(/BLOCKED_HTML_TAGS/.test(htmlToPdf) && /name\.startsWith\('on'\)/.test(htmlToPdf), 'HTML-to-PDF strips active tags and event handlers');
check(/replaceChildren\(sanitizeHTML/.test(htmlToPdf) && /appendChild\(sanitizeHTML/.test(htmlToPdf), 'HTML-to-PDF only previews/renders sanitized fragments');

const worker = read('cf-worker/pdf-api-proxy.js');
check(/TURNSTILE_SECRET_KEY/.test(worker) && /siteverify/.test(worker), 'Worker validates Turnstile server-side');
check(/CONVERSION_SIGNING_SECRET/.test(worker) && /x-conversion-token/i.test(worker), 'Conversions require a signed short-lived ticket');
check(/MODAL_API_TOKEN/.test(worker) && /temporarily unavailable/.test(worker), 'Worker fails closed when Modal authentication is not configured');
check(/API_RATE_LIMITER/.test(worker) && /\.limit\(\{ key \}\)/.test(worker), 'Worker uses the durable rate-limit binding');
check(/isValidConversionDocument/.test(worker) && /isValidConversionOutput/.test(worker), 'Worker validates conversion input and output signatures');
const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    cwd: root,
    input: worker,
    encoding: 'utf8'
});
if (syntax.status !== 0) throw new Error(`Worker syntax check failed: ${(syntax.stderr || syntax.stdout || '').trim()}`);
console.log('PASS Worker module syntax');

for (const service of ['services/pdf2docx/modal_app.py', 'services/docx2pdf/modal_app.py']) {
    const modalSource = read(service);
    check(/hmac\.compare_digest/.test(modalSource) && /MODAL_API_TOKEN/.test(modalSource), `${service} enforces the Modal bearer token`);
    check(/secrets=\[conversion_secret\]/.test(modalSource), `${service} injects the named Modal secret`);
}

const ocr = read('src/tools/image-to-text.html');
check(/cloudOcrConsent/.test(ocr) && /only when you consent|explicitly enable/i.test(ocr), 'OCR cloud fallback requires explicit consent');
check(/ocr\.space/.test(ocr) && /Tesseract/i.test(ocr), 'OCR names both local and cloud providers');
for (const page of ['src/tools/chat-with-pdf.html', 'src/tools/pdf-summarizer.html', 'src/tools/pdf-to-flashcards.html']) {
    const source = read(page);
    check(/cloudOcrConsent/.test(source) && /requireTurnstileToken/.test(source), `${page} gates cloud OCR and AI requests`);
    check(/render\(container/.test(source) && /getResponse\(turnstileWidgetId\)/.test(source) && /reset\(turnstileWidgetId\)/.test(source), `${page} explicitly manages its Turnstile widget ID`);
}
for (const page of ['src/tools/pdf-to-word.html', 'src/tools/word-to-pdf.html']) {
    const source = read(page);
    check(/render\(container/.test(source) && /reset\(turnstileWidgetId\)/.test(source), `${page} explicitly renders and resets Turnstile by widget ID`);
}
const authSource = read('src/js/auth.js');
check(/supabase|signIn|signUp/i.test(authSource) && /getSession|onAuthStateChange/.test(authSource), 'Authentication session flow is wired to Supabase');
const storeSource = read('src/js/store.js');
check(/verify-payment|verifyPayment|entitlement|my-purchases/i.test(storeSource), 'Purchase and library entitlement flow is wired to protected APIs');

const protect = read('src/tools/password-protect-pdf.html');
const unlock = read('src/tools/pdf-unlock.html');
check(/pdf-encrypt\.umd\.js/.test(protect) && /AES-256/i.test(protect), 'Password protection uses the maintained AES-256 bundle');
check(/pdf-decrypt\.umd\.js/.test(unlock) && !/html2canvas|toDataURL\(/.test(unlock), 'PDF unlock preserves structure instead of rasterizing pages');
check(exists('js/vendor/pdf-encrypt/pdf-encrypt.umd.js') && exists('js/vendor/pdf-decrypt/pdf-decrypt.umd.js'), 'PDF encryption/decryption browser bundles are vendored');

const imageConverter = read('src/tools/image-format-converter.html');
check(/canvas\.toDataURL\(['"]image\/(?:jpeg|png|webp)/.test(imageConverter), 'Image converter emits genuine Canvas formats');
check(!/value="(?:gif|bmp|ico)"/i.test(imageConverter), 'Image converter does not advertise fake GIF/BMP/ICO outputs');

const speech = read('src/speech-to-text.html');
check(/fontkit/i.test(speech) && /NotoSansDevanagari-Regular\.ttf/.test(speech), 'Speech-to-text PDF embeds a Unicode Devanagari font');
check(exists('fonts/NotoSansDevanagari-Regular.ttf'), 'Unicode font asset is present');

const registry = read('src/_data/tools.js');
check(/module\.exports/.test(registry) && /pdf-bookmark/.test(registry), 'Tool registry is the source for public tools');
check(/canonicalUrls/.test(registry) && /canonicalUrls/.test(read('src/_includes/partials/meta.njk')), 'Canonical metadata resolves tool URLs through the registry');
check(/toolRegistry\.tools/.test(read('src/sitemap.njk')) && /toolRegistry\.categories/.test(read('src/tools.njk')), 'Sitemap and directory consume the tool registry');
check(/featured:\s*true/.test(registry) && /toolRegistry\.tools/.test(read('src/index.njk')), 'Homepage featured tools consume the registry');
check(/registryTools/.test(read('src/tools.njk')) && /toolsForFile/.test(read('src/tools.njk')) && !/var toolMap/.test(read('src/tools.njk')), 'Drag-and-drop picker consumes the registry');
const appSource = read('src/js/app.js');
check(/ToolRegistryUI/.test(appSource) && /tool-registry\.json/.test(appSource) && /renderRelated/.test(appSource), 'Shared UI consumes the tool registry for navigation and related tools');
const registryHrefs = [...registry.matchAll(/href:\s*'([^']+)'/g)].map(match => match[1]);
const missingRegistryPages = registryHrefs.filter(href => !exists(href.replace(/^\//, '')));
check(registryHrefs.length >= 40 && missingRegistryPages.length === 0, `Registry pages exist (${registryHrefs.length} public tools)`);
check(new Set(registryHrefs).size === registryHrefs.length, 'Registry has no duplicate tool URLs');
if (exists('_site/tools.html')) {
    const renderedTools = read('_site/tools.html');
    const renderedSitemap = read('_site/sitemap.xml');
    const renderedRegistry = JSON.parse(read('_site/tool-registry.json'));
    check(renderedRegistry.tools.length === registryHrefs.length, 'Rendered registry JSON matches source tools');
    check(!/0 Free Tools/.test(renderedTools) && renderedTools.includes('Compress PDF'), 'Rendered directory contains registry tools');
    const sitemapUrls = [...renderedSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    const expectedToolUrls = registryHrefs.map(href => `https://onlinepdfpro.com${href}`);
    check(expectedToolUrls.every(url => sitemapUrls.includes(url)), 'Rendered sitemap contains every registry tool');
    check(new Set(sitemapUrls).size === sitemapUrls.length, 'Rendered sitemap has no duplicate URLs');
}
check(/onlinepdfpro-cache-__BUILD_ID__/.test(read('src/sw.js')) && /version-sw\.js/.test(read('package.json')), 'Service-worker cache is build-versioned');
check(/\.wrangler\//.test(read('.gitignore')), 'Wrangler runtime files are ignored');
check(exists('src/_redirects') && /about-us/.test(read('src/_redirects')), 'Legacy About URLs have redirects');
check(/note-item\.active \.note-title/.test(read('src/pdf-scratchpad.html')), 'Scratchpad updates the active note title selector');

// Cryptographic/unit checks: use the same maintained packages as the browser
// bundles and independently parse the resulting files when possible.
const { PDFDocument } = await import('pdf-lib');
const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt');
const { decryptPDF, isEncrypted } = await import('@pdfsmaller/pdf-decrypt');
const sourceDoc = await PDFDocument.create();
sourceDoc.addPage([300, 200]);
const sourcePdf = await sourceDoc.save();
const encrypted = await encryptPDF(sourcePdf, 'correct horse', { algorithm: 'AES-256', ownerPassword: 'owner password', permissions: { printing: 'highResolution', modifying: true, copying: true, annotating: true, fillingForms: true, contentAccessibility: true, documentAssembly: true } });
check(encrypted instanceof Uint8Array && new TextDecoder().decode(encrypted.slice(0, 5)) === '%PDF-', 'AES-256 encryption returns a PDF');
check((await isEncrypted(encrypted)).encrypted === true, 'Encrypted PDF is detected as encrypted');
let wrongPasswordFailed = false;
try { await decryptPDF(encrypted, 'wrong password'); } catch { wrongPasswordFailed = true; }
check(wrongPasswordFailed, 'Wrong PDF password is rejected');
const decrypted = await decryptPDF(encrypted, 'correct horse');
const parsed = await PDFDocument.load(decrypted);
check(parsed.getPageCount() === 1, 'Correct password decrypts the original page structure');

async function browserSmoke() {
    if (!exists('_site/index.html')) {
        console.log('SKIP browser smoke (run npm run build first)');
        return;
    }
    let puppeteer;
    try {
        puppeteer = (await import('puppeteer')).default;
    } catch {
        console.log('SKIP browser smoke (Puppeteer unavailable)');
        return;
    }
    const server = http.createServer((request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
        const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const target = path.resolve(root, '_site', relative);
        if (!target.startsWith(path.resolve(root, '_site') + path.sep) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
            response.writeHead(404); response.end('Not found'); return;
        }
        const ext = path.extname(target).toLowerCase();
        const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
        response.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(target).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
        const page = await browser.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(String(error)));

        await page.goto(`${base}/tools/html-to-pdf.html`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.__onlinePdfProXss = false;
            const textarea = document.querySelector('#codeArea');
            textarea.value = '<h1>Safe text</h1><img src="x" onerror="window.__onlinePdfProXss=true"><script>window.__onlinePdfProXss=true</script><a href="javascript:window.__onlinePdfProXss=true">bad</a>';
            window.showTab('preview');
        });
        const htmlResult = await page.evaluate(() => ({
            xss: window.__onlinePdfProXss,
            scripts: document.querySelectorAll('#previewArea script').length,
            handlers: Array.from(document.querySelectorAll('#previewArea *')).some(node => Array.from(node.attributes).some(attr => attr.name.startsWith('on'))),
            javascriptLinks: Array.from(document.querySelectorAll('#previewArea [href]')).some(node => /^javascript:/i.test(node.getAttribute('href') || ''))
        }));
        check(!htmlResult.xss && htmlResult.scripts === 0 && !htmlResult.handlers && !htmlResult.javascriptLinks, 'HTML-to-PDF blocks malicious scripts, handlers and javascript URLs in the browser');

        // Exercise both OCR privacy branches with a tiny fixture and browser
        // stubs. The real Tesseract/OCR.space services are deliberately not
        // contacted by CI: local OCR must finish without a network call, and
        // the cloud branch must run only after the consent checkbox is checked.
        const ocrFixture = path.join(root, '.tmp-ocr-regression.png');
        fs.writeFileSync(ocrFixture, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
        try {
            await page.goto(`${base}/tools/image-to-text.html`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                window.Tesseract = window.Tesseract || {};
                window.Tesseract.recognize = async () => ({ data: { text: 'local OCR text', confidence: 96 } });
            });
            await (await page.$('#fileInput')).uploadFile(ocrFixture);
            await page.waitForFunction(() => document.querySelector('#result')?.style.display === 'block', { timeout: 10000 });
            check(await page.$eval('#textOutput', node => node.value === 'local OCR text'), 'OCR local flow completes without cloud processing');

            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                window.Tesseract = window.Tesseract || {};
                window.Tesseract.recognize = async () => ({ data: { text: 'weak local', confidence: 10 } });
                window.__ocrCloudCalls = 0;
                const originalFetch = window.fetch.bind(window);
                window.fetch = async (url, options) => {
                    if (String(url).includes('api.ocr.space')) {
                        window.__ocrCloudCalls += 1;
                        return new Response(JSON.stringify({ ParsedResults: [{ ParsedText: 'cloud OCR text' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                    return originalFetch(url, options);
                };
            });
            await (await page.$('#fileInput')).uploadFile(ocrFixture);
            await page.waitForFunction(() => document.querySelector('#result')?.style.display === 'block', { timeout: 10000 });
            const noConsent = await page.evaluate(() => ({ calls: window.__ocrCloudCalls, text: document.querySelector('#textOutput')?.value }));
            check(noConsent.calls === 0 && noConsent.text === 'weak local', 'OCR cloud fallback is not called without consent');

            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                window.Tesseract = window.Tesseract || {};
                window.Tesseract.recognize = async () => ({ data: { text: 'weak local', confidence: 10 } });
                window.__ocrCloudCalls = 0;
                const originalFetch = window.fetch.bind(window);
                window.fetch = async (url, options) => {
                    if (String(url).includes('api.ocr.space')) {
                        window.__ocrCloudCalls += 1;
                        return new Response(JSON.stringify({ ParsedResults: [{ ParsedText: 'cloud OCR text' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                    return originalFetch(url, options);
                };
                document.querySelector('#cloudOcrConsent').checked = true;
            });
            await (await page.$('#fileInput')).uploadFile(ocrFixture);
            await page.waitForFunction(() => document.querySelector('#result')?.style.display === 'block', { timeout: 10000 });
            const withConsent = await page.evaluate(() => ({ calls: window.__ocrCloudCalls, text: document.querySelector('#textOutput')?.value }));
            check(withConsent.calls === 1 && withConsent.text === 'cloud OCR text', 'OCR cloud-consent flow sends data only after explicit consent');
        } finally {
            fs.rmSync(ocrFixture, { force: true });
        }

        await page.goto(`${base}/tools/merge-pdf.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelectorAll('[data-generated-related-tools] .related-tool-card').length === 3, { timeout: 5000 });
        check(await page.$eval('[data-generated-related-tools]', node => node.querySelector('h2')?.textContent === 'Related tools'), 'Registry renders related tools on tool pages');

        await page.goto(`${base}/tools/qr-code-generator.html`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.__onlinePdfProXss = false;
            document.querySelector('#textInput').value = '<img src=x onerror="window.__onlinePdfProXss=true">';
            return window.generateQR();
        });
        await page.waitForFunction(() => document.querySelectorAll('#qrOutput canvas').length > 0, { timeout: 10000 });
        const qrResult = await page.evaluate(() => ({
            xss: window.__onlinePdfProXss,
            labels: Array.from(document.querySelectorAll('#qrOutput .qr-label')).map(node => node.textContent)
        }));
        check(!qrResult.xss && qrResult.labels.some(label => label.includes('<img')), 'QR text payload remains text and cannot execute');

        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('tmpfiles.org')) {
                if (request.method() === 'OPTIONS') {
                    request.respond({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' } }).catch(() => {});
                } else {
                    request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ status: 'success', data: { url: 'https://tmpfiles.org/qr-test' } }) }).catch(() => {});
                }
            } else if (request.isNavigationRequest() || request.url().startsWith(base)) request.continue().catch(() => {});
            else request.abort().catch(() => {});
        });
        const switched = await page.evaluate(() => {
            try {
                window.switchTab('file');
                return { active: document.querySelector('.tab-pane.active')?.id, button: document.querySelector('.tab-btn.active')?.textContent.trim() };
            } catch (error) {
                return { error: String(error) };
            }
        });
        check(switched.active === 'tab-file', `QR file tab can be selected${switched.error ? ` (${switched.error})` : ''}`);
        const tempFile = path.join(root, '.tmp-qr-regression.txt');
        fs.writeFileSync(tempFile, 'QR regression upload');
        try {
            const input = await page.$('#fileInput');
            await input.uploadFile(tempFile);
            await page.evaluate(() => window.generateQR());
            try {
                await page.waitForFunction(() => document.querySelectorAll('#qrOutput canvas').length > 0, { timeout: 10000 });
            } catch (error) {
                const diagnostic = await page.evaluate(() => ({
                    status: document.querySelector('#statusMsg')?.textContent,
                    labels: Array.from(document.querySelectorAll('#qrOutput .qr-label')).map(node => node.textContent),
                    qrList: Array.isArray(window.State?.qrList) ? window.State.qrList.length : 'hidden',
                    fileCount: document.querySelector('#fileInput')?.files?.length
                }));
                throw new Error(`QR file smoke timed out (${JSON.stringify(diagnostic)}): ${error.message}`);
            }
            check(await page.$eval('#statusMsg', node => /ready|generated/i.test(node.textContent)), 'QR file upload workflow completes with a stubbed provider');
        } finally {
            fs.rmSync(tempFile, { force: true });
        }

        // Exercise every upload mode with the provider stub so CSP and mode
        // wiring stay covered without sending test data to a real host.
        const modeFiles = [
            { mode: 'image', selector: '#imageInput', file: '.tmp-qr-regression-image.png' },
            { mode: 'folder', selector: '#folderInput', file: '.tmp-qr-regression-folder.txt' },
            { mode: 'video', selector: '#videoInput', file: '.tmp-qr-regression-video.mp4' }
        ];
        const modePaths = [];
        try {
            for (const modeFile of modeFiles) {
                const modePath = path.join(root, modeFile.file);
                fs.writeFileSync(modePath, modeFile.mode === 'image'
                    ? Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
                    : Buffer.from(`OnlinePDFPro ${modeFile.mode} regression`));
                modePaths.push(modePath);
                await page.evaluate((mode) => window.switchTab(mode), modeFile.mode);
                if (modeFile.mode === 'folder') {
                    // Chromium does not accept a single filesystem path through
                    // uploadFile() for a webkitdirectory input. Populate the
                    // input with the same FileList shape a folder picker emits.
                    await page.evaluate(async ({ selector, name }) => {
                        const input = document.querySelector(selector);
                        const file = new File([`OnlinePDFPro folder regression`], name, { type: 'text/plain' });
                        Object.defineProperty(file, 'webkitRelativePath', { value: `regression/${name}` });
                        const transfer = new DataTransfer();
                        transfer.items.add(file);
                        input.files = transfer.files;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }, { selector: modeFile.selector, name: path.basename(modePath) });
                } else {
                    await (await page.$(modeFile.selector)).uploadFile(modePath);
                }
                await page.evaluate(() => window.generateQR());
                try {
                    await page.waitForFunction(() => document.querySelectorAll('#qrOutput canvas').length > 0, { timeout: 10000 });
                } catch (error) {
                    const diagnostic = await page.evaluate(() => ({
                        status: document.querySelector('#statusMsg')?.textContent,
                        labels: Array.from(document.querySelectorAll('#qrOutput .qr-label')).map(node => node.textContent),
                        cards: document.querySelectorAll('#qrOutput .qr-result-card').length,
                        fileCounts: Object.fromEntries(['imageInput', 'folderInput', 'videoInput'].map(id => [id, document.querySelector(`#${id}`)?.files?.length]))
                    }));
                    throw new Error(`QR ${modeFile.mode} smoke timed out (${JSON.stringify(diagnostic)}): ${error.message}`);
                }
                check(await page.$eval('#statusMsg', node => /ready|generated/i.test(node.textContent)), `QR ${modeFile.mode} upload mode completes with a stubbed provider`);
            }
        } finally {
            for (const modePath of modePaths) fs.rmSync(modePath, { force: true });
        }

        // Verify the image converter emits real bytes for each advertised format,
        // not a renamed source file or a placeholder. The browser's download
        // helper is wrapped so the Blob can be inspected without writing files.
        const tinyPng = path.join(root, '.tmp-image-regression.png');
        fs.writeFileSync(tinyPng, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
        try {
            await page.goto(`${base}/tools/image-format-converter.html`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                window.__downloadedBlob = null;
                const originalSaveBlob = OnlinePDFPro.Downloader.saveBlob;
                OnlinePDFPro.Downloader.saveBlob = (blob, name) => { window.__downloadedBlob = { blob, name }; };
                window.__restoreSaveBlob = () => { OnlinePDFPro.Downloader.saveBlob = originalSaveBlob; };
            });
            const formats = [
                { button: '[data-format="jpeg"]', signature: [0xff, 0xd8, 0xff], label: 'JPEG' },
                { button: '[data-format="png"]', signature: [0x89, 0x50, 0x4e, 0x47], label: 'PNG' },
                { button: '[data-format="webp"]', signature: [0x52, 0x49, 0x46, 0x46], label: 'WebP' }
            ];
            for (const format of formats) {
                if (format.button !== '[data-format="jpeg"]') {
                    await page.reload({ waitUntil: 'domcontentloaded' });
                    await page.evaluate(() => {
                        window.__downloadedBlob = null;
                        const originalSaveBlob = OnlinePDFPro.Downloader.saveBlob;
                        OnlinePDFPro.Downloader.saveBlob = (blob, name) => { window.__downloadedBlob = { blob, name }; };
                    });
                }
                await page.$eval('.file-input', (input, filePath) => {
                    // Puppeteer supplies the path through uploadFile; this callback
                    // exists only to make the selector failure explicit.
                    if (!input) throw new Error(`missing file input for ${filePath}`);
                }, tinyPng);
                await (await page.$('.file-input')).uploadFile(tinyPng);
                await page.waitForFunction(() => document.querySelector('#fileSection')?.style.display === 'block', { timeout: 10000 });
                await page.click(format.button);
                await page.click('#convertBtn');
                try {
                    await page.waitForFunction(() => document.querySelector('#resultsSection')?.style.display === 'block', { timeout: 10000 });
                } catch (error) {
                    const diagnostic = await page.evaluate(() => ({
                        fileSection: document.querySelector('#fileSection')?.style.display,
                        processingSection: document.querySelector('#processingSection')?.style.display,
                        resultsSection: document.querySelector('#resultsSection')?.style.display,
                        processed: document.querySelector('#processedCount')?.textContent,
                        status: Array.from(document.querySelectorAll('.status-text')).map(node => node.textContent),
                        resultCount: document.querySelectorAll('#resultsList .batch-file-item').length,
                        format: document.querySelector('.format-btn.active')?.dataset.format
                    }));
                    throw new Error(`${format.label} conversion timed out (${JSON.stringify(diagnostic)}): ${error.message}`);
                }
                await page.click('#downloadAllBtn');
                const output = await page.evaluate(async () => {
                    if (!window.__downloadedBlob) return null;
                    const bytes = new Uint8Array(await window.__downloadedBlob.blob.arrayBuffer());
                    return { name: window.__downloadedBlob.name, bytes: Array.from(bytes.slice(0, 12)) };
                });
                check(output && format.signature.every((value, index) => output.bytes[index] === value), `${format.label} converter output has the expected signature`);
                if (format.label === 'WebP') check(String.fromCharCode(...output.bytes.slice(8, 12)) === 'WEBP', 'WebP converter output contains the WEBP marker');
            }
        } finally {
            await page.evaluate(() => window.__restoreSaveBlob?.());
            fs.rmSync(tinyPng, { force: true });
        }

        // Representative desktop and mobile layouts should not introduce a
        // horizontal scroll bar or clip the primary heading at common widths.
        for (const layout of [
            { path: '/index.html', width: 390, height: 844, heading: 'h1' },
            { path: '/index.html', width: 910, height: 768, heading: 'h1' },
            { path: '/tools.html', width: 390, height: 844, heading: '.tp-hero-heading' },
            { path: '/tools.html', width: 910, height: 768, heading: '.tp-hero-heading' }
        ]) {
            await page.setViewport({ width: layout.width, height: layout.height });
            await page.goto(`${base}${layout.path}`, { waitUntil: 'domcontentloaded' });
            const layoutResult = await page.evaluate((headingSelector) => {
                const heading = document.querySelector(headingSelector);
                const rect = heading?.getBoundingClientRect();
                return {
                    viewport: window.innerWidth,
                    scrollWidth: document.documentElement.scrollWidth,
                    headingVisible: Boolean(rect && rect.width > 0 && rect.height > 0 && rect.bottom > 0),
                    headingText: heading?.textContent?.trim() || ''
                };
            }, layout.heading);
            check(layoutResult.scrollWidth <= layoutResult.viewport + 1 && layoutResult.headingVisible, `Responsive layout ${layout.path} at ${layout.width}px has no overflow and shows its heading`);
        }

        check(pageErrors.length === 0, `Browser smoke has no uncaught page errors${pageErrors.length ? `: ${pageErrors.join(' | ')}` : ''}`);
    } finally {
        // A browser page can leave an intercepted third-party request or a
        // service-worker handle open on constrained CI runners. Bound cleanup
        // so a successful regression run cannot hang the deployment job.
        const browserProcess = typeof browser.process === 'function' ? browser.process() : null;
        await Promise.race([
            browser.close(),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);
        if (browserProcess && !browserProcess.killed) browserProcess.kill();
        await Promise.race([
            new Promise(resolve => server.close(resolve)),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);
    }
}

await browserSmoke();
console.log('All regression checks passed.');
// Puppeteer and Chromium can leave non-critical handles open on Windows CI;
// all assertions are complete at this point, so terminate deterministically.
process.exit(0);
