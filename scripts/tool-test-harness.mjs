import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { PDFDocument, PDFName, degrees, rgb } from "pdf-lib";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const scratch = path.join(root, ".tmp_tool_audit");
fs.mkdirSync(scratch, { recursive: true });
export const fixtures = {};
const write = (name, bytes) => {
  const target = path.join(scratch, name);
  fs.writeFileSync(target, bytes);
  return target;
};
const digital = await PDFDocument.create();
digital.setTitle("Synthetic workflow fixture");
for (const [index, dimensions] of [
  [0, [320, 400]],
  [1, [200, 300]],
  [2, [400, 240]],
]) {
  const page = digital.addPage(dimensions);
  page.drawText(`Fixture page ${index + 1}`, { x: 35, y: 130, size: 14 });
  page.drawText("Synthetic study document text", { x: 35, y: 155, size: 10 });
  page.drawRectangle({
    x: 35,
    y: 30,
    width: 50,
    height: 50,
    color: rgb(index === 0 ? 1 : 0, index === 1 ? 1 : 0, index === 2 ? 1 : 0),
  });
  if (index === 1) page.setRotation(degrees(90));
  if (index === 2) page.setCropBox(30, 20, 340, 200);
}
fixtures.pdf = write("three-pages.pdf", await digital.save());
const second = await PDFDocument.create();
second.addPage([250, 350]).drawText("Second file", { x: 25, y: 250, size: 14 });
fixtures.second = write("second.pdf", await second.save());
const annotated = await PDFDocument.create();
const ap = annotated.addPage([320, 400]);
ap.drawText("Highlight this sentence", { x: 25, y: 300, size: 12 });
ap.drawText("test@example.com", { x: 25, y: 180, size: 12 });
const highlight = annotated.context.register(
  annotated.context.obj({
    Type: "Annot",
    Subtype: "Highlight",
    Rect: [24, 298, 160, 314],
    QuadPoints: [24, 314, 160, 314, 24, 298, 160, 298],
    C: [1, 1, 0],
    Contents: "Synthetic note",
    F: 4,
  }),
);
ap.node.addAnnot(highlight);
const link = annotated.context.register(
  annotated.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [25, 200, 125, 220],
    A: { Type: "Action", S: "URI", URI: "https://example.com" },
  }),
);
ap.node.addAnnot(link);
const field = annotated.getForm().createTextField("test-name");
field.setText("Synthetic answer");
field.addToPage(ap, { x: 25, y: 240, width: 200, height: 25 });
fixtures.annotations = write("annotations.pdf", await annotated.save());
fixtures.encrypted = write(
  "encrypted.pdf",
  await encryptPDF(
    new Uint8Array(fs.readFileSync(fixtures.pdf)),
    "test-password",
    "owner-password",
    { printing: true },
  ),
);
fixtures.corrupt = write("corrupt.pdf", Buffer.from("This is not a PDF"));
fixtures.empty = write("empty.pdf", Buffer.alloc(0));
fixtures.text = write("unsupported.txt", Buffer.from("Synthetic text"));
fixtures.corruptImage = write(
  "corrupt.png",
  Buffer.from("Invalid image bytes"),
);
fixtures.heic = path.join(root, "scripts/fixtures/synthetic.heic");
fixtures.corruptHeic = write("corrupt.heic", Buffer.from("Invalid HEIC bytes"));

