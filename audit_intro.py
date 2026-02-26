import re, glob

all_files = glob.glob('*.html') + glob.glob('tools/*.html')
skip = ['index.html','blog.html','about.html','privacy.html','terms.html','help.html','tools.html','sitemap.html','404.html','offline.html','google6ec5c9097526273f.html']

for f in sorted(all_files):
    base = f.replace('\\','/').split('/')[-1]
    if base in skip:
        continue
    html = open(f, 'r', encoding='utf-8').read()
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    h1_text = re.sub(r'<[^>]+>', '', h1.group(1)).strip()[:60] if h1 else 'NO H1'
    has_cat = 'section-tag' in html or 'tool-header' in html
    has_title = 'tool-title' in html
    tag = 'OK' if (has_cat and h1 and has_title) else 'FIX'
    print(f"{tag:>3} | {f:<45} | cat={'Y' if has_cat else 'N'} title={'Y' if has_title else 'N'} | {h1_text}")
