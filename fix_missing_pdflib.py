import os
import re

tools_to_fix = [
    os.path.join('tools', 'merge-pdf.html'),
    os.path.join('tools', 'compress-pdf.html'),
    os.path.join('tools', 'split-pdf.html'),
    os.path.join('tools', 'pdf-watermark.html')
]

# The script tag to inject
pdf_lib_script = '    <script defer src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>\n'

count = 0
for filepath in tools_to_fix:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'pdf-lib.min.js' not in content:
        # Easy place to inject is right before `<script defer src="../js/app.js"></script>`
        # Or before any `<script>` block that starts the logic
        
        # Let's insert it right after the closing </main> tag, just to be safe
        pattern = r'(</main>\s*)'
        content = re.sub(pattern, r'\1' + pdf_lib_script, content, count=1)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Fixed: {filepath}")
    else:
        print(f"Already fixed: {filepath}")

print(f"Total files fixed: {count}")
