#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');

const expectedChapters = [
    { file: 'dbms-chapter-01.pdf', download: 'DBMS-Chapter-01-Fundamentals.pdf', pages: 30 },
    { file: 'dbms-chapter-02.pdf', download: 'DBMS-Chapter-02-Architecture-Data-Independence.pdf', pages: 29 },
    { file: 'dbms-chapter-03.pdf', download: 'DBMS-Chapter-03-Data-Models.pdf', pages: 26 },
    { file: 'dbms-chapter-04.pdf', download: 'DBMS-Chapter-04-ER-EER-Modeling.pdf', pages: 32 },
    { file: 'dbms-chapter-05.pdf', download: 'DBMS-Chapter-05-Relational-Model-Keys-Constraints.pdf', pages: 27 },
    { file: 'dbms-chapter-06.pdf', download: 'DBMS-Chapter-06-Relational-Algebra-Calculus.pdf', pages: 27 },
    { file: 'dbms-chapter-07.pdf', download: 'DBMS-Chapter-07-SQL-Fundamentals-DDL-DML-Aggregates-NULLs.pdf', pages: 28 }
];

for (const ch of expectedChapters) {
    const pdfBytes = fs.readFileSync(path.join(root, 'src/assets/study-materials', ch.file));
    const loadedPdf = await PDFDocument.load(pdfBytes);
    assert.equal(loadedPdf.getPageCount(), ch.pages, `Downloaded ${ch.file} must contain all ${ch.pages} pages`);
    console.log(`PASS ${ch.file} contains all ${ch.pages} pages`);
}

const html = fs.readFileSync(path.join(site, 'products/dbms-notes.html'), 'utf8');
assert.equal((html.match(/class="chapter-card /g) || []).length, 7, 'All 7 vertical chapter cards must be rendered inside /products/dbms-notes');
assert.ok(!html.includes('chapter-card-meta'), 'Extra chapter card meta row below thumbnail must be removed');
assert.ok(!html.includes('chapter-card-title'), 'Extra chapter card title below thumbnail must be removed');
assert.ok(!html.includes('chapter-card-desc'), 'Extra chapter card description below thumbnail must be removed');
assert.ok(!html.includes('chapter-reader-banner'), 'Inline reader banner must not appear on /products/dbms-notes');
assert.ok(!html.includes('pdf-viewer-toolbar'), 'Inline PDF viewer toolbar must not appear on /products/dbms-notes');
assert.ok(!html.includes('pdf-viewer-container'), 'Inline PDF viewer container must not appear on /products/dbms-notes');
assert.ok(!html.includes('back-link'), 'Back link must not appear on /products/dbms-notes');
assert.ok(!html.includes('purchase-summary'), 'Legacy purchase summary must not appear on /products/dbms-notes');
assert.ok(!html.includes('preview-card'), 'Legacy 5-page preview card must not appear on /products/dbms-notes');
assert.ok(!html.includes('coverage-card'), 'Legacy coverage card must not appear on /products/dbms-notes');
for (const ch of expectedChapters) {
    assert.ok(html.includes(`href="/assets/study-materials/${ch.file}"`), `View/Download link must include ${ch.file}`);
    assert.ok(html.includes(`download="${ch.download}"`), `Download button must download ${ch.download}`);
}
console.log('PASS 7 vertical chapter cards with new-tab View PDF and Download PDF verified');


