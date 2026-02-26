"""
Fix CSS paths to be absolute root paths (/css/style.css) and fix the
<main> tag so that it uses class="tool-page" which has the padding
defined in tools.css.
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
        
    changed = False
    
    # 1. Enforce absolute CSS paths for consistency
    html = re.sub(r'<link[^>]*href="[^"]*css/style\.css[^"]*"[^>]*>', '<link rel="stylesheet" href="/css/style.css?v=5">', html)
    html = re.sub(r'<link[^>]*href="[^"]*css/tools\.css[^"]*"[^>]*>', '<link rel="stylesheet" href="/css/tools.css?v=5">', html)
    changed = True
    
    # 2. Fix <main> wrapper to have tool-page for padding
    # If it's <main class="container">, change it to <main class="tool-page"><div class="container"> and add </div> at the end of main
    if '<main class="container">' in html:
        html = html.replace('<main class="container">', '<main id="main" class="tool-page">\n<div class="container">')
        html = html.replace('</main>', '</div>\n</main>')
        changed = True
    elif '<main id="main"' not in html and '<main' in html:
        # Just add tool-page class to whatever <main> tag exists
        html = re.sub(r'<main([^>]*)class="([^"]*)"([^>]*)>', r'<main\1class="\2 tool-page"\3>', html)
        if not re.search(r'<main[^>]*class=".*tool-page.*"', html):
             html = re.sub(r'<main([^>]*)>', r'<main\1 class="tool-page">', html)
        changed = True

    if changed:
        open(filename, 'w', encoding='utf-8').write(html)
        print(f"FIXED WRAPPER/CSS: {filename}")
        count += 1
        
print(f"\nDone. Fixed {count} pages.")
