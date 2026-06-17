import os
import glob

base_dir = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

right_sidebar_html = """
<!-- Adsterra Right Sidebar -->
<aside class="adsterra-right-sidebar">
    <script type="text/javascript">
        atOptions = {
            'key' : '7839ee4a84c08cddf7e4ef215202ce56',
            'format' : 'iframe',
            'height' : 600,
            'width' : 160,
            'params' : {}
        };
    </script>
    <script type="text/javascript" src="https://www.highperformanceformat.com/7839ee4a84c08cddf7e4ef215202ce56/invoke.js"></script>
</aside>
"""

html_files = []
# Find all html files in root
for f in glob.glob(os.path.join(base_dir, "*.html")):
    html_files.append(f)
# Find all html files in tools directory
for f in glob.glob(os.path.join(base_dir, "tools", "*.html")):
    html_files.append(f)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<main ' not in content:
        continue
        
    # Check if already injected
    if 'adsterra-right-sidebar' in content:
        continue

    # Inject right before </main>
    if '</main>' in content:
        content = content.replace('</main>', right_sidebar_html + "\n</main>")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            print(f"Injected right sidebar ads into {os.path.basename(filepath)}")
