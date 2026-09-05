#!/usr/bin/env node

/**
 * Static deployment budget. This is intentionally separate from Core Web
 * Vitals: it measures bytes in the generated artifact and catches accidental
 * duplicate libraries before they reach the hosting branch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');

function size(relative) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) throw new Error(`Missing generated asset: ${relative}`);
    return fs.statSync(file).size;
}

function sumFiles(relativeDir) {
    const dir = path.join(root, relativeDir);
    if (!fs.existsSync(dir)) throw new Error(`Missing generated directory: ${relativeDir}`);
    let total = 0;
    const walk = current => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) walk(full);
            else total += fs.statSync(full).size;
        }
    };
    walk(dir);
    return total;
}

if (!fs.existsSync(site)) throw new Error('Generated site not found; run npm run build first.');

const measured = {
    homepage: size('_site/index.html'),
    coreCss: ['_site/css/style.css', '_site/css/mobile-fix-v2.css', '_site/css/tools-v2.css']
        .reduce((total, file) => total + size(file), 0),
    coreJs: ['_site/js/app.js', '_site/js/auth.js', '_site/js/store.js']
        .reduce((total, file) => total + size(file), 0),
    site: sumFiles('_site')
};

const budgets = {
    homepage: 100_000,
    coreCss: 180_000,
    coreJs: 140_000,
    site: 30_000_000
};

for (const [name, value] of Object.entries(measured)) {
    const budget = budgets[name];
    const status = value <= budget ? 'PASS' : 'FAIL';
    console.log(`${status} performance budget ${name}: ${value} bytes (limit ${budget})`);
    if (value > budget) process.exitCode = 1;
}

if (process.exitCode) throw new Error('Generated site exceeds the static performance budget.');
