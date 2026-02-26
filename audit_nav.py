import glob

skip = ['index.html','blog.html','about.html','privacy.html','terms.html','help.html','tools.html','sitemap.html','404.html','offline.html','google6ec5c9097526273f.html']
files = [f for f in glob.glob('*.html') + glob.glob('tools/*.html') if f.replace('\\','/').split('/')[-1] not in skip]
for f in sorted(files):
    html = open(f,'r',encoding='utf-8').read()
    has_header = 'class="header"' in html
    has_nav = 'class="nav"' in html  
    print(f"{'OK' if has_header else 'MISSING':>7} | {f}")
