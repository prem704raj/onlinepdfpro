"""
FINAL FIX: Replace all tool-header intros with hardcoded inline styles
that match OCR's visual output exactly. No CSS variable dependencies.
"""
import re, glob

PAGES = {
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
    'tools/images-to-pdf.html': ('File Conversion', 'Images to PDF', 'Convert JPG, PNG, and other images to a single PDF document. Arrange pages in any order.'),
    'tools/qr-generator.html': ('Utility', 'QR Code Generator', 'Generate QR codes from any text or URL instantly. Download as PNG or SVG.'),
    'tools/repair-pdf.html': ('PDF Recovery', 'Repair Corrupted PDF', 'Fix and recover damaged or corrupted PDF files. Restore your documents instantly.'),
    'tools/rotate-pdf-godmode.html': ('PDF Processing', 'Rotate PDF Pages', 'Rotate individual PDF pages or entire documents. Choose 90, 180, or 270 degrees.'),
}

# Exact visual match of OCR page - hardcoded colors, no CSS vars
def make_intro(cat, title, desc):
    return f'''
    <div class="tool-header" style="text-align:center; margin-bottom:48px;">
        <span class="section-tag" style="display:inline-block; padding:6px 18px; background:rgba(37,99,235,0.08); color:#5b6abf; border-radius:50px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px;">{cat}</span>
        <h1 class="tool-title" style="font-size:2.5rem; font-weight:800; color:#1a1a2e; margin:0 0 12px; line-height:1.2;">{title}</h1>
        <p class="tool-description" style="color:#6b7280; font-size:1rem; max-width:520px; margin:0 auto; line-height:1.6;">{desc}</p>
    </div>
'''

count = 0
for filename, (cat, title, desc) in PAGES.items():
    try:
        html = open(filename, 'r', encoding='utf-8').read()
    except FileNotFoundError:
        continue

    new_intro = make_intro(cat, title, desc)

    # Remove existing tool-header div (find start and matching close)
    match = re.search(r'<div class="tool-header"', html)
    if match:
        start = match.start()
        depth = 0
        i = start
        end = -1
        while i < len(html):
            if html[i:i+4] == '<div':
                depth += 1
            elif html[i:i+6] == '</div>':
                depth -= 1
                if depth == 0:
                    end = i + 6
                    break
            i += 1
        if end > start:
            # Trim trailing whitespace
            while end < len(html) and html[end] in '\r\n\t ':
                end += 1
            html = html[:start] + new_intro + html[end:]
            open(filename, 'w', encoding='utf-8').write(html)
            count += 1
            print(f"FIXED: {filename}")
    else:
        # No tool-header exists, insert after <main> or container
        main_m = re.search(r'(<main[^>]*>)', html)
        if main_m:
            pos = main_m.end()
            after = html[pos:pos+300]
            cont_m = re.search(r'(\s*<div[^>]*class="container"[^>]*>)', after)
            if cont_m:
                pos += cont_m.end()
            html = html[:pos] + new_intro + html[pos:]
            open(filename, 'w', encoding='utf-8').write(html)
            count += 1
            print(f"ADDED: {filename}")

print(f"\nDone: {count} pages")
