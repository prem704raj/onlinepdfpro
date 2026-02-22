import glob, re

files = glob.glob('*.html') + glob.glob('tools/*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove the feedback widget button completely.
    # The block looks like:
    # <!-- Floating Feedback Button -->
    # <button class="feedback-widget" aria-label="Send Feedback" title="Send Feedback">
    #     ... SVG ...
    # </button>
    regex = r'<!-- Floating Feedback Button -->\s*<button class="feedback-widget"[\s\S]*?</button>\s*'
    new_content = re.sub(regex, '', content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        updated += 1
        print(f"Removed bubble from {f}")

print(f'\nDone. Updated {updated} files.')
