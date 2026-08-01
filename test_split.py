import time
from playwright.sync_api import sync_playwright

def test_split():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))
        page.on("dialog", lambda dialog: print(f"DIALOG: {dialog.message}"))
        
        # Open local split-pdf.html
        url = "file:///c:/Users/prem7/.gemini/antigravity/scratch/doctools/src/tools/split-pdf.html"
        page.goto(url)
        
        # Create a dummy PDF file.
        with open("dummy1.pdf", "wb") as f:
            f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000109 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n188\n%%EOF\n")

        print("Uploading file...")
        file_input = page.locator("input[type='file']").first
        file_input.set_input_files(["dummy1.pdf"])
        
        # In split-pdf, the file goes to progress section immediately or previews?
        # Let's wait a bit and see if any error is printed.
        time.sleep(3)
        
        print("Clicking extract button...")
        try:
            page.locator("#extractBtn").click(timeout=3000)
        except Exception as e:
            print(f"Failed to click extract button: {e}")
        
        time.sleep(2)
        print("Test finished.")
        browser.close()

if __name__ == "__main__":
    test_split()
