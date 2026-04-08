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
// Mobile Menu
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
                        // Redirect to tools.html with query parameter
                        // Determine base path depending on if we are in /tools or root
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
            maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB default
            maxFiles: options.maxFiles || 100
        };

        // Create hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.className = 'file-input';
        input.accept = config.accept;
        input.multiple = config.multiple;
        input.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';
        zone.style.position = 'relative';
        zone.appendChild(input);

        // Click to upload
        zone.addEventListener('click', (e) => {
            if (e.target !== input) {
                input.click();
            }
        });

        // File input change
        input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, config);
            input.value = ''; // Reset for same file selection
        });

        // Drag and drop
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

        // Validate file count
        if (files.length > config.maxFiles) {
            alert(`Maximum ${config.maxFiles} files allowed`);
            return;
        }

        // Validate file sizes and filter
        const validFiles = files.filter(file => {
            if (file.size > config.maxSize) {
                alert(`${file.name} is too large. Maximum size is ${this.formatSize(config.maxSize)}`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
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

        container.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">
                <span class="progress-status">Ready</span>
                <span class="progress-percent">0%</span>
            </div>
        `;

        return {
            update(percent, status = '') {
                const fill = container.querySelector('.progress-fill');
                const percentText = container.querySelector('.progress-percent');
                const statusText = container.querySelector('.progress-status');

                fill.style.width = `${percent}%`;
                percentText.textContent = `${Math.round(percent)}%`;
                if (status) statusText.textContent = status;
            },

            complete(status = 'Complete') {
                this.update(100, status);
            },

            reset() {
                this.update(0, 'Ready');
            }
        };
    }
};

// =========================================
// Recently Used Tools
// =========================================

const RecentlyUsed = {
    KEY: 'doctools-recent',
    MAX_ITEMS: 6,

    get() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY)) || [];
        } catch {
            return [];
        }
    },

    add(toolId, toolName) {
        let recent = this.get();

        // Remove if already exists
        recent = recent.filter(item => item.id !== toolId);

        // Add to beginning
        recent.unshift({ id: toolId, name: toolName, timestamp: Date.now() });

        // Limit to max items
        recent = recent.slice(0, this.MAX_ITEMS);

        localStorage.setItem(this.KEY, JSON.stringify(recent));
    },

    clear() {
        localStorage.removeItem(this.KEY);
    }
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

            if (displayElement) {
                displayElement.textContent = `Files will be cleared in ${mins}:${secs.toString().padStart(2, '0')}`;
            }

            if (remaining <= 0) {
                onComplete();
                return;
            }

            remaining--;
            const timerId = setTimeout(update, 1000);
            this.timers.push(timerId);
        };

        update();
    },

    clearAll() {
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];
    }
};

// =========================================
// History Database (IndexedDB)
// =========================================

const HistoryDB = {
    DB_NAME: 'pdfpro-history',
    DB_VERSION: 1,
    STORE_NAME: 'files',
    _db: null,

    async init() {
        if (this._db) return this._db;
        return new Promise((resolve, reject) => {
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
            request.onerror = (e) => {
                console.warn('[HistoryDB] Failed to open:', e.target.error);
                reject(e.target.error);
            };
        });
    },

    _getToolName() {
        const titleEl = document.querySelector('.tool-title');
        if (titleEl) {
            return titleEl.textContent.split('\u2014')[0].split('\u2013')[0].trim();
        }
        const pageTitle = document.title.split('|')[0].split('\u2014')[0].trim();
        return pageTitle || 'Unknown Tool';
    },

    async saveEntry(blob, filename) {
        try {
            const db = await this.init();
            const tool = this._getToolName();
            const entry = {
                filename: filename,
                tool: tool,
                size: blob.size,
                type: blob.type || 'application/octet-stream',
                date: new Date().toISOString(),
                blob: blob
            };
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readwrite');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.add(entry);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            console.warn('[HistoryDB] Save failed:', err);
        }
    },

    async getAll() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.getAll();
                req.onsuccess = () => {
                    const results = req.result || [];
                    results.sort((a, b) => new Date(b.date) - new Date(a.date));
                    resolve(results);
                };
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            console.warn('[HistoryDB] GetAll failed:', err);
            return [];
        }
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
        } catch (err) {
            console.warn('[HistoryDB] GetFile failed:', err);
            return null;
        }
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
        } catch (err) {
            console.warn('[HistoryDB] Delete failed:', err);
        }
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
        } catch (err) {
            console.warn('[HistoryDB] Clear failed:', err);
        }
    },

    async getStorageUsage() {
        try {
            const entries = await this.getAll();
            let totalBytes = 0;
            entries.forEach(e => { totalBytes += e.size || 0; });
            return { count: entries.length, bytes: totalBytes };
        } catch (err) {
            return { count: 0, bytes: 0 };
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

// Auto-init HistoryDB on page load
if (typeof indexedDB !== 'undefined') {
    HistoryDB.init().catch(() => {});
}

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
            .rename-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                z-index: 10100; display: flex; align-items: flex-end; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease;
                font-family: 'Inter', sans-serif;
            }
            .rename-overlay.active { opacity: 1; }
            .rename-sheet {
                background: var(--surface-1, #fff); width: 100%; max-width: 480px;
                border-radius: 20px 20px 0 0; padding: 28px 24px 32px;
                transform: translateY(100%); transition: transform 0.35s cubic-bezier(.22,1,.36,1);
                box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
            }
            .rename-overlay.active .rename-sheet { transform: translateY(0); }
            .rename-sheet-title {
                display: flex; align-items: center; gap: 10px;
                font-size: 1.1rem; font-weight: 700; color: var(--text-primary, #1a1a2e);
                margin-bottom: 20px;
            }
            .rename-sheet-title span { font-size: 1.4rem; }
            .rename-input-wrap {
                display: flex; align-items: center; gap: 0;
                border: 2px solid var(--border, #e2e8f0); border-radius: 12px;
                overflow: hidden; transition: border-color 0.2s;
                background: var(--surface-2, #f8fafc);
            }
            .rename-input-wrap:focus-within { border-color: var(--accent, #2563eb); }
            .rename-input-name {
                flex: 1; border: none; outline: none; padding: 14px 16px;
                font-size: 1rem; font-weight: 500; background: transparent;
                color: var(--text-primary, #1a1a2e); min-width: 0;
            }
            .rename-input-ext {
                padding: 14px 16px 14px 0; font-size: 1rem; font-weight: 600;
                color: var(--text-secondary, #64748b); white-space: nowrap;
                user-select: none; background: transparent;
            }
            .rename-actions {
                display: flex; gap: 10px; margin-top: 18px;
            }
            .rename-dl-btn {
                flex: 1; padding: 14px; border: none; border-radius: 12px;
                font-size: 1rem; font-weight: 700; cursor: pointer;
                background: linear-gradient(135deg, #2563eb, #7c3aed);
                color: white; transition: all 0.2s;
                box-shadow: 0 6px 20px rgba(37,99,235,0.3);
            }
            .rename-dl-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(37,99,235,0.4); }
            .rename-cancel-btn {
                padding: 14px 20px; border: 2px solid var(--border, #e2e8f0);
                border-radius: 12px; font-size: 1rem; font-weight: 600;
                cursor: pointer; background: transparent;
                color: var(--text-primary, #1a1a2e); transition: all 0.2s;
            }
            .rename-cancel-btn:hover { background: var(--surface-2, #f1f5f9); }
            @media (min-width: 600px) {
                .rename-sheet { border-radius: 20px; margin-bottom: 40px; }
                .rename-overlay { align-items: center; }
            }
        `;
        document.head.appendChild(style);
    },

    saveBlob(blob, filename) {
        this._injectCSS();

        // Store for share functionality
        this._lastBlob = blob;
        this._lastName = filename;

        // Split filename into name and extension
        const dotIdx = filename.lastIndexOf('.');
        const baseName = dotIdx > 0 ? filename.substring(0, dotIdx) : filename;
        const ext = dotIdx > 0 ? filename.substring(dotIdx) : '';

        // Build overlay
        const overlay = document.createElement('div');
        overlay.className = 'rename-overlay';
        overlay.innerHTML = `
            <div class="rename-sheet">
                <div class="rename-sheet-title">
                    <span>📄</span> Save File
                </div>
                <div class="rename-input-wrap">
                    <input type="text" class="rename-input-name" id="renameInputName" value="${baseName.replace(/"/g, '&quot;')}" spellcheck="false" autocomplete="off">
                    <span class="rename-input-ext">${ext}</span>
                </div>
                <div class="rename-actions">
                    <button class="rename-cancel-btn" id="renameCancelBtn">Cancel</button>
                    <button class="rename-dl-btn" id="renameDlBtn">⬇ Download</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const nameInput = overlay.querySelector('#renameInputName');
        const dlBtn = overlay.querySelector('#renameDlBtn');
        const cancelBtn = overlay.querySelector('#renameCancelBtn');

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('active'));

        // Focus & select input
        setTimeout(() => { nameInput.focus(); nameInput.select(); }, 350);

        const doDownload = () => {
            const finalName = (nameInput.value.trim() || baseName) + ext;
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                this._directSave(blob, finalName);
            }, 300);
        };

        const doCancel = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };

        dlBtn.addEventListener('click', doDownload);
        cancelBtn.addEventListener('click', doCancel);

        // Enter to download
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); doDownload(); }
            if (e.key === 'Escape') { e.preventDefault(); doCancel(); }
        });

        // Click overlay backdrop to cancel
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) doCancel();
        });
    },

    _directSave(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Save to history (non-blocking)
        if (typeof indexedDB !== 'undefined') {
            HistoryDB.saveEntry(blob, filename).catch(() => {});
        }

        // Show share floating button
        this._showShareToast(blob, filename);
    },

    _showShareToast(blob, filename) {
        // Remove existing share toast
        const existing = document.getElementById('shareFileToast');
        if (existing) existing.remove();

        // Determine MIME type from filename
        const ext = filename.split('.').pop().toLowerCase();
        const mimeMap = {
            pdf: 'application/pdf',
            zip: 'application/zip',
            txt: 'text/plain',
            csv: 'text/csv',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp'
        };
        const mimeType = mimeMap[ext] || 'application/octet-stream';

        const toast = document.createElement('div');
        toast.id = 'shareFileToast';
        toast.innerHTML = `
            <div style="
                position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%) translateY(100px);
                background: linear-gradient(135deg, #10b981, #059669); color: white;
                padding: 12px 24px; border-radius: 14px; font-weight: 600; font-size: 0.95rem;
                box-shadow: 0 8px 30px rgba(16,185,129,0.4); z-index: 10001;
                display: flex; align-items: center; gap: 12px; cursor: pointer;
                opacity: 0; transition: all 0.4s ease; font-family: 'Inter', sans-serif;
                max-width: 90vw;
            " id="shareFileToastInner">
                <span style="font-size: 1.3rem;">📤</span>
                <span>Share this file</span>
                <button style="
                    background: rgba(255,255,255,0.2); border: none; color: white;
                    padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
                    margin-left: 8px;
                " id="shareToastClose">✕</button>
            </div>
        `;
        document.body.appendChild(toast);

        const inner = document.getElementById('shareFileToastInner');
        const closeBtn = document.getElementById('shareToastClose');

        // Animate in
        requestAnimationFrame(() => {
            inner.style.opacity = '1';
            inner.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Click to share
        inner.addEventListener('click', (e) => {
            if (e.target === closeBtn) return;
            FileSharer.share(blob, filename, mimeType);
        });

        // Close button
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            inner.style.opacity = '0';
            inner.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 400);
        });

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (document.getElementById('shareFileToast')) {
                inner.style.opacity = '0';
                inner.style.transform = 'translateX(-50%) translateY(100px)';
                setTimeout(() => toast.remove(), 400);
            }
        }, 15000);
    },

    async saveAsZip(files, zipName = 'doctools-download.zip') {
        // Will be implemented when JSZip is loaded
        if (typeof JSZip === 'undefined') {
            console.error('JSZip not loaded');
            return;
        }

        const zip = new JSZip();

        files.forEach(({ name, data }) => {
            zip.file(name, data);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        this.saveBlob(content, zipName);
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

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    },

    generateFileName(original, suffix) {
        const ext = this.getFileExtension(original);
        const base = original.slice(0, original.lastIndexOf('.'));
        return `${base}${suffix}.${ext}`;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// =========================================
// Loading Spinner (Global)
// =========================================

const LoadingSpinner = {
    _el: null,
    show(message = 'Processing...') {
        if (!this._el) {
            this._el = document.createElement('div');
            this._el.className = 'loading-overlay';
            this._el.innerHTML = `<div class="loading-box"><div class="loading-spinner"></div><p></p></div>`;
            document.body.appendChild(this._el);
        }
        this._el.querySelector('p').textContent = message;
        requestAnimationFrame(() => this._el.classList.add('active'));
    },
    hide() {
        if (this._el) {
            this._el.classList.remove('active');
        }
    }
};

// =========================================
// Toast Notification
// =========================================

const Toast = {
    show(message = 'Done!', duration = 3000) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
};

// =========================================
// Service Worker Registration
// =========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                console.log('[SW] Registered:', reg.scope);
            })
            .catch((err) => {
                console.log('[SW] Registration failed:', err);
            });
    });
}

// =========================================
// PWA Install Prompt
// =========================================

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install banner
    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.innerHTML = `
        <div style="
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 10000;
            background: linear-gradient(135deg, #1E3A5F, #0096c7);
            color: white; padding: 14px 20px;
            display: flex; align-items: center; justify-content: center; gap: 16px;
            font-family: 'Inter', sans-serif; font-size: 0.95rem;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
            animation: slideUp 0.4s ease;
        ">
            <span>📱 Install OnlinePDFPro for quick access & offline use</span>
            <button id="installBtn" style="
                background: white; color: #1E3A5F; border: none;
                padding: 8px 20px; border-radius: 8px; font-weight: 600;
                cursor: pointer; font-size: 0.875rem;
            ">Install App</button>
            <button id="dismissInstall" style="
                background: transparent; color: rgba(255,255,255,0.8); border: none;
                cursor: pointer; font-size: 1.2rem; padding: 4px 8px;
            ">✕</button>
        </div>
    `;
    document.body.appendChild(banner);

    // Add animation
    const style = document.createElement('style');
    style.textContent = '@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }';
    document.head.appendChild(style);

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            console.log('[PWA] Install result:', result.outcome);
            deferredPrompt = null;
            banner.remove();
        }
    });

    document.getElementById('dismissInstall').addEventListener('click', () => {
        banner.remove();
        deferredPrompt = null;
    });
});

window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    const banner = document.getElementById('installBanner');
    if (banner) banner.remove();
    deferredPrompt = null;
});

// "Works Offline" trust pill → trigger PWA install
const pwaInstallPill = document.getElementById('pwaInstallPill');
if (pwaInstallPill) {
    pwaInstallPill.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            console.log('[PWA] Install from pill result:', result.outcome);
            if (result.outcome === 'accepted') {
                deferredPrompt = null;
                const banner = document.getElementById('installBanner');
                if (banner) banner.remove();
            }
        } else {
            // Already installed or prompt not available
            alert('To install: tap your browser menu (⋮) → "Add to Home Screen" or "Install App"');
        }
    });
}
// =========================================
// Global PWA Install Trigger (used by nav Install App link)
// =========================================

function triggerPwaInstall(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Check if already running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
    if (isStandalone) {
        alert('✅ OnlinePDFPro is already installed as an app!');
        return;
    }

    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(result => {
            console.log('[PWA] Nav install result:', result.outcome);
            if (result.outcome === 'accepted') {
                deferredPrompt = null;
                const banner = document.getElementById('installBanner');
                if (banner) banner.remove();
                // Close the nav menu
                const nav = document.getElementById('nav');
                const menuToggle = document.getElementById('menuToggle');
                if (nav) nav.classList.remove('active');
                if (menuToggle) menuToggle.textContent = '☰';
            }
        });
    } else {
        // No install prompt available — show instructions
        const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge|OPR/.test(navigator.userAgent);
        const isSamsung = /SamsungBrowser/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);

        let instructions = '';
        if (isChrome || isSamsung) {
            instructions = '👉 Tap the browser menu (⋮) at the top right → "Add to Home Screen" or "Install App"';
        } else if (isFirefox) {
            instructions = '👉 Tap the browser menu (⋯) → "Install"';
        } else {
            instructions = '👉 Tap your browser\'s menu → "Add to Home Screen" or "Install App"';
        }
        alert('📲 Install OnlinePDFPro\n\n' + instructions);
    }
}

// =========================================
// Language Selector (Google Translate powered)
// =========================================

const LanguageSelector = {
    // Comprehensive list of world languages supported by Google Translate
    languages: [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'it', name: 'Italian', native: 'Italiano' },
        { code: 'pt', name: 'Portuguese', native: 'Português' },
        { code: 'ru', name: 'Russian', native: 'Русский' },
        { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文' },
        { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文' },
        { code: 'ja', name: 'Japanese', native: '日本語' },
        { code: 'ko', name: 'Korean', native: '한국어' },
        { code: 'ar', name: 'Arabic', native: 'العربية' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
        { code: 'hi', name: 'Hinglish', native: 'हिंग्लिश (Hindi+English)' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা' },
        { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
        { code: 'ur', name: 'Urdu', native: 'اردو' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు' },
        { code: 'mr', name: 'Marathi', native: 'मराठी' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
        { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
        { code: 'ne', name: 'Nepali', native: 'नेपाली' },
        { code: 'si', name: 'Sinhala', native: 'සිංහල' },
        { code: 'th', name: 'Thai', native: 'ไทย' },
        { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
        { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
        { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
        { code: 'fil', name: 'Filipino', native: 'Filipino' },
        { code: 'tr', name: 'Turkish', native: 'Türkçe' },
        { code: 'pl', name: 'Polish', native: 'Polski' },
        { code: 'uk', name: 'Ukrainian', native: 'Українська' },
        { code: 'nl', name: 'Dutch', native: 'Nederlands' },
        { code: 'sv', name: 'Swedish', native: 'Svenska' },
        { code: 'da', name: 'Danish', native: 'Dansk' },
        { code: 'no', name: 'Norwegian', native: 'Norsk' },
        { code: 'fi', name: 'Finnish', native: 'Suomi' },
        { code: 'cs', name: 'Czech', native: 'Čeština' },
        { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
        { code: 'ro', name: 'Romanian', native: 'Română' },
        { code: 'hu', name: 'Hungarian', native: 'Magyar' },
        { code: 'el', name: 'Greek', native: 'Ελληνικά' },
        { code: 'bg', name: 'Bulgarian', native: 'Български' },
        { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
        { code: 'sr', name: 'Serbian', native: 'Српски' },
        { code: 'sl', name: 'Slovenian', native: 'Slovenščina' },
        { code: 'he', name: 'Hebrew', native: 'עברית' },
        { code: 'fa', name: 'Persian', native: 'فارسی' },
        { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
        { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
        { code: 'am', name: 'Amharic', native: 'አማርኛ' },
        { code: 'my', name: 'Myanmar (Burmese)', native: 'မြန်မာ' },
        { code: 'km', name: 'Khmer', native: 'ខ្មែរ' },
        { code: 'lo', name: 'Lao', native: 'ລາວ' },
        { code: 'ka', name: 'Georgian', native: 'ქართული' },
        { code: 'hy', name: 'Armenian', native: 'Հայերեն' },
        { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan' },
        { code: 'uz', name: 'Uzbek', native: 'Oʻzbek' },
        { code: 'kk', name: 'Kazakh', native: 'Қазақ' },
        { code: 'mn', name: 'Mongolian', native: 'Монгол' },
        { code: 'et', name: 'Estonian', native: 'Eesti' },
        { code: 'lv', name: 'Latvian', native: 'Latviešu' },
        { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' },
        { code: 'sq', name: 'Albanian', native: 'Shqip' },
        { code: 'mk', name: 'Macedonian', native: 'Македонски' },
        { code: 'bs', name: 'Bosnian', native: 'Bosanski' },
        { code: 'is', name: 'Icelandic', native: 'Íslenska' },
        { code: 'mt', name: 'Maltese', native: 'Malti' },
        { code: 'ga', name: 'Irish', native: 'Gaeilge' },
        { code: 'cy', name: 'Welsh', native: 'Cymraeg' },
        { code: 'eu', name: 'Basque', native: 'Euskara' },
        { code: 'ca', name: 'Catalan', native: 'Català' },
        { code: 'gl', name: 'Galician', native: 'Galego' },
        { code: 'la', name: 'Latin', native: 'Latina' },
        { code: 'eo', name: 'Esperanto', native: 'Esperanto' },
        { code: 'ha', name: 'Hausa', native: 'Hausa' },
        { code: 'ig', name: 'Igbo', native: 'Igbo' },
        { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
        { code: 'zu', name: 'Zulu', native: 'Zulu' },
        { code: 'xh', name: 'Xhosa', native: 'Xhosa' },
        { code: 'so', name: 'Somali', native: 'Soomaali' },
        { code: 'mg', name: 'Malagasy', native: 'Malagasy' },
        { code: 'ny', name: 'Chichewa', native: 'Chichewa' },
        { code: 'sn', name: 'Shona', native: 'Shona' },
        { code: 'rw', name: 'Kinyarwanda', native: 'Kinyarwanda' },
        { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
        { code: 'ps', name: 'Pashto', native: 'پښتو' },
        { code: 'ku', name: 'Kurdish', native: 'Kurdî' },
        { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча' },
        { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ' },
        { code: 'tk', name: 'Turkmen', native: 'Türkmen' },
        { code: 'mi', name: 'Maori', native: 'Māori' },
        { code: 'sm', name: 'Samoan', native: 'Gagana Samoa' },
        { code: 'haw', name: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi' },
        { code: 'ceb', name: 'Cebuano', native: 'Cebuano' },
        { code: 'jw', name: 'Javanese', native: 'Jawa' },
        { code: 'su', name: 'Sundanese', native: 'Sunda' },
    ],

    init() {
        const container = document.querySelector('.lang-selector');
        if (!container) return;

        const btn = container.querySelector('.lang-btn');
        const dropdown = container.querySelector('.lang-dropdown');
        const searchInput = container.querySelector('.lang-search');
        const list = container.querySelector('.lang-list');

        if (!btn || !dropdown || !list) return;

        // Render language list
        this.renderList(list, this.languages);

        // Toggle dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.toggle('open');
            if (isOpen) {
                // Position dropdown below the button
                const rect = btn.getBoundingClientRect();
                dropdown.style.top = (rect.bottom + 8) + 'px';
                dropdown.style.right = (window.innerWidth - rect.right) + 'px';
                if (searchInput) {
                    searchInput.value = '';
                    this.renderList(list, this.languages);
                    setTimeout(() => searchInput.focus(), 50);
                }
            }
        });

        // Search filter
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const filtered = this.languages.filter(lang =>
                    lang.name.toLowerCase().includes(q) ||
                    lang.native.toLowerCase().includes(q) ||
                    lang.code.toLowerCase().includes(q)
                );
                this.renderList(list, filtered);
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        // Load Google Translate script
        this.loadGoogleTranslate();
    },

    renderList(listEl, langs) {
        const currentLang = this.getCurrentLanguage();
        listEl.innerHTML = langs.map(lang => `
            <li class="lang-item${lang.code === currentLang ? ' active' : ''}" data-lang="${lang.code}">
                <span>${lang.name}</span>
                <span class="lang-native">${lang.native}</span>
            </li>
        `).join('');

        listEl.querySelectorAll('.lang-item').forEach(item => {
            item.addEventListener('click', () => {
                const langCode = item.dataset.lang;
                this.setLanguage(langCode);
                // Close dropdown
                item.closest('.lang-dropdown').classList.remove('open');
                // Update active states
                listEl.querySelectorAll('.lang-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    getCurrentLanguage() {
        return localStorage.getItem('doctools-lang') || 'en';
    },

    setLanguage(langCode) {
        localStorage.setItem('doctools-lang', langCode);

        if (langCode === 'en') {
            // Reset to original
            this.resetTranslation();
            return;
        }

        // Use Google Translate
        this.triggerGoogleTranslate(langCode);
    },

    loadGoogleTranslate() {
        // Add hidden Google Translate element
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.appendChild(div);

        // Define the callback
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false
            }, 'google_translate_element');

            // Auto-apply saved language
            const savedLang = this.getCurrentLanguage();
            if (savedLang && savedLang !== 'en') {
                setTimeout(() => this.triggerGoogleTranslate(savedLang), 1000);
            }
        };

        // Load the script
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
    },

    triggerGoogleTranslate(langCode) {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
        } else {
            // Retry after a short delay if Google Translate hasn't loaded yet
            setTimeout(() => {
                const retrySelect = document.querySelector('.goog-te-combo');
                if (retrySelect) {
                    retrySelect.value = langCode;
                    retrySelect.dispatchEvent(new Event('change'));
                }
            }, 2000);
        }
    },

    resetTranslation() {
        // Reset Google Translate
        const iframe = document.querySelector('.goog-te-banner-frame');
        if (iframe) {
            const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
            const restoreBtn = innerDoc.querySelector('.goog-close-link');
            if (restoreBtn) restoreBtn.click();
        }

        // Fallback: remove googtrans cookie and reload
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;

        // If still translated, force reload
        if (document.querySelector('.translated-ltr, .translated-rtl')) {
            window.location.reload();
        }
    }
};

// =========================================
// Feedback Widget Handler (In-Page Modal)
// =========================================

const FeedbackHandler = {
    init() {
        // Create the modal overlay (once per page)
        this.createModal();

        // Attach click handlers to all feedback buttons
        const btns = document.querySelectorAll('.feedback-widget');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        });
    },

    createModal() {
        // Build email target dynamically to avoid scraping
        const u = 'support';
        const d = 'onlinepdfpro.com';
        const target = `${u}@${d}`;

        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay';
        overlay.id = 'feedbackOverlay';
        overlay.innerHTML = `
            <div class="feedback-modal">
                <button class="feedback-close" id="feedbackClose" aria-label="Close feedback">&times;</button>
                <h3>Send Feedback</h3>
                <p class="feedback-subtitle">We'd love to hear from you! Your message will be sent directly to our team.</p>
                <form id="feedbackForm" action="https://formsubmit.co/${target}" method="POST">
                    <input type="hidden" name="_subject" value="Feedback for OnlinePDFPro">
                    <input type="hidden" name="_captcha" value="false">
                    <input type="hidden" name="_template" value="table">
                    <input type="hidden" name="_next" value="${window.location.href}">
                    <input type="text" name="name" placeholder="Your Name (optional)" autocomplete="name">
                    <input type="email" name="email" placeholder="Your Email (optional)" autocomplete="email">
                    <textarea name="message" placeholder="Your feedback or suggestion..." required></textarea>
                    <button type="submit" class="feedback-submit" id="feedbackSubmitBtn">Send Feedback</button>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close on X button
        document.getElementById('feedbackClose').addEventListener('click', () => this.close());

        // Close on overlay click (outside modal)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        // Handle form submission
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            const btn = document.getElementById('feedbackSubmitBtn');
            btn.textContent = 'Sending...';
            btn.disabled = true;
        });
    },

    open() {
        const overlay = document.getElementById('feedbackOverlay');
        if (overlay) {
            overlay.classList.add('active');
            // Focus the first input
            const firstInput = overlay.querySelector('input[name="name"]');
            if (firstInput) setTimeout(() => firstInput.focus(), 100);
        }
    },

    close() {
        const overlay = document.getElementById('feedbackOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            // Reset form
            const form = document.getElementById('feedbackForm');
            if (form) form.reset();
            const btn = document.getElementById('feedbackSubmitBtn');
            if (btn) {
                btn.textContent = 'Send Feedback';
                btn.disabled = false;
            }
        }
    }
};

// =========================================
// Initialize on DOM Ready
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileMenu.init();
    LanguageSelector.init();
    FeedbackHandler.init();

    console.log('OnlinePDFPro initialized - All processing happens locally in your browser');
});

