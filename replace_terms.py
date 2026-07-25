import os
import re

replacements = [
    # index.html hero / tools.html hero
    (r'100% free, browser-based, no watermarks', '100% free, easy to use, no watermarks'),
    
    # index.html stats
    (r'100%</div><div class="hp-stat-label">Browser Based', '100%</div><div class="hp-stat-label">Secure</div>'),
    (r'Zero</div><div class="hp-stat-label">Data Collected', 'High</div><div class="hp-stat-label">Data Privacy</div>'),
    
    # index.html / philosophy
    (r'Every tool on OnlinePDFPro processes your files entirely in your browser\. Nothing is uploaded to any server\.',
     'Every tool on OnlinePDFPro processes your files quickly and securely.'),
    (r'100% browser-based processing', 'Fast and secure processing'),
    (r'No file uploads, complete privacy', 'Complete privacy and security'),
    (r'Works on any device, any browser', 'Works on any device, anywhere'),
    
    # pdf-reader.html tool-guide and similar guides in tools
    (r'The PDF Reader runs entirely securely, so the file stays on your device\. It supports modern\s+browsers', 
     'The PDF Reader runs securely. It supports modern browsers'),
    (r'Files are processed locally in the tab session\.', 'Files are processed quickly and securely.'),
    (r'No uploads or server-side storage\.', 'Your data is handled with maximum privacy.'),
    (r'Nothing is uploaded or stored\.', 'Your data is handled with maximum privacy.'),
    
    # generic replacements for tool cards and text
    (r'(?i)100% browser-based', '100% secure'),
    (r'(?i)browser-based', 'fast and secure'),
    (r'(?i)entirely in your browser', 'securely'),
    (r'(?i)processed locally', 'processed securely'),
    (r'(?i)no file upload[s]?', 'secure handling'),
    (r'(?i)no upload[s]?', 'secure handling'),
    (r'(?i)nothing is uploaded', 'your files are secure'),
    (r'(?i)stays on your device', 'remains secure'),
    (r'(?i)server-side storage', 'unauthorized access')
]

def apply_replacements(folder_path):
    for root, dirs, files in os.walk(folder_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for pattern, repl in replacements:
                        new_content = re.sub(pattern, repl, new_content)
                    
                    if new_content != content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    apply_replacements('.')
