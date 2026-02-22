import glob, re

files = glob.glob('*.html') + glob.glob('tools/*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original_content = content

    # 1. Remove Floating WhatsApp Button
    # Pattern: <!-- Floating WhatsApp Button --> ... </a>
    whatsapp_pattern = r'<!-- Floating WhatsApp Button -->\s*<a[^>]*wa\.me[^>]*>.*?</a>\s*'
    content = re.sub(whatsapp_pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
    
    # Just in case the comment is missing but the tag is there:
    fallback_wa_pattern = r'<a[^>]*wa\.me[^>]*>💬</a>\s*'
    content = re.sub(fallback_wa_pattern, '', content, flags=re.DOTALL | re.IGNORECASE)

    # 2. Remove Google AdSense Sticky Bottom (the white band)
    # Pattern: <!-- Google AdSense Sticky Bottom --> ... </div>
    # It has background:white and fixed positioning
    adsense_sticky_pattern = r'<!-- Google AdSense Sticky Bottom -->\s*<div[^>]*position:fixed;\s*bottom:0[^>]*>.*?</div>\s*'
    content = re.sub(adsense_sticky_pattern, '', content, flags=re.DOTALL | re.IGNORECASE)

    if content != original_content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        updated += 1
        print(f"Cleaned {f}")

print(f'\nDone. Updated {updated} files.')