// Export for use in tool pages

// =========================================
// Recently Used Tools — UI Renderer
// =========================================

const RecentlyUsedUI = {
    render() {
        const container = document.getElementById('recentlyUsedTools');
        const recentToolsSection = document.getElementById('recentToolsSection');
        const homePlaceholder = document.querySelector('.recently-used-placeholder');
        const target = container || homePlaceholder;

        if (!target) return;

        const recent = RecentlyUsed.get();
        if (recent.length === 0) {
            if (recentToolsSection) recentToolsSection.style.display = 'none';
            return;
        }

        if (recentToolsSection) recentToolsSection.style.display = 'block';

        const toolUrls = {
            'compress-pdf': 'tools/compress-pdf.html',
            'merge-pdf': 'tools/merge-pdf.html',
            'split-pdf': 'tools/split-pdf.html',
            'sign-pdf': 'tools/sign-pdf.html',
            'pdf-to-word': 'tools/pdf-to-word.html',
            'word-to-pdf': 'tools/word-to-pdf.html',
            'pdf-editor': 'pdf-editor.html',
            'pdf-lock': 'tools/pdf-lock.html',
            'pdf-unlock': 'tools/pdf-unlock.html',
            'delete-pages': 'tools/delete-pages.html',
            'rotate-pdf': 'tools/rotate-pdf.html',
            'add-page-numbers': 'tools/add-page-numbers.html',
            'pdf-watermark': 'tools/pdf-watermark.html',
            'ocr': 'tools/ocr.html',
            'image-compress': 'tools/image-compress.html',
            'image-resize': 'tools/image-resize.html',
            'image-crop': 'tools/image-crop.html',
            'pdf-to-images': 'tools/pdf-to-images.html',
            'images-to-pdf': 'tools/images-to-pdf.html',
            'crop-pdf': 'tools/crop-pdf.html',
            'html-to-pdf': 'tools/html-to-pdf.html',
            'pdf-to-excel': 'tools/pdf-to-excel.html',
            'excel-to-pdf': 'tools/excel-to-pdf.html',
            'pdf-to-ppt': 'tools/pdf-to-ppt.html',
            'ppt-to-pdf': 'tools/ppt-to-pdf.html',
        };

        const isInTools = window.location.pathname.includes('/tools/');
        const prefix = isInTools ? '../' : '';

        let html = '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
        recent.forEach(item => {
            const url = toolUrls[item.id] || 'tools.html';
            html += `<a href="${prefix}${url}" style="padding:10px 18px;background:var(--surface-1);border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--text-primary);font-size:14px;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:6px;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">${item.name}</a>`;
        });
        html += '</div>';

        target.innerHTML = html;
    }
};

