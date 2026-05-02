/**
 * OnlinePDFPro - Main Application JavaScript
 * All document processing happens client-side - no server uploads
 */

// =========================================
// Theme Management (Dark/Light Mode)
// =========================================

const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('doctools-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (prefersDark) {
            this.setTheme('dark');
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('doctools-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Theme toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('doctools-theme', theme);
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        this.setTheme(current === 'dark' ? 'light' : 'dark');
    }
};

// =========================================
// Mobile Menu & Global UI
// =========================================

const MobileMenu = {
    init() {
        const menuToggle = document.getElementById('menuToggle');
        const nav = document.getElementById('nav');

        if (menuToggle && nav) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = nav.classList.toggle('active');
                menuToggle.textContent = isOpen ? '✕' : '☰';
                menuToggle.classList.toggle('open', isOpen);
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                    nav.classList.remove('active');
                    menuToggle.textContent = '☰';
                    menuToggle.classList.remove('open');
                }
            });

            // Close on nav link click (except install link)
            nav.querySelectorAll('.nav-link:not(.pwa-install-link)').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('active');
                    menuToggle.textContent = '☰';
                    menuToggle.classList.remove('open');
                });
            });
        }


        // FAQ Accordion
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length > 0) {
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                if (question) {
                    question.addEventListener('click', () => {
                        const isActive = item.classList.contains('active');

                        // Close all others
                        faqItems.forEach(i => i.classList.remove('active'));

                        // Toggle current
                        if (!isActive) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }

        // Global Search Setup
        const globalSearch = document.getElementById('globalToolSearch');
        if (globalSearch) {
            globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const q = e.target.value.trim();
                    if (q) {
                        const isToolsDir = window.location.pathname.includes('/tools/');
                        const targetUrl = isToolsDir ? `../tools.html?q=${encodeURIComponent(q)}` : `tools.html?q=${encodeURIComponent(q)}`;
                        window.location.href = targetUrl;
                    }
                }
            });
        }

        // Mobile Search Toggle
        const mobileSearchToggle = document.getElementById('mobileSearchToggle');
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const mobileSearchClose = document.getElementById('mobileSearchClose');
        const mobileToolSearch = document.getElementById('mobileToolSearch');

        if (mobileSearchToggle && mobileSearchBar) {
            mobileSearchToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileSearchBar.classList.toggle('active');
                if (mobileSearchBar.classList.contains('active') && mobileToolSearch) {
                    setTimeout(() => mobileToolSearch.focus(), 100);
                }
            });

            if (mobileSearchClose) {
                mobileSearchClose.addEventListener('click', () => {
                    mobileSearchBar.classList.remove('active');
                });
            }

            if (mobileToolSearch) {
                mobileToolSearch.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const q = e.target.value.trim();
                        if (q) {
                            const isToolsDir = window.location.pathname.includes('/tools/');
                            const targetUrl = isToolsDir ? `../tools.html?q=${encodeURIComponent(q)}` : `tools.html?q=${encodeURIComponent(q)}`;
                            window.location.href = targetUrl;
                        }
                    }
                });
            }

            // Close search bar when clicking outside
            document.addEventListener('click', (e) => {
                if (mobileSearchBar.classList.contains('active') &&
                    !mobileSearchBar.contains(e.target) &&
                    !mobileSearchToggle.contains(e.target)) {
                    mobileSearchBar.classList.remove('active');
                }
            });
        }
    }
};

// =========================================
// File Upload Handler
// =========================================

const FileUploader = {
    init(uploadZoneId, options = {}) {
        const zone = document.getElementById(uploadZoneId);
        if (!zone) return null;

        const config = {
            accept: options.accept || '*/*',
            multiple: options.multiple || false,
            onFilesSelected: options.onFilesSelected || (() => { }),
            maxSize: options.maxSize || 100 * 1024 * 1024,
            maxFiles: options.maxFiles || 100
        };

        const input = document.createElement('input');
        input.type = 'file';
        input.className = 'file-input';
        input.accept = config.accept;
        input.multiple = config.multiple;
        input.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';
        zone.style.position = 'relative';
        zone.appendChild(input);

        zone.addEventListener('click', (e) => {
            if (e.target !== input) {
                input.click();
            }
        });

        input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, config);
            input.value = '';
        });

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files, config);
        });

        return { zone, input, config };
    },

    handleFiles(fileList, config) {
        const files = Array.from(fileList);
        if (files.length > config.maxFiles) {
            alert(`Maximum ${config.maxFiles} files allowed`);
            return;
        }
        const validFiles = files.filter(file => {
            if (file.size > config.maxSize) {
                alert(`${file.name} is too large. Maximum size is ${this.formatSize(config.maxSize)}`);
                return false;
            }
            return true;
        });
        if (validFiles.length > 0) {
            if (window.OnlinePDFPro) {
                window.OnlinePDFPro._currentFiles = validFiles.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type
                }));
            }
            config.onFilesSelected(validFiles);
        }
    },

    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// =========================================
