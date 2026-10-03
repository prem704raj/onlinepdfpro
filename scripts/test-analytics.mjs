#!/usr/bin/env node
// Use an isolated browser with all requests intercepted. Nothing is sent to
// Google or to the live site, even when testing the production hostname.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, '_site/index.html'), 'utf8');
const analytics = fs.readFileSync(path.join(root, 'src/js/analytics.js'), 'utf8');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
    const page = await browser.newPage();
    const googleRequests = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.hostname.includes('googletagmanager') || url.hostname.includes('google-analytics')) {
            googleRequests.push(request.url());
            return request.respond({ status: 200, contentType: 'application/javascript', body: '/* offline test */' });
        }
        if (request.isNavigationRequest()) return request.respond({ status: 200, contentType: 'text/html', body: html });
        if (url.pathname === '/js/analytics.js') return request.respond({ status: 200, contentType: 'application/javascript', body: analytics });
        if (url.pathname === '/css/analytics.css') return request.respond({ status: 200, contentType: 'text/css', body: fs.readFileSync(path.join(root, 'src/css/analytics.css'), 'utf8') });
        return request.respond({ status: 200, contentType: request.resourceType() === 'script' ? 'application/javascript' : 'text/plain', body: '' });
    });
    await page.goto('https://onlinepdfpro.com/?email=private@example.test&code=auth-secret#private-token', { waitUntil: 'load' });
    await page.waitForSelector('#analyticsConsent');
    assert.equal(googleRequests.length, 0, 'No Google measurement request before consent');
    await page.click('#analyticsConsent button:first-of-type');
    assert.equal(await page.$('#analyticsConsent'), null);
    assert.equal(googleRequests.length, 0, 'Essential-only choice cannot load analytics');
    await page.reload({ waitUntil: 'load' });
    assert.equal(await page.$('#analyticsConsent'), null, 'Consent choice persists');
    await page.click('#analyticsPreferences');
    await page.click('#analyticsConsent button:nth-of-type(2)');
    await page.waitForFunction(() => document.querySelector('script[src*="googletagmanager.com/gtag/js"]'));
    await page.evaluate(() => {
        window.gtag('event', 'tool_error', { error_code: 'invalid_file', email: 'private@example.test', file_name: 'private-medical.pdf' });
        window.gtag('event', 'export_success', { tool_name: 'pdf_editor', document_text: 'private-document-content' });
    });
    const queue = await page.evaluate(() => window.dataLayer.map(item => Array.from(item)));
    const serialized = JSON.stringify(queue);
    assert.ok(!/private@example|auth-secret|private-token|private-medical|private-document-content/.test(serialized), 'Sensitive data must be absent from event parameters');
    assert.equal(queue.filter(item => item[0] === 'event' && item[1] === 'page_view').length, 1, 'Exactly one initial pageview');
    assert.equal(queue.find(item => item[0] === 'event' && item[1] === 'page_view')[2].page_location, 'https://onlinepdfpro.com/');
    assert.ok(queue.some(item => item[1] === 'tool_error' && item[2].error_code === 'invalid_file'));
    assert.ok(queue.some(item => item[1] === 'export_success'), 'Known editor completion events are retained');
    await page.evaluate(() => { document.cookie = '_ga=test-value; path=/'; });
    await page.click('#analyticsPreferences');
    await page.click('#analyticsConsent button:first-of-type');
    assert.ok(!(await page.cookies()).some(cookie => cookie.name === '_ga'), 'Withdrawal removes the site analytics cookie');
    const count = await page.evaluate(() => window.dataLayer.length);
    await page.evaluate(() => window.gtag('event', 'tool_download', { file_name: 'another-private.pdf' }));
    assert.equal(await page.evaluate(() => window.dataLayer.length), count, 'Withdrawal stops events');
    await page.evaluate(() => localStorage.setItem('onlinepdfpro-analytics-consent-v1', 'granted'));
    const priorRequests = googleRequests.length;
    await page.goto('https://onlinepdfpro.com/login?code=another-auth-secret', { waitUntil: 'load' });
    assert.equal(googleRequests.length, priorRequests, 'Authentication pages do not load measurement even after consent');
    assert.deepEqual(errors, []);
    console.log('PASS analytics: no requests before opt-in, persistent choices, one pageview, filtered private data, withdrawal, and no auth-page measurement');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.removeItem('onlinepdfpro-analytics-consent-v1'));
    await page.goto('https://onlinepdfpro.com/', { waitUntil: 'load' });
    await page.waitForSelector('#analyticsConsent');
    const box = await page.$eval('#analyticsConsent', panel => {
        const rect = panel.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: innerWidth, height: rect.height };
    });
    assert.ok(box.left >= 0 && box.right <= box.width && box.height < 300, 'Mobile consent controls fit the viewport');
    console.log('PASS mobile privacy controls fit a 390px viewport');
} finally { await browser.close(); }
