// ============================================
// ONLINE PDF PRO - USAGE COUNTER SYSTEM
// Tracks real usage + shows impressive numbers
// ============================================

const COUNTER_KEY = 'onlinepdfpro_counter';
const COUNTER_START_KEY = 'onlinepdfpro_start_date';

// Base numbers (starting point - looks professional from day 1)
const BASE_COUNTS = {
    totalPDFs: 127843,
    totalUsers: 48291,
    mergePDF: 18432,
    compressPDF: 22156,
    signPDF: 15789,
    ocrPDF: 12543,
    imagesToPDF: 9876,
    pdfToWord: 14321,
    wordToPDF: 11234,
    excelToPDF: 8765,
    pptToPDF: 7654,
    pdfToJPG: 13456,
    pdfToExcel: 9123,
    pdfToPPT: 6789,
    rotatePDF: 5432,
    deletePDF: 4321,
    cropPDF: 3456,
    lockPDF: 6543,
    pageNumbers: 4567,
    flattenPDF: 2345,
    voiceToPDF: 3456,
    htmlToPDF: 5678,
    comparePDF: 2789,
    qrPDF: 3890,
    pdfReader: 8765,
    pdfEditor: 11234,
    repairPDF: 4567
};

// Get saved counter or initialize
function getCounter() {
    const saved = localStorage.getItem(COUNTER_KEY);
    if (saved) {
        return JSON.parse(saved);
    }

    // First time visitor - initialize
    const counter = { ...BASE_COUNTS, realUsage: 0 };
    localStorage.setItem(COUNTER_KEY, JSON.stringify(counter));
    localStorage.setItem(COUNTER_START_KEY, Date.now().toString());
    return counter;
}

// Save counter
function saveCounter(counter) {
    localStorage.setItem(COUNTER_KEY, JSON.stringify(counter));
}

// Increment counter for a specific tool
function incrementCounter(toolName) {
    const counter = getCounter();

    if (counter[toolName] !== undefined) {
        counter[toolName]++;
    }
    counter.totalPDFs++;
    counter.realUsage++;

    saveCounter(counter);
    updateCounterDisplay();
}

// Calculate daily growth (simulates organic growth)
function getDailyGrowth() {
    const startDate = localStorage.getItem(COUNTER_START_KEY);
    if (!startDate) return 0;

    const daysPassed = Math.floor((Date.now() - parseInt(startDate)) / (1000 * 60 * 60 * 24));
    // Simulate 150-300 new PDFs per day
    return daysPassed * (150 + Math.floor(Math.random() * 150));
}

// Get total count with daily growth
function getTotalCount() {
    const counter = getCounter();
    const growth = getDailyGrowth();
    return counter.totalPDFs + growth;
}

// Get total users with growth
function getTotalUsers() {
    const counter = getCounter();
    const growth = Math.floor(getDailyGrowth() / 3);
    return counter.totalUsers + growth;
}

// Format number with commas (1234567 → 1,234,567)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format number short (1234567 → 1.2M)
function formatNumberShort(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Get today's count
function getTodayCount() {
    const todayKey = 'onlinepdfpro_today_' + new Date().toDateString();
    const saved = localStorage.getItem(todayKey);
    // Base daily count + real usage today
    const baseDaily = 247 + Math.floor(Math.random() * 100);
    return (saved ? parseInt(saved) : 0) + baseDaily;
}

// Increment today's count
function incrementTodayCount() {
    const todayKey = 'onlinepdfpro_today_' + new Date().toDateString();
    const current = parseInt(localStorage.getItem(todayKey) || '0');
    localStorage.setItem(todayKey, (current + 1).toString());
}

// Update all counter displays on page
function updateCounterDisplay() {
    const total = getTotalCount();
    const users = getTotalUsers();
    const today = getTodayCount();

    // Update elements if they exist
    const totalEl = document.getElementById('counter-total');
    if (totalEl) totalEl.textContent = formatNumber(total);

    const totalShortEl = document.getElementById('counter-total-short');
    if (totalShortEl) totalShortEl.textContent = formatNumberShort(total);

    const usersEl = document.getElementById('counter-users');
    if (usersEl) usersEl.textContent = formatNumber(users);

    const usersShortEl = document.getElementById('counter-users-short');
    if (usersShortEl) usersShortEl.textContent = formatNumberShort(users);

    const todayEl = document.getElementById('counter-today');
    if (todayEl) todayEl.textContent = formatNumber(today);

    // Animate counter
    const animEls = document.querySelectorAll('.counter-animate');
    animEls.forEach(el => {
        const target = parseInt(el.dataset.target);
        if (target) animateCounter(el, target);
    });
}

// Smooth counter animation
function animateCounter(element, target) {
    let current = 0;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = formatNumber(Math.floor(current));
    }, stepTime);
}

// Live counter that updates every few seconds (looks real-time)
function startLiveCounter() {
    setInterval(() => {
        const totalEl = document.getElementById('counter-total');
        const todayEl = document.getElementById('counter-today');

        if (totalEl) {
            const current = parseInt(totalEl.textContent.replace(/,/g, ''));
            if (!isNaN(current)) {
                // Random increment every 3-8 seconds
                if (Math.random() > 0.5) {
                    totalEl.textContent = formatNumber(current + 1);
                }
            }
        }

        if (todayEl) {
            const current = parseInt(todayEl.textContent.replace(/,/g, ''));
            if (!isNaN(current) && Math.random() > 0.7) {
                todayEl.textContent = formatNumber(current + 1);
            }
        }
    }, 4000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCounterDisplay();
    startLiveCounter();
});
