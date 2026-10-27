var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// C:/Users/prem7/AppData/Local/npm-cache/_npx/542913bf16b226c7/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// pdf-api-proxy.js
var PROD_ORIGINS = [
  "https://onlinepdfpro.com",
  "https://www.onlinepdfpro.com"
];
var DEV_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
];
var MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
var MAX_CONVERSION_SIZE = 50 * 1024 * 1024;
var MAX_JSON_SIZE = 256 * 1024;
var MAX_VISION_JSON_SIZE = 40 * 1024 * 1024;
var MAX_AI_MESSAGES = 40;
var MAX_AI_MESSAGE_CHARS = 12e4;
var MAX_AI_IMAGE_CHARS = 32 * 1024 * 1024;
var CONVERSION_PATHS = /* @__PURE__ */ new Set(["/convert/pdf-to-word", "/convert/word-to-pdf"]);
var PROTECTED_PATHS = /* @__PURE__ */ new Set([
  "/ai/chat",
  "/ai/vision",
  "/convert/token",
  ...CONVERSION_PATHS,
  "/store/create-order",
  "/store/verify-payment",
  "/store/download",
  "/store/my-purchases",
  "/store/razorpay-webhook"
]);
var WEBHOOK_PATHS = /* @__PURE__ */ new Set(["/store/razorpay-webhook"]);
var ALLOWED_CHAT_MODELS = /* @__PURE__ */ new Set([
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
]);
var ALLOWED_VISION_MODELS = /* @__PURE__ */ new Set([
  "openrouter/free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
  "meta-llama/llama-3.2-11b-vision-instruct:free"
]);
function getAllowedOrigins(env2) {
  const isProd = (env2.ENVIRONMENT || "production") === "production";
  return isProd ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];
}
__name(getAllowedOrigins, "getAllowedOrigins");
function requestIp(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}
__name(requestIp, "requestIp");
function rateLimiterFor(env2, pathname) {
  if (pathname === "/ai/chat") return env2.AI_CHAT_LIMITER;
  if (pathname === "/ai/vision") return env2.AI_VISION_LIMITER;
  if (CONVERSION_PATHS.has(pathname) || pathname === "/convert/token") {
    return env2.CONVERSION_LIMITER;
  }
  return env2.API_RATE_LIMITER;
}
__name(rateLimiterFor, "rateLimiterFor");
async function enforceRateLimit(request, env2, pathname) {
  const limiter = rateLimiterFor(env2, pathname);
  if (!limiter || typeof limiter.limit !== "function") {
    const production = (env2.ENVIRONMENT || "production") === "production";
    return { allowed: !production, unavailable: production };
  }
  try {
    const key = `${requestIp(request)}:${pathname}`;
    const result = await limiter.limit({ key });
    return { allowed: result?.success === true, unavailable: false };
  } catch (err) {
    console.error("[RateLimit] binding failed", pathname, err);
    return { allowed: false, unavailable: true };
  }
}
__name(enforceRateLimit, "enforceRateLimit");
var pdf_api_proxy_default = {
  async fetch(request, env2) {
    const allowedOrigins = getAllowedOrigins(env2);
    const url = new URL(request.url);
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    if (request.method === "OPTIONS") {
      return handleCORS(request, allowedOrigins);
    }
    const origin = request.headers.get("Origin") || "";
    if (origin && !allowedOrigins.includes(origin)) {
      return jsonResponse({ error: "Origin not allowed." }, 403, corsHeaders);
    }
    if (url.pathname !== "/health" && PROTECTED_PATHS.has(url.pathname) && !WEBHOOK_PATHS.has(url.pathname)) {
      const rate = await enforceRateLimit(request, env2, url.pathname);
      if (!rate.allowed) {
        return jsonResponse(
          { error: rate.unavailable ? "Service protection is temporarily unavailable." : "Rate limit exceeded. Try again shortly." },
          rate.unavailable ? 503 : 429,
          corsHeaders
        );
      }
    }
    if (request.method === "POST") {
      const contentLength = Number(request.headers.get("content-length") || 0);
      const limit = CONVERSION_PATHS.has(url.pathname) ? MAX_CONVERSION_SIZE : url.pathname === "/ai/vision" ? MAX_VISION_JSON_SIZE : url.pathname === "/store/razorpay-webhook" ? 256 * 1024 : MAX_UPLOAD_SIZE;
      if (Number.isFinite(contentLength) && contentLength > limit) {
        return jsonResponse({ error: `Payload too large. Maximum size is ${Math.round(limit / 1024 / 1024)}MB.` }, 413, corsHeaders);
      }
    }
    if (url.pathname === "/store/razorpay-webhook" && request.method === "POST") {
      return handleRazorpayWebhook(request, env2, allowedOrigins);
    }
    const ip = requestIp(request);
    if (url.pathname === "/convert/token" && request.method === "POST") {
      const token = request.headers.get("x-turnstile-token") || request.headers.get("cf-turnstile-response");
      if (!await verifyTurnstile(token, ip, env2)) {
        return jsonResponse({ error: "Security verification failed. Please complete the verification and try again." }, 403, corsHeaders);
      }
      let targetPath = "";
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const parsed = await request.clone().json();
          if (typeof parsed?.target === "string") targetPath = parsed.target;
        } catch {
        }
      }
      if (!targetPath) {
        targetPath = url.searchParams.get("target") || request.headers.get("x-target-path") || "";
      }
      if (!targetPath || !CONVERSION_PATHS.has(targetPath)) {
        return jsonResponse({ error: "A valid conversion target route is required (/convert/pdf-to-word or /convert/word-to-pdf)." }, 400, corsHeaders);
      }
      const ticket = await issueConversionTicket(request, env2, targetPath);
      if (!ticket) return jsonResponse({ error: "Conversion service is not configured." }, 503, corsHeaders);
      return jsonResponse({ token: ticket, expires_in: 300, target: targetPath }, 200, corsHeaders);
    }
    if (CONVERSION_PATHS.has(url.pathname) && request.method === "POST") {
      if (!await verifyConversionTicket(request, env2, url.pathname)) {
        return jsonResponse({ error: "Conversion authorization expired or invalid for this route. Please retry the verification." }, 403, corsHeaders);
      }
      return handleConversion(request, env2, url.pathname, corsHeaders);
    }
    if (url.pathname === "/ai/chat" && request.method === "POST") {
      const turnstileToken = request.headers.get("x-turnstile-token") || request.headers.get("cf-turnstile-response");
      const isHuman = await verifyTurnstile(turnstileToken, ip, env2);
      if (!isHuman) {
        return jsonResponse({ error: "Security verification failed. Please refresh the page and try again." }, 403, getCORSHeaders(request, allowedOrigins));
      }
      return handleGroqChat(request, env2, allowedOrigins);
    }
    if (url.pathname === "/ai/vision" && request.method === "POST") {
      const turnstileToken = request.headers.get("x-turnstile-token") || request.headers.get("cf-turnstile-response");
      const isHuman = await verifyTurnstile(turnstileToken, ip, env2);
      if (!isHuman) {
        return jsonResponse({ error: "Security verification failed. Please refresh the page and try again." }, 403, getCORSHeaders(request, allowedOrigins));
      }
      return handleOpenRouterVision(request, env2, allowedOrigins);
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "OnlinePDFPro API Proxy",
        version: "1.0.0",
        // The deploy pipeline injects the commit SHA. Never keep a
        // hard-coded historical release here: a stale value makes a
        // healthy-but-old Worker indistinguishable from the current
        // deployment.
        release: env2.RELEASE_ID || "local",
        routes: ["/ai/chat", "/ai/vision", "/convert/token", "/convert/pdf-to-word", "/convert/word-to-pdf", "/store/create-order", "/store/verify-payment", "/store/razorpay-webhook", "/store/download", "/store/my-purchases"]
      }), {
        headers: { "Content-Type": "application/json", ...getCORSHeaders(request, allowedOrigins) }
      });
    }
    if (url.pathname === "/store/create-order" && request.method === "POST") {
      return handleCreateOrder(request, env2, allowedOrigins);
    }
    if (url.pathname === "/store/verify-payment" && request.method === "POST") {
      return handleVerifyPayment(request, env2, allowedOrigins);
    }
    if (url.pathname === "/store/download" && request.method === "POST") {
      return handleDownload(request, env2, allowedOrigins);
    }
    if (url.pathname === "/store/my-purchases" && request.method === "POST") {
      return handleMyPurchases(request, env2, allowedOrigins);
    }
    return jsonResponse({ error: "Not found." }, 404, corsHeaders);
  }
};
function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
__name(jsonResponse, "jsonResponse");
function getCORSHeaders(request, allowedOrigins) {
  allowedOrigins = allowedOrigins || PROD_ORIGINS;
  const origin = request.headers.get("Origin") || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Turnstile-Token, cf-turnstile-response, X-Conversion-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (allowedOrigins.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
__name(getCORSHeaders, "getCORSHeaders");
async function verifyTurnstile(token, ip, env2) {
  const secret = env2.TURNSTILE_SECRET_KEY;
  if (!secret || typeof token !== "string" || token.length === 0 || token.length > 2048) return false;
  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);
    if (ip && ip !== "unknown") formData.append("remoteip", ip);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    let res;
    try {
      res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return false;
    const outcome = await res.json();
    const hostname = String(outcome.hostname || "").toLowerCase();
    const allowedHostnames = String(env2.TURNSTILE_ALLOWED_HOSTNAMES || "onlinepdfpro.com,www.onlinepdfpro.com").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    const hostnameValid = (env2.ENVIRONMENT || "production") !== "production" && !hostname ? true : allowedHostnames.includes(hostname);
    return outcome.success === true && hostnameValid;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}
__name(verifyTurnstile, "verifyTurnstile");
function handleCORS(request, allowedOrigins) {
  const origin = request.headers.get("Origin") || "";
  if (origin && !allowedOrigins.includes(origin)) {
    return jsonResponse({ error: "Origin not allowed." }, 403, getCORSHeaders(request, allowedOrigins));
  }
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(request, allowedOrigins)
  });
}
__name(handleCORS, "handleCORS");
function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}
__name(base64UrlDecode, "base64UrlDecode");
function hasPrefix(bytes, prefix) {
  if (!(bytes instanceof Uint8Array) || bytes.length < prefix.length) return false;
  return prefix.every((value, index) => bytes[index] === value);
}
__name(hasPrefix, "hasPrefix");
function isPdfBytes(bytes) {
  return hasPrefix(bytes, [37, 80, 68, 70, 45]);
}
__name(isPdfBytes, "isPdfBytes");
function isZipBytes(bytes) {
  return hasPrefix(bytes, [80, 75, 3, 4]) || hasPrefix(bytes, [80, 75, 5, 6]) || hasPrefix(bytes, [80, 75, 7, 8]);
}
__name(isZipBytes, "isZipBytes");
function readLe16(bytes, offset) {
  return (bytes[offset] || 0) | (bytes[offset + 1] || 0) << 8;
}
__name(readLe16, "readLe16");
function readLe32(bytes, offset) {
  return ((bytes[offset] || 0) | (bytes[offset + 1] || 0) << 8 | (bytes[offset + 2] || 0) << 16 | (bytes[offset + 3] || 0) << 24) >>> 0;
}
__name(readLe32, "readLe32");
function readZipEntries(bytes) {
  if (!isZipBytes(bytes) || bytes.length > MAX_CONVERSION_SIZE) return null;
  const start = Math.max(0, bytes.length - 65557);
  let eocd = -1;
  for (let offset2 = bytes.length - 22; offset2 >= start; offset2 -= 1) {
    if (readLe32(bytes, offset2) === 101010256) {
      eocd = offset2;
      break;
    }
  }
  if (eocd < 0) return null;
  const total = readLe16(bytes, eocd + 10);
  const centralSize = readLe32(bytes, eocd + 12);
  const centralOffset = readLe32(bytes, eocd + 16);
  if (!total || total > 1e4 || centralOffset + centralSize > bytes.length) return null;
  const entries = [];
  let offset = centralOffset;
  for (let index = 0; index < total; index += 1) {
    if (readLe32(bytes, offset) !== 33639248) return null;
    const nameLength = readLe16(bytes, offset + 28);
    const extraLength = readLe16(bytes, offset + 30);
    const commentLength = readLe16(bytes, offset + 32);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > bytes.length) return null;
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    entries.push({
      name,
      method: readLe16(bytes, offset + 10),
      compressedSize: readLe32(bytes, offset + 20),
      uncompressedSize: readLe32(bytes, offset + 24),
      localOffset: readLe32(bytes, offset + 42)
    });
    offset = end;
  }
  return entries;
}
__name(readZipEntries, "readZipEntries");
function isDocxBytes(bytes) {
  const entries = readZipEntries(bytes);
  if (!entries) return false;
  const names = new Set(entries.map((entry) => entry.name));
  return names.has("[Content_Types].xml") && names.has("word/document.xml");
}
__name(isDocxBytes, "isDocxBytes");
function isOdtBytes(bytes) {
  const entries = readZipEntries(bytes);
  const mimetype = entries?.find((entry) => entry.name === "mimetype");
  if (!mimetype || !entries.some((entry) => entry.name === "content.xml") || mimetype.method !== 0 || mimetype.uncompressedSize > 128) return false;
  const localOffset = mimetype.localOffset;
  if (readLe32(bytes, localOffset) !== 67324752) return false;
  const nameLength = readLe16(bytes, localOffset + 26);
  const extraLength = readLe16(bytes, localOffset + 28);
  const start = localOffset + 30 + nameLength + extraLength;
  const end = start + mimetype.compressedSize;
  if (end > bytes.length) return false;
  return new TextDecoder().decode(bytes.slice(start, end)).startsWith("application/vnd.oasis.opendocument.text");
}
__name(isOdtBytes, "isOdtBytes");
function isOleBytes(bytes) {
  return hasPrefix(bytes, [208, 207, 17, 224, 161, 177, 26, 225]);
}
__name(isOleBytes, "isOleBytes");
function isRtfBytes(bytes) {
  const sample = new TextDecoder("ascii").decode(bytes.slice(0, 64)).replace(/^\uFEFF/, "").trimStart();
  return /^\{\\rtf[0-9]/i.test(sample);
}
__name(isRtfBytes, "isRtfBytes");
function isValidConversionDocument(pathname, bytes) {
  if (pathname === "/convert/pdf-to-word") return isPdfBytes(bytes);
  if (pathname === "/convert/word-to-pdf") return isDocxBytes(bytes) || isOdtBytes(bytes) || isOleBytes(bytes) || isRtfBytes(bytes);
  return false;
}
__name(isValidConversionDocument, "isValidConversionDocument");
function isValidConversionOutput(pathname, bytes) {
  return pathname === "/convert/pdf-to-word" ? isDocxBytes(bytes) : isPdfBytes(bytes);
}
__name(isValidConversionOutput, "isValidConversionOutput");
async function signTicket(secret, message) {
  if (!secret) return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}
__name(signTicket, "signTicket");
async function verifyTicketSignature(secret, message, signature) {
  const signatureBytes = base64UrlDecode(signature);
  if (!secret || !signatureBytes) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(message));
}
__name(verifyTicketSignature, "verifyTicketSignature");
async function issueConversionTicket(request, env2, targetPath) {
  const secret = env2.CONVERSION_SIGNING_SECRET;
  if (!secret || !targetPath) return null;
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const payload = {
    path: targetPath,
    exp: Math.floor(Date.now() / 1e3) + 300,
    ip: requestIp(request),
    jti: base64UrlEncode(nonceBytes)
  };
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signTicket(secret, encoded);
  return signature ? `${encoded}.${signature}` : null;
}
__name(issueConversionTicket, "issueConversionTicket");
async function verifyConversionTicket(request, env2, pathname) {
  const token = request.headers.get("x-conversion-token") || "";
  const [encoded, signature] = token.split(".");
  const bytes = base64UrlDecode(encoded);
  if (!bytes || !signature) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.path !== pathname) return false;
    if (!CONVERSION_PATHS.has(pathname)) return false;
    if (payload.exp < Math.floor(Date.now() / 1e3)) return false;
    if (payload.ip !== requestIp(request)) return false;
    return await verifyTicketSignature(env2.CONVERSION_SIGNING_SECRET, encoded, signature);
  } catch {
    return false;
  }
}
__name(verifyConversionTicket, "verifyConversionTicket");
async function handleConversion(request, env2, pathname, corsHeaders) {
  const upstream = pathname === "/convert/pdf-to-word" ? env2.PDF_TO_WORD_URL || "https://prem736raj--pdf2docx-convert.modal.run" : env2.WORD_TO_PDF_URL || "https://prem736raj--docx2pdf-convert.modal.run";
  const production = (env2.ENVIRONMENT || "production") === "production";
  if (production && !env2.MODAL_API_TOKEN) {
    console.error("[Conversion] MODAL_API_TOKEN is not configured");
    return jsonResponse({ error: "Conversion service is temporarily unavailable." }, 503, corsHeaders);
  }
  const contentType = request.headers.get("content-type") || "application/octet-stream";
  if (contentType.length > 200 || !/^(application\/pdf|application\/octet-stream|application\/vnd\.|application\/msword|application\/rtf|application\/zip|text\/rtf)/i.test(contentType)) {
    return jsonResponse({ error: "Unsupported document type." }, 415, corsHeaders);
  }
  try {
    const body = await request.arrayBuffer();
    if (!body.byteLength || body.byteLength > MAX_CONVERSION_SIZE) return jsonResponse({ error: "File is empty or exceeds the 50MB limit." }, 413, corsHeaders);
    if (!isValidConversionDocument(pathname, new Uint8Array(body))) {
      return jsonResponse({ error: "The file contents do not match a supported document format." }, 415, corsHeaders);
    }
    const headers = { "Content-Type": contentType, "Accept": "application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json" };
    if (env2.MODAL_API_TOKEN) headers.Authorization = `Bearer ${env2.MODAL_API_TOKEN}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12e4);
    let response;
    try {
      response = await fetch(upstream, { method: "POST", headers, body, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const message = (await response.text()).slice(0, 1e3);
      console.error("[Conversion] upstream failure", pathname, response.status, message);
      return jsonResponse({ error: "Conversion failed. Please verify the document and try again." }, response.status >= 500 ? 502 : 400, corsHeaders);
    }
    const output = await response.arrayBuffer();
    if (!output.byteLength || output.byteLength > 100 * 1024 * 1024) return jsonResponse({ error: "Conversion returned an invalid or oversized file." }, 502, corsHeaders);
    if (!isValidConversionOutput(pathname, new Uint8Array(output))) {
      console.error("[Conversion] upstream returned an invalid output signature", pathname);
      return jsonResponse({ error: "Conversion returned an invalid document." }, 502, corsHeaders);
    }
    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set("Content-Type", pathname.endsWith("pdf-to-word") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf");
    responseHeaders.set("Content-Disposition", "attachment");
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    return new Response(output, { status: 200, headers: responseHeaders });
  } catch (err) {
    console.error("[Conversion] request failed", pathname, err);
    return jsonResponse({ error: "Conversion service is temporarily unavailable." }, 502, corsHeaders);
  }
}
__name(handleConversion, "handleConversion");
async function supabaseQuery(env2, path, method, body, token, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": env2.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${token || env2.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extraHeaders
  };
  const opts = { method, headers };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15e3);
  opts.signal = controller.signal;
  try {
    const res = await fetch(`${env2.SUPABASE_URL}/rest/v1/${path}`, opts);
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
      return { ok: res.ok, status: res.status, data: text };
    }
  } finally {
    clearTimeout(timeout);
  }
}
__name(supabaseQuery, "supabaseQuery");
function isValidProductId(productId) {
  return typeof productId === "string" && productId.length > 0 && productId.length <= 100 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(productId);
}
__name(isValidProductId, "isValidProductId");
function isValidRazorpayId(value, prefix) {
  return typeof value === "string" && value.length <= 100 && new RegExp(`^${prefix}_[A-Za-z0-9_-]+$`).test(value);
}
__name(isValidRazorpayId, "isValidRazorpayId");
function integerAmount(value) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
__name(integerAmount, "integerAmount");
function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
__name(hexToBytes, "hexToBytes");
async function verifyHmacHex(secret, message, signature) {
  const signatureBytes = hexToBytes(signature);
  if (!secret || !signatureBytes) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(message)
  );
}
__name(verifyHmacHex, "verifyHmacHex");
function razorpayAuthHeader(env2) {
  return `Basic ${btoa(`${env2.RAZORPAY_KEY_ID}:${env2.RAZORPAY_KEY_SECRET}`)}`;
}
__name(razorpayAuthHeader, "razorpayAuthHeader");
async function razorpayRequest(env2, path, method = "GET", body) {
  const headers = {
    "Authorization": razorpayAuthHeader(env2),
    "Content-Type": "application/json"
  };
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers,
    ...body ? { body: JSON.stringify(body) } : {}
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data };
}
__name(razorpayRequest, "razorpayRequest");
async function getProduct(env2, productId) {
  return supabaseQuery(
    env2,
    `products?id=eq.${encodeURIComponent(productId)}&select=id,price_inr,title,status,r2_key`,
    "GET"
  );
}
__name(getProduct, "getProduct");
async function getOrderByRazorpayId(env2, razorpayOrderId) {
  const result = await supabaseQuery(
    env2,
    `orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&select=id,user_id,product_id,amount_inr,status,razorpay_payment_id,razorpay_signature&limit=1`,
    "GET"
  );
  return result;
}
__name(getOrderByRazorpayId, "getOrderByRazorpayId");
function safeDownloadFilename(r2Key) {
  const basename = String(r2Key || "").split("/").pop() || "download.pdf";
  const safe = basename.normalize("NFKC").replace(/[\u0000-\u001F\u007F"\\]/g, "_").replace(/[^A-Za-z0-9._() -]/g, "_").replace(/\s+/g, " ").trim().slice(0, 120);
  const filename = safe || "download.pdf";
  return /\.pdf$/i.test(filename) ? filename : `${filename}.pdf`;
}
__name(safeDownloadFilename, "safeDownloadFilename");
async function verifySupabaseJWT(env2, authHeader) {
  const match = typeof authHeader === "string" ? /^Bearer\s+([A-Za-z0-9._~-]{20,4096})$/.exec(authHeader.trim()) : null;
  if (!match || !env2.SUPABASE_URL || !env2.SUPABASE_SERVICE_ROLE_KEY) return null;
  const token = match[1];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8e3);
  try {
    const res = await fetch(`${env2.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": env2.SUPABASE_SERVICE_ROLE_KEY
      },
      signal: controller.signal
    });
    if (!res.ok) return null;
    const user = await res.json();
    return typeof user?.id === "string" && user.id.length <= 100 ? user.id : null;
  } catch (err) {
    console.error("[Store] Supabase JWT verification failed", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
__name(verifySupabaseJWT, "verifySupabaseJWT");
async function handleCreateOrder(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  try {
    if (!env2.RAZORPAY_KEY_ID || !env2.RAZORPAY_KEY_SECRET || !env2.SUPABASE_URL || !env2.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Store] create-order is missing server configuration");
      return jsonResponse({ error: "Checkout is temporarily unavailable." }, 503, corsHeaders);
    }
    const userId = await verifySupabaseJWT(env2, request.headers.get("Authorization"));
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return jsonResponse({ error: "Invalid request." }, 400, corsHeaders);
    }
    const { product_id } = body || {};
    if (!isValidProductId(product_id)) {
      return jsonResponse({ error: "A valid product is required." }, 400, corsHeaders);
    }
    const productRes = await getProduct(env2, product_id);
    if (!productRes.ok) {
      console.error("[Store] product lookup failed during create-order", productRes.status, productRes.data);
      return jsonResponse({ error: "Checkout is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(productRes.data) || !productRes.data.length || productRes.data[0].status !== "active") {
      return jsonResponse({ error: "Product not found" }, 404, corsHeaders);
    }
    const product = productRes.data[0];
    const amount = integerAmount(product.price_inr);
    if (!amount) {
      console.error("[Store] product has invalid price", product.id, product.price_inr);
      return jsonResponse({ error: "Checkout is temporarily unavailable." }, 503, corsHeaders);
    }
    const paidOrderRes = await supabaseQuery(
      env2,
      `orders?user_id=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(product.id)}&status=eq.paid&select=id&limit=1`,
      "GET"
    );
    if (!paidOrderRes.ok) {
      console.error("[Store] paid-entitlement lookup failed during create-order", paidOrderRes.status, paidOrderRes.data);
      return jsonResponse({ error: "Checkout is temporarily unavailable." }, 503, corsHeaders);
    }
    if (Array.isArray(paidOrderRes.data) && paidOrderRes.data.length) {
      return jsonResponse({
        code: "ALREADY_PURCHASED",
        error: "You already own this item. Open My Library.",
        library_url: "/library.html"
      }, 409, corsHeaders);
    }
    const rzpResult = await razorpayRequest(env2, "orders", "POST", { amount, currency: "INR" });
    if (!rzpResult.ok || !rzpResult.data?.id || integerAmount(rzpResult.data.amount) !== amount || rzpResult.data.currency !== "INR") {
      console.error("[Store] Razorpay order creation failed", rzpResult.status, rzpResult.data);
      return jsonResponse({ error: "Checkout is temporarily unavailable." }, 503, corsHeaders);
    }
    const rzpOrder = rzpResult.data;
    const insertRes = await supabaseQuery(env2, "orders", "POST", {
      user_id: userId,
      product_id: product.id,
      razorpay_order_id: rzpOrder.id,
      amount_inr: amount,
      status: "created"
    });
    if (!insertRes.ok) {
      console.error("[Store] order persistence failed after Razorpay order creation", insertRes.status, insertRes.data, rzpOrder.id);
      return jsonResponse({ error: "Checkout is temporarily unavailable. Please try again." }, 503, corsHeaders);
    }
    return jsonResponse({
      order_id: rzpOrder.id,
      amount,
      currency: rzpOrder.currency,
      key: env2.RAZORPAY_KEY_ID
      // Send the key to frontend so it doesn't need to be hardcoded
    }, 200, corsHeaders);
  } catch (err) {
    console.error("[Store] create-order failed", err);
    return jsonResponse({ error: "Checkout is temporarily unavailable." }, 503, corsHeaders);
  }
}
__name(handleCreateOrder, "handleCreateOrder");
async function handleVerifyPayment(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  try {
    if (!env2.RAZORPAY_KEY_ID || !env2.RAZORPAY_KEY_SECRET || !env2.SUPABASE_URL || !env2.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Store] verify-payment is missing server configuration");
      return jsonResponse({ error: "Payment verification is temporarily unavailable." }, 503, corsHeaders);
    }
    const userId = await verifySupabaseJWT(env2, request.headers.get("Authorization"));
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return jsonResponse({ error: "Invalid request." }, 400, corsHeaders);
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
    if (!isValidRazorpayId(razorpay_order_id, "order") || !isValidRazorpayId(razorpay_payment_id, "pay") || !hexToBytes(razorpay_signature)) {
      return jsonResponse({ error: "Invalid payment details." }, 400, corsHeaders);
    }
    if (!await verifyHmacHex(env2.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature)) {
      return jsonResponse({ error: "Invalid payment signature." }, 400, corsHeaders);
    }
    const orderRes = await getOrderByRazorpayId(env2, razorpay_order_id);
    if (!orderRes.ok) {
      console.error("[Store] order lookup failed during verify-payment", orderRes.status, orderRes.data);
      return jsonResponse({ error: "Payment verification is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(orderRes.data) || !orderRes.data.length) {
      return jsonResponse({ error: "Payment order not found." }, 404, corsHeaders);
    }
    const order = orderRes.data[0];
    if (order.user_id !== userId) {
      return jsonResponse({ error: "Payment order does not belong to this account." }, 403, corsHeaders);
    }
    const productRes = await getProduct(env2, order.product_id);
    if (!productRes.ok) {
      console.error("[Store] product lookup failed during verify-payment", productRes.status, productRes.data);
      return jsonResponse({ error: "Payment verification is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(productRes.data) || !productRes.data.length) {
      return jsonResponse({ error: "Product not found." }, 404, corsHeaders);
    }
    const product = productRes.data[0];
    const expectedAmount = integerAmount(order.amount_inr);
    if (!expectedAmount || integerAmount(product.price_inr) !== expectedAmount) {
      console.error("[Store] product/order amount mismatch during verify-payment", {
        orderId: order.id,
        productId: order.product_id,
        orderAmount: order.amount_inr,
        productAmount: product.price_inr
      });
      return jsonResponse({ error: "Payment amount could not be verified." }, 400, corsHeaders);
    }
    if (order.status === "paid") {
      if (order.razorpay_payment_id && order.razorpay_payment_id !== razorpay_payment_id) {
        return jsonResponse({ error: "Payment order is already fulfilled." }, 409, corsHeaders);
      }
      return jsonResponse({ success: true, already_processed: true, message: "Payment already verified." }, 200, corsHeaders);
    }
    if (order.status !== "created") {
      return jsonResponse({ error: "Payment order is not payable." }, 409, corsHeaders);
    }
    const rzpOrderRes = await razorpayRequest(env2, `orders/${encodeURIComponent(razorpay_order_id)}`);
    if (!rzpOrderRes.ok) {
      console.error("[Store] Razorpay order lookup failed during verify-payment", rzpOrderRes.status, rzpOrderRes.data);
      return jsonResponse({ error: "Payment is not yet confirmed by Razorpay." }, 502, corsHeaders);
    }
    const rzpOrder = rzpOrderRes.data;
    if (rzpOrder.id !== razorpay_order_id || integerAmount(rzpOrder.amount) !== expectedAmount || rzpOrder.currency !== "INR") {
      console.error("[Store] Razorpay order mismatch during verify-payment", rzpOrder);
      return jsonResponse({ error: "Payment amount could not be verified." }, 400, corsHeaders);
    }
    const rzpPaymentRes = await razorpayRequest(env2, `payments/${encodeURIComponent(razorpay_payment_id)}`);
    if (!rzpPaymentRes.ok) {
      console.error("[Store] Razorpay payment lookup failed during verify-payment", rzpPaymentRes.status, rzpPaymentRes.data);
      return jsonResponse({ error: "Payment is not yet confirmed by Razorpay." }, 502, corsHeaders);
    }
    const rzpPayment = rzpPaymentRes.data;
    if (rzpPayment.id !== razorpay_payment_id || rzpPayment.order_id !== razorpay_order_id || integerAmount(rzpPayment.amount) !== expectedAmount || rzpPayment.currency !== "INR" || rzpPayment.status !== "captured") {
      console.error("[Store] Razorpay payment mismatch or not captured during verify-payment", rzpPayment);
      return jsonResponse({ error: "Payment is not captured." }, 400, corsHeaders);
    }
    const updateRes = await supabaseQuery(
      env2,
      `orders?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.created`,
      "PATCH",
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid"
      },
      void 0,
      { "Prefer": "return=representation" }
    );
    if (!updateRes.ok) {
      console.error("[Store] order update failed during verify-payment", updateRes.status, updateRes.data);
      if (updateRes.status === 409) {
        const paidEntitlementRes = await supabaseQuery(
          env2,
          `orders?user_id=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(order.product_id)}&status=eq.paid&select=id&limit=1`,
          "GET"
        );
        if (paidEntitlementRes.ok && Array.isArray(paidEntitlementRes.data) && paidEntitlementRes.data.length) {
          return jsonResponse({
            code: "ALREADY_PURCHASED",
            error: "You already own this item. Open My Library.",
            library_url: "/library.html"
          }, 409, corsHeaders);
        }
      }
      return jsonResponse({ error: "Payment received, but access is not ready yet. Please try again shortly." }, 503, corsHeaders);
    }
    if (!Array.isArray(updateRes.data) || !updateRes.data.length) {
      const retryOrderRes = await getOrderByRazorpayId(env2, razorpay_order_id);
      if (retryOrderRes.ok && Array.isArray(retryOrderRes.data) && retryOrderRes.data[0]?.status === "paid") {
        return jsonResponse({ success: true, already_processed: true, message: "Payment already verified." }, 200, corsHeaders);
      }
      console.error("[Store] order update affected no rows during verify-payment", updateRes.data);
      return jsonResponse({ error: "Payment received, but access is not ready yet. Please try again shortly." }, 503, corsHeaders);
    }
    return jsonResponse({ success: true, product_id: order.product_id, message: "Payment verified." }, 200, corsHeaders);
  } catch (err) {
    console.error("[Store] verify-payment failed", err);
    return jsonResponse({ error: "Payment verification is temporarily unavailable." }, 503, corsHeaders);
  }
}
__name(handleVerifyPayment, "handleVerifyPayment");
async function handleRazorpayWebhook(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  try {
    if (!env2.RAZORPAY_WEBHOOK_SECRET || !env2.SUPABASE_URL || !env2.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Store] razorpay-webhook is missing server configuration");
      return jsonResponse({ error: "Webhook is temporarily unavailable." }, 503, corsHeaders);
    }
    const signature = request.headers.get("X-Razorpay-Signature") || "";
    const rawBody = await request.text();
    if (rawBody.length > 256 * 1024) {
      return jsonResponse({ error: "Webhook payload too large." }, 413, corsHeaders);
    }
    if (!await verifyHmacHex(env2.RAZORPAY_WEBHOOK_SECRET, rawBody, signature)) {
      return jsonResponse({ error: "Invalid webhook signature." }, 400, corsHeaders);
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      return jsonResponse({ error: "Invalid webhook payload." }, 400, corsHeaders);
    }
    const event = body?.event;
    const refundEvents = /* @__PURE__ */ new Set(["payment.refunded", "refund.processed", "refund.created", "payment.dispute.created"]);
    if (event !== "payment.captured" && event !== "order.paid" && !refundEvents.has(event)) {
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }
    if (refundEvents.has(event)) {
      const refundPayment = body?.payload?.payment?.entity;
      const refundOrder = body?.payload?.order?.entity;
      const refundOrderId = refundPayment?.order_id || refundOrder?.id;
      const refundPaymentId = refundPayment?.id;
      let targetOrderId = refundOrderId;
      if (!targetOrderId && refundPaymentId) {
        const lookupRes = await supabaseQuery(
          env2,
          `orders?razorpay_payment_id=eq.${encodeURIComponent(refundPaymentId)}&select=razorpay_order_id&limit=1`,
          "GET"
        );
        if (lookupRes.ok && Array.isArray(lookupRes.data) && lookupRes.data.length) {
          targetOrderId = lookupRes.data[0].razorpay_order_id;
        }
      }
      if (targetOrderId) {
        await supabaseQuery(
          env2,
          `orders?razorpay_order_id=eq.${encodeURIComponent(targetOrderId)}`,
          "PATCH",
          { status: "refunded" },
          void 0,
          { "Prefer": "return=representation" }
        );
        console.info("[Store] processed refund/dispute event for order", targetOrderId);
      }
      return jsonResponse({ received: true, processed: true, status: "refunded" }, 200, corsHeaders);
    }
    const payment = body?.payload?.payment?.entity;
    const rzpOrder = body?.payload?.order?.entity;
    const razorpayOrderId = payment?.order_id || rzpOrder?.id;
    const razorpayPaymentId = payment?.id || null;
    const eventAmount = integerAmount(payment?.amount ?? rzpOrder?.amount_paid ?? rzpOrder?.amount);
    const eventCurrency = payment?.currency || rzpOrder?.currency;
    if (!isValidRazorpayId(razorpayOrderId, "order") || razorpayPaymentId && !isValidRazorpayId(razorpayPaymentId, "pay") || !eventAmount || eventCurrency !== "INR" || event === "payment.captured" && payment?.status !== "captured" || event === "order.paid" && rzpOrder?.status && rzpOrder.status !== "paid") {
      return jsonResponse({ error: "Invalid webhook payload." }, 400, corsHeaders);
    }
    const orderRes = await getOrderByRazorpayId(env2, razorpayOrderId);
    if (!orderRes.ok) {
      console.error("[Store] order lookup failed during razorpay-webhook", orderRes.status, orderRes.data);
      return jsonResponse({ error: "Webhook processing is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(orderRes.data) || !orderRes.data.length) {
      console.warn("[Store] ignoring webhook for unknown Razorpay order", razorpayOrderId);
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }
    const order = orderRes.data[0];
    if (integerAmount(order.amount_inr) !== eventAmount) {
      console.error("[Store] webhook amount mismatch", {
        razorpayOrderId,
        expected: order.amount_inr,
        received: eventAmount
      });
      return jsonResponse({ error: "Webhook amount could not be verified." }, 400, corsHeaders);
    }
    if (order.status === "paid") {
      if (razorpayPaymentId && order.razorpay_payment_id && order.razorpay_payment_id !== razorpayPaymentId) {
        console.warn("[Store] duplicate webhook has a different payment id", razorpayOrderId);
      }
      return jsonResponse({ received: true, processed: true, already_processed: true }, 200, corsHeaders);
    }
    if (order.status !== "created") {
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }
    const productRes = await getProduct(env2, order.product_id);
    if (!productRes.ok || !Array.isArray(productRes.data) || !productRes.data.length) {
      console.error("[Store] product lookup failed during razorpay-webhook", productRes.status, productRes.data);
      return jsonResponse({ error: "Webhook processing is temporarily unavailable." }, 503, corsHeaders);
    }
    if (integerAmount(productRes.data[0].price_inr) !== integerAmount(order.amount_inr)) {
      console.error("[Store] product/order amount mismatch during razorpay-webhook", order, productRes.data[0]);
      return jsonResponse({ error: "Webhook amount could not be verified." }, 400, corsHeaders);
    }
    const updateRes = await supabaseQuery(
      env2,
      `orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&status=eq.created`,
      "PATCH",
      {
        ...razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {},
        status: "paid"
      },
      void 0,
      { "Prefer": "return=representation" }
    );
    if (!updateRes.ok) {
      console.error("[Store] order update failed during razorpay-webhook", updateRes.status, updateRes.data);
      if (updateRes.status === 409) {
        const paidEntitlementRes = await supabaseQuery(
          env2,
          `orders?user_id=eq.${encodeURIComponent(order.user_id)}&product_id=eq.${encodeURIComponent(order.product_id)}&status=eq.paid&select=id&limit=1`,
          "GET"
        );
        if (paidEntitlementRes.ok && Array.isArray(paidEntitlementRes.data) && paidEntitlementRes.data.length) {
          return jsonResponse({ received: true, ignored: true, reason: "already_fulfilled" }, 200, corsHeaders);
        }
      }
      return jsonResponse({ error: "Webhook processing is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(updateRes.data) || !updateRes.data.length) {
      const retryOrderRes = await getOrderByRazorpayId(env2, razorpayOrderId);
      if (retryOrderRes.ok && Array.isArray(retryOrderRes.data) && retryOrderRes.data[0]?.status === "paid") {
        return jsonResponse({ received: true, processed: true, already_processed: true }, 200, corsHeaders);
      }
      console.error("[Store] webhook update affected no rows", updateRes.data);
      return jsonResponse({ error: "Webhook processing is temporarily unavailable." }, 503, corsHeaders);
    }
    return jsonResponse({ received: true, processed: true }, 200, corsHeaders);
  } catch (err) {
    console.error("[Store] razorpay-webhook failed", err);
    return jsonResponse({ error: "Webhook processing is temporarily unavailable." }, 503, corsHeaders);
  }
}
__name(handleRazorpayWebhook, "handleRazorpayWebhook");
async function handleDownload(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  try {
    if (!env2.SUPABASE_URL || !env2.SUPABASE_SERVICE_ROLE_KEY || !env2.PRODUCTS_BUCKET) {
      console.error("[Store] download is missing server configuration");
      return jsonResponse({ error: "Download is temporarily unavailable." }, 503, corsHeaders);
    }
    const userId = await verifySupabaseJWT(env2, request.headers.get("Authorization"));
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return jsonResponse({ error: "Invalid request." }, 400, corsHeaders);
    }
    const { product_id } = body || {};
    if (!isValidProductId(product_id)) {
      return jsonResponse({ error: "A valid product is required." }, 400, corsHeaders);
    }
    const productRes = await getProduct(env2, product_id);
    if (!productRes.ok) {
      console.error("[Store] product lookup failed during download", productRes.status, productRes.data);
      return jsonResponse({ error: "Download is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(productRes.data) || !productRes.data.length || !productRes.data[0].r2_key) {
      return jsonResponse({ error: "Product not found." }, 404, corsHeaders);
    }
    const product = productRes.data[0];
    const orderRes = await supabaseQuery(
      env2,
      `orders?user_id=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(product.id)}&status=eq.paid&select=id&limit=1`,
      "GET"
    );
    if (!orderRes.ok) {
      console.error("[Store] entitlement lookup failed during download", orderRes.status, orderRes.data);
      return jsonResponse({ error: "Download is temporarily unavailable." }, 503, corsHeaders);
    }
    if (!Array.isArray(orderRes.data) || !orderRes.data.length) {
      return jsonResponse({ error: "You have not purchased this product" }, 403, corsHeaders);
    }
    const r2Key = product.r2_key;
    const object = await env2.PRODUCTS_BUCKET.get(r2Key);
    if (!object) {
      console.error("[Store] entitled product is missing from R2", product.id, r2Key);
      return jsonResponse({ error: "Download file is temporarily unavailable." }, 404, corsHeaders);
    }
    const filename = safeDownloadFilename(r2Key);
    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (err) {
    console.error("[Store] download failed", err);
    return jsonResponse({ error: "Download is temporarily unavailable." }, 503, corsHeaders);
  }
}
__name(handleDownload, "handleDownload");
async function handleMyPurchases(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  try {
    const userId = await verifySupabaseJWT(env2, request.headers.get("Authorization"));
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    const res = await supabaseQuery(
      env2,
      `orders?user_id=eq.${encodeURIComponent(userId)}&status=eq.paid&select=id,product_id,amount_inr,created_at,products(id,title,description)`,
      "GET"
    );
    if (!res.ok) {
      console.error("[Store] purchase lookup failed", res.status, res.data);
      return jsonResponse({ error: "Could not load your purchases." }, 503, corsHeaders);
    }
    return jsonResponse({ purchases: res.data || [] }, 200, corsHeaders);
  } catch (err) {
    console.error("[Store] my-purchases failed", err);
    return jsonResponse({ error: "Could not load your purchases." }, 503, corsHeaders);
  }
}
__name(handleMyPurchases, "handleMyPurchases");
async function readJsonRequest(request, maxBytes = MAX_JSON_SIZE) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { error: "Request is too large." };
  }
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) return { error: "Request is too large." };
    const data = JSON.parse(text);
    return { data };
  } catch {
    return { error: "Invalid request body." };
  }
}
__name(readJsonRequest, "readJsonRequest");
function validateAIRequest(body) {
  if (!body || typeof body !== "object" || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_AI_MESSAGES) {
    return { error: "messages must be a non-empty array with at most 40 items." };
  }
  let totalTextChars = 0;
  let totalImageChars = 0;
  let imageCount = 0;
  const messages = [];
  for (const message of body.messages) {
    if (!message || !["system", "user", "assistant"].includes(message.role)) return { error: "Each message must have a valid role." };
    const content = message.content;
    if (typeof content === "string") {
      if (content.length > MAX_AI_MESSAGE_CHARS) return { error: "Message content is too large." };
      totalTextChars += content.length;
      messages.push({ role: message.role, content });
    } else if (Array.isArray(content)) {
      const parts = [];
      for (const part of content) {
        if (!part || typeof part !== "object" || !["text", "image_url"].includes(part.type)) return { error: "Unsupported message content." };
        if (part.type === "text") {
          if (typeof part.text !== "string" || part.text.length > MAX_AI_MESSAGE_CHARS) return { error: "Message content is too large." };
          totalTextChars += part.text.length;
          parts.push({ type: "text", text: part.text });
        } else {
          const imageUrl = part.image_url && typeof part.image_url.url === "string" ? part.image_url.url : "";
          imageCount += 1;
          if (imageCount > 5 || !imageUrl || imageUrl.length > 12 * 1024 * 1024 || !/^(?:https?:\/\/|data:image\/)/i.test(imageUrl)) return { error: "Unsupported image input." };
          totalImageChars += imageUrl.length;
          parts.push({ type: "image_url", image_url: { url: imageUrl } });
        }
      }
      messages.push({ role: message.role, content: parts });
    } else {
      return { error: "Message content must be text or structured content." };
    }
  }
  if (totalTextChars > MAX_AI_MESSAGE_CHARS || totalImageChars > MAX_AI_IMAGE_CHARS) return { error: "Request content is too large." };
  const model = typeof body.model === "string" && /^[A-Za-z0-9._:/-]{1,100}$/.test(body.model) ? body.model : void 0;
  const maxTokens = Number(body.max_tokens);
  const temperature = Number(body.temperature);
  const options = {
    messages,
    model,
    max_tokens: Number.isFinite(maxTokens) ? Math.max(1, Math.min(Math.floor(maxTokens), 8192)) : 4096,
    temperature: Number.isFinite(temperature) ? Math.max(0, Math.min(temperature, 2)) : 0.7
  };
  if (body.response_format && typeof body.response_format === "object" && body.response_format.type === "json_object") {
    options.response_format = { type: "json_object" };
  }
  return { data: options };
}
__name(validateAIRequest, "validateAIRequest");
async function fetchJsonUpstream(url, options, timeoutMs = 6e4) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: { message: "Invalid upstream response." } };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}
__name(fetchJsonUpstream, "fetchJsonUpstream");
async function handleGroqChat(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  try {
    const parsed = await readJsonRequest(request);
    if (parsed.error) return jsonResponse({ error: parsed.error }, 400, corsHeaders);
    const validated = validateAIRequest(parsed.data);
    if (validated.error) return jsonResponse({ error: validated.error }, 400, corsHeaders);
    const body = validated.data;
    const requestedModel = typeof body.model === "string" && ALLOWED_CHAT_MODELS.has(body.model) ? body.model : "openai/gpt-oss-20b";
    if (env2.GROQ_API_KEY) {
      const groqResponse = await fetchJsonUpstream("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env2.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: requestedModel,
          messages: body.messages,
          max_tokens: body.max_tokens,
          temperature: body.temperature,
          ...body.response_format ? { response_format: body.response_format } : {}
        })
      });
      if (groqResponse.ok) {
        return jsonResponse(groqResponse.data, groqResponse.status, corsHeaders);
      }
      console.warn("[Proxy] Groq failed (" + groqResponse.status + "), falling back to OpenRouter");
    }
    if (!env2.OPENROUTER_API_KEY) {
      return jsonResponse({ error: "No AI backend available. Both GROQ_API_KEY and OPENROUTER_API_KEY are missing." }, 500, corsHeaders);
    }
    const orResponse = await fetchJsonUpstream("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env2.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://onlinepdfpro.com",
        "X-Title": "OnlinePDFPro"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: body.messages,
        max_tokens: body.max_tokens,
        temperature: body.temperature
      })
    });
    return jsonResponse(orResponse.data, orResponse.status, corsHeaders);
  } catch (err) {
    console.error("[Proxy] Groq/OpenRouter request failed", err);
    return jsonResponse({ error: "AI service is temporarily unavailable." }, 502, corsHeaders);
  }
}
__name(handleGroqChat, "handleGroqChat");
async function handleOpenRouterVision(request, env2, allowedOrigins) {
  const corsHeaders = getCORSHeaders(request, allowedOrigins);
  if (!env2.OPENROUTER_API_KEY) {
    return jsonResponse({ error: "OPENROUTER_API_KEY not configured" }, 500, corsHeaders);
  }
  try {
    const parsed = await readJsonRequest(request, MAX_VISION_JSON_SIZE);
    if (parsed.error) return jsonResponse({ error: parsed.error }, 400, corsHeaders);
    const validated = validateAIRequest(parsed.data);
    if (validated.error) return jsonResponse({ error: validated.error }, 400, corsHeaders);
    const body = validated.data;
    const requestedModel = ALLOWED_VISION_MODELS.has(body.model) ? body.model : "openrouter/free";
    const orResponse = await fetchJsonUpstream("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env2.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://onlinepdfpro.com",
        "X-Title": "OnlinePDFPro"
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: body.messages,
        max_tokens: body.max_tokens
      })
    });
    if (!orResponse.ok && requestedModel !== "openrouter/free" && (orResponse.status === 429 || orResponse.status === 503)) {
      console.warn(`[Proxy] Model ${requestedModel} unavailable (${orResponse.status}), retrying with openrouter/free`);
      const fallbackResponse = await fetchJsonUpstream("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env2.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://onlinepdfpro.com",
          "X-Title": "OnlinePDFPro"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: body.messages,
          max_tokens: body.max_tokens
        })
      });
      return jsonResponse(fallbackResponse.data, fallbackResponse.status, corsHeaders);
    }
    return jsonResponse(orResponse.data, orResponse.status, corsHeaders);
  } catch (err) {
    console.error("[Proxy] Vision request failed", err);
    return jsonResponse({ error: "AI service is temporarily unavailable." }, 502, corsHeaders);
  }
}
__name(handleOpenRouterVision, "handleOpenRouterVision");
export {
  pdf_api_proxy_default as default
};
//# sourceMappingURL=pdf-api-proxy.js.map
