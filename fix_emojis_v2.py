import os
import glob

# These exact string representations match the corrupted utf-8 characters in the files
replacements = {
    'ðŸ“Ž': '📄',
    'ðŸ–¼ï¸\x8f': '🖼️',
    'âœ‚ï¸\x8f': '✂️',
    'ðŸ›¡ï¸\x8f': '🛡️',
    'ðŸ”—': '🔗',
    'ðŸ”“': '🔓',
    'ðŸ“¸': '📸'
}

html_files = glob.glob('**/*.html', recursive=True)

modified_count = 0
for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for corrupt, correct in replacements.items():
            new_content = new_content.replace(corrupt, correct)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            modified_count += 1
            print(f"Fixed encoding in: {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

print(f"Total files fixed: {modified_count}")
