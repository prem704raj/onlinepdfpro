const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Read only the trusted, checked-in product literal. Build-time pages and
// browser checkout share the same price, description, preview and disclosure.
const source = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const match = source.match(/^const STORE_PRODUCTS = (\{[\s\S]*?\r?\n\});/);
if (!match) throw new Error('The browser product registry could not be read for static product pages.');
module.exports = JSON.parse(JSON.stringify(vm.runInNewContext(`(${match[1]})`, {}, { timeout: 100 })));
