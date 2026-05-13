import os
import re

root_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'
count = 0

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(subdir, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            new_lines = []
            removed = False
            for i, line in enumerate(lines):
                stripped = line.strip()
                # Match the stray "PDF</a></li>" line that sits alone
                if stripped in ('PDF</a></li>', 'PDF\r\n') or re.match(r'^\s+PDF</a></li>\s*$', line):
                    removed = True
                    continue
                new_lines.append(line)
            
            if removed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                count += 1

print(f'Removed stray PDF line from {count} files')
