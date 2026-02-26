"""
Remove the 3-Step Microflow ("Drop your file") from index.html
"""
import re

filename = 'index.html'

try:
    html = open(filename, 'r', encoding='utf-8').read()
    
    # We want to remove the block from:
    # <!-- HOW IT WORKS - 3 Step Microflow (Point 6) -->
    # ... down to just before <!-- STATS BAR (Point 2: Verifiable metrics) -->
    
    pattern = r'<!-- HOW IT WORKS - 3 Step Microflow \(Point 6\) -->(.*?)<!-- STATS BAR \(Point 2: Verifiable metrics\) -->'
    
    if re.search(pattern, html, flags=re.DOTALL):
        new_html = re.sub(pattern, '<!-- STATS BAR (Point 2: Verifiable metrics) -->', html, flags=re.DOTALL)
        open(filename, 'w', encoding='utf-8').write(new_html)
        print("Successfully removed the 3-step microflow from index.html")
    else:
        print("Could not find the exact pattern. Check index.html.")
        
except Exception as e:
    print(f"Error: {e}")
