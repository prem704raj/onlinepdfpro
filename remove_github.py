"""
Remove GitHub links from index.html
We will specifically search for the blocks containing the links
and either remove them or replace the links.
"""
import re

filename = 'index.html'

try:
    html = open(filename, 'r', encoding='utf-8').read()
    
    # 1. Remove GitHub from JSON-LD Schema (sameAs array)
    html = re.sub(r',\s*"https://github\.com/Prem736raj/onlinepdfpro"', '', html)
    
    # 2. Remove the "OSS" stat box completely from the 3-column stats bar
    # The stats bar has 3 hp-stat children. We just remove the second one.
    stat_pattern = r'<div class="hp-stat">\s*<div class="hp-stat-icon" style="background:#f0fdf4;"><span>🔓</span></div>\s*<div class="hp-stat-num"[^>]*><a[^>]*>OSS</a></div>\s*<div class="hp-stat-label"><a[^>]*>Audit on GitHub</a></div>\s*</div>'
    html = re.sub(stat_pattern, '', html)
    
    # Adjust the stats grid to be 2 columns instead of 3 since we deleted one box
    html = html.replace('grid-template-columns: repeat(3, 1fr);', 'grid-template-columns: repeat(2, 1fr);')
    
    # 3. Remove the Open Source trust pill from the hp-trust-row
    trust_pill_pattern = r'<a href="https://github\.com/Prem736raj/onlinepdfpro"[^>]*>\s*<span class="hp-trust-pill-icon">🔓</span>\s*<div><strong>Open Source</strong><span[^>]*>View code on GitHub →</span></div>\s*</a>'
    html = re.sub(trust_pill_pattern, '', html)
    
    # 4. Remove the GitHub link from the footer
    footer_link_pattern = r'<a\s+href="https://github\.com/Prem736raj/onlinepdfpro"\s+target="_blank"\s+class="footer-social-link"\s+aria-label="GitHub">.*?</a>'
    html = re.sub(footer_link_pattern, '', html, flags=re.DOTALL)
    
    open(filename, 'w', encoding='utf-8').write(html)
    print("Successfully removed all GitHub references from index.html.")
        
except Exception as e:
    print(f"Error: {e}")
