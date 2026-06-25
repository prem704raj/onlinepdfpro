import os
from bs4 import BeautifulSoup

base_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'
blog_dir = os.path.join(base_dir, 'blog')

book_svg = '<span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: rgba(129, 140, 248, 0.15); margin-right: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></span>'

wrench_svg = '<span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: rgba(37, 99, 235, 0.15); margin-right: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></span>'

for filename in os.listdir(blog_dir):
    if not filename.endswith('.html'):
        continue
    filepath = os.path.join(blog_dir, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    soup = BeautifulSoup(content, 'html.parser')
    changed = False
    
    # 1. Replace emojis in h3 tags
    h3_tags = soup.find_all('h3')
    for h3 in h3_tags:
        if '📚 Related Articles' in h3.text:
            h3.clear()
            # We use BeautifulSoup to parse the svg and insert it
            h3.append(BeautifulSoup(book_svg, 'html.parser'))
            h3.append(" Related Articles")
            h3['style'] = "margin:0 0 16px;font-size:20px;color:var(--text-primary,#1e293b); display:flex; align-items:center;"
            changed = True
        elif '🔧 Try These Tools' in h3.text:
            h3.clear()
            h3.append(BeautifulSoup(wrench_svg, 'html.parser'))
            h3.append(" Try These Tools")
            h3['style'] = "margin:0 0 16px;font-size:20px;color:var(--accent); display:flex; align-items:center;"
            changed = True

    # 2. Fix the links under Related Articles and Try These Tools
    # First, let's remove 🔧 emoji from the tool links
    tool_links = soup.find_all('a')
    for a in tool_links:
        if a.text and a.text.startswith('🔧 '):
            a.string = a.text.replace('🔧 ', '')
            changed = True
            
        # Check if it's a related article link (checking if it's in the same dir)
        href = a.get('href', '')
        if not href.startswith('http') and not href.startswith('#') and not href.startswith('../') and not href.startswith('/'):
            # It's likely a relative link to another blog post
            target_path = os.path.join(blog_dir, href)
            # ignore if href has query params or anchors
            clean_href = href.split('?')[0].split('#')[0]
            clean_target = os.path.join(blog_dir, clean_href)
            
            # If the file doesn't exist, remove the link entirely
            if not os.path.exists(clean_target) and clean_href.endswith('.html'):
                a.extract()
                changed = True

    # 3. Replace article category emojis just in case
    cat_spans = soup.find_all('span', class_='article-category')
    for span in cat_spans:
        text = span.text
        if '✂️' in text:
            span.string = text.replace('✂️', '')
            changed = True
        elif '🚀' in text:
            span.string = text.replace('🚀', '')
            changed = True
        elif '🛡️' in text:
            span.string = text.replace('🛡️', '')
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print(f"Updated {filename}")

print("Done.")
