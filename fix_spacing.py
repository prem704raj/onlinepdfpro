import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Remove forced margin-top: 60px on privacy reminders in some tools
    if 'margin-top: 60px;' in html and 'privacy-reminder' in html:
        html = html.replace('style="animation-delay: 0.3s; margin-top: 60px;"', 'style="animation-delay: 0.3s; margin-top: 20px;"')
        html = html.replace('margin-top: 60px;">', 'margin-top: 20px;">')
        modified = True

    # 2. Reduce the huge AdSense margin (which causes gaps if ads don't load)
    # The block is usually: <div style="text-align:center; margin:50px 0;">
    if 'margin:50px 0;' in html:
        html = html.replace('margin:50px 0;', 'margin:20px 0;')
        modified = True

    # 3. Some AdSense blocks might have spaces in the margin definition
    if 'margin: 50px 0;' in html:
        html = html.replace('margin: 50px 0;', 'margin: 20px 0;')
        modified = True

    # 4. Check if the ad block has a min-height which is pushing things down
    if 'min-height:' in html and 'adsbygoogle' in html:
        # Just to ensure we're not missing other empty space causes
        pass
        
    # 5. Make sure the how-it-works section doesn't have an excessive margin-top
    if '<section class="how-it-works" style="margin: 40px auto; ' in html:
        html = html.replace('<section class="how-it-works" style="margin: 40px auto;', '<section class="how-it-works" style="margin: 20px auto;')
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Tightened Spacing on: {filepath}")