// Progress Handler
// =========================================

const ProgressHandler = {
    create(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        container.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div><div class="progress-text"><span class="progress-status">Ready</span><span class="progress-percent">0%</span></div>`;
        return {
            update(percent, status = '') {
                const fill = container.querySelector('.progress-fill');
                const percentText = container.querySelector('.progress-percent');
                const statusText = container.querySelector('.progress-status');
                fill.style.width = `${percent}%`;
                percentText.textContent = `${Math.round(percent)}%`;
                if (status) statusText.textContent = status;
            },
            complete(status = 'Complete') { this.update(100, status); },
            reset() { this.update(0, 'Ready'); }
        };
    }
};

// =========================================
// Recently Used Tools
// =========================================

const RecentlyUsed = {
    KEY: 'doctools-recent',
    MAX_ITEMS: 6,
    get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
    add(toolId, toolName) {
        let recent = this.get();
        recent = recent.filter(item => item.id !== toolId);
        recent.unshift({ id: toolId, name: toolName, timestamp: Date.now() });
        recent = recent.slice(0, this.MAX_ITEMS);
        localStorage.setItem(this.KEY, JSON.stringify(recent));
    },
    clear() { localStorage.removeItem(this.KEY); }
};

// =========================================
// Auto-Clear Timer
// =========================================

const AutoClear = {
    timers: [],
    start(seconds, onComplete, displayElement) {
        let remaining = seconds;
        const update = () => {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            if (displayElement) displayElement.textContent = `Files will be cleared in ${mins}:${secs.toString().padStart(2, '0')}`;
            if (remaining <= 0) { onComplete(); return; }
            remaining--;
            const timerId = setTimeout(update, 1000);
            this.timers.push(timerId);
        };
        update();
    },
    clearAll() { this.timers.forEach(id => clearTimeout(id)); this.timers = []; }
};

// =========================================
// History Database (IndexedDB)
// =========================================

const HistoryDB = {
    DB_NAME: 'OnlinePDFPro-History-v2',
    DB_VERSION: 1,
    STORE_NAME: 'files',
    _db: null,
    _initPromise: null,
    async init() {
        if (this._db) return this._db;
        if (this._initPromise) return this._initPromise;
        this._initPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
                        store.createIndex('date', 'date', { unique: false });
                        store.createIndex('tool', 'tool', { unique: false });
                    }
                };
                request.onsuccess = (e) => {
                    this._db = e.target.result;
                    resolve(this._db);
                };
                request.onerror = (e) => reject(e.target.error);
            } catch (err) { reject(err); }
        });
        return this._initPromise;
    },
    _getToolName() {
        const titleEl = document.querySelector('.tool-title');
        if (titleEl) return titleEl.textContent.split('\u2014')[0].split('\u2013')[0].split('—')[0].split('–')[0].trim();
        return document.title.split('|')[0].trim() || 'Unknown Tool';
    },
    async saveEntry(blob, filename, originalFiles = null) {
        try {
            const db = await this.init();
            if (!db) return;
            const entry = {
                filename: filename,
                tool: this._getToolName(),
                size: blob.size,
                type: blob.type || 'application/octet-stream',
                date: new Date().toISOString(),
                blob: blob,
                originalFiles: originalFiles || (window.OnlinePDFPro ? window.OnlinePDFPro._currentFiles : null)
            };
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.add(entry);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (err) { console.warn('[HistoryDB] Save failed:', err); }
    },
    async getAll() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result.sort((a, b) => new Date(b.date) - new Date(a.date)));
                req.onerror = () => reject(req.error);
            });
        } catch (err) { return []; }
    },
    async getFile(id) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (err) { return null; }
    },
    async deleteEntry(id) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (err) { console.warn('[HistoryDB] Delete failed:', err); }
    },
    async clearAll() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (err) { console.warn('[HistoryDB] Clear failed:', err); }
    },
    async getStorageUsage() {
        try {
            const entries = await this.getAll();
            const bytes = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
            return { bytes, count: entries.length };
        } catch (err) { return { bytes: 0, count: 0 }; }
    }
};

// =========================================
// Download Helper (with Rename Modal)
// =========================================

const Downloader = {
    _lastBlob: null,
    _lastName: null,
    _cssInjected: false,
    _injectCSS() {
        if (this._cssInjected) return;
        this._cssInjected = true;
        const style = document.createElement('style');
        style.textContent = `
            .rename-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10100; display: flex; align-items: flex-end; justify-content: center; opacity: 0; transition: opacity 0.3s ease; font-family: 'Inter', sans-serif; }
            .rename-overlay.active { opacity: 1; }
            .rename-sheet { background: var(--surface-1, #fff); width: 100%; max-width: 480px; border-radius: 20px 20px 0 0; padding: 28px 24px 32px; transform: translateY(100%); transition: transform 0.35s cubic-bezier(.22,1,.36,1); box-shadow: 0 -10px 40px rgba(0,0,0,0.15); }
            .rename-overlay.active .rename-sheet { transform: translateY(0); }
            .rename-sheet-title { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; color: var(--text-primary, #1a1a2e); margin-bottom: 20px; }
            .rename-input-wrap { display: flex; align-items: center; gap: 0; border: 2px solid var(--border, #e2e8f0); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; background: var(--surface-2, #f8fafc); }
            .rename-input-wrap:focus-within { border-color: var(--accent, #2563eb); }
            .rename-input-name { flex: 1; border: none; outline: none; padding: 14px 16px; font-size: 1rem; font-weight: 500; background: transparent; color: var(--text-primary, #1a1a2e); min-width: 0; }
            .rename-input-ext { padding: 14px 16px 14px 0; font-size: 1rem; font-weight: 600; color: var(--text-secondary, #64748b); white-space: nowrap; user-select: none; background: transparent; }
            .rename-actions { display: flex; gap: 10px; margin-top: 18px; }
            .rename-dl-btn { flex: 1; padding: 14px; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; background: var(--accent, #2563eb); color: white; transition: all 0.2s; box-shadow: 0 6px 20px rgba(37,99,235,0.3); }
            .rename-cancel-btn { padding: 14px 20px; border: 2px solid var(--border, #e2e8f0); border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; background: transparent; color: var(--text-primary, #1a1a2e); transition: all 0.2s; }
            @media (min-width: 600px) { .rename-sheet { border-radius: 20px; margin-bottom: 40px; } .rename-overlay { align-items: center; } }
        `;
        document.head.appendChild(style);
    },
    saveBlob(blob, filename, originalFiles = null) {
        this._injectCSS();
        const dotIdx = filename.lastIndexOf('.');
        const baseName = dotIdx > 0 ? filename.substring(0, dotIdx) : filename;
        const ext = dotIdx > 0 ? filename.substring(dotIdx) : '';
        const overlay = document.createElement('div');
        overlay.className = 'rename-overlay';
        overlay.innerHTML = `<div class="rename-sheet"><div class="rename-sheet-title"><span>📄</span> Save File</div><div class="rename-input-wrap"><input type="text" class="rename-input-name" id="renameInputName" value="${baseName.replace(/"/g, '&quot;')}" spellcheck="false" autocomplete="off"><span class="rename-input-ext">${ext}</span></div><div class="rename-actions"><button class="rename-cancel-btn" id="renameCancelBtn">Cancel</button><button class="rename-dl-btn" id="renameDlBtn">⬇ Download</button></div></div>`;
        document.body.appendChild(overlay);
        const nameInput = overlay.querySelector('#renameInputName');
        const dlBtn = overlay.querySelector('#renameDlBtn');
        const cancelBtn = overlay.querySelector('#renameCancelBtn');
        requestAnimationFrame(() => overlay.classList.add('active'));
        setTimeout(() => { nameInput.focus(); nameInput.select(); }, 350);
        const doDownload = () => {
            const finalName = (nameInput.value.trim() || baseName) + ext;
            overlay.classList.remove('active');
            setTimeout(() => { overlay.remove(); this._directSave(blob, finalName, originalFiles); }, 300);
        };
        dlBtn.addEventListener('click', doDownload);
        cancelBtn.addEventListener('click', () => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 300); });
        nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doDownload(); });
    },
    _directSave(blob, filename, originalFiles) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        HistoryDB.saveEntry(blob, filename, originalFiles).catch(() => {});
        this._showShareToast(blob, filename);
    },
    _showShareToast(blob, filename) {
        const existing = document.getElementById('shareFileToast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'shareFileToast';
        toast.innerHTML = `<div style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%) translateY(100px); background: #10b981; color: white; padding: 12px 24px; border-radius: 14px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 8px 30px rgba(16,185,129,0.4); z-index: 10001; display: flex; align-items: center; gap: 12px; cursor: pointer; opacity: 0; transition: all 0.4s ease;" id="shareFileToastInner"><span>📤</span><span>Share this file</span><button style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 8px;" id="shareToastClose">✕</button></div>`;
        document.body.appendChild(toast);
        const inner = document.getElementById('shareFileToastInner');
        requestAnimationFrame(() => { inner.style.opacity = '1'; inner.style.transform = 'translateX(-50%) translateY(0)'; });
        inner.addEventListener('click', (e) => { if (e.target.id !== 'shareToastClose') FileSharer.share(blob, filename); });
        document.getElementById('shareToastClose').addEventListener('click', () => { toast.remove(); });
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 15000);
    }
};

// =========================================
// Utility Functions
// =========================================

const Utils = {
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    getFileExtension(f) { return f.slice((f.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase(); },
    debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
};

// =========================================
// Global UI Components
// =========================================

const LoadingSpinner = {
    _el: null,
    show(m = 'Processing...') {
        if (!this._el) {
            this._el = document.createElement('div'); this._el.className = 'loading-overlay';
            this._el.innerHTML = `<div class="loading-box"><div class="loading-spinner"></div><p></p></div>`;
            document.body.appendChild(this._el);
        }
        this._el.querySelector('p').textContent = m;
        requestAnimationFrame(() => this._el.classList.add('active'));
    },
    hide() { if (this._el) this._el.classList.remove('active'); }
};

const Toast = {
    show(m, d = 3000) {
        let t = document.querySelector('.toast') || document.createElement('div');
        t.className = 'toast'; t.textContent = m; document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => t.classList.remove('show'), d);
    }
};

// =========================================
// Service Worker Registration
// =========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('[SW] Failed:', err));
    });
}

// =========================================
// PWA Install Manager (NEW)
// =========================================

const PwaInstallManager = {
    deferredPrompt: null,
    installBanner: null,
    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); this.deferredPrompt = e;
            if (!sessionStorage.getItem('pwa-dismissed')) this.showInstallBanner();
        });
        window.addEventListener('appinstalled', () => {
            this.hideInstallBanner(); this.deferredPrompt = null;
            Analytics.track('pwa_installed');
            Toast.show('✅ App installed successfully!');
        });
        this.checkIfInstalled();
    },
    checkIfInstalled() {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            document.querySelectorAll('.pwa-install-link, #pwaNavInstall').forEach(l => l.style.display = 'none');
        }
    },
    showInstallBanner() {
        if (this.installBanner) return;
        this.installBanner = document.createElement('div');
        this.installBanner.id = 'pwaInstallBanner';
        this.installBanner.innerHTML = `<div class="pwa-banner-content"><div class="pwa-banner-info"><img src="/logo.jpg" class="pwa-banner-icon"><div class="pwa-banner-text"><strong>Install OnlinePDFPro</strong><span>Fast, private, and works offline</span></div></div><div class="pwa-banner-actions"><button class="pwa-install-btn" id="pwaBannerInstall">Install</button><button class="pwa-close-btn" id="pwaBannerClose">✕</button></div></div>`;
        document.body.appendChild(this.installBanner);
        this.injectBannerCSS();
        document.getElementById('pwaBannerInstall').addEventListener('click', () => this.triggerInstall());
        document.getElementById('pwaBannerClose').addEventListener('click', () => { this.hideInstallBanner(); sessionStorage.setItem('pwa-dismissed', 'true'); });
    },
    hideInstallBanner() { if (this.installBanner) { this.installBanner.classList.add('hiding'); setTimeout(() => { if (this.installBanner) { this.installBanner.remove(); this.installBanner = null; } }, 400); } },
    injectBannerCSS() {
        if (document.getElementById('pwaStyles')) return;
        const s = document.createElement('style'); s.id = 'pwaStyles';
        s.textContent = `
            #pwaInstallBanner { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 95%; max-width: 450px; z-index: 9999; background: var(--surface-1, #fff); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border: 1px solid var(--border); animation: pwaUp 0.5s ease; padding: 12px 16px; }
            #pwaInstallBanner.hiding { animation: pwaDown 0.4s forwards; }
            .pwa-banner-content { display: flex; align-items: center; justify-content: space-between; }
            .pwa-banner-info { display: flex; align-items: center; gap: 12px; }
            .pwa-banner-icon { width: 44px; height: 44px; border-radius: 10px; }
            .pwa-banner-text { display: flex; flex-direction: column; }
            .pwa-banner-text strong { font-size: 0.95rem; color: var(--text-primary); }
            .pwa-banner-text span { font-size: 0.8rem; color: var(--text-secondary); }
            .pwa-install-btn { background: var(--accent, #2563eb); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
            .pwa-close-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 5px; font-size: 1.2rem; }
            @keyframes pwaUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
            @keyframes pwaDown { to { transform: translateX(-50%) translateY(100px); opacity: 0; } }
        `;
        document.head.appendChild(s);
    },
    async triggerInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null; this.hideInstallBanner();
        } else { this.showInstructions(); }
    },
    showInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const steps = isIOS ? `<li>Tap <strong>Share</strong> ⎋</li><li>Tap <strong>Add to Home Screen</strong> ⊞</li>` : `<li>Tap <strong>Menu</strong> ⋮</li><li>Tap <strong>Install App</strong></li>`;
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10005;display:flex;align-items:center;justify-content:center;';
        div.innerHTML = `<div style="background:var(--surface-1);padding:30px;border-radius:20px;max-width:350px;width:90%;"><h3>Install App</h3><ol style="line-height:2">${steps}</ol><button id="pwaCloseIns" style="width:100%;padding:12px;background:var(--accent);color:white;border:none;border-radius:10px;margin-top:20px;cursor:pointer">Got it!</button></div>`;
        document.body.appendChild(div);
        document.getElementById('pwaCloseIns').onclick = () => div.remove();
    },
    suggestInstall() {
        const count = parseInt(localStorage.getItem('onlinepdfpro_usage') || '0');
        if ([2, 5, 10].includes(count)) {
            setTimeout(() => { Toast.show('🚀 Pro tip: Install the app for faster access!'); if (this.deferredPrompt) this.showInstallBanner(); }, 2000);
        }
    }
};
PwaInstallManager.init();
function triggerPwaInstall(e) { if (e) e.preventDefault(); PwaInstallManager.triggerInstall(); }

