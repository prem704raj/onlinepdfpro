import glob, re

files = glob.glob('tools/*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace the standard upload-hint text:
    # <p class="upload-hint">Everything stays 100% private on your device</p>
    # with a more robust performance indicator.
    
    # This regex is a bit generic to catch variations.
    new_content = re.sub(
        r'<p class="upload-hint">.*?</p>',
        r'<p class="upload-hint" style="display: flex; gap: 12px; justify-content: center; align-items: center;"><span style="display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 100% Local</span> <span>•</span> <span>Max: 100MB</span> <span>•</span> <span style="display: flex; align-items: center; gap: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Instant</span></p>',
        content
    )
    
    # Add usage examples/capabilities tooltips to specific major tools
    if 'compress-pdf.html' in f:
        # insert below the upload zone
        example_html = '''
        <div style="margin-top: 24px; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
            <strong>How it works:</strong> Advanced local compression reduces PDF size by up to 90% without losing visual quality. Perfect for email attachments (under 25MB) or web publishing.
        </div>'''
        # insert after <div class="upload-zone...</div>
        if example_html not in new_content:
            new_content = re.sub(r'(<div class="upload-zone.*?>.*?</div>)', r'\1\n' + example_html, new_content, flags=re.DOTALL)
            
    if 'ocr.html' in f:
        pass # similar...
        
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        updated += 1
        print(f"Updated {f}")

print(f'\nDone. Updated {updated} tool files with performance indicators.')
