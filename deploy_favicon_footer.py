import os
import re
import urllib.request

# 1. Download Favicons
print("Downloading favicons...")
try:
    urllib.request.urlretrieve("https://placehold.co/32x32/2563eb/ffffff.png?text=PDF&font=Montserrat", "favicon-32x32.png")
    urllib.request.urlretrieve("https://placehold.co/16x16/2563eb/ffffff.png?text=PDF&font=Montserrat", "favicon-16x16.png")
    urllib.request.urlretrieve("https://placehold.co/180x180/2563eb/ffffff.png?text=PDF&font=Montserrat", "apple-touch-icon.png")
    print("Favicons downloaded successfully.")
except Exception as e:
    print(f"Error downloading favicons: {e}")

# 2. HTML to inject
favicon_tags = """
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
"""

new_footer = """
<footer style="background:white; padding:40px 20px; margin-top:60px; box-shadow:0 -2px 20px rgba(0,0,0,0.05);">
  <div style="max-width:1200px; margin:0 auto;">
    
    <!-- Top Footer -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:30px; margin-bottom:30px;">
      
      <!-- About -->
      <div>
        <h4 style="color:#2563eb; margin:0 0 15px; font-size:18px;">Online PDF Pro</h4>
        <p style="color:#666; font-size:14px; line-height:1.6;">Free online PDF tools used by 100,000+ people worldwide. No registration, no watermark, no limits.</p>
      </div>

      <!-- Popular Tools -->
      <div>
        <h4 style="color:#333; margin:0 0 15px; font-size:16px;">Popular Tools</h4>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin:8px 0;"><a href="/tools/merge-pdf.html" style="color:#666; text-decoration:none; font-size:14px;">Merge PDF</a></li>
          <li style="margin:8px 0;"><a href="/tools/compress-pdf.html" style="color:#666; text-decoration:none; font-size:14px;">Compress PDF</a></li>
          <li style="margin:8px 0;"><a href="/tools/sign-pdf.html" style="color:#666; text-decoration:none; font-size:14px;">Sign PDF</a></li>
          <li style="margin:8px 0;"><a href="/tools/pdf-to-word.html" style="color:#666; text-decoration:none; font-size:14px;">PDF to Word</a></li>
          <li style="margin:8px 0;"><a href="/pdf-editor.html" style="color:#666; text-decoration:none; font-size:14px;">PDF Editor</a></li>
        </ul>
      </div>

      <!-- More Tools -->
      <div>
        <h4 style="color:#333; margin:0 0 15px; font-size:16px;">More Tools</h4>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin:8px 0;"><a href="/tools/ocr.html" style="color:#666; text-decoration:none; font-size:14px;">OCR Extract Text</a></li>
          <li style="margin:8px 0;"><a href="/voice-to-pdf.html" style="color:#666; text-decoration:none; font-size:14px;">Voice to PDF</a></li>
          <li style="margin:8px 0;"><a href="/tools/pdf-to-images.html" style="color:#666; text-decoration:none; font-size:14px;">PDF to JPG</a></li>
          <li style="margin:8px 0;"><a href="/compare-pdf.html" style="color:#666; text-decoration:none; font-size:14px;">Compare PDFs</a></li>
          <li style="margin:8px 0;"><a href="/qr-pdf.html" style="color:#666; text-decoration:none; font-size:14px;">QR Code in PDF</a></li>
        </ul>
      </div>

      <!-- Company -->
      <div>
        <h4 style="color:#333; margin:0 0 15px; font-size:16px;">Company</h4>
        <ul style="list-style:none; padding:0; margin:0;">
          <li style="margin:8px 0;"><a href="/about.html" style="color:#666; text-decoration:none; font-size:14px;">About Us</a></li>
          <li style="margin:8px 0;"><a href="/contact.html" style="color:#666; text-decoration:none; font-size:14px;">Contact Us</a></li>
          <li style="margin:8px 0;"><a href="/privacy.html" style="color:#666; text-decoration:none; font-size:14px;">Privacy Policy</a></li>
          <li style="margin:8px 0;"><a href="/terms.html" style="color:#666; text-decoration:none; font-size:14px;">Terms of Service</a></li>
          <li style="margin:8px 0;"><a href="/blog.html" style="color:#666; text-decoration:none; font-size:14px;">Blog</a></li>
        </ul>
      </div>

    </div>

    <!-- Divider -->
    <div style="height:1px; background:#e2e8f0; margin:20px 0;"></div>

    <!-- Bottom Footer -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
      <p style="color:#94a3b8; font-size:13px; margin:0;">© 2026 Online PDF Pro. All rights reserved. Made with ❤️ in India.</p>
      <div style="display:flex; gap:15px;">
        <span style="padding:6px 14px; background:#f0f9ff; border-radius:20px; font-size:12px; color:#2563eb; font-weight:bold;">🔒 Your files are safe</span>
        <span style="padding:6px 14px; background:#f0fdf4; border-radius:20px; font-size:12px; color:#10b981; font-weight:bold;">⚡ 100% Client-Side</span>
      </div>
    </div>

  </div>
</footer>
"""

# 3. Process all HTML files
html_files = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.gemini' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # Inject Favicons
    if 'href="/favicon-32x32.png"' not in content:
        # replace existing <link rel="icon" href="/favicon.ico"> or similar
        content = re.sub(r'<link rel="icon" href="/favicon\.ico">[\s]*<link rel="apple-touch-icon" href="/icon-192\.png">', '', content)
        content = re.sub(r'<link rel="manifest" href="/manifest\.json">', f'<link rel="manifest" href="/manifest.json">\n{favicon_tags}', content)
        if favicon_tags not in content:
            # Fallback
            content = content.replace('</head>', f'{favicon_tags}\n</head>')
        modified = True

    # Inject Footer
    if 'Online PDF Pro. All rights reserved. Made with ❤️ in India.' not in content:
        # Remove old footer if exists
        content = re.sub(r'<footer class="footer".*?</footer>', '', content, flags=re.DOTALL)
        content = re.sub(r'<footer style=".*?">.*?</footer>', '', content, flags=re.DOTALL)
        
        # Insert new footer before </body> or <script src="counter.js">
        if '<script src="../counter.js"></script>' in content:
            content = content.replace('<script src="../counter.js"></script>', f'{new_footer}\n<script src="../counter.js"></script>')
        elif '<script src="counter.js"></script>' in content:
            content = content.replace('<script src="counter.js"></script>', f'{new_footer}\n<script src="counter.js"></script>')
        else:
            content = content.replace('</body>', f'{new_footer}\n</body>')
        modified = True

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

print("Deployment of Favicons and Footer complete.")
