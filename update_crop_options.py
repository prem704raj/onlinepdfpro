import os
import re

with open('tools/crop-pdf.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add CSS for dark overlay and solid border
css_target = r'\.selection-box\s*\{[\s\S]*?\}'
new_css = '''
.selection-box {
    position: absolute;
    border: 1.5px solid #00a5ff;
    background: transparent;
    cursor: move;
    z-index: 10;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}
.selection-box .handle {
    width: 14px;
    height: 14px;
    background: #00a5ff;
    border: 2px solid #fff;
    border-radius: 50%;
    position: absolute;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.selection-box .handle.nw { top: -7px; left: -7px; cursor: nw-resize; }
.selection-box .handle.ne { top: -7px; right: -7px; cursor: ne-resize; }
.selection-box .handle.sw { bottom: -7px; left: -7px; cursor: sw-resize; }
.selection-box .handle.se { bottom: -7px; right: -7px; cursor: se-resize; }
.selection-box .handle.n { top: -7px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.selection-box .handle.s { bottom: -7px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.selection-box .handle.w { left: -7px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
.selection-box .handle.e { right: -7px; top: 50%; transform: translateY(-50%); cursor: e-resize; }

.crop-area-wrapper {
    position: relative;
    display: inline-block;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    background: var(--surface-1);
    overflow: hidden; /* Constrain the massive box-shadow */
}
'''
html = re.sub(r'\.selection-box\s*\{[\s\S]*?\}', '', html) # remove old
html = re.sub(r'\.selection-box \.handle\s*\{[\s\S]*?\}', '', html) # remove old handles base
html = re.sub(r'\.selection-box \.handle\.[a-z]+\s*\{[\s\S]*?\}', '', html) # remove old handles specifics
html = re.sub(r'\.crop-area-wrapper\s*\{[\s\S]*?\}', '', html) # remove old

# insert new css before </style>
html = html.replace('</style>', new_css + '</style>')

# 2. Add 'Manual Options' input fields right below the checkbox row
manual_html = '''
                    <div class="checkbox-row" style="margin-bottom:20px;">
                        <label style="font-weight: 600; cursor: pointer;">
                            <input type="checkbox" id="applyAll" checked>
                            Apply this crop to all pages
                        </label>
                    </div>

                    <div style="background: var(--surface-2); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
                        <p style="font-weight:600; font-size: 0.95rem; margin-bottom: 12px; text-align:center;">Crop Margins (Manual Input)</p>
                        <div class="manual-crop-inputs" style="display:flex; justify-content:center; gap: 15px; flex-wrap: wrap;">
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                <label style="font-size: 0.85rem; color:var(--text-secondary); margin-bottom:5px;">Top</label>
                                <input type="number" id="mTop" value="0" style="width:70px; padding:6px; border:1px solid var(--border); border-radius:4px; text-align:center; background: var(--surface-1); color: var(--text-primary);" onchange="updateFromManual()">
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                <label style="font-size: 0.85rem; color:var(--text-secondary); margin-bottom:5px;">Bottom</label>
                                <input type="number" id="mBottom" value="0" style="width:70px; padding:6px; border:1px solid var(--border); border-radius:4px; text-align:center; background: var(--surface-1); color: var(--text-primary);" onchange="updateFromManual()">
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                <label style="font-size: 0.85rem; color:var(--text-secondary); margin-bottom:5px;">Left</label>
                                <input type="number" id="mLeft" value="0" style="width:70px; padding:6px; border:1px solid var(--border); border-radius:4px; text-align:center; background: var(--surface-1); color: var(--text-primary);" onchange="updateFromManual()">
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:center;">
                                <label style="font-size: 0.85rem; color:var(--text-secondary); margin-bottom:5px;">Right</label>
                                <input type="number" id="mRight" value="0" style="width:70px; padding:6px; border:1px solid var(--border); border-radius:4px; text-align:center; background: var(--surface-1); color: var(--text-primary);" onchange="updateFromManual()">
                            </div>
                        </div>
                    </div>
'''
# Find the checkbox-row and replace it with manual_html
html = re.sub(r'<div class="checkbox-row">[\s\S]*?</div>', manual_html, html, count=1)

# 3. Add JS binding for manual updates
js_func = '''
        function updateFromManual() {
            if(!currentCanvasRect) return;
            const t = parseFloat(document.getElementById('mTop').value) || 0;
            const b = parseFloat(document.getElementById('mBottom').value) || 0;
            const l = parseFloat(document.getElementById('mLeft').value) || 0;
            const r = parseFloat(document.getElementById('mRight').value) || 0;
            
            cropBox.top = t;
            cropBox.left = l;
            cropBox.width = currentCanvasRect.width - l - r;
            cropBox.height = currentCanvasRect.height - t - b;
            
            // Prevent going out of bounds or negative width/height
            if(cropBox.width < 10) cropBox.width = 10;
            if(cropBox.height < 10) cropBox.height = 10;
            if(cropBox.top < 0) cropBox.top = 0;
            if(cropBox.left < 0) cropBox.left = 0;
            
            updateBoxUI();
        }
        
        function updateBoxUI() {
            boxElem.style.top = cropBox.top + 'px';
            boxElem.style.left = cropBox.left + 'px';
            boxElem.style.width = cropBox.width + 'px';
            boxElem.style.height = cropBox.height + 'px';
            
            if (currentCanvasRect) {
                document.getElementById('mTop').value = Math.round(cropBox.top);
                document.getElementById('mLeft').value = Math.round(cropBox.left);
                document.getElementById('mRight').value = Math.round(currentCanvasRect.width - cropBox.left - cropBox.width);
                document.getElementById('mBottom').value = Math.round(currentCanvasRect.height - cropBox.top - cropBox.height);
            }
            updateCurrentPageRatio();
        }
'''

# Find original updateBoxUI and replace it, and add updateFromManual
html = re.sub(r'function updateBoxUI\(\)\s*\{[\s\S]*?\}', js_func, html)

with open('tools/crop-pdf.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated crop UI with ILovePDF aesthetics and manual inputs!")
