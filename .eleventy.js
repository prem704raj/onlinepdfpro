module.exports = function(eleventyConfig) {
  // Expose the single public tool registry under an explicit, collision-free
  // template name. The data file remains the source of truth; this alias keeps
  // directory, sitemap, search, and navigation templates on the same object.
  eleventyConfig.addGlobalData('toolRegistry', require('./src/_data/tools.js'));

  // Process only njk and md templates; copy html files as-is
  eleventyConfig.setTemplateFormats(['njk', 'md']);

  // Passthrough copies for all static assets
  eleventyConfig.addPassthroughCopy('src/**/*.html');
  eleventyConfig.addPassthroughCopy('src/**/*.css');
  eleventyConfig.addPassthroughCopy('src/**/*.js');
  eleventyConfig.addPassthroughCopy('src/**/*.png');
  eleventyConfig.addPassthroughCopy('src/**/*.jpg');
  eleventyConfig.addPassthroughCopy('src/**/*.jpeg');
  eleventyConfig.addPassthroughCopy('src/**/*.svg');
  eleventyConfig.addPassthroughCopy('src/**/*.ico');
  eleventyConfig.addPassthroughCopy('src/**/*.xml');
  eleventyConfig.addPassthroughCopy('src/**/*.txt');
  eleventyConfig.addPassthroughCopy('src/**/*.py');
  eleventyConfig.addPassthroughCopy('src/**/*.json');
  eleventyConfig.addPassthroughCopy('src/**/*.webmanifest');
  eleventyConfig.addPassthroughCopy('src/**/*.woff2');
  eleventyConfig.addPassthroughCopy('src/**/*.ttf');
  eleventyConfig.addPassthroughCopy('src/**/*.otf');
  eleventyConfig.addPassthroughCopy('src/**/*.wasm');
  eleventyConfig.addPassthroughCopy('src/**/*.gz');
  // Vendor libraries are committed under the repository-level js/ directory
  // because several of them are large binary/runtime assets. Copy them into
  // the deployable site as well; otherwise an _site-only Pages deployment
  // would publish the HTML without the libraries its tools load. The two
  // fontkit files are sourced from src/js/vendor so they are not copied twice.
  [
    'docx', 'download', 'file-saver', 'heic2any', 'html2canvas', 'jspdf',
    'jszip', 'marked', 'pdf-decrypt', 'pdf-encrypt', 'pdf-lib-plus-encrypt',
    'pdfjs', 'pdflib', 'pptxgenjs', 'qr-code-styling', 'tesseract'
  ].forEach(name => eleventyConfig.addPassthroughCopy({ [`js/vendor/${name}`]: `js/vendor/${name}` }));
  // Required for GitHub Pages custom domain + Cloudflare Pages headers
  eleventyConfig.addPassthroughCopy('src/CNAME');
  eleventyConfig.addPassthroughCopy('src/_headers');
  eleventyConfig.addPassthroughCopy('src/_redirects');

  // Custom filters
  eleventyConfig.addFilter('startsWith', function(str, prefix) {
    return typeof str === 'string' && str.startsWith(prefix);
  });
  eleventyConfig.addFilter('json', function(value) {
    return JSON.stringify(value);
  });

  // Safe HTML minification transform.
  eleventyConfig.addTransform('htmlmin', function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith('.html')) return content;

    const protectedBlocks = [];
    const PROTECTED_RE = /<(script|style|pre|textarea)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
    content = content.replace(PROTECTED_RE, (match) => {
      protectedBlocks.push(match);
      return `@@PROTECTED_${protectedBlocks.length - 1}@@`;
    });

    let minified = content
      .replace(/<!--(?!\[if\s)[\s\S]*?-->/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/^\s+|\s+$/g, '')
      .trim();

    minified = minified.replace(/@@PROTECTED_(\d+)@@/g, (_, i) => protectedBlocks[Number(i)]);
    return minified;
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data'
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
};
