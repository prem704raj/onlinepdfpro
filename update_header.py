import glob, re, os

# Read the new header from index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract the new header block
header_match = re.search(r'<header class="header">.*?</header>', index_content, flags=re.DOTALL)
if not header_match:
    print("Could not find header in index.html")
    exit(1)

new_header = header_match.group(0)
print('Extracted new header.')

# Find all html files
root_htmls = glob.glob('*.html')
tool_htmls = glob.glob('tools/*.html')
all_files = root_htmls + tool_htmls

if 'index.html' in all_files:
    all_files.remove('index.html')

updated = 0
for f in all_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We must adjust relative paths if it's inside /tools
    target_header = new_header
    if 'tools\\' in f or 'tools/' in f:
        target_header = target_header.replace('href="index.html"', 'href="../index.html"')
        target_header = target_header.replace('href="tools.html"', 'href="../tools.html"')
        target_header = target_header.replace('href="about.html"', 'href="../about.html"')
        target_header = target_header.replace('href="help.html"', 'href="../help.html"')
    
    # We want to replace the old header block.
    new_content = re.sub(r'<header class="header">.*?</header>', target_header, content, flags=re.DOTALL)
    
    # In tools.html, we also need to remove the old <div class="search-box">
    if f == 'tools.html':
        old_search_box = r'<!-- Search -->\s*<div class="search-box">.*?</div>\s*</div>'
        # Just rip out the old search block entirely if it's there.
        # It looks like:
        # <!-- Search -->
        # <div class="search-box">
        #     <div class="search-wrapper">
        #         <span class="search-icon">🔍</span>
        #         <input type="text" class="search-input" id="toolSearch" placeholder="Search tools...">
        #     </div>
        # </div>
        # A simpler regex:
        new_content = re.sub(r'<!-- Search -->\s*<div class="search-box">.*?</div>\s*</div>', '', new_content, flags=re.DOTALL)
        
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        updated += 1
        print(f"Updated {f}")

print(f'\nDone. Updated {updated} files with the new header search.')
