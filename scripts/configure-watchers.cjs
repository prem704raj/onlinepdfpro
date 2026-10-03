const chokidar = require('chokidar');
const picomatch = require('picomatch');
const installed = Symbol.for('onlinepdfpro.chokidar4.compatibility');
const normalize = value => value.replace(/\\/g, '/').replace(/^\.\//, '');

// Watch the containing directory instead of a glob so new files are detected.
// This deliberately includes all source files in those directories. Eleventy
// still applies its own template and passthrough rules when rebuilding.
function roots(paths) {
  return [...new Set([paths].flat(Infinity).map(value => {
    const input = value.replace(/\\/g, '/');
    const magic = input.search(/[*?{[(!]/);
    if (magic < 0) return input;
    const prefix = input.slice(0, magic);
    const slash = prefix.lastIndexOf('/');
    return slash < 0 ? '.' : prefix.slice(0, slash + 1);
  }))];
}

function ignores(entries) {
  const matchers = [entries || []].flat(Infinity).map(entry => {
    if (typeof entry === 'function') return entry;
    if (entry instanceof RegExp) return value => { entry.lastIndex = 0; return entry.test(value); };
    const pattern = normalize(entry);
    const match = picomatch(pattern, { dot: true });
    const directory = pattern.endsWith('/**') ? pattern.slice(0, -3) : null;
    return value => {
      const path = normalize(value);
      return match(path) || (directory && path === directory);
    };
  });
  return (path, stats) => matchers.some(match => match(path, stats));
}

function configure(watcherModule) {
  if (watcherModule[installed]) return;
  const watch = watcherModule.watch;
  watcherModule.watch = (paths, options = {}) => {
    const watcher = watch(roots(paths), { ...options, ignored: ignores(options.ignored) });
    // Eleventy's glob cache expects POSIX paths. Chokidar 4 emits native
    // separators on Windows, including for newly added files.
    const emit = watcher.emit.bind(watcher);
    const fileEvents = new Set(['add', 'change', 'unlink', 'addDir', 'unlinkDir']);
    watcher.emit = (event, ...args) => {
      if (fileEvents.has(event) && typeof args[0] === 'string') args[0] = args[0].replace(/\\/g, '/');
      if (event === 'all' && typeof args[1] === 'string') args[1] = args[1].replace(/\\/g, '/');
      return emit(event, ...args);
    };
    const add = watcher.add.bind(watcher);
    watcher.add = paths => add(roots(paths));
    return watcher;
  };
  watcherModule[installed] = true;
}

module.exports = async function configureWatchers() {
  // Chokidar has distinct CommonJS and ESM exports. Eleventy uses ESM while
  // its development server and Nunjucks use CommonJS; configure both once.
  configure(chokidar);
  configure((await import('chokidar')).default);
};