const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".wasm": "application/wasm",
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let target = path.resolve(
    root,
    "_site",
    "." + decodeURIComponent(url.pathname),
  );
  if (url.pathname.startsWith("/__fixture/"))
    target = path.join(scratch, path.basename(url.pathname));
  else if (!target.startsWith(path.join(root, "_site") + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  if (!path.extname(target)) target += ".html";
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader(
    "Content-Type",
    types[path.extname(target)] || "application/octet-stream",
  );
  res.end(fs.readFileSync(target));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
export const base = `http://127.0.0.1:${server.address().port}`;
export const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const imagePage = await browser.newPage();
for (const [name, mime] of [
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["webp", "image/webp"],
]) {
  const data = await imagePage.evaluate((mime) => {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 120;
    const x = c.getContext("2d");
    x.fillStyle = "red";
    x.fillRect(0, 0, 120, 120);
    x.fillStyle = "blue";
    x.fillRect(120, 0, 120, 120);
    x.clearRect(0, 0, 30, 30);
    return c.toDataURL(mime, 0.9).split(",")[1];
  }, mime);
  fixtures[name] = write(`sample.${name}`, Buffer.from(data, "base64"));
}
const ocrImage = await imagePage.evaluate(() => {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 220;
  const x = c.getContext("2d");
  x.fillStyle = "#fff";
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#000";
  x.font = "48px Arial";
  x.fillText("SYNTHETIC TEST 123", 40, 90);
  x.fillText("Local browser OCR", 40, 170);
  return c.toDataURL("image/png").split(",")[1];
});
fixtures.ocr = write("ocr-text.png", Buffer.from(ocrImage, "base64"));
fixtures.rtf = write(
  "synthetic.rtf",
  Buffer.from("{\\rtf1\\ansi Synthetic conversion fixture}"),
);
const scan = await PDFDocument.create();
const scanPage = scan.addPage([240, 120]);
const scanImage = await scan.embedPng(fs.readFileSync(fixtures.png));
scanPage.drawImage(scanImage, { x: 0, y: 0, width: 240, height: 120 });
fixtures.scan = write("scan.pdf", await scan.save());
await imagePage.close();
const archivePage = await browser.newPage();
await archivePage.addScriptTag({ url: base + "/js/vendor/jszip/jszip.min.js" });
const wordFixture = await archivePage.evaluate(async () => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Synthetic conversion output</w:t></w:r></w:p><w:sectPr/></w:body></w:document>',
  );
  return Array.from(await zip.generateAsync({ type: "uint8array" }));
});
fixtures.docx = write("synthetic.docx", Buffer.from(wordFixture));
await archivePage.close();

