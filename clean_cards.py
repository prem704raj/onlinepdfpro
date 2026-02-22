import re

files = ['index.html', 'tools.html']

for target_file in files:
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. We want to remove ALL `<small>` tags completely to achieve the "single concise subtitle"
    # because the <p class="tool-desc"> already serves as the subtitle/description.
    # The audit says: "remove duplicate lines and enforce a strict, single concise subtitle per card."
    # Looking at the HTML:
    # <small style="...">Reduce file size up to 90%</small>
    # <small style="...">Reduce file size up to 90%</small>
    # <p class="tool-desc">Reduce file sizes without quality loss.</p>
    
    # Let's remove any <small>...</small> blocks inside the cards.
    new_content = re.sub(r'<small[^>]*>.*?</small>\s*', '', content, flags=re.DOTALL)
    
    # 2. Add an ID to the search bar to make it easier to manipulate, or elevate it. 
    # For tools.html, there is a search bar. We will move it up in the actual HTML later, 
    # but first let's just clean the cards.

    if new_content != content:
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned up duplicated <small> tags in {target_file}")
    else:
        print(f"No changes needed in {target_file}")
