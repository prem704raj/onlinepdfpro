import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Eleventy from '@11ty/eleventy';

const originalDirectory = process.cwd();
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'onlinepdfpro-watch-'));
const helper = fileURLToPath(new URL('./configure-watchers.cjs', import.meta.url));
let eleventy;
const waitFor = async predicate => {
  const deadline = Date.now() + 15000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'Watcher must rebuild within 15 seconds');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};
const contains = (file, text) => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(text);
try {
  process.chdir(fixture);
  fs.mkdirSync('src/nested', { recursive: true });
  fs.writeFileSync('src/index.njk', '<h1>Initial template</h1>');
  fs.writeFileSync('src/nested/style.css', 'body { color: red; }');
  fs.writeFileSync('eleventy.config.cjs', `
    module.exports = async config => {
      await require(${JSON.stringify(helper)})();
      config.setTemplateFormats(['njk']);
      config.addPassthroughCopy('src/**/*.css');
      config.addPassthroughCopy('src/**/*.html');
      return { dir: { input: 'src', output: '_site' } };
    };
  `);
  eleventy = new Eleventy('src', '_site', { configPath: 'eleventy.config.cjs', quietMode: true, runMode: 'watch' });
  await eleventy.init();
  let completedBuilds = 0;
  eleventy.eleventyConfig.userConfig.on('eleventy.afterwatch', () => { completedBuilds++; });
  await eleventy.watch();
  await waitFor(() => Object.values(eleventy.watcher.getWatched()).some(files => files.includes('index.njk')));
  assert.ok(contains('_site/index.html', 'Initial template'));
  fs.writeFileSync('src/index.njk', '<h1>Changed template</h1>');
  await waitFor(() => completedBuilds >= 1 && contains('_site/index.html', 'Changed template'));
  console.log('PASS upgraded watcher rebuilds modified templates');
  fs.writeFileSync('src/nested/new.njk', '<h1>New nested template</h1>');
  await waitFor(() => completedBuilds >= 2 && contains('_site/nested/new/index.html', 'New nested template'));
  console.log('PASS upgraded watcher detects new nested templates');
  fs.writeFileSync('src/nested/style.css', 'body { color: blue; }');
  await waitFor(() => completedBuilds >= 3 && contains('_site/nested/style.css', 'blue'));
  fs.writeFileSync('src/nested/tool.html', '<h1>New standalone tool</h1>');
  await waitFor(() => completedBuilds >= 4 && contains('_site/nested/tool.html', 'New standalone tool'));
  console.log('PASS upgraded watcher copies changed CSS and new standalone HTML');
  let outputTriggeredBuild = false;
  eleventy.eleventyConfig.userConfig.on('eleventy.beforeWatch', () => { outputTriggeredBuild = true; });
  fs.writeFileSync('_site/output-only.html', 'Output must not trigger a rebuild');
  await new Promise(resolve => setTimeout(resolve, 750));
  assert.equal(outputTriggeredBuild, false, 'Generated output must remain ignored');
  console.log('PASS upgraded watcher ignores generated output');
} finally {
  if (eleventy?.watcher) await eleventy.stopWatch();
  process.chdir(originalDirectory);
  assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(fixture).startsWith('onlinepdfpro-watch-'));
  fs.rmSync(fixture, { recursive: true, force: true });
}
