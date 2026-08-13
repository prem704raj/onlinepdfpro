const { rssPlugin } = require('@11ty/eleventy-plugin-rss');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);

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
  eleventyConfig.addPassthroughCopy('src/**/*.wasm');
  eleventyConfig.addPassthroughCopy('src/**/*.gz');
  // Required for GitHub Pages custom domain + Cloudflare Pages headers
  eleventyConfig.addPassthroughCopy('src/CNAME');
  eleventyConfig.addPassthroughCopy('src/_headers');

  // Custom filters
  eleventyConfig.addFilter('startsWith', function(str, prefix) {
    return typeof str === 'string' && str.startsWith(prefix);
  });

  // Blog posts collection
  eleventyConfig.addCollection('blog', function(collectionApi) {
    return collectionApi.getFilteredByGlob('src/blog/*.md').reverse();
  });

  // Safe HTML minification transform.
  // The previous regex minifier stripped newlines/whitespace from the WHOLE
  // document — including inline <script>/<style>/<pre>/<textarea> content —
  // which can corrupt JavaScript string literals and rendered whitespace.
  // This version shields those regions before minifying the rest.
  eleventyConfig.addTransform('htmlmin', function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith('.html')) return content;

    // Protect regions that must keep their exact whitespace/content
    const protectedBlocks = [];
    const PROTECTED_RE = /<(script|style|pre|textarea)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
    content = content.replace(PROTECTED_RE, (match) => {
      protectedBlocks.push(match);
      return `@@PROTECTED_${protectedBlocks.length - 1}@@`;
    });

    let minified = content
      // strip comments but keep IE conditional comments
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