// =========================================
// Social Share Widget
// =========================================

const SocialShare = {
    init() {
        // Disabled per user request
    }
};

// =========================================
// User Preferences (localStorage)
// =========================================

const UserPreferences = {
    KEY: 'doctools-preferences',

    get() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY)) || {};
        } catch {
            return {};
        }
    },

    set(key, value) {
        const prefs = this.get();
        prefs[key] = value;
        localStorage.setItem(this.KEY, JSON.stringify(prefs));
    },

    getVal(key, defaultVal) {
        const prefs = this.get();
        return prefs[key] !== undefined ? prefs[key] : defaultVal;
    }
};

// =========================================
// Tool Reset — Step-by-step Back Navigation
// =========================================

const ToolReset = {
    _stepCount: 0,

    init() {
        // Only run on tool pages
        const toolPage = document.querySelector('.tool-page');
        if (!toolPage) return;

        // Save initial DOM state as step 0
        const initialSnapshot = this._takeSnapshot();
        history.replaceState({ toolStep: 0, snapshot: initialSnapshot }, '');

        // Watch for UI transitions to push new steps
        this._watchTransitions();

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.snapshot) {
                this._restoreSnapshot(e.state.snapshot);
            }
        });
    },

    /**
     * Take a snapshot of the display state of all elements with IDs in .tool-page
     */
    _takeSnapshot() {
        const snapshot = {};
        const toolPage = document.querySelector('.tool-page');
        if (!toolPage) return snapshot;

        toolPage.querySelectorAll('[id]').forEach(el => {
            // Get computed display — covers both inline and CSS-set display
            const computedDisplay = window.getComputedStyle(el).display;
            const inlineDisplay = el.style.display;
            snapshot[el.id] = {
                inlineDisplay: inlineDisplay,
                hidden: computedDisplay === 'none'
            };
        });
        return snapshot;
    },

    /**
     * Restore a DOM snapshot — show/hide elements to match saved state
     */
    _restoreSnapshot(snapshot) {
        const toolPage = document.querySelector('.tool-page');
        if (!toolPage) return;

        Object.keys(snapshot).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const saved = snapshot[id];
            el.style.display = saved.inlineDisplay;
        });

        // Re-enable any disabled buttons
        toolPage.querySelectorAll('button[disabled]').forEach(btn => {
            btn.disabled = false;
        });
    },

    /**
     * Push a new step whenever a major UI change is detected
     */
    pushStep() {
        this._stepCount++;
        const snapshot = this._takeSnapshot();
        history.pushState({ toolStep: this._stepCount, snapshot: snapshot }, '');
    },

    /**
     * Watch for common UI transitions across all tools
     */
    _watchTransitions() {
        const self = this;

        // 1. Watch file inputs — push step when file is selected
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', () => {
                if (input.files && input.files.length > 0) {
                    // Delay slightly to let the tool's own JS update the DOM first
                    setTimeout(() => self.pushStep(), 300);
                }
            });
        });

        // 2. Watch drop areas
        document.querySelectorAll('.upload-zone, #dropArea, [id*="drop"]').forEach(area => {
            area.addEventListener('drop', () => {
                setTimeout(() => self.pushStep(), 300);
            });
        });

        // 3. Use MutationObserver to detect when major sections show/hide
        // This catches result areas, success boxes, download sections, etc.
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const el = mutation.target;
                    const id = el.id || '';
                    // Only push step for significant containers (not minor elements)
                    const isSignificant = id.match(/success|result|output|download|preview|unlock|lock/i) ||
                        el.classList.contains('success-box') ||
                        el.classList.contains('result-area');

                    if (isSignificant && el.style.display === 'block') {
                        // A major section just became visible — push new step
                        setTimeout(() => self.pushStep(), 100);
                    }
                }
            }
        });

        // Observe all elements with IDs inside tool-page for style changes
        const toolPage = document.querySelector('.tool-page');
        if (toolPage) {
            toolPage.querySelectorAll('[id]').forEach(el => {
                observer.observe(el, { attributes: true, attributeFilter: ['style'] });
            });
        }
    },

    reset() {
        this._stepCount = 0;
        window.location.reload();
    }
};

