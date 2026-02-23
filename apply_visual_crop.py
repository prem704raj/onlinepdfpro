import sys
import re

with open('tools/crop-pdf.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace CSS
css_target = r"\.crop-inputs \{[\s\S]*?\.page-nav span \{[^}]*\}"
css_replacement = """
        .crop-area-wrapper {
            position: relative;
            display: inline-block;
            user-select: none;
            line-height: 0;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            background: #e2e8f0;
            overflow: hidden;
            margin-top: 20px;
            border-radius: 8px;
        }
        .preview-canvas {
            display: block;
            margin: 0;
            box-shadow: none;
            max-width: 100%;
            height: auto;
        }
        .selection-box {
            position: absolute;
            border: 2px dashed #2563eb;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.6);
            cursor: move;
            box-sizing: border-box;
            z-index: 10;
        }
        .handle {
            position: absolute;
            width: 16px;
            height: 16px;
            background: #2563eb;
            border-radius: 50%;
            z-index: 11;
            border: 2px solid white;
        }
        .handle.nw { top: -8px; left: -8px; cursor: nwse-resize; }
        .handle.n { top: -8px; left: calc(50% - 8px); cursor: ns-resize; }
        .handle.ne { top: -8px; right: -8px; cursor: nesw-resize; }
        .handle.w { top: calc(50% - 8px); left: -8px; cursor: ew-resize; }
        .handle.e { top: calc(50% - 8px); right: -8px; cursor: ew-resize; }
        .handle.sw { bottom: -8px; left: -8px; cursor: nesw-resize; }
        .handle.s { bottom: -8px; left: calc(50% - 8px); cursor: ns-resize; }
        .handle.se { bottom: -8px; right: -8px; cursor: nwse-resize; }

        .pdf-toolbar {
            display: inline-flex;
            align-items: center;
            background: #334155;
            padding: 10px 20px;
            border-radius: 12px;
            gap: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .toolbar-btn {
            background: transparent;
            color: #fff;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: 0.2s;
            font-size: 16px;
        }
        .toolbar-btn:hover { background: #475569; }
        .page-indicator input {
            width: 50px;
            text-align: center;
            background: #475569;
            border: 1px solid #64748b;
            color: #fff;
            padding: 8px;
            border-radius: 6px;
            outline: none;
            font-weight: 600;
        }
"""
html = re.sub(css_target, css_replacement.strip(), html)

# 2. Replace HTML UI
html_target = r'<div class="crop-container" id="cropContainer">[\s\S]*?<div class="apply-section">'
html_replacement = """<div class="crop-container" id="cropContainer" style="max-width: 900px; padding: 20px;">
                    <div class="crop-area-wrapper" id="cropAreaWrapper">
                        <canvas class="preview-canvas" id="previewCanvas"></canvas>
                        <div class="selection-box" id="selectionBox" style="display: none;">
                            <div class="handle nw" data-dir="nw"></div>
                            <div class="handle n" data-dir="n"></div>
                            <div class="handle ne" data-dir="ne"></div>
                            <div class="handle w" data-dir="w"></div>
                            <div class="handle e" data-dir="e"></div>
                            <div class="handle sw" data-dir="sw"></div>
                            <div class="handle s" data-dir="s"></div>
                            <div class="handle se" data-dir="se"></div>
                        </div>
                    </div>

                    <div class="pdf-toolbar">
                        <button onclick="changePage(-1)" class="toolbar-btn" title="Previous Page">▲</button>
                        <button onclick="changePage(1)" class="toolbar-btn" title="Next Page">▼</button>
                        <div class="page-indicator">
                            <input type="number" id="pageInput" value="1" min="1" onchange="goToPage(this.value)"> 
                            <span style="color:#fff; font-weight: bold; margin:0 5px;">/ <span id="totalPagesSpan">1</span></span>
                        </div>
                    </div>

                    <div class="checkbox-row">
                        <label style="font-weight: 600; cursor: pointer;">
                            <input type="checkbox" id="applyAll" checked>
                            Apply this crop to all pages
                        </label>
                    </div>

                    <div class="apply-section">"""
html = re.sub(html_target, html_replacement, html)

# 3. Replace JS logic
js_target_start = html.find('async function loadPDF(file) {')
js_target_end = html.find('</script>', js_target_start)

# Extract old JS logic to replace
js_replacement = """
        let isDragging = false, isResizing = false, resizeDir = '', startX, startY;
        let startCropBox = {};
        let cropBox = { top: 0, left: 0, width: 0, height: 0 };
        const boxElem = document.getElementById('selectionBox');
        const wrapperElem = document.getElementById('cropAreaWrapper');

        async function loadPDF(file) {
            if (!file) return;

            pdfBytes = await file.arrayBuffer();
            pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
            totalPages = pdfJsDoc.numPages;
            currentPage = 1;
            cropBox = { top: 0, left: 0, width: 0, height: 0 };

            document.getElementById('fileInfo').style.display = 'block';
            document.getElementById('fileInfo').textContent = '📄 ' + file.name + ' — ' + totalPages + ' pages';
            document.getElementById('cropContainer').style.display = 'block';

            await renderPage();
            setTimeout(initCropBox, 100);
        }

        async function renderPage() {
            const page = await pdfJsDoc.getPage(currentPage);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.getElementById('previewCanvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;

            document.getElementById('pageInput').value = currentPage;
            document.getElementById('totalPagesSpan').innerText = totalPages;
        }

        function goToPage(pageNum) {
            pageNum = parseInt(pageNum);
            if (pageNum >= 1 && pageNum <= totalPages) {
                currentPage = pageNum;
                renderPage();
            } else {
                document.getElementById('pageInput').value = currentPage;
            }
        }

        async function changePage(delta) {
            const newPage = currentPage + delta;
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                await renderPage();
            }
        }

        function initCropBox() {
            const canvas = document.getElementById('previewCanvas');
            const rect = canvas.getBoundingClientRect();
            cropBox = { 
                top: rect.height * 0.1, 
                left: rect.width * 0.1, 
                width: rect.width * 0.8, 
                height: rect.height * 0.8 
            };
            boxElem.style.display = 'block';
            updateBoxUI();
        }

        function updateBoxUI() {
            boxElem.style.top = cropBox.top + 'px';
            boxElem.style.left = cropBox.left + 'px';
            boxElem.style.width = cropBox.width + 'px';
            boxElem.style.height = cropBox.height + 'px';
        }

        boxElem.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if(e.target.classList.contains('handle')) {
                isResizing = true;
                resizeDir = e.target.dataset.dir;
            } else {
                isDragging = true;
            }
            startX = e.clientX;
            startY = e.clientY;
            startCropBox = { ...cropBox };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        boxElem.addEventListener('touchstart', (e) => {
            if(e.target.classList.contains('handle')) {
                isResizing = true;
                resizeDir = e.target.dataset.dir;
            } else {
                isDragging = true;
            }
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startCropBox = { ...cropBox };
            window.addEventListener('touchmove', onTouchMove, {passive: false});
            window.addEventListener('touchend', onMouseUp);
        });

        function onTouchMove(e) {
            e.preventDefault();
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }

        function onMouseMove(e) {
            handleMove(e.clientX, e.clientY);
        }

        function handleMove(clientX, clientY) {
            const dx = clientX - startX;
            const dy = clientY - startY;
            const canvas = document.getElementById('previewCanvas');
            const rect = canvas.getBoundingClientRect();
            const maxW = rect.width;
            const maxH = rect.height;

            if (isDragging) {
                let newL = startCropBox.left + dx;
                let newT = startCropBox.top + dy;
                if(newL < 0) newL = 0;
                if(newT < 0) newT = 0;
                if(newL + cropBox.width > maxW) newL = maxW - cropBox.width;
                if(newT + cropBox.height > maxH) newT = maxH - cropBox.height;
                cropBox.left = newL;
                cropBox.top = newT;
            } else if (isResizing) {
                let newL = startCropBox.left;
                let newT = startCropBox.top;
                let newW = startCropBox.width;
                let newH = startCropBox.height;

                if (resizeDir.includes('w')) {
                    newL = startCropBox.left + dx;
                    newW = startCropBox.width - dx;
                    if(newL < 0) { newW += newL; newL = 0; }
                }
                if (resizeDir.includes('e')) {
                    newW = startCropBox.width + dx;
                    if(newL + newW > maxW) newW = maxW - newL;
                }
                if (resizeDir.includes('n')) {
                    newT = startCropBox.top + dy;
                    newH = startCropBox.height - dy;
                    if(newT < 0) { newH += newT; newT = 0; }
                }
                if (resizeDir.includes('s')) {
                    newH = startCropBox.height + dy;
                    if(newT + newH > maxH) newH = maxH - newT;
                }

                if(newW > 20 && newH > 20) {
                    cropBox.left = newL;
                    cropBox.top = newT;
                    cropBox.width = newW;
                    cropBox.height = newH;
                }
            }
            updateBoxUI();
        }

        function onMouseUp() {
            isDragging = false;
            isResizing = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onMouseUp);
        }

        async function cropAndDownload() {
            if (!pdfBytes) return;

            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();

            const applyAll = document.getElementById('applyAll').checked;
            const pagesToCrop = applyAll ? pages : [pages[currentPage - 1]];

            const canvas = document.getElementById('previewCanvas');
            const rect = canvas.getBoundingClientRect();

            const ratioLeft = cropBox.left / rect.width;
            const ratioTop = cropBox.top / rect.height;
            const ratioWidth = cropBox.width / rect.width;
            const ratioHeight = cropBox.height / rect.height;

            pagesToCrop.forEach(page => {
                const { width, height } = page.getSize();
                
                const newLeft = width * ratioLeft;
                const newWidth = width * ratioWidth;
                const newHeight = height * ratioHeight;
                const newTopMargin = height * ratioTop;
                const newBottom = height - newTopMargin - newHeight;

                page.setCropBox(newLeft, newBottom, newWidth, newHeight);
                page.setMediaBox(newLeft, newBottom, newWidth, newHeight);
            });

            const croppedBytes = await pdfDoc.save();
            download(croppedBytes, 'Cropped-PDF-OnlinePDFPro.pdf', 'application/pdf');
        }
"""
html = html[:js_target_start] + js_replacement + "\\n    " + html[js_target_end:]

with open('tools/crop-pdf.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Crop replacement successful!")
