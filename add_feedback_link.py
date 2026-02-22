import glob, re

files = glob.glob('*.html')
tools_files = glob.glob('tools/*.html')
updated = 0

# For root files
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to insert the Feedback link after Help
    target = r'<a href="help.html" class="nav-link">Help</a>'
    replacement = r'<a href="help.html" class="nav-link">Help</a>\n                    <a href="mailto:contact@onlinepdfpro.com?subject=OnlinePDFPro Feedback" class="nav-link">Feedback</a>'
    
    if target in content and 'mailto:contact@onlinepdfpro.com' not in content:
        new_content = content.replace(target, replacement)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        updated += 1
        print(f"Added Feedback link to {f}")

# For tools files
for f in tools_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to insert the Feedback link after Help
    target = r'<a href="../help.html" class="nav-link">Help</a>'
    replacement = r'<a href="../help.html" class="nav-link">Help</a>\n                    <a href="mailto:contact@onlinepdfpro.com?subject=OnlinePDFPro Feedback" class="nav-link">Feedback</a>'
    
    if target in content and 'mailto:contact@onlinepdfpro.com' not in content:
        new_content = content.replace(target, replacement)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        updated += 1
        print(f"Added Feedback link to {f}")

print(f'\nDone. Updated {updated} files with Feedback nav link.')
