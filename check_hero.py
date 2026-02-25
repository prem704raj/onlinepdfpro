import glob, re

root_pages = [f for f in glob.glob('*.html') if f not in [
    'index.html','blog.html','about.html','privacy.html','terms.html',
    'help.html','tools.html','sitemap.html','404.html','offline.html'
]]

for f in sorted(root_pages):
    html = open(f, 'r', encoding='utf-8').read()
    has_hero = 'tool-hero' in html or 'page-hero' in html
    h1_match = re.search(r'<h1[^>]*>(.+?)</h1>', html[:5000], re.DOTALL)
    h1_text = h1_match.group(1).strip()[:80] if h1_match else 'NO H1 FOUND'
    status = 'HAS' if has_hero else 'MISSING'
    print(f"{status:>7} | {f:<40} | {h1_text}")
