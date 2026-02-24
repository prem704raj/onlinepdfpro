import os
import re

badge_regex = re.compile(r'<div style="text-align:center; margin:15px 0;">\s*<span style="padding:8px 20px; background:#f0f9ff; border-radius:50px; font-size:13px; color:#2563eb; font-weight:bold;">\s*<span id="counter-total-short">.*?</span>\+ PDFs processed by our users\s*</span>\s*</div>', re.DOTALL)

removed_count = 0
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.gemini' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            if badge_regex.search(content):
                new_content = badge_regex.sub('', content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Removed badge from {file_path}")
                removed_count += 1

print(f"Removed badge from {removed_count} files.")
