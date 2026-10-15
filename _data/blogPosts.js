// Existing articles are maintained in src/blog and survive every clean build.
const fs = require('fs');
const path = require('path');
const directory = path.join(__dirname, '..', 'blog');
module.exports = fs.readdirSync(directory, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'index.html')))
  .map(entry => ({ url: `/blog/${entry.name}/` }))
  .sort((a, b) => a.url.localeCompare(b.url));
