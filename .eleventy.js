module.exports = function(eleventyConfig) {
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
