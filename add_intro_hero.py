"""
Inject the tool-header intro section (category label + H1 + description) 
into pages that are missing it, matching the pattern from ocr.html.
"""
import re

# Page definitions: filename -> (category, title, description)
PAGES = {
    'compare-pdf.html': ('PDF Comparison', 'Compare PDFs', 'Compare two PDF documents side by side. Spot differences instantly. Your files never leave your device.'),
    'excel-to-pdf.html': ('File Conversion', 'Excel to PDF', 'Convert Excel spreadsheets to PDF format online for free. Your files never leave your device.'),
    'flatten-pdf.html': ('PDF Processing', 'Flatten PDF', 'Flatten PDF form fields and annotations into a non-editable document. Your files never leave your device.'),
    'pdf-bookmark.html': ('PDF Enhancement', 'PDF Bookmark Editor', 'Add, edit, or remove bookmarks in your PDF documents. Your files never leave your device.'),
    'pdf-editor.html': ('Document Editing', 'PDF Editor', 'Edit text, add images, annotate, and modify PDF files online for free. Your files never leave your device.'),
    'pdf-reader.html': ('PDF Viewer', 'PDF Reader', 'Read and view PDF documents directly in your browser. Fast, free, and private.'),
    'pdf-summary.html': ('AI Tools', 'PDF Summary', 'Generate quick summaries of your PDF documents. Your files never leave your device.'),
    'pdf-to-word.html': ('File Conversion', 'PDF to Word', 'Convert PDF documents to editable Word files online for free. Your files never leave your device.'),
    'pdf-translator.html': ('AI Tools', 'PDF Translator', 'Translate PDF documents to any language instantly. Your files never leave your device.'),
    'ppt-to-pdf.html': ('File Conversion', 'PowerPoint to PDF', 'Convert PowerPoint presentations to PDF format online for free. Your files never leave your device.'),
    'qr-pdf.html': ('PDF Enhancement', 'QR Code in PDF', 'Generate QR codes and embed them in your PDF documents. Your files never leave your device.'),
    'text-to-audio.html': ('Accessibility', 'Text to Audio', 'Convert text or PDF to audio with 50+ voices and multiple languages. Free and instant.'),
    'voice-to-pdf.html': ('Document Creation', 'Voice to PDF', 'Speak and convert your voice to a PDF document instantly. Your files never leave your device.'),
    'word-to-pdf.html': ('File Conversion', 'Word to PDF', 'Convert Word documents to PDF format online for free. Your files never leave your device.'),
}

HERO_TEMPLATE = '''
        <div class="tool-header" style="text-align:center; padding:40px 20px 30px; background:var(--bg-secondary, #f8fafc);">
            <span style="display:inline-block; padding:6px 18px; background:rgba(37,99,235,0.1); color:#2563eb; border-radius:50px; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:14px;">{category}</span>
            <h1 style="font-size:clamp(28px,5vw,40px); color:var(--text-primary, #1e293b); margin:0 0 12px; font-weight:800; line-height:1.3;">{title}</h1>
            <p style="font-size:16px; color:var(--text-secondary, #64748b); max-width:600px; margin:0 auto; line-height:1.6;">{description}</p>
        </div>
'''

count = 0
for filename, (category, title, description) in PAGES.items():
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        print(f"  SKIP (not found): {filename}")
        continue

    # Check if already has tool-header
    if 'tool-header' in html:
        print(f"  SKIP (already has intro): {filename}")
        continue

    hero = HERO_TEMPLATE.format(category=category, title=title, description=description)

    # Strategy: Insert right after <main...> tag
    main_match = re.search(r'(<main[^>]*>)', html)
    if main_match:
        insert_pos = main_match.end()
        html = html[:insert_pos] + hero + html[insert_pos:]
        open(filename, 'w', encoding='utf-8').write(html)
        count += 1
        print(f"  ADDED intro: {filename}")
    else:
        # Try inserting after <body> if no <main>
        body_match = re.search(r'(<body[^>]*>)', html)
        if body_match:
            insert_pos = body_match.end()
            html = html[:insert_pos] + '\n    <main>' + hero + html[insert_pos:]
            # Don't close main since page may have its own structure
            open(filename, 'w', encoding='utf-8').write(html)
            count += 1
            print(f"  ADDED intro (after body): {filename}")
        else:
            print(f"  FAILED: {filename} - no <main> or <body> found")

print(f"\n✅ Intro section added to {count} pages")
