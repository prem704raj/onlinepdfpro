#!/usr/bin/env node
import assert from 'node:assert/strict';
import { waitForSiteRelease } from './wait-for-site-release.mjs';
import { parse } from 'parse5';
import { attribute, walk } from './prepare-site.mjs';

const args = process.argv.slice(2);
const release = args.includes('--release') ? args[args.indexOf('--release') + 1] : process.env.GITHUB_SHA;
assert.ok(release && release !== 'local', 'Specify an immutable production release ID');
const canonicalOrigin = 'https://onlinepdfpro.com';
const origin = process.env.SITE_BASE_URL || canonicalOrigin;
const get = url => fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000), headers: { 'Cache-Control': 'no-cache' } });

// Allow a short propagation window; never turn a failed check into a warning.
await waitForSiteRelease({ origin, release, get });
for (const route of ['/', '/about', '/tools', '/blog', '/blog/how-to-extract-text-from-scanned-pdfs-ocr/', '/guides', '/guides/merge-and-split-an-assignment/', '/guides/choose-a-pdf-compression-mode/', '/guides/turn-note-images-into-a-readable-pdf/', '/products/dbms-notes']) {
    const response = await get(`${origin}${route}`);
    assert.equal(response.status, 200, `${route} must serve directly without redirects`);
    const html = await response.text();
    let canonical;
    let analyticsCount = 0;
    let publisherCount = 0;
    walk(parse(html), node => {
        if (node.tagName === 'link' && attribute(node, 'rel') === 'canonical') canonical = attribute(node, 'href');
        if (node.tagName === 'script' && attribute(node, 'src') === '/js/analytics.js') analyticsCount++;
        if (node.tagName === 'meta' && attribute(node, 'name') === 'google-adsense-account' && attribute(node, 'content') === 'ca-pub-3541372477756449') publisherCount++;
    });
    assert.equal(canonical, `${canonicalOrigin}${route}`, `${route}: final canonical URL`);
    assert.equal(analyticsCount, 1, `${route}: one analytics entry point`);
    assert.equal(publisherCount, 1, `${route}: publisher ownership`);
}
const sitemap = await get(`${origin}/sitemap.xml`);
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
assert.ok(!/<loc>[^<]*\.html(?:[?<]|$)/.test(xml), 'Sitemap must contain final public URLs');
assert.ok(xml.includes('/blog/how-to-extract-text-from-scanned-pdfs-ocr/'), 'Published blog must be discoverable');
assert.ok(xml.includes('/guides/turn-note-images-into-a-readable-pdf/'), 'Original guides must be discoverable');
for (const [route, type] of [['/ads.txt', 'text/plain'], ['/assets/examples/sample-assignment.pdf', 'application/pdf'], ['/assets/examples/notes-page.jpg', 'image/jpeg'], ['/assets/examples/checklist-page.jpg', 'image/jpeg']]) {
    const response = await get(`${origin}${route}`);
    assert.equal(response.status, 200, `${route}: published example or publisher file`);
    assert.ok((response.headers.get('content-type') || '').includes(type), `${route}: correct content type`);
    if (route === '/ads.txt') assert.ok((await response.text()).split(/\r?\n/).some(line => line.trim() === 'google.com, pub-3541372477756449, DIRECT, f08c47fec0942fa0'));
}
console.log(`PASS public frontend ${release}: canonical pages, blog, sitemap, and analytics installation`);
