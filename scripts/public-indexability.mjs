// Small, deterministic checks shared by the live crawl and its regression tests.
export const priorityIndexPaths = [
    '/tools/merge-pdf', '/tools/compress-pdf', '/tools/split-pdf',
    '/tools/pdf-editor', '/tools/jpg-to-pdf', '/pdf-to-jpg',
    '/tools/sign-pdf', '/tools/pdf-to-word', '/tools/word-to-pdf',
    '/tools/image-to-text'
];

export function sitemapPaths(xml, canonicalOrigin = 'https://onlinepdfpro.com') {
    if (!/<urlset(?:\s|\/?>)/.test(xml)) throw new Error('Sitemap is not a urlset');
    const locations = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map(match => match[1]);
    if (!locations.length) throw new Error('Sitemap has no URLs');
    const seen = new Set();
    for (const location of locations) {
        let url;
        try { url = new URL(location); } catch { throw new Error(`Invalid sitemap URL: ${location}`); }
        if (url.origin !== canonicalOrigin || url.username || url.password || url.search || url.hash || /\.html$/i.test(url.pathname)) {
            throw new Error(`Sitemap URL is not a final canonical URL: ${location}`);
        }
        if (seen.has(url.pathname)) throw new Error(`Duplicate sitemap URL: ${location}`);
        seen.add(url.pathname);
    }
    return [...seen];
}

export const blocksIndexing = value => /(?:^|[,\s])(?:noindex|none)(?=$|[,\s])/i.test(value || '');

export function robotsProblems(contents, canonicalOrigin = 'https://onlinepdfpro.com') {
    const lines = contents.split(/\r?\n/).map(line => line.split('#')[0].trim()).filter(Boolean);
    const issues = [];
    if (!lines.some(line => /^Sitemap:\s*/i.test(line) && line.replace(/^Sitemap:\s*/i, '') === `${canonicalOrigin}/sitemap.xml`)) {
        issues.push('robots.txt does not advertise the canonical sitemap');
    }
    let agents = [], hasRules = false;
    for (const line of lines) {
        const agent = /^User-agent:\s*(.+)$/i.exec(line);
        if (agent) {
            if (hasRules) { agents = []; hasRules = false; }
            agents.push(agent[1].trim().toLowerCase());
            continue;
        }
        const rule = /^(?:Allow|Disallow):\s*(.*)$/i.exec(line);
        if (!rule) continue;
        hasRules = true;
        if (/^Disallow:/i.test(line) && rule[1] === '/' && agents.includes('*')) {
            issues.push('robots.txt blocks all crawlers at the site root');
        }
    }
    return issues;
}
