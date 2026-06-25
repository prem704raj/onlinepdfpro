import re
import os

blog_html = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools\blog.html'
with open(blog_html, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove blog-hero background
content = re.sub(
    r'(\.blog-hero\s*\{[^}]*)background:\s*linear-gradient[^;]+;',
    r'\1background: transparent;',
    content
)
# Remove pseudo element
content = re.sub(
    r'\.blog-hero::before\s*\{[^}]+\}',
    r'',
    content
)
# Remove hardcoded white text
content = re.sub(r'color:\s*white\s*!important;', r'', content)
content = re.sub(r'color:\s*rgba\(\d+,\s*\d+,\s*\d+,\s*0\.9\)\s*!important;', r'', content)

# Replace 📚 emoji with SVG in blog.html
svg_icon = '<span class="hp-section-head-icon" style="background: #2563eb; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; margin-right: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></span>'
content = content.replace('<h2>📚 OnlinePDFPro Blog</h2>', f'<h2 style="display:flex; justify-content:center; align-items:center;">{svg_icon} OnlinePDFPro Blog</h2>')

with open(blog_html, 'w', encoding='utf-8') as f:
    f.write(content)

about_html = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools\about.html'
with open(about_html, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace 👋 emoji with SVG
svg_info = '<span class="hp-section-head-icon" style="background: #1e3a5f; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; margin-right: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>'
content = content.replace('<h1 class="hero-title">👋 About OnlinePDFPro</h1>', f'<h1 class="hero-title" style="display:flex; justify-content:center; align-items:center;">{svg_info} About OnlinePDFPro</h1>')

with open(about_html, 'w', encoding='utf-8') as f:
    f.write(content)

print("Hero fixes applied.")
