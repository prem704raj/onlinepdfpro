pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

            let pdfDoc = null;
            let pdfBytes = null;
            let currentPage = 1;
            let totalPages = 0;
            let currentScale = 1.5;
            let currentTool = 'edit';
            let isDrawing = false;
            let layers = {};
            let undoStack = [];
            let redoStack = [];
            let extractedTexts = {};  // page -> [{originalText, element, ...}]
            let selectedTextElement = null; // Track currently selected text element for toolbar
            let domElementsByPage = {}; // page -> serialized user-added elements
            let searchIndex = []; // [{page, text}]
            let searchResults = []; // [{page, snippet, index}]
            let currentSearchResultIndex = -1;

            // Elements
            const pdfCanvas = document.getElementById('pdfCanvas');
            const overlayCanvas = document.getElementById('overlayCanvas');
            const ctx = overlayCanvas.getContext('2d');
            const pageWrapper = document.getElementById('pageWrapper');

            // File upload
            document.getElementById('dropArea').onclick = () => document.getElementById('fileInput').click();
            document.getElementById('fileInput').onchange = e => loadPDF(e.target.files[0]);

            document.getElementById('dropArea').ondragover = e => { e.preventDefault(); };
            document.getElementById('dropArea').ondrop = e => {
                e.preventDefault();
                loadPDF(e.dataTransfer.files[0]);
            };

            let _originalFileName = 'edited.pdf';
            async function loadPDF(file) {
                if (!file) return;
                _originalFileName = file.name;
                layers = {};
                domElementsByPage = {};
                extractedTexts = {};
                imageReplacements = {};
                undoStack = [];
                redoStack = [];
                searchIndex = [];
                searchResults = [];
                currentSearchResultIndex = -1;

                pdfBytes = await file.arrayBuffer();
                // Pass a copy to pdfjsLib — it detaches the ArrayBuffer
                pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
                totalPages = pdfDoc.numPages;
                currentPage = 1;

                // Initialize layers for each page
                for (let i = 1; i <= totalPages; i++) {
                    if (!layers[i]) layers[i] = { drawings: [], elements: [] };
                    if (!domElementsByPage[i]) domElementsByPage[i] = [];
                }

                document.getElementById('uploadScreen').style.display = 'none';
                // Show compact editing banner instead of hiding title entirely
                const toolHeader = document.getElementById('toolHeader');
                toolHeader.style.marginBottom = '0';
                toolHeader.style.padding = '12px 20px';
                toolHeader.innerHTML = '<h1 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin:0; display:flex; align-items:center; gap:8px; justify-content:center;">✍️ PDF Editor <span style="font-size:0.85rem; font-weight:500; color:var(--text-secondary);">— ' + file.name + '</span></h1>';
                document.getElementById('editorLayout').style.display = 'flex';

                await renderPage();
                
                generateThumbnails();
                document.getElementById('thumbnailsToggleBtn').style.display = 'block';
                
                // Extract text for search functionality
                extractPDFText(pdfDoc);
                initPageManagement(pdfDoc);
            }

            async function renderPage() {
                clearDomElements();
                const page = await pdfDoc.getPage(currentPage);
                const viewport = page.getViewport({ scale: currentScale });
                const dpr = Math.max(window.devicePixelRatio || 1, 2);
                const hiResViewport = page.getViewport({ scale: currentScale * dpr });

                pdfCanvas.width = hiResViewport.width;
                pdfCanvas.height = hiResViewport.height;
                pdfCanvas.style.width = viewport.width + 'px';
                pdfCanvas.style.height = viewport.height + 'px';
                overlayCanvas.width = hiResViewport.width;
                overlayCanvas.height = hiResViewport.height;
                overlayCanvas.style.width = viewport.width + 'px';
                overlayCanvas.style.height = viewport.height + 'px';

                await page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport: hiResViewport }).promise;

                // Restore drawings for this page
                restoreDrawings();

                // Extract existing text from PDF for editing
                await extractPageContent(page, viewport);

                // Extract images from PDF for replacement
                await extractPageImages(page, viewport);

                // Restore user-added elements for this page
                restoreDomElements(domElementsByPage[currentPage] || []);

                document.getElementById('pageInfo').textContent = currentPage + ' / ' + totalPages;
                const zoomSelect = document.getElementById('zoomSelect');
                if (zoomSelect) {
                    zoomSelect.value = String(Math.round(currentScale * 100));
                }
                updateLayers();
            }

            // =============================================
            // EXTRACT EXISTING TEXT FROM PDF
            // =============================================
            async function extractPageContent(page, viewport) {
                // Remove any previously extracted text for this page
                pageWrapper.querySelectorAll('.extracted-text').forEach(el => el.remove());

                const textContent = await page.getTextContent();
                const textItems = textContent.items;
                const textStyles = textContent.styles || {};
                if (!extractedTexts[currentPage]) extractedTexts[currentPage] = [];

                // Group text items into lines (items with same Y position)
                const lines = [];
                let currentLine = null;

                textItems.forEach(item => {
                    if (!item.str || !item.str.trim()) return;

                    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
                    const x = tx[4];
                    const y = tx[5];

                    // Group items with similar Y position into one line
                    if (currentLine && Math.abs(y - currentLine.y) < fontSize * 0.5) {
                        currentLine.text += item.str;
                        currentLine.width = (x + item.width * fontSize / (item.transform ? Math.abs(item.transform[0]) : 1)) - currentLine.x;
                        currentLine.items.push(item);
                    } else {
                        currentLine = {
                            text: item.str,
                            x: x,
                            y: y,
                            fontSize: fontSize,
                            width: item.width * fontSize / (item.transform ? Math.abs(item.transform[0]) : 1),
                            height: fontSize * 1.2,
                            fontName: item.fontName || '',
                            items: [item]
                        };
                        lines.push(currentLine);
                    }
                });

                // Check for previously modified texts
                const savedMods = extractedTexts[currentPage] || [];

                lines.forEach((line, idx) => {
                    const div = document.createElement('div');
                    div.className = 'extracted-text';
                    div.style.left = line.x + 'px';
                    div.style.top = (line.y - line.fontSize) + 'px';
                    div.style.fontSize = line.fontSize + 'px';
                    div.style.minWidth = Math.max(line.width, 30) + 'px';
                    div.style.height = line.height + 'px';

                    // Store data
                    div.dataset.lineIndex = idx;
                    div.dataset.originalText = line.text;
                    div.dataset.currentText = line.text;
                    div.dataset.origX = line.x;
                    div.dataset.origY = line.y;
                    div.dataset.origFontSize = line.fontSize;
                    div.dataset.origWidth = line.width;
                    div.dataset.origHeight = line.height;
                    div.textContent = line.text;

                    // Restore modified text if it was previously edited
                    const savedMod = savedMods.find(m => m.lineIndex === idx);
                    if (savedMod && savedMod.newText !== line.text) {
                        div.dataset.currentText = savedMod.newText;
                        div.classList.add('modified');
                    }

                    // Click to open edit popup
                    div.addEventListener('click', (e) => {
                        if (currentTool !== 'edit' && currentTool !== 'cursor') return;
                        e.stopPropagation();
                        openEditPopup(div);
                    });

                    pageWrapper.appendChild(div);
                });
            }

            // =============================================
            // EXTRACT IMAGES FROM PDF
            // =============================================
            let imageReplacements = {}; // page -> [{imgIndex, dataUrl, x, y, w, h}]
            let activeReplaceTarget = null;

            async function extractPageImages(page, viewport) {
                // Remove any previously extracted image overlays
                pageWrapper.querySelectorAll('.extracted-image').forEach(el => el.remove());

                try {
                    const opList = await page.getOperatorList();
                    const OPS = pdfjsLib.OPS;
                    let imgIndex = 0;

                    // Track current transform matrix
                    let ctmStack = [];
                    let ctm = [1, 0, 0, 1, 0, 0];

                    for (let i = 0; i < opList.fnArray.length; i++) {
                        const fn = opList.fnArray[i];
                        const args = opList.argsArray[i];

                        if (fn === OPS.save) {
                            ctmStack.push([...ctm]);
                        } else if (fn === OPS.restore) {
                            ctm = ctmStack.pop() || [1, 0, 0, 1, 0, 0];
                        } else if (fn === OPS.transform) {
                            // Multiply current transform matrix with new one
                            const [a, b, c, d, e, f] = args;
                            const [A, B, C, D, E, F] = ctm;
                            ctm = [
                                A * a + B * c,
                                A * b + B * d,
                                C * a + D * c,
                                C * b + D * d,
                                E * a + F * c + e,
                                E * b + F * d + f
                            ];
                        } else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
                            // Image found! Calculate its position
                            const imgW = Math.abs(ctm[0]);
                            const imgH = Math.abs(ctm[3]);

                            // Skip tiny images (icons, bullets etc)
                            if (imgW < 20 || imgH < 20) {
                                imgIndex++;
                                continue;
                            }

                            // Convert PDF coordinates to viewport
                            const x = ctm[4] * viewport.scale;
                            const y = viewport.height - (ctm[5] * viewport.scale) - (imgH * viewport.scale);
                            const w = imgW * viewport.scale;
                            const h = imgH * viewport.scale;

                            createImageOverlay(imgIndex, x, y, w, h);
                            imgIndex++;
                        }
                    }
                } catch (err) {
                    console.warn('Could not extract images:', err);
                }
            }

            function createImageOverlay(imgIdx, x, y, w, h) {
                const div = document.createElement('div');
                div.className = 'extracted-image';
                div.style.left = x + 'px';
                div.style.top = y + 'px';
                div.style.width = w + 'px';
                div.style.height = h + 'px';
                div.dataset.imgIndex = imgIdx;

                // Check if there's already a replacement
                const replacements = imageReplacements[currentPage] || [];
                const existing = replacements.find(r => r.imgIndex === imgIdx);
                if (existing) {
                    // Show replacement image preview
                    div.style.backgroundImage = 'url(' + existing.dataUrl + ')';
                    div.style.backgroundSize = 'cover';
                    div.style.backgroundPosition = 'center';
                    div.style.borderColor = '#22c55e';
                }

                // Replace button
                const btn = document.createElement('button');
                btn.className = 'img-replace-btn';
                btn.textContent = existing ? '✅ Change Again' : '🖼️ Replace Image';
                btn.onclick = function (e) {
                    e.stopPropagation();
                    activeReplaceTarget = {
                        page: currentPage,
                        imgIndex: imgIdx,
                        div: div,
                        x: x, y: y, w: w, h: h
                    };
                    document.getElementById('replaceImageInput').click();
                };
                div.appendChild(btn);

                pageWrapper.appendChild(div);
            }

            // Handle replacement image selection
            document.getElementById('replaceImageInput').onchange = function (e) {
                const file = e.target.files[0];
                if (!file || !activeReplaceTarget) return;

                const reader = new FileReader();
                reader.onload = function (ev) {
                    const dataUrl = ev.target.result;
                    const target = activeReplaceTarget;

                    // Store replacement
                    if (!imageReplacements[target.page]) imageReplacements[target.page] = [];
                    const existingIdx = imageReplacements[target.page].findIndex(r => r.imgIndex === target.imgIndex);
                    const replacement = {
                        imgIndex: target.imgIndex,
                        dataUrl: dataUrl,
                        x: target.x, y: target.y, w: target.w, h: target.h
                    };
                    if (existingIdx >= 0) {
                        imageReplacements[target.page][existingIdx] = replacement;
                    } else {
                        imageReplacements[target.page].push(replacement);
                    }

                    // Show preview on the overlay
                    target.div.style.backgroundImage = 'url(' + dataUrl + ')';
                    target.div.style.backgroundSize = 'cover';
                    target.div.style.backgroundPosition = 'center';
                    target.div.style.borderColor = '#22c55e';
                    target.div.querySelector('.img-replace-btn').textContent = '✅ Change Again';

                    activeReplaceTarget = null;
                    updateLayers();
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            };

            // =============================================
            // EDIT POPUP LOGIC
            // =============================================
            let activeEditTarget = null;

            function openEditPopup(el) {
                activeEditTarget = el;
                const popup = document.getElementById('editPopup');
                const backdrop = document.getElementById('editBackdrop');
                const input = document.getElementById('editPopupInput');

                // Pre-fill with current text
                input.value = el.dataset.currentText || el.dataset.originalText;

                // Show backdrop + popup (centered via CSS)
                backdrop.classList.add('active');
                popup.classList.add('active');

                // Highlight the text being edited
                el.classList.add('editing');

                // Focus and select all
                setTimeout(() => { input.focus(); input.select(); }, 50);
            }

            function closeEditPopup() {
                const popup = document.getElementById('editPopup');
                const backdrop = document.getElementById('editBackdrop');
                popup.classList.remove('active');
                backdrop.classList.remove('active');

                if (activeEditTarget) {
                    activeEditTarget.classList.remove('editing');
                    activeEditTarget = null;
                }
            }

            function saveEditPopup() {
                if (!activeEditTarget) return;
                const input = document.getElementById('editPopupInput');
                const newText = input.value.trim();
                const el = activeEditTarget;
                const idx = parseInt(el.dataset.lineIndex);
                const origText = el.dataset.originalText;

                if (newText && newText !== origText) {
                    el.dataset.currentText = newText;
                    el.classList.add('modified');

                    // Save modification
                    if (!extractedTexts[currentPage]) extractedTexts[currentPage] = [];
                    const existingIdx = extractedTexts[currentPage].findIndex(m => m.lineIndex === idx);
                    const mod = {
                        lineIndex: idx,
                        originalText: origText,
                        newText: newText,
                        x: parseFloat(el.dataset.origX),
                        y: parseFloat(el.dataset.origY),
                        fontSize: parseFloat(el.dataset.origFontSize),
                        width: parseFloat(el.dataset.origWidth),
                        height: parseFloat(el.dataset.origHeight)
                    };
                    if (existingIdx >= 0) {
                        extractedTexts[currentPage][existingIdx] = mod;
                    } else {
                        extractedTexts[currentPage].push(mod);
                    }
                } else if (newText === origText) {
                    el.dataset.currentText = origText;
                    el.classList.remove('modified');
                    extractedTexts[currentPage] = (extractedTexts[currentPage] || []).filter(m => m.lineIndex !== idx);
                }

                closeEditPopup();
                updateLayers();
            }

            // Enter key in popup saves
            document.getElementById('editPopupInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveEditPopup(); }
                if (e.key === 'Escape') { e.preventDefault(); closeEditPopup(); }
            });

            function restoreDrawings() {
                const pageLayer = layers[currentPage];
                if (!pageLayer) return;

                ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

                pageLayer.drawings.forEach(drawing => {
                    if (drawing.type === 'path') {
                        ctx.beginPath();
                        ctx.strokeStyle = drawing.color;
                        ctx.lineWidth = drawing.width;
                        ctx.lineCap = 'round';
                        ctx.globalAlpha = drawing.opacity;
                        drawing.points.forEach((point, i) => {
                            if (i === 0) ctx.moveTo(point.x, point.y);
                            else ctx.lineTo(point.x, point.y);
                        });
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    } else if (drawing.type === 'line') {
                        ctx.beginPath();
                        ctx.strokeStyle = drawing.color;
                        ctx.lineWidth = drawing.width;
                        ctx.moveTo(drawing.x1, drawing.y1);
                        ctx.lineTo(drawing.x2, drawing.y2);
                        ctx.stroke();
                    } else if (drawing.type === 'arrow') {
                        drawArrow(ctx, drawing.x1, drawing.y1, drawing.x2, drawing.y2, drawing.color, drawing.width);
                    } else if (drawing.type === 'rect') {
                        if (drawing.isFilled) {
                            ctx.fillStyle = drawing.color;
                            ctx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
                        } else {
                            ctx.strokeStyle = drawing.color;
                            ctx.lineWidth = drawing.width;
                            ctx.strokeRect(drawing.x, drawing.y, drawing.w, drawing.h);
                        }
                    } else if (drawing.type === 'highlight') {
                        ctx.fillStyle = drawing.color;
                        ctx.globalAlpha = 0.3;
                        ctx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
                        ctx.globalAlpha = 1;
                    }
                });
            }

            function drawArrow(ctx, x1, y1, x2, y2, color, width) {
                const headLength = 15;
                const angle = Math.atan2(y2 - y1, x2 - x1);
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fill();
            }

            // Tool selection
            function setTool(tool, e) {
                currentTool = tool;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                if (e && e.target) {
                    const btn = e.target.closest('.tool-btn');
                    if (btn) btn.classList.add('active');
                }

                // Key fix: disable overlay canvas pointer-events for cursor/text tools
                // so users can click on existing text elements to edit them
                const needsCanvasEvents = ['draw', 'highlight', 'eraser', 'line', 'arrow', 'shape', 'strikethrough', 'underline', 'whiteout'];
                if (needsCanvasEvents.includes(tool)) {
                    overlayCanvas.style.pointerEvents = 'auto';
                    overlayCanvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
                } else if (tool === 'text') {
                    // Text tool: overlay canvas captures clicks to create NEW text,
                    // but existing text elements (z-index:50) sit above it (z-index:40)
                    overlayCanvas.style.pointerEvents = 'auto';
                    overlayCanvas.style.cursor = 'text';
                } else {
                    // cursor, sticky, image, edit — let clicks pass through to DOM elements
                    overlayCanvas.style.pointerEvents = 'none';
                    overlayCanvas.style.cursor = 'default';
                }

                // Toggle extracted text visibility when edit/select tool is active
                const extractedEls = pageWrapper.querySelectorAll('.extracted-text');
                if (tool === 'edit' || tool === 'cursor') {
                    extractedEls.forEach(el => {
                        el.style.pointerEvents = 'auto';
                        el.style.borderColor = tool === 'edit' ? 'rgba(99, 102, 241, 0.15)' : 'transparent';
                    });
                } else {
                    extractedEls.forEach(el => {
                        if (!el.classList.contains('modified')) {
                            el.style.pointerEvents = 'none';
                            el.style.borderColor = 'transparent';
                        }
                    });
                }

                if (tool === 'image') {
                    document.getElementById('imageInput').click();
                }
            }

            // Image upload
            document.getElementById('imageInput').onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    addImageElement(ev.target.result, 100, 100, 200);
                };
                reader.readAsDataURL(file);
            };

            function addImageElement(src, x, y, width, options = {}) {
                const skipHistory = !!options.skipHistory;
                const div = document.createElement('div');
                div.className = 'image-element';
                div.style.left = x + 'px';
                div.style.top = y + 'px';
                div.style.width = width + 'px';
                if (options.height && options.height > 0) {
                    div.style.height = options.height + 'px';
                }
                div.innerHTML = '<img loading="lazy" src="' + src + '"><div class="img-resize"></div><button class="img-delete" onclick="this.parentElement.remove(); updateLayers();">×</button>';
                pageWrapper.appendChild(div);
                makeDraggable(div);
                makeImgResizable(div);
                updateLayers();
                if (!skipHistory) {
                    saveState();
                }
            }

            // Canvas mouse events
            let startX, startY, currentPath = [];

            overlayCanvas.onmousedown = e => {
                const rect = overlayCanvas.getBoundingClientRect();
                startX = e.clientX - rect.left;
                startY = e.clientY - rect.top;
                isDrawing = true;
                currentPath = [{ x: startX, y: startY }];

                if (currentTool === 'text') {
                    isDrawing = false;
                    addTextElement(startX, startY);
                } else if (currentTool === 'sticky') {
                    isDrawing = false;
                    addStickyNote(startX, startY);
                } else if (currentTool === 'shape') {
                    // Will draw on mouseup
                }
            };

            overlayCanvas.onmousemove = e => {
                if (!isDrawing) return;
                const rect = overlayCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                if (currentTool === 'draw') {
                    ctx.beginPath();
                    ctx.strokeStyle = document.getElementById('strokeColor').value;
                    ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
                    ctx.lineCap = 'round';
                    ctx.globalAlpha = parseInt(document.getElementById('opacity').value) / 100;
                    ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    currentPath.push({ x, y });
                } else if (currentTool === 'highlight') {
                    restoreDrawings();
                    ctx.fillStyle = '#ffff00';
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(startX, startY, x - startX, y - startY);
                    ctx.globalAlpha = 1;
                } else if (currentTool === 'eraser') {
                    ctx.clearRect(x - 15, y - 15, 30, 30);
                } else if (currentTool === 'line' || currentTool === 'arrow') {
                    restoreDrawings();
                    if (currentTool === 'line') {
                        ctx.beginPath();
                        ctx.strokeStyle = document.getElementById('strokeColor').value;
                        ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    } else {
                        drawArrow(ctx, startX, startY, x, y, document.getElementById('strokeColor').value, parseInt(document.getElementById('strokeWidth').value));
                    }
                } else if (currentTool === 'shape' || currentTool === 'whiteout') {
                    restoreDrawings();
                    if(currentTool === 'whiteout') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(startX, startY, x - startX, y - startY);
                    } else {
                        ctx.strokeStyle = document.getElementById('strokeColor').value;
                        ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value);
                        ctx.strokeRect(startX, startY, x - startX, y - startY);
                    }
                }
            };

            overlayCanvas.onmouseup = e => {
                if (!isDrawing) return;
                isDrawing = false;
                const rect = overlayCanvas.getBoundingClientRect();
                const endX = e.clientX - rect.left;
                const endY = e.clientY - rect.top;

                if (!layers[currentPage]) layers[currentPage] = { drawings: [], elements: [] };

                if (currentTool === 'draw' && currentPath.length > 1) {
                    layers[currentPage].drawings.push({
                        type: 'path',
                        points: [...currentPath],
                        color: document.getElementById('strokeColor').value,
                        width: parseInt(document.getElementById('strokeWidth').value),
                        opacity: parseInt(document.getElementById('opacity').value) / 100
                    });
                } else if (currentTool === 'highlight') {
                    layers[currentPage].drawings.push({
                        type: 'highlight',
                        x: startX, y: startY,
                        w: endX - startX, h: endY - startY,
                        color: '#ffff00'
                    });
                } else if (currentTool === 'line') {
                    layers[currentPage].drawings.push({
                        type: 'line',
                        x1: startX, y1: startY, x2: endX, y2: endY,
                        color: document.getElementById('strokeColor').value,
                        width: parseInt(document.getElementById('strokeWidth').value)
                    });
                } else if (currentTool === 'arrow') {
                    layers[currentPage].drawings.push({
                        type: 'arrow',
                        x1: startX, y1: startY, x2: endX, y2: endY,
                        color: document.getElementById('strokeColor').value,
                        width: parseInt(document.getElementById('strokeWidth').value)
                    });
                } else if (currentTool === 'shape' || currentTool === 'whiteout') {
                    layers[currentPage].drawings.push({
                        type: 'rect',
                        x: startX, y: startY,
                        w: endX - startX, h: endY - startY,
                        color: currentTool === 'whiteout' ? '#ffffff' : document.getElementById('strokeColor').value,
                        width: currentTool === 'whiteout' ? 0 : parseInt(document.getElementById('strokeWidth').value),
                        isFilled: currentTool === 'whiteout'
                    });
                }

                updateLayers();
                saveState();
            };

            // Touch support
            overlayCanvas.ontouchstart = e => {
                e.preventDefault();
                const touch = e.touches[0];
                overlayCanvas.onmousedown({ clientX: touch.clientX, clientY: touch.clientY });
            };
            overlayCanvas.ontouchmove = e => {
                e.preventDefault();
                const touch = e.touches[0];
                overlayCanvas.onmousemove({ clientX: touch.clientX, clientY: touch.clientY });
            };
            overlayCanvas.ontouchend = e => {
                e.preventDefault();
                overlayCanvas.onmouseup({ clientX: startX, clientY: startY });
            };

            // Add text element
            function addTextElement(x, y) {
                const div = document.createElement('div');
                div.className = 'text-element';
                div.contentEditable = true;
                div.style.left = x + 'px';
                div.style.top = y + 'px';
                const fontSelect = document.getElementById('fontSelect');
                const fontSizeSelect = document.getElementById('fontSizeSelect');
                div.style.fontFamily = fontSelect ? fontSelect.value : 'Arial';
                div.style.fontSize = ((fontSizeSelect ? fontSizeSelect.value : 18) + 'px');
                div.style.color = document.getElementById('fontColor').value;
                div.style.zIndex = '50';
                div.textContent = 'Type here...';

                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-delete';
                deleteBtn.textContent = '×';
                deleteBtn.onclick = function (e) {
                    e.stopPropagation();
                    div.remove();
                    if (selectedTextElement === div) selectedTextElement = null;
                    updateLayers();
                };
                div.appendChild(deleteBtn);

                // Track selection for toolbar
                div.addEventListener('focus', () => {
                    selectedTextElement = div;
                    // Sync toolbar to element's current style
                    const currentFont = div.style.fontFamily.replace(/["']/g, '') || 'Arial';
                    const currentSize = parseInt(div.style.fontSize) || 18;
                    const fontControl = document.getElementById('fontSelect');
                    const sizeControl = document.getElementById('fontSizeSelect');
                    if (fontControl) fontControl.value = currentFont;
                    if (sizeControl) sizeControl.value = String(currentSize);
                    document.getElementById('fontColor').value = rgbToHex(div.style.color) || '#000000';
                });
                div.addEventListener('click', (e) => {
                    selectedTextElement = div;
                });

                pageWrapper.appendChild(div);
                div.focus();
                document.execCommand('selectAll');
                makeDraggable(div);

                // Double-click to edit text, single click in cursor mode to drag
                div.ondblclick = (e) => {
                    e.stopPropagation();
                    div.focus();
                    document.execCommand('selectAll');
                };

                updateLayers();
                saveState();
            }

            // Helper to convert rgb() to hex
            function rgbToHex(rgb) {
                if (!rgb || rgb.startsWith('#')) return rgb || '#000000';
                const match = rgb.match(/\d+/g);
                if (!match || match.length < 3) return '#000000';
                return '#' + match.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
            }

            function updateTextStyle() {
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.fontFamily = document.getElementById('fontSelect') ? document.getElementById('fontSelect').value : 'Arial';
                    let sizeVal = document.getElementById('fontSizeSelect') ? document.getElementById('fontSizeSelect').value : 18;
                    el.style.fontSize = sizeVal + 'px';
                    el.style.color = document.getElementById('fontColor').value;
                }
            }

            function changeFont(val) {
                // Update dropdown visually if needed, though native select already shows it
                document.getElementById('fontSelect').style.fontFamily = val;
                updateTextStyle();
            }

            function changeFontSize(val) {
                updateTextStyle();
            }

            function setTextAlign(alignment) {
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.textAlign = alignment;
                }
                
                // Update active state of buttons
                ['Left', 'Center', 'Right', 'Justify'].forEach(align => {
                    const btn = document.getElementById('btnAlign' + align);
                    if (btn) {
                        btn.style.background = (alignment === align.toLowerCase()) ? 'var(--accent)' : 'transparent';
                        btn.style.color = (alignment === align.toLowerCase()) ? '#fff' : 'var(--text-primary)';
                    }
                });
            }

            function setLineHeight(val) {
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.lineHeight = val;
                }
            }

            function setLetterSpacing(val) {
                document.getElementById('spacingValue').textContent = val + 'px';
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.letterSpacing = val + 'px';
                }
            }

            function makeBold() {
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.fontWeight = el.style.fontWeight === 'bold' ? 'normal' : 'bold';
                }
            }
            function makeItalic() {
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.fontStyle = el.style.fontStyle === 'italic' ? 'normal' : 'italic';
                }
            }
            function makeUnderlineText() {
                const el = selectedTextElement || document.querySelector('.text-element:focus');
                if (el) {
                    el.style.textDecoration = el.style.textDecoration === 'underline' ? 'none' : 'underline';
                }
            }

            // Add sticky note
            function addStickyNote(x, y) {
                const note = document.createElement('div');
                note.className = 'sticky-note';
                note.style.left = x + 'px';
                note.style.top = y + 'px';
                note.innerHTML = '<button class="sticky-delete" onclick="this.parentElement.remove(); updateLayers();">×</button><textarea placeholder="Write your note..."></textarea>';
                pageWrapper.appendChild(note);
                makeDraggable(note);
                note.querySelector('textarea').focus();
                updateLayers();
                saveState();
            }

            // Make elements draggable
            function makeDraggable(el) {
                let px = 0, py = 0;
                el.onmousedown = e => {
                    // Don't drag if clicking on interactive child elements
                    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.classList.contains('img-resize') || e.target.classList.contains('img-delete')) return;

                    // If this is a text element and we're NOT in cursor mode, allow normal text editing
                    if (el.contentEditable === 'true' && currentTool !== 'cursor') {
                        return; // Let the browser handle text selection/editing naturally
                    }

                    // In cursor mode, drag the element
                    e.preventDefault();
                    px = e.clientX;
                    py = e.clientY;
                    document.onmousemove = ev => {
                        el.style.left = (el.offsetLeft + ev.clientX - px) + 'px';
                        el.style.top = (el.offsetTop + ev.clientY - py) + 'px';
                        px = ev.clientX;
                        py = ev.clientY;
                    };
                    document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; };
                };
            }

            function makeImgResizable(el) {
                const handle = el.querySelector('.img-resize');
                if (!handle) return;
                handle.onmousedown = e => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startW = el.offsetWidth;
                    document.onmousemove = ev => {
                        const newW = startW + (ev.clientX - startX);
                        if (newW > 50) el.style.width = newW + 'px';
                    };
                    document.onmouseup = () => { document.onmousemove = null; };
                };
            }

            // Page navigation
            function prevPage() {
                if (currentPage > 1) {
                    saveCurrentPageDomElements();
                    currentPage--;
                    renderPage();
                }
            }

            function nextPage() {
                if (currentPage < totalPages) {
                    saveCurrentPageDomElements();
                    currentPage++;
                    renderPage();
                }
            }

            // Re-render on browser zoom (Ctrl+scroll / pinch) so text stays crisp
            (function watchBrowserZoom() {
                let lastDpr = window.devicePixelRatio || 1;
                let debounceTimer = null;
                function onDprChange() {
                    const newDpr = window.devicePixelRatio || 1;
                    if (newDpr !== lastDpr) {
                        lastDpr = newDpr;
                        if (pdfDoc) {
                            clearTimeout(debounceTimer);
                            debounceTimer = setTimeout(() => renderPage(), 200);
                        }
                    }
                    matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
                        .addEventListener('change', onDprChange, { once: true });
                }
                matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
                    .addEventListener('change', onDprChange, { once: true });
            })();

            function clearDomElements() {
                pageWrapper.querySelectorAll('.text-element, .image-element, .sticky-note, .shape-element').forEach(el => el.remove());
            }

            function clearPage() {
                const confirmed = confirm(
                    "⚠️ Are you sure?\n\n" +
                    "This will erase ALL your edits on this page.\n" +
                    "This action cannot be undone."
                );
                
                if (confirmed) {
                    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    clearDomElements();
                    if (layers[currentPage]) layers[currentPage] = { drawings: [], elements: [] };
                    domElementsByPage[currentPage] = [];
                    updateLayers();
                }
            }

            // Layers panel
            function updateLayers() {
                const list = document.getElementById('layersList');
                const textEls = pageWrapper.querySelectorAll('.text-element');
                const imgEls = pageWrapper.querySelectorAll('.image-element');
                const noteEls = pageWrapper.querySelectorAll('.sticky-note');
                const modifiedCount = pageWrapper.querySelectorAll('.extracted-text.modified').length;
                const drawCount = layers[currentPage] ? layers[currentPage].drawings.length : 0;

                let html = '';
                if (modifiedCount > 0) {
                    html += '<div class="layer-item"><span>✍️ ' + modifiedCount + ' Text Edit(s)</span></div>';
                }
                textEls.forEach((el, i) => {
                    html += '<div class="layer-item"><span>🔤 Text ' + (i + 1) + '</span><button class="layer-delete" onclick="this.closest(\'.layer-item\').remove(); document.querySelectorAll(\'.text-element\')[' + i + '].remove();">×</button></div>';
                });
                imgEls.forEach((el, i) => {
                    html += '<div class="layer-item"><span>🖼️ Image ' + (i + 1) + '</span><button class="layer-delete" onclick="document.querySelectorAll(\'.image-element\')[' + i + '].remove(); updateLayers();">×</button></div>';
                });
                noteEls.forEach((el, i) => {
                    html += '<div class="layer-item"><span>📝 Note ' + (i + 1) + '</span><button class="layer-delete" onclick="document.querySelectorAll(\'.sticky-note\')[' + i + '].remove(); updateLayers();">×</button></div>';
                });
                if (drawCount > 0) {
                    html += '<div class="layer-item"><span>✏️ ' + drawCount + ' Drawing(s)</span></div>';
                }

                if (html === '') html = '<p style="color:#94a3b8; font-size:13px; text-align:center;">No edits yet</p>';
                list.innerHTML = html;
            }

            // Undo/Redo — now saves both canvas drawings AND DOM elements
            function getElementTextValue(el) {
                const clone = el.cloneNode(true);
                clone.querySelectorAll('.text-delete').forEach(btn => btn.remove());
                return (clone.textContent || '').trim();
            }

            function serializeDomElements() {
                const elements = [];
                pageWrapper.querySelectorAll('.text-element').forEach(el => {
                    elements.push({
                        type: 'text',
                        left: el.style.left,
                        top: el.style.top,
                        fontFamily: el.style.fontFamily,
                        fontSize: el.style.fontSize,
                        color: el.style.color,
                        html: el.innerHTML,
                        text: getElementTextValue(el),
                        fontWeight: el.style.fontWeight,
                        fontStyle: el.style.fontStyle,
                        textDecoration: el.style.textDecoration,
                        textAlign: el.style.textAlign,
                        lineHeight: el.style.lineHeight,
                        letterSpacing: el.style.letterSpacing
                    });
                });
                pageWrapper.querySelectorAll('.image-element').forEach(el => {
                    const img = el.querySelector('img');
                    elements.push({
                        type: 'image',
                        left: el.style.left,
                        top: el.style.top,
                        width: el.style.width,
                        height: el.style.height || (el.offsetHeight ? (el.offsetHeight + 'px') : ''),
                        src: img ? img.src : ''
                    });
                });
                pageWrapper.querySelectorAll('.sticky-note').forEach(el => {
                    const textarea = el.querySelector('textarea');
                    elements.push({
                        type: 'sticky',
                        left: el.style.left,
                        top: el.style.top,
                        text: textarea ? textarea.value : ''
                    });
                });
                return elements;
            }

            function saveCurrentPageDomElements() {
                if (!pdfDoc || !currentPage) return;
                domElementsByPage[currentPage] = serializeDomElements();
            }

            function restoreDomElements(elements) {
                clearDomElements();
                if (!elements) return;
                elements.forEach(el => {
                    if (el.type === 'text') {
                        const div = document.createElement('div');
                        div.className = 'text-element';
                        div.contentEditable = true;
                        div.style.left = el.left;
                        div.style.top = el.top;
                        div.style.fontFamily = el.fontFamily;
                        div.style.fontSize = el.fontSize;
                        div.style.color = el.color;
                        div.style.zIndex = '50';
                        if (el.fontWeight) div.style.fontWeight = el.fontWeight;
                        if (el.fontStyle) div.style.fontStyle = el.fontStyle;
                        if (el.textDecoration) div.style.textDecoration = el.textDecoration;
                        if (el.textAlign) div.style.textAlign = el.textAlign;
                        if (el.lineHeight) div.style.lineHeight = el.lineHeight;
                        if (el.letterSpacing) div.style.letterSpacing = el.letterSpacing;
                        div.innerHTML = el.html;
                        pageWrapper.appendChild(div);
                        makeDraggable(div);
                        div.ondblclick = (e) => { e.stopPropagation(); div.focus(); document.execCommand('selectAll'); };
                    } else if (el.type === 'image') {
                        addImageElement(
                            el.src,
                            parseInt(el.left, 10) || 0,
                            parseInt(el.top, 10) || 0,
                            parseInt(el.width, 10) || 200,
                            {
                                skipHistory: true,
                                height: parseInt(el.height, 10) || 0
                            }
                        );
                    } else if (el.type === 'sticky') {
                        const note = document.createElement('div');
                        note.className = 'sticky-note';
                        note.style.left = el.left;
                        note.style.top = el.top;
                        note.innerHTML = '<button class="sticky-delete" onclick="this.parentElement.remove(); updateLayers();">×</button><textarea placeholder="Write your note...">' + (el.text || '') + '</textarea>';
                        pageWrapper.appendChild(note);
                        makeDraggable(note);
                    }
                });
            }

            function saveState() {
                saveCurrentPageDomElements();
                const state = {
                    layers: JSON.parse(JSON.stringify(layers)),
                    domElementsByPage: JSON.parse(JSON.stringify(domElementsByPage)),
                    page: currentPage
                };
                undoStack.push(JSON.stringify(state));
                if (undoStack.length > 30) undoStack.shift();
                redoStack = [];
            }

            function undoAction() {
                if (undoStack.length > 0) {
                    // Save current state to redo stack
                    saveCurrentPageDomElements();
                    const currentState = {
                        layers: JSON.parse(JSON.stringify(layers)),
                        domElementsByPage: JSON.parse(JSON.stringify(domElementsByPage)),
                        page: currentPage
                    };
                    redoStack.push(JSON.stringify(currentState));

                    const prevState = JSON.parse(undoStack.pop());
                    layers = prevState.layers;
                    domElementsByPage = prevState.domElementsByPage || {};
                    if (typeof prevState.page === 'number') currentPage = prevState.page;
                    restoreDrawings();
                    restoreDomElements(domElementsByPage[currentPage] || []);
                    updateLayers();
                }
            }

            function redoAction() {
                if (redoStack.length > 0) {
                    saveCurrentPageDomElements();
                    const currentState = {
                        layers: JSON.parse(JSON.stringify(layers)),
                        domElementsByPage: JSON.parse(JSON.stringify(domElementsByPage)),
                        page: currentPage
                    };
                    undoStack.push(JSON.stringify(currentState));

                    const nextState = JSON.parse(redoStack.pop());
                    layers = nextState.layers;
                    domElementsByPage = nextState.domElementsByPage || {};
                    if (typeof nextState.page === 'number') currentPage = nextState.page;
                    restoreDrawings();
                    restoreDomElements(domElementsByPage[currentPage] || []);
                    updateLayers();
                }
            }

            function parsePixelValue(value, fallback = 0) {
                const parsed = parseFloat(String(value || '').replace('px', ''));
                return Number.isFinite(parsed) ? parsed : fallback;
            }

            function decodeDataUrlToBytes(dataUrl) {
                return Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));
            }

            async function embedImageFromDataUrl(pdfLibDoc, dataUrl) {
                if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
                const bytes = decodeDataUrlToBytes(dataUrl);
                if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
                    return await pdfLibDoc.embedJpg(bytes);
                }
                if (dataUrl.startsWith('data:image/png')) {
                    return await pdfLibDoc.embedPng(bytes);
                }
                return null;
            }

            function getSerializedTextForSave(serializedTextEl) {
                if (typeof serializedTextEl.text === 'string') {
                    return serializedTextEl.text.trim();
                }
                if (typeof serializedTextEl.html === 'string') {
                    const temp = document.createElement('div');
                    temp.innerHTML = serializedTextEl.html;
                    temp.querySelectorAll('.text-delete').forEach(btn => btn.remove());
                    return (temp.textContent || '').trim();
                }
                return '';
            }

            function drawLayerOnContext(targetCtx, drawings) {
                targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
                drawings.forEach(drawing => {
                    if (drawing.type === 'path') {
                        targetCtx.beginPath();
                        targetCtx.strokeStyle = drawing.color;
                        targetCtx.lineWidth = drawing.width;
                        targetCtx.lineCap = 'round';
                        targetCtx.globalAlpha = drawing.opacity;
                        drawing.points.forEach((point, i) => {
                            if (i === 0) targetCtx.moveTo(point.x, point.y);
                            else targetCtx.lineTo(point.x, point.y);
                        });
                        targetCtx.stroke();
                        targetCtx.globalAlpha = 1;
                    } else if (drawing.type === 'line') {
                        targetCtx.beginPath();
                        targetCtx.strokeStyle = drawing.color;
                        targetCtx.lineWidth = drawing.width;
                        targetCtx.moveTo(drawing.x1, drawing.y1);
                        targetCtx.lineTo(drawing.x2, drawing.y2);
                        targetCtx.stroke();
                    } else if (drawing.type === 'arrow') {
                        drawArrow(targetCtx, drawing.x1, drawing.y1, drawing.x2, drawing.y2, drawing.color, drawing.width);
                    } else if (drawing.type === 'rect') {
                        if (drawing.isFilled) {
                            targetCtx.fillStyle = drawing.color;
                            targetCtx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
                        } else {
                            targetCtx.strokeStyle = drawing.color;
                            targetCtx.lineWidth = drawing.width;
                            targetCtx.strokeRect(drawing.x, drawing.y, drawing.w, drawing.h);
                        }
                    } else if (drawing.type === 'highlight') {
                        targetCtx.fillStyle = drawing.color;
                        targetCtx.globalAlpha = 0.3;
                        targetCtx.fillRect(drawing.x, drawing.y, drawing.w, drawing.h);
                        targetCtx.globalAlpha = 1;
                    }
                });
                targetCtx.globalAlpha = 1;
            }

            // Save PDF
            async function savePDF() {
                if (!pdfBytes) return;

                saveCurrentPageDomElements();

                const pdfLibDoc = await PDFLib.PDFDocument.load(pdfBytes);
                const pages = pdfLibDoc.getPages();
                const canvasWidth = Math.max(pdfCanvas.width || 1, 1);
                const canvasHeight = Math.max(pdfCanvas.height || 1, 1);

                for (let i = 0; i < pages.length; i++) {
                    const pageNum = i + 1;
                    const page = pages[i];
                    const { width, height } = page.getSize();

                    // ============================================
                    // Handle MODIFIED EXTRACTED TEXT for every page
                    // ============================================
                    const pageMods = extractedTexts[pageNum] || [];
                    if (pageMods.length > 0) {
                        const scaleX = width / canvasWidth;
                        const scaleY = height / canvasHeight;

                        for (const mod of pageMods) {
                            const rectX = mod.x * scaleX;
                            const rectY = height - (mod.y * scaleY);
                            const rectW = Math.max(mod.width * scaleX, 50);
                            const rectH = mod.fontSize * scaleY * 1.3;

                            page.drawRectangle({
                                x: rectX - 2,
                                y: rectY - 2,
                                width: rectW + 4,
                                height: rectH + 4,
                                color: PDFLib.rgb(1, 1, 1),
                            });

                            const textSize = mod.fontSize * scaleX * 0.72;
                            page.drawText(mod.newText, {
                                x: rectX,
                                y: rectY + 2,
                                size: textSize > 0 ? textSize : 10,
                                color: PDFLib.rgb(0, 0, 0),
                            });
                        }
                    }

                    // ============================================
                    // Handle REPLACED IMAGES for every page
                    // ============================================
                    const pageImgReplacements = imageReplacements[pageNum] || [];
                    if (pageImgReplacements.length > 0) {
                        const imgScaleX = width / canvasWidth;
                        const imgScaleY = height / canvasHeight;

                        for (const rep of pageImgReplacements) {
                            try {
                                const embeddedImg = await embedImageFromDataUrl(pdfLibDoc, rep.dataUrl);
                                if (!embeddedImg) continue;

                                const rx = rep.x * imgScaleX;
                                const ry = height - (rep.y * imgScaleY) - (rep.h * imgScaleY);
                                const rw = rep.w * imgScaleX;
                                const rh = rep.h * imgScaleY;

                                page.drawRectangle({
                                    x: rx, y: ry, width: rw, height: rh,
                                    color: PDFLib.rgb(1, 1, 1),
                                });

                                page.drawImage(embeddedImg, {
                                    x: rx, y: ry, width: rw, height: rh
                                });
                            } catch (imgErr) {
                                console.warn('Failed to embed replacement image:', imgErr);
                            }
                        }
                    }

                    // ============================================
                    // Handle user-added elements for every page
                    // ============================================
                    const pageElements = domElementsByPage[pageNum] || [];
                    const scale = width / canvasWidth;

                    // Text elements
                    const textElements = pageElements.filter(el => el.type === 'text');
                    for (const textEl of textElements) {
                        const text = getSerializedTextForSave(textEl);
                        if (!text) continue;

                        const size = parsePixelValue(textEl.fontSize, 18);
                        const color = textEl.color || '#000000';
                        const x = parsePixelValue(textEl.left, 0);
                        const y = parsePixelValue(textEl.top, 0);
                        const rgb = hexToRgb(color);

                        page.drawText(text, {
                            x: x * scale,
                            y: height - (y * scale) - (size * scale),
                            size: size * scale * 0.75,
                            color: PDFLib.rgb(rgb.r / 255, rgb.g / 255, rgb.b / 255)
                        });
                    }

                    // Drawing overlays
                    if (layers[pageNum] && layers[pageNum].drawings && layers[pageNum].drawings.length > 0) {
                        const layerCanvas = document.createElement('canvas');
                        layerCanvas.width = canvasWidth;
                        layerCanvas.height = canvasHeight;
                        const layerCtx = layerCanvas.getContext('2d');
                        drawLayerOnContext(layerCtx, layers[pageNum].drawings);

                        const overlayDataURL = layerCanvas.toDataURL('image/png');
                        const overlayBytes = decodeDataUrlToBytes(overlayDataURL);
                        const overlayImage = await pdfLibDoc.embedPng(overlayBytes);
                        page.drawImage(overlayImage, { x: 0, y: 0, width, height });
                    }

                    // Added image elements
                    const imageElements = pageElements.filter(el => el.type === 'image');
                    for (const imageEl of imageElements) {
                        try {
                            const embeddedImg = await embedImageFromDataUrl(pdfLibDoc, imageEl.src);
                            if (!embeddedImg) continue;

                            const x = parsePixelValue(imageEl.left, 0);
                            const y = parsePixelValue(imageEl.top, 0);
                            const elementWidth = parsePixelValue(imageEl.width, 200);
                            const elementHeight = parsePixelValue(imageEl.height, 0);

                            const drawW = elementWidth * scale;
                            const drawH = elementHeight > 0
                                ? elementHeight * scale
                                : ((embeddedImg.height / embeddedImg.width) * drawW);

                            page.drawImage(embeddedImg, {
                                x: x * scale,
                                y: height - (y * scale) - drawH,
                                width: drawW,
                                height: drawH
                            });
                        } catch (imgErr) {
                            console.warn('Failed to embed added image:', imgErr);
                        }
                    }
                }

                const savedBytes = await pdfLibDoc.save();
                incrementCounter('pdfEditor');
                incrementTodayCount();
                const blob = new Blob([savedBytes], { type: 'application/pdf' });
                OnlinePDFPro.Downloader.saveBlob(blob, (typeof _originalFileName !== 'undefined' && _originalFileName) || 'edited.pdf');
            }

            function hexToRgb(hex) {
                if (!hex) return { r: 0, g: 0, b: 0 };

                const input = String(hex).trim();
                if (input.startsWith('rgb')) {
                    const parts = input.match(/\d+/g) || [];
                    return {
                        r: parseInt(parts[0], 10) || 0,
                        g: parseInt(parts[1], 10) || 0,
                        b: parseInt(parts[2], 10) || 0
                    };
                }

                let normalized = input.replace('#', '');
                if (normalized.length === 3) {
                    normalized = normalized.split('').map(ch => ch + ch).join('');
                }

                if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
                    return { r: 0, g: 0, b: 0 };
                }

                return {
                    r: parseInt(normalized.substring(0, 2), 16),
                    g: parseInt(normalized.substring(2, 4), 16),
                    b: parseInt(normalized.substring(4, 6), 16)
                };
            }

            // ===== E-SIGNATURE TOOL =====
            let sigCanvas, sigCtx, isDrawingSig = false;

            function openSignatureModal() {
                document.getElementById('signatureModal').style.display = 'flex';
                initSignatureCanvas();
            }

            function closeSignatureModal() {
                document.getElementById('signatureModal').style.display = 'none';
            }

            function initSignatureCanvas() {
                sigCanvas = document.getElementById('signatureCanvas');
                if(!sigCanvas) return;
                sigCtx = sigCanvas.getContext('2d');
                sigCtx.lineWidth = 3;
                sigCtx.lineCap = 'round';
                sigCtx.strokeStyle = '#000000';

                sigCanvas.onmousedown = (e) => {
                    isDrawingSig = true;
                    sigCtx.strokeStyle = document.getElementById('sigColor').value;
                    sigCtx.beginPath();
                    sigCtx.moveTo(e.offsetX, e.offsetY);
                };
                sigCanvas.onmousemove = (e) => {
                    if (!isDrawingSig) return;
                    sigCtx.lineTo(e.offsetX, e.offsetY);
                    sigCtx.stroke();
                };
                sigCanvas.onmouseup = () => isDrawingSig = false;
                sigCanvas.onmouseout = () => isDrawingSig = false;

                // Touch events (mobile)
                sigCanvas.ontouchstart = (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = sigCanvas.getBoundingClientRect();
                    isDrawingSig = true;
                    sigCtx.strokeStyle = document.getElementById('sigColor').value;
                    sigCtx.beginPath();
                    sigCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
                };

                sigCanvas.ontouchmove = (e) => {
                    e.preventDefault();
                    if (!isDrawingSig) return;
                    const touch = e.touches[0];
                    const rect = sigCanvas.getBoundingClientRect();
                    sigCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                    sigCtx.stroke();
                };

                sigCanvas.ontouchend = () => isDrawingSig = false;
            }

            function clearSignature() {
                if(sigCtx && sigCanvas) sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            }

            function showSignTab(tab) {
                document.querySelectorAll('.sig-tab').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = '#fff';
                    b.style.color = '#333';
                    b.style.borderColor = '#e2e8f0';
                });
                const activeBtn = document.getElementById('tab-' + tab);
                if(activeBtn) {
                    activeBtn.classList.add('active');
                    activeBtn.style.background = '#2563eb';
                    activeBtn.style.color = '#fff';
                    activeBtn.style.borderColor = '#2563eb';
                }

                document.getElementById('sigDraw').style.display = tab === 'draw' ? 'block' : 'none';
                document.getElementById('sigType').style.display = tab === 'type' ? 'block' : 'none';
                document.getElementById('sigUpload').style.display = tab === 'upload' ? 'block' : 'none';
            }

            function setSigFont(font) {
                document.getElementById('sigTextInput').style.fontFamily = font;
            }

            function addSignatureToPDF() {
                let sigData;
                const activeTab = document.getElementById('sigDraw').style.display !== 'none' ? 'draw' :
                    document.getElementById('sigType').style.display !== 'none' ? 'type' : 'upload';

                if (activeTab === 'draw') {
                    sigData = sigCanvas.toDataURL('image/png');
                } else if (activeTab === 'type') {
                    const text = document.getElementById('sigTextInput').value;
                    if(!text) return;
                    const font = document.getElementById('sigTextInput').style.fontFamily || 'Dancing Script';
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 400;
                    tempCanvas.height = 150;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.font = `60px "${font}", cursive`;
                    tempCtx.fillStyle = '#000';
                    tempCtx.fillText(text, 20, 100);
                    sigData = tempCanvas.toDataURL('image/png');
                }

                if (sigData) {
                    addImageElement(sigData, 100, 100, 300);
                    closeSignatureModal();
                }
            }

            const sigFileInput = document.getElementById('sigFileInput');
            if(sigFileInput) {
                sigFileInput.onchange = function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        addImageElement(ev.target.result, 100, 100, 300);
                        closeSignatureModal();
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                };
            }

            // ===== WHITEOUT TOOL =====
            function activateWhiteout(e) {
                setTool('whiteout', e);
            }

            // ===== STAMP TOOL =====
            function openStampMenu() {
                const menu = document.getElementById('stampMenu');
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }

            function addStamp(text) {
                const stampCanvas = document.createElement('canvas');
                stampCanvas.width = 300;
                stampCanvas.height = 100;
                const stampCtx = stampCanvas.getContext('2d');

                const colors = {
                    'APPROVED': '#16a34a', 'REJECTED': '#dc2626', 'DRAFT': '#d97706',
                    'CONFIDENTIAL': '#dc2626', 'PAID': '#16a34a', 'FINAL': '#2563eb',
                    'COPY': '#7c3aed', 'VOID': '#dc2626'
                };
                const color = colors[text] || '#dc2626';

                stampCtx.strokeStyle = color;
                stampCtx.lineWidth = 4;
                stampCtx.roundRect(10, 10, 280, 80, 10);
                stampCtx.stroke();

                stampCtx.fillStyle = color;
                stampCtx.font = 'bold 36px Arial';
                stampCtx.textAlign = 'center';
                stampCtx.textBaseline = 'middle';
                stampCtx.fillText(text, 150, 50);

                const dataUrl = stampCanvas.toDataURL('image/png');
                addImageElement(dataUrl, 100, 100, 250);
                document.getElementById('stampMenu').style.display = 'none';
            }

            // ===== ZOOM LOGIC ======
            let currentZoom = 150;

            function setZoom(percent) {
                currentZoom = parseInt(percent);
                currentScale = currentZoom / 100;
                const select = document.getElementById('zoomSelect');
                if(select) select.value = currentZoom;
                saveCurrentPageDomElements();
                renderPage();
            }

            function zoomIn() {
                const levels = [50, 75, 100, 125, 150, 175, 200, 300];
                const nextLevel = levels.find(l => l > currentZoom);
                if (nextLevel) setZoom(nextLevel);
            }

            function zoomOut() {
                const levels = [50, 75, 100, 125, 150, 175, 200, 300];
                const prevLevel = [...levels].reverse().find(l => l < currentZoom);
                if (prevLevel) setZoom(prevLevel);
            }

            function fitToWidth() {
                const container = document.getElementById('canvasArea');
                const pdfW = pdfCanvas.width / (window.devicePixelRatio || 1);
                const unscaledPdfW = pdfW / currentScale;
                const ratio = (container.clientWidth - 48) / unscaledPdfW;
                setZoom(Math.round(ratio * 100));
            }

            // ===== THUMBNAILS =====
            function toggleThumbnails() {
                const panel = document.getElementById('thumbnailPanel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }

            function generateThumbnails() {
                if(!pdfDoc) return;
                const list = document.getElementById('thumbnailList');
                list.innerHTML = '';

                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    pdfDoc.getPage(i).then(page => {
                        const viewport = page.getViewport({ scale: 0.2 });
                        const canvas = document.createElement('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        canvas.style.width = '100%';
                        canvas.style.borderRadius = '6px';
                        canvas.style.cursor = 'pointer';
                        canvas.style.marginBottom = '8px';
                        canvas.style.border = currentPage === i ? '2px solid #2563eb' : '2px solid transparent';
                        canvas.style.display = 'block';

                        const tnCtx = canvas.getContext('2d');
                        page.render({ canvasContext: tnCtx, viewport: viewport });

                        canvas.onclick = () => {
                            saveCurrentPageDomElements();
                            currentPage = i;
                            renderPage();
                            document.querySelectorAll('#thumbnailList canvas').forEach(c => c.style.border = '2px solid transparent');
                            canvas.style.border = '2px solid #2563eb';
                        };

                        const label = document.createElement('div');
                        label.textContent = `Page ${i}`;
                        label.style.cssText = 'color:#94a3b8;font-size:11px;text-align:center;margin-bottom:12px';

                        const wrapper = document.createElement('div');
                        wrapper.id = `thumb-${i}`;
                        wrapper.style.order = i;
                        wrapper.style.display = 'flex';
                        wrapper.style.flexDirection = 'column';
                        wrapper.appendChild(canvas);
                        wrapper.appendChild(label);
                        
                        list.appendChild(wrapper);
                        
                        // force order just in case they load async unordered
                        requestAnimationFrame(() => {
                            Array.from(list.children)
                                 .sort((a,b) => parseInt(a.style.order) - parseInt(b.style.order))
                                 .forEach(node => list.appendChild(node));
                        });
                    });
                }
            }

            function normalizeKeyedPageState(defaultFactory = () => ({})) {
                for (let i = 1; i <= totalPages; i++) {
                    if (!layers[i]) layers[i] = { drawings: [], elements: [] };
                    if (!domElementsByPage[i]) domElementsByPage[i] = [];
                    if (!extractedTexts[i]) extractedTexts[i] = [];
                    if (!imageReplacements[i]) imageReplacements[i] = [];
                }
            }

            function remapPageStateByOrder(oneBasedOldPageOrder) {
                const oldLayers = layers;
                const oldDom = domElementsByPage;
                const oldExtracted = extractedTexts;
                const oldImageReplacements = imageReplacements;

                const newLayers = {};
                const newDom = {};
                const newExtracted = {};
                const newImageReplacements = {};

                oneBasedOldPageOrder.forEach((oldPageNum, idx) => {
                    const newPageNum = idx + 1;
                    newLayers[newPageNum] = oldLayers[oldPageNum] || { drawings: [], elements: [] };
                    newDom[newPageNum] = oldDom[oldPageNum] || [];
                    newExtracted[newPageNum] = oldExtracted[oldPageNum] || [];
                    newImageReplacements[newPageNum] = oldImageReplacements[oldPageNum] || [];
                });

                layers = newLayers;
                domElementsByPage = newDom;
                extractedTexts = newExtracted;
                imageReplacements = newImageReplacements;
            }

            async function refreshPdfAfterStructureChange() {
                pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
                totalPages = pdfDoc.numPages;
                normalizeKeyedPageState();
                await renderPage();
                generateThumbnails();
            }

            function initPageManagement() {
                normalizeKeyedPageState();
            }

            async function rotatePage(degrees) {
                if (!pdfBytes || !pdfDoc) return;
                saveCurrentPageDomElements();

                const pdfLibDoc = await PDFLib.PDFDocument.load(pdfBytes);
                const page = pdfLibDoc.getPage(currentPage - 1);
                const currentRotation = page.getRotation().angle || 0;
                const nextRotation = ((currentRotation + degrees) % 360 + 360) % 360;
                page.setRotation(PDFLib.degrees(nextRotation));

                pdfBytes = await pdfLibDoc.save();
                await refreshPdfAfterStructureChange();
            }

            async function deleteCurrentPage() {
                if (!pdfBytes || totalPages <= 1) {
                    alert('At least 1 page is required.');
                    return;
                }

                if (!confirm('Delete this page permanently?')) return;
                saveCurrentPageDomElements();

                const sourceDoc = await PDFLib.PDFDocument.load(pdfBytes);
                const oldCount = sourceDoc.getPageCount();
                const order = [];
                for (let i = 0; i < oldCount; i++) {
                    if (i !== currentPage - 1) order.push(i);
                }

                const outDoc = await PDFLib.PDFDocument.create();
                const copiedPages = await outDoc.copyPages(sourceDoc, order);
                copiedPages.forEach(p => outDoc.addPage(p));

                pdfBytes = await outDoc.save();
                remapPageStateByOrder(order.map(idx => idx + 1));
                currentPage = Math.min(currentPage, order.length);
                await refreshPdfAfterStructureChange();
            }

            async function insertBlankPage() {
                if (!pdfBytes || !pdfDoc) return;
                saveCurrentPageDomElements();

                const sourceDoc = await PDFLib.PDFDocument.load(pdfBytes);
                const oldCount = sourceDoc.getPageCount();
                const currentPdfPage = sourceDoc.getPage(Math.max(currentPage - 1, 0));
                const size = currentPdfPage.getSize();

                const beforeOrder = [];
                const afterOrder = [];
                for (let i = 0; i < oldCount; i++) {
                    if (i <= currentPage - 1) beforeOrder.push(i);
                    else afterOrder.push(i);
                }

                const outDoc = await PDFLib.PDFDocument.create();
                if (beforeOrder.length) {
                    const beforePages = await outDoc.copyPages(sourceDoc, beforeOrder);
                    beforePages.forEach(p => outDoc.addPage(p));
                }
                outDoc.addPage([size.width, size.height]);
                if (afterOrder.length) {
                    const afterPages = await outDoc.copyPages(sourceDoc, afterOrder);
                    afterPages.forEach(p => outDoc.addPage(p));
                }

                pdfBytes = await outDoc.save();

                const newLayers = {};
                const newDom = {};
                const newExtracted = {};
                const newImageReplacements = {};
                const newTotal = oldCount + 1;
                for (let i = 1; i <= newTotal; i++) {
                    if (i <= currentPage) {
                        newLayers[i] = layers[i] || { drawings: [], elements: [] };
                        newDom[i] = domElementsByPage[i] || [];
                        newExtracted[i] = extractedTexts[i] || [];
                        newImageReplacements[i] = imageReplacements[i] || [];
                    } else if (i === currentPage + 1) {
                        newLayers[i] = { drawings: [], elements: [] };
                        newDom[i] = [];
                        newExtracted[i] = [];
                        newImageReplacements[i] = [];
                    } else {
                        newLayers[i] = layers[i - 1] || { drawings: [], elements: [] };
                        newDom[i] = domElementsByPage[i - 1] || [];
                        newExtracted[i] = extractedTexts[i - 1] || [];
                        newImageReplacements[i] = imageReplacements[i - 1] || [];
                    }
                }
                layers = newLayers;
                domElementsByPage = newDom;
                extractedTexts = newExtracted;
                imageReplacements = newImageReplacements;

                currentPage = Math.min(currentPage + 1, newTotal);
                await refreshPdfAfterStructureChange();
            }

            async function movePage(direction) {
                if (!pdfBytes || !pdfDoc) return;
                const oldCount = totalPages;
                const from = currentPage - 1;
                const to = direction === 'up' ? from - 1 : from + 1;
                if (to < 0 || to >= oldCount) return;

                saveCurrentPageDomElements();

                const sourceDoc = await PDFLib.PDFDocument.load(pdfBytes);
                const zeroBasedOrder = Array.from({ length: oldCount }, (_, i) => i);
                const [moved] = zeroBasedOrder.splice(from, 1);
                zeroBasedOrder.splice(to, 0, moved);

                const outDoc = await PDFLib.PDFDocument.create();
                const copiedPages = await outDoc.copyPages(sourceDoc, zeroBasedOrder);
                copiedPages.forEach(p => outDoc.addPage(p));

                pdfBytes = await outDoc.save();
                remapPageStateByOrder(zeroBasedOrder.map(idx => idx + 1));
                currentPage = to + 1;
                await refreshPdfAfterStructureChange();
            }

            function toggleSearch() {
                const bar = document.getElementById('searchBar');
                if (!bar) return;
                const isOpen = bar.style.display === 'block';
                bar.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) {
                    const input = document.getElementById('searchInput');
                    if (input) input.focus();
                }
            }

            function closeSearch() {
                const bar = document.getElementById('searchBar');
                if (bar) bar.style.display = 'none';
            }

            function escapeRegExp(str) {
                return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }

            function escapeHtml(str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            }

            async function extractPDFText(doc) {
                if (!doc) return;
                const index = [];
                for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
                    const page = await doc.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str || '').join(' ');
                    index.push({ page: pageNum, text: pageText });
                }
                searchIndex = index;
            }

            function renderSearchResults() {
                const searchResultsWrap = document.getElementById('searchResults');
                const resultCount = document.getElementById('resultCount');
                const resultList = document.getElementById('resultList');
                if (!searchResultsWrap || !resultCount || !resultList) return;

                searchResultsWrap.style.display = 'block';
                resultCount.textContent = searchResults.length + ' result(s) found';

                if (searchResults.length === 0) {
                    resultList.innerHTML = '<div style="padding:8px;color:var(--text-secondary);font-size:13px;">No matches found.</div>';
                    return;
                }

                resultList.innerHTML = searchResults.map((result, idx) => {
                    const activeStyle = idx === currentSearchResultIndex ? 'background:rgba(59,130,246,0.12);border-color:var(--accent);' : '';
                    return '<button type="button" onclick="jumpToResult(' + idx + ')" style="width:100%;text-align:left;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text-primary);margin-bottom:8px;cursor:pointer;' + activeStyle + '"><strong>Page ' + result.page + '</strong><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">' + escapeHtml(result.snippet) + '</div></button>';
                }).join('');
            }

            async function jumpToResult(index) {
                if (index < 0 || index >= searchResults.length) return;
                currentSearchResultIndex = index;
                const result = searchResults[index];

                if (result.page !== currentPage) {
                    saveCurrentPageDomElements();
                    currentPage = result.page;
                    await renderPage();
                }

                const query = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
                if (query) {
                    const lowered = query.toLowerCase();
                    pageWrapper.querySelectorAll('.extracted-text').forEach(el => {
                        const text = (el.dataset.currentText || el.dataset.originalText || '').toLowerCase();
                        if (text.includes(lowered)) {
                            const prevBg = el.style.background;
                            const prevBorder = el.style.borderColor;
                            el.style.background = 'rgba(250, 204, 21, 0.25)';
                            el.style.borderColor = '#f59e0b';
                            setTimeout(() => {
                                el.style.background = prevBg;
                                el.style.borderColor = prevBorder;
                            }, 1200);
                        }
                    });
                }

                renderSearchResults();
            }

            function prevResult() {
                if (searchResults.length === 0) return;
                const nextIndex = currentSearchResultIndex <= 0 ? searchResults.length - 1 : currentSearchResultIndex - 1;
                jumpToResult(nextIndex);
            }

            function nextResult() {
                if (searchResults.length === 0) return;
                const nextIndex = currentSearchResultIndex >= searchResults.length - 1 ? 0 : currentSearchResultIndex + 1;
                jumpToResult(nextIndex);
            }

            async function searchPDF() {
                const input = document.getElementById('searchInput');
                if (!input) return;

                const query = input.value.trim();
                if (!query) {
                    searchResults = [];
                    currentSearchResultIndex = -1;
                    renderSearchResults();
                    return;
                }

                if (!searchIndex.length && pdfDoc) {
                    await extractPDFText(pdfDoc);
                }

                const matchCase = document.getElementById('matchCase') && document.getElementById('matchCase').checked;
                const wholeWord = document.getElementById('wholeWord') && document.getElementById('wholeWord').checked;
                const escapedQuery = escapeRegExp(query);
                const regexFlags = matchCase ? 'g' : 'gi';
                const regex = new RegExp(wholeWord ? ('\\b' + escapedQuery + '\\b') : escapedQuery, regexFlags);

                const nextResults = [];
                searchIndex.forEach(entry => {
                    regex.lastIndex = 0;
                    let match;
                    while ((match = regex.exec(entry.text)) !== null) {
                        const start = Math.max(0, match.index - 40);
                        const end = Math.min(entry.text.length, match.index + match[0].length + 40);
                        const snippet = (start > 0 ? '...' : '') + entry.text.slice(start, end) + (end < entry.text.length ? '...' : '');
                        nextResults.push({ page: entry.page, snippet, index: match.index });
                        if (match.index === regex.lastIndex) regex.lastIndex++;
                    }
                });

                searchResults = nextResults;
                currentSearchResultIndex = searchResults.length ? 0 : -1;
                renderSearchResults();
                if (searchResults.length) {
                    await jumpToResult(0);
                }
            }


            // Keyboard shortcuts
            document.onkeydown = e => {
                if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoAction(); }
                if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redoAction(); }
                if (e.ctrlKey && e.key === 's') { e.preventDefault(); savePDF(); }
                if (e.ctrlKey && e.key === 'f') { e.preventDefault(); toggleSearch(); }
            };

