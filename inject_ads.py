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
# Find all html files in root
for f in glob.glob(os.path.join(base_dir, "*.html")):
    html_files.append(f)
# Find all html files in tools directory
for f in glob.glob(os.path.join(base_dir, "tools", "*.html")):
    html_files.append(f)

for filepath in html_files:
    # Skip blog pages, about, contact, etc. Only modify tool pages
    # Or just modify pages that have <main class="tool-page" ...> or similar
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<main ' not in content:
        continue
        
    # Check if already injected
    if 'adsterra-left-sidebar' in content:
        continue

    # Find <main ... >
    main_pattern = re.compile(r'(<main[^>]*id="main"[^>]*class="[^"]*tool-page[^"]*"[^>]*>)')
    match = main_pattern.search(content)
    if match:
        main_tag = match.group(1)
        # Inject left sidebar right after <main>
        content = content.replace(main_tag, main_tag + "\n" + left_sidebar_html)
        
        # Inject bottom banner right before </main>
        # Actually, it's safer to find </main> and replace it
        if '</main>' in content:
            content = content.replace('</main>', bottom_banner_html + "\n</main>")
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            print(f"Injected ads into {os.path.basename(filepath)}")

