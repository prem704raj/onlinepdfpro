const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const libCode = fs.readFileSync('test_lib.js', 'utf8');
const dom = new JSDOM('<script>' + libCode + '</script>', { runScripts: 'dangerously' });
const window = dom.window;
console.log('PDFLib available:', !!window.PDFLib);
if (window.PDFLib) {
    console.log('PDFLib.PDFDocument available:', !!window.PDFLib.PDFDocument);
}
console.log('PDFDocument available globally:', !!window.PDFDocument);
