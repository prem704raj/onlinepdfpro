#!/usr/bin/env node
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { parse } from 'parse5';
import { attribute, walk } from './prepare-site.mjs';

const args = process.argv.slice(2);
const release = args.includes('--release') ? args[args.indexOf('--release') + 1] : process.env.GITHUB_SHA;
assert.ok(release && release !== 'local', 'Specify an immutable production release ID');
const canonicalOrigin = 'https://onlinepdfpro.com';
const origin = process.env.SITE_BASE_URL || canonicalOrigin;
const get = url => fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) });

// Allow a short propagation window; never turn a failed check into a warning.
let current;
for (let attempt = 0; attempt < 5; attempt++) {
    try {
        const response = await get(`${origin}/release.json?check=${encodeURIComponent(release)}`);
        assert.equal(response.status, 200);
        current = await response.json();
        if (current.release === release) break;
    } catch { /* Retry release attribution, then fail with the assertion below. */ }
    if (attempt < 4) await setTimeout(3000);
}
assert.equal(current?.release, release, 'Live frontend must serve the published release');
for (const route of ['/', '/about', '/tools', '/blog', '/blog/how-to-extract-text-from-scanned-pdfs-ocr/']) {
    const response = await get(`${origin}${route}`);
    assert.equal(response.status, 200, `${route} must serve directly without redirects`);
    const html = await response.text();
    let canonical;
    let analyticsCount = 0;
    walk(parse(html), node => {
        if (node.tagName === 'link' && attribute(node, 'rel') === 'canonical') canonical = attribute(node, 'href');
        if (node.tagName === 'script' && attribute(node, 'src') === '/js/analytics.js') analyticsCount++;
    });
    assert.equal(canonical, `${canonicalOrigin}${route}`, `${route}: final canonical URL`);
    assert.equal(analyticsCount, 1, `${route}: one analytics entry point`);
}
const sitemap = await get(`${origin}/sitemap.xml`);
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
assert.ok(!/<loc>[^<]*\.html(?:[?<]|$)/.test(xml), 'Sitemap must contain final public URLs');
assert.ok(xml.includes('/blog/how-to-extract-text-from-scanned-pdfs-ocr/'), 'Published blog must be discoverable');
console.log(`PASS public frontend ${release}: canonical pages, blog, sitemap, and analytics installation`);
