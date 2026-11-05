/**
 * Online Presentation Maker
 * Pure HTML, CSS, JavaScript - No backend, Processing details
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
    imageCache: {},
    inlineEditor: null,
    inlineEditIndex: null,
    pendingExportType: null,
    isPresenting: false
};

const HISTORY_LIMIT = 100;
const HANDLE_SIZE = 8;
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
const PPTX_LAYOUT = { width: 10, height: 5.625 };

const SYSTEM_FONTS = new Set([
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Trebuchet MS',
    'Verdana',
    'Comic Sans MS'
]);
const GOOGLE_FONTS = new Set([
    'Inter',
    'Poppins',
    'Roboto',
    'Open Sans',
    'Playfair Display',
    'Merriweather',
    'Montserrat',
    'Raleway',
    'Quicksand'
]);
const LOADED_FONTS = new Set();

function normalizeHexColor(color, fallback = 'FFFFFF') {
    if (!color || typeof color !== 'string') {
        return fallback;
    }
    const hex = color.trim().replace('#', '').toUpperCase();
    if (/^[0-9A-F]{6}$/.test(hex)) {
        return hex;
    }
    return fallback;
}

function buildGoogleFontUrl(fontFamily) {
    const family = encodeURIComponent(fontFamily).replace(/%20/g, '+');
    return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}

function ensureFontLoaded(fontFamily) {
    if (!fontFamily || SYSTEM_FONTS.has(fontFamily)) {
        return Promise.resolve();
    }
    if (!GOOGLE_FONTS.has(fontFamily)) {
        return Promise.resolve();
    }
    if (LOADED_FONTS.has(fontFamily)) {
        return Promise.resolve();
    }

    LOADED_FONTS.add(fontFamily);
    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = buildGoogleFontUrl(fontFamily);
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
    });
}

async function ensureFontsForSlides(slides) {
    if (!Array.isArray(slides)) {
        return;
    }
    const fonts = new Set();
    slides.forEach((slide) => {
        (slide.elements || []).forEach((elem) => {
            if (elem.type === 'text' && elem.font) {
                fonts.add(elem.font);
            }
        });
    });
    await Promise.all(Array.from(fonts).map((font) => ensureFontLoaded(font)));
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }
}

async function ensureFontsForPresentation() {
    await ensureFontsForSlides(app.presentation ? app.presentation.slides : []);
}

function parseGradient(background) {
    const colors = background.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
    const isRadial = background.includes('radial');
    let angle = 135;
    const angleMatch = background.match(/(-?\d+\.?\d*)deg/);
    if (angleMatch) {
        angle = parseFloat(angleMatch[1]);
    }
    return { colors, isRadial, angle };
}

function createCanvasGradient(ctx, background, width, height) {
    const { colors, isRadial, angle } = parseGradient(background);
    if (isRadial) {
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
        return grad;
    }

    const radians = ((angle - 90) * Math.PI) / 180;
    const x = Math.cos(radians);
    const y = Math.sin(radians);
    const startX = width / 2 - x * (width / 2);
    const startY = height / 2 - y * (height / 2);
    const endX = width / 2 + x * (width / 2);
    const endY = height / 2 + y * (height / 2);
    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    return grad;
}

function drawSlideBackground(ctx, background, width, height) {
    const bg = background || '#ffffff';
    if (bg.includes('gradient')) {
        ctx.fillStyle = createCanvasGradient(ctx, bg, width, height);
    } else {
        ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, width, height);
}

function scaleElement(elem, scale) {
    return {
        ...elem,
        x: elem.x * scale,
        y: elem.y * scale,
        width: elem.width * scale,
        height: elem.height * scale,
        size: elem.size ? elem.size * scale : elem.size
    };
}

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

function normalizeElement(elem) {
    if (!elem || typeof elem !== 'object') {
        return;
    }
    if (elem.type === 'text') {
        elem.text = typeof elem.text === 'string' ? elem.text : '';
        elem.font = elem.font || 'Arial';
        elem.size = Number.isFinite(elem.size) ? elem.size : 24;
        elem.color = elem.color || '#000000';
        elem.bold = typeof elem.bold === 'boolean' ? elem.bold : false;
        elem.italic = typeof elem.italic === 'boolean' ? elem.italic : false;
        elem.underline = typeof elem.underline === 'boolean' ? elem.underline : false;
        elem.align = elem.align || 'left';
    }
    if (elem.type === 'image') {
        elem.x = Number.isFinite(elem.x) ? elem.x : 100;
        elem.y = Number.isFinite(elem.y) ? elem.y : 100;
        elem.width = Number.isFinite(elem.width) ? elem.width : 300;
        elem.height = Number.isFinite(elem.height) ? elem.height : 200;
    }
}

function normalizePresentation(presentation) {
    if (!presentation || !Array.isArray(presentation.slides)) {
        return;
    }
    presentation.slides.forEach((slide) => {
        slide.background = slide.background || '#ffffff';
        if (!Array.isArray(slide.elements)) {
            slide.elements = [];
        }
        slide.elements.forEach(normalizeElement);
    });
}

// ======================== INITIALIZATION ========================
function init() {
    loadPresentation();
    saveHistory();
    setupEventListeners();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
    updateUndoRedoButtons();
    ensureFontsForPresentation();
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
                        { type: 'text', x: 50, y: 50, width: 860, height: 100, text: 'Title', font: 'Arial', size: 54, color: '#000000', bold: true, italic: false, underline: false, align: 'left' },
                        { type: 'text', x: 50, y: 170, width: 860, height: 300, text: 'Subtitle', font: 'Arial', size: 32, color: '#666666', bold: false, italic: false, underline: false, align: 'left' }
                    ]
                }
            ]
        };
    }
    normalizePresentation(app.presentation);
    app.currentSlideIndex = 0;
}

function savePresentation() {
    localStorage.setItem('presentation-maker-data', JSON.stringify(app.presentation));
}

function commitChange() {
    if (app.inlineEditor) {
        return;
    }
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

    updateUndoRedoButtons();
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
    updateUndoRedoButtons();
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
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (!undoBtn || !redoBtn) {
        return;
    }
    undoBtn.disabled = app.historyIndex <= 0;
    redoBtn.disabled = app.historyIndex >= app.history.length - 1;
}

// ======================== SLIDES MANAGEMENT ========================
function addSlide() {
    const newSlide = {
        background: '#ffffff',
        elements: [
            { type: 'text', x: 50, y: 50, width: 860, height: 100, text: 'Title', font: 'Arial', size: 54, color: '#000000', bold: true, italic: false, underline: false, align: 'left' },
            { type: 'text', x: 50, y: 170, width: 860, height: 300, text: 'Click to add content', font: 'Arial', size: 32, color: '#666666', bold: false, italic: false, underline: false, align: 'left' }
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
        alert('Cannot delete the last slide');
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
        drawSlideBackground(ctx, slide.background, canvas.width, canvas.height);

        // Draw elements
        const scale = canvas.width / SLIDE_WIDTH;
        slide.elements.forEach((elem) => {
            const scaledElem = scaleElement(elem, scale);
            if (elem.type === 'text') {
                drawTextElement(ctx, scaledElem, false, { showBorder: false });
            } else if (elem.type === 'image') {
                drawImageElement(ctx, scaledElem, { onLoad: renderSlides });
            }
        });

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

// ======================== FAST DECK THEMES & STARTER PACKS ========================
const DECK_THEMES = {
    indigo: {
        name: 'Midnight Indigo',
        coverBg: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
        slideBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        accentColor: '#818cf8',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        mutedColor: '#94a3b8',
        headingFont: 'Poppins',
        bodyFont: 'Inter'
    },
    clean: {
        name: 'Academic Light',
        coverBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        slideBg: '#ffffff',
        accentColor: '#2563eb',
        titleColor: '#0f172a',
        bodyColor: '#334155',
        mutedColor: '#64748b',
        headingFont: 'Poppins',
        bodyFont: 'Inter'
    },
    obsidian: {
        name: 'Obsidian Gold',
        coverBg: 'linear-gradient(135deg, #0b0c10 0%, #1f2937 100%)',
        slideBg: '#111827',
        accentColor: '#d4af37',
        titleColor: '#f8fafc',
        bodyColor: '#e5e7eb',
        mutedColor: '#9ca3af',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter'
    },
    emerald: {
        name: 'Emerald Tech',
        coverBg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        slideBg: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
        accentColor: '#34d399',
        titleColor: '#ecfdf5',
        bodyColor: '#d1fae5',
        mutedColor: '#6ee7b7',
        headingFont: 'Montserrat',
        bodyFont: 'Inter'
    },
    executive: {
        name: 'Executive Slate',
        coverBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        slideBg: '#0f172a',
        accentColor: '#38bdf8',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        mutedColor: '#94a3b8',
        headingFont: 'Montserrat',
        bodyFont: 'Inter'
    },
    crimson: {
        name: 'Sunset Warmth',
        coverBg: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
        slideBg: 'linear-gradient(135deg, #431407 0%, #7c2d12 100%)',
        accentColor: '#fdba74',
        titleColor: '#fff7ed',
        bodyColor: '#ffedd5',
        mutedColor: '#fdba74',
        headingFont: 'Poppins',
        bodyFont: 'Inter'
    }
};

const SAMPLE_SEMINAR_OUTLINE = `# Database Management Systems (DBMS)
Architecture, Normalization & Transaction Concurrency

# Why DBMS Over File Systems?
Eliminates redundant data storage across departments
Enforces ACID properties for concurrent multi-user access
Centralized security, role-based access, and automated backup recovery
Declarative SQL querying with cost-based query optimization

# Three-Schema ANSI/SPARC Architecture
External Level: Custom user views and restricted API projections
Conceptual Level: Logical entities, attributes, and foreign key relationships
Physical Level: B+ Tree index structures, data pages, and disk blocks
Data Independence: Modify physical storage without breaking application queries

# Normalization & Schema Quality
1NF: Ensure atomic attribute values and eliminate repeating groups
2NF: Remove partial dependencies on composite primary keys
3NF: Eliminate transitive dependencies between non-prime attributes
BCNF: Every functional dependency determinant must be a superkey

# Concurrency Control & Indexing
Two-Phase Locking (2PL) guarantees conflict-serializable schedules
MVCC enables non-blocking reads with snapshot isolation
B+ Trees provide O(log N) range scans and equality lookups
Write-Ahead Logging (WAL) ensures durability after system crash`;

const STARTER_DECKS = [
    {
        name: '🎓 College Seminar / Project Defense (5 Slides)',
        meta: 'Complete 5-slide academic deck: Title, Problem, Architecture, Results & Conclusion',
        theme: 'indigo',
        outline: `# Final Year Project & Seminar Title
Presented by Student Name | Department of Computer Science

# Problem Statement & Motivation
Existing manual workflows suffer from high latency and human error
Lack of real-time analytics prevents proactive decision making
Need a privacy-first, scalable architecture with zero vendor lock-in

# Proposed System Architecture
Client Layer: Responsive Web Interface with local client-side processing
Core Engine: Modular pipeline for validation, indexing, and transformation
Storage & Export: Instant PPTX, PDF, and structured document output

# Experimental Results & Performance
3.8x faster document processing compared to legacy baseline tools
99.4% accuracy across 500+ real-world academic and business test cases
Zero server-side data retention for complete user privacy

# Conclusion & Future Scope
Delivered a fast, accessible platform ready for production deployment
Future work: Collaborative real-time annotations and offline PWA sync
Questions & Discussion — Thank You!`
    },
    {
        name: '🚀 Startup / Product Pitch Deck (5 Slides)',
        meta: 'Complete 5-slide investor pitch: Vision, Problem, Solution, Traction & Roadmap',
        theme: 'obsidian',
        outline: `# Next-Gen Workspace Platform
Building 10x Faster Document & Presentation Workflows

# The Problem We Solve
Professionals waste 4+ hours every week formatting repetitive slides
Legacy desktop software is bloated, expensive, and slow to start
Teams need instant outline-to-deck generation without complex setup

# Our Solution & Product Magic
Paste raw notes or bullet points to generate a styled deck in 2 seconds
1-Click global themes and structured layouts for instant visual polish
Direct browser export to PowerPoint (.pptx) and high-DPI PDF

# Market Traction & Key Metrics
42,000+ active monthly students, educators, and founders
89% completion rate from initial outline to exported presentation
Zero customer acquisition cost driven by organic search and referrals

# Business Model & 12-Month Roadmap
Q1-Q2: Core document suite & study materials marketplace
Q3: Team brand kits, custom fonts, and collaborative slide libraries
Q4: Enterprise workspace licensing and API integrations`
    },
    {
        name: '📘 Academic Lecture / Study Module (5 Slides)',
        meta: 'Complete 5-slide teaching deck: Overview, Core Concepts, Comparison, Example & Summary',
        theme: 'clean',
        outline: `# Operating Systems: Process Scheduling
Module 3 Lecture Notes & Exam Revision Guide

# Core Concepts & Scheduling Criteria
CPU Utilization: Keep the processor as busy as possible (40% to 90%)
Throughput: Number of processes completed per unit of time
Turnaround Time: Total time from submission to completion
Waiting & Response Time: Time spent in ready queue before first CPU burst

# Preemptive vs Non-Preemptive Algorithms
FCFS (First-Come, First-Served): Simple FIFO queue; suffers from Convoy Effect
SJF / SRTF: Optimal minimum average waiting time; requires burst prediction
Round Robin (RR): Time-quantum preemption ideal for interactive time-sharing
Multilevel Feedback Queue: Dynamically adjusts priority based on CPU burst behavior

# Worked Numerical Example
Process P1 (Burst 8ms), P2 (Burst 4ms), P3 (Burst 2ms) arriving at t = 0
SJF Execution Order: P3 (0-2ms) -> P2 (2-6ms) -> P1 (6-14ms)
Average Waiting Time = (0 + 2 + 6) / 3 = 2.67 ms (vs 6.67 ms in FCFS)

# Key Exam Takeaways
Use Round Robin for fair response time in interactive systems
Use SJF/SRTF as the theoretical benchmark for minimum waiting time
Always check arrival times carefully before constructing the Gantt chart`
    },
    {
        name: '📊 Executive Quarterly Business Review (5 Slides)',
        meta: 'Complete 5-slide corporate deck: Executive Summary, KPIs, Milestones, Risks & Next Steps',
        theme: 'executive',
        outline: `# Q3 Executive Business Review
Product, Engineering & Growth Performance Summary

# Executive Summary & Quarter Highlights
Exceeded quarterly revenue target by 18% with strong enterprise adoption
Launched v2.4 platform upgrade with 45% faster page load performance
Expanded customer retention (Net Dollar Retention at 114%)

# Key Performance Indicators (KPIs)
Monthly Active Users: 128,500 (+32% QoQ growth)
Average Session Duration: 11.4 minutes (+24% engagement lift)
Customer Support Resolution Time: Reduced from 6.2 hrs to 1.4 hrs
Infrastructure Cost per 1,000 Requests: Down 29% after caching overhaul

# Key Risks & Mitigation Plan
Enterprise security compliance audit scheduled for mid-Q4
Mitigation: Completed automated CSP, dependency, and access-control checks
Mobile conversion gap on low-bandwidth networks
Mitigation: Shipped lightweight asset bundles and instant skeleton states

# Q4 Priorities & Action Plan
Roll out 1-click workflow automation across top 5 user journeys
Scale academic and professional partner onboarding program
Achieve 99.95% uptime SLA across all regional edge nodes`
    }
];

function isDarkBackground(bg) {
    if (!bg || typeof bg !== 'string') return false;
    const hexMatch = bg.match(/#([0-9a-fA-F]{6})/);
    if (!hexMatch) return false;
    const hex = hexMatch[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.55;
}

function buildSlidesFromOutlineText(outlineText, themeKey = 'indigo') {
    const theme = DECK_THEMES[themeKey] || DECK_THEMES.indigo;
    const raw = (outlineText || '').trim();
    if (!raw) return [];

    // Split into blocks either by # headings or by blank lines
    let blocks = [];
    if (/^#\s+/m.test(raw)) {
        blocks = raw
            .split(/(?=^#\s+)/m)
            .map(b => b.trim())
            .filter(Boolean);
    } else {
        blocks = raw
            .split(/\n\s*\n+/)
            .map(b => b.trim())
            .filter(Boolean);
    }

    return blocks.map((block, index) => {
        const lines = block
            .split(/\n/)
            .map(line => line.replace(/^#\s*/, '').replace(/^[-*•]\s*/, '').trim())
            .filter(Boolean);

        const title = lines[0] || `Slide ${index + 1}`;
        const bodyLines = lines.slice(1);

        // First slide with <= 2 body lines becomes a bold Cover Slide
        if (index === 0 && bodyLines.length <= 2) {
            const subtitle = bodyLines.join(' • ') || 'Prepared with OnlinePDFPro Presentation Studio';
            return {
                id: Date.now() + index,
                background: theme.coverBg,
                elements: [
                    {
                        type: 'text',
                        x: 80,
                        y: 165,
                        width: 800,
                        height: 120,
                        text: title,
                        font: theme.headingFont,
                        size: 46,
                        color: theme.titleColor,
                        bold: true,
                        italic: false,
                        underline: false,
                        align: 'center'
                    },
                    {
                        type: 'text',
                        x: 120,
                        y: 300,
                        width: 720,
                        height: 80,
                        text: subtitle,
                        font: theme.bodyFont,
                        size: 22,
                        color: theme.bodyColor,
                        bold: false,
                        italic: false,
                        underline: false,
                        align: 'center'
                    }
                ]
            };
        }

        // Content slide with 6+ items becomes a clean Two-Column slide
        if (bodyLines.length >= 6) {
            const mid = Math.ceil(bodyLines.length / 2);
            const leftBullets = bodyLines.slice(0, mid).map(l => `• ${l}`).join('\n\n');
            const rightBullets = bodyLines.slice(mid).map(l => `• ${l}`).join('\n\n');
            return {
                id: Date.now() + index,
                background: theme.slideBg,
                elements: [
                    {
                        type: 'text',
                        x: 64,
                        y: 48,
                        width: 832,
                        height: 70,
                        text: title,
                        font: theme.headingFont,
                        size: 34,
                        color: theme.titleColor,
                        bold: true,
                        italic: false,
                        underline: false,
                        align: 'left'
                    },
                    {
                        type: 'text',
                        x: 64,
                        y: 140,
                        width: 400,
                        height: 340,
                        text: leftBullets,
                        font: theme.bodyFont,
                        size: 20,
                        color: theme.bodyColor,
                        bold: false,
                        italic: false,
                        underline: false,
                        align: 'left'
                    },
                    {
                        type: 'text',
                        x: 496,
                        y: 140,
                        width: 400,
                        height: 340,
                        text: rightBullets,
                        font: theme.bodyFont,
                        size: 20,
                        color: theme.bodyColor,
                        bold: false,
                        italic: false,
                        underline: false,
                        align: 'left'
                    }
                ]
            };
        }

        const formattedBullets = (bodyLines.length ? bodyLines : [
            'Key insight or primary takeaway for this topic',
            'Supporting evidence, architecture detail, or metric',
            'Actionable conclusion or next step'
        ]).map(l => `• ${l}`).join('\n\n');

        return {
            id: Date.now() + index,
            background: theme.slideBg,
            elements: [
                {
                    type: 'text',
                    x: 64,
                    y: 48,
                    width: 832,
                    height: 72,
                    text: title,
                    font: theme.headingFont,
                    size: 36,
                    color: theme.titleColor,
                    bold: true,
                    italic: false,
                    underline: false,
                    align: 'left'
                },
                {
                    type: 'text',
                    x: 64,
                    y: 142,
                    width: 832,
                    height: 340,
                    text: formattedBullets,
                    font: theme.bodyFont,
                    size: 22,
                    color: theme.bodyColor,
                    bold: false,
                    italic: false,
                    underline: false,
                    align: 'left'
                }
            ]
        };
    });
}

