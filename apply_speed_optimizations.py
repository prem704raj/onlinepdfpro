import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

preconnect_block = """
    <!-- Preconnect to CDNs for Speed -->
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://unpkg.com">
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
"""

sw_block = """
<script>
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Reg Failed', err));
    });
}
</script>
"""

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
        
    modified = False

    # 1. Inject Preconnects
    if 'https://cdn.jsdelivr.net' not in html:
        # Find </title> or <head>
        match = re.search(r'</title>', html, re.IGNORECASE)
        if match:
            idx = match.end()
            html = html[:idx] + preconnect_block + html[idx:]
            modified = True
        else:
            match = re.search(r'<head>', html, re.IGNORECASE)
            if match:
                idx = match.end()
                html = html[:idx] + preconnect_block + html[idx:]
                modified = True

    # 2. Add lazy loading to images
    # Look for <img> tags without loading="lazy"
    # Using a simple replacement iteratively
    img_matches = list(re.finditer(r'<img\s+([^>]+)>', html, re.IGNORECASE))
    
    for m in reversed(img_matches):
        img_tag = m.group(0)
        inner = m.group(1)
        if 'loading="lazy"' not in inner and 'loading=\'lazy\'' not in inner:
            new_tag = f'<img loading="lazy" {inner}>'
            html = html[:m.start()] + new_tag + html[m.end():]
            modified = True

    # 3. Add defer to non-critical local JS
    # Local JS usually doesn't have http in src
    script_matches = list(re.finditer(r'<script\s+([^>]+)></script>', html, re.IGNORECASE))
    for m in reversed(script_matches):
        script_tag = m.group(0)
        inner = m.group(1)
        # Add defer if it has a src, does not have async, does not have defer, and does not seem like adsense/gtag
        if 'src=' in inner and 'defer' not in inner and 'async' not in inner:
            if 'googletagmanager' not in inner and 'googlesyndication' not in inner and 'gstatic' not in inner:
                new_tag = f'<script defer {inner}></script>'
                html = html[:m.start()] + new_tag + html[m.end():]
                modified = True

    # 4. Service Worker Registration
    if 'serviceWorker' not in html:
        body_close = html.rfind('</body>')
        if body_close != -1:
            html = html[:body_close] + sw_block + html[body_close:]
            modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Optimized Speed on: {filepath}")
