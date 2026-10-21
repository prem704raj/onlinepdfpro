import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/counter.js', import.meta.url), 'utf8');
const storage = new Map();
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value))
};
const document = {
  addEventListener() {},
  getElementById() { return null; }
};
const context = vm.createContext({ localStorage, document, Date });
const run = expression => vm.runInContext(expression, context);
vm.runInContext(source, context);

assert.equal(run('getTotalCount()'), 0, 'A new browser must not see fabricated sitewide usage');
assert.equal(run('getTodayCount()'), 0, 'Daily counts start at zero');
assert.equal(run('getTotalUsers()'), null, 'Sitewide users cannot be inferred from local storage');
run("incrementCounter('mergePDF')");
assert.equal(run('getTotalCount()'), 1);
assert.equal(run('getCounter().mergePDF'), 1);
assert.equal(run('getTodayCount()'), 0, 'Today only changes when an operation records it');
run('incrementTodayCount()');
assert.equal(run('getTodayCount()'), 1);

storage.set('onlinepdfpro_counter', JSON.stringify({
  totalPDFs: 127846, totalUsers: 48291, mergePDF: 18434, realUsage: 3
}));
assert.equal(run('getTotalCount()'), 3, 'Legacy fictional base counts are removed');
assert.equal(run('getCounter().mergePDF'), 2, 'Real per-tool usage survives migration');
assert.equal(run('getCounter().version'), 2);
console.log('PASS local counters start at zero, migrate real usage, and never invent daily growth');
