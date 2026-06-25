import os

base_dir = r'c:\Users\prem7\.gemini\antigravity\scratch\doctools'
dirs_to_check = [base_dir, os.path.join(base_dir, 'tools'), os.path.join(base_dir, 'blog')]

csp_meta = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://pl29768747.effectivecpmnetwork.com https://5gvci.com https://n6wxm.com https://www.clarity.ms; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: https:; object-src \'none\'; frame-ancestors \'none\';">'

for d in dirs_to_check:
    for f in os.listdir(d):
        if f.endswith('.html'):
            filepath = os.path.join(d, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            if 'Content-Security-Policy' not in content:
                # find the first meta tag or <title> to insert before/after
                # usually just insert right after <head>
                if '<head>' in content:
                    content = content.replace('<head>', f'<head>\n    {csp_meta}')
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Injected CSP into {f}")
                else:
                    print(f"Skipping {f} (no <head> tag found)")
            else:
                print(f"CSP already exists in {f}")

print("Done injecting CSP.")
