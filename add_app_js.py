"""
Add the js/app.js script to the 16 pages to enable the header interactions
like global search, language toggle, and theme switch.
"""
import re

PAGES_TO_FIX = [
    'compare-pdf.html', 'excel-to-pdf.html', 'flatten-pdf.html',
    'pdf-bookmark.html', 'pdf-editor.html', 'pdf-reader.html',
    'pdf-summary.html', 'pdf-to-word.html', 'pdf-translator.html',
    'ppt-to-pdf.html', 'qr-pdf.html', 'text-to-audio.html',
    'voice-to-pdf.html', 'word-to-pdf.html',
    'tools/qr-generator.html', 'tools/rotate-pdf-godmode.html',
]

count = 0

for filename in PAGES_TO_FIX:
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        continue
        
    # Check if app.js is already there
    if re.search(r'src="[^"]*js/app\.js"', html):
        print(f"SKIP (Already has app.js): {filename}")
        continue
        
    # Standardize to absolute path /js/app.js so it works everywhere
    script_tag = '\n    <script defer src="/js/app.js"></script>\n</body>'
    html = html.replace('</body>', script_tag)
    
    open(filename, 'w', encoding='utf-8').write(html)
    print(f"ADDED JS: {filename}")
    count += 1
    
print(f"\nDone. Fixed {count} pages.")
