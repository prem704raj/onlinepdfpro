import re

content = open('index.html', 'r', encoding='utf-8').read()

# Remove the CSS class definition (including lines before/after)
content = re.sub(r'\s*\.hp-section-head-icon\s*{[^}]+}', '', content)

# Remove all the spans with icons
content = re.sub(r'<span class="hp-section-head-icon".*?</span>', '', content, flags=re.DOTALL | re.IGNORECASE)
content = re.sub(r"<span class='hp-section-head-icon'.*?</span>", '', content, flags=re.DOTALL | re.IGNORECASE)

open('index.html', 'w', encoding='utf-8').write(content)
print('Done replacing icons.')
