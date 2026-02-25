import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Remove Breadcrumbs HTML
    # We will search for the nav block: <nav class="breadcrumbs" ... </nav>
    bc_html_match = re.search(r'\s*<nav class="breadcrumbs"[^>]*>.*?</nav>\s*', html, re.IGNORECASE | re.DOTALL)
    if bc_html_match:
        html = html.replace(bc_html_match.group(0), '\n')
        modified = True

    # 2. Remove Breadcrumbs Schema
    # We search for a script that contains BreadcrumbList
    script_pattern = re.compile(r'\s*<script type="application/ld\+json">\s*\{\s*"@context":\s*"https://schema\.org",\s*"@type":\s*"BreadcrumbList".*?</script>\s*', re.IGNORECASE | re.DOTALL)
    bc_schema_match = script_pattern.search(html)
    
    if bc_schema_match:
        html = html.replace(bc_schema_match.group(0), '\n')
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Removed Breadcrumbs from: {filepath}")
