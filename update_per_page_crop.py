import re
import os

with open('tools/crop-pdf.html', 'r', encoding='utf-8') as f:
    text = f.read()

# I am going to completely replace the script part from Let pdfBytes to the end.
script_start = text.find('let pdfBytes = null;')
script_end = text.find('</script>', script_start)

new_script = """let pdfBytes = null;
        let pdfJsDoc = null;
        let currentPage = 1;
        let totalPages = 0;
        
        // Store ratios instead of absolute pixels so it works flawlessly across different page sizes
        // ratio format: { rLeft, rTop, rWidth, rHeight }
        let pageRatios = {}; 
        let currentCanvasRect = null;

        document.getElementById('dropArea').onclick = () => document.getElementById('fileInput').click();
        document.getElementById('fileInput').onchange = e => loadPDF(e.target.files[0]);

        document.getElementById('dropArea').ondragover = e => { e.preventDefault(); };
        document.getElementById('dropArea').ondrop = e => {
            e.preventDefault();
            loadPDF(e.dataTransfer.files[0]);
        };
        
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
            pageRatios = {}; 

            document.getElementById('fileInfo').style.display = 'block';
            document.getElementById('fileInfo').textContent = '📄 ' + file.name + ' — ' + totalPages + ' pages';
            document.getElementById('cropContainer').style.display = 'block';

            await renderPage();
            setTimeout(initCropBox, 100);
        }

        async function renderPage() {
            const page = await pdfJsDoc.getPage(currentPage);
            const viewport = page.getViewport({ scale: 1.2 });
            const canvas = document.getElementById('previewCanvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;

            document.getElementById('pageInput').value = currentPage;
            document.getElementById('totalPagesSpan').innerText = totalPages;
            
            // After render, establish crop box for this page
            currentCanvasRect = canvas.getBoundingClientRect();
            
            if (!pageRatios[currentPage]) {
                // By default, 10% margins. If "Apply all" is checked, should we copy page 1?
                // For per-page uniqueness, let's just initialize it independently or copy from 1 if it exists.
                if (document.getElementById('applyAll').checked && pageRatios[1]) {
                    pageRatios[currentPage] = { ...pageRatios[1] };
                } else {
                    pageRatios[currentPage] = { rLeft: 0.1, rTop: 0.1, rWidth: 0.8, rHeight: 0.8 };
                }
            }
            
            applyRatioToBox(pageRatios[currentPage], currentCanvasRect);
            updateBoxUI();
            boxElem.style.display = 'block';
        }
        
        function applyRatioToBox(ratio, rect) {
            cropBox.left = rect.width * ratio.rLeft;
            cropBox.top = rect.height * ratio.rTop;
            cropBox.width = rect.width * ratio.rWidth;
            cropBox.height = rect.height * ratio.rHeight;
        }

        function updateCurrentPageRatio() {
            if (!currentCanvasRect) return;
            pageRatios[currentPage] = {
                rLeft: cropBox.left / currentCanvasRect.width,
                rTop: cropBox.top / currentCanvasRect.height,
                rWidth: cropBox.width / currentCanvasRect.width,
                rHeight: cropBox.height / currentCanvasRect.height
            };
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
            currentCanvasRect = canvas.getBoundingClientRect();
            
            pageRatios[1] = { rLeft: 0.1, rTop: 0.1, rWidth: 0.8, rHeight: 0.8 };
            applyRatioToBox(pageRatios[1], currentCanvasRect);
            
            boxElem.style.display = 'block';
            updateBoxUI();
        }

        function updateBoxUI() {
            boxElem.style.top = cropBox.top + 'px';
            boxElem.style.left = cropBox.left + 'px';
            boxElem.style.width = cropBox.width + 'px';
            boxElem.style.height = cropBox.height + 'px';
            updateCurrentPageRatio();
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
            const maxW = currentCanvasRect.width;
            const maxH = currentCanvasRect.height;

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
            
            pages.forEach((page, index) => {
                const pageNum = index + 1;
                
                // If applyAll is true, use whatever ratio is actively visible on the screen right now (for currentPage)
                // If false, use the specific ratio the user set for this page. If missing, keep original dimensions by doing nothing.
                let ratio = applyAll ? pageRatios[currentPage] : pageRatios[pageNum];
                
                if (ratio) {
                    const { width, height } = page.getSize();
                    const newLeft = width * ratio.rLeft;
                    const newWidth = width * ratio.rWidth;
                    const newHeight = height * ratio.rHeight;
                    const newTopMargin = height * ratio.rTop;
                    const newBottom = height - newTopMargin - newHeight;

                    page.setCropBox(newLeft, newBottom, newWidth, newHeight);
                    page.setMediaBox(newLeft, newBottom, newWidth, newHeight);
                }
            });

            const croppedBytes = await pdfDoc.save();
            download(croppedBytes, 'Cropped-PDF-OnlinePDFPro.pdf', 'application/pdf');
        }
    """

text = text[:script_start] + new_script + text[script_end:]

with open('tools/crop-pdf.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('Per page crop implemented!')
