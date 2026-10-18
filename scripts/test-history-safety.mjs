import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseFragment } from 'parse5';
const source = fs.readFileSync(new URL('../src/history.html', import.meta.url), 'utf8');
assert.ok(!source.includes('<script src="/js/security-shield.js">'), 'The escape helper must execute inline rather than be ignored in an external script element');
const escape = source.slice(source.indexOf(' function escapeHTML('), source.indexOf('</script>', source.indexOf(' function escapeHTML(')));
const renderer = source.slice(source.indexOf(' function renderEntries('), source.indexOf(' function filterHistory('));
const container = { innerHTML: '' };
const context = vm.createContext({ document: { getElementById: () => container },
  getFileIcon: () => 'PDF', formatSize: () => '1 KB', formatDate: () => '18 Oct 2026' });
vm.runInContext(escape + '\n' + renderer, context);
const payload = '\"><img src=x onerror="throw 1"><svg onload="throw 2">';
context.entries = [{id: 1, filename: payload, tool: payload, type: 'application/' + payload,
  originalFiles: [{name: payload, size: 1}], size: 1, date: '2026-10-18'},
  {id: '1);throw 3;//', filename: 'Rejected invalid id', type: 'application/pdf'}];
vm.runInContext('renderEntries(entries)', context);
const tree = parseFragment(container.innerHTML);
const nodes = [];
function walk(node) { nodes.push(node); for (const child of node.childNodes || []) walk(child); }
walk(tree);
assert.ok(!nodes.some(n => ['img', 'svg'].includes(n.tagName)), 'Metadata cannot create markup');
assert.ok(!nodes.some(n => (n.attrs || []).some(a => ['onerror', 'onload'].includes(a.name))), 'Metadata cannot inject handlers');
assert.ok(!container.innerHTML.includes('Rejected invalid id'), 'Action IDs must be numeric');
const name = nodes.find(n => (n.attrs || []).some(a => a.name === 'class' && a.value === 'result-name'));
assert.equal(name.attrs.find(a => a.name === 'title').value, payload);
assert.equal(name.childNodes.map(n => n.value || '').join(''), payload, 'Filename remains literal visible text');
context.entries = [{ id: 2, filename: 'résumé.pdf', size: 1 }];
vm.runInContext('renderEntries(entries)', context);
assert.ok(container.innerHTML.includes('résumé.pdf'), 'Unicode names and absent MIME type work');
assert.ok(container.innerHTML.includes('redownload(2)'), 'Valid download action remains');
context.entries = [];
vm.runInContext('renderEntries(entries)', context);
assert.ok(container.innerHTML.includes('No matching files'), 'Empty state remains');
console.log('PASS actual history renderer: hostile names/tool/MIME remain inert, unsafe IDs rejected, Unicode and empty state preserved');
console.log('VERDICT: PASS');
