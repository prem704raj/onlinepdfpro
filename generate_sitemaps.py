import os
import glob

base_url = "https://onlinepdfpro.com"
urls = [
    f"{base_url}/",
    f"{base_url}/tools.html",
    f"{base_url}/about.html",
    f"{base_url}/help.html",
    f"{base_url}/privacy.html",
    f"{base_url}/terms.html",
    f"{base_url}/blog.html",
    f"{base_url}/compare-pdf.html",
    f"{base_url}/pdf-reader.html",
    f"{base_url}/qr-pdf.html"
]

tools_files = glob.glob("tools/*.html")
for f in tools_files:
    f_name = f.replace("\\\\", "/")
    urls.append(f"{base_url}/{f_name}")

with open("sitemap.txt", "w", encoding="utf-8") as f:
    for url in urls:
        f.write(f"{url}\n")

xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url in urls:
    priority = "1.0" if url == f"{base_url}/" else "0.8"
    freq = "weekly"
    xml_content += f'  <url><loc>{url}</loc><priority>{priority}</priority><changefreq>{freq}</changefreq></url>\n'
xml_content += '</urlset>\n'

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write(xml_content)

print(f"Generated {len(urls)} URLs.")
