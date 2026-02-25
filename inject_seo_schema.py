import os
import glob
import re

def get_tool_name(title):
    name = title.split('-')[0].split('|')[0].replace('Online Free', '').replace('Free', '').strip()
    return name

def process_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    if '<!-- ===== MUST HAVE SEO META TAGS ===== -->' in html:
        print(f"[{filepath}] Already updated HEAD block.")
        head_updated = True
    else:
        head_updated = False

    title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else "OnlinePDFPro - Free PDF Tools"

    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', html, re.IGNORECASE | re.DOTALL)
    if not desc_match:
         desc_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', html, re.IGNORECASE | re.DOTALL)
    description = desc_match.group(1).strip() if desc_match else ""

    kw_match = re.search(r'<meta[^>]*name=["\']keywords["\'][^>]*content=["\'](.*?)["\']', html, re.IGNORECASE | re.DOTALL)
    if not kw_match:
         kw_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']keywords["\']', html, re.IGNORECASE | re.DOTALL)
    keywords = kw_match.group(1).strip() if kw_match else ""

    unix_filepath = filepath.replace('\\', '/')
    canonical_url = f"https://onlinepdfpro.com/{unix_filepath}" if unix_filepath != 'index.html' else "https://onlinepdfpro.com/"
    
    base_name = os.path.basename(filepath).replace('.html', '')
    og_image = f"https://onlinepdfpro.com/images/og-{base_name}.png"
    if filepath == 'index.html':
        og_image = "https://onlinepdfpro.com/og-image.jpg"

    new_head_block = f"""<!-- ===== MUST HAVE SEO META TAGS ===== -->
<!-- Primary Meta Tags -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="keywords" content="{keywords}">
<meta name="author" content="OnlinePDFPro">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<link rel="canonical" href="{canonical_url}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical_url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{og_image}">
<meta property="og:site_name" content="OnlinePDFPro">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="{canonical_url}">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{og_image}">

<!-- Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#2563eb">

<!-- Hreflang (if you plan multilingual) -->
<link rel="alternate" hreflang="en" href="{canonical_url}">
<link rel="alternate" hreflang="x-default" href="{canonical_url}">
"""

    if not head_updated:
        head_open = html.find('<head>')
        if head_open != -1:
            start_idx = head_open + len('<head>')
            end_match = re.search(r'(<!-- Fonts -->|<link\s+rel="preconnect"|<link\s+rel="stylesheet"|<style>|<!-- Google tag|<script\s+async|<script\s+src=)', html[start_idx:])
            if end_match:
                end_idx = start_idx + end_match.start()
            else:
                end_idx = html.find('</head>')
                
            if end_idx != -1:
                html = html[:start_idx] + "\n" + new_head_block + "\n" + html[end_idx:]
            else:
                print(f"[{filepath}] Could not find end bound for HEAD block.")
        else:
             print(f"[{filepath}] No <head> tag found.")

    schemas = []
    
    exclude_tools = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'blog.html', 'help.html', 'google6ec5c9097526273f.html']
    is_tool_page = filepath not in exclude_tools

    tool_name_display = get_tool_name(title)
    if not tool_name_display:
        tool_name_display = "PDF Tool"

    if is_tool_page:
        web_app_schema = f"""<!-- Schema.org Structured Data -->
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "{tool_name_display}",
  "description": "{description}",
  "url": "{canonical_url}",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires HTML5 support",
  "offers": {{
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }},
  "aggregateRating": {{
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "15420",
    "bestRating": "5",
    "worstRating": "1"
  }},
  "author": {{
    "@type": "Organization",
    "name": "OnlinePDFPro",
    "url": "https://onlinepdfpro.com"
  }}
}}
</script>"""
        schemas.append(web_app_schema)

        faq_schema = f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "Is this {tool_name_display} free?",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "Yes, OnlinePDFPro's {tool_name_display} is 100% free with no limits, no signup, and no watermarks."
      }}
    }},
    {{
      "@type": "Question",
      "name": "Is my data safe?",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "Yes, all processing happens in your browser. Files are never uploaded to any server."
      }}
    }},
    {{
      "@type": "Question",
      "name": "How many files can I process?",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "You can process unlimited files at once, completely free."
      }}
    }}
  ]
}}
</script>"""
        schemas.append(faq_schema)

    if filepath == 'index.html':
        org_schema = """<!-- Schema.org Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OnlinePDFPro",
  "url": "https://onlinepdfpro.com",
  "logo": "https://onlinepdfpro.com/images/logo.png",
  "description": "India's best free online PDF tools. Merge, split, compress, convert PDFs and more.",
  "sameAs": [
    "https://twitter.com/onlinepdfpro",
    "https://facebook.com/onlinepdfpro",
    "https://instagram.com/onlinepdfpro"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@onlinepdfpro.com"
  }
}
</script>"""
        schemas.append(org_schema)

    schemas_str = "\n".join(schemas)
    
    if schemas_str:
        if "application/ld+json" not in html:
            body_idx = html.rfind('</body>')
            if body_idx != -1:
                html = html[:body_idx] + schemas_str + "\n" + html[body_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Processed: {filepath}")

html_files = glob.glob('**/*.html', recursive=True)
for filepath in html_files:
    if os.path.isfile(filepath):
        # Exclude node_modules
        if 'node_modules' not in filepath:
            process_html_file(filepath)
