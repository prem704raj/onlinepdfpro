import os
import glob
import re

directory = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

for filepath in glob.glob(os.path.join(directory, "**", "*.html"), recursive=True):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if mobile-fix is already linked
    if "mobile-fix.css" in content:
        continue
        
    # Find the style.css link and insert mobile-fix.css right after it
    # We use regex to preserve the prefix (like ../ or /)
    new_content = re.sub(
        r'(<link[^>]*href="([^"]*?)css/style\.css[^"]*"[^>]*>)',
        r'\1\n    <link rel="stylesheet" href="\2css/mobile-fix.css">',
        content
    )
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        # If it didn't find style.css, it might be weirdly formatted. We'll ignore.
        pass
