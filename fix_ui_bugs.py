import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

# Common broken UTF-8 characters mapped to the actual emojis
fix_map = {
    'ðŸ“¦': '📦',
    'ðŸ›¡ï¸ ': '🛡️',
    'ðŸ§©': '🧩',
    'âš¡': '⚡',
    'ðŸ“„': '📄',
    'âœ‚ï¸ ': '✂️',
    'ðŸ”’': '🔒',
    'ðŸ”‘': '🔑',
    'ðŸ“‹': '📋',
    'ðŸ’¾': '💾',
    'ðŸ–¼ï¸ ': '🖼️',
    'ðŸ“Š': '📊',
    'ðŸ”„': '🔄',
    'ðŸ’¡': '💡',
    'ðŸ”Ž': '🔍'
}

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Fix broken characters
    for broken, fixed in fix_map.items():
        if broken in html:
            html = html.replace(broken, fixed)
            modified = True

    # 2. Fix Breadcrumbs Position
    # Problem: Breadcrumbs are currently between </header> and <main>
    # Fix: Move them INSIDE the <main> tag, right at the top of it.
    
    breadcrumb_match = re.search(r'<nav class="breadcrumbs"\s*style="[^>]+>.*?</nav>', html, re.IGNORECASE | re.DOTALL)
    
    if breadcrumb_match:
        bc_html = breadcrumb_match.group(0)
        
        # Check if it's already inside main
        # We'll remove it entirely, then insert it inside the <main> block
        html_without_bc = html.replace(bc_html, "")
        
        # Find the <main> tag
        main_match = re.search(r'<main[^>]*>', html_without_bc, re.IGNORECASE)
        if main_match:
            insert_pos = main_match.end()
            
            # Reconstruct HTML with BC inside main
            html = html_without_bc[:insert_pos] + "\n        " + bc_html + html_without_bc[insert_pos:]
            modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Fixed UI/Encoding on: {filepath}")
