import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

clarity_script = """
    <!-- Microsoft Clarity -->
    <script type="text/javascript">
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
    </script>
"""

def get_tool_name(filepath):
    basename = os.path.basename(filepath)
    name = basename.replace('.html', '').replace('-pdf', '').replace('pdf-', '').replace('-', ' ')
    if name == 'merge': return 'Merge PDF'
    if name == 'split': return 'Split PDF'
    if name == 'compress': return 'Compress PDF'
    if basename == 'pdf-to-word.html': return 'PDF to Word'
    if basename == 'word-to-pdf.html': return 'Word to PDF'
    if basename == 'pdf-to-excel.html': return 'PDF to Excel'
    if basename == 'excel-to-pdf.html': return 'Excel to PDF'
    if basename == 'pdf-editor.html': return 'PDF Editor'
    if basename == 'ocr.html': return 'OCR PDF'
    if basename == 'images-to-pdf.html': return 'Images to PDF'
    return name.title() + " PDF"

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Add Microsoft Clarity to all pages
    if 'YOUR_CLARITY_ID' not in html and 'clarity.ms' not in html:
        head_end = html.find('</head>')
        if head_end != -1:
            html = html[:head_end] + clarity_script + html[head_end:]
            modified = True

    # Breadcrumbs & Related Tools only for tool pages
    exclude_tools = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'blog.html', 'help.html', 'google6ec5c9097526273f.html']
    unix_filepath = filepath.replace('\\', '/')
    
    if not unix_filepath.startswith('blog/') and unix_filepath not in exclude_tools:
        tool_name = get_tool_name(unix_filepath)

        # 2. Add Breadcrumbs HTML
        breadcrumb_html = f"""
        <nav class="breadcrumbs" style="padding: 15px 20px; font-size: 14px; color: #64748b; margin: 0 auto; max-width: 1060px;">
            <a href="/" style="color: #2563eb; text-decoration: none;">Home</a> &gt; 
            <a href="/tools.html" style="color: #2563eb; text-decoration: none;">Tools</a> &gt; 
            <span style="color: #1e293b; font-weight: 500;">{tool_name}</span>
        </nav>
"""
        if 'class="breadcrumbs"' not in html:
            header_end = html.find('</header>')
            if header_end != -1:
                html = html[:header_end + 9] + "\n" + breadcrumb_html + html[header_end + 9:]
                modified = True
            else:
                main_start = html.find('<main')
                if main_start != -1:
                    main_start_end = html.find('>', main_start)
                    html = html[:main_start_end + 1] + "\n" + breadcrumb_html + html[main_start_end + 1:]
                    modified = True

        # 3. Add Breadcrumb Schema
        breadcrumb_schema = f"""
<script type="application/ld+json">
{{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://onlinepdfpro.com"
        }},
        {{
            "@type": "ListItem",
            "position": 2,
            "name": "Tools",
            "item": "https://onlinepdfpro.com/tools.html"
        }},
        {{
            "@type": "ListItem",
            "position": 3,
            "name": "{tool_name}"
        }}
    ]
}}
</script>"""
        if '"@type": "BreadcrumbList"' not in html:
            body_end = html.rfind('</body>')
            if body_end != -1:
                html = html[:body_end] + breadcrumb_schema + "\n" + html[body_end:]
                modified = True

        # 4. Add Related Tools
        related_tools_html = """
    <section class="related-tools" style="margin: 40px auto; padding: 0 20px; max-width: 1060px;">
        <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 20px;">Related PDF Tools</h2>
        <div class="tools-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <a href="/tools/split-pdf.html" style="display: block; padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s;">
                <h3 style="margin: 0 0 8px; color: #2563eb; font-size: 18px;">Split PDF</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Extract pages from PDF files</p>
            </a>
            <a href="/tools/compress-pdf.html" style="display: block; padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s;">
                <h3 style="margin: 0 0 8px; color: #2563eb; font-size: 18px;">Compress PDF</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Reduce PDF file size</p>
            </a>
            <a href="/tools/pdf-to-word.html" style="display: block; padding: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s;">
                <h3 style="margin: 0 0 8px; color: #2563eb; font-size: 18px;">PDF to Word</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Convert PDF to DOCX</p>
            </a>
        </div>
    </section>
"""
        if 'class="related-tools"' not in html:
            faq_start = html.find('<section class="faq-section')
            if faq_start != -1:
                html = html[:faq_start] + related_tools_html + "\n    " + html[faq_start:]
                modified = True
            else:
                 inject_point = html.find('<!-- Divider -->')
                 if inject_point != -1:
                     html = html[:inject_point] + related_tools_html + "\n    " + html[inject_point:]
                     modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Applied Step 7/8 to: {filepath}")
