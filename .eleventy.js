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
  eleventyConfig.addPassthroughCopy('src/**/*.svg');
  eleventyConfig.addPassthroughCopy('src/**/*.ico');
  eleventyConfig.addPassthroughCopy('src/**/*.xml');
  eleventyConfig.addPassthroughCopy('src/**/*.txt');
  eleventyConfig.addPassthroughCopy('src/**/*.py');
  eleventyConfig.addPassthroughCopy('src/**/*.json');
  eleventyConfig.addPassthroughCopy('src/**/*.webmanifest');
  eleventyConfig.addPassthroughCopy('src/**/*.woff2');

  // Custom filters
  eleventyConfig.addFilter('startsWith', function(str, prefix) {
    return typeof str === 'string' && str.startsWith(prefix);
  });

  // Blog posts collection
  eleventyConfig.addCollection('blog', function(collectionApi) {
    return collectionApi.getFilteredByGlob('src/blog/*.md').reverse();
  });

  // HTML minification transform
  eleventyConfig.addTransform('htmlmin', function(content, outputPath) {
    if (!outputPath || !outputPath.endsWith('.html')) return content;
    return content
      .replace(/\s{2,}/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\n/g, '')
      .replace(/\t/g, '')
      .trim();
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
