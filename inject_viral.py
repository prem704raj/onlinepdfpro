import os
import glob

VIRAL_BADGE = """
<!-- Viral Badge (Made with Love) -->
<div style="text-align:center; margin:40px 0; padding:20px; background:#f0f9ff; border-radius:16px; border:3px solid #2563eb;">
  <h2 style="margin:0; color:#2563eb; font-size:24px;">Made with ❤️ by a 2nd year CSE student</h2>
  <p style="margin:10px 0 0; font-size:18px;">Help me grow → Share with your friends 🙏</p>
  <div style="margin-top:15px;">
    <a href="https://wa.me/?text=Best%20Free%20PDF%20tool%20I%20found%20%F0%9F%94%A5%0A%0A%E2%9E%A1%EF%B8%8F%20Sign%20PDF%2C%20OCR%2C%20Merge%2C%20Compress%20-%20sab%20free%0A%F0%9F%94%97%20https%3A//onlinepdfpro.com" 
       style="margin:0 10px; padding:12px 24px; background:#25d366; color:white; text-decoration:none; border-radius:50px; font-weight:bold; display:inline-block; margin-bottom:10px;">📲 Share on WhatsApp</a>
    
    <a href="https://www.facebook.com/sharer/sharer.php?u=https://onlinepdfpro.com" 
       style="margin:0 10px; padding:12px 24px; background:#1877f2; color:white; text-decoration:none; border-radius:50px; font-weight:bold; display:inline-block; margin-bottom:10px;">Facebook</a>
    
    <a href="https://twitter.com/intent/tweet?text=Best%20free%20PDF%20tool%20ever%20%F0%9F%94%A5%20OCR%2C%20Sign%2C%20Compress%20-%20all%20free!&url=https://onlinepdfpro.com" 
       style="margin:0 10px; padding:12px 24px; background:#1da1f2; color:white; text-decoration:none; border-radius:50px; font-weight:bold; display:inline-block; margin-bottom:10px;">Twitter</a>
  </div>
</div>
"""

INDEX_FREE_BANNER = """
<!-- 100% FREE FOREVER Banner -->
<div style="text-align:center; margin:40px 0; padding:25px; background:#fff8c5; border-radius:16px; border:2px dashed #f59e0b;">
  <h3 style="margin:0; color:#d97706; font-size:26px;">🔥 100% FREE FOREVER 🔥</h3>
  <p style="font-size:18px; margin:10px 0; color: #333;">No login, No limit, No watermark</p>
  <p style="font-size:20px; font-weight:bold; color:#dc2626;">Tag your college group right now 👇</p>
</div>
"""

WHATSAPP_FLOAT = """
<!-- Floating WhatsApp Button -->
<a href="https://wa.me/?text=Best%20Free%20PDF%20tool%20I%20found%20%F0%9F%94%A5%0A%F0%9F%94%97%20https://onlinepdfpro.com" 
   style="position:fixed; bottom:120px; right:20px; background:#25d366; color:white; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:30px; box-shadow:0 4px 20px rgba(0,0,0,0.3); z-index:9999; text-decoration:none;"
   target="_blank">💬</a>
"""

def inject_viral(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. VIRAL BADGE -> just before <footer class="footer">
    # Check if already injected
    if '<!-- Viral Badge (Made with Love) -->' not in content:
        if '<footer class="footer">' in content:
            # For tool pages, we might want it inside the container, but standardizing it just before footer is fine.
            content = content.replace('<footer class="footer">', VIRAL_BADGE + '\n<footer class="footer">')

    # 2. WHATSAPP_FLOAT -> just before </body>
    if '<!-- Floating WhatsApp Button -->' not in content:
        if '</body>' in content:
            # Placed bottom:120px because the sticky ad is at bottom:0 with height 100px.
            content = content.replace('</body>', WHATSAPP_FLOAT + '\n</body>')

    # 3. index.html specifically -> 100% FREE BANNER
    filename = os.path.basename(filepath)
    if filename == 'index.html':
        if '<!-- 100% FREE FOREVER Banner -->' not in content:
            target = '<!-- Popular Tools: Clean grid -->'
            if target in content:
                content = content.replace(target, INDEX_FREE_BANNER + '\n' + target)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Process all files
html_files = glob.glob('*.html') + glob.glob('tools/*.html')
for f in html_files:
    print(f"Injecting viral blocks into {f}")
    inject_viral(f)

print("Viral injection complete.")
