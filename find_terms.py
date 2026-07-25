import os
import re

def find_terms(folder_path):
    terms = [
        'browser-based', 'in your browser', 'browser based',
        'no upload', 'no file upload', 'not uploaded', 'nothing is uploaded',
        'zero data collected', 'stays on your device', 'processed locally',
        'server-side storage'
    ]
    
    files_with_terms = {}
    
    for root, dirs, files in os.walk(folder_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lower_content = content.lower()
                        found = []
                        for term in terms:
                            if term in lower_content:
                                found.append(term)
                        if found:
                            files_with_terms[file_path] = found
                except Exception as e:
                    pass

    with open('terms_found.txt', 'w', encoding='utf-8') as f:
        for file_path, found_terms in files_with_terms.items():
            f.write(f"{file_path}: {', '.join(found_terms)}\n")

if __name__ == "__main__":
    find_terms('.')
