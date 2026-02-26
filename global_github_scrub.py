"""
Global scrub of GitHub footer links across the entire site.
"""
import glob, re

# Find all HTML files
pages = glob.glob('*.html') + glob.glob('tools/*.html')
count = 0

footer_link_pattern = r'<a\s+href="https://github\.com/Prem736raj/onlinepdfpro".*?</a>'

for filename in pages:
    try:
        html = open(filename, 'r', encoding='utf-8').read()
        
        if re.search(footer_link_pattern, html, flags=re.DOTALL):
            new_html = re.sub(footer_link_pattern, '', html, flags=re.DOTALL)
            open(filename, 'w', encoding='utf-8').write(new_html)
            count += 1
            print(f"Scrubbed GitHub link from {filename}")
            
    except Exception as e:
        print(f"Skipping {filename}: {e}")
        
print(f"Done. Removed GitHub link from {count} pages.")