// =========================================
// Language Selector (IMPROVED)
// =========================================

const LanguageSelector = {
    languages: [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'it', name: 'Italian', native: 'Italiano' },
        { code: 'pt', name: 'Portuguese', native: 'Português' },
        { code: 'ru', name: 'Russian', native: 'Русский' },
        { code: 'zh-CN', name: 'Chinese', native: '简体中文' },
        { code: 'ja', name: 'Japanese', native: '日本語' },
        { code: 'ko', name: 'Korean', native: '한국어' },
        { code: 'ar', name: 'Arabic', native: 'العربية' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা' },
        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
        { code: 'ur', name: 'Urdu', native: 'اردو' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు' },
        { code: 'mr', name: 'Marathi', native: 'मराठी' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം' }
    ],
    init() {
        const container = document.querySelector('.lang-selector'); if (!container) return;
        const btn = container.querySelector('.lang-btn');
        const dropdown = container.querySelector('.lang-dropdown');
        const list = container.querySelector('.lang-list');
        const search = container.querySelector('.lang-search');

        this.renderList(list, this.languages);
        btn.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); if (search) search.focus(); };
        if (search) {
            search.oninput = (e) => {
                const q = e.target.value.toLowerCase();
                const filtered = this.languages.filter(l => l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q));
                this.renderList(list, filtered);
            };
        }
        document.addEventListener('click', () => dropdown.classList.remove('open'));
        this.loadGoogleTranslate();
    },
    renderList(list, langs) {
        const current = localStorage.getItem('doctools-lang') || 'en';
        list.innerHTML = langs.map(l => `<li class="lang-item ${l.code === current ? 'active' : ''}" data-code="${l.code}"><span>${l.name}</span><small>${l.native}</small></li>`).join('');
        list.querySelectorAll('.lang-item').forEach(i => {
            i.onclick = () => { this.setLanguage(i.dataset.code); window.location.reload(); };
        });
    },
    setLanguage(code) { localStorage.setItem('doctools-lang', code); },
    loadGoogleTranslate() {
        const div = document.createElement('div'); div.id = 'google_translate_element'; div.style.display = 'none'; document.body.appendChild(div);
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
            const saved = localStorage.getItem('doctools-lang');
            if (saved && saved !== 'en') setTimeout(() => { const s = document.querySelector('.goog-te-combo'); if (s) { s.value = saved; s.dispatchEvent(new Event('change')); } }, 1000);
        };
        const s = document.createElement('script'); s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; s.async = true; document.head.appendChild(s);
    }
};

