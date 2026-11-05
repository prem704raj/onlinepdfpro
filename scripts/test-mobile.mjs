#!/usr/bin/env node
// Responsive checks run against our built site in an isolated browser.
// External providers are blocked: no customer data, AI calls or purchases.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const requireModule = createRequire(import.meta.url);
const { chromium } = requireModule('/usr/local/share/bun-global/node_modules/playwright');

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
  if (fs.existsSync(file + '.html')) file += '.html';
  else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.pdf': 'application/pdf' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const failures = [];

async function createIsolatedPage(width, height = 844, blockSw = true) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: blockSw ? 'block' : 'allow',
  });
  const page = await context.newPage();
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (new URL(url).origin === base || /^(data|blob):/.test(url)) {
      await route.continue();
    } else {
      await route.abort();
    }
  });
  return { context, page };
}

async function reachable(page, selector, minimum = 0) {
  await page.$eval(selector, el => el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' }));
  try {
    await page.waitForFunction(({ selector, min }) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 && r.width >= min && r.height >= min && (hit === el || el.contains(hit));
    }, { selector, min: minimum }, { timeout: 2500 });
    return true;
  } catch {
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
    const { context, page } = await createIsolatedPage(width, 844, true);
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const result = await page.evaluate(() => {
        const width = innerWidth;
        const clipped = [];
        const visible = el => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return false;
          for (let p = el; p; p = p.parentElement) {
            if (getComputedStyle(p).opacity === '0' || p.hidden || p.getAttribute('aria-hidden') === 'true') return false;
            if (p.matches('dialog:not([open])')) return false;
          }
          return true;
        };
        for (const el of document.querySelectorAll('body *')) {
          if (!visible(el) || el.matches('script, style, svg, svg *, canvas, iframe')) continue;
          const r = el.getBoundingClientRect();
          if (r.left >= -1 && r.right <= width + 1) continue;
          let scrollable = false;
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth) scrollable = true;
          }
          if (!scrollable) clipped.push({ node: el.tagName + (el.id ? '#' + el.id : '') + '.' + String(el.className).replaceAll(' ', '.'), left: Math.round(r.left), right: Math.round(r.right), text: el.textContent.trim().slice(0, 65) });
        }
        const heading = document.querySelector('h1');
        return {
          width,
          documentWidth: document.documentElement.scrollWidth,
          viewport: document.querySelector('meta[name="viewport"]')?.content,
          heading: heading?.getBoundingClientRect().width > 0,
          clipped: clipped.slice(0, 12)
        };
      });
      if (result.clipped.length || result.documentWidth > width + 1 || !result.viewport || !result.heading) {
        failures.push({ route, ...result });
      }
    }
    console.log(`Checked ${routes.length} pages at ${width}px`);
    await context.close();
  }));

  if (failures.length) console.log(JSON.stringify(failures, null, 2));
  if (!probe) assert.equal(failures.length, 0, 'Every public page must reflow without hiding clipped content');

  if (!probe) {
    for (const [width, height] of [[320, 740], [390, 844], [768, 1024]]) {
      const { context, page } = await createIsolatedPage(width, height, true);
      await page.goto(base + '/products/dbms-notes', { waitUntil: 'load' });
      assert.ok(await reachable(page, '#menuToggle', 36), 'Mobile menu must be reachable by touch');
      await page.tap('#menuToggle');
      assert.equal(await page.$eval('#menuToggle', el => el.getAttribute('aria-expanded')), 'true');
      assert.ok(await reachable(page, '#nav a[href="/tools"]'), 'Opened menu must expose navigation');
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval('#menuToggle', el => el.getAttribute('aria-expanded')), 'false');
      assert.ok(await reachable(page, '#viewPdfButton'), 'Chapter 1 View PDF button must be reachable on mobile');
      assert.ok(await reachable(page, '#downloadPdfButton'), 'Chapter 1 Download PDF button must be reachable on mobile');
      await context.close();
      console.log(`PASS mobile interactions ${width}×${height}: menu and 3 DBMS chapter cards`);
    }
  }
} finally {
  await browser.close();
  if (server.closeAllConnections) server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  process.exit(failures.length ? 1 : 0);
}
