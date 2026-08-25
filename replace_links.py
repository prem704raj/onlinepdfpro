import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # 1. Update Navigation links (href="../help.html" or href="help.html")
    # Replace anything pointing to help.html with support.html
    # but be careful with exact matches
    content = re.sub(r'href="(\.\./)?help\.html"', r'href="\1support.html"', content)
    content = re.sub(r'href="(/?|\.\./)help\.html"', r'href="\1support.html"', content)
    
    # Update navigation links for contact.html
    # Contact is merged to support, but if it's right next to Help, it might be redundant.
    # Let's just point contact to support too, or just delete the contact link.
    # We will just point it to support.html to avoid broken links if someone clicks it.
    content = re.sub(r'href="(\.\./)?contact\.html"', r'href="\1support.html"', content)
    content = re.sub(r'href="(/?|\.\./)contact\.html"', r'href="\1support.html"', content)
    
    content = re.sub(r'>Help<', '>Support<', content)
    content = re.sub(r'>Contact<', '>Support<', content)
    
    # Update sw.js caching list
    if 'sw.js' in filepath:
        content = re.sub(r'[\'"]([/\.\\]*)help\.html[\'"],?\s*', '', content)
        content = re.sub(r'[\'"]([/\.\\]*)contact\.html[\'"],?\s*', '', content)
        content = re.sub(r'[\'"]([/\.\\]*)disclaimer\.html[\'"],?\s*', '', content)

    # Update sitemap.txt
    if 'sitemap.txt' in filepath:
        content = re.sub(r'.*?/help\.html\n', '', content)
        content = re.sub(r'.*?/contact\.html\n', '', content)
        content = re.sub(r'.*?/disclaimer\.html\n', '', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated:", filepath)

for root, _, files in os.walk('c:/Users/prem7/.gemini/antigravity/scratch/doctools/src'):
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.njk') or file.endswith('.txt'):
            process_file(os.path.join(root, file))
