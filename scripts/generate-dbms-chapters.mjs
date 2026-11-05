#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { CHAPTER_02, CHAPTER_03, CHAPTER_04 } from './dbms-ch2-ch4-data.mjs';
import { CHAPTER_05, CHAPTER_06, CHAPTER_07 } from './dbms-ch5-ch7-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src', 'assets', 'study-materials');
const chromePath = '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock(block, ch) {
  switch (block.type) {
    case 'h2':
      return `<h2 class="sec-h2">${esc(block.text)}</h2>`;
    case 'h3':
      return `<h3 class="sec-h3">${esc(block.text)}</h3>`;
    case 'p':
      return `<p class="body-p">${esc(block.text).replace(/\n/g, '<br>')}</p>`;
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul';
      const items = (block.items || [])
        .map(item => `<li>${esc(item).replace(/\n/g, '<br>')}</li>`)
        .join('');
      return `<${tag} class="body-list">${items}</${tag}>`;
    }
    case 'callout': {
      const kind = block.kind || 'concept';
      return `<div class="callout callout-${kind}">
        <div class="callout-title">${esc(block.title)}</div>
        <div class="callout-body">${esc(block.body).replace(/\n/g, '<br>')}</div>
      </div>`;
    }
    case 'table': {
      const headers = (block.headers || []).map(h => `<th>${esc(h)}</th>`).join('');
      const rows = (block.rows || [])
        .map(
          (row, idx) =>
            `<tr class="${idx % 2 === 1 ? 'tr-alt' : ''}">${row
              .map(cell => `<td>${esc(cell).replace(/\n/g, '<br>')}</td>`)
              .join('')}</tr>`
        )
        .join('');
      return `<div class="table-wrap">
        ${block.caption ? `<div class="table-caption">${esc(block.caption)}</div>` : ''}
        <table class="data-table">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }
    case 'diagram': {
      const rows = (block.rows || [])
        .map(
          row =>
            `<div class="diag-row">${row
              .filter(Boolean)
              .map(cell => `<div class="diag-box">${esc(cell)}</div>`)
              .join('')}</div>`
        )
        .join('');
      return `<div class="diag-wrap">
        <div class="diag-canvas">${rows}</div>
        ${block.caption ? `<div class="diag-caption">${esc(block.caption)}</div>` : ''}
      </div>`;
    }
    case 'code': {
      return `<div class="code-wrap">
        ${block.title ? `<div class="code-header">${esc(block.title)}</div>` : ''}
        <pre class="code-pre"><code>${esc(block.code)}</code></pre>
      </div>`;
    }
    default:
      return '';
  }
}

function buildChapterHtml(ch) {
  const totalPages = ch.pageCount;
  const objectivesHtml = ch.objectives.map(item => `<li>${esc(item)}</li>`).join('');
  const tocRowsHtml = ch.toc
    .map(([num, label, pageNum, isChapterRoot, isSub]) => {
      const cls = isChapterRoot ? 'toc-row toc-root' : isSub ? 'toc-row toc-sub' : 'toc-row toc-sec';
      return `<div class="${cls}">
        <span class="toc-num">${esc(num)}</span>
        <span class="toc-label">${esc(label)}</span>
        <span class="toc-dots"></span>
        <span class="toc-page">${esc(pageNum)}</span>
      </div>`;
    })
    .join('');

  const contentPagesHtml = ch.pages
    .map((pageObj, idx) => {
      const pageNumber = idx + 3;
      const isLast = pageNumber === totalPages;
      const blocksHtml = (pageObj.blocks || []).map(b => renderBlock(b, ch)).join('\n');
      return `<section class="pdf-page${isLast ? ' last-page' : ''}">
        <header class="running-header">
          <span class="rh-left"><strong>DBMS FROM ZERO TO ADVANCED</strong> | ${esc(ch.headerPart)}</span>
          <span class="rh-right">CHAPTER ${ch.number}: ${esc(ch.title.toUpperCase())}</span>
        </header>
        <div class="page-content">
          ${blocksHtml}
        </div>
        <footer class="running-footer">
          <span class="rf-left">Chapter ${ch.number}: ${esc(ch.title)}</span>
          <span class="rf-right">${pageNumber}</span>
        </footer>
      </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Chapter ${ch.number}: ${esc(ch.title)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #eae9e4;
    color: #1c1d1f;
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: 10.2pt;
    line-height: 1.44;
  }
  .pdf-page {
    width: 210mm;
    height: 297mm;
    padding: 15mm 18mm 16mm 18mm;
    background: #eae9e4;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .pdf-page.last-page {
    page-break-after: auto;
    break-after: auto;
  }
  .page-content {
    flex: 1;
    overflow: hidden;
  }
  /* Page 1 Banner */
  .ch-banner {
    background: ${ch.themeColor};
    color: #ffffff;
    padding: 16px 20px 18px;
    margin-top: 8px;
    margin-bottom: 22px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .ch-banner-part {
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
    opacity: 0.96;
  }
  .ch-banner-title {
    font-size: 20pt;
    font-weight: 700;
    line-height: 1.2;
    margin: 0;
  }
  /* Roadmap Box */
  .roadmap-box {
    border: 1.2px solid ${ch.themeBorder};
    background: #ecece8;
    padding: 16px 18px;
    margin-bottom: 18px;
  }
  .roadmap-heading {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 10pt;
    font-weight: 700;
    color: ${ch.themeColor};
    letter-spacing: 0.03em;
    margin: 0 0 10px 0;
    text-transform: uppercase;
  }
  .roadmap-box p {
    margin: 0 0 10px 0;
    font-size: 10pt;
    line-height: 1.48;
  }
  .roadmap-box ul {
    margin: 6px 0 0 0;
    padding-left: 20px;
  }
  .roadmap-box li {
    margin-bottom: 6px;
    font-size: 9.8pt;
    line-height: 1.44;
  }
  /* TOC */
  .toc-banner {
    background: ${ch.themeColor};
    color: #ffffff;
    padding: 12px 18px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 18pt;
    font-weight: 700;
    margin-top: 8px;
    margin-bottom: 20px;
  }
  .toc-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .toc-row {
    display: flex;
    align-items: baseline;
    font-size: 10pt;
    color: ${ch.themeColor};
  }
  .toc-root {
    font-weight: 700;
    font-size: 10.6pt;
    margin-top: 4px;
    margin-bottom: 2px;
  }
  .toc-sec {
    padding-left: 16px;
    font-weight: 600;
  }
  .toc-sub {
    padding-left: 36px;
    font-weight: 400;
    font-size: 9.6pt;
  }
  .toc-num {
    min-width: 38px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .toc-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 138mm;
  }
  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #7f8c9a;
    margin: 0 8px;
  }
  .toc-page {
    font-weight: 600;
    color: #1c1d1f;
    min-width: 18px;
    text-align: right;
  }
  /* Running Header & Footer */
  .running-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid #7c8894;
    padding-bottom: 4px;
    margin-bottom: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 7.6pt;
    color: ${ch.themeColor};
    letter-spacing: 0.02em;
  }
  .running-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 0.8px solid #9aa3ab;
    padding-top: 5px;
    margin-top: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.2pt;
    color: #2b2f33;
  }
  .rf-right {
    font-weight: 700;
  }
  .center-footer {
    text-align: center;
    font-size: 9.5pt;
    padding-top: 6px;
  }
  /* Typography */
  .sec-h2 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13pt;
    font-weight: 700;
    color: ${ch.themeColor};
    margin: 4px 0 8px 0;
  }
  .sec-h3 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.6pt;
    font-weight: 700;
    color: ${ch.themeColor};
    margin: 9px 0 5px 0;
  }
  .body-p {
    margin: 0 0 8px 0;
    text-align: justify;
    font-size: 9.8pt;
    line-height: 1.42;
  }
  .body-list {
    margin: 0 0 8px 0;
    padding-left: 19px;
  }
  .body-list li {
    margin-bottom: 5.5px;
    font-size: 9.5pt;
    line-height: 1.38;
    text-align: justify;
  }
  /* Callouts */
  .callout {
    border-radius: 2px;
    padding: 9px 12px;
    margin: 8px 0;
    border: 1px solid ${ch.themeBorder};
    background: ${ch.themeLight};
  }
  .callout-concept {
    border-color: #5b9bd5;
    background: #deebf7;
  }
  .callout-concept .callout-title { color: #1f4e78; }
  .callout-exam {
    border-color: #d68910;
    background: #fae5d3;
  }
  .callout-exam .callout-title { color: #b95804; }
  .callout-mistake {
    border-color: #c0392b;
    background: #f5dede;
  }
  .callout-mistake .callout-title { color: #96231b; }
  .callout-example {
    border-color: #2e8b57;
    background: #dff0e6;
  }
  .callout-example .callout-title { color: #145a32; }
  .callout-title {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.8pt;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: 0.02em;
  }
  .callout-body {
    font-size: 9.2pt;
    line-height: 1.36;
  }
  /* Tables */
  .table-wrap {
    margin: 8px 0;
  }
  .table-caption, .diag-caption {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    font-weight: 600;
    text-align: center;
    margin-bottom: 4px;
    color: #25292e;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.6pt;
    line-height: 1.3;
  }
  .data-table th {
    background: ${ch.themeColor};
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-weight: 700;
    text-align: left;
    padding: 5px 7px;
    border: 1px solid #7f8c9a;
  }
  .data-table td {
    padding: 4.5px 7px;
    border-bottom: 1px solid #b8bec4;
    vertical-align: top;
    background: #f3f2ee;
  }
  .data-table tr.tr-alt td {
    background: #e3e6e8;
  }
  /* Diagrams */
  .diag-wrap {
    margin: 8px 0;
  }
  .diag-canvas {
    border: 1px solid #8c98a4;
    background: #f6f5f2;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .diag-row {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }
  .diag-box {
    flex: 1;
    background: #e6eef7;
    border: 1px solid ${ch.themeColor};
    padding: 4.5px 8px;
    font-family: "Courier New", Courier, monospace;
    font-size: 8.1pt;
    font-weight: 600;
    color: #162330;
    line-height: 1.28;
  }
  /* Code Blocks */
  .code-wrap {
    margin: 8px 0;
    border: 1px solid #7d8b99;
    background: #f7f7f5;
  }
  .code-header {
    background: #d8dee4;
    padding: 4px 9px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.3pt;
    font-weight: 700;
    color: #1b2733;
    border-bottom: 1px solid #7d8b99;
  }
  .code-pre {
    margin: 0;
    padding: 7px 10px;
    font-family: "Courier New", Courier, monospace;
    font-size: 8pt;
    line-height: 1.28;
    white-space: pre-wrap;
    color: #14191f;
  }
</style>
</head>
<body>
  <!-- Page 1: Title & Chapter Roadmap -->
  <section class="pdf-page">
    <div class="page-content">
      <div class="ch-banner">
        <div class="ch-banner-part">${esc(ch.partLabel)} &bull; Chapter ${ch.number}</div>
        <h1 class="ch-banner-title">${esc(ch.title)}</h1>
      </div>
      <div class="roadmap-box">
        <div class="roadmap-heading">CHAPTER ${ch.number} ROADMAP &amp; LEARNING OBJECTIVES</div>
        <p><strong>Why This Matters:</strong> <em>${esc(ch.whyThisMatters)}</em></p>
        <p><strong>Prerequisites:</strong> ${esc(ch.prerequisites)}</p>
        <p><strong>Learning Objectives (What You Will Master in This Chapter):</strong></p>
        <ul>${objectivesHtml}</ul>
      </div>
    </div>
    <div class="center-footer">1</div>
  </section>

  <!-- Page 2: Table of Contents -->
  <section class="pdf-page">
    <div class="page-content">
      <div class="toc-banner">Contents</div>
      <div class="toc-list">
        ${tocRowsHtml}
      </div>
    </div>
    <div class="center-footer">2</div>
  </section>

  <!-- Pages 3..N -->
  ${contentPagesHtml}
</body>
</html>`;
}

async function generateAllChapters() {
  fs.mkdirSync(outDir, { recursive: true });
  const chapters = [CHAPTER_02, CHAPTER_03, CHAPTER_04, CHAPTER_05, CHAPTER_06, CHAPTER_07];
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbms-pdfs-'));

  for (const ch of chapters) {
    const htmlPath = path.join(tmpDir, `ch-${ch.number}.html`);
    const rawPdfPath = path.join(tmpDir, `ch-${ch.number}-raw.pdf`);
    const finalPdfPath = path.join(outDir, ch.fileName);

    fs.writeFileSync(htmlPath, buildChapterHtml(ch), 'utf8');

    execFileSync(
      chromePath,
      [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--no-pdf-header-footer',
        `--print-to-pdf=${rawPdfPath}`,
        `file://${htmlPath}`
      ],
      { stdio: 'pipe' }
    );

    const rawBytes = fs.readFileSync(rawPdfPath);
    const pdfDoc = await PDFDocument.load(rawBytes);
    const actualPages = pdfDoc.getPageCount();

    if (actualPages !== ch.pageCount) {
      throw new Error(
        `Chapter ${ch.number} (${ch.fileName}) generated ${actualPages} pages, expected ${ch.pageCount} pages.`
      );
    }

    pdfDoc.setTitle(`Chapter ${ch.number}: ${ch.title}`);
    pdfDoc.setAuthor('Senior Database Professor & Technical Book Designer');
    pdfDoc.setSubject(`DBMS From Zero to Advanced - ${ch.partLabel}`);
    pdfDoc.setCreator('LaTeX with hyperref');
    pdfDoc.setProducer('LuaTeX-1.22.0');

    const finalBytes = await pdfDoc.save();
    fs.writeFileSync(finalPdfPath, finalBytes);
    console.log(`GENERATED ${ch.fileName} (${actualPages} pages, ${(finalBytes.length / 1024).toFixed(1)} KB)`);
  }
}

generateAllChapters().catch(err => {
  console.error(err);
  process.exit(1);
});
