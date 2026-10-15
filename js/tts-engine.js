// ========== TTS ENGINE - 100% UNLIMITED FOREVER ==========
let synth = window.speechSynthesis;
let utterance = null;
let allVoices = [];
let isPlaying = false;
let isPaused = false;
let currentSpeed = 1.0;
let progressInterval = null;
let startTime = 0;
let playbackGeneration = 0;
let ttsHistory = [];
try {
    const storedHistory = JSON.parse(localStorage.getItem('ttsHistory') || '[]');
    ttsHistory = Array.isArray(storedHistory)
        ? storedHistory.filter(item => item && typeof item.text === 'string' && item.text.length <= 100000)
            .slice(0, 10)
            .map(item => ({
                text: item.text,
                preview: typeof item.preview === 'string' ? item.preview.slice(0, 100) : item.text.slice(0, 80),
                time: typeof item.time === 'string' ? item.time : ''
            }))
        : [];
} catch (error) {
    ttsHistory = [];
}

// Load voices
function loadVoices() {
    if (!synth) { document.getElementById('playBtn').disabled = true; alert('Speech playback is unavailable in this browser. TXT export still works.'); return; }
    allVoices = synth.getVoices();
    filterVoices();
    if (allVoices.length === 0) {
        synth.onvoiceschanged = () => {
            allVoices = synth.getVoices();
            filterVoices();
        };
    }
}

function filterVoices() {
    const filter = document.getElementById('langFilter').value;
    const select = document.getElementById('voiceSelect');
    select.innerHTML = '';

    let filtered = allVoices;
    if (filter !== 'all') {
        filtered = allVoices.filter(v => v.lang.startsWith(filter));
    }

    if (filtered.length === 0) {
        filtered = allVoices;
    }

    filtered.forEach((voice, i) => {
        const opt = document.createElement('option');
        opt.value = allVoices.indexOf(voice);
        opt.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(opt);
    });
}

// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.input-section').forEach(s => s.classList.remove('active'));

    if (tab === 'text') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('textTab').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('pdfTab').classList.add('active');
    }
}

// PDF Upload handling
document.getElementById('pdfInput').addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    try {

    document.getElementById('pdfFileName').textContent = `📄 ${file.name}`;
    document.getElementById('pdfFileName').style.display = 'block';
    document.getElementById('uploadBox').classList.add('loaded');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    document.getElementById('textInput').value = fullText.trim();
    updateStats();
    switchTab('text');
    await pdf.destroy();
    if (!fullText.trim()) alert('No searchable text was found. Extract scanned text with Image to Text first.');
    } catch (error) {
        e.target.value = ''; document.getElementById('pdfFileName').textContent = 'Could not read PDF. Choose a valid, unencrypted PDF and try again.';
        document.getElementById('uploadBox').classList.remove('loaded');
    }
});

// Drag and drop
const uploadBox = document.getElementById('uploadBox');
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#2563eb';
    uploadBox.style.background = '#f0f9ff';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '#cbd5e1';
    uploadBox.style.background = '';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#cbd5e1';
    uploadBox.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        document.getElementById('pdfInput').files = e.dataTransfer.files;
        document.getElementById('pdfInput').dispatchEvent(new Event('change'));
    }
});

// Stats update
function updateStats() {
    const text = document.getElementById('textInput').value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readMin = Math.ceil(words / 150);

    document.getElementById('wordCount').textContent = `Words: ${words.toLocaleString()}`;
    document.getElementById('charCount').textContent = `Characters: ${chars.toLocaleString()}`;
    document.getElementById('readTime').textContent = `Reading Time: ~${readMin} min`;
}

document.getElementById('textInput').addEventListener('input', updateStats);

// ========== MAIN PLAY/PAUSE/STOP ==========
function togglePlay() {
    if (!synth) return alert('Speech playback is unavailable in this browser.');
    const text = document.getElementById('textInput').value.trim();
    if (!text) return alert('Please enter or upload text first!');

    if (isPaused) {
        synth.resume();
        isPaused = false;
        isPlaying = true;
        updatePlayButton('playing');
        document.getElementById('waveContainer').classList.add('active');
        return;
    }

    if (isPlaying) {
        synth.pause();
        isPaused = true;
        isPlaying = false;
        updatePlayButton('paused');
        document.getElementById('waveContainer').classList.remove('active');
        return;
    }

    // Start fresh
    stopAudio();
    speakText(text);
}

