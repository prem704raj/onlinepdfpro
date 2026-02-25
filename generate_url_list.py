import re

def get_urls():
    with open('sitemap.xml', 'r', encoding='utf-8') as f:
        content = f.read()
    
    urls = re.findall(r'<loc>(.*?)</loc>', content)
    
    with open('sitemap.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(urls))
        
    print(f"Generated sitemap.txt with {len(urls)} URLs for Google Search Console:")
    for url in urls:
        print(url)

if __name__ == "__main__":
    get_urls()
