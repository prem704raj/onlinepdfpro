import re

files = [
    'tools/pdf-to-word.html',
    'tools/word-to-pdf.html',
    'tools/excel-to-pdf.html',
    'tools/ppt-to-pdf.html'
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove the residual compress-pdf JS logic
    content = re.sub(r'<script>\s*\(function \(\) \{\s*const \{ PDFDocument \}[\s\S]*?\}\)\(\);\s*</script>', '', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f"Cleaned {f}")
