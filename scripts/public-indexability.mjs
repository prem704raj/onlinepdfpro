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

export function robotsProblems(contents, canonicalOrigin = 'https://onlinepdfpro.com', sitemapRoutes = []) {
    const lines = contents.split(/\r?\n/).map(line => line.split('#')[0].trim()).filter(Boolean);
    const issues = [];
    if (!lines.some(line => /^Sitemap:\s*/i.test(line) && line.replace(/^Sitemap:\s*/i, '') === `${canonicalOrigin}/sitemap.xml`)) {
        issues.push('robots.txt does not advertise the canonical sitemap');
    }
    const groups = [];
    let agents = [], rules = [];
    const finishGroup = () => {
        if (agents.length) groups.push({ agents, rules });
        agents = [];
        rules = [];
    };
    for (const line of lines) {
        const agent = /^User-agent:\s*(.+)$/i.exec(line);
        if (agent) {
            if (rules.length) finishGroup();
            agents.push(agent[1].trim().toLowerCase());
            continue;
        }
        const rule = /^(Allow|Disallow):\s*(.*)$/i.exec(line);
        if (!rule) continue;
        if (agents.length) rules.push({ type: rule[1].toLowerCase(), path: rule[2].trim() });
    }
    finishGroup();
    // Use the longest matching path rule from the most specific agent group.
    // An equally specific Allow wins, including for wildcard and $ patterns.
    const blockedAt = (crawler, pathname) => {
        const matches = groups.map(group => ({
            ...group,
            specificity: Math.max(...group.agents.map(agent => agent === '*' ? 0 : crawler.startsWith(agent) ? agent.length : -1))
        })).filter(group => group.specificity >= 0);
        const specificity = Math.max(-1, ...matches.map(group => group.specificity));
        const pathRules = matches.filter(group => group.specificity === specificity)
            .flatMap(group => group.rules)
            .filter(rule => {
                if (!rule.path.startsWith('/')) return false;
                const anchored = rule.path.endsWith('$');
                const pattern = anchored ? rule.path.slice(0, -1) : rule.path;
                const escaped = pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
                return new RegExp(`^${escaped}${anchored ? '$' : ''}`).test(pathname);
            });
        const longest = Math.max(0, ...pathRules.map(rule => rule.path.replace(/\*|\$$/g, '').length));
        const winning = pathRules.filter(rule => rule.path.replace(/\*|\$$/g, '').length === longest);
        return winning.some(rule => rule.type === 'disallow') && !winning.some(rule => rule.type === 'allow');
    };
    const crawlers = ['googlebot', 'bingbot'];
    const blocked = crawlers.filter(crawler => blockedAt(crawler, '/'));
    if (blocked.length) issues.push(`robots.txt blocks ${blocked.join(' and ')} at the site root`);
    for (const route of new Set(sitemapRoutes)) {
        if (route === '/' || !route.startsWith('/')) continue;
        const restricted = crawlers.filter(crawler => !blocked.includes(crawler) && blockedAt(crawler, route));
        if (restricted.length) issues.push(`robots.txt blocks ${restricted.join(' and ')} at ${route}`);
    }
    return issues;
}
