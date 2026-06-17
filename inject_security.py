import os
import glob

html_files = glob.glob('*.html') + glob.glob('blog/*.html') + glob.glob('tools/*.html')

security_script = """
    <!-- Security & Anti-Hacking Script -->
    <script>
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.onkeydown = function(e) {
            if(e.keyCode == 123) { return false; }
            if(e.ctrlKey && e.shiftKey && e.keyCode == 73) { return false; }
            if(e.ctrlKey && e.shiftKey && e.keyCode == 74) { return false; }
            if(e.ctrlKey && e.shiftKey && e.keyCode == 67) { return false; }
            if(e.ctrlKey && e.keyCode == 85) { return false; }
        };
        setInterval(function() {
            var before = new Date().getTime();
            debugger;
            var after = new Date().getTime();
            if (after - before > 100) {
                document.body.innerHTML = "<div style='display:flex;height:100vh;align-items:center;justify-content:center;background:#000;color:red;font-family:monospace;font-size:24px;'>Access Denied.</div>";
            }
        }, 1000);
    </script>
"""

for filepath in html_files:
    if not os.path.isfile(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'Security & Anti-Hacking Script' in content:
        continue # Already injected
        
    # Inject right before </head>
    if '</head>' in content:
        content = content.replace('</head>', security_script + '\n</head>')
    else:
        # If no </head>, try to inject before <style> or after last <meta>
        if '<style>' in content:
            content = content.replace('<style>', security_script + '\n<style>', 1)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print(f"Injected security script into {len(html_files)} files.")
