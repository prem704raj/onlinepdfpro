import glob

files = glob.glob('*.html') + glob.glob('tools/*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original = content
    
    # Fix the literal backslash-n bug from the previous raw string replacement
    content = content.replace(r'\n', '')
    
    # Swap the generic mailto for an explicit Gmail compose link
    old_link = 'mailto:contact@onlinepdfpro.com?subject=OnlinePDFPro Feedback'
    new_link = 'https://mail.google.com/mail/?view=cm&fs=1&to=prem736raj@gmail.com&su=OnlinePDFPro%20Feedback'
    
    content = content.replace(old_link, new_link)
    
    # Also update the target so it opens in a new tab if it doesn't already
    # The current a tag is: <a href="https://mail.google.com..." class="nav-link">Feedback</a>
    # Let's cleanly inject target="_blank" so Gmail opens in a new tab seamlessly.
    target_pattern = new_link + '" class="nav-link"'
    replacement_pattern = new_link + '" class="nav-link" target="_blank" rel="noopener"'
    content = content.replace(target_pattern, replacement_pattern)
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        updated += 1
        print(f"Fixed {f}")

print(f"Done. Updated {updated} files.")
