import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Fix remaining broken privacy icon
    if 'ðŸ›¡ï¸ ' in html:
        html = html.replace('ðŸ›¡ï¸ ', '🛡️')
        modified = True
        
    if 'ðŸ”’' in html:
        html = html.replace('ðŸ”’', '🔒')
        modified = True

    # 2. Fix the huge gap by making the SEO sections blend gracefully
    # Replace the hardcoded `margin: 40px 0;` or `margin: 40px auto;` with smaller margins and max-width match
    if '<section class="how-it-works" style="margin: 40px 0;' in html:
        html = html.replace('<section class="how-it-works" style="margin: 40px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">',
                            '<section class="how-it-works" style="margin: 20px auto; padding: 30px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; max-width: 900px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">')
        modified = True
        
    if '<section class="related-tools" style="margin: 40px auto;' in html:
        html = html.replace('<section class="related-tools" style="margin: 40px auto; padding: 0 20px; max-width: 1060px;">',
                            '<section class="related-tools" style="margin: 40px auto 20px; padding: 0 20px; max-width: 900px;">')
        modified = True

    if '<section class="faq-section" style="margin: 40px 0;">' in html:
        html = html.replace('<section class="faq-section" style="margin: 40px 0;">',
                            '<section class="faq-section" style="margin: 40px auto; max-width: 900px; padding: 0 20px;">')
        modified = True

    # 3. Redesign the FAQ items to look premium (Add soft borders, better spacing, and a modern feel)
    # We will replace the existing `<div class="faq-item" style="margin-bottom: 20px;">` with a nicer card layout
    if '<div class="faq-item" style="margin-bottom: 20px;">' in html:
        html = html.replace('<div class="faq-item" style="margin-bottom: 20px;">',
                            '<div class="faq-item" style="margin-bottom: 16px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">')
        
        # Make the questions look clickable/important
        html = html.replace('<h3 style="font-size: 17px; color: #334155; margin: 0 0 8px;">',
                            '<h3 style="font-size: 17px; color: #1e293b; margin: 0 0 10px; font-weight: 600; display: flex; align-items: center; gap: 8px;"><span style="color: #2563eb;">Q.</span> ')
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Refined UI on: {filepath}")