// =========================================
// Auto-Initialize Features
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    RecentlyUsedUI.render();
    SocialShare.init();
    ToolReset.init();

    // Auto-track tool usage
    const toolPage = document.querySelector('.tool-page');
    if (toolPage) {
        const titleEl = document.querySelector('.tool-title');
        if (titleEl) {
            const toolName = titleEl.textContent.split('—')[0].split('–')[0].trim();
            const pathParts = window.location.pathname.split('/');
            const filename = pathParts[pathParts.length - 1].replace('.html', '');
            RecentlyUsed.add(filename, toolName);
        }
    }
});


// =========================================
// Analytics Event Tracking
// =========================================

const Analytics = {
    track(eventName, params = {}) {
        // Google Analytics 4 event
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
        // Console fallback for dev
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('[Analytics]', eventName, params);
        }
    },

    trackToolUse(toolName) {
        this.track('tool_used', {
            tool_name: toolName,
            timestamp: new Date().toISOString()
        });
    },

    trackDownload(toolName, fileType) {
        this.track('file_download', {
            tool_name: toolName,
            file_type: fileType
        });
    },

    trackShare(toolName, platform) {
        this.track('share', {
            tool_name: toolName,
            method: platform
        });
    }
};

// =========================================
// File Sharer (Web Share API)
// =========================================

