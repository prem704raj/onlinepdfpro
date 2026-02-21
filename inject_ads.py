import os
import glob

# The four ad codes provided by the user
AD_HEAD = """
    <!-- Google AdSense Head -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
</head>"""

AD_STICKY_BOTTOM = """
    <!-- Google AdSense Sticky Bottom -->
    <div style="position:fixed; bottom:0; left:0; width:100%; background:white; padding:8px; box-shadow:0 -4px 20px rgba(0,0,0,0.1); text-align:center; z-index:9999;">
      <ins class="adsbygoogle"
           style="display:inline-block;width:320px;height:100px"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="5555555555"></ins>
      <script>
           (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
</body>"""

AD_HOMEPAGE = """
        <!-- Google AdSense Homepage (Below Hero) -->
        <div style="text-align:center; margin:40px 0;">
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot="1234567890"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script>
               (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </div>
        """

AD_TOOL_PAGE = """
            <!-- Google AdSense Tool Page (After Result) -->
            <div style="text-align:center; margin:50px 0;">
              <ins class="adsbygoogle"
                   style="display:block"
                   data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                   data-ad-slot="9876543210"
                   data-ad-format="auto"
                   data-full-width-responsive="true"></ins>
              <script>
                   (adsbygoogle = window.adsbygoogle || []).push({});
              </script>
            </div>
"""

def inject_ads(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Inject Head Ad
    if '<script async src="https://pagead2.googlesyndication.com' not in content:
        if '</head>' in content:
            content = content.replace('</head>', AD_HEAD)
    
    # 2. Inject Sticky Bottom Ad
    if 'data-ad-slot="5555555555"' not in content:
        if '</body>' in content:
            content = content.replace('</body>', AD_STICKY_BOTTOM)

    # 3. Specific placements
    filename = os.path.basename(filepath)
    
    # Index.html: below hero, before popular tools
    if filename == 'index.html':
        if 'data-ad-slot="1234567890"' not in content:
            target = '<section class="popular-tools">'
            if target in content:
                content = content.replace(target, AD_HOMEPAGE + target)
    
    # Tool pages: end of <main> container
    elif filepath.replace('\\', '/').startswith('tools/') and filename.endswith('.html'):
        if 'data-ad-slot="9876543210"' not in content:
            target = '</main>'
            if target in content:
                # Place it right before </main>
                content = content.replace(target, AD_TOOL_PAGE + target)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Find all HTML files
html_files = glob.glob('*.html') + glob.glob('tools/*.html')
for f in html_files:
    print(f"Injecting ads into {f}")
    inject_ads(f)

print("Done.")
