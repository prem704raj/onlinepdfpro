#!/usr/bin/env node
/**
 * Stamp the generated service worker with a deterministic content hash.
 * The hash covers every generated file except sw.js itself, so any page,
 * stylesheet, script, or asset change creates a new cache namespace.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const siteDir = path.join(__dirname, '..', '_site');
const serviceWorker = path.join(siteDir, 'sw.js');

if (!fs.existsSync(serviceWorker)) {
  console.error('Cannot stamp service worker: run the Eleventy build first.');
  process.exit(1);
}

function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(absolute, relative) : [relative];
  });
}

const hash = crypto.createHash('sha256');
for (const relative of listFiles(siteDir).sort()) {
  if (relative.toLowerCase() === 'sw.js') continue;
  hash.update(relative.replaceAll(path.sep, '/'));
  hash.update('\0');
  hash.update(fs.readFileSync(path.join(siteDir, relative)));
  hash.update('\0');
}
const buildId = hash.digest('hex').slice(0, 16);
const source = fs.readFileSync(serviceWorker, 'utf8');
if (!source.includes('__BUILD_ID__')) {
  console.error('Cannot stamp service worker: __BUILD_ID__ placeholder is missing.');
  process.exit(1);
}
fs.writeFileSync(serviceWorker, source.replaceAll('__BUILD_ID__', buildId), 'utf8');
console.log(`Stamped _site/sw.js with build ${buildId}.`);
