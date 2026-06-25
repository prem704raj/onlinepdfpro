import os
import re

base_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'
tools_dir = os.path.join(base_dir, 'tools')

escape_fn = """
        function escapeHTML(str) {
            return String(str).replace(/[&<>'"]/g, tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
        }
"""

dirs = [tools_dir, base_dir]
for d in dirs:
    for f in os.listdir(d):
        if not f.endswith('.html'):
            continue
        filepath = os.path.join(d, f)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check if there is an innerHTML vulnerability with file.name
        if 'innerHTML' in content and ('${file.name}' in content or '${f.name}' in content or '${file.name}' in content):
            
            # Inject the escape function into the first <script> block if it doesn't exist
            if 'function escapeHTML' not in content:
                # Find the main script block. Usually after </header> or <main> or just <script>
                # Let's insert it right after the first <script> tag that does NOT have a src attribute
                script_start = re.search(r'<script[^>]*>', content)
                if script_start:
                    idx = script_start.end()
                    content = content[:idx] + "\n" + escape_fn + content[idx:]
                else:
                    # if there isn't one, find <script> at the end
                    script_end = content.find('</script>')
                    if script_end != -1:
                        content = content[:script_end] + "\n" + escape_fn + "\n</script>" + content[script_end + 9:]
            
            # Replace occurrences
            if '${escapeHTML(file.name)}' not in content:
                content = content.replace('${file.name}', '${escapeHTML(file.name)}')
            if '${escapeHTML(f.name)}' not in content:
                content = content.replace('${f.name}', '${escapeHTML(f.name)}')
            
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Fixed XSS in {f}")

print("Done fixing XSS.")
