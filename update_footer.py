import glob, re, os

# Read the new footer from index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract the new footer block
footer_match = re.search(r'<footer class="footer".*?</footer>', index_content, flags=re.DOTALL)
if not footer_match:
    print("Could not find footer in index.html")
    exit(1)

new_footer = footer_match.group(0)
print('Extracted new footer.')

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
    
    # Let's adjust the footer logo link to relative path if we are in /tools
    target_footer = new_footer
    if 'tools\\' in f or 'tools/' in f:
        target_footer = target_footer.replace('href="index.html"', 'href="../index.html"')
        target_footer = target_footer.replace('href="tools.html"', 'href="../tools.html"')
        target_footer = target_footer.replace('href="about.html"', 'href="../about.html"')
        target_footer = target_footer.replace('href="help.html"', 'href="../help.html"')
        target_footer = target_footer.replace('href="privacy.html"', 'href="../privacy.html"')
        target_footer = target_footer.replace('href="terms.html"', 'href="../terms.html"')
        target_footer = target_footer.replace('href="sitemap.xml"', 'href="../sitemap.xml"')
    
    # We want to replace the old footer block.
    new_content = re.sub(r'<footer class="footer".*?</footer>', target_footer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        updated += 1
        print(f"Updated {f}")

print(f'\nDone. Updated {updated} files with the new trust footer.')
