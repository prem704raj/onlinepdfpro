import re

with open('tools/crop-pdf.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove the HTML block for manual inputs
# We locate the block starting with `<div style=\"background: var(--surface-2);` up to the closing `</div>` that precedes the `<div class=\"apply-section\">`
# Looking at the previous injection:
# <div style="background: var(--surface-2); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
# ...
# </div>
target_html = r'<div style="background: var\(--surface-2\); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var\(--border\);">[\s\S]*?<div class="apply-section">'

text = re.sub(target_html, '<div class="apply-section">', text)

# 2. Add back margin-bottom to the checkbox row since we removed the manual block below it which originally gave it spacing
# The checkbox row is: `<div class="checkbox-row" style="margin-bottom:20px;">`
# We'll keep it as is. It provides 20px bottom margin.

# 3. Remove updateFromManual() function completely
target_js_func = r'function updateFromManual\(\)\s*\{[\s\S]*?\}\s*function updateBoxUI'
text = re.sub(target_js_func, 'function updateBoxUI', text)

# 4. Remove the manual input syncing block inside updateBoxUI
target_js_sync = r'if \(currentCanvasRect\) \{[\s\S]*?\}'
text = re.sub(target_js_sync, '', text)

with open('tools/crop-pdf.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Cleaned up manual inputs successfully.')