function speakText(text) {
    if (!synth) return;
    const generation = ++playbackGeneration;
    // Split text into chunks (Chrome has a bug with long text)
    const chunks = splitTextIntoChunks(text, 200);
    let currentChunk = 0;

    function speakNextChunk() {
        if (generation !== playbackGeneration) return;
        if (currentChunk >= chunks.length) {
            stopAudio();
            return;
        }

        utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);

        // Apply settings
        const voiceIndex = document.getElementById('voiceSelect').value;
        if (allVoices[voiceIndex]) {
            utterance.voice = allVoices[voiceIndex];
        }
        utterance.rate = parseFloat(document.getElementById('speedRange').value);
        utterance.pitch = parseFloat(document.getElementById('pitchRange').value);
        utterance.volume = parseFloat(document.getElementById('volumeRange').value);

        utterance.onstart = () => {
            if (generation !== playbackGeneration) return;
            isPlaying = true;
            isPaused = false;
            updatePlayButton('playing');
            document.getElementById('waveContainer').classList.add('active');
            document.getElementById('nowPlayingText').textContent = chunks[currentChunk].substring(0, 100) + '...';
        };

        utterance.onend = () => {
            if (generation !== playbackGeneration) return;
            currentChunk++;
            if (currentChunk < chunks.length) {
                speakNextChunk();
            } else {
                stopAudio();
            }
        };

        utterance.onerror = () => {
            if (generation !== playbackGeneration) return;
            stopAudio();
        };

        synth.speak(utterance);
    }

    // Start progress tracking
    startTime = Date.now();
    const totalDuration = (text.length / 15) * (1 / parseFloat(document.getElementById('speedRange').value));
    startProgressTracking(totalDuration);

    // Add to history
    addToHistory(text);

    speakNextChunk();
}

function splitTextIntoChunks(text, maxWords) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWords) {
        chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    return chunks;
}

function stopAudio() {
    playbackGeneration++;
    if (synth) synth.cancel();
    isPlaying = false;
    isPaused = false;
    updatePlayButton('stopped');
    document.getElementById('waveContainer').classList.remove('active');
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('currentTime').textContent = '0:00';
    clearInterval(progressInterval);
}

function restartAudio() {
    stopAudio();
    const text = document.getElementById('textInput').value.trim();
    if (text) speakText(text);
}

function updatePlayButton(state) {
    const btn = document.getElementById('playBtn');
    btn.className = 'play-btn';
    if (state === 'playing') {
        btn.textContent = '⏸️';
        btn.classList.add('playing');
    } else if (state === 'paused') {
        btn.textContent = '▶️';
        btn.classList.add('paused');
    } else {
        btn.textContent = '▶️';
    }
}

// ========== SPEED CONTROLS ==========
function increaseSpeed() {
    const range = document.getElementById('speedRange');
    let val = parseFloat(range.value);
    if (val < 3) {
        val = Math.min(3, val + 0.25);
        range.value = val;
        updateSpeedDisplay();
        if (utterance) utterance.rate = val;
    }
}

function decreaseSpeed() {
    const range = document.getElementById('speedRange');
    let val = parseFloat(range.value);
    if (val > 0.25) {
        val = Math.max(0.25, val - 0.25);
        range.value = val;
        updateSpeedDisplay();
        if (utterance) utterance.rate = val;
    }
}

function updateSpeedDisplay() {
    const val = parseFloat(document.getElementById('speedRange').value);
    document.getElementById('speedValue').textContent = val.toFixed(1) + 'x';
    document.getElementById('speedDisplay').textContent = val.toFixed(1) + 'x';
}

function updatePitchDisplay() {
    const val = parseFloat(document.getElementById('pitchRange').value);
    document.getElementById('pitchValue').textContent = val.toFixed(1);
}