// =========================================
// Feedback Handler
// =========================================

const FeedbackHandler = {
    init() {
        const btns = document.querySelectorAll('.feedback-widget');
        btns.forEach(b => b.onclick = () => this.open());
    },
    open() {
        const target = 'support@onlinepdfpro.com';
        const div = document.createElement('div'); div.className = 'feedback-overlay active';
        div.innerHTML = `<div class="feedback-modal"><button class="feedback-close">&times;</button><h3>Send Feedback</h3><form action="https://formsubmit.co/${target}" method="POST"><input type="hidden" name="_next" value="${window.location.href}"><input type="text" name="name" placeholder="Name"><input type="email" name="email" placeholder="Email"><textarea name="message" placeholder="Message" required></textarea><button type="submit" class="feedback-submit">Send</button></form></div>`;
        document.body.appendChild(div);
        div.querySelector('.feedback-close').onclick = () => div.remove();
        div.onclick = (e) => { if (e.target === div) div.remove(); };
    }
};

// =========================================
// DOM Initialization
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileMenu.init();
    LanguageSelector.init();
    FeedbackHandler.init();
    RecentlyUsedUI.render();
    ToolReset.init();
    
    // Auto-track tool
    const toolPage = document.querySelector('.tool-page');
    if (toolPage) {
        const t = document.querySelector('.tool-title');
        if (t) {
            const name = t.textContent.split('—')[0].trim();
            const id = window.location.pathname.split('/').pop().replace('.html', '');
            RecentlyUsed.add(id, name);
        }
    }
});

