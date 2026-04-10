# OnlinePDFPro

OnlinePDFPro is a privacy-first PDF tools website where processing happens directly in the browser.

## About

- 100% browser-based PDF processing
- No file uploads to external servers for core tools
- Free tools for editing, converting, compressing, and organizing PDFs
- Includes PWA support and offline-friendly behavior

## Main Features

- Essential PDF tools: merge, split, compress, sign, lock/unlock, repair
- Conversion tools: PDF ↔ Word/Excel/PPT, images ↔ PDF, HTML ↔ PDF
- Utility tools: crop, rotate, watermark, delete pages, add page numbers, OCR
- Extra utilities: image tools, QR tools, and blog/help pages

## Project Structure

- `index.html` – homepage
- `tools.html` – tools listing and discovery
- `tools/` – individual tool pages
- `css/` – styling
- `js/` – client-side scripts
- `sw.js` – service worker and caching

## Run Locally

This project is a static website.

1. Clone the repository
2. Open the project directory
3. Serve it with any static server, for example:

```bash
npx serve .
```

Then open the local URL shown in your terminal.

## Deployment

The site is intended to be hosted as a static site (for example via GitHub Pages or similar hosting).

## Contact

- Website: https://onlinepdfpro.com
- Support: support@onlinepdfpro.com
