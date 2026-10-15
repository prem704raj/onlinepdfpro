#!/usr/bin/env node
// Regression coverage for authentication visibility and clean-URL offline use.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { walk, attribute, prepareHtml } from './prepare-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = fs.readdirSync(path.join(root, '_site'), { recursive: true })
    .filter(file => file.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(file));
const tick = () => new Promise(resolve => setImmediate(resolve));

test('every served HTML document has a canonical; Sign Out is directly hidden', () => {
    let buttons = 0;
    for (const file of pages) {
        let canonicals = 0;
        walk(parse(read(`_site/${file}`)), node => {
            if (node.tagName === 'link' && attribute(node, 'rel') === 'canonical') canonicals++;
            if (attribute(node, 'id') !== 'logoutBtn') return;
            buttons++;
            assert.notEqual(attribute(node, 'hidden'), undefined, file);
            assert.match(attribute(node, 'style'), /display\s*:\s*none\s*;/, file);
        });
        assert.equal(canonicals, 1, file);
    }
    assert.ok(buttons >= 13);
});

test('all internal anchor destinations exist and avoid support aliases', () => {
    for (const file of pages) {
        walk(parse(read(`_site/${file}`)), node => {
            if (node.tagName !== 'a') return;
            const href = attribute(node, 'href');
            if (!href || href.startsWith('#')) return;
            const url = new URL(href, `https://onlinepdfpro.com/${file.replaceAll('\\', '/')}`);
            if (url.origin !== 'https://onlinepdfpro.com') return;
            assert.ok(!/^\/support(?:\.html|\/)?$/.test(url.pathname), `${file}: ${href}`);
            const target = url.pathname.endsWith('/') ? `${url.pathname}index.html` : `${url.pathname}.html`;
            assert.ok(fs.existsSync(path.join(root, '_site', target.slice(1))) ||
                fs.existsSync(path.join(root, '_site', url.pathname.slice(1))), `${file}: ${href}`);
        });
    }
});

test('preparation adds missing canonicals idempotently and cleans redirect fallbacks', () => {
    const input = '<!doctype html><html><head><meta http-equiv="refresh" content="0; url=/help.html"></head><body></body></html>';
    const options = { canonicalPath: '/login', routes: new Map([['/help.html', '/help']]), csp: "default-src 'self'" };
    const result = prepareHtml(input, options);
    assert.match(result, /rel="canonical" href="https:\/\/onlinepdfpro.com\/login"/);
    assert.match(result, /content="0; url=\/help"/);
    assert.match(result, /Content-Security-Policy/);
    assert.match(result, /\/js\/analytics.js/);
    assert.equal(prepareHtml(result, options), result);
});

test('compression placeholders are excluded from snippets while upload instructions remain eligible', () => {
    const document = parse(read('_site/tools/compress-pdf.html'));
    const ids = new Map();
    walk(document, node => { if (attribute(node, 'id')) ids.set(attribute(node, 'id'), node); });
    for (const id of ['processingSection', 'resultsSection', 'processingList', 'resultsList', 'autoClear']) {
        assert.notEqual(attribute(ids.get(id), 'data-nosnippet'), undefined, id);
    }
    assert.equal(attribute(ids.get('uploadZone'), 'data-nosnippet'), undefined);
    assert.match(read('_site/tools/compress-pdf.html'), /up to 100 MB per file, no signup/);
    assert.match(read('_site/tools/compress-pdf.html'), /approach your requested size as closely as possible without destroying readability/);
});

function authFixture() {
    const ids = ['logoutBtn', 'loggedInUser', 'userDropdown', 'userDropdownName', 'loggedInAvatar', 'loggedInInitial', 'userAvatarBtn'];
    const nodes = Object.fromEntries(ids.map(id => [id, { hidden: true, style: { display: 'none' }, addEventListener() {} }]));
    let session = null, user = null, error = null, listener, ready;
    const timers = [];
    const auth = {
        async getSession() { return { data: { session }, error }; },
        async getUser() { return { data: { user }, error }; },
        onAuthStateChange(callback) { listener = callback; return { data: { subscription: { unsubscribe() {} } } }; }
    };
    const context = vm.createContext({
        window: { location: { origin: 'https://onlinepdfpro.com' } },
        document: { readyState: 'loading', getElementById: id => nodes[id], addEventListener(event, callback) { if (event === 'DOMContentLoaded') ready = callback; } },
        supabase: { createClient: () => ({ auth }) }, URL, console,
        setTimeout: callback => timers.push(callback)
    });
    vm.runInContext(read('src/js/auth.js'), context);
    return { nodes, auth, context, ready: () => ready(), set(value, failure = null) { session = value; user = value?.user || null; error = failure; },
        event(event, value) { listener(event, value); }, async flush() { while (timers.length) timers.shift()(); await tick(); } };
}
const activeSession = () => ({ access_token: 'test-token', expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'user-1', email: 'test@example.com', user_metadata: { full_name: 'Test User' } } });

