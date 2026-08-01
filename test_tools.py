import os
import sys
from playwright.sync_api import sync_playwright

def run():
    tools_dir = os.path.join('src', 'tools')
    if not os.path.exists(tools_dir):
        print(f"Directory {tools_dir} not found")
        sys.exit(1)
        
    files = [f for f in os.listdir(tools_dir) if f.endswith('.html') and f not in ('pdf-to-word.html', 'word-to-pdf.html')]
    print(f"Found {len(files)} tools to test.")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        for f in files:
            errors = []
            page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            
            try:
                page.goto(f"http://localhost:8080/tools/{f}", wait_until="networkidle", timeout=10000)
            except Exception as e:
                print(f"[{f}] Timeout or Navigation Error: {e}")
                
            if errors:
                for err in errors:
                    # Ignore harmless things
                    if "favicon" not in err.lower() and "analytics" not in err.lower() and "adsterra" not in err.lower() and "404" not in err:
                        print(f"[{f}] Error: {err}")
            
            page.close()
            page = browser.new_page()
            
        browser.close()
        print("Testing complete.")

if __name__ == '__main__':
    run()
