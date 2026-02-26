"""
Fix missing fonts and broken CSS links on the pages we just modified.
"""
import re, glob

PAGES_TO_FIX = [
    'compare-pdf.html', 'excel-to-pdf.html', 'flatten-pdf.html',
    'pdf-bookmark.html', 'pdf-editor.html', 'pdf-reader.html',
    'pdf-summary.html', 'pdf-to-word.html', 'pdf-translator.html',
    'ppt-to-pdf.html', 'qr-pdf.html', 'text-to-audio.html',
    'voice-to-pdf.html', 'word-to-pdf.html',
    'tools/qr-generator.html', 'tools/rotate-pdf-godmode.html',
]

FONT_IMPORTS = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
"""

count = 0

for filename in PAGES_TO_FIX:
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        continue
        
    changed = False
    
    # 1. Fix broken style.css link (<link rel="stylesheet" href="style.css">)
    if '<link rel="stylesheet" href="style.css">' in html:
        # replace with correct path based on folder
        correct_path = '../css/style.css' if filename.startswith('tools/') else 'css/style.css'
        html = html.replace('<link rel="stylesheet" href="style.css">', f'<link rel="stylesheet" href="{correct_path}">')
        changed = True

    # Check for <link rel="stylesheet" href="/css/style.css"> as well 
    # and standardize to relative paths just to be safe, or just leave absolute if it works.
    
    # 2. Add Google Fonts if missing
    if 'fonts.googleapis.com' not in html:
        head_end = html.find('</head>')
        if head_end > 0:
            html = html[:head_end] + FONT_IMPORTS + html[head_end:]
            changed = True
            
    # 3. Ensure style.css and tools.css are correctly linked for sure
    correct_style = '../css/style.css' if filename.startswith('tools/') else 'css/style.css'
    correct_tools = '../css/tools.css' if filename.startswith('tools/') else 'css/tools.css'
    
    # Sometimes they might have absolute paths like /css/style.css, which works on server but maybe not local file://
    # Let's standardize to relative to be totally safe
    html = re.sub(r'<link[^>]*href="[/]?css/style\.css"[^>]*>', f'<link rel="stylesheet" href="{correct_style}">', html)
    html = re.sub(r'<link[^>]*href="[/]?css/tools\.css"[^>]*>', f'<link rel="stylesheet" href="{correct_tools}">', html)

    # If they are completely missing, add them
    if correct_style not in html and '/css/style.css' not in html:
         head_end = html.find('</head>')
         if head_end > 0:
             html = html[:head_end] + f'    <link rel="stylesheet" href="{correct_style}">\n' + html[head_end:]
             changed = True
    if correct_tools not in html and '/css/tools.css' not in html:
         head_end = html.find('</head>')
         if head_end > 0:
             html = html[:head_end] + f'    <link rel="stylesheet" href="{correct_tools}">\n' + html[head_end:]
             changed = True
             
    if changed:
        open(filename, 'w', encoding='utf-8').write(html)
        print(f"FIXED CSS/FONTS: {filename}")
        count += 1
        
print(f"\nDone. Fixed {count} pages.")
