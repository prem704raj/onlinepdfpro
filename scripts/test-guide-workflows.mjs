import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { open, upload, visible, fill, click, download, pdfInfo, renderPdf, finish, root, scratch } from './tool-test-harness.mjs';

const sample = path.join(root, 'src/assets/examples/sample-assignment.pdf');
const admitCard = path.join(root, 'src/assets/examples/sample-admit-card.pdf');
const heading = [/Assignment cover/, /Revision notes/, /Submission checklist/];
const split = async (range, source = sample) => {
  const p = await open('/tools/split-pdf');
  try {
    await upload(p, '#uploadZone input', source);
    await visible(p, '#pageSection');
    await fill(p, '#pageRange', range);
    await click(p, '#extractBtn');
    await visible(p, '#resultsSection');
    await click(p, '#downloadBtn');
    const out = await download(p);
    assert.deepEqual(p.testErrors, []);
    return { bytes: out.bytes, pages: await pdfInfo(p, out.bytes) };
  } finally { await p.close(); }
};

try {
  const candidate = await split('1', admitCard);
  assert.equal(candidate.pages.length, 1);
  assert.match(candidate.pages[0].text, /2026-ENG-49102/);
  assert.doesNotMatch(candidate.pages[0].text, /PROHIBITED ARTICLES/);
  console.log('PASS new admit-card guide: page 1 export retains candidate details and omits instructions');

  // The guides describe an actual split/merge exercise, not just page links.
  const notes = await split('2-3');
  assert.equal(notes.pages.length, 2);
  assert.match(notes.pages[0].text, heading[1]);
  assert.match(notes.pages[1].text, heading[2]);
  const cover = await split('1');
  assert.equal(cover.pages.length, 1);
  assert.match(cover.pages[0].text, heading[0]);
  const coverPath = path.join(scratch, 'guide-cover.pdf');
  const notesPath = path.join(scratch, 'guide-notes.pdf');
  fs.writeFileSync(coverPath, cover.bytes); fs.writeFileSync(notesPath, notes.bytes);
  const merge = await open('/tools/merge-pdf');
  try {
    await upload(merge, '#uploadZone input', coverPath, notesPath);
    await visible(merge, '#mergeBtn'); await click(merge, '#mergeBtn');
    await visible(merge, '#resultsSection'); await click(merge, '#downloadBtn');
    const pages = await pdfInfo(merge, (await download(merge)).bytes);
    assert.equal(pages.length, 3);
    pages.forEach((p, i) => assert.match(p.text, heading[i]));
    assert.deepEqual(merge.testErrors, []);
  } finally { await merge.close(); }
  console.log('PASS original guide: cover + notes/checklist split and merged in order');

  const compress = await open('/tools/compress-pdf');
  try {
    await upload(compress, '#uploadZone input', sample); await visible(compress, '#compressBtn');
    assert.equal(await compress.$eval('#allowRasterization', e => e.checked), false);
    await fill(compress, '#targetSizeInput', '1'); await click(compress, '#compressBtn');
    await visible(compress, '#resultsSection');
    assert.match(await compress.$eval('.output-details', e => e.textContent), /Above target/);
    await click(compress, '#resultsList button');
    const out = await download(compress);
    assert.ok(out.bytes.length <= fs.statSync(sample).size);
    const pages = await pdfInfo(compress, out.bytes);
    assert.equal(pages.length, 3);
    pages.forEach((p, i) => assert.match(p.text, heading[i]));
    assert.deepEqual(compress.testErrors, []);
  } finally { await compress.close(); }
  console.log('PASS original guide: structural compression retains text and reports unmet 1KB target');

  const jpg = await open('/tools/jpg-to-pdf');
  try {
    await upload(jpg, '#fileInput', path.join(root, 'src/assets/examples/notes-page.jpg'), path.join(root, 'src/assets/examples/checklist-page.jpg'));
    await visible(jpg, '#convertSection'); await click(jpg, '.convert-btn');
    const out = await download(jpg), pages = await pdfInfo(jpg, out.bytes);
    assert.equal(pages.length, 2);
    for (const p of pages) {
      assert.ok(Math.abs(p.width - 595.28) < 0.1 && Math.abs(p.height - 841.89) < 0.1);
      assert.equal(p.text, '', 'Image conversion does not invent a text layer');
    }
    await renderPdf(jpg, out.bytes, 'guide-image-export');
    assert.deepEqual(jpg.testErrors, []);
  } finally { await jpg.close(); }
  console.log('PASS original guide: the supplied JPGs produce two A4 image pages');

} finally { await finish(); }
