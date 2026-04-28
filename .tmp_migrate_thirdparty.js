const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dirs = ['.', 'tools', 'blog'];
let changed = 0;
let processed = 0;

function listHtml(dir) {
  return fs.readdirSync(path.join(root, dir))
    .filter(f => f.toLowerCase().endsWith('.html'))
    .map(f => path.join(root, dir, f));
}

const files = dirs.flatMap(listHtml);

for (const filePath of files) {
  let text = fs.readFileSync(filePath, 'utf8');
  const original = text;
  processed++;

  const hadThirdParty = /googlesyndication|googletagmanager|www\.clarity\.ms\/tag|gtag\(/i.test(text);

  text = text.replace(/<!--\s*Google tag \(gtag\.js\)\s*-->[\s\S]*?gtag\('config',\s*'G-VMPCXTN3ES'[\s\S]*?<\/script>\s*/gi, '');
  text = text.replace(/<script\s+async\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-VMPCXTN3ES"><\/script>\s*<script>[\s\S]*?<\/script>\s*/gi, '');

  text = text.replace(/<!--\s*Google AdSense Head\s*-->\s*/gi, '');
  text = text.replace(/<script[^>]*src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^\"]*"[^>]*><\/script>\s*/gi, '');

  text = text.replace(/<!--\s*Microsoft Clarity\s*-->[\s\S]*?\)\(window,\s*document,\s*"clarity",\s*"script",\s*"vu83gydexm"\);\s*<\/script>\s*/gi, '');
  text = text.replace(/<script[^>]*>\s*\(function\s*\(c,\s*l,\s*a,\s*r,\s*i,\s*t,\s*y\)[\s\S]*?"vu83gydexm"\);\s*<\/script>\s*/gi, '');

  if (hadThirdParty && !/third-party-loader\.js/i.test(text)) {
    const rel = path.relative(root, filePath).replace(/\\/g, '/');
    const prefix = rel.startsWith('tools/') || rel.startsWith('blog/') ? '../js/third-party-loader.js' : 'js/third-party-loader.js';
    text = text.replace(/<\/head>/i, '    <script defer src="' + prefix + '"></script>\n</head>');
  }

  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf8');
    changed++;
  }
}

console.log('HTML_PROCESSED', processed);
console.log('HTML_CHANGED', changed);
