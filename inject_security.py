import os
import glob
import re

html_files = glob.glob('*.html') + glob.glob('blog/*.html') + glob.glob('tools/*.html')

# The old inline script block to remove
OLD_BLOCK_START = '<!-- Security & Anti-Hacking Script -->'
OLD_BLOCK_END = '</script>'

# The new single-line script tag to inject
NEW_SCRIPT_TAG = '    <script src="js/security-shield.js"></script>'

modified = 0
skipped = 0

for filepath in html_files:
    if not os.path.isfile(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Step 1: Remove old inline security block if present
    if OLD_BLOCK_START in content:
        # Find and remove the entire old block (from comment to closing </script>)
        pattern = r'\s*<!-- Security & Anti-Hacking Script -->.*?</script>\s*'
        content = re.sub(pattern, '\n', content, count=1, flags=re.DOTALL)
    
    # Step 2: Add the new external script tag if not already present
    if 'security-shield.js' not in content:
        if '</head>' in content:
            content = content.replace('</head>', NEW_SCRIPT_TAG + '\n</head>')
        elif '<style>' in content:
            content = content.replace('<style>', NEW_SCRIPT_TAG + '\n<style>', 1)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        modified += 1
    else:
        skipped += 1
        
print(f"Updated {modified} files. Skipped {skipped} already up-to-date files.")
print(f"Total HTML files scanned: {len(html_files)}")
