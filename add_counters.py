import os
import re

tools_map = {
    'tools/merge-pdf.html': 'mergePDF',
    'tools/compress-pdf.html': 'compressPDF',
    'tools/sign-pdf.html': 'signPDF',
    'tools/ocr.html': 'ocrPDF',
    'tools/images-to-pdf.html': 'imagesToPDF',
    'tools/pdf-to-word.html': 'pdfToWord',
    'tools/word-to-pdf.html': 'wordToPDF',
    'tools/excel-to-pdf.html': 'excelToPDF',
    'tools/ppt-to-pdf.html': 'pptToPDF',
    'tools/pdf-to-images.html': 'pdfToJPG', 
    'tools/pdf-to-excel.html': 'pdfToExcel',
    'tools/pdf-to-ppt.html': 'pdfToPPT',
    'tools/rotate-pdf.html': 'rotatePDF',
    'tools/delete-pages.html': 'deletePDF',
    'tools/crop-pdf.html': 'cropPDF',
    'tools/pdf-lock.html': 'lockPDF',
    'tools/add-page-numbers.html': 'pageNumbers',
    'tools/html-to-pdf.html': 'htmlToPDF',
    'flatten-pdf.html': 'flattenPDF',
    'voice-to-pdf.html': 'voiceToPDF',
    'compare-pdf.html': 'comparePDF',
    'qr-pdf.html': 'qrPDF',
    'pdf-reader.html': 'pdfReader',
    'pdf-editor.html': 'pdfEditor',
    'tools/repair-pdf.html': 'repairPDF'
}

badge_html = """
<div style="text-align:center; margin:15px 0;">
  <span style="padding:8px 20px; background:#f0f9ff; border-radius:50px; font-size:13px; color:#2563eb; font-weight:bold;">
    <span id="counter-total-short">127K</span>+ PDFs processed by our users
  </span>
</div>
"""

for path, tool_name in tools_map.items():
    if not os.path.exists(path):
        print(f"Skipping {path} - does not exist")
        continue

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add counter script at the bottom before </body>
    script_src = "../counter.js" if path.startswith("tools/") else "counter.js"
    script_tag = f'<script src="{script_src}"></script>'
    if script_tag not in content:
        content = content.replace('</body>', f'{script_tag}\n</body>')

    # 2. Add badge right after </header>
    if 'id="counter-total-short"' not in content:
        content = content.replace('</header>', f'</header>\n{badge_html}')

    # 3. Add increment logic
    increment_code = f"incrementCounter('{tool_name}');\nincrementTodayCount();"
    if increment_code not in content and f"incrementCounter" not in content:
        patterns = [
            r"(resultsSection\.style\.display\s*=\s*'block';)",
            r"(document\.getElementById\('resultBox'\)\.style\.display\s*=\s*'block';)",
            r"(document\.getElementById\('resultsSection'\)\.style\.display\s*=\s*'block';)",
            r"(document\.getElementById\('resultSection'\)\.style\.display\s*=\s*'block';)",
            # Editor specific
            r"(download\(\s*pdfBytes\s*,)",
            r"(download\(\s*pdfBytesOut\s*,)",
            r"(download\(\s*flattenedBytes\s*,)",
            r"(download\(\s*modifiedPdfBytes\s*,)",
            # Reader specific
            r"(document\.getElementById\('viewerContainer'\)\.style\.display\s*=\s*'flex';)",
            # Compare specific
            r"(document\.getElementById\('diffResult'\)\.style\.display\s*=\s*'block';)",
            # generic download calls
            r"(\sdownload\([^\)]+\);)",
        ]

        injected = False
        for p in patterns:
            match = re.search(p, content)
            if match:
                content = re.sub(p, f"    {increment_code}\n\\1", content, count=1)
                injected = True
                print(f"Successfully injected increment logic to {path}")
                break

        if not injected:
            print(f"FAILED to auto-inject in {path} - you must do it manually!")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done running add_counters.py")
