import os
import re

root_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'
count_big = 0
count_blog = 0

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(subdir, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            
            # Big footer
            new_content = re.sub(
                r'(<li style="margin:8px 0;"><a href="[^"]*blog\.html">Blog</a></li>\s*)(</ul>)',
                r'\1    <li style="margin:8px 0;"><a href="mailto:support@onlinepdfpro.com">support@onlinepdfpro.com</a></li>\n                    \2',
                new_content,
                flags=re.IGNORECASE
            )
            
            # Blog footer
            new_content = re.sub(
                r'(<a href="[^"]*privacy\.html">Privacy</a>)(\s*</p>)',
                r'\1 &middot; <a href="mailto:support@onlinepdfpro.com">support@onlinepdfpro.com</a>\2',
                new_content,
                flags=re.IGNORECASE
            )
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                if 'class="blog-footer"' in new_content and 'support@onlinepdfpro.com' in new_content:
                    count_blog += 1
                else:
                    count_big += 1

print(f'Updated big footer in {count_big} files.')
print(f'Updated blog footer in {count_blog} files.')
