import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

for filepath in html_files:
    if 'node_modules' in filepath: continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # We need to extract the three sections: 
    # 1. <section class="how-it-works" ... </section>
    # 2. <section class="related-tools" ... </section>
    # 3. <section class="faq-section" ... </section>
    # And place them all right before the closing </main> tag (or right before <footer>)
    
    how_it_works_match = re.search(r'(<!-- Added SEO Sections -->\s*)?<section class="how-it-works".*?</section>', html, re.IGNORECASE | re.DOTALL)
    related_tools_match = re.search(r'<section class="related-tools".*?</section>', html, re.IGNORECASE | re.DOTALL)
    faq_match = re.search(r'<section class="faq-section".*?</section>', html, re.IGNORECASE | re.DOTALL)
    
    modified = False
    
    if how_it_works_match or related_tools_match or faq_match:
        # Extract and remove them from their current locations
        how_it_works_html = how_it_works_match.group(0) if how_it_works_match else ""
        related_tools_html = related_tools_match.group(0) if related_tools_match else ""
        faq_html = faq_match.group(0) if faq_match else ""
        
        if how_it_works_match: html = html.replace(how_it_works_html, "")
        if related_tools_match: html = html.replace(related_tools_html, "")
        if faq_match: html = html.replace(faq_html, "")
        
        combined_sections = f"\n    {how_it_works_html}\n    {related_tools_html}\n    {faq_html}\n"
        
        # Now find the right place to insert.
        # It should go right before </main> if it exists, otherwise before <footer>
        main_end = html.rfind('</main>')
        
        if main_end != -1:
            html = html[:main_end] + combined_sections + html[main_end:]
            modified = True
        else:
            footer_start = html.rfind('<footer')
            if footer_start != -1:
                html = html[:footer_start] + combined_sections + html[footer_start:]
                modified = True
                
    if modified:
        # Clean up any triple blank lines that might have been left
        html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Fixed Layout Order: {filepath}")
