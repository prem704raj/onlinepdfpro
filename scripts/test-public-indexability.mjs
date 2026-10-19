#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { blocksIndexing, priorityIndexPaths, robotsProblems, sitemapPaths } from './public-indexability.mjs';

test('canonical sitemap paths are unique and include the ten priority routes', () => {
    const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${priorityIndexPaths.map(path => `<url><loc>https://onlinepdfpro.com${path}</loc></url>`).join('')}</urlset>`;
    assert.deepEqual(sitemapPaths(xml), priorityIndexPaths);
    for (const replacement of ['https://other.example/tools/merge-pdf', 'https://onlinepdfpro.com/tools/merge-pdf.html', 'https://onlinepdfpro.com/tools/merge-pdf?ref=x']) {
        assert.throws(() => sitemapPaths(xml.replace('https://onlinepdfpro.com/tools/merge-pdf', replacement)), /not a final canonical/);
    }
    assert.throws(() => sitemapPaths(xml.replace('</urlset>', `<url><loc>https://onlinepdfpro.com/tools/merge-pdf</loc></url></urlset>`)), /Duplicate sitemap/);
    assert.throws(() => sitemapPaths('<urlset/>'), /no URLs/);
});

test('robots directives recognize root-wide crawler blocks and missing sitemap references', () => {
    assert.deepEqual(robotsProblems('User-agent: *\nAllow: /\nSitemap: https://onlinepdfpro.com/sitemap.xml'), []);
    assert.deepEqual(robotsProblems('User-agent: *\nDisallow: /\nSitemap: https://onlinepdfpro.com/sitemap.xml'), ['robots.txt blocks all crawlers at the site root']);
    assert.deepEqual(robotsProblems('User-agent: OtherBot\nDisallow: /\nUser-agent: *\nAllow: /'), ['robots.txt does not advertise the canonical sitemap']);
});

test('noindex and none directives are detected without matching index or follow', () => {
    for (const rule of ['noindex, follow', 'INDEX, NOINDEX', 'none']) assert.equal(blocksIndexing(rule), true, rule);
    for (const rule of ['', 'index, follow', 'max-snippet:-1']) assert.equal(blocksIndexing(rule), false, rule);
});
