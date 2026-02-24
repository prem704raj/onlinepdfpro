import os
from datetime import datetime

# Domain configuration
DOMAIN = 'https://onlinepdfpro.com'

# Explicit priority/freq mappings based on page category
PRIORITY_MAP = {
    'index.html': ('1.0', 'daily'),
    'tools.html': ('0.9', 'weekly'),
    'about.html': ('0.6', 'monthly'),
    'privacy.html': ('0.5', 'yearly'),
    'terms.html': ('0.5', 'yearly'),
    'contact.html': ('0.6', 'yearly')
}

DEFAULT_PRIORITY = '0.8'
DEFAULT_FREQ = 'weekly'

def generate_sitemap():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    sitemap_path = os.path.join(root_dir, 'sitemap.xml')
    
    html_files = []
    
    # Files in root
    for f in os.listdir(root_dir):
        if f.endswith('.html'):
            html_files.append(f)
            
    # Files in tools folder
    tools_dir = os.path.join(root_dir, 'tools')
    if os.path.isdir(tools_dir):
        for f in os.listdir(tools_dir):
            if f.endswith('.html'):
                html_files.append(f"tools/{f}")

    # Generate XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    # Filter out testing/internal files
    html_files = [f for f in html_files if not f.startswith('_') and 'test' not in f and f != '404.html']

    for file_path in sorted(html_files):
        # Format URL
        url_path = file_path if file_path != 'index.html' else ''
        full_url = f"{DOMAIN}/{url_path}"
        
        # Get mod time
        full_path = os.path.join(root_dir, file_path)
        try:
            mod_time = datetime.fromtimestamp(os.path.getmtime(full_path)).strftime('%Y-%m-%d')
        except:
            mod_time = datetime.now().strftime('%Y-%m-%d')

        # Get priority/freq
        filename = os.path.basename(file_path)
        priority, freq = PRIORITY_MAP.get(filename, (DEFAULT_PRIORITY, DEFAULT_FREQ))

        xml_lines.append('  <url>')
        xml_lines.append(f'    <loc>{full_url}</loc>')
        xml_lines.append(f'    <lastmod>{mod_time}</lastmod>')
        xml_lines.append(f'    <changefreq>{freq}</changefreq>')
        xml_lines.append(f'    <priority>{priority}</priority>')
        xml_lines.append('  </url>')

    xml_lines.append('</urlset>')

    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_lines))
        
    print(f"Sitemap generated at {sitemap_path} with {len(html_files)} URLs.")

if __name__ == "__main__":
    generate_sitemap()
