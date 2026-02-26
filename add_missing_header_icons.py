"""
Add language selector and theme toggle to the headers of the 16 pages
where they were left out compared to ocr.html.
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

ELEMENTS_TO_INSERT = """
                <div class="lang-selector">
                    <button class="lang-btn" aria-label="Change language" title="Change language"><svg width="18"
                            height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path
                                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z">
                            </path>
                            <path d="M2 12h20"></path>
                        </svg></button>
                    <div class="lang-dropdown">
                        <div class="lang-search-wrap">
                            <input type="text" class="lang-search" placeholder="Search language...">
                        </div>
                        <ul class="lang-list"></ul>
                    </div>
                </div>
                <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" style="font-size:20px; background:none; border:1px solid var(--border, #e2e8f0); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;">
                    <span class="theme-icon-light">🌙</span>
                    <span class="theme-icon-dark" style="display:none;">☀️</span>
                </button>
"""

count = 0

for filename in PAGES_TO_FIX:
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        continue
        
    if 'class="lang-selector"' in html and 'class="theme-toggle"' in html:
        print(f"SKIP (Already has them): {filename}")
        continue
        
    # We want to insert ELEMENTS_TO_INSERT before the <button class="menu-toggle"
    # Wait, the search block ends before menu-toggle. Let's find:
    pattern = r'(</div>\s*<button class="menu-toggle")'
    
    if re.search(pattern, html):
        html = re.sub(pattern, '</div>' + ELEMENTS_TO_INSERT + '                <button class="menu-toggle"', html, count=1)
        open(filename, 'w', encoding='utf-8').write(html)
        print(f"FIXED: {filename}")
        count += 1
    else:
        print(f"FAILED TO MATCH: {filename}")

print(f"\nDone. Fixed {count} pages.")
