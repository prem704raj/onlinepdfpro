import os
import re

# Standalone tool pages in root (not in tools/ folder)
standalone_pages = [
    'qr-pdf.html',
    'pdf-reader.html',
    'compare-pdf.html',
    'flatten-pdf.html',
    'voice-to-pdf.html',
    'pdf-editor.html',
    'excel-to-pdf.html',
    'word-to-pdf.html',
]

# Upload area CSS to inject (needed for the upload zones to be visible)
upload_area_css = """
    <style>
        .upload-area {
            border: 3px dashed #cbd5e1;
            border-radius: 24px;
            padding: 60px 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            background: white;
            color: #333;
        }
        .upload-area:hover {
            border-color: #2563eb;
            background: #f0f9ff;
        }
        .container {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 20px;
        }
        body {
            color: #333 !important;
        }
        header {
            background: #1e293b !important;
        }
        header h1, header h1 a {
            color: white !important;
        }
    </style>
"""

for page in standalone_pages:
    if not os.path.exists(page):
        print(f"Skipping {page} - not found")
        continue
    
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # Add tools.css if missing
    if '/css/tools.css' not in content and 'css/tools.css' not in content:
        content = content.replace('css/style.css">', 'css/style.css">\n    <link rel="stylesheet" href="css/tools.css">')
        modified = True
    
    # Add upload-area inline CSS if .upload-area is used but not styled
    if 'class="upload-area"' in content and '.upload-area {' not in content:
        content = content.replace('</head>', f'{upload_area_css}\n</head>')
        modified = True
    
    if modified:
        with open(page, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {page}")

print("Done fixing standalone pages.")