test('auth stays hidden for guests, expired sessions, and verification errors', async () => {
    for (const state of [null, { ...activeSession(), expires_at: 1 }, { ...activeSession(), expires_at: undefined }]) {
        const fixture = authFixture(); fixture.set(state); fixture.ready(); await tick();
        assert.equal(fixture.nodes.logoutBtn.hidden, true);
        assert.equal(fixture.nodes.logoutBtn.style.display, 'none');
    }
    const fixture = authFixture(); fixture.set(activeSession(), new Error('Rejected')); fixture.ready(); await tick();
    assert.equal(fixture.nodes.logoutBtn.hidden, true);
});

test('auth reveals verified sessions, follows refresh events, and hides immediately on sign-out', async () => {
    const fixture = authFixture(); fixture.ready(); await tick();
    const session = activeSession(); fixture.set(session); fixture.event('SIGNED_IN', session);
    assert.equal(fixture.nodes.logoutBtn.hidden, true, 'Remain hidden pending verification');
    await fixture.flush();
    assert.equal(fixture.nodes.logoutBtn.hidden, false);
    assert.equal(fixture.nodes.logoutBtn.style.display, 'block');
    fixture.event('TOKEN_REFRESHED', session); await fixture.flush();
    assert.equal(fixture.nodes.logoutBtn.hidden, false);
    fixture.nodes.userDropdown.style.display = 'block'; fixture.set(null); fixture.event('SIGNED_OUT', null);
    assert.equal(fixture.nodes.logoutBtn.hidden, true);
    assert.equal(fixture.nodes.loggedInUser.hidden, true);
    assert.equal(fixture.nodes.userDropdown.style.display, 'none');
});

test('a delayed getUser response cannot reveal Sign Out after the session ends', async () => {
    const fixture = authFixture(); fixture.set(activeSession());
    let finish;
    fixture.auth.getUser = () => new Promise(resolve => { finish = resolve; });
    fixture.ready(); await tick();
    fixture.set(null); fixture.event('SIGNED_OUT', null);
    finish({ data: { user: activeSession().user } }); await tick();
    assert.equal(fixture.nodes.logoutBtn.hidden, true);
});

function workerFixture() {
    const origin = 'https://onlinepdfpro.com', handlers = {}, entries = new Map();
    let offline = false;
    const key = input => new URL(typeof input === 'string' ? input : input.url, origin).pathname;
    const cache = {
        async add(input) { entries.set(key(input), new Response(`cached:${key(input)}`)); },
        async put(input, response) { entries.set(key(input), response); }
    };
    const WorkerRequest = class extends Request { constructor(input, options) { super(typeof input === "string" ? new URL(input, origin) : input, options); } };
    const context = vm.createContext({ URL, Request: WorkerRequest, Response, console, Promise,
        self: { location: { origin }, clients: { claim() {} }, skipWaiting() {}, addEventListener: (event, handler) => { handlers[event] = handler; } },
        caches: { async open() { return cache; }, async match(input) { return entries.get(key(input))?.clone(); }, async keys() { return []; }, async delete() {} },
        async fetch(request) { if (offline) throw new Error('offline'); return new Response(`network:${key(request)}`); }
    });
    vm.runInContext(read('_site/sw.js'), context);
    return { entries, context, setOffline: () => { offline = true; }, async install() { let pending; handlers.install({ waitUntil: value => { pending = value; } }); await pending; },
        async navigate(pathname) { let result; const pending = []; handlers.fetch({ request: new Request(origin + pathname, { headers: { accept: 'text/html' } }), respondWith: value => { result = value; }, waitUntil: value => pending.push(value) }); const response = await result; await Promise.all(pending); return response; } };
}

test('offline core pages share cache entries across clean, .html, query, and support aliases', async () => {
    const fixture = workerFixture(); await fixture.install(); fixture.setOffline();
    for (const pathname of ['/', '/index.html', '/about', '/about.html', '/tools', '/tools.html', '/help', '/help.html', '/support', '/support.html']) {
        const response = await fixture.navigate(pathname + '?offline=1');
        assert.equal(response.status, 200, pathname);
        assert.match(await response.text(), /^cached:/, pathname);
    }
    assert.ok(![...fixture.entries.keys()].some(key => key.endsWith('.html')));
});

