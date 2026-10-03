#!/usr/bin/env node
// Read-only launch audit. HTTP reachability is not proof of a successful export,
// AI response, checkout or physical-device compatibility.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { parse } from 'parse5';
import { attribute, walk } from './prepare-site.mjs';
import { requiredRoutes } from './smoke-worker.mjs';

const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const base = new URL(option('--base') || 'https://onlinepdfpro.com');
if (base.protocol !== 'https:') throw new Error('An HTTPS public site is required');
const release = option('--release');
const require = createRequire(import.meta.url);
const registry = require('../src/_data/tools.js').tools;
const guides = require('../src/_data/guides.js');
const results = [], errors = [], warnings = [];
const routes = [...new Set(['/', '/tools', '/guides', '/about', '/contact', '/support', '/privacy', '/terms', '/help', '/blog', '/study-materials', '/products/dbms-notes', ...registry.map(t => t.href.replace(/\.html$/, '')), ...guides.map(g => g.url)])];
if (routes.some(route => typeof route !== 'string' || !route.startsWith('/'))) throw new Error('Every public audit route must be an explicit site path');
const get = async pathname => {
  const response = await fetch(new URL(pathname, base), { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
  return { response, body: await response.text() };
};

for (let i = 0; i < routes.length; i += 4) await Promise.all(routes.slice(i, i + 4).map(async route => {
  try {
    const { response, body } = await get(route), metadata = { route, status: response.status, canonical: [], publisher: [], h1: 0 };
    walk(parse(body), node => {
      if (node.tagName === 'h1') metadata.h1++;
      if (node.tagName === 'link' && attribute(node, 'rel') === 'canonical') metadata.canonical.push(attribute(node, 'href'));
      if (node.tagName === 'meta' && attribute(node, 'name') === 'google-adsense-account') metadata.publisher.push(attribute(node, 'content'));
    });
    results.push(metadata);
    if (response.status !== 200) errors.push(`${route}: HTTP ${response.status}`);
    else {
      if (!metadata.h1) errors.push(`${route}: missing primary heading`);
      if (metadata.canonical.length !== 1 || metadata.canonical[0] !== `https://onlinepdfpro.com${route}`) errors.push(`${route}: unexpected canonical`);
      if (metadata.publisher.length !== 1 || metadata.publisher[0] !== 'ca-pub-3541372477756449') warnings.push(`${route}: ownership metadata absent or inconsistent`);
    }
  } catch (error) { errors.push(`${route}: ${error.message}`); }
}));
let observedRelease;
try {
  const { response, body } = await get('/release.json');
  observedRelease = JSON.parse(body).release;
  if (response.status !== 200 || !observedRelease || observedRelease === 'local' || (release && release !== observedRelease)) errors.push(`Frontend release mismatch: ${observedRelease}`);
} catch (error) { errors.push(`Frontend release: ${error.message}`); }
try {
  const { response, body } = await get('/ads.txt');
  const expected = fs.readFileSync(new URL('../src/ads.txt', import.meta.url), 'utf8').trim();
  if (response.status !== 200 || !/text\/plain/.test(response.headers.get('content-type') || '') || !body.split(/\r?\n/).some(line => line.trim() === expected)) errors.push('ads.txt is unavailable, has the wrong content type or publisher record');
} catch (error) { errors.push(`ads.txt: ${error.message}`); }
for (const asset of ['/assets/examples/sample-assignment.pdf', '/assets/examples/notes-page.jpg', '/assets/examples/checklist-page.jpg']) {
  try { const { response } = await get(asset); if (response.status !== 200) errors.push(`${asset}: HTTP ${response.status}`); }
  catch (error) { errors.push(`${asset}: ${error.message}`); }
}
let worker;
try {
  const response = await fetch(`${process.env.API_BASE_URL || 'https://onlinepdfpro-proxy.prem736raj.workers.dev'}/health`, { signal: AbortSignal.timeout(15000) });
  worker = await response.json();
  if (response.status !== 200 || worker.status !== 'ok') errors.push('Worker health is not ok');
  const missing = requiredRoutes.filter(route => !worker.routes?.includes(route));
  if (missing.length) errors.push(`Worker is missing routes: ${missing.join(', ')}`);
  if (!worker.release || worker.release !== observedRelease) errors.push(`Worker/frontend releases differ: ${worker.release || 'unattributed'} / ${observedRelease || 'unknown'}`);
} catch (error) { errors.push(`Worker: ${error.message}`); }
const report = { checkedAt: new Date().toISOString(), base: base.origin, expectedRelease: release, observedRelease, toolCount: registry.length, checkedPages: routes.length, http200Pages: results.filter(r => r.status === 200).length, worker, errors, warnings, pages: results.sort((a, b) => a.route.localeCompare(b.route)), limitation: 'HTTP and metadata only. Successful real providers, payments, file outputs and physical devices require separate acceptance.' };
if (option('--output')) fs.writeFileSync(option('--output'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, pages: undefined }, null, 2));
process.exitCode = errors.length ? 1 : 0;
