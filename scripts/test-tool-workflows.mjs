import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";
import { createRequire } from "node:module";
import {
  open,
  upload,
  visible,
  fill,
  click,
  download,
  pdfInfo,
  imageInfo,
  renderPdf,
  fixtures,
  finish,
  scratch,
} from "./tool-test-harness.mjs";

const results = [];
const cases = [];
const test = (name, run) => cases.push({ name, run });
const registry = createRequire(import.meta.url)("../src/_data/tools.js").tools;

test("Merge PDF: one move changes order once; output follows chosen order", async () => {
  const p = await open("/tools/merge-pdf");
  try {
    await upload(p, "#uploadZone input", fixtures.pdf, fixtures.second);
    await visible(p, "#mergeBtn");
    await click(p, '.file-move-up[data-index="1"]');
    assert.match(
      await p.$eval(".file-item .file-name", (el) => el.textContent),
      /second/,
    );
    await click(p, "#mergeBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadBtn");
    const out = await download(p);
    const info = await pdfInfo(p, out.bytes);
    assert.equal(info.length, 4);
    assert.match(info[0].text, /Second file/);
    assert.match(info[3].text, /Fixture page 3/);
    assert.equal(info[2].rotation, 90);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Split PDF: valid ranges preserve order and rotation; malformed ranges are rejected", async () => {
  const p = await open("/tools/split-pdf");
  try {
    await upload(p, "#uploadZone input", fixtures.pdf);
    await visible(p, "#pageSection");
    await fill(p, "#pageRange", "2junk, 1-999");
    assert.equal(
      await p.$eval("#pageRange", (el) => el.checkValidity()),
      false,
      "A malformed or out-of-range selection must not silently select pages",
    );
    await fill(p, "#pageRange", "3, 2, 2");
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Loaded split previews must fit mobile screens",
    );
    await click(p, "#extractBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadBtn");
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.equal(info.length, 2);
    assert.match(info[0].text, /Fixture page 2/);
    assert.match(info[1].text, /Fixture page 3/);
    assert.equal(info[0].rotation, 90);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("JPG to PDF: transparent PNG and JPEG produce ordered A4 pages", async () => {
  const p = await open("/tools/jpg-to-pdf");
  try {
    await upload(p, "#fileInput", fixtures.png, fixtures.jpg);
    await visible(p, "#convertSection");
    assert.equal(
      await p.$eval("#imageCount", (el) => el.textContent),
      "2 images selected",
    );
    await click(p, ".convert-btn");
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.equal(info.length, 2);
    assert.ok(Math.abs(info[0].width - 595.28) < 0.1);
    assert.ok(Math.abs(info[0].height - 841.89) < 0.1);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Rotate PDF: retained source bytes allow export; rotations accumulate correctly", async () => {
  const p = await open("/tools/rotate-pdf");
  try {
    await upload(p, "#uploadZone input", fixtures.pdf);
    await visible(p, "#pageSection");
    await click(p, "#rotateAllRight");
    await click(p, "#saveBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadBtn");
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.deepEqual(
      info.map((x) => x.rotation),
      [90, 180, 90],
    );
    assert.match(info[1].text, /Fixture page 2/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Delete PDF Pages: selected deletion keeps one page and outputs retained text", async () => {
  const p = await open("/tools/delete-pdf-pages");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#topControls");
    await click(p, '.page-card[data-page="1"]');
    await p.evaluate(() => deleteAndDownload());
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.equal(info.length, 2);
    assert.match(info[0].text, /Fixture page 2/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Image Crop: visible initial crop and working aspect ratio; genuine WebP filename", async () => {
  const p = await open("/tools/image-crop");
  try {
    await upload(p, "#uploadZone input.file-input", fixtures.webp);
    await visible(p, "#cropSection");
    assert.notEqual(
      await p.$eval("#cropDimensions", (el) => el.textContent),
      "NaN × NaN",
    );
    await click(p, '#aspectOptions .aspect-btn[data-aspect="1:1"]');
    await click(p, "#cropBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadBtn");
    const out = await download(p);
    const info = await imageInfo(p, out.bytes, out.type);
    assert.equal(info.width, info.height);
    assert.ok(info.width > 0);
    assert.match(out.name, /\.webp$/);
    assert.equal(out.bytes.subarray(8, 12).toString(), "WEBP");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Add Page Numbers: offset totals are coherent and content survives export", async () => {
  const p = await open("/tools/add-page-numbers-to-pdf");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#optionsBox");
    await p.select("#format", "pageOf");
    await fill(p, "#startNum", "5");
    await p.evaluate(() => addPageNumbers());
    await visible(p, "#successBox");
    await p.evaluate(() => downloadResult());
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.match(info[0].text, /Page 5 of 7/);
    assert.match(info[2].text, /Page 7 of 7/);
    assert.match(info[1].text, /Fixture page 2/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF Page Reorder: reverse, duplicate, undo and export preserve actual page order", async () => {
  const p = await open("/pdf-page-reorder");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#workspace");
    await click(p, "#reverseBtn");
    await click(p, "#downloadBtn");
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.equal(info.length, 3);
    assert.match(info[0].text, /Fixture page 3/);
    assert.match(info[2].text, /Fixture page 1/);
    await click(p, "#thumbnailsGrid .thumb-card");
    await click(p, "#duplicateBtn");
    assert.equal(
      await p.$$("#thumbnailsGrid .thumb-card").then((x) => x.length),
      4,
    );
    await click(p, "#undoBtn");
    assert.equal(
      await p.$$("#thumbnailsGrid .thumb-card").then((x) => x.length),
      3,
    );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Crop PDF: rotated CropBox coordinates and retained source permit correct export", async () => {
  const p = await open("/tools/crop-pdf");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#cropContainer");
    await p.waitForFunction(
      () => parseFloat(document.getElementById("selectionBox").style.width) > 0,
    );
    await p.evaluate(() => cropAndDownload());
    const out = await download(p);
    const doc = await PDFDocument.load(out.bytes);
    const box = doc.getPage(0).getCropBox();
    assert.ok(Math.abs(box.width - 256) < 1);
    assert.ok(Math.abs(box.height - 320) < 1);
    const info = await pdfInfo(p, out.bytes);
    assert.match(info[0].text, /Fixture page 1/);
    assert.deepEqual(p.testErrors, []);
    await p.evaluate(() => {
      document.getElementById("applyAll").checked = false;
      pageRatios = {
        1: { rLeft: 0.1, rTop: 0.2, rWidth: 0.6, rHeight: 0.5 },
        2: { rLeft: 0.1, rTop: 0.2, rWidth: 0.6, rHeight: 0.5 },
        3: { rLeft: 0.1, rTop: 0.2, rWidth: 0.6, rHeight: 0.5 },
      };
    });
    await p.evaluate(() => cropAndDownload());
    const asymmetric = (await download(p, 1)).bytes,
      cropped = await PDFDocument.load(asymmetric);
    assert.deepEqual(
      cropped
        .getPages()
        .map((pg) =>
          Object.values(pg.getCropBox()).map(
            (value) => Math.round(value * 1000) / 1000,
          ),
        ),
      [
        [32, 120, 192, 200],
        [40, 30, 100, 180],
        [64, 80, 204, 100],
      ],
    );
    assert.deepEqual(cropped.getPage(2).getMediaBox(), {
      x: 0,
      y: 0,
      width: 400,
      height: 240,
    });
    await renderPdf(p, asymmetric, "cropped-mixed");
  } finally {
    await p.close();
  }
});
test("PDF Bookmarks: Unicode outline labels and destination survive export", async () => {
  const p = await open("/pdf-bookmark");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#bookmarkEditor");
    await p.evaluate(() => addBookmark());
    await fill(p, ".bookmark-item input", "अध्याय — <script>");
    await p.select(".bookmark-item select", "2");
    await p.evaluate(() => savePDFWithBookmarks());
    const out = await download(p);
    const doc = await PDFDocument.load(out.bytes);
    assert.ok(doc.catalog.get(PDFName.of("Outlines")));
    const outline = await p.evaluate(async (data) => {
      const d = await pdfjsLib.getDocument({ data: Uint8Array.from(data) })
        .promise;
      const o = await d.getOutline();
      const page = await d.getPageIndex(o[0].dest[0]);
      await d.destroy();
      return { title: o[0].title, page };
    }, Array.from(out.bytes));
    assert.equal(outline.title, "अध्याय — <script>");
    assert.equal(outline.page, 1);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF Watermark: text reaches every page, including mixed rotation, and errors allow retry", async () => {
  const p = await open("/tools/pdf-watermark");
  try {
    await upload(p, "#uploadZone input", fixtures.pdf);
    await visible(p, "#optionsSection");
    await fill(p, "#watermarkText", "Unsupported 😀");
    await click(p, "#applyBtn");
    await visible(p, "#optionsSection");
    assert.ok(p.testAlerts.some((message) => /not supported/.test(message)));
    await fill(p, "#watermarkText", "DRAFT");
    await click(p, "#applyBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadBtn");
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.equal(info.length, 3);
    assert.ok(info.every((x) => /DRAFT/.test(x.text)));
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF Page Counter: valid and corrupt batch entries have separate results", async () => {
  const p = await open("/tools/pdf-page-counter");
  try {
    await upload(
      p,
      "#fileInput",
      fixtures.pdf,
      fixtures.second,
      fixtures.corrupt,
    );
    await visible(p, "#resultBox");
    await p.waitForFunction(
      () => document.getElementById("totalCount").textContent === "4",
    );
    assert.match(
      await p.$eval("#fileList", (el) => el.textContent),
      /Error reading file/,
    );
    assert.equal(await p.$$(".file-item").then((x) => x.length), 3);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF to JPG: selection exports genuine JPEG bytes and ZIP entries", async () => {
  const p = await open("/pdf-to-jpg");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#workspace");
    await fill(p, "#rangeInput", "2");
    await click(p, "#applyRangeBtn");
    await click(p, "#downloadSingleImageBtn");
    const out = await download(p);
    assert.deepEqual(
      [...out.bytes.subarray(0, 3)],
      [255, 216, 255],
      "A tool named PDF to JPG must actually export JPEG",
    );
    assert.match(out.name, /\.jpg$/);
    const image = await imageInfo(p, out.bytes, out.type);
    assert.equal(Math.max(image.width, image.height), 3840);
    await click(p, "#extractZipBtn");
    const zip = await download(p, 1);
    const entries = await p.evaluate(async (data) => {
      const z = await JSZip.loadAsync(Uint8Array.from(data));
      return Object.keys(z.files);
    }, Array.from(zip.bytes));
    assert.equal(entries.length, 1);
    assert.match(entries[0], /\.jpg$/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF Reader: rendered page navigation, search and zoom work", async () => {
  const p = await open("/pdf-reader");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#toolbar");
    await p.evaluate(() => nextPage());
    await p.waitForFunction(() =>
      document.getElementById("pageInfo").textContent.includes("2"),
    );
    await p.evaluate(() => {
      toggleSearch();
    });
    await fill(p, "#searchInput", "Fixture");
    await p.evaluate(() => searchPDF());
    await p.waitForFunction(
      () => document.getElementById("searchResults").textContent.length > 0,
    );
    assert.match(
      await p.$eval("#searchResults", (e) => e.textContent),
      /3|found|match/i,
    );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF Presentation: navigation, drawing canvas, timer and reset work", async () => {
  const p = await open("/pdf-presentation-mode");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#workspace");
    await click(p, "#startPresentationBtn");
    await visible(p, "#presentationStage");
    await click(p, "#nextBtn");
    await p.waitForFunction(() =>
      document.getElementById("slideIndicator").textContent.includes("2"),
    );
    await click(p, "#drawToggleBtn");
    assert.ok(await p.$eval("#drawCanvas", (e) => e.width > 0));
    await click(p, "#timerToggleBtn");
    await click(p, "#exitPresentationBtn");
    await click(p, "#resetBtn");
    assert.equal(
      await p.$eval("#workspace", (e) => getComputedStyle(e).display),
      "none",
    );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF to Text: all pages and literal hostile strings survive TXT/Markdown export", async () => {
  const p = await open("/pdf-to-text-extractor");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#workspace");
    assert.match(
      await p.$eval("#outputText", (e) => e.value),
      /Fixture page 3/,
    );
    await fill(p, "#searchInput", "Fixture");
    await fill(p, "#replaceInput", "<script>");
    await click(p, "#replaceAllBtn");
    assert.equal(
      await p.$eval("#matchView", (e) => Boolean(e.querySelector("script"))),
      false,
    );
    await click(p, "#downloadTxtBtn");
    assert.match((await download(p)).bytes.toString(), /<script>/);
    await click(p, "#downloadMdBtn");
    assert.match((await download(p, 1)).name, /\.md$/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Highlight Extractor: genuine annotations export source pages, TXT and CSV", async () => {
  const p = await open("/pdf-highlighter-extractor");
  try {
    await upload(p, "#fileInput", fixtures.annotations);
    await visible(p, "#resultsBox");
    assert.match(
      await p.$eval("#groupsWrap", (e) => e.textContent),
      /Highlight this sentence/,
    );
    await click(p, "#exportTxtBtn");
    assert.match(
      (await download(p)).bytes.toString(),
      /Highlight this sentence/,
    );
    await click(p, "#exportCsvBtn");
    assert.match(
      (await download(p, 1)).bytes.toString(),
      /Highlight this sentence/,
    );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Password Protect: matching password produces encrypted, readable PDF", async () => {
  const p = await open("/tools/password-protect-pdf");
  try {
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#passwordBox");
    await fill(p, "#password1", "Strong-test-123!");
    await fill(p, "#password2", "wrong");
    assert.ok(await p.$eval("#lockBtn", (e) => e.disabled));
    await fill(p, "#password2", "Strong-test-123!");
    await click(p, "#lockBtn");
    await visible(p, "#successBox");
    await p.evaluate(() => downloadLocked());
    const out = await download(p);
    const info = await pdfInfo(p, out.bytes, "Strong-test-123!");
    assert.equal(info.length, 3);
    assert.match(info[0].text, /Fixture page 1/);
    await assert.rejects(() => PDFDocument.load(out.bytes), /encrypted/i);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("PDF Unlock: wrong-password recovery and successful retained-text export", async () => {
  const p = await open("/tools/pdf-unlock");
  try {
    await upload(p, "#fileInput", fixtures.encrypted);
    await visible(p, "#unlockBox");
    await fill(p, "#pdfPassword", "wrong");
    await click(p, "#unlockBtn");
    await visible(p, "#errorMsg");
    assert.match(await p.$eval("#errorMsg", (e) => e.textContent), /password/i);
    await fill(p, "#pdfPassword", "test-password");
    await click(p, "#unlockBtn");
    await visible(p, "#successBox");
    await p.evaluate(() => downloadUnlocked());
    const info = await pdfInfo(p, (await download(p)).bytes);
    assert.equal(info.length, 3);
    assert.match(info[2].text, /Fixture page 3/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
for (const [name, route, button] of [
  ["Image Format Converter", "/tools/image-format-converter", "#convertBtn"],
  ["WebP to JPG", "/tools/webp-to-jpg", "#convertBtn"],
  ["Image Compressor", "/tools/image-compressor", "#compressBtn"],
  ["Image Resize", "/tools/image-resize", "#resizeBtn"],
]) {
  test(`${name}: output dimensions, encoding and transparency match the chosen format`, async () => {
    const p = await open(route);
    try {
      const fixture = name === "WebP to JPG" ? fixtures.webp : fixtures.png;
      await upload(p, "#uploadZone input", fixture, fixture);
      await visible(p, "#fileSection");
      if (name === "Image Compressor") await fill(p, "#qualitySlider", "50");
      if (name === "Image Resize") await fill(p, "#percentSlider", "50");
      if (name === "Image Format Converter")
        await click(p, '[data-format="png"]');
      await click(p, button);
      await visible(p, "#resultsSection");
      await click(p, "#resultsList button");
      const out = await download(p);
      const image = await imageInfo(p, out.bytes, out.type);
      assert.equal(image.width, name === "Image Resize" ? 120 : 240);
      assert.equal(image.height, name === "Image Resize" ? 60 : 120);
      if (name === "WebP to JPG") {
        assert.equal(image.pixel[3], 255);
        assert.ok(
          image.pixel[0] > 240 && image.pixel[1] > 240 && image.pixel[2] > 240,
        );
        assert.match(out.name, /\.jpg$/);
      } else {
        assert.match(out.name, /\.png$/);
        assert.equal(out.bytes.subarray(1, 4).toString(), "PNG");
        assert.equal(image.pixel[3], 0, "PNG transparency must survive");
      }
      await click(p, "#downloadAllBtn");
      const zip = await download(p, 1);
      assert.deepEqual([...zip.bytes.subarray(0, 2)], [80, 75]);
      assert.deepEqual(p.testErrors, []);
    } finally {
      await p.close();
    }
  });
}
test("Sign PDF: repeated exports, hidden pages, rotation and cleared signatures", async () => {
  const p = await open("/tools/sign-pdf", {
    viewport: { width: 390, height: 844 },
  });
  try {
    await upload(p, "#fileInput", fixtures.corrupt);
    await p.waitForFunction(
      () => document.getElementById("fileInput").value === "",
    );
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#editor");
    await p.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 100;
      c.height = 40;
      const x = c.getContext("2d");
      x.fillStyle = "red";
      x.fillRect(0, 0, 100, 40);
      placeSignature(c.toDataURL());
      applyToAll();
      applyToAll();
    });
    assert.equal(await p.$$(".signature").then((x) => x.length), 3);
    await p.evaluate(() => downloadPDF());
    const first = await download(p);
    const renders = await renderPdf(p, first.bytes, "signed-mobile");
    for (const r of renders)
      assert.ok(
        r.center[0] > 230 && r.center[1] < 30 && r.center[2] < 30,
        "Signature should be centered on the displayed page, including rotated pages",
      );
    await p.evaluate(() => downloadPDF());
    const second = await download(p, 1);
    for (const out of [first, second]) {
      const info = await pdfInfo(p, out.bytes);
      assert.equal(info.length, 3);
      const doc = await PDFDocument.load(out.bytes);
      for (const pg of doc.getPages())
        assert.equal(
          pg.node.Resources().lookup(PDFName.of("XObject")).keys().length,
          1,
        );
    }
    await p.evaluate(() => {
      clearAll();
    });
    await p.evaluate(() => downloadPDF());
    const clean = await PDFDocument.load((await download(p, 2)).bytes);
    for (const pg of clean.getPages())
      assert.equal(
        pg.node.Resources().lookup(PDFName.of("XObject"))?.keys().length || 0,
        0,
      );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Redact PDF: scan, review gate, retry and retained physical dimensions", async () => {
  const p = await open("/tools/redact-pdf");
  try {
    await upload(p, "#fileInput", fixtures.annotations);
    await p.waitForFunction(
      () => document.getElementById("statusPill").textContent === "PDF loaded",
    );
    await click(p, "#scanBtn");
    await p.waitForFunction(
      () =>
        document.getElementById("statusPill").textContent === "Scan complete",
    );
    assert.match(
      await p.$eval("#resultsList", (e) => e.textContent),
      /Email IDs1/,
    );
    await click(p, "#reviewConfirmed");
    await click(p, "#downloadPdfBtn");
    const redacted = (await download(p)).bytes;
    assert.equal((await pdfInfo(p, redacted))[0].text, "");
    await renderPdf(p, redacted, "redacted-sensitive");
    const covered = await p.evaluate(async (data) => {
      const doc = await pdfjsLib.getDocument({ data: Uint8Array.from(data) })
        .promise;
      const pg = await doc.getPage(1);
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      await pg.render({
        canvasContext: ctx,
        viewport: pg.getViewport({ scale: 1 }),
      }).promise;
      const pixels = ctx.getImageData(26, 211, 100, 12).data;
      await doc.destroy();
      return Array.from(pixels).every((v, i) =>
        i % 4 === 3 ? v === 255 : v < 30,
      );
    }, Array.from(redacted));
    assert.equal(
      covered,
      true,
      "Opaque redaction must also cover descending letters",
    );
    await click(p, "#clearBtn");
    await upload(p, "#fileInput", fixtures.pdf);
    await p.waitForFunction(
      () => document.getElementById("statusPill").textContent === "PDF loaded",
    );
    await p.evaluate(() => {
      getOcrBoxes = async () => ({ regions: [], counts: { email: 0 } });
    });
    await click(p, "#scanBtn");
    await p.waitForFunction(
      () =>
        document.getElementById("statusPill").textContent === "Scan complete",
    );
    assert.ok(await p.$eval("#downloadPdfBtn", (e) => e.disabled));
    await click(p, "#reviewConfirmed");
    await click(p, "#downloadPdfBtn");
    const info = await pdfInfo(p, (await download(p, 1)).bytes);
    assert.deepEqual(
      info.map((x) => [x.width, x.height]),
      [
        [320, 400],
        [300, 200],
        [340, 200],
      ],
    );
    assert.ok(info.every((x) => !x.text));
    await p.evaluate(() => {
      getOcrBoxes = async () => {
        throw new Error("Synthetic OCR failure");
      };
    });
    await click(p, "#scanBtn");
    await p.waitForFunction(() =>
      document.getElementById("statusPill").textContent.includes("Scan failed"),
    );
    assert.equal(await p.$eval("#scanBtn", (e) => e.disabled), false);
    assert.equal(await p.$eval("#downloadPdfBtn", (e) => e.disabled), true);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Scratchpad: immediate export and switching notes preserve pending edits", async () => {
  const p = await open("/pdf-scratchpad", {
    init: () => localStorage.setItem("pdf_scratchpad_notes", "{broken"),
  });
  try {
    await fill(p, "#noteContent", "Synthetic unsaved draft — अध्याय");
    await click(p, "#downloadBtn");
    assert.equal(
      (await download(p)).bytes.toString(),
      "Synthetic unsaved draft — अध्याय",
    );
    await fill(p, "#noteContent", "Latest edit");
    await click(p, "#newNoteBtn");
    await click(p, "#notesList li:last-child");
    assert.equal(await p.$eval("#noteContent", (e) => e.value), "Latest edit");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Image to Text: genuine local OCR returns text and TXT output", async () => {
  const p = await open("/tools/image-to-text");
  p.setDefaultTimeout(90000);
  try {
    await upload(p, "#fileInput", fixtures.ocr);
    await visible(p, "#result");
    const text = await p.$eval("#textOutput", (e) => e.value);
    assert.match(text, /SYNTHETIC TEST 123/i);
    await p.evaluate(() => downloadText());
    assert.match((await download(p)).bytes.toString(), /SYNTHETIC TEST 123/i);
    assert.deepEqual(p.testErrors, []);
    assert.equal(p.outbound.filter((x) => x.includes("ocr.space")).length, 0);
  } finally {
    await p.close();
  }
});
test("Presentation Maker: buttons produce valid PPTX and two-page PDF", async () => {
  const p = await open("/presentation-maker");
  try {
    await p.evaluate(() => {
      app.presentation.name = "Synthetic deck";
      app.presentation.slides = [
        {
          background: "#ffffff",
          elements: [
            {
              type: "text",
              text: "Synthetic slide — अध्याय",
              x: 30,
              y: 30,
              width: 500,
              height: 150,
              font: "Arial",
              size: 24,
              color: "#000000",
            },
          ],
        },
        { background: "#ff0000", elements: [] },
      ];
      renderSlides();
    });
    await click(p, "#exportPptxBtn");
    const pptx = await download(p);
    assert.equal(pptx.name, "Synthetic deck.pptx");
    const xml = await p.evaluate(async (data) => {
      const z = await JSZip.loadAsync(Uint8Array.from(data));
      return {
        text: await z.file("ppt/slides/slide1.xml").async("string"),
        background: await z.file("ppt/slides/slide2.xml").async("string"),
        dimensions: await z.file("ppt/presentation.xml").async("string"),
      };
    }, Array.from(pptx.bytes));
    assert.match(xml.text, /अध्याय/);
    assert.match(xml.text, /sz="1800"/);
    assert.match(xml.background, /FF0000/i);
    assert.match(xml.dimensions, /cx="9144000"/);
    await click(p, "#exportPdfBtn");
    const deckPdf = (await download(p, 1)).bytes;
    assert.equal((await pdfInfo(p, deckPdf)).length, 2);
    await renderPdf(p, deckPdf, "presentation-export");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Flashcards: AI response validation, coverage, Unicode CSV and same-file retry", async () => {
  let response = { error: "Synthetic service unavailable" };
  const p = await open("/tools/pdf-to-flashcards", {
    intercept: (req) => {
      if (req.method() === "OPTIONS")
        req.respond({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "POST",
          },
        });
      else if (req.url().endsWith("/ai/chat"))
        req.respond({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(response),
        });
      else req.abort();
    },
  });
  try {
    await p.evaluate(() => onTurnstileSuccess("synthetic-local-only"));
    await upload(p, "#fileInput", fixtures.pdf);
    await p.waitForFunction(() =>
      document
        .getElementById("loadingText")
        .textContent.includes("Synthetic service unavailable"),
    );
    await p.waitForFunction(
      () => document.getElementById("fileInput").value === "",
    );
    response = {
      choices: [
        {
          message: {
            content:
              '```json\n[{"front":"=2+2","back":"अध्याय — Synthetic answer"}]\n```',
          },
        },
      ],
    };
    await p.evaluate(() => onTurnstileSuccess("synthetic-local-only"));
    await upload(p, "#fileInput", fixtures.pdf);
    await visible(p, "#fcApp");
    assert.match(await p.$eval("#documentScope", (e) => e.textContent), /3/);
    await click(p, "#exportBtn");
    const csv = (await download(p)).bytes.toString();
    assert.match(csv, /अध्याय/);
    assert.match(csv, /'=2\+2/);
    await p.waitForFunction(
      () => document.getElementById("fileInput").value === "",
    );
    response = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                front: "Synthetic question",
                back: "Long answer content. ".repeat(400) + "END OF ANSWER",
              },
            ]),
          },
        },
      ],
    };
    await p.evaluate(() => onTurnstileSuccess("synthetic-local-only"));
    await upload(p, "#fileInput", fixtures.pdf);
    await p.waitForFunction(() =>
      document.getElementById("backText").textContent.includes("END OF ANSWER"),
    );
    await click(p, "#downloadPdfBtn");
    const flashPdf = (await download(p, 1)).bytes;
    const pages = await pdfInfo(p, flashPdf);
    await renderPdf(p, flashPdf, "flashcards-long");
    assert.ok(pages.length > 1);
    assert.ok(pages.some((pg) => pg.text.includes("END OF ANSWER")));
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
for (const [name, route, fixture, extension] of [
  ["PDF to Word", "/tools/pdf-to-word", "pdf", ".docx"],
  ["Word to PDF", "/tools/word-to-pdf", "rtf", ".pdf"],
]) {
  test(`${name}: rejects invalid provider output and permits retry`, async () => {
    let valid = false;
    const p = await open(route, {
      intercept: async (req) => {
        const headers = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "POST",
        };
        if (req.method() === "OPTIONS")
          return req.respond({ status: 204, headers });
        if (req.url().endsWith("/convert/token"))
          return req.respond({
            status: 200,
            headers,
            contentType: "application/json",
            body: '{"token":"synthetic-ticket"}',
          });
        if (req.url().includes("/convert/")) {
          let body = Buffer.from("<html>Provider error</html>");
          if (valid) {
            if (extension === ".pdf") body = fs.readFileSync(fixtures.pdf);
            else body = fs.readFileSync(fixtures.docx);
          }
          return req.respond({
            status: 200,
            headers,
            contentType: "application/octet-stream",
            body,
          });
        }
        req.abort();
      },
    });
    try {
      await p.evaluate(() => onTurnstileSuccess("synthetic-local-only"));
      await upload(p, "#fileInput", fixtures[fixture]);
      await p.waitForFunction(
        () => document.getElementById("fileInput").value === "",
      );
      assert.ok(p.testAlerts.some((x) => /valid|invalid|expected/i.test(x)));
      valid = true;
      await p.evaluate(() => onTurnstileSuccess("synthetic-local-only"));
      await upload(p, "#fileInput", fixtures[fixture]);
      await visible(p, "#resultsSection");
      await click(p, "#downloadBtn");
      assert.ok((await download(p)).name.endsWith(extension));
      assert.deepEqual(p.testErrors, []);
    } finally {
      await p.close();
    }
  });
}
test("HTML to PDF: hostile URLs are removed and multi-page content exports", async () => {
  const p = await open("/tools/html-to-pdf");
  try {
    await fill(
      p,
      "#codeArea",
      '<h1>Synthetic document</h1><img src="//external.invalid/leak"><a href="/\\external.invalid">unsafe</a><script>window.bad=1</script>' +
        Array.from(
          { length: 90 },
          (_, i) => "<p>Paragraph " + i + " — अध्याय</p>",
        ).join(""),
    );
    await p.evaluate(() => showTab("preview"));
    assert.equal(
      await p.$eval("#previewArea", (e) =>
        Boolean(e.querySelector("script,img[src],a[href]")),
      ),
      false,
    );
    await p.evaluate(() => downloadPDF());
    assert.ok((await pdfInfo(p, (await download(p)).bytes)).length > 1);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Resume Builder: Unicode TXT/DOCX, escaped markup and PDF export", async () => {
  const p = await open("/resume-cv-builder");
  try {
    await fill(p, "#fullName", "Synthetic अध्याय <script>");
    for (const template of await p.$$eval("#templateSelect option", (items) =>
      items.map((e) => e.value),
    )) {
      await p.select("#templateSelect", template);
      const contrast = await p.evaluate(() => ({
        name: getComputedStyle(document.querySelector(".resume-name")).color,
        background: getComputedStyle(document.querySelector(".resume-header"))
          .backgroundColor,
      }));
      assert.ok(
        contrast.name !== "rgb(255, 255, 255)" ||
          contrast.background !== "rgba(0, 0, 0, 0)",
        "White resume titles need a visible background",
      );
    }
    await p.select("#templateSelect", "classic");
    await click(p, "#exportTxtBtn");
    assert.match(
      (await download(p)).bytes.toString(),
      /Synthetic अध्याय <script>/,
    );
    await click(p, "#exportDocxBtn");
    const word = await download(p, 1);
    const xml = await p.evaluate(async (data) => {
      const z = await JSZip.loadAsync(Uint8Array.from(data));
      return z.file("word/document.xml").async("string");
    }, Array.from(word.bytes));
    assert.match(xml, /अध्याय/);
    assert.match(xml, /&lt;script&gt;/);
    await click(p, "#exportPdfBtn");
    const resumePdf = (await download(p, 2)).bytes;
    assert.ok((await pdfInfo(p, resumePdf)).length >= 1);
    await renderPdf(p, resumePdf, "resume-unicode");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Invoice Generator: amounts, bounded discounts and PDF/PNG outputs", async () => {
  const p = await open("/invoice-generator");
  try {
    await fill(p, '[data-field="quantity"]', "2");
    await fill(p, '[data-field="unitPrice"]', "50");
    await fill(p, '[data-field="tax"]', "10");
    await fill(p, '[data-field="discount"]', "5");
    assert.match(await p.$eval("#grandText", (e) => e.textContent), /105/);
    await fill(p, '[data-field="discount"]', "150");
    assert.match(await p.$eval("#grandText", (e) => e.textContent), /10/);
    await click(p, "#exportPdfBtn");
    assert.ok((await pdfInfo(p, (await download(p)).bytes)).length >= 1);
    await click(p, "#exportPngBtn");
    assert.equal((await download(p, 1)).bytes.subarray(1, 4).toString(), "PNG");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Passport Photo: mobile pan/export consistency and correct output dimensions", async () => {
  const p = await open("/tools/passport-photo-maker", {
    viewport: { width: 390, height: 844 },
  });
  try {
    await upload(p, "#uploadZone input", fixtures.png);
    await visible(p, "#editorSection");
    await p.select("#presetSelect", "custom");
    await fill(p, "#customW", "35");
    await fill(p, "#customH", "45");
    const wrap = await p.$("#canvasWrap");
    const box = await wrap.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2);
    await p.mouse.up();
    await click(p, "#generateBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadSingleBtn");
    const out = await download(p);
    const image = await imageInfo(p, out.bytes, out.type);
    assert.deepEqual([image.width, image.height], [413, 531]);
    await click(p, "#downloadSheetPngBtn");
    assert.equal((await download(p, 1)).bytes.subarray(1, 4).toString(), "PNG");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Compare PDFs: both documents render and rapid navigation recovers", async () => {
  const p = await open("/compare-pdf");
  try {
    await upload(p, "#file1", fixtures.pdf);
    await upload(p, "#file2", fixtures.second);
    await visible(p, "#viewerSection");
    await p.waitForFunction(() =>
      document.getElementById("textLayer1").textContent.includes("Fixture"),
    );
    await p.evaluate(() => {
      changePage(1, 1);
      zoomPanel(1, 1);
      zoomPanel(1, 1);
    });
    await p.waitForFunction(
      () => document.getElementById("pageInput1").value === "2",
    );
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(await p.$eval("#canvas2", (e) => e.width > 0));
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Text to Speech: stop prevents stale playback restart and PDF errors recover", async () => {
  const p = await open("/text-to-speech", {
    init: () => {
      window.__spoken = [];
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          getVoices: () => [{ name: "Synthetic", lang: "en-US" }],
          speak: (u) => {
            window.__spoken.push(u);
            u.onstart?.();
          },
          cancel() {},
          pause() {},
          resume() {},
        },
      });
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
        }
      };
    },
  });
  try {
    await fill(p, "#textInput", Array(450).fill("Synthetic").join(" "));
    await click(p, "#playBtn");
    assert.equal(await p.evaluate(() => window.__spoken.length), 1);
    await p.evaluate(() => stopAudio());
    await p.evaluate(() => window.__spoken[0].onend());
    assert.equal(await p.evaluate(() => window.__spoken.length), 1);
    await upload(p, "#pdfInput", fixtures.corrupt);
    await p.waitForFunction(() =>
      document
        .getElementById("pdfFileName")
        .textContent.includes("Could not read"),
    );
    await upload(p, "#pdfInput", fixtures.pdf);
    await p.waitForFunction(() =>
      document.getElementById("textInput").value.includes("Fixture page 3"),
    );
    assert.ok(await p.$eval("#dlAudioBtn", (e) => e.disabled));
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Speech to Text: recognition events preserve words and recover from errors", async () => {
  const p = await open("/speech-to-text", {
    init: () => {
      window.SpeechRecognition = class {
        constructor() {
          window.__recognizer = this;
        }
        start() {}
        stop() {}
      };
    },
  });
  try {
    await click(p, "#micBtn");
    await p.evaluate(() => {
      const result = [{ transcript: "Enterprise commander period" }];
      result.isFinal = true;
      window.__recognizer.onresult({ resultIndex: 0, results: [result] });
    });
    assert.match(
      await p.$eval("#textArea", (e) => e.value),
      /Enterprise commander \./,
    );
    await p.evaluate(() => window.__recognizer.onerror({ error: "network" }));
    assert.match(await p.$eval("#micStatus", (e) => e.textContent), /network/);
    assert.equal(
      await p.$eval("#micBtn", (e) => e.classList.contains("recording")),
      false,
    );
    await p.evaluate(() => downloadTxt());
    assert.match((await download(p)).bytes.toString(), /Enterprise/);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Remove Background: corrupt image reports a recoverable error", async () => {
  const p = await open("/remove-background");
  try {
    await upload(p, "#uploadZone input", fixtures.corruptImage);
    await visible(p, "#errorSection");
    assert.match(
      await p.$eval("#errorMessage", (e) => e.textContent),
      /decode/,
    );
    await click(p, "#backBtn");
    await visible(p, "#uploadZone");
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Image Resize: locked dimensions use actual ratio; duplicate ZIP names survive", async () => {
  const p = await open("/tools/image-resize");
  try {
    await upload(p, "#uploadZone input", fixtures.png, fixtures.png);
    await visible(p, "#fileSection");
    await click(p, '[data-mode="dimensions"]');
    await fill(p, "#widthInput", "100");
    await click(p, "#resizeBtn");
    await visible(p, "#resultsSection");
    await click(p, "#downloadAllBtn");
    const out = await download(p);
    const entries = await p.evaluate(async (data) => {
      const z = await JSZip.loadAsync(Uint8Array.from(data));
      const files = Object.values(z.files);
      return Promise.all(
        files.map(async (f) => {
          const img = await createImageBitmap(
            new Blob([await f.async("uint8array")]),
          );
          return [img.width, img.height];
        }),
      );
    }, Array.from(out.bytes));
    assert.deepEqual(entries, [
      [100, 50],
      [100, 50],
    ]);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("HEIC to JPG: genuine synthetic HEIC decodes; corrupt image reports failure", async () => {
  const p = await open("/tools/heic-to-jpg");
  try {
    await upload(
      p,
      "#uploadZone input",
      fixtures.heic,
      fixtures.heic,
      fixtures.corruptHeic,
    );
    await visible(p, "#fileSection");
    await click(p, "#convertBtn");
    await visible(p, "#resultsSection");
    assert.match(
      await p.$eval(".batch-result-status", (e) => e.textContent),
      /2 of 3/,
    );
    await click(p, "#resultsList button");
    const out = await download(p);
    assert.deepEqual([...out.bytes.subarray(0, 3)], [255, 216, 255]);
    const image = await imageInfo(p, out.bytes, out.type);
    assert.deepEqual([image.width, image.height], [240, 120]);
    await click(p, "#downloadAllBtn");
    assert.deepEqual(
      [...(await download(p, 1)).bytes.subarray(0, 2)],
      [80, 75],
    );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("QR Generator: exported PNG decodes to the actual URL", async () => {
  const p = await open("/tools/qr-code-generator");
  try {
    await fill(p, "#textInput", "onlinepdfpro.com/tools");
    await p.evaluate(() => generateQR());
    await p.evaluate(() => downloadPNG("qr-text-0"));
    const out = await download(p);
    const pixels = await p.evaluate(async (data) => {
      const img = await createImageBitmap(
        new Blob([Uint8Array.from(data)], { type: "image/png" }),
      );
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      return {
        data: Array.from(
          c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
        ),
        width: c.width,
        height: c.height,
      };
    }, Array.from(out.bytes));
    const jsQR = (await import("jsqr")).default;
    assert.equal(
      jsQR(Uint8ClampedArray.from(pixels.data), pixels.width, pixels.height)
        ?.data,
      "https://onlinepdfpro.com/tools",
    );
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Native PDF uploads: corrupt-file error and same-input recovery", async () => {
  for (const [route, section] of [
    ["/tools/crop-pdf", "#cropContainer"],
    ["/tools/delete-pdf-pages", "#topControls"],
    ["/tools/add-page-numbers-to-pdf", "#optionsBox"],
  ]) {
    const p = await open(route);
    try {
      await upload(p, "#fileInput", fixtures.corrupt);
      await p.waitForFunction(
        () => document.getElementById("fileInput").value === "",
      );
      assert.ok(p.testAlerts.some((message) => /Could not open/.test(message)));
      await upload(p, "#fileInput", fixtures.pdf);
      await visible(p, section);
      assert.deepEqual(p.testErrors, []);
    } finally {
      await p.close();
    }
  }
});
test("Shared uploads: empty/type rejection and missing mobile MIME recovery", async () => {
  const p = await open("/tools/image-compressor");
  try {
    const result = await p.evaluate(
      async (data) => {
        let calls = 0,
          output = null;
        const config = {
          accept: "image/png,image/jpeg",
          maxFiles: 10,
          maxSize: 5000000,
          onFilesSelected: (files) => {
            calls++;
            output = files[0];
          },
        };
        OnlinePDFPro.FileUploader.handleFiles(
          [new File([], "empty.png", { type: "image/png" })],
          config,
        );
        OnlinePDFPro.FileUploader.handleFiles(
          [new File(["unsupported"], "file.txt", { type: "text/plain" })],
          config,
        );
        OnlinePDFPro.FileUploader.handleFiles(
          [new File([Uint8Array.from(data)], "camera.png", { type: "" })],
          config,
        );
        return {
          calls,
          type: output?.type,
          bytes: output
            ? Array.from(new Uint8Array(await output.arrayBuffer()))
            : [],
        };
      },
      Array.from(fs.readFileSync(fixtures.png)),
    );
    assert.equal(result.calls, 1);
    assert.equal(result.type, "image/png");
    assert.deepEqual(Buffer.from(result.bytes), fs.readFileSync(fixtures.png));
    assert.equal(p.testAlerts.length, 2);
    assert.deepEqual(p.testErrors, []);
  } finally {
    await p.close();
  }
});
test("Every registered tool: initial script execution and local dependencies load", async () => {
  for (const tool of registry) {
    const p = await open(tool.href);
    try {
      assert.ok(await p.$("main h1"), `${tool.name}: primary heading`);
      assert.deepEqual(
        p.testErrors,
        [],
        `${tool.name}: initial browser errors`,
      );
    } finally {
      await p.close();
    }
  }
});

try {
  for (const item of cases) {
    if (
      process.env.TOOL_FILTER &&
      !item.name.toLowerCase().includes(process.env.TOOL_FILTER.toLowerCase())
    )
      continue;
    try {
      await item.run();
      results.push({ name: item.name, status: "pass" });
      console.log(`PASS ${item.name}`);
    } catch (error) {
      results.push({ name: item.name, status: "fail", error: error.message });
      console.log(`FAIL ${item.name}: ${error.message}`);
    }
  }
  fs.writeFileSync(
    path.join(scratch, "results.json"),
    JSON.stringify(results, null, 2),
  );
  if (results.some((x) => x.status === "fail")) process.exitCode = 1;
} finally {
  await finish();
}
