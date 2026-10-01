#!/usr/bin/env node
// Eleventy copies standalone tools as well as rendering Nunjucks templates.
// Apply shared production metadata to BOTH kinds of page, using parsed HTML
// locations so document scripts, styles, and tool markup remain byte-identical.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'parse5';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://onlinepdfpro.com';
export const cleanPath = relative => {
    const url = `/${relative.replaceAll('\\', '/')}`;
    if (url === '/index.html') return '/';
    return url.endsWith('/index.html') ? url.slice(0, -10) : url.replace(/\.html$/, '');
};
export function walk(node, visit) {
    visit(node);
    for (const child of node.childNodes || []) walk(child, visit);
    if (node.content) walk(node.content, visit);
}
export const attribute = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

export function prepareHtml(html, { canonicalPath, routes, aliases = new Map(), csp }) {
    const document = parse(html, { sourceCodeLocationInfo: true });
    const edits = [];
    const change = (node, name, value) => {
        const location = node.sourceCodeLocation?.attrs?.[name];
        if (location && attribute(node, name) !== value) edits.push({ start: location.startOffset, end: location.endOffset,
            text: `${name}="${escapeAttribute(value)}"` });
    };
    const normalizeUrl = value => {
        if (!value || value.startsWith('#')) return value;
        let parsed;
        try { parsed = new URL(value, `${origin}${canonicalPath}`); } catch { return value; }
        if (parsed.origin !== origin) return value;
        const target = aliases.get(parsed.pathname) || routes.get(parsed.pathname);
        if (!target) return value;
        const suffix = parsed.search + parsed.hash;
        return value.startsWith('https://') ? `${origin}${target}${suffix}` : `${target}${suffix}`;
    };
    let hasCsp = false;
    let hasAnalytics = false;
    let head;
    walk(document, node => {
        if (node.tagName === 'head') head = node;
        if (node.tagName === 'script' && attribute(node, 'src')?.startsWith('/js/analytics.js')) hasAnalytics = true;
        if (node.tagName === 'script') {
            const source = attribute(node, 'src') || '';
            const isSupabase = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2(?:\.|$)/.test(source);
            if (isSupabase) change(node, 'src', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1');
            if ((isSupabase || /^\/js\/auth\.js(?:\?|$)/.test(source)) && attribute(node, 'defer') === undefined) {
                const location = node.sourceCodeLocation?.startTag;
                if (location) edits.push({ start: location.endOffset - 1, end: location.endOffset - 1, text: ' defer' });
            }
        }
        if (node.tagName === 'a' || node.tagName === 'link') {
            const href = attribute(node, 'href');
            if (href) change(node, 'href', normalizeUrl(href));
        }
        if (node.tagName === 'meta') {
            const key = attribute(node, 'property') || attribute(node, 'name');
            if (key === 'robots' && canonicalPath === '/history') change(node, 'content', 'noindex, follow');
            if (key === 'og:url' || key === 'twitter:url') change(node, 'content', `${origin}${canonicalPath}`);
            if ((attribute(node, 'http-equiv') || '').toLowerCase() === 'content-security-policy') {
                hasCsp = true;
                if (csp) change(node, 'content', csp);
            }
        }
        if (node.tagName === 'link' && attribute(node, 'rel') === 'canonical') {
            // Legacy alias pages identify their replacement, not themselves.
            change(node, 'href', `${origin}${aliases.get(canonicalPath) || canonicalPath}`);
        }
        if (node.tagName === 'script' && attribute(node, 'type') === 'application/ld+json') {
            const textNode = node.childNodes?.[0];
            if (!textNode?.value) return;
            let data;
            try { data = JSON.parse(textNode.value); } catch { throw new Error(`Invalid JSON-LD on ${canonicalPath}`); }
            const normalizeData = value => {
                if (typeof value === 'string') return value.startsWith(origin) ? normalizeUrl(value) : value;
                if (Array.isArray(value)) return value.map(normalizeData);
                if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeData(item)]));
                return value;
            };
            const normalized = normalizeData(data);
            if (JSON.stringify(normalized) !== JSON.stringify(data)) {
                const location = textNode.sourceCodeLocation;
                edits.push({ start: location.startOffset, end: location.endOffset,
                    text: JSON.stringify(normalized).replaceAll('<', '\\u003c') });
            }
        }
    });
    if (!hasCsp && csp && head?.sourceCodeLocation?.endTag) {
        const at = head.sourceCodeLocation.endTag.startOffset;
        edits.push({ start: at, end: at, text: `<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(csp)}">` });
    }
    if (!hasAnalytics && head?.sourceCodeLocation?.endTag) {
        const at = head.sourceCodeLocation.endTag.startOffset;
        const markup = '<link rel="stylesheet" href="/css/analytics.css"><script defer src="/js/analytics.js"></script>';
        const existing = edits.find(edit => edit.start === at && edit.end === at);
        if (existing) existing.text += markup;
        else edits.push({ start: at, end: at, text: markup });
    }
    // One attribute may be touched first as a URL and then as its canonical.
    const unique = new Map(edits.map(edit => [`${edit.start}:${edit.end}`, edit]));
    for (const edit of [...unique.values()].sort((a, b) => b.start - a.start)) html = html.slice(0, edit.start) + edit.text + html.slice(edit.end);
    return html;
}

export async function prepareSite() {
    const site = path.join(root, '_site');
    const files = [];
    const collect = async (directory, prefix = '') => {
        for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
            const relative = path.posix.join(prefix, entry.name);
            if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative);
            else if (entry.name.endsWith('.html')) files.push(relative);
        }
    };
    await collect(site);
    const routes = new Map();
    for (const file of files) {
        const target = cleanPath(file);
        routes.set(`/${file}`, target);
        routes.set(target, target);
    }
    const aliases = new Map();
    for (const line of (await fs.readFile(path.join(site, '_redirects'), 'utf8')).split(/\r?\n/)) {
        const [from, to, status] = line.trim().split(/\s+/);
        if (from?.startsWith('/') && to?.startsWith('/') && /^301!?$/.test(status || '')) aliases.set(from, to);
    }
    const headers = await fs.readFile(path.join(site, '_headers'), 'utf8');
    const policy = headers.match(/^\s+Content-Security-Policy:\s*(.+)$/m)?.[1];
    if (!policy) throw new Error('A shared enforcing CSP is required in src/_headers');
    // frame-ancestors is header-only; browsers ignore it in a meta policy.
    const csp = policy.replace(/frame-ancestors[^;]*;\s*/g, '');
    for (const file of files) {
        const full = path.join(site, file);
        const before = await fs.readFile(full, 'utf8');
        const after = prepareHtml(before, { canonicalPath: cleanPath(file), routes, aliases, csp });
        await fs.writeFile(full, after);
    }
    const feed = path.join(site, 'feed.xml');
    await fs.writeFile(feed, (await fs.readFile(feed, 'utf8')).replaceAll(`${origin}/blog.html`, `${origin}/blog`));
    console.log(`Prepared canonical navigation, shared CSP, and opt-in analytics for ${files.length} HTML pages.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepareSite();
