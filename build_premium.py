import os, re

# Tools to process
tools = [
    {
        'source': 'pdf-to-word.html',
        'target': 'tools/pdf-to-word.html',
        'title': 'PDF to Word Online Free - Convert PDF to DOCX | Online PDF Pro',
        'desc': 'Convert PDF to Word document online for free. Extract text from PDF to editable DOCX file. No registration needed.',
        'keys': 'pdf to word, pdf to docx, convert pdf to word free, pdf to word converter',
        'canonical': 'https://onlinepdfpro.com/tools/pdf-to-word.html',
        'tag': 'Convert to Word',
        'h1': 'PDF to Word'
    },
    {
        'source': 'word-to-pdf.html',
        'target': 'tools/word-to-pdf.html',
        'title': 'Word to PDF Online Free - Convert DOCX to PDF | Online PDF Pro',
        'desc': 'Convert Word documents to PDF online for free. DOCX to PDF converter. No registration, no watermark.',
        'keys': 'word to pdf, docx to pdf, convert word to pdf free, doc to pdf',
        'canonical': 'https://onlinepdfpro.com/tools/word-to-pdf.html',
        'tag': 'Convert to PDF',
        'h1': 'Word to PDF'
    },
    {
        'source': 'excel-to-pdf.html',
        'target': 'tools/excel-to-pdf.html',
        'title': 'Excel to PDF Online Free - Convert XLSX to PDF | Online PDF Pro',
        'desc': 'Convert Excel spreadsheets to PDF online for free. XLSX to PDF converter with table formatting. No registration.',
        'keys': 'excel to pdf, xlsx to pdf, convert excel to pdf free, spreadsheet to pdf',
        'canonical': 'https://onlinepdfpro.com/tools/excel-to-pdf.html',
        'tag': 'Convert to PDF',
        'h1': 'Excel to PDF'
    },
    {
        'source': 'ppt-to-pdf.html',
        'target': 'tools/ppt-to-pdf.html',
        'title': 'PPT to PDF Online Free - Convert PowerPoint to PDF | Online PDF Pro',
        'desc': 'Convert PowerPoint presentations to PDF online for free. PPTX to PDF converter. No registration, no watermark.',
        'keys': 'ppt to pdf, powerpoint to pdf, convert pptx to pdf free, presentation to pdf',
        'canonical': 'https://onlinepdfpro.com/tools/ppt-to-pdf.html',
        'tag': 'Convert to PDF',
        'h1': 'PPT to PDF'
    }
]

# Read the base template
with open('tools/compress-pdf.html', 'r', encoding='utf-8') as f:
    template = f.read()

# Extract top parts of the template
head_top = template.split('<title>')[0]
head_bottom = template.split('</head>')[1].split('<main')[0] # from </head> to just before <main
footer_part = template.split('</main>')[1]

for tool in tools:
    if not os.path.exists(tool['source']):
        continue
    
    with open(tool['source'], 'r', encoding='utf-8') as f:
        src = f.read()
    
    # Extract inner CSS
    style_match = re.search(r'<style>(.*?)</style>', src, re.DOTALL)
    extra_style = f'<style>{style_match.group(1)}</style>' if style_match else ''
    
    # Extract inner main content (everything inside <main...>)
    main_match = re.search(r'<main[^>]*>(.*?)</main>', src, re.DOTALL)
    main_content = main_match.group(1) if main_match else ''
    
    # Extract scripts
    script_match = re.findall(r'<script[^>]*>[\s\S]*?</script>', src)
    # Exclude scripts already in template (like json-ld if we want to handle it, but wait, the source has js scripts for Mammoth/docx/pdfjs)
    js_scripts = [s for s in script_match if 'application/ld+json' not in s]
    scripts_str = '\n'.join(js_scripts)
    
    # Schema
    schema_match = re.search(r'<script type="application/ld\+json">[\s\S]*?</script>', src)
    schema_str = schema_match.group(0) if schema_match else ''
    
    # Assemble Head
    new_head = head_top + f"""<title>{tool['title']}</title>
    <meta name="description" content="{tool['desc']}">
    <meta name="keywords" content="{tool['keys']}">
    <meta name="author" content="Online PDF Pro">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{tool['canonical']}">
    
    <!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
    <meta property="og:title" content="{tool['title']}">
    <meta property="og:description" content="{tool['desc']}">
    <meta property="og:image" content="https://onlinepdfpro.com/og-image.jpg">
    <meta property="og:url" content="{tool['canonical']}">
    <meta property="og:type" content="website">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{tool['title']}">
    <meta name="twitter:description" content="{tool['desc']}">
    <meta name="twitter:image" content="https://onlinepdfpro.com/og-image.jpg">

    <!-- Favicon + PWA -->
    <link rel="icon" href="../favicon.ico">
    <link rel="apple-touch-icon" href="../icon-192.png">
    <link rel="manifest" href="../manifest.json">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Core CSS (Using absolute path for nested tools compatibility) -->
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/tools.css">

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){{dataLayer.push(arguments);}}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXX');
    </script>

    {schema_str}
    {extra_style}
</head>"""

    # Assemble Main
    # We use the standard tool page container
    new_main = f"""
    <main id="main" class="tool-page">
        <div class="container" style="max-width: 900px;">
            <div class="tool-header" style="text-align:center; margin-bottom: 20px;">
                <span class="section-tag fade-in">{tool['tag']}</span>
                <h1 class="tool-title fade-in">{tool['h1']}</h1>
            </div>
            {main_content}
        </div>
    </main>
"""

    # Assemble Full Document
    full_html = new_head + head_bottom + new_main + footer_part
    
    # Inject scripts right before </body>
    if '</body>' in full_html:
        full_html = full_html.replace('</body>', scripts_str + '\n</body>')
    else:
        full_html += scripts_str
        
    # Write new tool file
    with open(tool['target'], 'w', encoding='utf-8') as f:
        f.write(full_html)
    
    print(f"Generated {tool['target']}")

# Update index.html and tools.html links
for root_file in ['index.html', 'tools.html']:
    with open(root_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('href="pdf-to-word.html"', 'href="tools/pdf-to-word.html"')
    content = content.replace('href="word-to-pdf.html"', 'href="tools/word-to-pdf.html"')
    content = content.replace('href="excel-to-pdf.html"', 'href="tools/excel-to-pdf.html"')
    content = content.replace('href="ppt-to-pdf.html"', 'href="tools/ppt-to-pdf.html"')
    
    with open(root_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated links in {root_file}")

# Delete old root files
for t in tools:
    if os.path.exists(t['source']):
        os.remove(t['source'])
        print(f"Removed {t['source']}")
