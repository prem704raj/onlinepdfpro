#!/usr/bin/env node
/**
 * Regression sweep — loads every HTML page in the site and fails the run on:
 *   - console errors (JS exceptions, CSP violations, uncaught errors)
 *   - page errors (uncaught exceptions thrown on the page)
 *   - failed resource requests (DNS/connection/CSP-blocked loads)
 *   - HTTP 4xx/5xx responses for same-origin assets (broken links/scripts)
 *
 * Same-origin problems are hard failures; failures against external hosts
 * (CDNs, third-party APIs) are reported as warnings, since they depend on
 * network conditions rather than the site itself.
 *
 * Known-benign noise is filtered:
 *   - the "frame-ancestors is ignored when delivered via a <meta>" console
 *     warning (present on every page, harmless)
 *   - "Failed to load resource" console messages (they duplicate the
 *     response-status listener, which has URL context)
 *   - `/favicon.ico` 404s (browsers auto-request it; the site ships
 *     favicon-16x16.png / favicon-32x32.png instead)
 *   - `net::ERR_ABORTED` request failures (navigation teardown races, not
 *     real failures)
 *
 * Usage:
 *   node tests/sweep.js            # sweep the Eleventy build output (_site/)
 *   node tests/sweep.js --dev      # sweep the repo root (the live dev copy)
 *
 * Wire-up:
 *   npm test            -> npm run build && node tests/sweep.js
 *   npm run test:sweep  -> node tests/sweep.js
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const args = process.argv.slice(2);
const devMode = args.includes('--dev');
const SITE_ROOT = path.resolve(__dirname, '..', devMode ? '.' : '_site');

// Ad / analytics hosts are blocked via CDP Network.setBlockedURLs during the
// sweep. They never affect page functionality, but in headless Chrome they
// keep connections open forever, so `networkidle2` would time out on every
// page that loads them. We use setBlockedURLs rather than JS-level request
// interception because interception's per-request handler is flaky over many
// pages (response/requestfailed events for unrelated resources get dropped).
const BLOCKED_HOSTS = [
  'n6wxm.com',
  '5gvci.com',
  'pl29768747.effectivecpmnetwork.com',
  'pagead2.googlesyndication.com',
  'googletagmanager.com',
  'google-analytics.com',
  'clarity.ms',
  'doubleclick.net',
  'mc.yandex.ru',
  'yandex.ru',
  'adservice.google.com',
];
const BLOCK_PATTERNS = BLOCKED_HOSTS.map((h) => `*${h}*`);

function isBlockedHost(url) {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_HOSTS.some((b) => host === b || host.endsWith('.' + b));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Minimal static file server (no extra dependencies)
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.gz': 'application/gzip',
  '.pdf': 'application/pdf',
};

function startServer(root) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': data.length,
      });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

// Skipped when sweeping the repo root (--dev): node_modules, the build output
// and the Eleventy source tree (both mirrored copies of the live pages), plus
// git/tooling dirs.
const SKIP_DIRS = new Set(['node_modules', '.git', '_site', 'src', '.vscode', 'test_chrome_profile']);

function findHtmlFiles(dir, base, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      findHtmlFiles(full, base, out);
    } else if (entry.name.endsWith('.html')) {
      out.push('/' + path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Benign-noise filters
// ---------------------------------------------------------------------------

const BENIGN_CONSOLE = [
  /frame-ancestors/,
  /Failed to load resource/,
];

const BENIGN_404 = [/\/favicon\.ico(\?|$)/];

// net::ERR_ABORTED fires on requests cancelled during navigation teardown
// (e.g. the previous page's scripts) — not real failures.
const IGNORED_FAILURE_REASONS = [/net::ERR_ABORTED/];

// ---------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------

function classify(url, baseUrl) {
  try {
    return new URL(url, baseUrl).origin === new URL(baseUrl).origin ? 'local' : 'external';
  } catch {
    return 'local';
  }
}

async function sweepPage(browser, pageUrl, baseUrl) {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  const issues = [];

  // Block ad/analytics hosts so their long-lived connections can't stall the
  // page load (see BLOCKED_HOSTS above).
  try {
    const client = await page.createCDPSession();
    await client.send('Network.setBlockedURLs', { urls: BLOCK_PATTERNS });
  } catch {
    // CDP session failure shouldn't fail the sweep; worst case some ads load.
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    if (isBlockedHost(req.url())) return; // deliberate block, not a site bug
    const reason = req.failure() && req.failure().errorText;
    if (!reason || IGNORED_FAILURE_REASONS.some((re) => re.test(reason))) return;
    const kind = classify(req.url(), baseUrl);
    issues.push(`${kind === 'local' ? 'FAILED' : 'WARN'}: ${req.url()} (${reason})`);
  });
  page.on('response', (res) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    if (status === 404 && BENIGN_404.some((re) => re.test(url))) return;
    const kind = classify(url, baseUrl);
    issues.push(`${kind === 'local' ? 'HTTP' : 'HTTP-WARN'}: ${status} ${url}`);
  });

  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 20000 });
  } catch (err) {
    // A goto timeout usually means a slow/stalled external host kept
    // `networkidle2` from firing — the page itself may have loaded fine.
    // Only treat it as a hard failure if the document never rendered.
    let readyState = 'unknown';
    try {
      readyState = await page.evaluate(() => document.readyState);
    } catch {}
    if (readyState === 'complete' || readyState === 'interactive') {
      issues.push(`WARN: goto timeout (${String(err.message).split('\n')[0]}) but document ${readyState}`);
    } else {
      issues.push(`NAV: ${String(err.message).split('\n')[0]}`);
    }
  }
  // Let late console messages / requests settle before closing the page.
  await new Promise((r) => setTimeout(r, 500));
  await page.close();

  return issues.filter((issue) => !BENIGN_CONSOLE.some((re) => re.test(issue)));
}

async function main() {
  if (!fs.existsSync(path.join(SITE_ROOT, 'index.html'))) {
    console.error(`No index.html in ${SITE_ROOT} — run "npm run build" first (or pass --dev to sweep the repo root).`);
    process.exit(1);
  }

  const pages = findHtmlFiles(SITE_ROOT, SITE_ROOT);
  console.log(`Sweeping ${pages.length} pages in ${SITE_ROOT} …\n`);

  const { server, baseUrl } = await startServer(SITE_ROOT);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const failingPages = [];
  let totalIssues = 0;

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageUrl = baseUrl + pages[i];
      const issues = await sweepPage(browser, pageUrl, baseUrl);
      if (issues.length) {
        failingPages.push({ pageUrl, issues });
        totalIssues += issues.length;
      }
      if ((i + 1) % 20 === 0 || i === pages.length - 1) {
        console.log(`  … ${i + 1}/${pages.length} pages`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('');
  if (!failingPages.length) {
    console.log(`✅ PASS — ${pages.length} pages, 0 console errors, 0 failed requests, 0 broken resources.`);
    process.exit(0);
  }

  const hardFailures = failingPages.filter(({ issues }) =>
    issues.some((issue) => !issue.startsWith('WARN') && !issue.startsWith('HTTP-WARN'))
  );

  console.log(`❌ ${failingPages.length} page(s) with issues (${totalIssues} total):\n`);
  for (const { pageUrl, issues } of failingPages) {
    console.log(pageUrl.replace(baseUrl, ''));
    for (const issue of issues) console.log(`    - ${issue}`);
    console.log('');
  }

  if (hardFailures.length) {
    console.error(`Regression check FAILED: ${hardFailures.length} page(s) with console errors / broken local resources.`);
    process.exit(1);
  }
  console.log('Only external (network-dependent) warnings found — treating as pass.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
