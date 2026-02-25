import os

blog_posts = [
    "How to Merge PDF Files Online for Free (2025 Guide)",
    "How to Compress PDF Files Without Losing Quality",
    "How to Convert PDF to Word Online Free",
    "How to Split PDF into Multiple Files",
    "Best Free Online PDF Tools in 2025 (Comparison)",
    "How to Remove Password from PDF Online",
    "How to Add Page Numbers to PDF Online",
    "How to Convert Images to PDF Online",
    # MONTH 2
    "PDF vs DOCX: Which Format Should You Use?",
    "How to Edit PDF Files Online Without Adobe Acrobat",
    "How to Sign PDF Documents Online for Free",
    "How to Convert Excel to PDF Online",
    "OCR Technology: How to Extract Text from Images",
    "How to Reduce PDF File Size for Email",
    "How to Convert PPT to PDF Online",
    # MONTH 3
    "How to Merge PDF on iPhone Without App",
    "How to Compress PDF Below 100KB",
    "How to Convert Scanned PDF to Word",
    "How to Add Watermark to PDF Online",
    "How to Convert WhatsApp Chat to PDF",
    "How to Convert Aadhaar PDF to JPG",
    "Best PDF Tools for Students in India"
]

def generate_slug(title):
    slug = title.lower().replace('-', ' ').replace(':', '').replace('(', '').replace(')', '').replace('?', '')
    slug = slug.replace(' ', '-')
    return slug

os.makedirs('blog', exist_ok=True)

for i, title in enumerate(blog_posts):
    slug = generate_slug(title)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | OnlinePDFPro Blog</title>
    <meta name="description" content="Learn {title.lower()} with our complete step-by-step guide. Free, fast, and secure.">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/tools.css">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="Learn {title.lower()} with our complete step-by-step guide. Free, fast, and secure.">
    <meta property="og:url" content="https://onlinepdfpro.com/blog/{slug}.html">
    <meta property="og:type" content="article">
</head>
<body style="background: #f8fafc; font-family: 'Inter', sans-serif; color: #334155;">
    <header class="header" style="background: white; padding: 20px 0; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100;">
        <div class="container" style="display:flex; justify-content:space-between; align-items:center; max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <a href="../index.html" class="logo" style="text-decoration:none;">
                <span style="font-size:24px; font-weight:800; color:#2563eb; letter-spacing:-1px;">Online<span style="color:#1e293b;">PDF</span>Pro</span>
            </a>
            <nav style="display:flex; gap:20px;">
                <a href="../tools.html" style="text-decoration:none; color:#1e293b; font-weight:600;">All Tools</a>
                <a href="../blog.html" style="text-decoration:none; color:#2563eb; font-weight:600;">Blog</a>
            </nav>
        </div>
    </header>

    <main style="max-width: 800px; margin: 40px auto; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <article>
            <h1 style="font-size: 36px; color: #1e293b; margin-bottom: 20px; line-height: 1.3;">{title}</h1>
            <div style="color: #64748b; font-size: 15px; margin-bottom: 40px; display: flex; gap: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
                <span>📅 Published: February 2026</span>
                <span>⏱️ Reading time: 5-8 min</span>
            </div>
            
            <h2 style="font-size: 28px; color: #1e293b; margin-top: 40px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">What is this Guide About?</h2>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;">Welcome to our comprehensive guide on <strong>{title.lower()}</strong>. In this article, we cover everything you need to know, providing step-by-step instructions and best practices.</p>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;"><em>(Note: Expand this section with a 200+ word introduction focusing on user intent and keyword optimization.)</em></p>
            
            <h2 style="font-size: 28px; color: #1e293b; margin-top: 40px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">How to Process Your Files (Step by Step)</h2>
            <h3 style="font-size: 22px; color: #2563eb; margin-top: 30px; margin-bottom: 12px;">Step 1: Open OnlinePDFPro</h3>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;">Navigate to our secure online tool. No registration or software installation is required.</p>
            
            <h3 style="font-size: 22px; color: #2563eb; margin-top: 30px; margin-bottom: 12px;">Step 2: Upload Your Documents</h3>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;">Drag and drop your files directly into the browser window or click the upload button to select them from your device.</p>
            
            <h3 style="font-size: 22px; color: #2563eb; margin-top: 30px; margin-bottom: 12px;">Step 3: Execute and Download</h3>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;">Configure any necessary settings, then click the processing button. Your file will be processed locally in your browser and ready for download instantly.</p>
            
            <h2 style="font-size: 28px; color: #1e293b; margin-top: 40px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Why Use OnlinePDFPro?</h2>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;">Unlike other platforms, OnlinePDFPro processes everything directly in your browser. This means your files are never uploaded to any external server, ensuring 100% privacy and lightning-fast speeds.</p>
            
            <h2 style="font-size: 28px; color: #1e293b; margin-top: 40px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">FAQ</h2>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;"><strong>Is it really free?</strong><br>Yes, OnlinePDFPro is completely free to use with no hidden fees or absolute limits on standard processing.</p>
            
            <h2 style="font-size: 28px; color: #1e293b; margin-top: 40px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Conclusion</h2>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.7;">We hope this guide helped you! Get started now and manage your documents efficiently.</p>
            
            <div style="margin-top: 50px; padding: 40px; background: #eff6ff; border-radius: 16px; text-align: center; border: 1px solid #bfdbfe;">
                <h2 style="margin-top: 0; border: none; font-size: 24px; color: #1e3a8a;">Ready to try it yourself?</h2>
                <p style="font-size: 16px; color: #3b82f6; margin-bottom: 20px;">Experience the fastest, most secure PDF tools on the web.</p>
                <a href="../tools.html" style="display: inline-block; padding: 14px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background 0.2s;">Explore All Tools &rarr;</a>
            </div>
        </article>
    </main>
    
    <footer style="background:#f8fafc; padding:40px 20px; text-align:center; border-top:1px solid #e2e8f0; margin-top:60px;">
        <p style="color:#64748b; font-size:14px;">© 2026 Online PDF Pro. 100% Client-Side Processing.</p>
    </footer>
