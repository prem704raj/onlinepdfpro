import os
import glob
import re

base_dir = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

files_to_delete = [
    "blog/how-to-split-pdf-into-multiple-files.html",
    "blog/how-to-sign-pdf-documents-online-for-free.html",
    "blog/how-to-remove-password-from-pdf-online.html",
    "blog/how-to-reduce-pdf-file-size-for-email.html",
    "blog/how-to-merge-pdf-on-iphone-without-app.html",
    "blog/how-to-merge-pdf-files-online-for-free-2025-guide.html",
    "blog/how-to-edit-pdf-files-online-without-adobe-acrobat.html",
    "blog/how-to-convert-whatsapp-chat-to-pdf.html",
    "blog/how-to-convert-images-to-pdf-online.html",
    "blog/how-to-convert-aadhaar-pdf-to-jpg.html",
    "blog/how-to-compress-pdf-files-without-losing-quality.html",
    "blog/how-to-compress-pdf-below-100kb.html",
    "blog/how-to-add-watermark-to-pdf-online.html",
    "blog/how-to-add-page-numbers-to-pdf-online.html",
    "blog/best-pdf-tools-for-students-in-india.html",
    "blog/best-free-online-pdf-tools-in-2025-comparison.html",
    "blog/how-to-convert-excel-to-pdf-online.html"
]

print("Starting cleanup...")

# 1. Delete the files
for f in files_to_delete:
    p = os.path.join(base_dir, f)
    if os.path.exists(p):
        os.remove(p)
        print(f"Deleted {p}")

# 2. Update sitemap.txt
with open(os.path.join(base_dir, 'sitemap.txt'), 'r', encoding='utf-8') as f:
    sitemap_txt = f.readlines()
sitemap_txt_clean = []
for line in sitemap_txt:
    if not any(url in line for url in files_to_delete):
        sitemap_txt_clean.append(line)
with open(os.path.join(base_dir, 'sitemap.txt'), 'w', encoding='utf-8') as f:
    f.writelines(sitemap_txt_clean)
print("Cleaned sitemap.txt")

# Update sitemap.xml
with open(os.path.join(base_dir, 'sitemap.xml'), 'r', encoding='utf-8') as f:
    sitemap_xml = f.read()

for f in files_to_delete:
    url_to_remove = f"https://onlinepdfpro.com/{f}"
    pattern = r'<url>\s*<loc>' + re.escape(url_to_remove) + r'</loc>.*?</url>'
    sitemap_xml = re.sub(pattern, '', sitemap_xml, flags=re.DOTALL)

with open(os.path.join(base_dir, 'sitemap.xml'), 'w', encoding='utf-8') as f:
    f.write(sitemap_xml)
print("Cleaned sitemap.xml")

# 3. Clean up tool pages
html_files = glob.glob(os.path.join(base_dir, "*.html")) + glob.glob(os.path.join(base_dir, "tools", "*.html"))
for p in html_files:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = content
    modified = re.sub(r'<section class="how-it-works"[\s\S]*?</section>', '', modified)
    modified = re.sub(r'<section class="faq-section"[\s\S]*?</section>', '', modified)
    
    if modified != content:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Cleaned boilerplate from {p}")

# 4. Clean up blog.html links
with open(os.path.join(base_dir, 'blog.html'), 'r', encoding='utf-8') as f:
    blog_content = f.read()

for f in files_to_delete:
    link_pattern = r'<a\s+href="' + re.escape(f) + r'"\s+class="blog-card"[\s\S]*?</a>'
    blog_content = re.sub(link_pattern, '', blog_content)

with open(os.path.join(base_dir, 'blog.html'), 'w', encoding='utf-8') as f:
    f.write(blog_content)
print("Cleaned blog.html")

print("All tasks completed successfully!")