test('visited tool pages are available offline through canonical and legacy URLs', async () => {
    const fixture = workerFixture(); await fixture.install();
    await fixture.navigate('/tools/compress-pdf.html?quality=80');
    await fixture.navigate('/tools/add-page-numbers.html');
    fixture.setOffline();
    for (const pathname of ['/tools/compress-pdf', '/tools/compress-pdf.html', '/tools/add-page-numbers', '/tools/add-page-numbers-to-pdf']) {
        assert.match(await (await fixture.navigate(pathname)).text(), /^network:/, pathname);
    }
    assert.equal(await (await fixture.navigate('/never-visited')).text(), 'cached:/404');
});

test('every explicit redirect has the same offline destination', () => {
    const fixture = workerFixture();
    for (const line of read('src/_redirects').split(/\r?\n/).filter(line => line.startsWith('/'))) {
        const [from, to] = line.split(/\s+/);
        const request = vm.runInContext(`pageCacheKey(new URL(${JSON.stringify(`https://onlinepdfpro.com${from}`)}))`, fixture.context);
        assert.equal(new URL(request.url).pathname, to, from);
    }
});

test('Chromium renders accessible navigation and uses the actual Service Worker offline', async () => {
    const { default: puppeteer } = await import('puppeteer');
    const redirects = new Map(read('src/_redirects').split(/\r?\n/).filter(line => line.startsWith('/'))
        .map(line => line.split(/\s+/).slice(0, 2)));
    const site = path.join(root, '_site');
    const server = http.createServer((request, response) => {
        const url = new URL(request.url, 'http://localhost');
        if (redirects.has(url.pathname)) {
            response.writeHead(301, { Location: redirects.get(url.pathname) + url.search }); response.end(); return;
        }
        let file = path.resolve(site, '.' + url.pathname);
        if (!file.startsWith(site + path.sep) && file !== site) { response.writeHead(403); response.end(); return; }
        if (fs.existsSync(file + '.html')) file += '.html';
        else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
        const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
            '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': type }); response.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
        const page = await browser.newPage();
        const origin = `http://127.0.0.1:${server.address().port}`;
        await page.setRequestInterception(true);
        page.on('request', request => request.url().startsWith(origin) || request.url().startsWith('data:') || request.url().startsWith('blob:')
            ? request.continue() : request.respond({ status: 200, contentType: 'application/javascript', body: '' }));
        await page.evaluateOnNewDocument(() => localStorage.setItem('onlinepdfpro-analytics-consent-v1', 'denied'));
        await page.goto(origin, { waitUntil: 'load' });
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.waitForFunction(() => !!navigator.serviceWorker.controller);
        assert.equal(await page.$eval('#logoutBtn', button => button.hidden && getComputedStyle(button).display === 'none'), true);
        assert.equal(await page.$eval('.hp-hero-ctas', el => getComputedStyle(el).gap), '16px');
        assert.match(await page.$eval('.hp-hero-ctas', el => el.textContent), /Explore Tools\s+Try the Examples/);
        assert.equal(await page.$eval('svg[aria-label="PRIVACY FREEDOM SIMPLICITY SECURITY TRUST"]', el =>
            [...el.querySelectorAll('text')].map(text => text.textContent).join(' ')), 'PRIVACY FREEDOM SIMPLICITY SECURITY TRUST');
        for (const width of [390, 1280]) {
            await page.setViewport({ width, height: 900 });
            await page.goto(origin + '/tools', { waitUntil: 'load' });
            assert.equal(await page.$$eval('.tp-card', cards => cards.length), 46);
            assert.equal(await page.$$eval('.tp-card', cards => cards.every(card => !!card.querySelector('h3.tp-card-name'))), true);
            assert.equal(await page.$eval('#menuToggle span', span => span.getAttribute('aria-hidden')), 'true');
            if (width === 390) {
                await page.click('#menuToggle');
                assert.equal(await page.$eval('#menuToggle', button => button.getAttribute('aria-expanded')), 'true');
                assert.equal(await page.$eval('#menuToggle span', span => span.getAttribute('aria-hidden')), 'true');
                await page.click('#menuToggle');
                assert.equal(await page.$eval('#menuToggle', button => button.getAttribute('aria-expanded')), 'false');
            }
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
        await page.goto(origin + '/tools/compress-pdf', { waitUntil: 'load' });
        await page.waitForFunction(async () => !!(await caches.match('/tools/compress-pdf')));
        await page.setOfflineMode(true);
        for (const route of ['/', '/index.html', '/tools', '/tools.html', '/help', '/support.html', '/tools/compress-pdf.html', '/tools/compress-pdf']) {
            await page.goto(origin + route, { waitUntil: 'load' });
            assert.ok(await page.$('h1'), `Offline page missing heading: ${route}`);
        }
    } finally {
        if (browser) await browser.close();
        server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    }
});
