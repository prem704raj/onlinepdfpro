"""
Add the OCR-style navbar header to all pages that are missing it.
Root pages use ./ paths, tools/ pages use ../ paths.
Also ensures css/style.css is loaded (needed for header styling).
"""
import re, glob

# Pages missing the header
MISSING_ROOT = [
    'compare-pdf.html', 'excel-to-pdf.html', 'flatten-pdf.html',
    'pdf-bookmark.html', 'pdf-editor.html', 'pdf-reader.html',
    'pdf-summary.html', 'pdf-to-word.html', 'pdf-translator.html',
    'ppt-to-pdf.html', 'qr-pdf.html', 'text-to-audio.html',
    'voice-to-pdf.html', 'word-to-pdf.html',
]

MISSING_TOOLS = [
    'tools/qr-generator.html', 'tools/rotate-pdf-godmode.html',
]

def make_header(prefix):
    """prefix is '' for root pages, '../' for tools/ pages"""
    p = prefix
    return f'''    <a href="#main" class="skip-link">Skip to main content</a>

    <header class="header">
        <div class="header-content">
            <a href="{p}index.html" class="logo">
                <span class="logo-icon">\U0001f4c4</span>
                <span class="logo-text">OnlinePDFPro</span>
            </a>
            <nav class="nav" id="nav">
                <a href="{p}tools.html" class="nav-link">All Tools</a>
                <a href="{p}about.html" class="nav-link">About</a>
                <a href="{p}help.html" class="nav-link">Help</a>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=prem0734raj@gmail.com&su=OnlinePDFPro%20Feedback" class="nav-link" target="_blank" rel="noopener">Feedback</a>
            </nav>
            <div class="header-actions">
                <div class="header-search" style="position: relative; margin-right: 8px;">
                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.9rem; opacity: 0.5;">\U0001f50d</span>
                    <input type="text" id="globalToolSearch" placeholder="Search tools..."
                        style="padding: 8px 12px 8px 32px; border-radius: 20px; border: 1px solid var(--border, #e2e8f0); background: var(--bg-primary, #fff); color: var(--text-primary, #1a1a2e); font-size: 0.85rem; width: 180px; outline: none;">
                </div>
                <button class="menu-toggle" id="menuToggle" aria-label="Menu">\u2630</button>
            </div>
        </div>
    </header>
'''

def ensure_css(html, prefix):
    """Make sure css/style.css and css/tools.css are loaded"""
    changed = False
    head_end = html.find('</head>')
    if head_end < 0:
        return html, False
    
    css_path = '/css/style.css' if prefix == '../' else 'css/style.css'
    tools_path = '/css/tools.css' if prefix == '../' else 'css/tools.css'
    
    if 'style.css' not in html:
        html = html[:head_end] + f'    <link rel="stylesheet" href="{css_path}">\n' + html[head_end:]
        changed = True
        head_end = html.find('</head>')
    
    if 'tools.css' not in html:
        html = html[:head_end] + f'    <link rel="stylesheet" href="{tools_path}">\n' + html[head_end:]
        changed = True
    
    return html, changed

count = 0

for filename in MISSING_ROOT + MISSING_TOOLS:
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        continue
    
    if 'class="header"' in html:
        continue
    
    prefix = '../' if filename.startswith('tools/') else ''
    header_html = make_header(prefix)
    
    # Ensure CSS is loaded
    html, _ = ensure_css(html, prefix)
    
    # Remove any old <header> tags first
    html = re.sub(r'<header[^>]*>.*?</header>\s*', '', html, flags=re.DOTALL)
    
    # Insert new header right after <body...>
    body_match = re.search(r'(<body[^>]*>)', html)
    if body_match:
        pos = body_match.end()
        html = html[:pos] + '\n' + header_html + html[pos:]
        open(filename, 'w', encoding='utf-8').write(html)
        count += 1
        print(f"ADDED navbar: {filename}")
    else:
        print(f"SKIP (no body): {filename}")

print(f"\nDone: {count} pages fixed")
