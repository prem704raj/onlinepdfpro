pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
let allVoices = [], isPlaying = false, isPaused = false, utterance = null, startTime = 0, estimatedDuration = 0, progressInterval = null;
let history = JSON.parse(localStorage.getItem('tts_history') || '[]');
function loadVoices() { allVoices = speechSynthesis.getVoices(); filterVoices(); }
speechSynthesis.onvoiceschanged = loadVoices; loadVoices();
function filterVoices() {
    const f = document.getElementById('langFilter').value, s = document.getElementById('voiceSelect'); s.innerHTML = '';
    allVoices.forEach((v, i) => { if (f === 'all' || v.lang.toLowerCase().startsWith(f)) { const o = document.createElement('option'); o.value = i; o.textContent = v.name + ' (' + v.lang + ')'; s.appendChild(o); } });
}
function switchTab(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.input-section').forEach(s => s.classList.remove('active'));
    if (t === 'text') { document.querySelectorAll('.tab-btn')[0].classList.add('active'); document.getElementById('textTab').classList.add('active'); }
    else { document.querySelectorAll('.tab-btn')[1].classList.add('active'); document.getElementById('pdfTab').classList.add('active'); }
}
document.getElementById('pdfInput').onchange = async function (e) {
    const file = e.target.files[0]; if (!file) return;
    document.getElementById('uploadBox').classList.add('loaded'); document.getElementById('pdfFileName').style.display = 'block';
    document.getElementById('pdfFileName').textContent = '📄 ' + file.name;
    const ab = await file.arrayBuffer(), pdf = await pdfjsLib.getDocument({ data: ab }).promise; let ft = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i), tc = await pg.getTextContent(); const lines = {};
        tc.items.forEach(item => { const y = Math.round(item.transform[5]); if (!lines[y]) lines[y] = []; lines[y].push({ text: item.str, x: Math.round(item.transform[4]) }); });
        Object.keys(lines).sort((a, b) => b - a).forEach(y => { const lt = lines[y].sort((a, b) => a.x - b.x).map(i => i.text).join(' ').trim(); if (lt) ft += lt + ' '; }); ft += '\n\n';
    }
    document.getElementById('textInput').value = ft.trim(); switchTab('text'); updateStats();
};
document.getElementById('uploadBox').ondragover = e => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563eb'; };
document.getElementById('uploadBox').ondragleave = e => { e.currentTarget.style.borderColor = '#cbd5e1'; };
document.getElementById('uploadBox').ondrop = e => {
    e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1';
    const f = e.dataTransfer.files[0]; if (f && f.type === 'application/pdf') { document.getElementById('pdfInput').files = e.dataTransfer.files; document.getElementById('pdfInput').dispatchEvent(new Event('change')); }
};
const templates = {
    greeting: "Hello! Welcome to Online PDF Pro. This is a free text to speech tool. You can listen to any text or PDF document using multiple voices and languages. Try it now!",
    story: "Once upon a time, in a land far away, there lived a young programmer named Prem. He dreamed of building the best PDF tools website in the world. Day and night he worked, and finally, his dream came true. Online PDF Pro was born, helping millions of people around the globe.",
    news: "Breaking News: A revolutionary new website called Online PDF Pro has launched, offering over 30 free PDF tools to users worldwide. The site is completely free and processes all files securely in the browser.",
    poem: "Roses are red, violets are blue, Online PDF Pro is here, to help you through. Convert your files, with just a click, these tools are fast, and oh so slick!",
    hindi: "नमस्ते! ऑनलाइन पीडीएफ प्रो में आपका स्वागत है। यह भारत का सबसे अच्छा मुफ्त पीडीएफ टूल्स वेबसाइट है। सब कुछ मुफ्त है!"
};
function loadTemplate(n) { document.getElementById('textInput').value = templates[n] || ''; updateStats(); }
document.getElementById('textInput').addEventListener('input', updateStats);
function updateStats() {
    const t = document.getElementById('textInput').value, w = t.split(/\s+/).filter(x => x.length > 0).length, c = t.length, r = Math.ceil(w / 150);
    document.getElementById('wordCount').textContent = 'Words: ' + w.toLocaleString(); document.getElementById('charCount').textContent = 'Characters: ' + c.toLocaleString();
    document.getElementById('readTime').textContent = 'Reading Time: ~' + r + ' min'; estimatedDuration = r * 60; document.getElementById('totalTime').textContent = formatTime(estimatedDuration);
}
function togglePlay() { if (isPlaying) pauseAudio(); else if (isPaused) resumeAudio(); else playAudio(); }
function playAudio() {
    const t = document.getElementById('textInput').value.trim(); if (!t) return alert('Please enter or upload some text first!');
    speechSynthesis.cancel(); utterance = new SpeechSynthesisUtterance(t); const vi = document.getElementById('voiceSelect').value;
    utterance.voice = allVoices[vi] || allVoices[0]; utterance.rate = parseFloat(document.getElementById('speedRange').value);
    utterance.pitch = parseFloat(document.getElementById('pitchRange').value); utterance.volume = parseFloat(document.getElementById('volumeRange').value);
    startTime = Date.now();
    utterance.onstart = () => {
        isPlaying = true; isPaused = false; document.getElementById('playBtn').textContent = '⏸️';
        document.getElementById('playBtn').classList.add('playing'); document.getElementById('playBtn').classList.remove('paused');
        document.getElementById('waveContainer').classList.add('active'); document.getElementById('nowPlayingText').textContent = t.substring(0, 100) + (t.length > 100 ? '...' : '');
        startProgressUpdate(); addToHistory(t); if (typeof incrementCounter === 'function') { incrementCounter('textToAudio'); incrementTodayCount(); }
    };
    utterance.onpause = () => {
        isPaused = true; isPlaying = false; document.getElementById('playBtn').textContent = '▶️';
        document.getElementById('playBtn').classList.remove('playing'); document.getElementById('playBtn').classList.add('paused');
        document.getElementById('waveContainer').classList.remove('active'); stopProgressUpdate();
    };
    utterance.onresume = () => {
        isPaused = false; isPlaying = true; document.getElementById('playBtn').textContent = '⏸️';
        document.getElementById('playBtn').classList.add('playing'); document.getElementById('playBtn').classList.remove('paused');
        document.getElementById('waveContainer').classList.add('active'); startProgressUpdate();
    };
    utterance.onend = () => {
        isPlaying = false; isPaused = false; document.getElementById('playBtn').textContent = '▶️';
        document.getElementById('playBtn').classList.remove('playing', 'paused'); document.getElementById('waveContainer').classList.remove('active');
        document.getElementById('progressFill').style.width = '100%'; stopProgressUpdate();
    };
    utterance.onerror = () => {
        isPlaying = false; isPaused = false; document.getElementById('playBtn').textContent = '▶️';
        document.getElementById('playBtn').classList.remove('playing', 'paused'); document.getElementById('waveContainer').classList.remove('active'); stopProgressUpdate();
    };
    speechSynthesis.speak(utterance);
}
function pauseAudio() { speechSynthesis.pause(); } function resumeAudio() { speechSynthesis.resume(); }
function stopAudio() {
    speechSynthesis.cancel(); isPlaying = false; isPaused = false; document.getElementById('playBtn').textContent = '▶️';
    document.getElementById('playBtn').classList.remove('playing', 'paused'); document.getElementById('waveContainer').classList.remove('active');
    document.getElementById('progressFill').style.width = '0%'; document.getElementById('currentTime').textContent = '0:00'; stopProgressUpdate();
}
function restartAudio() { stopAudio(); setTimeout(() => playAudio(), 100); }
function startProgressUpdate() {
    progressInterval = setInterval(() => {
        const e = (Date.now() - startTime) / 1000, p = Math.min((e / estimatedDuration) * 100, 100);
        document.getElementById('progressFill').style.width = p + '%'; document.getElementById('currentTime').textContent = formatTime(e);
    }, 500);
}
function stopProgressUpdate() { if (progressInterval) clearInterval(progressInterval); }
function updateSpeedDisplay() { const v = parseFloat(document.getElementById('speedRange').value); document.getElementById('speedValue').textContent = v.toFixed(2) + 'x'; document.getElementById('speedDisplay').textContent = v.toFixed(1) + 'x'; }
function increaseSpeed() { const r = document.getElementById('speedRange'); if (parseFloat(r.value) < 3) { r.value = parseFloat(r.value) + 0.25; updateSpeedDisplay(); } }
function decreaseSpeed() { const r = document.getElementById('speedRange'); if (parseFloat(r.value) > 0.25) { r.value = parseFloat(r.value) - 0.25; updateSpeedDisplay(); } }
function updatePitchDisplay() { document.getElementById('pitchValue').textContent = parseFloat(document.getElementById('pitchRange').value).toFixed(1); }
function updateVolumeDisplay() { document.getElementById('volumeValue').textContent = Math.round(parseFloat(document.getElementById('volumeRange').value) * 100) + '%'; }
function formatTime(s) { const m = Math.floor(s / 60), sc = Math.floor(s % 60); return m + ':' + (sc < 10 ? '0' : '') + sc; }
function copyText() { const t = document.getElementById('textInput').value; if (!t) return; navigator.clipboard.writeText(t); alert('Copied!'); }
function clearText() { document.getElementById('textInput').value = ''; updateStats(); stopAudio(); }
function downloadText() {
    const t = document.getElementById('textInput').value; if (!t) return alert('No text!');
    const b = new Blob([t], { type: 'text/plain' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'TextToSpeech-OnlinePDFPro.txt'; a.click();
}
function addToHistory(t) {
    const p = t.substring(0, 50) + (t.length > 50 ? '...' : ''); const ex = history.findIndex(h => h.preview === p);
    if (ex > -1) history.splice(ex, 1); history.unshift({ preview: p, full: t, time: Date.now() }); if (history.length > 10) history.pop();
    localStorage.setItem('tts_history', JSON.stringify(history)); renderHistory();
}
function renderHistory() {
    const l = document.getElementById('historyList'); if (history.length === 0) { l.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px">No history yet.</p>'; return; }
    l.innerHTML = history.map((h, i) => '<div class="history-item"><span class="history-text">' + h.preview + '</span><button class="history-play" onclick="playFromHistory(' + i + ')">▶️ Play</button></div>').join('');
}
function playFromHistory(i) { document.getElementById('textInput').value = history[i].full; updateStats(); switchTab('text'); playAudio(); }

async function downloadAudio() {
    const text = document.getElementById('textInput').value.trim();
    if (!text) return alert('Please enter some text first!');

    const btn = document.getElementById('dlAudioBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Generating MP3...';
    btn.disabled = true;

    try {
        // We use Google Translate TTS API for downloading audio since SpeechSynthesis cannot be saved
        // URL has a 200 char limit for 'q', so we must chunk
        const langCode = document.getElementById('langFilter').value !== 'all' ? document.getElementById('langFilter').value : 'en';

        // Chunk by sentences, keeping under ~150 chars
        const chunks = [];
        let current = '';
        const words = text.split(' ');

        for (let word of words) {
            if ((current + ' ' + word).length < 150) {
                current += (current ? ' ' : '') + word;
            } else {
                if (current) chunks.push(current);
                current = word;
            }
        }
        if (current) chunks.push(current);

        // Fetch all audio chunks
        const audioBuffers = [];
        for (let i = 0; i < chunks.length; i++) {
            btn.innerHTML = `⏳ Part ${i + 1}/${chunks.length}...`;
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodeURIComponent(chunks[i])}`;
            // Use CodeTabs to bypass CORS for binary audio data
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error('API failed');
            const arrayBuffer = await res.arrayBuffer();
            audioBuffers.push(arrayBuffer);
            await new Promise(r => setTimeout(r, 400)); // anti-rate-limit
        }

        // Concatenate all ArrayBuffers
        const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of audioBuffers) {
            combined.set(new Uint8Array(buf), offset);
            offset += buf.byteLength;
        }

        // Create Blob and Download
        const blob = new Blob([combined], { type: 'audio/mpeg' });
        const urlObj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlObj;
        a.download = `Audio-${langCode}-OnlinePDFPro.mp3`;
        a.click();

        btn.innerHTML = '✅ Saved MP3!';
        setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);

    } catch (e) {
        console.error(e);
        alert('Failed to generate audio directly. Please try shorter text.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

renderHistory(); updateStats();
