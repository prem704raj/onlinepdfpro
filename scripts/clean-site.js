#!/usr/bin/env node
// The Eleventy CLI does not expose a clean flag in this version. Remove only
// the generated output directory before a build so deleted source files can
// never leak back into the published site.
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', '_site');
if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
