# OnlinePDFPro

OnlinePDFPro is a privacy-conscious web toolkit for working with PDFs, images, documents, QR codes, and related productivity tasks.

For core PDF workflows, processing is designed to happen in the browser so files do not need to be uploaded to an external processing server.

## Website

https://onlinepdfpro.com

## Main Features

- PDF merge, split, compress, crop, rotate, redact, sign, watermark, lock, and unlock
- PDF editing and page-management utilities
- PDF to Word and Word to PDF workflows
- JPG/image to PDF conversion
- OCR and image-to-text tools
- Image compression, resizing, cropping, and format conversion
- QR code generation
- PDF summarization, flashcards, and document-assistance tools
- PWA/service-worker support
- Blog, help, support, legal, and documentation pages

## Tech Stack

- **Eleventy 3** for site generation
- **Nunjucks/Markdown/HTML** templates and pages
- **JavaScript** for browser-side tools
- **pdf-lib** and related PDF libraries
- **Tesseract** and other committed browser-side vendor runtimes
- **Puppeteer** for regression/test workflows
- **Supabase migrations** for backend data features
- **Cloudflare-oriented headers/redirects and worker code** for deployment/runtime services

## Project Structure

```text
onlinepdfpro/
├── src/                # Eleventy source content and tool pages
│   ├── _data/
│   ├── _includes/
│   └── tools/
├── tools/              # Published/root tool pages
├── js/                 # Client-side scripts and vendor libraries
├── css/                # Styling
├── scripts/            # Build, regression, release and performance scripts
├── cf-worker/          # Cloudflare Worker code
├── services/           # Supporting services
├── supabase/           # Database migrations
├── _site/              # Generated site output
├── .eleventy.js        # Eleventy configuration
├── sw.js               # Service worker
└── package.json
```

## Requirements

- Node.js **22.12.0 or newer**
- npm

## Development

Install dependencies:

```bash
npm install
```

Start the Eleventy development server:

```bash
npm run dev
```

## Build

Generate the deployable site:

```bash
npm run build
```

The build cleans the output, runs Eleventy, writes release metadata, and versions the service worker.

## Tests

Run the regression and PDF-editor checks:

```bash
npm test
```

Check the performance budget:

```bash
npm run perf:budget
```

## Deployment

The repository contains deployment assets for static hosting, including:

- `CNAME` for **onlinepdfpro.com**
- `_headers`
- `_redirects`
- generated `_site/` output
- service-worker/PWA assets

## Contact

- Website: https://onlinepdfpro.com
- Support: support@onlinepdfpro.com