import glob

files = glob.glob('*.html') + glob.glob('tools/*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original = content
    
    # Update the email address
    old_email = 'prem736raj@gmail.com'
    new_email = 'prem0734raj@gmail.com'
    
    if old_email in content:
        content = content.replace(old_email, new_email)
    
    if content != original:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        updated += 1
        print(f"Fixed email in {f}")

print(f"Done. Updated {updated} files.")
