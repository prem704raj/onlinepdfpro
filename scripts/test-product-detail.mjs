#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const require = createRequire(import.meta.url);
const nunjucks = require('nunjucks');
const products = require('../src/_data/storeProducts.js');
const reviews = require('../src/_data/productReviews.js');
const template = fs.readFileSync(path.join(root, 'src/_includes/study-detail.njk'), 'utf8');
const rendering = new nunjucks.Environment(null, { autoescape: false });
rendering.addFilter('json', JSON.stringify);
const malicious = '<img src=x onerror="window.reviewXss=true">';
const fixture = rendering.renderString(template, {
  detailProduct: products['dbms-notes'], storeProducts: products,
  productReviews: { 'dbms-notes': {
    count: 1, average: '2.0',
    expertReview: { status: 'published', name: malicious, qualifications: 'Synthetic test only', reviewedOn: '2026-09-01', scope: 'Synthetic scope', summary: malicious },
    reviews: [{ displayName: malicious, rating: 2, text: malicious, publishedOn: '2026-09-01', verifiedPurchase: false }]
  } }
});
assert.ok(!fixture.includes(malicious), 'Published review text and attribution must be escaped');
assert.match(fixture, /Reader feedback/);
assert.ok(!fixture.includes('Purchase verified'), 'Unverified feedback must not receive a purchase badge');
assert.equal(reviews['dbms-notes'].count, 0, 'No synthetic ratings belong in production review data');
assert.ok(!fs.readFileSync(path.join(site, 'products/dbms-notes.html'), 'utf8').includes('AggregateRating'), 'Empty reviews must not create rating markup');
console.log('PASS truthful review status and escaped, correctly labelled publication');

const server = http.createServer((req, res) => {
  let file = path.resolve(site, decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '') || 'index.html');
  if (!file.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) && !path.extname(file)) file += '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  const external = [];
  page.on('request', req => {
    if (req.url().startsWith(base) || /^(blob|data):/.test(req.url())) req.continue();
    else { external.push(req.url()); req.abort(); }
  });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.evaluateOnNewDocument(() => sessionStorage.setItem('pwa-dismissed', 'true'));
  for (const [width, height] of [[1280, 900], [390, 844], [320, 740], [844, 390]]) {
    await page.setViewport({ width, height, isMobile: width < 900, hasTouch: width < 900 });
    await page.goto(base + '/products/dbms-notes', { waitUntil: 'load' });
    assert.equal(await page.$eval('#productPrice', el => el.textContent), '₹9');
    assert.match(await page.$eval('#buyButton', el => el.textContent), /₹9/);
    assert.match(await page.$eval('#qualityReview', el => el.textContent), /Expert review pending/);
    assert.match(await page.$eval('.reader-reviews', el => el.textContent), /No published reviews yet/);
    if (width <= 860) {
      const order = await page.evaluate(() => {
        const intro = document.querySelector('.product-intro').getBoundingClientRect();
        const purchase = document.querySelector('.purchase-summary').getBoundingClientRect();
        const preview = document.querySelector('.preview-card').getBoundingClientRect();
        return intro.top < purchase.top && purchase.top < preview.top;
      });
      assert.ok(order, 'Phones must show the product and purchase information before the preview');
    }
    await page.click('.purchase-faq summary');
    assert.ok(await page.$eval('.purchase-faq details', el => el.open));
    await page.click('#writeReviewButton');
    await page.waitForSelector('#reviewDialog[open]');
    assert.equal(await page.$eval('#reviewForm', el => el.checkValidity()), false, 'Rating, content and publication consent are required');
    await page.type('#reviewName', 'Synthetic tester');
    await page.select('#reviewRating', '2');
    await page.type('#reviewText', 'Synthetic check: <script>window.reviewXss=true</script> The explanation needs clarification.');
    await page.click('#reviewConsent');
    const outboundBefore = external.length;
    await page.click('.review-prepare-button');
    const draft = await page.$eval('#reviewEmailLink', el => ({ href: el.href, hidden: el.hidden }));
    assert.equal(draft.hidden, false);
    const mail = new URL(draft.href);
    assert.equal(mail.protocol, 'mailto:');
    assert.equal(mail.pathname, 'support@onlinepdfpro.com');
    assert.match(mail.searchParams.get('body'), /Rating: 2\/5/);
    assert.match(mail.searchParams.get('body'), /<script>window.reviewXss=true<\/script>/);
    assert.equal(await page.evaluate(() => Boolean(window.reviewXss)), false);
    assert.equal(external.length, outboundBefore, 'Preparing a review must not send data to a provider');
    assert.match(await page.$eval('#reviewDraftStatus', el => el.textContent), /Nothing has been sent or published/);
    await page.evaluate(() => { navigator.clipboard.writeText = async value => { window.copiedReview = value; }; });
    await page.click('#reviewCopyButton');
    assert.match(await page.evaluate(() => window.copiedReview), /Product ID: dbms-notes/);
    await page.type('#reviewText', ' Updated.');
    assert.ok(await page.$eval('#reviewEmailLink', el => el.hidden), 'Editing the form must invalidate its old email draft');
    await page.click('#reviewClose');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'writeReviewButton');
    await page.evaluate(() => {
      window.buyCalls = 0;
      window.buyProduct = () => { window.buyCalls++; return new Promise(resolve => { window.finishPurchaseTest = resolve; }); };
    });
    await page.click('#buyButton');
    assert.ok(await page.$eval('#buyButton', el => el.disabled && el.getAttribute('aria-busy') === 'true'));
    await page.$eval('#buyButton', el => el.click());
    assert.equal(await page.evaluate(() => window.buyCalls), 1, 'Repeated taps while checkout opens must not start duplicate purchases');
    await page.evaluate(() => window.finishPurchaseTest());
    await page.waitForFunction(() => !document.getElementById('buyButton').disabled);
    assert.match(await page.$eval('#buyButton', el => el.textContent), /₹9/);
    await page.evaluate(() => { window.buyProduct = async () => { throw new Error('Synthetic failure'); }; });
    await page.click('#buyButton');
    await page.waitForFunction(() => document.getElementById('purchaseStatus').textContent.includes('could not open'));
    assert.equal(await page.$eval('#buyButton', el => el.disabled), false, 'Checkout failure must leave a retry available');
    if (process.env.PRODUCT_CAPTURE_DIR && (width === 1280 || width === 390)) {
      fs.mkdirSync(process.env.PRODUCT_CAPTURE_DIR, { recursive: true });
      await page.goto(base + '/products/dbms-notes', { waitUntil: 'load' });
      await page.$eval('.hp-footer', el => el.scrollIntoView());
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(process.env.PRODUCT_CAPTURE_DIR, `product-${width}.png`), fullPage: true });
    }
    console.log(`PASS product purchase/review interactions at ${width}×${height}`);
  }
  await page.goto(base + '/viewstudymaterials?product=dbms-notes', { waitUntil: 'load' });
  assert.equal(await page.$eval('#productTitle', el => el.textContent), 'DBMS Complete Notes');
  assert.ok(await page.$('#writeReviewButton'));
  await page.goto(base + '/viewstudymaterials?product=missing', { waitUntil: 'load' });
  assert.ok(await page.$eval('#detailContent', el => el.hidden));
  assert.ok(await page.$eval('#detailError', el => !el.hidden));
  assert.deepEqual(errors, [], 'Product interactions must not cause uncaught errors');
  console.log('PASS legacy product access, unavailable-product handling and no browser errors');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
