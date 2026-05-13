import os
import re

root_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'

files_to_check = [
    '404.html', 'changelog.html', 'history.html', 'pdf-bookmark.html', 'pdf-editor.html', 
    'pdf-story.html', 'pdf-translator.html', 'presentation-maker.html', 'test-pdf.html', 'text-to-audio.html'
]

count = 0
for file in files_to_check:
    filepath = os.path.join(root_dir, file)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        match = re.search(r'<!-- Company -->.*?</ul>', content, re.DOTALL)
        if match:
            old_block = match.group(0)
            new_block = old_block.replace('</ul>', '    <li style="margin:8px 0;"><a href="mailto:support@onlinepdfpro.com">support@onlinepdfpro.com</a></li>\n                        </ul>')
            
            new_content = content.replace(old_block, new_block)
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                continue
        
        if 'class="blog-footer"' in content:
            new_content = re.sub(
                r'(<a href="[^"]*privacy\.html">Privacy</a>)(\s*</p>)',
                r'\1 &middot; <a href="mailto:support@onlinepdfpro.com">support@onlinepdfpro.com</a>\2',
                content,
                flags=re.IGNORECASE
            )
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                continue

print(f'Updated {count} remaining files')
