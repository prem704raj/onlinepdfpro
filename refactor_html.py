from bs4 import BeautifulSoup
import re

html_file = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools\index.html'

with open(html_file, 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

def get_icon(name):
    icons = {
        'Compress PDF': '<polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>',
        'Merge PDF': '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
        'Split PDF': '<circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line>',
        'PDF Reader': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
        'PDF Presentation Mode': '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        'PDF to Text Extractor': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
        'HTML to PDF': '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
        'PDF Scratchpad': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
        'JPG to PDF': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
        'Image Compressor': '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>',
        'Image Resize': '<path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path>',
        'Image Crop': '<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>',
        'Background Remover': '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"></path><path d="m5 16 3-3"></path><path d="m16 5 3-3"></path>',
        'HEIC to JPG': '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>',
        'WebP to JPG': '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
        'Image Format Converter': '<path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>',
        'Passport Photo Maker': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
        'Crop PDF': '<path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>',
        'Delete PDF Pages': '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
        'Rotate PDF': '<path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>',
        'PDF Page Reorder': '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>',
        'PDF to JPG Converter': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
        'PDF Bookmarks': '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>',
        'Add Page Numbers to PDF': '<line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>',
        'PDF Watermark': '<path d="M12 22a8 8 0 0 0 8-8c0-3.5-3-7-8-12-5 5-8 8.5-8 12a8 8 0 0 0 8 8Z"></path>',
        'Redact PDF': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
        'Image to Text (OCR)': '<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>',
        'Speech to Text (Voice to PDF)': '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>',
        'Text to Speech (TTS)': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>',
        'Presentation Maker': '<polygon points="5 3 19 3 21 13 3 13 5 3"></polygon><line x1="12" y1="13" x2="12" y2="21"></line><line x1="8" y1="21" x2="16" y2="21"></line>',
        'QR Code Generator': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect>',
        'Compare PDFs': '<path d="M12 3v18"></path><rect x="3" y="8" width="6" height="8" rx="1"></rect><rect x="15" y="8" width="6" height="8" rx="1"></rect>',
        'PDF Highlighter Extractor': '<path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle>',
        'Resume & CV Builder': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 21V8.5a1.5 1.5 0 0 0-3 0V21"></path><path d="M8 21v-5a2 2 0 0 1 2-2h4"></path>',
        'Invoice Generator': '<path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path>'
    }
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{icons.get(name, icons["Compress PDF"])}</svg>'

def get_section_icon(title):
    icons = {
        'Essential PDF Tools': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
        'Document Converters': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>',
        'Image & Media Tools': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        'Organize & Manage': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
        'Security & Safety': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
        'AI & Smart Tools': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="14" width="16" height="6" rx="2" ry="2"></rect><path d="M12 4v10"></path><line x1="8" y1="8" x2="16" y2="8"></line></svg>',
        'Smart Utilities': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
        'Business & Career': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>'
    }
    for key in icons:
        if key in title:
            return icons[key]
    return icons['Essential PDF Tools']

def get_category_color(title):
    if "PDF" in title or "Document" in title or "Organize" in title: return "#1e3a5f"
    if "Image" in title: return "#2d1b4e"
    if "AI" in title: return "#0d3330"
    return "#1a2f1a"

tools_section = soup.find('div', id='tools-section')

# Sections loop
headers = tools_section.find_all('div', class_='hp-section-head')
grids = tools_section.find_all('div', class_='hp-tools-grid')

for header, grid in zip(headers, grids):
    h2 = header.find('h2')
    original_title = h2.text.strip()
    # Remove emoji (first character or first two characters)
    clean_title = re.sub(r'^[^\w\s]+', '', original_title).strip()
    
    color = get_category_color(clean_title)
    
    # Update header
    h2.clear()
    icon_span = soup.new_tag('span', style=f'background: {color};')
    icon_span['class'] = 'hp-section-head-icon'
    icon_span.append(BeautifulSoup(get_section_icon(clean_title), 'html.parser'))
    h2.append(icon_span)
    h2.append(clean_title)
    
    # Process tools
    cards = grid.find_all('a', class_='hp-tool-card')
    for card in cards:
        # Remove any inline styles if we want, or keep it.
        # Find <h3> and check for NEW
        h3 = card.find('h3')
        new_tag = h3.find('span')
        tool_name = ""
        if new_tag and 'NEW' in new_tag.text:
            new_tag.extract()
            badge = soup.new_tag('span')
            badge['class'] = 'hp-badge-new'
            badge.string = 'NEW'
            card.insert(0, badge)
        tool_name = h3.text.strip()
        
        # Replace span.hp-tool-card-icon
        icon_span = card.find('span', class_='hp-tool-card-icon')
        if icon_span:
            new_icon_container = soup.new_tag('div', style=f'background: {color};')
            new_icon_container['class'] = 'hp-icon-container'
            svg = BeautifulSoup(get_icon(tool_name), 'html.parser')
            new_icon_container.append(svg)
            icon_span.replace_with(new_icon_container)
            
    # Orphaned cards padding
    count = len(cards)
    remainder = count % 4
    if remainder != 0:
        needed = 4 - remainder
        for _ in range(needed):
            soon_card = soup.new_tag('div', attrs={'class': 'hp-tool-card coming-soon'})
            soon_icon = soup.new_tag('div', attrs={'class': 'hp-icon-container', 'style': 'background: rgba(255,255,255,0.05);'})
            soon_icon.append(BeautifulSoup('<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" width="28" height="28" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>', 'html.parser'))
            h3 = soup.new_tag('h3', style='color: rgba(255,255,255,0.4);')
            h3.string = 'Coming Soon'
            p = soup.new_tag('p', style='color: rgba(255,255,255,0.2);')
            p.string = 'More tools in development'
            soon_card.append(soon_icon)
            soon_card.append(h3)
            soon_card.append(p)
            grid.append(soon_card)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("HTML restructuring complete!")
