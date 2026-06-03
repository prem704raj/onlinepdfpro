import os

BASE_DIR = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

RENAMES = [
    ("tools/images-to-pdf.html", "tools/jpg-to-pdf.html"),
    ("tools/pdf-lock.html", "tools/password-protect-pdf.html"),
    ("tools/delete-pages.html", "tools/delete-pdf-pages.html"),
    ("voice-to-pdf.html", "speech-to-text.html"),
    ("tools/image-compress.html", "tools/image-compressor.html"),
    ("tools/add-page-numbers.html", "tools/add-page-numbers-to-pdf.html"),
    
    # Also include the ones from round 3 just in case there are absolute URLs
    ("pdf-page-extractor.html", "pdf-to-jpg.html"),
    ("tools/ocr.html", "tools/image-to-text.html"),
    ("text-to-audio.html", "text-to-speech.html"),
    ("tools/privacy-shield.html", "tools/redact-pdf.html"),
    ("tools/qr-generator.html", "tools/qr-code-generator.html")
]

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    new_content = content
    
    for old_rel, new_rel in RENAMES:
        old_name = old_rel.split('/')[-1]
        new_name = new_rel.split('/')[-1]
        
        # 1. Absolute URLs (Schema, Meta tags, Canonical)
        new_content = new_content.replace(f"https://onlinepdfpro.com/{old_rel}", f"https://onlinepdfpro.com/{new_rel}")
        # Sometimes tools/ prefix might be omitted by mistake in schemas
        new_content = new_content.replace(f"https://onlinepdfpro.com/{old_name}", f"https://onlinepdfpro.com/{new_name}")
        
        # 2. Relative URLs (href, src, json "url" fields)
        # We replace the exact old relative path with the new relative path
        new_content = new_content.replace(f'"{old_rel}"', f'"{new_rel}"')
        new_content = new_content.replace(f"'old_rel'", f"'{new_rel}'")
        
        # 3. Just the file name in quotes (e.g. href="image-compress.html" from within tools folder)
        new_content = new_content.replace(f'"{old_name}"', f'"{new_name}"')
        new_content = new_content.replace(f"'{old_name}'", f"'{new_name}'")

    if new_content != content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated absolute/relative URLs in: {filepath}")
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
            if filename.endswith('.html'):
                filepath = os.path.join(directory, filename)
                replace_in_file(filepath)

if __name__ == "__main__":
    main()
