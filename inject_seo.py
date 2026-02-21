import os
import glob
import re

# The new SEO Head block to be injected into every file
NEW_HEAD = """<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    
    <title>Online PDF Pro - Free PDF Tools: Merge, Compress, Sign, OCR & More</title>
    <meta name="description" content="100% Free PDF tools: Merge, Split, Compress, Convert, Unlock, Watermark, Sign PDF, OCR text extractor. No registration, No watermark, Works on mobile.">

    <!-- Super SEO Tags -->
    <meta name="keywords" content="free pdf tools, merge pdf online free, compress pdf online, sign pdf online free, ocr pdf hindi, pdf to word free, unlock pdf online, online pdf editor">
    <meta name="author" content="Online PDF Pro">
    <meta name="robots" content="index, follow">

    <!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
    <meta property="og:title" content="Online PDF Pro - All PDF Tools 100% Free Forever">
    <meta property="og:description" content="Merge, Compress, Sign, OCR, Convert - Sab free hai bhai! No login, No limit">
    <meta property="og:image" content="https://onlinepdfpro.com/og-image.jpg">
    <meta property="og:url" content="https://onlinepdfpro.com">
    <meta property="og:type" content="website">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Online PDF Pro - Free PDF Tools India">
    <meta name="twitter:description" content="Best free PDF tools used by 100K+ students">
    <meta name="twitter:image" content="https://onlinepdfpro.com/og-image.jpg">

    <!-- Favicon + PWA -->
    <link rel="icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Core CSS (Using absolute path for nested tools compatibility) -->
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/tools.css">

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXX');
    </script>
</head>"""

def replace_head(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find everything between <head> and </head> inclusive
    pattern = re.compile(r'<head>.*?</head>', re.DOTALL | re.IGNORECASE)
    
    # Extract existing <style> block if any to preserve page-specific CSS
    style_match = re.search(r'(<style\b[^>]*>.*?</style>)', content, re.DOTALL | re.IGNORECASE)
    existing_style = style_match.group(1) if style_match else ""

    # We must append custom head injections if the file needs them
    # like pdf.js linking on OCR / Sign pages, or AdSense code.
    head_addition = ""
    if "data-ad-client" in content or "ca-pub-XXXXXXXXXXXXXXXX" in content:
        head_addition += """\n    <!-- Google AdSense Head -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>"""
    
    if "pdf.js" in content or "pdfjsLib" in content or "tools/ocr.html" in filepath.replace("\\", "/") or "tools/sign-pdf.html" in filepath.replace("\\", "/"):
        head_addition += """\n    <!-- PDF.js for client-side rendering -->
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>"""
    
    # Close the head tag properly after additions
    final_new_head = NEW_HEAD.replace('</head>', head_addition + '\n    ' + existing_style + '\n</head>')

    if pattern.search(content):
        new_content = pattern.sub(final_new_head, content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated HEAD in {filepath}")
    else:
        print(f"Skipped {filepath} - no head tag found")

def add_tool_descriptions(filepath):
    # Only applies to index (and potentially tools.html if desired, but primarily index tool grids based on user request)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple mapping of tool names to their new SEO subtext
    replacements = {
        '<h3 class="tool-name">Sign PDF</h3>': '<h3 class="tool-name">Sign PDF</h3>\n                        <small style="font-size:12px; color:var(--text-muted); opacity: 0.8;">Free electronic signature online</small>',
        '<h3 class="tool-name">Compress PDF</h3>': '<h3 class="tool-name">Compress PDF</h3>\n                        <small style="font-size:12px; color:var(--text-muted); opacity: 0.8;">Reduce file size up to 90%</small>',
        '<h3 class="tool-name">Merge PDF</h3>': '<h3 class="tool-name">Merge PDF</h3>\n                        <small style="font-size:12px; color:var(--text-muted); opacity: 0.8;">Combine multiple files instantly</small>',
        '<h3 class="tool-name">OCR - Extract Text</h3>': '<h3 class="tool-name">OCR - Extract Text</h3>\n                        <small style="font-size:12px; color:var(--text-muted); opacity: 0.8;">Extract text from images (Hindi+Eng)</small>'
    }
    
    modified = False
    for old, new in replacements.items():
        if old in content and new not in content:
            content = content.replace(old, new)
            modified = True
            
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added tool sub-descriptions to {filepath}")

html_files = glob.glob('*.html') + glob.glob('tools/*.html')
for f in html_files:
    replace_head(f)

# Also apply subtexts to grids
add_tool_descriptions("index.html")
add_tool_descriptions("tools.html")

print("SEO Optimization Complete.")