function updateVolumeDisplay() {
    const val = parseFloat(document.getElementById('volumeRange').value);
    document.getElementById('volumeValue').textContent = Math.round(val * 100) + '%';
}

// ========== PROGRESS BAR ==========
function startProgressTracking(totalSeconds) {
    clearInterval(progressInterval);
    const totalMs = totalSeconds * 1000;

    document.getElementById('totalTime').textContent = formatTime(totalSeconds);

    progressInterval = setInterval(() => {
        if (!isPlaying) return;
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min((elapsed / totalSeconds) * 100, 100);

        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('currentTime').textContent = formatTime(elapsed);

        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 200);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========== TEMPLATES ==========
function loadTemplate(type) {
    const templates = {
        greeting: "Hello! Welcome to OnlinePDFPro, the best free online PDF tools website. We offer text to speech, PDF conversion, and many more tools completely free!",
        story: "Once upon a time, in a small village surrounded by mountains, there lived a young girl named Maya. She loved reading books and dreaming about faraway lands. One day, she found a magical book in her grandmother's attic that could transport her to any story she read.",
        news: "Breaking News: Scientists have made a groundbreaking discovery in renewable energy. A new type of solar panel can generate electricity even at night using infrared radiation from the Earth's surface. This technology could revolutionize how we power our homes and cities.",
        poem: "The Road Not Taken by Robert Frost. Two roads diverged in a yellow wood, And sorry I could not travel both. And be one traveler, long I stood. And looked down one as far as I could. To where it bent in the undergrowth.",
        hindi: "नमस्ते! ऑनलाइन पीडीएफ प्रो में आपका स्वागत है। यह भारत की सबसे अच्छी मुफ्त पीडीएफ वेबसाइट है। हम टेक्स्ट टू स्पीच, पीडीएफ कनवर्टर, और बहुत कुछ मुफ्त में प्रदान करते हैं।"
    };

    document.getElementById('textInput').value = templates[type] || '';
    updateStats();
}

// ========== QUICK ACTIONS ==========
function copyText() {
    const text = document.getElementById('textInput').value;
    if (!text) return alert('No text to copy!');
    navigator.clipboard.writeText(text).then(() => {
        alert('Text copied to clipboard! ✅');
    });
}

function clearText() {
    document.getElementById('textInput').value = '';
    stopAudio();
    updateStats();
    document.getElementById('nowPlayingText').textContent = '— No text loaded —';
}

function downloadText() {
    const text = document.getElementById('textInput').value;
    if (!text) return alert('No text to download!');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-from-onlinepdfpro.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// Download MP3 using robust multi-proxy failover
async function downloadAudio() {
    alert('Audio file export is unavailable. Browser speech playback and TXT download are supported.');
}

// ========== HISTORY ==========
function addToHistory(text) {
    const preview = text.substring(0, 80) + (text.length > 80 ? '...' : '');
    const time = new Date().toLocaleTimeString();

    ttsHistory.unshift({ text: text, preview: preview, time: time });
    if (ttsHistory.length > 10) ttsHistory.pop();

    localStorage.setItem('ttsHistory', JSON.stringify(ttsHistory));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');

    if (ttsHistory.length === 0) {
        const empty = document.createElement('p');
        empty.style.cssText = 'text-align:center;color:#94a3b8;padding:20px';
        empty.textContent = 'No history yet.';
        list.replaceChildren(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    ttsHistory.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'history-item';
        const preview = document.createElement('span');
        preview.className = 'history-text';
        preview.textContent = String(item.preview || '');
        const play = document.createElement('button');
        play.type = 'button';
        play.className = 'history-play';
        play.textContent = '▶️ Play';
        play.addEventListener('click', () => playFromHistory(i));
        row.append(preview, play);
        fragment.appendChild(row);
    });
    list.replaceChildren(fragment);
}

function playFromHistory(index) {
    const item = ttsHistory[index];
    document.getElementById('textInput').value = item.text;
    updateStats();
    switchTab('text');
    stopAudio();
    setTimeout(() => speakText(item.text), 300);
}

// ========== INIT ==========
window.addEventListener('load', () => {
    loadVoices();
    renderHistory();
    updateStats();
});

// Chrome needs this
if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
}