function applyDeckTheme(themeKey) {
    const theme = DECK_THEMES[themeKey];
    if (!theme) return;

    closeInlineEditor(true);
    app.presentation.slides.forEach((slide, idx) => {
        slide.background = idx === 0 ? theme.coverBg : theme.slideBg;
        slide.elements.forEach((elem, elemIdx) => {
            if (elem.type === 'text') {
                const isHeading = elem.bold || elem.size >= 30 || elemIdx === 0;
                elem.color = isHeading ? theme.titleColor : theme.bodyColor;
                elem.font = isHeading ? theme.headingFont : theme.bodyFont;
            }
        });
    });

    commitChange();
    renderSlides();
    syncBackgroundControls();
    updateElementProperties();
    ensureFontsForPresentation();
}

function addSlideWithLayout(layoutKey) {
    closeInlineEditor(true);
    const currentSlide = app.presentation.slides[app.currentSlideIndex];
    const currentBg = currentSlide ? currentSlide.background : '#ffffff';
    const dark = isDarkBackground(currentBg);
    const titleColor = dark ? '#ffffff' : '#0f172a';
    const bodyColor = dark ? '#e2e8f0' : '#334155';
    const accentColor = dark ? '#818cf8' : '#2563eb';

    let elements = [];
    if (layoutKey === 'two-col') {
        elements = [
            {
                type: 'text',
                x: 64,
                y: 48,
                width: 832,
                height: 68,
                text: 'Two-Column Comparison',
                font: 'Poppins',
                size: 34,
                color: titleColor,
                bold: true,
                italic: false,
                underline: false,
                align: 'left'
            },
            {
                type: 'text',
                x: 64,
                y: 140,
                width: 400,
                height: 330,
                text: 'Column A — Core Approach\n\n• Primary architecture & workflow\n• Fast local browser execution\n• Zero setup required',
                font: 'Inter',
                size: 20,
                color: bodyColor,
                bold: false,
                italic: false,
                underline: false,
                align: 'left'
            },
            {
                type: 'text',
                x: 496,
                y: 140,
                width: 400,
                height: 330,
                text: 'Column B — Key Advantages\n\n• 10x faster slide creation\n• Consistent typography & themes\n• Instant PPTX and PDF export',
                font: 'Inter',
                size: 20,
                color: bodyColor,
                bold: false,
                italic: false,
                underline: false,
                align: 'left'
            }
        ];
    } else if (layoutKey === 'metric') {
        elements = [
            {
                type: 'text',
                x: 80,
                y: 120,
                width: 800,
                height: 130,
                text: '10x Faster',
                font: 'Poppins',
                size: 76,
                color: accentColor,
                bold: true,
                italic: false,
                underline: false,
                align: 'center'
            },
            {
                type: 'text',
                x: 120,
                y: 275,
                width: 720,
                height: 110,
                text: 'Highlight your most important metric, benchmark result, or core takeaway here.',
                font: 'Inter',
                size: 24,
                color: titleColor,
                bold: false,
                italic: false,
                underline: false,
                align: 'center'
            }
        ];
    } else if (layoutKey === 'section') {
        elements = [
            {
                type: 'text',
                x: 80,
                y: 195,
                width: 800,
                height: 95,
                text: 'Section 02 — Deep Dive',
                font: 'Poppins',
                size: 46,
                color: titleColor,
                bold: true,
                italic: false,
                underline: false,
                align: 'center'
            },
            {
                type: 'text',
                x: 160,
                y: 300,
                width: 640,
                height: 60,
                text: 'Key architecture, implementation details, and findings',
                font: 'Inter',
                size: 20,
                color: bodyColor,
                bold: false,
                italic: false,
                underline: false,
                align: 'center'
            }
        ];
    } else {
        // Default: Title + Bullet Points
        elements = [
            {
                type: 'text',
                x: 64,
                y: 48,
                width: 832,
                height: 70,
                text: 'Slide Heading & Core Topic',
                font: 'Poppins',
                size: 36,
                color: titleColor,
                bold: true,
                italic: false,
                underline: false,
                align: 'left'
            },
            {
                type: 'text',
                x: 64,
                y: 142,
                width: 832,
                height: 330,
                text: '• First key point — click directly on this text to edit\n\n• Second supporting detail, formula, or architecture note\n\n• Third actionable takeaway or experimental result',
                font: 'Inter',
                size: 22,
                color: bodyColor,
                bold: false,
                italic: false,
                underline: false,
                align: 'left'
            }
        ];
    }

    const newSlide = {
        id: Date.now(),
        background: currentBg,
        elements
    };

    const insertIndex = app.currentSlideIndex + 1;
    app.presentation.slides.splice(insertIndex, 0, newSlide);
    app.currentSlideIndex = insertIndex;
    app.selectedElement = 0;
    commitChange();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
    updateElementProperties();
}

