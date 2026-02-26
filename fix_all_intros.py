"""
Fix all tool page intros to match the OCR page pattern exactly.
- For root pages (14): Replace the inline-style tool-header with the proper 
  OCR-style pattern using section-tag, tool-title, tool-description classes
- For tools/ pages (4): Add the proper intro where missing
- Also loads css/style.css + css/tools.css if not already loaded
"""
import re, glob

# ===== DEFINITIONS =====
PAGES = {
    # Root pages
    'compare-pdf.html': ('PDF Comparison', 'Compare PDFs Side by Side', 'Compare two PDF documents and spot differences instantly. Your files never leave your device.'),
    'excel-to-pdf.html': ('File Conversion', 'Excel to PDF Converter', 'Convert Excel spreadsheets to PDF format online for free. No signup, no watermark.'),
    'flatten-pdf.html': ('PDF Processing', 'Flatten PDF', 'Flatten PDF form fields and annotations into a clean, non-editable document. Your files never leave your device.'),
    'pdf-bookmark.html': ('PDF Enhancement', 'PDF Bookmark Editor', 'Add, edit, or remove bookmarks in your PDF documents. Fast, free, and private.'),
    'pdf-editor.html': ('Document Editing', 'PDF Editor', 'Edit text, add images, annotate, and modify PDF files online. No software download needed.'),
    'pdf-reader.html': ('PDF Viewer', 'PDF Reader', 'Read and view PDF documents directly in your browser. Fast, lightweight, and private.'),
    'pdf-summary.html': ('AI Tools', 'AI PDF Summarizer', 'Get instant summary, key points, statistics and word analysis from any PDF. 100% free.'),
    'pdf-to-word.html': ('File Conversion', 'PDF to Word Converter', 'Convert PDF documents to editable Word files online for free. Preserves formatting perfectly.'),
    'pdf-translator.html': ('AI Tools', 'PDF Translator', 'Translate PDF documents to any language instantly. Your files never leave your device.'),
    'ppt-to-pdf.html': ('File Conversion', 'PowerPoint to PDF', 'Convert PowerPoint presentations (.ppt, .pptx) to PDF format online for free.'),
    'qr-pdf.html': ('PDF Enhancement', 'QR Code in PDF', 'Generate QR codes and embed them directly into your PDF documents. Free and instant.'),
    'text-to-audio.html': ('Accessibility', 'Text to Speech & PDF to Audio', 'Convert text or PDF documents to audio with 50+ voices in multiple languages. Free and instant.'),
    'voice-to-pdf.html': ('Document Creation', 'Voice to PDF', 'Speak and convert your voice to a professional PDF document instantly. No typing needed.'),
    'word-to-pdf.html': ('File Conversion', 'Word to PDF Converter', 'Convert Word documents (.doc, .docx) to PDF format online for free. No signup required.'),
    # Tools pages missing intro
    'tools/images-to-pdf.html': ('File Conversion', 'Images to PDF', 'Convert JPG, PNG, and other images to a single PDF document. Arrange pages in any order.'),
    'tools/qr-generator.html': ('Utility', 'QR Code Generator', 'Generate QR codes from any text or URL instantly. Download as PNG or SVG.'),
    'tools/repair-pdf.html': ('PDF Recovery', 'Repair Corrupted PDF', 'Fix and recover damaged or corrupted PDF files. Restore your documents instantly.'),
    'tools/rotate-pdf-godmode.html': ('PDF Processing', 'Rotate PDF Pages', 'Rotate individual PDF pages or entire documents. Choose 90, 180, or 270 degrees.'),
}

# The proper intro HTML matching OCR page pattern
INTRO_HTML = """
    <div class="tool-header">
        <span class="section-tag fade-in">{category}</span>
        <h1 class="tool-title fade-in">{title}</h1>
        <p class="tool-description fade-in" style="animation-delay: 0.1s;">
            {description}
        </p>
    </div>
"""

count = 0
for filename, (category, title, description) in PAGES.items():
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        print(f"  SKIP (not found): {filename}")
        continue

    new_intro = INTRO_HTML.format(category=category, title=title, description=description)
    changed = False

    # STEP 1: Remove old inline-style tool-header if present
    old_pattern = re.search(
        r'<div class="tool-header"[^>]*>.*?</div>\s*',
        html,
        re.DOTALL
    )
    if old_pattern:
        # Count closing divs - the tool-header has 3 child elements, so find the right closing </div>
        start = old_pattern.start()
        # Find the boundaries more carefully  
        block_start = html.find('<div class="tool-header"', start)
        if block_start >= 0:
            # Count nested divs to find the correct closing tag
            depth = 0
            i = block_start
            block_end = -1
            while i < len(html):
                if html[i:i+4] == '<div':
                    depth += 1
                elif html[i:i+6] == '</div>':
                    depth -= 1
                    if depth == 0:
                        block_end = i + 6
                        break
                i += 1
            
            if block_end > block_start:
                # Also remove any trailing whitespace
                while block_end < len(html) and html[block_end] in '\r\n ':
                    block_end += 1
                html = html[:block_start] + new_intro + html[block_end:]
                changed = True

    if not changed:
        # STEP 2: No old tool-header found, insert after <main...> or first container
        main_match = re.search(r'(<main[^>]*>)', html)
        if main_match:
            pos = main_match.end()
            # Check if there's a container div right after
            after_main = html[pos:pos+200]
            container_match = re.search(r'(\s*<div[^>]*class="container"[^>]*>)', after_main)
            if container_match:
                pos = pos + container_match.end()
            html = html[:pos] + new_intro + html[pos:]
            changed = True
        else:
            body_match = re.search(r'(<body[^>]*>)', html)
            if body_match:
                pos = body_match.end()
                html = html[:pos] + new_intro + html[pos:]
                changed = True

    # STEP 3: Ensure css/tools.css is loaded (needed for section-tag, tool-title, etc.)
    is_tools_subdir = filename.startswith('tools/')
    tools_css_path = '/css/tools.css' if is_tools_subdir else 'css/tools.css'
    style_css_path = '/css/style.css' if is_tools_subdir else 'css/style.css'
    
    if 'tools.css' not in html:
        # Add tools.css link before </head>
        head_end = html.find('</head>')
        if head_end > 0:
            css_link = f'\n    <link rel="stylesheet" href="{tools_css_path}">\n'
            html = html[:head_end] + css_link + html[head_end:]
            changed = True

    if changed:
        open(filename, 'w', encoding='utf-8').write(html)
        count += 1
        print(f"  FIXED: {filename}")
    else:
        print(f"  NO CHANGE: {filename}")

print(f"\n✅ Fixed intro on {count} pages")
