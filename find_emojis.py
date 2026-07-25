import os
import re

def extract_emojis(folder_path):
    emoji_pattern = re.compile(
        r'['
        r'\U0001f600-\U0001f64f'  # emoticons
        r'\U0001f300-\U0001f5ff'  # symbols & pictographs
        r'\U0001f680-\U0001f6ff'  # transport & map symbols
        r'\U0001f1e0-\U0001f1ff'  # flags (iOS)
        r'\U00002702-\U000027b0'
        r'\U000024c2-\U0001f251'
        r'\u2600-\u26ff'          # miscellaneous symbols
        r'\u2700-\u27bf'          # dingbats
        r']+',
        re.UNICODE
    )

    found_emojis = set()
    files_with_emojis = {}
    
    for root, dirs, files in os.walk(folder_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = emoji_pattern.findall(content)
                        if matches:
                            files_with_emojis[file_path] = set()
                        for match in matches:
                            for char in match:
                                found_emojis.add(char)
                                files_with_emojis[file_path].add(char)
                except Exception as e:
                    pass

    with open('emojis_found.txt', 'w', encoding='utf-8') as f:
        f.write("Found Emojis:\n")
        for emoji in found_emojis:
            f.write(f"Emoji: {emoji} ({emoji.encode('unicode_escape')})\n")
        
        f.write("\nFiles:\n")
        for file_path, emojis in files_with_emojis.items():
            f.write(f"{file_path}: {', '.join(emojis)}\n")

if __name__ == "__main__":
    extract_emojis('.')