// =========================================
// UI Renderers & Tools
// =========================================

const RecentlyUsedUI = {
    render() {
        const target = document.getElementById('recentlyUsedTools') || document.querySelector('.recently-used-placeholder');
        if (!target) return;
        const recent = RecentlyUsed.get();
        if (recent.length === 0) return;
        const prefix = window.location.pathname.includes('/tools/') ? '../' : '';
        target.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;">${recent.map(r => `<a href="${prefix}tools/${r.id}.html" style="padding:10px 15px;background:var(--surface-1);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text-primary);font-size:14px;font-weight:600;">${r.name}</a>`).join('')}</div>`;
    }
};

const ToolReset = {
    init() {
        if (!document.querySelector('.tool-page')) return;
        window.onpopstate = (e) => { if (e.state && e.state.snapshot) this._restore(e.state.snapshot); };
    },
    pushStep() { history.pushState({ snapshot: this._take() }, ''); },
    _take() {
        const snap = {};
        document.querySelectorAll('.tool-page [id]').forEach(el => snap[el.id] = el.style.display);
        return snap;
    },
    _restore(snap) {
        Object.keys(snap).forEach(id => { const el = document.getElementById(id); if (el) el.style.display = snap[id]; });
    }
};

const Analytics = {
    track(name, p = {}) { if (typeof gtag === 'function') gtag('event', name, p); console.log('[Analytics]', name, p); },
    trackTool(n) { this.track('tool_use', { name: n }); }
};

const FileSharer = {
    share(blob, filename) {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: filename }).catch(() => Downloader._directSave(blob, filename));
        } else { Downloader._directSave(blob, filename); }
    }
};

// =========================================
// Exports
// =========================================

const _exports = {
    ThemeManager, MobileMenu, LanguageSelector, FileUploader, ProgressHandler, RecentlyUsed, RecentlyUsedUI, AutoClear, Downloader, Utils, LoadingSpinner, Toast, Analytics, ToolReset, FileSharer, HistoryDB, PwaInstallManager
};
window.OnlinePDFPro = _exports;
window.DocTools = _exports;
