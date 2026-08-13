#!/usr/bin/env node
/**
 * Copy the freshly built site (_site/) over the repo root, so that the
 * "publish from the main branch" GitHub Pages setup stays in sync with src/.
 *
 * Usage:
 *   npm run build
 *   npm run sync:root
 *
 * IMPORTANT: root files are BUILD OUTPUT. Edit pages in src/, never by hand
 * in the root. This script only copies files that exist in _site/ — it does
 * not delete root files, so a page removed from src/ must be deleted manually.
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', '_site');
const ROOT = path.join(__dirname, '..');

if (!fs.existsSync(SITE)) {
  console.error('No _site/ directory found. Run `npm run build` first.');
  process.exit(1);
}

let copied = 0;
function copyDir(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyDir(src, dest);
    } else {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }
}

copyDir(SITE, ROOT);
console.log(`Copied ${copied} files from _site/ to repo root.`);
console.log('Commit the root changes (or rely on the GitHub Actions deploy workflow).');
