#!/usr/bin/env node
/**
 * Write the exact source revision into the generated site. Deployments use
 * GITHUB_SHA; local builds use an explicit RELEASE_ID or the literal `local`.
 * Keeping the local value honest avoids publishing a stale commit hash from a
 * generated checkout while still letting production builds be compared during
 * a post-deploy smoke test.
 */
const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', '_site');
if (!fs.existsSync(siteDir)) {
    console.error('Cannot write release metadata: run the Eleventy build first.');
    process.exit(1);
}

const release = process.env.RELEASE_ID || process.env.GITHUB_SHA || 'local';
if (!/^[A-Za-z0-9._-]{1,128}$/.test(release)) {
    console.error('RELEASE_ID contains unsupported characters.');
    process.exit(1);
}

fs.writeFileSync(
    path.join(siteDir, 'release.json'),
    `${JSON.stringify({ release }, null, 2)}\n`,
    'utf8'
);
console.log(`Wrote _site/release.json for ${release}.`);
