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
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                    nav.classList.remove('active');
                    menuToggle.textContent = '☰';
                }
            });

            // Close on nav link click
            nav.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('active');
                    menuToggle.textContent = '☰';
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
// Download Helper
// =========================================

const Downloader = {
    saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
        const u = 'prem0734raj';
        const d = 'gmail.com';
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
const _exports = {
    ThemeManager,
    MobileMenu,
    LanguageSelector,
    FileUploader,
    ProgressHandler,
    RecentlyUsed,
    AutoClear,
    Downloader,
    Utils
};

window.OnlinePDFPro = _exports;
window.DocTools = _exports; // backward compatibility

