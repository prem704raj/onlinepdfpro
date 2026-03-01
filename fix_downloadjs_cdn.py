import os
import re

html_files = []
for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if 'brain' in dirs: dirs.remove('brain')
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

old_url = 'https://cdn.jsdelivr.net/npm/downloadjs@1.4.8/download.min.js'
new_url = 'https://cdnjs.cloudflare.com/ajax/libs/downloadjs/1.4.8/download.min.js'

count = 0
for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        continue
        
    if old_url in content:
        content = content.replace(old_url, new_url)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1

print(f"Replaced downloadjs CDN in {count} files.")
