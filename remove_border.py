import os
import glob

def remove_border(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the target string pattern with the border and replace it
    target = 'border-radius:16px; border:3px solid #2563eb;'
    replacement = 'border-radius:16px;'
    
    if target in content:
        content = content.replace(target, replacement)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Removed border from {filepath}")

# Process all files
html_files = glob.glob('*.html') + glob.glob('tools/*.html')
for f in html_files:
    remove_border(f)

print("Border removal complete.")
