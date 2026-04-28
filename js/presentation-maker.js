/**
 * Online Presentation Maker
 * Pure HTML, CSS, JavaScript - No backend, fully offline
 */

// ======================== STATE MANAGEMENT ========================
const app = {
    presentation: null,
    currentSlideIndex: 0,
    selectedElement: null,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragStartX: 0,
    dragStartY: 0,
    resizeStart: null,
    history: [],
    historyIndex: -1,
    lastSnapshot: '',
    imageCache: {}
};

const HISTORY_LIMIT = 100;
const HANDLE_SIZE = 8;

// Templates
const TEMPLATES = [
    {
        name: 'Blank',
        slides: [
            {
                background: '#ffffff',
                elements: [
                    { type: 'text', x: 50, y: 50, width: 860, height: 100, text: 'Title', font: 'Arial', size: 54, color: '#000000', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 170, width: 860, height: 300, text: 'Subtitle', font: 'Arial', size: 32, color: '#666666', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Blue Modern',
        slides: [
            {
                background: '#1e40af',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Welcome', font: 'Poppins', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Your amazing presentation starts here', font: 'Poppins', size: 28, color: '#e0e7ff', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Purple Gradient',
        slides: [
            {
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Let\'s Begin', font: 'Playfair Display', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Create something incredible', font: 'Playfair Display', size: 28, color: '#f3e8ff', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Dark Professional',
        slides: [
            {
                background: '#1a1a2e',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Presentation', font: 'Inter', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Professional Design', font: 'Inter', size: 28, color: '#94a3b8', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Green Energy',
        slides: [
            {
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Energy', font: 'Roboto', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Dynamic and Fresh', font: 'Roboto', size: 28, color: '#d1fae5', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Red Bold',
        slides: [
            {
                background: '#991b1b',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Impact', font: 'Montserrat', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Make a Statement', font: 'Montserrat', size: 28, color: '#fee2e2', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Minimalist Light',
        slides: [
            {
                background: '#f8f8f8',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Simple', font: 'Raleway', size: 64, color: '#1a1a1a', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Elegant and Clean', font: 'Raleway', size: 28, color: '#4a4a4a', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Ocean Blue',
        slides: [
            {
                background: 'linear-gradient(135deg, #0369a1 0%, #06b6d4 100%)',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Clarity', font: 'Open Sans', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Fresh and Inspiring', font: 'Open Sans', size: 28, color: '#cffafe', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Sunset Orange',
        slides: [
            {
                background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Warmth', font: 'Quicksand', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Vibrant and Welcoming', font: 'Quicksand', size: 28, color: '#fed7aa', bold: false, italic: false, underline: false }
                ]
            }
        ]
    },
    {
        name: 'Elegant Black',
        slides: [
            {
                background: '#000000',
                elements: [
                    { type: 'text', x: 50, y: 150, width: 860, height: 120, text: 'Sophistication', font: 'Merriweather', size: 64, color: '#ffffff', bold: true, italic: false, underline: false },
                    { type: 'text', x: 50, y: 300, width: 860, height: 80, text: 'Timeless and Powerful', font: 'Merriweather', size: 28, color: '#d1d5db', bold: false, italic: false, underline: false }
                ]
            }
        ]
    }
];

// ======================== INITIALIZATION ========================
function init() {
    loadPresentation();
    saveHistory();
    setupEventListeners();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
}

function loadPresentation() {
    const saved = localStorage.getItem('presentation-maker-data');
    if (saved) {
        app.presentation = JSON.parse(saved);
    } else {
        app.presentation = {
            name: 'My Presentation',
            slides: [
                {
                    background: '#ffffff',
                    elements: [
                        { type: 'text', x: 50, y: 50, width: 860, height: 100, text: 'Title', font: 'Arial', size: 54, color: '#000000', bold: true, italic: false, underline: false },
                        { type: 'text', x: 50, y: 170, width: 860, height: 300, text: 'Subtitle', font: 'Arial', size: 32, color: '#666666', bold: false, italic: false, underline: false }
                    ]
                }
            ]
        };
    }
    app.currentSlideIndex = 0;
}

function savePresentation() {
    localStorage.setItem('presentation-maker-data', JSON.stringify(app.presentation));
}

function commitChange() {
    saveHistory();
    savePresentation();
}

// ======================== HISTORY / UNDO REDO ========================
function saveHistory() {
    const snapshot = JSON.stringify(app.presentation);
    if (snapshot === app.lastSnapshot) {
        return;
    }
    app.history = app.history.slice(0, app.historyIndex + 1);
    app.history.push(JSON.parse(snapshot));
    app.historyIndex++;
    app.lastSnapshot = snapshot;

    if (app.history.length > HISTORY_LIMIT) {
        app.history.shift();
        app.historyIndex = Math.max(0, app.historyIndex - 1);
    }
}

function undo() {
    if (app.historyIndex > 0) {
        app.historyIndex--;
        app.presentation = JSON.parse(JSON.stringify(app.history[app.historyIndex]));
        app.lastSnapshot = JSON.stringify(app.presentation);
        renderSlides();
        renderCurrentSlide();
        syncBackgroundControls();
        savePresentation();
    }
}

function redo() {
    if (app.historyIndex < app.history.length - 1) {
        app.historyIndex++;
        app.presentation = JSON.parse(JSON.stringify(app.history[app.historyIndex]));
        app.lastSnapshot = JSON.stringify(app.presentation);
        renderSlides();
        renderCurrentSlide();
        syncBackgroundControls();
        savePresentation();
    }
}

// ======================== SLIDES MANAGEMENT ========================
function addSlide() {
    const newSlide = {
        background: '#ffffff',
        elements: [
            { type: 'text', x: 50, y: 50, width: 860, height: 100, text: 'Title', font: 'Arial', size: 54, color: '#000000', bold: true, italic: false, underline: false },
            { type: 'text', x: 50, y: 170, width: 860, height: 300, text: 'Click to add content', font: 'Arial', size: 32, color: '#666666', bold: false, italic: false, underline: false }
        ]
    };
    app.presentation.slides.push(newSlide);
    app.currentSlideIndex = app.presentation.slides.length - 1;
    commitChange();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
}

function deleteSlide() {
    if (app.presentation.slides.length <= 1) {
    commitChange();
        return;
    }
    app.presentation.slides.splice(app.currentSlideIndex, 1);
    if (app.currentSlideIndex >= app.presentation.slides.length) {
        app.currentSlideIndex = app.presentation.slides.length - 1;
    }
    app.selectedElement = null;
    commitChange();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
}

function duplicateSlide() {
    const current = app.presentation.slides[app.currentSlideIndex];
    const duplicate = JSON.parse(JSON.stringify(current));
    app.presentation.slides.splice(app.currentSlideIndex + 1, 0, duplicate);
    app.currentSlideIndex++;
    commitChange();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
}

function renderSlides() {
    const container = document.getElementById('slidesContainer');
    container.innerHTML = '';

    app.presentation.slides.forEach((slide, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'slide-thumbnail' + (index === app.currentSlideIndex ? ' active' : '');
        thumbnail.draggable = true;

        // Render thumbnail canvas
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');

        // Draw background
        const bg = slide.background || '#ffffff';
        if (bg.includes('gradient')) {
            const colors = bg.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
            if (bg.includes('radial')) {
                const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height));
                grad.addColorStop(0, colors[0]);
                grad.addColorStop(1, colors[1]);
                ctx.fillStyle = grad;
            } else {
                const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                grad.addColorStop(0, colors[0]);
                grad.addColorStop(1, colors[1]);
                ctx.fillStyle = grad;
            }
        } else {
            ctx.fillStyle = bg;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text (simplified)
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(`Slide ${index + 1}`, 10, 20);

        const canvasImg = canvas.toDataURL();
        thumbnail.innerHTML = `<img src="${canvasImg}" class="slide-thumbnail-canvas"><div class="slide-number-badge">${index + 1}</div>`;

        thumbnail.addEventListener('click', () => selectSlide(index));
        thumbnail.addEventListener('dragstart', (e) => handleDragStart(e, index));
        thumbnail.addEventListener('dragover', (e) => e.preventDefault());
        thumbnail.addEventListener('drop', (e) => handleDrop(e, index));

        container.appendChild(thumbnail);
    });

    renderCurrentSlide();
}

function selectSlide(index) {
    app.currentSlideIndex = index;
    app.selectedElement = null;
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
    updateElementProperties();
}

function updateSlideCounter() {
    const counter = document.getElementById('slideCounter');
    counter.textContent = `Slide ${app.currentSlideIndex + 1} of ${app.presentation.slides.length}`;
}

// ======================== DRAG AND DROP SLIDES ========================
let draggedSlideIndex = -1;

function handleDragStart(e, index) {
    draggedSlideIndex = index;
}

function handleDrop(e, targetIndex) {
    e.preventDefault();
    if (draggedSlideIndex !== -1 && draggedSlideIndex !== targetIndex) {
        const slides = app.presentation.slides;
        const draggedSlide = slides[draggedSlideIndex];
        slides.splice(draggedSlideIndex, 1);
        if (targetIndex > draggedSlideIndex) {
            slides.splice(targetIndex - 1, 0, draggedSlide);
            app.currentSlideIndex = targetIndex - 1;
        } else {
            slides.splice(targetIndex, 0, draggedSlide);
            app.currentSlideIndex = targetIndex;
        }
        commitChange();
        renderSlides();
    }
}

// ======================== CANVAS RENDERING ========================
function renderCurrentSlide() {
    const canvas = document.getElementById('slideCanvas');
    const ctx = canvas.getContext('2d');
    const slide = app.presentation.slides[app.currentSlideIndex];

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background
    const bg = slide.background || '#ffffff';
    if (bg.includes('gradient')) {
        const colors = bg.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
        if (bg.includes('linear')) {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height));
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);
            ctx.fillStyle = grad;
        }
    } else {
        ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    slide.elements.forEach((elem, index) => {
        const isSelected = index === app.selectedElement;
        if (elem.type === 'text') {
            drawTextElement(ctx, elem, isSelected);
        } else if (elem.type === 'image') {
            drawImageElement(ctx, elem, isSelected);
        }
    });

    if (app.selectedElement !== null) {
        const selected = slide.elements[app.selectedElement];
        drawSelectionHandles(ctx, selected);
    }
}

function drawTextElement(ctx, elem, isSelected) {
    ctx.save();
    
    // Apply text style
    let fontStyle = '';
    if (elem.italic) fontStyle += 'italic ';
    if (elem.bold) fontStyle += 'bold ';
    ctx.font = `${fontStyle}${elem.size}px ${elem.font}`;
    ctx.fillStyle = elem.color;
    ctx.textBaseline = 'top';

    // Draw text with word wrap
    const lines = wrapText(ctx, elem.text, elem.width - 16);
    let y = elem.y + 8;
    lines.forEach(line => {
        ctx.fillText(line, elem.x + 8, y);
        if (elem.underline) {
            const textWidth = ctx.measureText(line).width;
            const underlineY = y + elem.size + 2;
            ctx.strokeStyle = elem.color;
            ctx.lineWidth = Math.max(1, Math.round(elem.size / 14));
            ctx.beginPath();
            ctx.moveTo(elem.x + 8, underlineY);
            ctx.lineTo(elem.x + 8 + textWidth, underlineY);
            ctx.stroke();
        }
        y += elem.size * 1.2;
    });

    // Draw selection border
    if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
        ctx.setLineDash([]);
    }

    // Draw border
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);

    ctx.restore();
}

function drawImageElement(ctx, elem) {
    if (!elem.src) {
        return;
    }

    let img = app.imageCache[elem.src];
    if (!img) {
        img = new Image();
        img.onload = () => renderCurrentSlide();
        img.src = elem.src;
        app.imageCache[elem.src] = img;
    }

    if (img.complete) {
        ctx.drawImage(img, elem.x, elem.y, elem.width, elem.height);
    }
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxWidth) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
}

function drawSelectionHandles(ctx, elem) {
    const half = HANDLE_SIZE / 2;
    const handles = [
        { x: elem.x, y: elem.y },
        { x: elem.x + elem.width, y: elem.y },
        { x: elem.x, y: elem.y + elem.height },
        { x: elem.x + elem.width, y: elem.y + elem.height }
    ];

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    handles.forEach(handle => {
        ctx.fillRect(handle.x - half, handle.y - half, HANDLE_SIZE, HANDLE_SIZE);
        ctx.strokeRect(handle.x - half, handle.y - half, HANDLE_SIZE, HANDLE_SIZE);
    });
    ctx.restore();
}

function getHandleAtPoint(elem, x, y) {
    const half = HANDLE_SIZE / 2;
    const handles = [
        { name: 'nw', x: elem.x, y: elem.y },
        { name: 'ne', x: elem.x + elem.width, y: elem.y },
        { name: 'sw', x: elem.x, y: elem.y + elem.height },
        { name: 'se', x: elem.x + elem.width, y: elem.y + elem.height }
    ];

    const match = handles.find(handle => (
        x >= handle.x - half && x <= handle.x + half &&
        y >= handle.y - half && y <= handle.y + half
    ));

    return match ? match.name : null;
}

function getCanvasPoint(e) {
    const canvas = document.getElementById('slideCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// ======================== ELEMENT EDITING ========================
function addTextBox() {
    const slide = app.presentation.slides[app.currentSlideIndex];
    const newText = {
        type: 'text',
        x: 100,
        y: 150,
        width: 400,
        height: 120,
        text: 'Click to edit text',
        font: 'Arial',
        size: 24,
        color: '#000000',
        bold: false,
        italic: false,
        underline: false
    };
    slide.elements.push(newText);
    app.selectedElement = slide.elements.length - 1;
    commitChange();
    renderCurrentSlide();
    updateElementProperties();
}

function addImage() {
    document.getElementById('imageFile').click();
}

function deleteElement() {
    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        slide.elements.splice(app.selectedElement, 1);
        app.selectedElement = null;
        commitChange();
        renderCurrentSlide();
        updateElementProperties();
    }
}

function bringForward() {
    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        if (app.selectedElement < slide.elements.length - 1) {
            const temp = slide.elements[app.selectedElement];
            slide.elements[app.selectedElement] = slide.elements[app.selectedElement + 1];
            slide.elements[app.selectedElement + 1] = temp;
            app.selectedElement++;
            commitChange();
            renderCurrentSlide();
        }
    }
}

function sendBackward() {
    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        if (app.selectedElement > 0) {
            const temp = slide.elements[app.selectedElement];
            slide.elements[app.selectedElement] = slide.elements[app.selectedElement - 1];
            slide.elements[app.selectedElement - 1] = temp;
            app.selectedElement--;
            commitChange();
            renderCurrentSlide();
        }
    }
}

// ======================== CANVAS INTERACTIONS ========================
function setupCanvasListeners() {
    const canvas = document.getElementById('slideCanvas');

    canvas.addEventListener('click', (e) => handleCanvasClick(e));
    canvas.addEventListener('mousedown', (e) => handleCanvasMouseDown(e));
    canvas.addEventListener('mousemove', (e) => handleCanvasMouseMove(e));
    canvas.addEventListener('mouseup', (e) => handleCanvasMouseUp(e));
}

function handleCanvasClick(e) {
    const { x, y } = getCanvasPoint(e);

    const slide = app.presentation.slides[app.currentSlideIndex];
    let selectedIndex = null;

    for (let i = slide.elements.length - 1; i >= 0; i--) {
        const elem = slide.elements[i];
        if (x >= elem.x && x <= elem.x + elem.width &&
            y >= elem.y && y <= elem.y + elem.height) {
            selectedIndex = i;
            break;
        }
    }

    app.selectedElement = selectedIndex;
    updateElementProperties();
    renderCurrentSlide();
}

function handleCanvasMouseDown(e) {
    if (app.selectedElement === null) {
        return;
    }

    const slide = app.presentation.slides[app.currentSlideIndex];
    const elem = slide.elements[app.selectedElement];
    const point = getCanvasPoint(e);
    const handle = getHandleAtPoint(elem, point.x, point.y);

    if (handle) {
        app.isResizing = true;
        app.resizeHandle = handle;
        app.resizeStart = {
            x: elem.x,
            y: elem.y,
            width: elem.width,
            height: elem.height,
            pointerX: point.x,
            pointerY: point.y
        };
        return;
    }

    const isInside = point.x >= elem.x && point.x <= elem.x + elem.width &&
        point.y >= elem.y && point.y <= elem.y + elem.height;
    if (!isInside) {
        return;
    }

    app.dragStartX = point.x;
    app.dragStartY = point.y;
    app.isDragging = true;
}

function handleCanvasMouseMove(e) {
    if (app.selectedElement === null) {
        return;
    }

    const slide = app.presentation.slides[app.currentSlideIndex];
    const elem = slide.elements[app.selectedElement];
    const point = getCanvasPoint(e);

    if (app.isResizing && app.resizeStart) {
        const start = app.resizeStart;
        const dx = point.x - start.pointerX;
        const dy = point.y - start.pointerY;

        let newX = start.x;
        let newY = start.y;
        let newWidth = start.width;
        let newHeight = start.height;

        if (app.resizeHandle === 'se') {
            newWidth = start.width + dx;
            newHeight = start.height + dy;
        } else if (app.resizeHandle === 'sw') {
            newX = start.x + dx;
            newWidth = start.width - dx;
            newHeight = start.height + dy;
        } else if (app.resizeHandle === 'ne') {
            newY = start.y + dy;
            newWidth = start.width + dx;
            newHeight = start.height - dy;
        } else if (app.resizeHandle === 'nw') {
            newX = start.x + dx;
            newY = start.y + dy;
            newWidth = start.width - dx;
            newHeight = start.height - dy;
        }

        const minWidth = elem.type === 'text' ? 120 : 40;
        const minHeight = elem.type === 'text' ? 40 : 40;

        if (newWidth < minWidth) {
            newWidth = minWidth;
            if (app.resizeHandle === 'sw' || app.resizeHandle === 'nw') {
                newX = start.x + (start.width - minWidth);
            }
        }

        if (newHeight < minHeight) {
            newHeight = minHeight;
            if (app.resizeHandle === 'ne' || app.resizeHandle === 'nw') {
                newY = start.y + (start.height - minHeight);
            }
        }

        elem.x = newX;
        elem.y = newY;
        elem.width = newWidth;
        elem.height = newHeight;

        renderCurrentSlide();
        return;
    }

    if (app.isDragging) {
        const dx = point.x - app.dragStartX;
        const dy = point.y - app.dragStartY;

        elem.x += dx;
        elem.y += dy;

        app.dragStartX = point.x;
        app.dragStartY = point.y;

        renderCurrentSlide();
    }
}

function handleCanvasMouseUp(e) {
    const hadChange = app.isDragging || app.isResizing;
    app.isDragging = false;
    app.isResizing = false;
    app.resizeHandle = null;
    app.resizeStart = null;

    if (hadChange) {
        commitChange();
    }
}

// ======================== PROPERTIES PANEL ========================
function updateElementProperties() {
    const propertiesDiv = document.getElementById('elementProperties');
    const textContent = document.getElementById('textContent');
    
    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        const elem = slide.elements[app.selectedElement];

        if (elem.type === 'text') {
            propertiesDiv.style.display = 'block';
            textContent.value = elem.text;
            document.getElementById('fontFamily').value = elem.font;
            document.getElementById('fontSize').value = elem.size;
            document.getElementById('textColor').value = elem.color;
            document.getElementById('boldCheckbox').checked = elem.bold;
            document.getElementById('italicCheckbox').checked = elem.italic;
            document.getElementById('underlineCheckbox').checked = elem.underline;
        } else {
            propertiesDiv.style.display = 'none';
        }
    } else {
        propertiesDiv.style.display = 'none';
        textContent.value = '';
    }
}

function updateSlideBackground() {
    const slide = app.presentation.slides[app.currentSlideIndex];
    const gradientType = document.getElementById('gradientType').value;
    const bgColor = document.getElementById('bgColor').value;
    const gradColor1 = document.getElementById('gradientColor1').value;
    const gradColor2 = document.getElementById('gradientColor2').value;

    if (gradientType === 'none') {
        slide.background = bgColor;
    } else if (gradientType === 'linear') {
        slide.background = `linear-gradient(135deg, ${gradColor1} 0%, ${gradColor2} 100%)`;
    } else {
        slide.background = `radial-gradient(circle, ${gradColor1} 0%, ${gradColor2} 100%)`;
    }

    commitChange();
    renderSlides();
}

function syncBackgroundControls() {
    const slide = app.presentation.slides[app.currentSlideIndex];
    const gradientType = document.getElementById('gradientType');
    const bgColor = document.getElementById('bgColor');
    const gradColor1 = document.getElementById('gradientColor1');
    const gradColor2 = document.getElementById('gradientColor2');

    const bg = slide.background || '#ffffff';
    if (bg.includes('linear-gradient')) {
        const colors = bg.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
        gradientType.value = 'linear';
        gradColor1.value = colors[0];
        gradColor2.value = colors[1];
    } else if (bg.includes('radial-gradient')) {
        const colors = bg.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
        gradientType.value = 'radial';
        gradColor1.value = colors[0];
        gradColor2.value = colors[1];
    } else {
        gradientType.value = 'none';
        bgColor.value = bg;
    }
}

// ======================== TEMPLATES ========================
function showTemplates() {
    const modal = document.getElementById('templateModal');
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = '';

    TEMPLATES.forEach((template, index) => {
        const item = document.createElement('div');
        item.className = 'template-item';
        item.textContent = template.name;
        item.onclick = () => applyTemplate(index);
        grid.appendChild(item);
    });

    modal.classList.add('active');
}

function applyTemplate(templateIndex) {
    const template = TEMPLATES[templateIndex];
    app.presentation.slides = JSON.parse(JSON.stringify(template.slides));
    app.currentSlideIndex = 0;
    app.selectedElement = null;
    commitChange();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
    closeModal('templateModal');
}

// ======================== EXPORT ========================
function exportPptx() {
    if (typeof PptxGenJS === 'undefined') {
        alert('PptxGenJS is not available. Please refresh the page.');
        return;
    }

    const name = prompt('Enter presentation name:', 'My Presentation');
    if (!name) return;

    const pres = new PptxGenJS();
    pres.defineLayout({ name: 'LAYOUT1', width: 10, height: 5.625 });

    app.presentation.slides.forEach(slide => {
        const layout = pres.addSlide('LAYOUT1');

        // Background
        if (slide.background.includes('gradient')) {
            const colors = slide.background.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
            layout.background = { fill: colors[0] };
        } else {
            layout.background = { fill: slide.background };
        }

        // Elements
        slide.elements.forEach(elem => {
            if (elem.type === 'text') {
                layout.addText(elem.text, {
                    x: elem.x / 96,
                    y: elem.y / 96,
                    w: elem.width / 96,
                    h: elem.height / 96,
                    fontSize: elem.size,
                    fontFace: elem.font,
                    color: elem.color.replace('#', ''),
                    bold: elem.bold,
                    italic: elem.italic,
                    underline: elem.underline,
                    align: 'left',
                    valign: 'top'
                });
            } else if (elem.type === 'image' && elem.src) {
                layout.addImage({
                    data: elem.src,
                    x: elem.x / 96,
                    y: elem.y / 96,
                    w: elem.width / 96,
                    h: elem.height / 96
                });
            }
        });
    });

    pres.save({ fileName: name + '.pptx' });
}

async function exportPdf() {
    if (typeof html2canvas === 'undefined' || !window.jspdf) {
        alert('PDF export libraries are not available. Please refresh the page.');
        return;
    }

    const name = prompt('Enter presentation name:', 'My Presentation');
    if (!name) return;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [254, 143]
    });

    for (let i = 0; i < app.presentation.slides.length; i++) {
        const slide = app.presentation.slides[i];
        if (i > 0) {
            pdf.addPage();
        }

        const slideNode = buildExportSlide(slide);
        document.body.appendChild(slideNode);
        const canvas = await html2canvas(slideNode, { backgroundColor: null, scale: 2 });
        document.body.removeChild(slideNode);

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 254, 143);
    }

    pdf.save(name + '.pdf');
}

function buildExportSlide(slide) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '960px';
    container.style.height = '540px';
    container.style.backgroundColor = '#ffffff';
    container.style.overflow = 'hidden';

    const bg = slide.background || '#ffffff';
    if (bg.includes('gradient')) {
        container.style.backgroundImage = bg;
    } else {
        container.style.backgroundColor = bg;
    }

    slide.elements.forEach(elem => {
        if (elem.type === 'text') {
            const textEl = document.createElement('div');
            textEl.textContent = elem.text;
            textEl.style.position = 'absolute';
            textEl.style.left = `${elem.x}px`;
            textEl.style.top = `${elem.y}px`;
            textEl.style.width = `${elem.width}px`;
            textEl.style.height = `${elem.height}px`;
            textEl.style.fontFamily = elem.font;
            textEl.style.fontSize = `${elem.size}px`;
            textEl.style.color = elem.color;
            textEl.style.fontWeight = elem.bold ? '700' : '400';
            textEl.style.fontStyle = elem.italic ? 'italic' : 'normal';
            textEl.style.textDecoration = elem.underline ? 'underline' : 'none';
            textEl.style.whiteSpace = 'pre-wrap';
            textEl.style.lineHeight = '1.2';
            textEl.style.overflow = 'hidden';
            container.appendChild(textEl);
        }

        if (elem.type === 'image' && elem.src) {
            const img = document.createElement('img');
            img.src = elem.src;
            img.style.position = 'absolute';
            img.style.left = `${elem.x}px`;
            img.style.top = `${elem.y}px`;
            img.style.width = `${elem.width}px`;
            img.style.height = `${elem.height}px`;
            img.style.objectFit = 'contain';
            container.appendChild(img);
        }
    });

    return container;
}

// ======================== MODALS ========================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ======================== EVENT LISTENERS ========================
function setupEventListeners() {
    // Slide buttons
    document.getElementById('addSlideBtn').addEventListener('click', addSlide);
    document.getElementById('deleteSlideBtn').addEventListener('click', deleteSlide);
    document.getElementById('duplicateSlideBtn').addEventListener('click', duplicateSlide);

    // Edit buttons
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);

    // Element buttons
    document.getElementById('addTextBtn').addEventListener('click', addTextBox);
    document.getElementById('addImageBtn').addEventListener('click', addImage);
    document.getElementById('templateBtn').addEventListener('click', showTemplates);
    document.getElementById('deleteElementBtn').addEventListener('click', deleteElement);
    document.getElementById('bringForwardBtn').addEventListener('click', bringForward);
    document.getElementById('sendBackwardBtn').addEventListener('click', sendBackward);

    // Export buttons
    document.getElementById('exportPptxBtn').addEventListener('click', exportPptx);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);

    // Properties
    document.getElementById('bgColor').addEventListener('change', updateSlideBackground);
    document.getElementById('gradientType').addEventListener('change', updateSlideBackground);
    document.getElementById('gradientColor1').addEventListener('change', updateSlideBackground);
    document.getElementById('gradientColor2').addEventListener('change', updateSlideBackground);

    // Text properties
    document.getElementById('textContent').addEventListener('input', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            const elem = slide.elements[app.selectedElement];
            if (elem.type === 'text') {
                elem.text = document.getElementById('textContent').value;
                commitChange();
                renderCurrentSlide();
            }
        }
    });

    document.getElementById('fontFamily').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].font = document.getElementById('fontFamily').value;
            commitChange();
            renderCurrentSlide();
        }
    });

    document.getElementById('fontSize').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].size = parseInt(document.getElementById('fontSize').value);
            commitChange();
            renderCurrentSlide();
        }
    });

    document.getElementById('textColor').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].color = document.getElementById('textColor').value;
            commitChange();
            renderCurrentSlide();
        }
    });

    document.getElementById('boldCheckbox').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].bold = document.getElementById('boldCheckbox').checked;
            commitChange();
            renderCurrentSlide();
        }
    });

    document.getElementById('italicCheckbox').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].italic = document.getElementById('italicCheckbox').checked;
            commitChange();
            renderCurrentSlide();
        }
    });

    document.getElementById('underlineCheckbox').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].underline = document.getElementById('underlineCheckbox').checked;
            commitChange();
            renderCurrentSlide();
        }
    });

    // Image upload
    document.getElementById('imageFile').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const slide = app.presentation.slides[app.currentSlideIndex];
                const newImage = {
                    type: 'image',
                    x: 100,
                    y: 100,
                    width: 300,
                    height: 300,
                    src: event.target.result
                };
                slide.elements.push(newImage);
                app.selectedElement = slide.elements.length - 1;
                commitChange();
                renderCurrentSlide();
                updateElementProperties();
            };
            reader.readAsDataURL(file);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        if (e.key === 'Delete' && app.selectedElement !== null) {
            deleteElement();
        }
    });

    setupCanvasListeners();
}

// ======================== STARTUP ========================
document.addEventListener('DOMContentLoaded', init);

// Auto-save every 30 seconds
setInterval(() => {
    savePresentation();
}, 30000);
