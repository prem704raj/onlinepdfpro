import os
import glob
import re

titles_map = {
    'index.html': "Online PDF Pro - Free PDF Tools | Merge, Split, Compress PDF Online",
    'tools/merge-pdf.html': "Merge PDF Online Free - Combine PDF Files Instantly | OnlinePDFPro",
    'tools/split-pdf.html': "Split PDF Online Free - Extract Pages from PDF | OnlinePDFPro",
    'tools/compress-pdf.html': "Compress PDF Online Free - Reduce PDF Size by 90% | OnlinePDFPro",
    'tools/pdf-to-word.html': "PDF to Word Converter Free Online - Convert PDF to DOCX | OnlinePDFPro",
    'pdf-to-word.html': "PDF to Word Converter Free Online - Convert PDF to DOCX | OnlinePDFPro",
    'tools/word-to-pdf.html': "Word to PDF Converter Free Online - DOC to PDF | OnlinePDFPro",
    'word-to-pdf.html': "Word to PDF Converter Free Online - DOC to PDF | OnlinePDFPro",
    'pdf-editor.html': "Free Online PDF Editor - Edit PDF Files Online | OnlinePDFPro",
    'tools/pdf-to-excel.html': "PDF to Excel Converter Free - Convert PDF to XLSX | OnlinePDFPro",
    'pdf-to-excel.html': "PDF to Excel Converter Free - Convert PDF to XLSX | OnlinePDFPro",
    'tools/images-to-pdf.html': "Image to PDF Converter - JPG PNG to PDF Free | OnlinePDFPro",
    'tools/ocr.html': "Free Online OCR - Extract Text from Images & PDF | OnlinePDFPro",
    'ocr.html': "Free Online OCR - Extract Text from Images & PDF | OnlinePDFPro",
    'text-to-audio.html': "Text to Speech Online Free - Convert Text to Audio | OnlinePDFPro",
    'pdf-summary.html': "AI PDF Summarizer - Summarize PDF Online Free | OnlinePDFPro"
}

html_files = glob.glob('**/*.html', recursive=True)

def get_action_from_filename(filename):
    name = os.path.basename(filename).replace('.html', '')
    name = name.replace('-pdf', '').replace('pdf-', '').replace('-', ' ')
    if name == 'merge': return 'merge', 'Merge', 'merged'
    if name == 'split': return 'split', 'Split', 'split'
    if name == 'compress': return 'compress', 'Compress', 'compressed'
    if name == 'images to': return 'convert', 'Convert', 'converted'
    if name == 'to word': return 'convert', 'Convert', 'converted'
    return name, name.title(), 'processed'

for filepath in html_files:
    if 'node_modules' in filepath: continue
    unix_filepath = filepath.replace('\\', '/')
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    modified = False

    # 1. Update Title & OG/Twitter Title
    for key, new_title in titles_map.items():
        if unix_filepath == key:
            html = re.sub(r'<title>.*?</title>', f'<title>{new_title}</title>', html, flags=re.IGNORECASE|re.DOTALL)
            html = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{new_title}">', html)
            html = re.sub(r'<meta name="twitter:title" content=".*?">', f'<meta name="twitter:title" content="{new_title}">', html)
            modified = True
            break

    # 2. Inject FAQ and How It Works into Tool Pages
    exclude = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'blog.html', 'help.html', 'google6ec5c9097526273f.html']
    # If it's a tool page
    if unix_filepath not in exclude:
        action_lower, action_title, action_past = get_action_from_filename(unix_filepath)
        
        # Check if already injected
        if 'class="how-it-works"' not in html:
            
            # Formulate How-it-works
            how_it_works = f"""
    <!-- Added SEO Sections -->
    <section class="how-it-works" style="margin: 40px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 20px;">How to {action_title} PDF Files Online</h2>
        <div class="steps" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div class="step">
                <h3 style="font-size: 16px; color: #2563eb; margin: 0 0 8px;">Step 1: Upload Files</h3>
                <p style="font-size: 14px; color: #64748b; margin: 0;">Click the upload button or drag and drop your files into the tool.</p>
            </div>
            <div class="step">
                <h3 style="font-size: 16px; color: #2563eb; margin: 0 0 8px;">Step 2: Adjust Settings</h3>
                <p style="font-size: 14px; color: #64748b; margin: 0;">Configure your options or arrange files if needed.</p>
            </div>
            <div class="step">
                <h3 style="font-size: 16px; color: #2563eb; margin: 0 0 8px;">Step 3: Click {action_title} & Download</h3>
                <p style="font-size: 14px; color: #64748b; margin: 0;">Click the process button and download your {action_past} file instantly.</p>
            </div>
        </div>
    </section>
"""

            faq_section = f"""
    <section class="faq-section" style="margin: 40px 0;">
        <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 20px;">Frequently Asked Questions</h2>
        
        <div class="faq-item" style="margin-bottom: 20px;">
            <h3 style="font-size: 17px; color: #334155; margin: 0 0 8px;">How to {action_lower} files online for free?</h3>
            <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">Simply upload your files to OnlinePDFPro's {action_lower} tool, adjust any settings, and click "{action_title}." Your {action_past} document will be ready to download in seconds. No signup required, completely free.</p>
        </div>
        
        <div class="faq-item" style="margin-bottom: 20px;">
            <h3 style="font-size: 17px; color: #334155; margin: 0 0 8px;">Is OnlinePDFPro safe to use?</h3>
            <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">Yes! OnlinePDFPro processes all files directly in your browser. Your documents never leave your device and are never uploaded to any server. This makes it the most secure PDF tool available.</p>
        </div>
        
        <div class="faq-item" style="margin-bottom: 20px;">
            <h3 style="font-size: 17px; color: #334155; margin: 0 0 8px;">Can I process multiple files at once?</h3>
            <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">Yes, our tools support processing multiple files at once. There is no limit on the number of files or total file size.</p>
        </div>
        
        <div class="faq-item" style="margin-bottom: 20px;">
            <h3 style="font-size: 17px; color: #334155; margin: 0 0 8px;">Does it work on mobile phones?</h3>
            <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">Yes! OnlinePDFPro works perfectly on all devices - Android phones, iPhones, tablets, laptops and desktops. No app download needed.</p>
        </div>
        
        <div class="faq-item" style="margin-bottom: 20px;">
            <h3 style="font-size: 17px; color: #334155; margin: 0 0 8px;">Is there a file size limit?</h3>
            <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">Since processing happens in your browser, there's no server-side file size limit. You can process files as large as your device can handle.</p>
        </div>
    </section>
"""
            inject_point = html.find('<!-- Divider -->')
            if inject_point != -1:
                html = html[:inject_point] + how_it_works + faq_section + "\n    " + html[inject_point:]
                modified = True
            else:
                 inject_point = html.find('</main>')
                 if inject_point != -1:
                     html = html[:inject_point] + how_it_works + faq_section + "\n    " + html[inject_point:]
                     modified = True
                 else:
                     # Find closing </div> just before footer? If neither exists find </body>
                     body_end = html.rfind('</body>')
                     if body_end != -1:
                          test_point = html.rfind('<script', 0, body_end)
                          if test_point != -1 and "schema.org" in html[test_point:]:
                               html = html[:test_point] + how_it_works + faq_section + "\n    " + html[test_point:]
                          else:
                               html = html[:body_end] + how_it_works + faq_section + "\n    " + html[body_end:]
                          modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Updated Titles/FAQ in: {filepath}")
