import os
import re
import shutil

BASE_DIR = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

# Map of old file path to new file path (relative to BASE_DIR)
# We also update all references to these paths in HTML files
FILE_RENAMES = {
    "tools/images-to-pdf.html": "tools/jpg-to-pdf.html",
    "tools/pdf-lock.html": "tools/password-protect-pdf.html",
    "tools/delete-pages.html": "tools/delete-pdf-pages.html",
    "voice-to-pdf.html": "speech-to-text.html",
    "tools/image-compress.html": "tools/image-compressor.html",
    "tools/add-page-numbers.html": "tools/add-page-numbers-to-pdf.html"
}

def update_links_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    new_content = content
    
    for old_path, new_path in FILE_RENAMES.items():
        # Handle links that are exact matches, e.g. href="tools/images-to-pdf.html"
        # and also handle relative paths if they are in root or blog
        
        # We'll just replace the base names if they are unique enough
        old_name = os.path.basename(old_path)
        new_name = os.path.basename(new_path)
        
        # Replace href="old_name" -> href="new_name"
        # Also replace href="tools/old_name" -> href="tools/new_name"
        # Replace href="../tools/old_name" -> href="../tools/new_name"
        # We can just do a simple string replace for the old_name -> new_name in the context of hrefs or quotes
        
        # A safer regex to find the old filename ending with .html
        pattern = re.compile(r'([\w./-]+)' + re.escape(old_name), re.IGNORECASE)
        
        def replace_link(match):
            prefix = match.group(1)
            # if prefix looks like an href or path prefix
            return prefix + new_name

        new_content = re.sub(r'(href=["\'](?:[^"\']*?/)?)(%s)(["\'])' % re.escape(old_name), r'\1%s\3' % new_name, new_content, flags=re.IGNORECASE)
        new_content = re.sub(r'(src=["\'](?:[^"\']*?/)?)(%s)(["\'])' % re.escape(old_name), r'\1%s\3' % new_name, new_content, flags=re.IGNORECASE)

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
    
    # 1. Update links in all HTML files
    for directory in directories_to_scan:
        if not os.path.exists(directory):
            continue
        for filename in os.listdir(directory):
            if filename.endswith('.html'):
                filepath = os.path.join(directory, filename)
                update_links_in_file(filepath)
                
    # 2. Rename the actual files
    for old_rel_path, new_rel_path in FILE_RENAMES.items():
        old_abs_path = os.path.join(BASE_DIR, old_rel_path)
        new_abs_path = os.path.join(BASE_DIR, new_rel_path)
        
        if os.path.exists(old_abs_path):
            try:
                shutil.move(old_abs_path, new_abs_path)
                print(f"Renamed {old_abs_path} to {new_abs_path}")
            except Exception as e:
                print(f"Failed to rename {old_abs_path}: {e}")
        else:
            print(f"File not found for renaming: {old_abs_path}")

if __name__ == "__main__":
    main()
