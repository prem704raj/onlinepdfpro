import os
import glob
import re

directory = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

for filepath in glob.glob(os.path.join(directory, "**", "*.html"), recursive=True):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace href="/css/..." with href="css/..." or href="../css/..." depending on depth
    # The safest way for a static site without a dev server is to use relative paths
    
    # Calculate depth to determine if we need css/ or ../css/
    rel_path = os.path.relpath(filepath, directory)
    depth = len(rel_path.split(os.sep)) - 1
    
    if depth == 0:
        css_prefix = "css/"
    else:
        css_prefix = "../" * depth + "css/"
        
    # Replace absolute /css/ paths
    new_content = re.sub(r'href="/css/', f'href="{css_prefix}', content)
    
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}")
