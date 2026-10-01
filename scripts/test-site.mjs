#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { attribute, walk, prepareHtml, cleanPath } from './prepare-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const files = fs.readdirSync(site, { recursive: true }).filter(file => file.endsWith('.html')).map(file => file.replaceAll('\\', '/'));
const redirectLines = fs.readFileSync(path.join(root, 'src/_redirects'), 'utf8').split(/\r?\n/)
    .map(line => line.trim()).filter(line => line && !line.startsWith('#'));
const redirects = new Map(redirectLines.map(line => line.split(/\s+/).slice(0, 2)));

test('Cloudflare redirects use supported syntax and have no cycles or intermediate .html targets', () => {
    for (const line of redirectLines) {
        const [from, to, status] = line.split(/\s+/);
        assert.ok(from.startsWith('/'), `Relative source required: ${line}`);
        assert.match(status, /^(301|302|303|307|308)$/);
        assert.ok(!to.endsWith('.html'), `Final target required: ${line}`);
        const visited = new Set([from]);
        let target = to;
        while (redirects.has(target)) {
            assert.ok(!visited.has(target), `Redirect cycle at ${from}`);
            visited.add(target); target = redirects.get(target);
        }
        const file = target.endsWith('/') ? `${target}index.html` : `${target}.html`;
        assert.ok(fs.existsSync(path.join(site, file.slice(1))), `Missing redirect destination ${target}`);
    }
    assert.ok(!redirects.has('/about'), 'The final About route must serve its content');
});

test('every generated page has one canonical and analytics loader, with a consistent enforcing CSP', () => {
    const policy = fs.readFileSync(path.join(site, '_headers'), 'utf8').match(/^\s+Content-Security-Policy:\s*(.+)$/m)[1]
        .replace(/frame-ancestors[^;]*;\s*/g, '');
    for (const file of files) {
        const html = fs.readFileSync(path.join(site, file), 'utf8');
        if (/^google[0-9a-f]+\.html$/.test(file)) {
            assert.equal(html, fs.readFileSync(path.join(root, 'src', file), 'utf8'), 'Search Console verification must remain unchanged');
            continue;
        }
        const canonicals = [], loaders = [], policies = [], links = [];
        let noindex = false;
        walk(parse(html), node => {
            if (node.tagName === 'link' && attribute(node, 'rel') === 'canonical') canonicals.push(attribute(node, 'href'));
            if (node.tagName === 'script' && attribute(node, 'src') === '/js/analytics.js') loaders.push(node);
            if (node.tagName === 'meta' && attribute(node, 'http-equiv')?.toLowerCase() === 'content-security-policy') policies.push(attribute(node, 'content'));
            if (node.tagName === 'a') links.push(attribute(node, 'href'));
            if (node.tagName === 'meta' && attribute(node, 'name') === 'robots' && /noindex/.test(attribute(node, 'content') || '')) noindex = true;
        });
        const expected = redirects.get(cleanPath(file)) || cleanPath(file);
        if (!noindex || canonicals.length) {
            assert.equal(canonicals.length, 1, `${file}: one canonical`);
            assert.equal(canonicals[0], `https://onlinepdfpro.com${expected}`, file);
        }
        assert.equal(loaders.length, 1, `${file}: one analytics loader`);
        assert.deepEqual(policies, [policy], `${file}: shared CSP`);
        for (const link of links) if (link?.startsWith('/') || link?.startsWith('https://onlinepdfpro.com/')) {
            assert.ok(!/\.html(?:[?#]|$)/.test(link), `${file}: navigation still points to ${link}`);
        }
    }
});

test('the clean sitemap contains real canonical pages, all 19 preserved blog posts, and no empty product detail', () => {
    const urls = [...fs.readFileSync(path.join(site, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(!urls.some(url => url.includes('.html') || url.includes('viewstudymaterials')));
    const posts = files.filter(file => file.startsWith('blog/') && file.endsWith('/index.html'));
    assert.equal(posts.length, 19);
    for (const file of posts) assert.ok(urls.includes(`https://onlinepdfpro.com${cleanPath(file)}`), file);
    for (const url of urls) {
        const pathname = new URL(url).pathname;
        const file = pathname.endsWith('/') ? `${pathname}index.html` : `${pathname}.html`;
        assert.ok(fs.existsSync(path.join(site, file.slice(1))), `Sitemap target missing: ${url}`);
    }
});

test('HTML preparation preserves executable scripts and user-facing content while fixing URLs', () => {
    const script = '<script>const sample = "<a href=\"/tools.html\">";\nconst prices = [1, 2];</script>';
    const html = `<!doctype html><html><head><link rel="canonical" href="https://onlinepdfpro.com/about.html">${script}</head><body><a href="/tools.html?q=pdf&amp;type=image#results">Tools</a><p>A &amp; B</p></body></html>`;
    const result = prepareHtml(html, { canonicalPath: '/about', routes: new Map([['/tools.html', '/tools']]), csp: "default-src 'self'" });
    assert.ok(result.includes(script), 'Inline application code must remain byte-identical');
    assert.ok(result.includes('/tools?q=pdf&amp;type=image#results'));
    assert.ok(result.includes('<p>A &amp; B</p>'));
    assert.equal(prepareHtml(result, { canonicalPath: '/about', routes: new Map([['/tools.html', '/tools']]), csp: "default-src 'self'" }), result, 'Preparation must be idempotent');
});
