import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

# Old SVG-based theme toggle button pattern
old_toggle = '''<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
                    <svg class="theme-icon-light" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <svg class="theme-icon-dark" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                </button>'''

new_toggle = '''<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" style="font-size:20px; background:none; border:1px solid var(--border); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;">
                    <span class="theme-icon-light">🌙</span>
                    <span class="theme-icon-dark">☀️</span>
                </button>'''

count = 0
for filepath in html_files:
    if 'node_modules' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    if 'theme-icon-light' in html and '<svg class="theme-icon-light"' in html:
        html = html.replace(old_toggle, new_toggle)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        count += 1
        print(f"Fixed theme toggle: {filepath}")

print(f"\nTotal files updated: {count}")
