import os
import glob
import re

base_dir = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

left_sidebar_html = """
<!-- Adsterra Left Sidebar -->
<aside class="adsterra-left-sidebar">
    <script async="async" data-cfasync="false" src="https://pl29768941.effectivecpmnetwork.com/c1911fba272d590b2b7350d21541da84/invoke.js"></script>
    <div id="container-c1911fba272d590b2b7350d21541da84"></div>
</aside>
"""

bottom_banner_html = """
<!-- Adsterra Bottom Banner -->
<div class="adsterra-bottom-banner">
    <script type="text/javascript">
        atOptions = {
            'key' : '9bd9cf32bab07235ebd0b819e511a2b2',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
        };
    </script>
    <script type="text/javascript" src="https://www.highperformanceformat.com/9bd9cf32bab07235ebd0b819e511a2b2/invoke.js"></script>
</div>
"""

html_files = []
for f in glob.glob(os.path.join(base_dir, "*.html")):
    html_files.append(f)
for f in glob.glob(os.path.join(base_dir, "tools", "*.html")):
    html_files.append(f)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<main ' not in content:
        continue

    # Only inject into files that missed the left sidebar
    if 'adsterra-left-sidebar' not in content:
        # Find the <main> tag
        main_match = re.search(r'(<main[^>]*>)', content)
        if main_match:
            main_tag = main_match.group(1)
            content = content.replace(main_tag, main_tag + "\n" + left_sidebar_html)
            
            # Inject bottom banner right before </main>
            if 'adsterra-bottom-banner' not in content and '</main>' in content:
                content = content.replace('</main>', bottom_banner_html + "\n</main>")
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                print(f"Fixed missing ads in {os.path.basename(filepath)}")