export async function open(route, options = {}) {
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  await page.setViewport(
    options.viewport ||
      (process.env.TOOL_MOBILE === "1"
        ? { width: 390, height: 844, isMobile: true, hasTouch: true }
        : { width: 1280, height: 900 }),
  );
  await page.setBypassServiceWorker(true);
  page.testErrors = [];
  page.testAlerts = [];
  page.outbound = [];
  page.on("pageerror", (e) => page.testErrors.push(e.message));
  page.on("dialog", async (d) => {
    page.testAlerts.push(d.message());
    await d.accept();
  });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().startsWith(base) || /^(data|blob):/.test(req.url()))
      req.continue();
    else if (options.intercept) options.intercept(req, page);
    else {
      page.outbound.push(req.url());
      req.abort();
    }
  });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("pwa-dismissed", "true");
    window.__downloads = [];
    window.__blobUrls = new Map();
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.__blobUrls.set(url, blob);
      return url;
    };
    window.__captureDownload = async (blob, name) => {
      if (!(blob instanceof Blob)) return;
      window.__downloads.push({
        name,
        type: blob.type,
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
      });
    };
    const capture = (event) => {
      const a = event.target.closest?.("a[download]");
      if (!a) return;
      event.preventDefault();
      const blob = window.__blobUrls.get(a.href);
      if (blob) window.__captureDownload(blob, a.download);
      else if (a.href.startsWith("data:"))
        fetch(a.href)
          .then((r) => r.blob())
          .then((b) => window.__captureDownload(b, a.download));
    };
    document.addEventListener("click", capture, true);
    const nativeClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (!this.isConnected && this.download) {
        capture({ target: this, preventDefault() {} });
        return;
      }
      nativeClick.call(this);
    };
    const nativeDispatch = HTMLAnchorElement.prototype.dispatchEvent;
    HTMLAnchorElement.prototype.dispatchEvent = function (event) {
      if (event.type === "click" && !this.isConnected && this.download) {
        capture({ target: this, preventDefault() {} });
        return true;
      }
      return nativeDispatch.call(this, event);
    };
  });
  if (options.init) await page.evaluateOnNewDocument(options.init);
  await page.goto(base + route, { waitUntil: "load" });
  await page.evaluate(() => {
    if (window.OnlinePDFPro?.Downloader)
      OnlinePDFPro.Downloader.saveBlob = window.__captureDownload;
  });
  if (process.env.TOOL_MOBILE === "1") {
    const close = page.close.bind(page);
    page.close = async () => {
      try {
        const dimensions = await page.evaluate(() => ({
          width: window.innerWidth,
          content: document.documentElement.scrollWidth,
        }));
        assert.ok(dimensions.content <= dimensions.width + 1,
          `${route}: loaded workflow overflows the mobile page (${dimensions.content}px > ${dimensions.width}px)`);
      } finally {
        await close();
      }
    };
  }
  return page;
}
export async function upload(page, selector, ...files) {
  const input = await page.$(selector);
  assert.ok(input, `File input missing: ${selector}`);
  await input.uploadFile(...files);
}
export async function visible(page, selector) {
  await page.waitForSelector(selector, { visible: true });
}
export async function fill(page, selector, value) {
  await page.$eval(
    selector,
    (el, value) => {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    String(value),
  );
}
export async function click(page, selector) {
  await page.waitForFunction(
    (selector) => !document.querySelector(selector)?.disabled,
    {},
    selector,
  );
  await page.$eval(selector, (e) =>
    e.scrollIntoView({ behavior: "instant", block: "center" }),
  );
  await new Promise((r) => setTimeout(r, 150));
  await page.click(selector);
}
export async function download(page, index = 0) {
  try {
    await page.waitForFunction(
      (index) => window.__downloads.length > index,
      {},
      index,
    );
  } catch (error) {
    throw new Error(
      `Download ${index} missing: ${page.testErrors.join("; ")}; alerts: ${page.testAlerts.join("; ")}`,
    );
  }
  const result = await page.evaluate(
    (index) => window.__downloads[index],
    index,
  );
  return { ...result, bytes: Buffer.from(result.bytes) };
}
export async function pdfInfo(page, bytes, password) {
  if (!(await page.evaluate(() => Boolean(window.pdfjsLib))))
    await page.addScriptTag({ url: base + "/js/vendor/pdfjs/pdf.min.js" });
  return page.evaluate(
    async ({ data, password }) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/js/vendor/pdfjs/pdf.worker.min.js";
      const doc = await pdfjsLib.getDocument({
        data: Uint8Array.from(data),
        password,
      }).promise;
      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i);
        const text = await p.getTextContent();
        const viewport = p.getViewport({ scale: 1 });
        pages.push({
          text: text.items.map((t) => t.str).join(" "),
          width: viewport.width,
          height: viewport.height,
          rotation: p.rotate,
          annotations: (await p.getAnnotations()).map((a) => a.subtype),
        });
      }
      await doc.destroy();
      return pages;
    },
    { data: Array.from(bytes), password },
  );
}
export async function imageInfo(page, bytes, type) {
  return page.evaluate(
    async ({ data, type }) => {
      const img = await createImageBitmap(
        new Blob([Uint8Array.from(data)], { type }),
      );
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return {
        width: img.width,
        height: img.height,
        pixel: Array.from(ctx.getImageData(0, 0, 1, 1).data),
      };
    },
    { data: Array.from(bytes), type },
  );
}
export async function renderPdf(page, bytes, name) {
  await pdfInfo(page, bytes);
  const rendered = await page.evaluate(async (data) => {
    const doc = await pdfjsLib.getDocument({ data: Uint8Array.from(data) })
        .promise,
      result = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pg = await doc.getPage(n),
        vp = pg.getViewport({ scale: 1 });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vp.width);
      c.height = Math.ceil(vp.height);
      await pg.render({ canvasContext: c.getContext("2d"), viewport: vp })
        .promise;
      result.push({
        png: c.toDataURL().split(",")[1],
        center: Array.from(
          c
            .getContext("2d")
            .getImageData(
              Math.floor(c.width / 2),
              Math.floor(c.height / 2),
              1,
              1,
            ).data,
        ),
      });
    }
    await doc.destroy();
    return result;
  }, Array.from(bytes));
  rendered.forEach((r, i) =>
    fs.writeFileSync(
      path.join(scratch, `${name}-${i + 1}.png`),
      Buffer.from(r.png, "base64"),
    ),
  );
  return rendered;
}
export async function finish() {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
