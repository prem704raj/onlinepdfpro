import os
import re

BASE_DIR = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

LINK_RENAMES = {
    "tools/images-to-pdf.html": "tools/jpg-to-pdf.html",
    "tools/pdf-lock.html": "tools/password-protect-pdf.html",
    "tools/delete-pages.html": "tools/delete-pdf-pages.html",
    "voice-to-pdf.html": "speech-to-text.html",
    "tools/image-compress.html": "tools/image-compressor.html",
    "tools/add-page-numbers.html": "tools/add-page-numbers-to-pdf.html",
    "pdf-page-extractor.html": "pdf-to-jpg.html",
    "tools/ocr.html": "tools/image-to-text.html",
    # Add root versions of ones in tools just in case
    "images-to-pdf.html": "jpg-to-pdf.html",
    "pdf-lock.html": "password-protect-pdf.html",
    "delete-pages.html": "delete-pdf-pages.html",
    "image-compress.html": "image-compressor.html",
    "add-page-numbers.html": "add-page-numbers-to-pdf.html",
    "ocr.html": "image-to-text.html",
    "qr-generator.html": "qr-code-generator.html",
    "privacy-shield.html": "redact-pdf.html",
    "text-to-audio.html": "text-to-speech.html"
}

def update_links_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    new_content = content
    
    for old_path, new_path in LINK_RENAMES.items():
        old_name = os.path.basename(old_path)
        new_name = os.path.basename(new_path)
        
        # Replace href="old_name" -> href="new_name"
        new_content = re.sub(r'(href=["\'](?:[^"\']*?/)?)(%s)(["\'])' % re.escape(old_name), r'\1%s\3' % new_name, new_content, flags=re.IGNORECASE)
        # Replace src="old_name" -> src="new_name"
        new_content = re.sub(r'(src=["\'](?:[^"\']*?/)?)(%s)(["\'])' % re.escape(old_name), r'\1%s\3' % new_name, new_content, flags=re.IGNORECASE)
        
        # Also replace direct URLs
        # e.g., https://onlinepdfpro.com/pdf-page-extractor.html -> https://onlinepdfpro.com/pdf-to-jpg.html
        url_old = f"https://onlinepdfpro.com/{old_path}"
        url_new = f"https://onlinepdfpro.com/{new_path}"
        new_content = new_content.replace(url_old, url_new)
        
        # Also handle without 'tools/' prefix just in case
        url_old2 = f"https://onlinepdfpro.com/{old_name}"
        url_new2 = f"https://onlinepdfpro.com/{new_name}"
        if url_old2 != url_new:
            new_content = new_content.replace(url_old2, url_new2)

    if new_content != content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated links in: {filepath}")
        except Exception as e:
            print(f"Error writing {filepath}: {e}")

def main():
    directories_to_scan = [
        BASE_DIR,
        os.path.join(BASE_DIR, "tools"),
        os.path.join(BASE_DIR, "blog")
    ]
    
    for directory in directories_to_scan:
        if not os.path.exists(directory):
            continue
        for filename in os.listdir(directory):
            if filename.endswith('.html') or filename.endswith('.xml'):
                filepath = os.path.join(directory, filename)
                update_links_in_file(filepath)
                
if __name__ == "__main__":
    main()
