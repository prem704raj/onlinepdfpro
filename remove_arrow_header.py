import re, glob

files = glob.glob('**/*.html', recursive=True)
count = 0
for f in files:
    html = open(f, 'r', encoding='utf-8').read()
    if '\u2190 Online PDF Pro' not in html:
        continue
    # The actual pattern: <header><div class="container"><h1><a href="index.html">← Online PDF Pro</a> / Page</h1></div></header>
    new_html = re.sub(
        r'\s*<header>\s*<div class="container">\s*<h1><a href="[^"]*">\u2190 Online PDF Pro</a>\s*/\s*[^<]*</h1>\s*</div>\s*</header>',
        '',
        html
    )
    if new_html != html:
        open(f, 'w', encoding='utf-8').write(new_html)
        count += 1
        print(f'Removed: {f}')
    else:
        print(f'NOT matched: {f}')

print(f'\nTotal: {count} files fixed')
