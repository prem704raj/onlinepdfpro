import os
from bs4 import BeautifulSoup

base_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'
blog_html = os.path.join(base_dir, 'blog.html')
blog_dir = os.path.join(base_dir, 'blog')

with open(blog_html, 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

def get_category_color(title):
    title = title.lower()
    if 'compress' in title or 'reduce' in title: return '#1e3a5f' # blue
    if 'merge' in title or 'split' in title: return '#2d1b4e' # purple
    if 'convert' in title or 'images' in title: return '#0d3330' # teal
    if 'protect' in title or 'safe' in title: return '#1a2f1a' # green
    if 'presentation' in title or 'docx' in title: return '#2563eb' # blue
    return '#1e3a5f'

# Standard Book Open SVG for blog posts
svg_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>'

cards = soup.find_all('a', class_='blog-card')
for card in cards:
    href = card.get('href', '')
    if href.startswith('blog/'):
        filename = href.replace('blog/', '')
        filepath = os.path.join(blog_dir, filename)
        if not os.path.exists(filepath):
            # Remove the card if the file doesn't exist
            card.extract()
            continue
            
    # File exists, now replace the emoji
    title_el = card.find('h3')
    title = title_el.text if title_el else ''
    
    img_div = card.find('div', class_='blog-card-img')
    if img_div:
        color = get_category_color(title)
        
        new_icon_container = soup.new_tag('div', style=f'background: {color};')
        new_icon_container['class'] = 'hp-icon-container'
        
        svg = BeautifulSoup(svg_icon, 'html.parser')
        new_icon_container.append(svg)
        img_div.replace_with(new_icon_container)

# Add CSS for hp-icon-container to blog.html if not present
css_to_add = """
    <style>
        .hp-icon-container {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }

        .hp-icon-container svg {
            width: 24px;
            height: 24px;
            stroke: white;
        }
    </style>
"""

content = str(soup)
if '.hp-icon-container' not in content:
    content = content.replace('</head>', css_to_add + '</head>')

with open(blog_html, 'w', encoding='utf-8') as f:
    f.write(content)

print("Blog page updated: emojis replaced with SVGs, and missing blogs removed.")
