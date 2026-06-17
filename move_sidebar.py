import os
import glob
import re

base_dir = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

html_files = []
for f in glob.glob(os.path.join(base_dir, "*.html")):
    html_files.append(f)
for f in glob.glob(os.path.join(base_dir, "tools", "*.html")):
    html_files.append(f)

# Regex to extract the left sidebar block
sidebar_regex = re.compile(r'(<!-- Adsterra Left Sidebar -->\s*<aside class="adsterra-left-sidebar">.*?</aside>\s*)', re.DOTALL)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if left sidebar exists
    match = sidebar_regex.search(content)
    if not match:
        continue
        
    sidebar_block = match.group(1)
    
    # Remove it from its current location
    content = content.replace(sidebar_block, '')
    
    # Inject it right before </main>
    if '</main>' in content:
        content = content.replace('</main>', sidebar_block + "\n</main>")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            print(f"Moved left sidebar to bottom in {os.path.basename(filepath)}")
