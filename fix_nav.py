import os
import re

base_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'

def fix_html_files():
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 1. Fix duplicate Blog in nav
                # It might be href="blog.html" or href="../blog.html"
                content = re.sub(
                    r'<a href="([^"]*)history\.html" class="nav-link">History</a>\s*<a href="[^"]*blog\.html" class="nav-link( active)?">Blog</a>',
                    r'<a href="\1history.html" class="nav-link">History</a>',
                    content
                )
                
                # Write back if changed
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

fix_html_files()
print("Nav fixes applied.")
