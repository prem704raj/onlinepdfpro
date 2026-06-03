import os
import re

# The base directory for the site
BASE_DIR = r"c:\Users\prem7\.gemini\antigravity\scratch\doctools"

# Mapping of old names to new SEO friendly names
# We use regexes for safe replacements
REPLACEMENTS = [
    (r'>\s*Images to PDF\s*<', '>JPG to PDF Converter<'),
    (r'"name":\s*"Images to PDF"', '"name": "JPG to PDF Converter"'),
    (r'data-name="Images to PDF"', 'data-name="JPG to PDF Converter"'),
    (r'alt="Images to PDF"', 'alt="JPG to PDF Converter"'),

    (r'>\s*PDF Lock\s*<', '>Password Protect PDF<'),
    (r'"name":\s*"PDF Lock"', '"name": "Password Protect PDF"'),
    (r'data-name="PDF Lock"', 'data-name="Password Protect PDF"'),
    (r'alt="PDF Lock"', 'alt="Password Protect PDF"'),
    
    (r'>\s*Delete Pages\s*<', '>Delete PDF Pages<'),
    (r'"name":\s*"Delete Pages"', '"name": "Delete PDF Pages"'),
    (r'data-name="delete pages"', 'data-name="Delete PDF Pages"'), # note lower case in tools.html
    (r'alt="Delete Pages"', 'alt="Delete PDF Pages"'),

    (r'>\s*Voice to PDF\s*<', '>Speech to Text (Voice to PDF)<'),
    (r'"name":\s*"Voice to PDF"', '"name": "Speech to Text (Voice to PDF)"'),
    (r'data-name="voice to pdf"', 'data-name="Speech to Text (Voice to PDF)"'), # note lower case in tools.html
    (r'alt="Voice to PDF"', 'alt="Speech to Text (Voice to PDF)"'),

    (r'>\s*Image Compress\s*<', '>Image Compressor<'),
    (r'"name":\s*"Image Compress"', '"name": "Image Compressor"'),
    (r'data-name="Image Compress"', 'data-name="Image Compressor"'),
    (r'alt="Image Compress"', 'alt="Image Compressor"'),

    (r'>\s*Add Page Numbers\s*<', '>Add Page Numbers to PDF<'),
    (r'"name":\s*"Add Page Numbers"', '"name": "Add Page Numbers to PDF"'),
    (r'data-name="Add Page Numbers"', 'data-name="Add Page Numbers to PDF"'),
    (r'alt="Add Page Numbers"', 'alt="Add Page Numbers to PDF"'),
]

SPECIFIC_FILE_UPDATES = {
    "tools/images-to-pdf.html": [
        (r'<title>.*?</title>', '<title>JPG to PDF Converter - Convert Images to PDF Free</title>'),
        (r'<meta name="description" content=".*?">', '<meta name="description" content="Free online JPG to PDF converter. Convert your images (JPG, PNG) to PDF easily and securely.">'),
        (r'<h1>.*?</h1>', '<h1>JPG to PDF Converter</h1>'),
        (r'<p class="subtitle">.*?</p>', '<p class="subtitle">Convert your images into a single PDF document instantly</p>')
    ],
    "tools/pdf-lock.html": [
        (r'<title>.*?</title>', '<title>Password Protect PDF - Secure & Lock PDF Files</title>'),
        (r'<meta name="description" content=".*?">', '<meta name="description" content="Secure your PDF files with a password. Lock your PDF to prevent unauthorized access.">'),
        (r'<h1>.*?</h1>', '<h1>Password Protect PDF</h1>'),
        (r'<p class="subtitle">.*?</p>', '<p class="subtitle">Add a password to secure your PDF file</p>')
    ],
    "tools/delete-pages.html": [
        (r'<title>.*?</title>', '<title>Delete PDF Pages - Remove Pages from PDF Free</title>'),
        (r'<meta name="description" content=".*?">', '<meta name="description" content="Easily delete or remove pages from your PDF document online for free.">'),
        (r'<h1>.*?</h1>', '<h1>Delete PDF Pages</h1>'),
        (r'<p class="subtitle">.*?</p>', '<p class="subtitle">Select and remove unwanted pages from your PDF</p>')
    ],
    "voice-to-pdf.html": [
        (r'<title>.*?</title>', '<title>Speech to Text (Voice to PDF) - Free Online Converter</title>'),
        (r'<meta name="description" content=".*?">', '<meta name="description" content="Convert your speech and voice to text and download as PDF or TXT. Free online dictation tool.">'),
        (r'<h1>.*?</h1>', '<h1>Speech to Text (Voice to PDF)</h1>'),
        (r'<p class="subtitle">.*?</p>', '<p class="subtitle">Speak and convert your voice to text instantly</p>')
    ],
    "tools/image-compress.html": [
        (r'<title>.*?</title>', '<title>Image Compressor - Compress JPEG, PNG & WebP Online</title>'),
        (r'<meta name="description" content=".*?">', '<meta name="description" content="Compress your images (JPEG, PNG, WebP) without losing quality. Free online image compressor.">'),
        (r'<h1>.*?</h1>', '<h1>Image Compressor</h1>'),
        (r'<p class="subtitle">.*?</p>', '<p class="subtitle">Reduce image file size while maintaining quality</p>')
    ],
    "tools/add-page-numbers.html": [
        (r'<title>.*?</title>', '<title>Add Page Numbers to PDF - Free Online Tool</title>'),
        (r'<meta name="description" content=".*?">', '<meta name="description" content="Easily add page numbers to your PDF document online. Choose position, font, and style.">'),
        (r'<h1>.*?</h1>', '<h1>Add Page Numbers to PDF</h1>'),
        (r'<p class="subtitle">.*?</p>', '<p class="subtitle">Insert page numbers into your PDF document</p>')
    ]
}

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    new_content = content
    
    # 1. Apply global replacements
    for pattern, replacement in REPLACEMENTS:
        new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE)
        
    # 2. Apply specific file updates
    rel_path = os.path.relpath(filepath, BASE_DIR).replace('\\', '/')
    if rel_path in SPECIFIC_FILE_UPDATES:
        print(f"Applying specific SEO updates to: {rel_path}")
        for pattern, replacement in SPECIFIC_FILE_UPDATES[rel_path]:
            new_content = re.sub(pattern, replacement, new_content, flags=re.IGNORECASE | re.DOTALL)

    if new_content != content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
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
                process_file(filepath)

if __name__ == "__main__":
    main()
