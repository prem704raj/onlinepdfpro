import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

# ============================================================
# POINT 7: SEO TECHNICAL - Add "no-upload" / "client-side" / "browser-based" 
# to tool page meta descriptions that currently have generic descriptions
# ============================================================
generic_desc = '100% Free PDF tools: Merge, Split, Compress, Convert, Unlock, Watermark, Sign PDF, OCR text extractor. No registration, No watermark, Works on mobile.'

tool_specific_descs = {
    'merge-pdf': 'Merge PDF files online free — no uploads, 100% browser-based. Combine multiple PDFs into one document instantly. No signup, no watermark. Works offline.',
    'split-pdf': 'Split PDF online free — no file uploads, runs entirely in your browser. Extract pages or split into separate files. No registration, no limits.',
    'compress-pdf': 'Compress PDF to any size online free — zero uploads, 100% client-side processing. Reduce PDF file size up to 90% without quality loss. Works offline.',
    'pdf-to-word': 'Convert PDF to Word (DOCX) online free — no uploads, no servers. 100% browser-based conversion. Preserves formatting. No signup required.',
    'word-to-pdf': 'Convert Word to PDF online free — zero file uploads. Instant browser-based DOCX to PDF conversion. No registration, no watermark.',
    'pdf-to-excel': 'Convert PDF to Excel online free — no uploads, runs in your browser. Extract tables from PDF to XLSX instantly. No signup needed.',
    'excel-to-pdf': 'Convert Excel to PDF online free — zero uploads. Browser-based XLSX to PDF conversion. No registration, no watermark.',
    'sign-pdf': 'Sign PDF documents online free — no uploads, 100% private. Draw, type, or upload your signature. No registration, works on mobile.',
    'pdf-lock': 'Lock PDF with password online free — no file uploads. Encrypt and protect your PDF files in-browser. No signup, no server storage.',
    'ocr': 'OCR PDF online free — extract text from scanned documents without uploading. 100% browser-based text recognition. No signup required.',
    'rotate-pdf': 'Rotate PDF pages online free — no uploads, instant browser processing. Fix document orientation in seconds. No registration needed.',
    'crop-pdf': 'Crop PDF pages online free — no file uploads. Trim margins and resize PDF pages in your browser. No signup, no watermark.',
    'delete-pages': 'Delete pages from PDF online free — no uploads. Remove unwanted pages from your PDF in-browser. No registration required.',
    'add-page-numbers': 'Add page numbers to PDF online free — no uploads. Insert page numbering in your browser. No signup, no watermark.',
    'pdf-watermark': 'Add watermark to PDF online free — no file uploads. Stamp text or image watermarks in-browser. No registration needed.',
    'pdf-to-images': 'Convert PDF to JPG/PNG online free — no uploads. Browser-based PDF to image conversion. No signup, no limits.',
    'pdf-to-ppt': 'Convert PDF to PowerPoint online free — no file uploads. Browser-based PDF to PPTX conversion. No registration required.',
    'ppt-to-pdf': 'Convert PPT to PDF online free — no uploads. Browser-based PowerPoint to PDF conversion. No signup, no watermark.',
    'images-to-pdf': 'Convert images to PDF online free — no uploads. Combine JPG, PNG photos into PDF in-browser. No registration required.',
    'image-compress': 'Compress images online free — no uploads. Reduce JPEG/PNG file size in your browser. No signup, no quality loss.',
    'image-crop': 'Crop images online free — no uploads. Trim and resize photos in your browser. No registration needed.',
    'image-resize': 'Resize images online free — no file uploads. Change image dimensions in-browser. No signup, no watermark.',
    'html-to-pdf': 'Convert HTML to PDF online free — no uploads. Browser-based webpage to PDF conversion. No registration required.',
    'repair-pdf': 'Repair corrupted PDF online free — no file uploads. Fix damaged PDF files in your browser. No signup needed.',
    'csv-to-xlsx': 'Convert CSV to Excel online free — no uploads. Browser-based CSV to XLSX conversion. No registration needed.',
    'xlsx-to-csv': 'Convert Excel to CSV online free — no uploads. Browser-based XLSX to CSV conversion. No signup required.',
    'qr-generator': 'Generate QR codes online free — no uploads. Create custom QR codes in your browser. No registration needed.',
    'rotate-pdf-godmode': 'Advanced PDF rotation online free — no uploads. Reorder, rotate and delete PDF pages in-browser. No signup needed.',
}

# ============================================================
# POINT 9: ACCESSIBILITY - Fix small microcopy font sizes
# ============================================================

# ============================================================
# POINT 13: EVENT TRACKING - Add GA4 event tracking script
# ============================================================
event_tracking_script = """
<!-- GA4 Event Tracking -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Track tool usage
    document.querySelectorAll('.upload-btn, .btn-primary').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (typeof gtag === 'function') {
                gtag('event', 'tool_interaction', {
                    'event_category': 'Tool',
                    'event_label': document.title,
                    'value': 1
                });
            }
        });
    });
    // Track downloads
    document.querySelectorAll('[id*="download"], .download-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (typeof gtag === 'function') {
                gtag('event', 'file_download', {
                    'event_category': 'Download',
                    'event_label': document.title,
                    'value': 1
                });
            }
        });
    });
});
</script>
"""

for filepath in html_files:
    if 'node_modules' in filepath: continue
    unix_fp = filepath.replace('\\', '/')
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # --- POINT 7: Replace generic meta description with tool-specific one ---
    basename = os.path.basename(filepath).replace('.html', '')
    if basename in tool_specific_descs and generic_desc in html:
        new_desc = tool_specific_descs[basename]
        html = html.replace(generic_desc, new_desc)
        modified = True

    # --- POINT 9: Increase microcopy font sizes for accessibility ---
    # Font sizes less than 12px on visible text are problematic
    if 'font-size:11px' in html:
        html = html.replace('font-size:11px', 'font-size:13px')
        modified = True
    if 'font-size: 11px' in html:
        html = html.replace('font-size: 11px', 'font-size: 13px')
        modified = True

    # --- POINT 13: Add GA4 event tracking to tool pages ---
    if 'tool_interaction' not in html and ('upload-btn' in html or 'upload-zone' in html or 'uploadZone' in html):
        body_end = html.rfind('</body>')
        if body_end != -1:
            html = html[:body_end] + event_tracking_script + html[body_end:]
            modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"SEO/A11Y/Analytics fix: {filepath}")
