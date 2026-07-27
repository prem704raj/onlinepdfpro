import os
import re
import glob

def get_nav(filepath):
    filename = filepath.replace('\\', '/')
    is_tools = "active" if "tools.html" in filename or "/tools/" in filename else ""
    is_blog = "active" if "blog.html" in filename or "/blog/" in filename else ""
    is_about = "active" if "about.html" in filename else ""
    is_help = "active" if "help.html" in filename else ""
    
    # Strip empty classes
    is_tools = ' ' + is_tools if is_tools else ''
    is_blog = ' ' + is_blog if is_blog else ''
    is_about = ' ' + is_about if is_about else ''
    is_help = ' ' + is_help if is_help else ''

    return f'''<nav class="nav" id="nav">
<a class="nav-link{is_tools}" href="/tools.html">Tools</a>
<a class="nav-link{is_blog}" href="/blog.html">Blog</a>
<a class="nav-link{is_about}" href="/about.html">About</a>
<a class="nav-link{is_help}" href="/help.html">Help</a>
<a class="nav-link mobile-only-nav" href="/history.html">History</a>
<a class="nav-link pwa-install-link" href="#" id="pwaNavInstall" onclick="triggerPwaInstall(event)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>Install App</a>
</nav>'''

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace duplicate logo alt
    # Current: <img alt="OnlinePDFPro" class="logo-icon"
    # Target: <img alt="" class="logo-icon"
    new_content = re.sub(r'<img\s+alt="OnlinePDFPro"\s+class="logo-icon"', r'<img alt="" class="logo-icon"', content)
    new_content = re.sub(r'<img\s+class="logo-icon"\s+alt="OnlinePDFPro"', r'<img class="logo-icon" alt=""', new_content)

    # Replace nav block
    nav_html = get_nav(filepath)
    new_content = re.sub(r'<nav\s+class="nav"\s+id="nav">.*?</nav>', nav_html, new_content, flags=re.DOTALL)
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    root_dir = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"
    
    html_files = []
    # Root html files
    for file in glob.glob(os.path.join(root_dir, "*.html")):
        if "_site" not in file and "node_modules" not in file:
            html_files.append(file)
            
    # Tools html files
    for file in glob.glob(os.path.join(root_dir, "tools", "*.html")):
        html_files.append(file)

    # Blog html files
    for file in glob.glob(os.path.join(root_dir, "blog", "*.html")):
        html_files.append(file)

    modified_count = 0
    for file in html_files:
        if process_file(file):
            print(f"Modified: {file}")
            modified_count += 1
            
    print(f"\nTotal files modified: {modified_count}")

if __name__ == "__main__":
    main()
