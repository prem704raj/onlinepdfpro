import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime

base_dir = "c:/Users/prem7/.gemini/antigravity/scratch/doctools"
base_url = "https://onlinepdfpro.com"

# Exclude these files
exclude_files = ["404.html", "test-pdf.html", "google6ec5c9097526273f.html"]

def generate_sitemaps():
    urls = []
    
    # Base dir
    for file in sorted(os.listdir(base_dir)):
        if file.endswith(".html") and file not in exclude_files:
            if file == "index.html":
                urls.append({
                    "loc": base_url + "/",
                    "lastmod": datetime.now().strftime("%Y-%m-%d"),
                    "changefreq": "daily",
                    "priority": "1.0"
                })
            else:
                priority = "0.8"
                if file in ["about.html", "contact.html"]: priority = "0.6"
                if file in ["privacy.html", "terms.html", "disclaimer.html", "dmca.html"]: priority = "0.5"
                if file == "history.html": priority = "0.4"
                if file == "tools.html": priority = "0.9"
                if file == "blog.html": priority = "0.8"
                
                urls.append({
                    "loc": base_url + "/" + file,
                    "lastmod": datetime.now().strftime("%Y-%m-%d"),
                    "changefreq": "weekly" if priority != "0.5" else "yearly",
                    "priority": priority
                })
                
    # Tools dir
    tools_dir = os.path.join(base_dir, "tools")
    for file in sorted(os.listdir(tools_dir)):
        if file.endswith(".html"):
            urls.append({
                "loc": base_url + "/tools/" + file,
                "lastmod": datetime.now().strftime("%Y-%m-%d"),
                "changefreq": "weekly",
                "priority": "0.8"
            })
            
    # Blog dir
    blog_dir = os.path.join(base_dir, "blog")
    for file in sorted(os.listdir(blog_dir)):
        if file.endswith(".html"):
            urls.append({
                "loc": base_url + "/blog/" + file,
                "lastmod": datetime.now().strftime("%Y-%m-%d"),
                "changefreq": "monthly",
                "priority": "0.7"
            })
            
    # Generate sitemap.xml
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for u in urls:
        url_el = ET.SubElement(urlset, "url")
        ET.SubElement(url_el, "loc").text = u["loc"]
        ET.SubElement(url_el, "lastmod").text = u["lastmod"]
        ET.SubElement(url_el, "changefreq").text = u["changefreq"]
        ET.SubElement(url_el, "priority").text = u["priority"]
        
    xmlstr = minidom.parseString(ET.tostring(urlset)).toprettyxml(indent="  ")
    # Remove XML declaration added by minidom to match typical format, or keep it.
    
    with open(os.path.join(base_dir, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xmlstr)
        
    # Generate sitemap.txt
    with open(os.path.join(base_dir, "sitemap.txt"), "w", encoding="utf-8") as f:
        for u in urls:
            f.write(u["loc"] + "\n")
            
generate_sitemaps()
print("Sitemaps generated.")
