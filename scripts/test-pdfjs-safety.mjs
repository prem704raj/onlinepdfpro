import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let calls = 0;
for (const file of fs.readdirSync(path.join(root, 'src'), { recursive: true })) {
  if (!/\.(?:html|js|njk)$/.test(file) || file.replaceAll('\\', '/').includes('/vendor/')) continue;
  const source = fs.readFileSync(path.join(root, 'src', file), 'utf8');
  for (const match of source.matchAll(/pdfjsLib\.getDocument\(\s*(\{[\s\S]*?\})\s*\)/g)) {
    assert.match(match[1], /\bisEvalSupported\s*:\s*false\b/, `${file}: document evaluation must be disabled`);
    calls++;
  }
  assert.equal([...source.matchAll(/pdfjsLib\.getDocument\s*\(/g)].length,
    [...source.matchAll(/pdfjsLib\.getDocument\(\s*(\{[\s\S]*?\})\s*\)/g)].length,
    `${file}: every loader must provide explicit safety options`);
}
assert.ok(calls >= 25, 'The guard must cover the complete application loader inventory');
console.log(`PASS all ${calls} application PDF.js loaders explicitly disable evaluation`);

// Exercise the real bundled parser with evaluation disabled, including text
// extraction and font operators. No browser, network, or customer files used.
const require = createRequire(import.meta.url);
const pdfjs = require('../js/vendor/pdfjs/pdf.min.js');
pdfjs.GlobalWorkerOptions.workerSrc = path.join(root, 'js/vendor/pdfjs/pdf.worker.min.js');
const fixture = await PDFDocument.create();
fixture.registerFontkit(fontkit);
const font = await fixture.embedFont(fs.readFileSync(path.join(root, 'fonts/pdf-editor/Tinos-Regular.ttf')), { subset: true });
fixture.addPage([300, 400]).drawText('Local PDF safety smoke test', { x: 20, y: 300, size: 12, font });
const task = pdfjs.getDocument({ data: new Uint8Array(await fixture.save()), isEvalSupported: false });
try {
  const doc = await task.promise;
  assert.equal(doc.numPages, 1);
  const page = await doc.getPage(1);
  assert.equal((await page.getTextContent()).items.map(item => item.str).join('').replace(/\s/g, ''), 'LocalPDFsafetysmoketest');
  assert.ok((await page.getOperatorList()).fnArray.length > 0);
  console.log('PASS bundled parser reads text and font operators with evaluation disabled');
} finally { await task.destroy(); }
console.log('VERDICT: PASS');
