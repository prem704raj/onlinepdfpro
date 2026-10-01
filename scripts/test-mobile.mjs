#!/usr/bin/env node
// Responsive checks run against our built site in an isolated browser.
// External providers are blocked: no customer data, AI calls or purchases.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const probe = process.argv.includes('--probe');
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? htmlFiles(path.join(dir, entry.name)) : entry.name.endsWith('.html') ? [path.join(dir, entry.name)] : []);
}
const routes = htmlFiles(site).filter(file => !/google[\w]+\.html$/.test(file) && !/<meta[^>]+http-equiv=["']refresh/i.test(fs.readFileSync(file, 'utf8'))).map(file => '/' + path.relative(site, file).replaceAll('\\', '/'));
const server = http.createServer((req, res) => {
  let relative = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '') || 'index.html';
  let file = path.resolve(site, relative);
  if (!file.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) && !path.extname(file)) file += '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const failures = [];
async function isolate(page) {
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  page.on('request', req => new URL(req.url()).origin === base || /^(data|blob):/.test(req.url()) ? req.continue() : req.abort());
}
async function reachable(page, selector, minimum = 0) {
  await page.$eval(selector, el => el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' }));
  try { await page.waitForFunction((selector, min) => {
    const el = document.querySelector(selector);
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 && r.width >= min && r.height >= min && (hit === el || el.contains(hit));
  }, { timeout: 2500 }, selector, minimum); return true; }
  catch {
    console.log('Unreachable control', selector, await page.$eval(selector, el => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { x: r.x, y: r.y, width: r.width, height: r.height, hit: hit?.tagName + '.' + hit?.className };
    }));
    return false;
  }
}
try {
  await Promise.all((process.argv.includes('--interactions') ? [] : probe ? [320] : [320, 390, 768]).map(async width => {
    const page = await browser.newPage();
    await isolate(page);
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'load' });
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const result = await page.evaluate(() => {
        const width = innerWidth;
        const clipped = [];
        const visible = el => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return false;
          for (let p = el; p; p = p.parentElement) {
            if (getComputedStyle(p).opacity === '0' || p.hidden || p.getAttribute('aria-hidden') === 'true') return false;
            if (p.matches('.cart-drawer:not(.open), .profile-dropdown[hidden], dialog:not([open])')) return false;
          }
          return true;
        };
        for (const el of document.querySelectorAll('body *')) {
          if (!visible(el) || el.matches('script, style, svg, svg *, canvas, iframe')) continue;
          const r = el.getBoundingClientRect();
          if (r.left >= -1 && r.right <= width + 1) continue;
          // Genuine horizontally scrollable regions, such as PDF canvases and
          // editor toolbars, may scroll locally. Hidden overflow is not a pass.
          let scrollable = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth) scrollable = true;
          }
          if (!scrollable) clipped.push({ node: el.tagName + (el.id ? '#' + el.id : '') + '.' + String(el.className).replaceAll(' ', '.'), left: Math.round(r.left), right: Math.round(r.right), text: el.textContent.trim().slice(0, 65) });
        }
        const heading = document.querySelector('h1');
        return { width, documentWidth: document.documentElement.scrollWidth, viewport: document.querySelector('meta[name="viewport"]')?.content,
          heading: heading?.getBoundingClientRect().width > 0, clipped: clipped.slice(0, 12) };
      });
      if (result.clipped.length || result.documentWidth > width + 1 || !result.viewport || !result.heading) failures.push({ route, ...result });
    }
    console.log(`Checked ${routes.length} pages at ${width}px`);
    await page.close();
  }));
  if (failures.length) console.log(JSON.stringify(failures, null, 2));
  if (!probe) assert.equal(failures.length, 0, 'Every public page must reflow without hiding clipped content');
  if (!probe) {
    const page = await browser.newPage();
    await isolate(page);
    for (const [width, height] of [[320, 740], [390, 844], [768, 1024], [844, 390]]) {
      await page.setViewport({ width, height, isMobile: true, hasTouch: true });
      await page.goto(base + '/products/dbms-notes', { waitUntil: 'load' });
      if (width <= 768) {
        assert.ok(await reachable(page, '#menuToggle', 44), 'Mobile menu must be reachable by touch');
        await page.tap('#menuToggle');
        assert.equal(await page.$eval('#menuToggle', el => el.getAttribute('aria-expanded')), 'true');
        assert.ok(await reachable(page, '#nav a[href="/tools"]'), 'Opened menu must expose navigation');
        await page.keyboard.press('Escape');
        assert.equal(await page.$eval('#menuToggle', el => el.getAttribute('aria-expanded')), 'false');
        // Render the real signed-in header using only a synthetic local user.
        await page.evaluate(async () => {
          window.getCurrentUser = async () => ({ email: 'mobile-test@example.invalid', user_metadata: { full_name: 'Mobile test' } });
          await initializeStoreProfile();
        });
        assert.ok(await reachable(page, '#profileTrigger', 44), 'Signed-in account button must fit on a small phone');
        assert.ok(await reachable(page, '#menuToggle', 44), 'Signed-in header must retain a reachable menu');
      }
      await page.tap('#previewGrid .preview-thumb');
      assert.ok(await reachable(page, '#dialogClose', 44), 'Preview close control must be reachable');
      assert.ok(await reachable(page, '#dialogNext', 44), 'Preview navigation must be reachable');
      await page.tap('#dialogNext');
      assert.match(await page.$eval('#dialogPage', el => el.textContent), /Page 2 of 5/);
      await page.tap('#dialogClose');
      await page.tap('#addCartButton');
      assert.ok(await page.$eval('#cartDrawer', el => Math.abs(el.getBoundingClientRect().height - innerHeight) <= 1), 'Cart must fill the available viewport');
      assert.ok(await reachable(page, '.cart-close', 44), 'Cart close must stay above the page header');
      assert.ok(await reachable(page, '.cart-checkout-btn'), 'Checkout must remain reachable in portrait and landscape');
      assert.ok(await page.$eval('#main', el => el.inert), 'Open cart must prevent interaction with the background');
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => document.getElementById('cartDrawer').contains(document.activeElement)), 'Keyboard focus must stay within cart');
      if (width === 390 && process.env.MOBILE_CAPTURE_DIR) {
        fs.mkdirSync(process.env.MOBILE_CAPTURE_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.MOBILE_CAPTURE_DIR, 'mobile-cart-390.png') });
      }
      await page.keyboard.press('Escape');
      assert.ok(await page.$eval('#cartDrawer', el => el.inert && el.getAttribute('aria-hidden') === 'true'));
      assert.equal(await page.$eval('#main', el => el.inert), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'addCartButton', 'Closing cart returns focus to the opener');
      await page.goto(base + '/tools/pdf-editor', { waitUntil: 'load' });
      assert.equal(await page.$eval('.pdf-editor-heading', el => getComputedStyle(el).position), 'static', 'Tool heading must not cover the site header');
      await page.tap('#pdf-editor-sample-button');
      await page.waitForSelector('.pdf-text-hit', { visible: true, timeout: 20000 });
      assert.ok(await reachable(page, '#download-pdf-button', width <= 620 ? 44 : 0), 'Loaded editor must expose download');
      assert.ok(await reachable(page, '#properties-drawer-button', width <= 620 ? 44 : 0), 'Text settings must be reachable through the editor toolbar');
      await page.tap('#properties-drawer-button');
      assert.ok(await reachable(page, '#close-properties-button', width <= 620 ? 44 : 0), 'Opened text settings must have a reachable close button');
      await page.tap('#close-properties-button');
      assert.ok(await reachable(page, '#pages-drawer-button', width <= 620 ? 44 : 0));
      await page.tap('#pages-drawer-button');
      await page.waitForFunction(() => document.querySelector('#pdf-pages-panel').classList.contains('is-open'), { timeout: 3000 });
      await page.tap('#pages-drawer-button');
      if (width === 390 && process.env.MOBILE_CAPTURE_DIR) {
        await page.$eval('#pdf-editor-workspace', el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await page.screenshot({ path: path.join(process.env.MOBILE_CAPTURE_DIR, 'mobile-editor-390.png') });
      }
      assert.ok(await reachable(page, '.pdf-text-hit'), 'Sample PDF text remains selectable on mobile');
      await page.tap('.pdf-text-hit');
      assert.ok(await reachable(page, '#context-edit-button', width <= 620 ? 44 : 0), 'Selected text must expose a single-tap edit action');
      await page.tap('#context-edit-button');
      await page.waitForSelector('.pdf-inline-text-input', { visible: true, timeout: 10000 });
      await page.keyboard.type('Mobile revision');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => [...document.querySelectorAll('.pdf-text-hit')].some(el => el.getAttribute('aria-label').includes('Mobile revision')), { timeout: 10000 });
      assert.equal(await page.$eval('#download-pdf-button', el => el.disabled), false, 'Editing through the touch action enables export');
      assert.ok(await reachable(page, '#context-more-button'), 'Context toolbar actions must remain reachable');
      await page.tap('#context-more-button');
      assert.ok(await reachable(page, '#context-font-size-input'), 'Advanced text settings must remain reachable');
      await page.keyboard.press('Escape');
      assert.ok(await reachable(page, '#zoom-in-button'));
      await page.tap('#zoom-in-button');
      await page.waitForFunction(() => {
        const shell = document.querySelector('.pdf-page-shell');
        const canvas = shell.querySelector('.pdf-page-canvas');
        const layer = shell.querySelector('.pdf-text-layer');
        return Boolean(layer.querySelector('.pdf-text-hit')) && Math.abs(canvas.getBoundingClientRect().width - layer.getBoundingClientRect().width) <= 1;
      }, { timeout: 10000 });
      assert.ok(await page.$eval('.pdf-text-hit', el => getComputedStyle(el).minHeight !== '44px'), 'Document text hit areas must follow PDF geometry rather than button touch sizing');
      console.log(`PASS mobile interactions ${width}×${height}: menu, signed-in header, preview, cart, loaded PDF editor`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
