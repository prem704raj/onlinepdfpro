// ============================================
// ONLINE PDF PRO - LOCAL USAGE COUNTER
// These counts describe only this browser, never sitewide usage.
// ============================================

const COUNTER_KEY = 'onlinepdfpro_counter';
// Previous versions stored fabricated starting values. Keep these only to
// subtract them when migrating a returning browser's real local usage.
const LEGACY_BASE_COUNTS = {
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
const EMPTY_COUNTS = Object.fromEntries(Object.keys(LEGACY_BASE_COUNTS).map(key => [key, 0]));

// Get saved counter or initialize
function getCounter() {
    const saved = localStorage.getItem(COUNTER_KEY);
    if (saved) {
        try {
            const previous = JSON.parse(saved);
            if (previous.version === 2) return previous;
            const counter = { ...EMPTY_COUNTS, version: 2, realUsage: Math.max(0, Number(previous.realUsage) || 0) };
            counter.totalPDFs = counter.realUsage;
            for (const key of Object.keys(EMPTY_COUNTS)) {
                if (key === 'totalPDFs' || key === 'totalUsers') continue;
                counter[key] = Math.max(0, (Number(previous[key]) || 0) - LEGACY_BASE_COUNTS[key]);
            }
            saveCounter(counter);
            return counter;
        } catch { /* Start a clean local counter if old storage is malformed. */ }
    }

    const counter = { ...EMPTY_COUNTS, version: 2, realUsage: 0 };
    saveCounter(counter);
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

// The total is the number of recorded operations on this browser only.
function getTotalCount() {
    return getCounter().totalPDFs;
}

// This script has no sitewide user measurement.
function getTotalUsers() {
    return null;
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
    return Math.max(0, Number.parseInt(saved || '0', 10) || 0);
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
    const today = getTodayCount();

    // Update elements if they exist
    const totalEl = document.getElementById('counter-total');
    if (totalEl) {
        totalEl.textContent = formatNumber(total);
        totalEl.title = 'Count on this device';
    }

    const totalShortEl = document.getElementById('counter-total-short');
    if (totalShortEl) totalShortEl.textContent = formatNumberShort(total);

    const usersEl = document.getElementById('counter-users');
    if (usersEl) usersEl.textContent = '—';

    const usersShortEl = document.getElementById('counter-users-short');
    if (usersShortEl) usersShortEl.textContent = '—';

    const todayEl = document.getElementById('counter-today');
    if (todayEl) todayEl.textContent = formatNumber(today);

}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCounterDisplay();
});