// ======================== CANVAS RENDERING ========================
function renderCurrentSlide() {
    const canvas = document.getElementById('slideCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slide = app.presentation.slides[app.currentSlideIndex];
    if (!slide) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSlideBackground(ctx, slide.background, canvas.width, canvas.height);

    // Draw elements (hide text of the actively edited inline element to prevent ghost double-text)
    slide.elements.forEach((elem, index) => {
        const isSelected = index === app.selectedElement;
        const isInlineEditing = Boolean(app.inlineEditor) && index === app.inlineEditIndex;
        if (elem.type === 'text') {
            drawTextElement(ctx, elem, isSelected, {
                showBorder: true,
                hideText: isInlineEditing
            });
        } else if (elem.type === 'image') {
            drawImageElement(ctx, elem, { onLoad: renderCurrentSlide });
            if (isSelected) {
                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    });

    if (app.selectedElement !== null && slide.elements[app.selectedElement]) {
        const selected = slide.elements[app.selectedElement];
        drawSelectionHandles(ctx, selected);
    }
}

function drawTextElement(ctx, elem, isSelected, options = {}) {
    ctx.save();

    const showBorder = options.showBorder !== false;
    const showSelection = options.showSelection !== false;
    const hideText = options.hideText === true;
    const align = elem.align || 'left';

    if (!hideText) {
        let fontStyle = '';
        if (elem.italic) fontStyle += 'italic ';
        if (elem.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${elem.size}px ${elem.font}`;
        ctx.fillStyle = elem.color;
        ctx.textBaseline = 'top';
        ctx.textAlign = align === 'right' ? 'right' : align === 'center' ? 'center' : 'left';

        const lines = wrapText(ctx, elem.text, elem.width - 16);
        let y = elem.y + 8;
        lines.forEach(line => {
            const textX = align === 'right'
                ? elem.x + elem.width - 8
                : align === 'center'
                    ? elem.x + elem.width / 2
                    : elem.x + 8;
            ctx.fillText(line, textX, y);
            if (elem.underline) {
                const textWidth = ctx.measureText(line).width;
                const underlineY = y + elem.size + 2;
                let underlineStart = textX;
                if (ctx.textAlign === 'center') {
                    underlineStart = textX - textWidth / 2;
                } else if (ctx.textAlign === 'right') {
                    underlineStart = textX - textWidth;
                }
                ctx.strokeStyle = elem.color;
                ctx.lineWidth = Math.max(1, Math.round(elem.size / 14));
                ctx.beginPath();
                ctx.moveTo(underlineStart, underlineY);
                ctx.lineTo(underlineStart + textWidth, underlineY);
                ctx.stroke();
            }
            y += elem.size * 1.25;
        });
    }

    // Draw selection border
    if (isSelected && showSelection) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
        ctx.setLineDash([]);
    }

    // Draw subtle frame border on canvas
    if (showBorder) {
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(elem.x, elem.y, elem.width, elem.height);
    }

    ctx.restore();
}

function drawImageElement(ctx, elem, options = {}) {
    if (!elem.src) {
        return;
    }

    let img = app.imageCache[elem.src];
    if (!img) {
        img = new Image();
        const onLoad = options.onLoad || renderCurrentSlide;
        img.onload = () => onLoad();
        img.src = elem.src;
        app.imageCache[elem.src] = img;
    }

    if (img.complete) {
        ctx.drawImage(img, elem.x, elem.y, elem.width, elem.height);
    }
}

function wrapText(ctx, text, maxWidth) {
    const normalized = (text || '').toString();
    const paragraphs = normalized.split(/\n/);
    const lines = [];

    paragraphs.forEach((paragraph) => {
        if (paragraph === '') {
            lines.push('');
            return;
        }

        const words = paragraph.split(' ');
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
    });
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
    ctx.lineWidth = 1.5;
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

function openInlineEditor(elem, elemIndex = app.selectedElement) {
    closeInlineEditor(true);

    const canvas = document.getElementById('slideCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    const editor = document.createElement('textarea');
    editor.value = elem.text;
    editor.style.position = 'fixed';
    editor.style.left = `${rect.left + elem.x * scaleX}px`;
    editor.style.top = `${rect.top + elem.y * scaleY}px`;
    editor.style.width = `${Math.max(120, elem.width * scaleX)}px`;
    editor.style.height = `${Math.max(48, elem.height * scaleY)}px`;
    editor.style.fontFamily = elem.font;
    editor.style.fontSize = `${Math.max(12, elem.size * scaleY)}px`;
    editor.style.color = elem.color;
    editor.style.fontWeight = elem.bold ? '700' : '400';
    editor.style.fontStyle = elem.italic ? 'italic' : 'normal';
    editor.style.textDecoration = elem.underline ? 'underline' : 'none';
    editor.style.textAlign = elem.align || 'left';
    editor.style.lineHeight = '1.25';
    editor.style.padding = '8px';
    editor.style.border = '2px solid #3b82f6';
    editor.style.borderRadius = '6px';
    editor.style.background = 'rgba(15, 23, 42, 0.08)';
    editor.style.zIndex = '2000';
    editor.style.resize = 'none';
    editor.style.outline = 'none';
    editor.style.boxSizing = 'border-box';
    editor.style.caretColor = elem.color;

    app.inlineEditor = editor;
    app.inlineEditIndex = elemIndex;
    renderCurrentSlide();

    editor.addEventListener('input', () => {
        elem.text = editor.value;
        updateElementProperties();
    });

    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeInlineEditor(true);
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            closeInlineEditor(true);
        }
    });

    editor.addEventListener('blur', () => closeInlineEditor(true));

    document.body.appendChild(editor);
    editor.focus();
    editor.select();
}

function closeInlineEditor(save = false) {
    if (!app.inlineEditor) {
        return;
    }

    const editor = app.inlineEditor;
    app.inlineEditor = null;
    app.inlineEditIndex = null;

    if ( editor.parentNode ) {
        editor.remove();
    }

    if (save) {
        commitChange();
    }

    renderSlides();
    updateElementProperties();
}

// ======================== ELEMENT EDITING ========================
function addTextBox() {
    closeInlineEditor(true);
    const slide = app.presentation.slides[app.currentSlideIndex];
    const dark = isDarkBackground(slide.background);
    const newText = {
        type: 'text',
        x: 100,
        y: 150,
        width: 520,
        height: 110,
        text: 'Click to edit heading or text',
        font: 'Inter',
        size: 28,
        color: dark ? '#ffffff' : '#0f172a',
        bold: true,
        italic: false,
        underline: false,
        align: 'left'
    };
    slide.elements.push(newText);
    app.selectedElement = slide.elements.length - 1;
    commitChange();
    renderSlides();
    updateElementProperties();
}

function addBulletListBox() {
    closeInlineEditor(true);
    const slide = app.presentation.slides[app.currentSlideIndex];
    const dark = isDarkBackground(slide.background);
    const newBullets = {
        type: 'text',
        x: 80,
        y: 160,
        width: 800,
        height: 280,
        text: '• First key takeaway or core concept\n\n• Second supporting point with clear metrics\n\n• Third conclusion or action item',
        font: 'Inter',
        size: 22,
        color: dark ? '#e2e8f0' : '#334155',
        bold: false,
        italic: false,
        underline: false,
        align: 'left'
    };
    slide.elements.push(newBullets);
    app.selectedElement = slide.elements.length - 1;
    commitChange();
    renderSlides();
    updateElementProperties();
}

function addImage() {
    const fileInput = document.getElementById('imageFile');
    if (fileInput) {
        fileInput.value = '';
        fileInput.click();
    }
}

function deleteElement() {
    closeInlineEditor(false);
    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        slide.elements.splice(app.selectedElement, 1);
        app.selectedElement = null;
        commitChange();
        renderSlides();
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
            renderSlides();
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
            renderSlides();
        }
    }
}

// ======================== CANVAS INTERACTIONS ========================
function setupCanvasListeners() {
    const canvas = document.getElementById('slideCanvas');

    canvas.addEventListener('click', (e) => handleCanvasClick(e));
    canvas.addEventListener('dblclick', (e) => handleCanvasDoubleClick(e));
    canvas.addEventListener('mousedown', (e) => handleCanvasMouseDown(e));
    canvas.addEventListener('mousemove', (e) => handleCanvasMouseMove(e));
    canvas.addEventListener('mouseup', (e) => handleCanvasMouseUp(e));

    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });
}

function handleCanvasTouchStart(e) {
    if (!e.touches.length) {
        return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    const point = { clientX: touch.clientX, clientY: touch.clientY };
    handleCanvasClick(point);
    handleCanvasMouseDown(point);
}

function handleCanvasTouchMove(e) {
    if (!e.touches.length) {
        return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
}

function handleCanvasTouchEnd(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) {
        handleCanvasMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    } else {
        handleCanvasMouseUp(e);
    }
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

    const prevSelected = app.selectedElement;
    app.selectedElement = selectedIndex;
    updateElementProperties();
    renderCurrentSlide();

    // Single click on an already-selected text element opens inline editor
    if (selectedIndex !== null && selectedIndex === prevSelected && !app.isDragging && !app.isResizing) {
        const elem = slide.elements[selectedIndex];
        if (elem.type === 'text' && !app.inlineEditor) {
            openInlineEditor(elem, selectedIndex);
        }
    }
}

function handleCanvasDoubleClick(e) {
    const { x, y } = getCanvasPoint(e);
    const slide = app.presentation.slides[app.currentSlideIndex];

    for (let i = slide.elements.length - 1; i >= 0; i--) {
        const elem = slide.elements[i];
        if (elem.type !== 'text') {
            continue;
        }
        if (x >= elem.x && x <= elem.x + elem.width &&
            y >= elem.y && y <= elem.y + elem.height) {
            app.selectedElement = i;
            updateElementProperties();
            renderCurrentSlide();
            openInlineEditor(elem, i);
            break;
        }
    }
}

function handleCanvasMouseDown(e) {
    if (app.selectedElement === null) {
        return;
    }

    const slide = app.presentation.slides[app.currentSlideIndex];
    const elem = slide.elements[app.selectedElement];
    if (!elem) return;
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
    if (!elem) return;
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
        renderSlides();
        updateElementProperties();
    }
}

// ======================== PROPERTIES PANEL ========================
function updateElementProperties() {
    const propertiesDiv = document.getElementById('elementProperties');
    const textContent = document.getElementById('textContent');
    const textGroup = document.getElementById('textPropertiesGroup');
    const alignGroup = document.getElementById('textAlignGroup');

    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        const elem = slide && slide.elements[app.selectedElement];
        if (!elem) {
            propertiesDiv.style.display = 'none';
            textContent.value = '';
            return;
        }

        propertiesDiv.style.display = 'block';
        document.getElementById('elemX').value = Math.round(elem.x);
        document.getElementById('elemY').value = Math.round(elem.y);
        document.getElementById('elemWidth').value = Math.round(elem.width);
        document.getElementById('elemHeight').value = Math.round(elem.height);

        if (elem.type === 'text') {
            textGroup.style.display = 'block';
            alignGroup.style.display = 'block';
            textContent.value = elem.text;
            document.getElementById('fontFamily').value = elem.font;
            document.getElementById('fontSize').value = elem.size;
            document.getElementById('textColor').value = elem.color && elem.color.startsWith('#') ? elem.color : '#0f172a';
            document.getElementById('boldCheckbox').checked = Boolean(elem.bold);
            document.getElementById('italicCheckbox').checked = Boolean(elem.italic);
            document.getElementById('underlineCheckbox').checked = Boolean(elem.underline);
            setAlignButtonState(elem.align || 'left');
        } else {
            textGroup.style.display = 'none';
            alignGroup.style.display = 'none';
            textContent.value = '';
        }
    } else {
        propertiesDiv.style.display = 'none';
        textContent.value = '';
    }
}

function setAlignButtonState(align) {
    const alignButtons = document.querySelectorAll('.align-btn');
    alignButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.align === align);
    });
}

function setTextAlignment(align) {
    if (app.selectedElement !== null) {
        const slide = app.presentation.slides[app.currentSlideIndex];
        const elem = slide.elements[app.selectedElement];
        if (elem && elem.type === 'text') {
            elem.align = align;
            setAlignButtonState(align);
            commitChange();
            renderSlides();
        }
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

    toggleGradientControls(gradientType);

    commitChange();
    renderSlides();
}

function syncBackgroundControls() {
    const slide = app.presentation.slides[app.currentSlideIndex];
    if (!slide) return;
    const gradientType = document.getElementById('gradientType');
    const bgColor = document.getElementById('bgColor');
    const gradColor1 = document.getElementById('gradientColor1');
    const gradColor2 = document.getElementById('gradientColor2');

    const bg = slide.background || '#ffffff';
    if (bg.includes('linear-gradient')) {
        const colors = bg.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
        gradientType.value = 'linear';
        gradColor1.value = colors[0];
        gradColor2.value = colors[1] || colors[0];
        bgColor.value = colors[0];
    } else if (bg.includes('radial-gradient')) {
        const colors = bg.match(/#[a-f0-9]{6}/gi) || ['#3b82f6', '#8b5cf6'];
        gradientType.value = 'radial';
        gradColor1.value = colors[0];
        gradColor2.value = colors[1] || colors[0];
        bgColor.value = colors[0];
    } else {
        gradientType.value = 'none';
        bgColor.value = bg;
    }

    toggleGradientControls(gradientType.value);
}

function toggleGradientControls(gradientType) {
    const controls = document.getElementById('gradientControls');
    if (!controls) {
        return;
    }
    controls.style.display = gradientType === 'none' ? 'none' : 'flex';
}

// ======================== STARTER DECKS & TEMPLATES ========================
async function showTemplates() {
    const modal = document.getElementById('templateModal');
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = '';

    // 1. Complete Multi-Slide Starter Decks (Fastest path)
    STARTER_DECKS.forEach((pack) => {
        const card = document.createElement('div');
        card.className = 'template-item';
        const previewSlides = buildSlidesFromOutlineText(pack.outline, pack.theme);
        const preview = document.createElement('img');
        preview.className = 'template-preview';
        preview.style.width = '100%';
        preview.style.borderRadius = '6px';
        preview.alt = `${pack.name} preview`;
        preview.src = createSlidePreviewData(previewSlides[0]);

        const title = document.createElement('div');
        title.textContent = pack.name;

        const meta = document.createElement('div');
        meta.className = 'template-item-meta';
        meta.textContent = pack.meta;

        card.appendChild(preview);
        card.appendChild(title);
        card.appendChild(meta);
        card.onclick = () => {
            const generated = buildSlidesFromOutlineText(pack.outline, pack.theme);
            if (generated.length) {
                app.presentation.slides = generated;
                app.currentSlideIndex = 0;
                app.selectedElement = null;
                commitChange();
                renderSlides();
                updateSlideCounter();
                syncBackgroundControls();
                updateElementProperties();
                closeModal('templateModal');
                ensureFontsForSlides(generated);
            }
        };
        grid.appendChild(card);
    });

    // 2. Single-Slide Templates
    const templateSlides = TEMPLATES.flatMap((template) => template.slides || []);
    await ensureFontsForSlides(templateSlides);

    TEMPLATES.forEach((template, index) => {
        const item = document.createElement('div');
        item.className = 'template-item';
        const preview = document.createElement('img');
        preview.className = 'template-preview';
        preview.style.width = '100%';
        preview.style.borderRadius = '6px';
        preview.alt = `${template.name} preview`;
        preview.src = createSlidePreviewData(template.slides[0]);

        const label = document.createElement('div');
        label.className = 'template-name';
        label.textContent = `+ 1 Slide: ${template.name}`;

        item.appendChild(preview);
        item.appendChild(label);
        item.onclick = () => applyTemplate(index);
        grid.appendChild(item);
    });

    modal.classList.add('active');
}

function applyTemplate(templateIndex) {
    const template = TEMPLATES[templateIndex];
    const slides = JSON.parse(JSON.stringify(template.slides));
    const insertIndex = app.currentSlideIndex + 1;
    app.presentation.slides.splice(insertIndex, 0, ...slides);
    app.currentSlideIndex = insertIndex;
    app.selectedElement = null;
    commitChange();
    renderSlides();
    updateSlideCounter();
    syncBackgroundControls();
    closeModal('templateModal');
    ensureFontsForSlides(slides);
}

function createSlidePreviewData(slide, width = 240, height = 135) {
    if (!slide) {
        return '';
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawSlideBackground(ctx, slide.background, width, height);
    const scale = width / SLIDE_WIDTH;

    slide.elements.forEach((elem) => {
        const scaledElem = scaleElement(elem, scale);
        if (elem.type === 'text') {
            drawTextElement(ctx, scaledElem, false, { showBorder: false, showSelection: false });
        } else if (elem.type === 'image' && elem.src) {
            const img = app.imageCache[elem.src];
            if (img && img.complete) {
                ctx.drawImage(img, scaledElem.x, scaledElem.y, scaledElem.width, scaledElem.height);
            }
        }
    });

    return canvas.toDataURL();
}

function createGradientDataUrl(background) {
    const canvas = document.createElement('canvas');
    canvas.width = SLIDE_WIDTH;
    canvas.height = SLIDE_HEIGHT;
    const ctx = canvas.getContext('2d');
    drawSlideBackground(ctx, background, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

// ======================== EXPORT ========================
function getPresentationExportTitle(customName) {
    if (typeof customName === 'string' && customName.trim()) {
        return customName.trim();
    }
    const titleInput = document.getElementById('presentationTitleInput');
    if (titleInput && titleInput.value.trim()) {
        return titleInput.value.trim();
    }
    return (app.presentation && app.presentation.name) || 'My Presentation';
}

async function exportPptx(name) {
    closeInlineEditor(true);
    if (typeof PptxGenJS === 'undefined') {
        alert('PptxGenJS is not available. Please refresh the page.');
        return;
    }

    const exportName = getPresentationExportTitle(name);
    await ensureFontsForPresentation();

    const pres = new PptxGenJS();
    pres.defineLayout({ name: 'LAYOUT1', width: 10, height: 5.625 });
    pres.layout = 'LAYOUT1';

    app.presentation.slides.forEach(slide => {
        const layout = pres.addSlide();

        const bg = slide.background || '#ffffff';
        if (bg.includes('gradient')) {
            const gradientImage = createGradientDataUrl(bg);
            layout.addImage({ data: gradientImage, x: 0, y: 0, w: PPTX_LAYOUT.width, h: PPTX_LAYOUT.height });
        } else {
            layout.background = { color: normalizeHexColor(bg) };
        }

        slide.elements.forEach(elem => {
            if (elem.type === 'text') {
                layout.addText(elem.text, {
                    x: elem.x / 96,
                    y: elem.y / 96,
                    w: elem.width / 96,
                    h: elem.height / 96,
                    fontSize: elem.size * 0.75,
                    fontFace: elem.font,
                    color: normalizeHexColor(elem.color),
                    bold: elem.bold,
                    italic: elem.italic,
                    underline: elem.underline ? { style: 'sng' } : undefined,
                    align: elem.align || 'left',
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

    await pres.writeFile({ fileName: exportName + '.pptx' });
}

async function exportPdf(name) {
    closeInlineEditor(true);
    if (typeof html2canvas === 'undefined' || !window.jspdf) {
        alert('PDF export libraries are not available. Please refresh the page.');
        return;
    }

    const exportName = getPresentationExportTitle(name);
    await ensureFontsForPresentation();

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

    pdf.save(exportName + '.pdf');
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
            textEl.style.textAlign = elem.align || 'left';
            textEl.style.whiteSpace = 'pre-wrap';
            textEl.style.lineHeight = '1.25';
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
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
}

// ======================== EVENT LISTENERS ========================
function setupEventListeners() {
    // Presentation Title input sync
    const titleInput = document.getElementById('presentationTitleInput');
    if (titleInput) {
        if (app.presentation && app.presentation.name) {
            titleInput.value = app.presentation.name;
        }
        titleInput.addEventListener('input', () => {
            if (app.presentation) {
                app.presentation.name = titleInput.value.trim() || 'My Presentation';
                savePresentation();
            }
        });
    }

    // Slide buttons
    document.getElementById('addSlideBtn').addEventListener('click', addSlide);
    document.getElementById('deleteSlideBtn').addEventListener('click', deleteSlide);
    document.getElementById('duplicateSlideBtn').addEventListener('click', duplicateSlide);

    // 1-Click Slide Layout buttons
    document.querySelectorAll('[data-layout]').forEach((btn) => {
        btn.addEventListener('click', () => {
            addSlideWithLayout(btn.getAttribute('data-layout'));
        });
    });

    // 1-Click Deck Theme buttons
    document.querySelectorAll('[data-theme-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
            applyDeckTheme(btn.getAttribute('data-theme-preset'));
        });
    });

    // ⚡ Quick Deck Studio modal & outline generator
    const quickDeckBtn = document.getElementById('quickDeckBtn');
    if (quickDeckBtn) {
        quickDeckBtn.addEventListener('click', () => {
            const outlineInput = document.getElementById('outlineInput');
            if (outlineInput && !outlineInput.value.trim()) {
                outlineInput.value = SAMPLE_SEMINAR_OUTLINE;
            }
            openModal('quickDeckModal');
        });
    }

    const loadSampleOutlineBtn = document.getElementById('loadSampleOutlineBtn');
    if (loadSampleOutlineBtn) {
        loadSampleOutlineBtn.addEventListener('click', () => {
            const outlineInput = document.getElementById('outlineInput');
            if (outlineInput) {
                outlineInput.value = SAMPLE_SEMINAR_OUTLINE;
                outlineInput.focus();
            }
        });
    }

    const generateDeckBtn = document.getElementById('generateDeckBtn');
    if (generateDeckBtn) {
        generateDeckBtn.addEventListener('click', () => {
            const outlineInput = document.getElementById('outlineInput');
            const themeSelect = document.getElementById('quickDeckTheme');
            const modeSelect = document.getElementById('quickDeckMode');
            const rawText = outlineInput ? outlineInput.value : '';
            const themeKey = themeSelect ? themeSelect.value : 'indigo';
            const mode = modeSelect ? modeSelect.value : 'replace';

            const newSlides = buildSlidesFromOutlineText(rawText || SAMPLE_SEMINAR_OUTLINE, themeKey);
            if (!newSlides.length) return;

            closeInlineEditor(false);
            if (mode === 'append') {
                app.presentation.slides.push(...newSlides);
                app.currentSlideIndex = app.presentation.slides.length - newSlides.length;
            } else {
                app.presentation.slides = newSlides;
                app.currentSlideIndex = 0;
            }
            // Update presentation title from first slide heading if available
            const firstHeading = newSlides[0]?.elements?.[0]?.text;
            if (firstHeading && titleInput) {
                titleInput.value = firstHeading.slice(0, 60);
                app.presentation.name = titleInput.value;
            }

            app.selectedElement = null;
            commitChange();
            renderSlides();
            updateSlideCounter();
            syncBackgroundControls();
            updateElementProperties();
            closeModal('quickDeckModal');
            ensureFontsForSlides(newSlides);
        });
    }

    // Edit buttons
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);

    // Element buttons
    document.getElementById('addTextBtn').addEventListener('click', addTextBox);
    const addBulletsBtn = document.getElementById('addBulletsBtn');
    if (addBulletsBtn) {
        addBulletsBtn.addEventListener('click', addBulletListBox);
    }
    document.getElementById('addImageBtn').addEventListener('click', addImage);
    document.getElementById('templateBtn').addEventListener('click', showTemplates);
    document.getElementById('deleteElementBtn').addEventListener('click', deleteElement);
    document.getElementById('bringForwardBtn').addEventListener('click', bringForward);
    document.getElementById('sendBackwardBtn').addEventListener('click', sendBackward);

    // Export buttons
    let exporting = false;
    async function exportWithFeedback(action) {
        if (exporting) return;
        exporting = true;
        const buttons = ['exportPptxBtn', 'exportPdfBtn'].map(id => document.getElementById(id)).filter(Boolean);
        buttons.forEach(button => { button.disabled = true; button.setAttribute('aria-busy', 'true'); });
        try { await action(); } catch (error) { alert('Could not export the presentation: ' + error.message); }
        finally { exporting = false; buttons.forEach(button => { button.disabled = false; button.removeAttribute('aria-busy'); }); }
    }
    document.getElementById('exportPptxBtn').addEventListener('click', () => exportWithFeedback(exportPptx));
    document.getElementById('exportPdfBtn').addEventListener('click', () => exportWithFeedback(exportPdf));

    // Properties
    document.getElementById('bgColor').addEventListener('input', updateSlideBackground);
    document.getElementById('bgColor').addEventListener('change', updateSlideBackground);
    document.getElementById('gradientType').addEventListener('change', updateSlideBackground);
    document.getElementById('gradientColor1').addEventListener('input', updateSlideBackground);
    document.getElementById('gradientColor1').addEventListener('change', updateSlideBackground);
    document.getElementById('gradientColor2').addEventListener('input', updateSlideBackground);
    document.getElementById('gradientColor2').addEventListener('change', updateSlideBackground);

    // Text properties
    document.getElementById('textContent').addEventListener('input', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            const elem = slide.elements[app.selectedElement];
            if (elem && elem.type === 'text') {
                elem.text = document.getElementById('textContent').value;
                commitChange();
                renderSlides();
            }
        }
    });

    document.getElementById('fontFamily').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].font = document.getElementById('fontFamily').value;
            commitChange();
            renderSlides();
        }
    });

    document.getElementById('fontSize').addEventListener('input', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            const parsed = parseInt(document.getElementById('fontSize').value, 10);
            if (!Number.isNaN(parsed) && parsed >= 8) {
                slide.elements[app.selectedElement].size = parsed;
                commitChange();
                renderSlides();
            }
        }
    });

    document.getElementById('textColor').addEventListener('input', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].color = document.getElementById('textColor').value;
            commitChange();
            renderSlides();
        }
    });

    document.getElementById('boldCheckbox').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].bold = document.getElementById('boldCheckbox').checked;
            commitChange();
            renderSlides();
        }
    });

    document.getElementById('italicCheckbox').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].italic = document.getElementById('italicCheckbox').checked;
            commitChange();
            renderSlides();
        }
    });

    document.getElementById('underlineCheckbox').addEventListener('change', () => {
        if (app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            slide.elements[app.selectedElement].underline = document.getElementById('underlineCheckbox').checked;
            commitChange();
            renderSlides();
        }
    });

    // Position & Size inputs
    ['elemX', 'elemY', 'elemWidth', 'elemHeight'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', () => {
                if (app.selectedElement !== null) {
                    const slide = app.presentation.slides[app.currentSlideIndex];
                    const elem = slide.elements[app.selectedElement];
                    const val = parseInt(input.value, 10) || 0;
                    if (id === 'elemX') elem.x = val;
                    else if (id === 'elemY') elem.y = val;
                    else if (id === 'elemWidth') elem.width = Math.max(val, 40);
                    else if (id === 'elemHeight') elem.height = Math.max(val, 40);
                    commitChange();
                    renderSlides();
                }
            });
        }
    });

    // Image upload
    document.getElementById('imageFile').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 100 * 1024 * 1024) {
                alert('Image is too large. Maximum size is 100 MB.');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const slide = app.presentation.slides[app.currentSlideIndex];
                    let w = img.width;
                    let h = img.height;
                    const maxW = 420;
                    const maxH = 320;
                    if (w > maxW) { h = h * (maxW / w); w = maxW; }
                    if (h > maxH) { w = w * (maxH / h); h = maxH; }
                    const newImage = {
                        type: 'image',
                        x: Math.round((SLIDE_WIDTH - w) / 2),
                        y: Math.round((SLIDE_HEIGHT - h) / 2),
                        width: Math.round(w),
                        height: Math.round(h),
                        src: event.target.result
                    };
                    slide.elements.push(newImage);
                    app.selectedElement = slide.elements.length - 1;
                    commitChange();
                    renderSlides();
                    updateElementProperties();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Fast Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (app.isPresenting) {
            return;
        }
        if (isTypingTarget(e.target) || app.inlineEditor) {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            duplicateSlide();
        } else if (e.altKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            addSlide();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && app.selectedElement !== null) {
            e.preventDefault();
            deleteElement();
        } else if (e.key === 'Enter' && app.selectedElement !== null) {
            const slide = app.presentation.slides[app.currentSlideIndex];
            const elem = slide && slide.elements[app.selectedElement];
            if (elem && elem.type === 'text') {
                e.preventDefault();
                openInlineEditor(elem, app.selectedElement);
            }
        }
    });

    setupCanvasListeners();
}

function isTypingTarget(target) {
    if (!target) {
        return false;
    }
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

// ======================== STARTUP ========================
document.addEventListener('DOMContentLoaded', init);

// Auto-save every 30 seconds
setInterval(() => {
    savePresentation();
}, 30000);