const FileSharer = {
    /**
     * Check if the browser supports sharing files
     */
    canShareFiles() {
        return navigator.share && navigator.canShare;
    },

    /**
     * Share a file using the Web Share API
     * @param {Blob} blob - The file blob to share
     * @param {string} filename - The filename
     * @param {string} mimeType - MIME type (default: application/pdf)
     */
    async share(blob, filename, mimeType = 'application/pdf') {
        const file = new File([blob], filename, { type: mimeType });

        // Check if browser supports sharing this file
        if (this.canShareFiles() && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: filename,
                    text: `Processed with OnlinePDFPro`
                });
                Toast.show('File shared successfully!');
                return true;
            } catch (err) {
                if (err.name === 'AbortError') {
                    // User cancelled — that's ok
                    return false;
                }
                console.error('Share failed:', err);
                this._fallbackShare(blob, filename);
                return false;
            }
        } else {
            this._fallbackShare(blob, filename);
            return false;
        }
    },

    /**
     * Fallback: download the file + show a message
     */
    _fallbackShare(blob, filename) {
        Toast.show('File sharing is available on mobile. Downloading instead...');
        Downloader.saveBlob(blob, filename);
    }
};

// =========================================
// Public API
// =========================================

const _exports = {
    ThemeManager,
    MobileMenu,
    LanguageSelector,
    FileUploader,
    ProgressHandler,
    RecentlyUsed,
    RecentlyUsedUI,
    AutoClear,
    Downloader,
    Utils,
    LoadingSpinner,
    Toast,
    SocialShare,
    UserPreferences,
    Analytics,
    ToolReset,
    FileSharer,
    HistoryDB
};

window.OnlinePDFPro = _exports;
window.DocTools = _exports;