</body>
</html>"""
    
    with open(f'blog/{slug}.html', 'w', encoding='utf-8') as f:
        f.write(html)

blog_list_html_month1 = ""
blog_list_html_month2 = ""
blog_list_html_month3 = ""

for i, title in enumerate(blog_posts):
    slug = generate_slug(title)
    card = f"""
            <a href="blog/{slug}.html" style="display:block; text-decoration:none; color:inherit; background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; transition:transform 0.2s, box-shadow 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <span style="background:#eff6ff; color:#2563eb; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;">GUIDE</span>
                    <span style="color:#64748b; font-size:13px;">5 min read</span>
                </div>
                <h3 style="font-size: 18px; color: #1e293b; margin: 0 0 10px; line-height: 1.4;">{title}</h3>
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">Learn {title.lower()} with our complete step-by-step guide. Fast and secure.</p>
            </a>"""
    if i < 8:
        blog_list_html_month1 += card
    elif i < 15:
        blog_list_html_month2 += card
    else:
        blog_list_html_month3 += card

try:
    with open('blog.html', 'r', encoding='utf-8') as f:
        blog_html = f.read()

    insert_str = f"""
        <div class="hp-section" style="max-width: 1060px; margin: 40px auto; padding: 0 20px;">
            
            <div style="margin-bottom: 60px;">
                <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; display:flex; align-items:center; gap:10px;">
                    <span style="background:#fef3c7; color:#d97706; padding:4px 10px; border-radius:6px; font-size:14px;">Month 1</span> High Priority Guides
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
                    {blog_list_html_month1}
                </div>
            </div>
            
            <div style="margin-bottom: 60px;">
                <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; display:flex; align-items:center; gap:10px;">
                    <span style="background:#e0e7ff; color:#4f46e5; padding:4px 10px; border-radius:6px; font-size:14px;">Month 2</span> Intermediate Content
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
                    {blog_list_html_month2}
                </div>
            </div>
            
            <div style="margin-bottom: 60px;">
                <h2 style="font-size: 24px; color: #1e293b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; display:flex; align-items:center; gap:10px;">
                    <span style="background:#dcfce7; color:#16a34a; padding:4px 10px; border-radius:6px; font-size:14px;">Month 3</span> Long-Tail Articles
                </h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">
                    {blog_list_html_month3}
                </div>
            </div>
            
        </div>
    """

    start_idx = blog_html.find('<div class="blog-grid')
    if start_idx != -1:
        end_idx = blog_html.find('</main>', start_idx)
        if end_idx != -1:
            blog_html = blog_html[:start_idx] + insert_str + "\n" + blog_html[end_idx:]

    with open('blog.html', 'w', encoding='utf-8') as f:
        f.write(blog_html)
        
    print("Blog generation and root blog.html update complete.")
    
except Exception as e:
    print(f"Error updating blog.html: {{e}}")
