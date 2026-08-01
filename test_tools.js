const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testTools() {
    const toolsDir = path.join(__dirname, 'src', 'tools');
    const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.html') && f !== 'pdf-to-word.html' && f !== 'word-to-pdf.html');
    
    console.log(`Found ${files.length} tools to test.`);
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    for (const file of files) {
        let hasError = false;
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`[${file}] Console Error:`, msg.text());
                hasError = true;
            }
        });
        
        page.on('pageerror', err => {
            console.log(`[${file}] Page Error:`, err.toString());
            hasError = true;
        });

        try {
            await page.goto(`http://localhost:8080/tools/${file}`, { waitUntil: 'networkidle0', timeout: 10000 });
        } catch (e) {
            console.log(`[${file}] Navigation Error:`, e.message);
        }
        
        // Remove listeners for the next file
        page.removeAllListeners('console');
        page.removeAllListeners('pageerror');
    }
    
    await browser.close();
    console.log('Testing complete.');
}

testTools();
