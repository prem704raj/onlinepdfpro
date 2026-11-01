import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const checks = [
  {
    file: 'src/pdf-reader.html',
    expectedButtons: ['Choose PDF File'],
    forbidden: []
  },
  {
    file: 'src/tools/jpg-to-pdf.html',
    expectedButtons: ['Choose Images'],
    forbidden: []
  },
  {
    file: 'src/tools/image-to-text.html',
    expectedButtons: ['Choose Image or PDF'],
    forbidden: []
  },
  {
    file: 'src/tools/sign-pdf.html',
    expectedButtons: ['Choose PDF File'],
    forbidden: []
  },
  {
    file: 'src/tools/crop-pdf.html',
    expectedButtons: ['Choose PDF File'],
    forbidden: ['Click to Upload', '<span>📁</span>']
  },
  {
    file: 'src/tools/delete-pdf-pages.html',
    expectedButtons: ['Choose PDF File'],
    forbidden: ['Click to Upload', '<span>📁</span>']
  },
  {
    file: 'src/tools/pdf-page-counter.html',
    expectedButtons: ['Choose PDF Files'],
    forbidden: ['class="select-btn"']
  },
  {
    file: 'src/tools/pdf-to-word.html',
    expectedButtons: ['Choose PDF File'],
    forbidden: []
  },
  {
    file: 'src/tools/word-to-pdf.html',
    expectedButtons: ['Choose Word File'],
    forbidden: []
  },
  {
    file: 'src/compare-pdf.html',
    expectedButtons: ['Choose PDF 1', 'Choose PDF 2'],
    forbidden: []
  },
  {
    file: 'src/text-to-speech.html',
    expectedButtons: ['Choose PDF File'],
    forbidden: []
  }
];

let totalTested = 0;

for (const check of checks) {
  for (const prefix of ['src/', '', '_site/']) {
    const relPath = check.file.replace(/^src\//, prefix);
    const filePath = path.join(rootDir, relPath);
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf8');

    // Verify button presence and classes
    const buttonMatches = [...html.matchAll(/<button[^>]*class="([^"]*upload-btn[^"]*)"[^>]*>([\s\S]*?)<\/button>/gi)];
    assert.ok(buttonMatches.length >= check.expectedButtons.length, `Expected at least ${check.expectedButtons.length} upload-btn in ${relPath}, found ${buttonMatches.length}`);

    const labels = buttonMatches.map(m => m[2].replace(/<[^>]+>/g, '').trim());
    for (const expected of check.expectedButtons) {
      assert.ok(labels.includes(expected), `Expected button "${expected}" in ${relPath}. Found: ${JSON.stringify(labels)}`);
    }

    // Verify classes include btn and btn-primary
    for (const m of buttonMatches) {
      const classAttr = m[1];
      assert.ok(classAttr.includes('btn'), `Button has class 'btn' in ${relPath}`);
      assert.ok(classAttr.includes('btn-primary'), `Button has class 'btn-primary' in ${relPath}`);
      assert.ok(classAttr.includes('upload-btn'), `Button has class 'upload-btn' in ${relPath}`);
    }

    // Check forbidden patterns
    for (const f of check.forbidden) {
      assert.ok(!html.includes(f), `Forbidden snippet "${f}" found in ${relPath}`);
    }

    totalTested++;
    console.log(`PASS ${relPath}: [${check.expectedButtons.join(', ')}]`);
  }
}

console.log(`\nAll ${totalTested} targets across src/, _site/, and root verified successfully.`);
console.log('VERDICT: PASS');
