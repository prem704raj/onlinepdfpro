/**
 * Cloud Convert Module for OnlinePDFPro
 * Provides quality toggle UI + Cloudflare Worker proxy client
 * Free tier: 500 cloud conversions/month (Adobe PDF Services API)
 * No credit/debit card required — email signup only.
 */

(function () {
    'use strict';

    const CLOUD_WORKER_URL = 'https://onlinepdfpro-proxy.prem736raj.workers.dev';
    const MONTHLY_LIMIT = 500;
    const STORAGE_KEY = 'opdfpro_cloud_usage';

    // ─── Usage Tracking ───────────────────────────────────────────────
    function getUsage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { month: getCurrentMonth(), count: 0 };
            const data = JSON.parse(raw);
            if (data.month !== getCurrentMonth()) {
                return { month: getCurrentMonth(), count: 0 };
            }
            return data;
        } catch { return { month: getCurrentMonth(), count: 0 }; }
    }

    function incrementUsage() {
        const usage = getUsage();
        usage.count++;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
        return usage;
    }

    function getCurrentMonth() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function getRemainingQuota() {
        return Math.max(0, MONTHLY_LIMIT - getUsage().count);
    }

    function isCloudAvailable() {
        return CLOUD_WORKER_URL.length > 0 && getRemainingQuota() > 0;
    }

    // ─── Inject Toggle UI ─────────────────────────────────────────────
    function injectToggleUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const cloudAvailable = isCloudAvailable();
        const remaining = getRemainingQuota();

        const wrapper = document.createElement('div');
        wrapper.id = 'conversionModeToggle';
        wrapper.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px; margin:16px auto; max-width:500px;';

        wrapper.innerHTML = `
            <div style="display:flex; gap:0; border-radius:12px; overflow:hidden; border:1.5px solid var(--border, #e2e8f0); width:100%; max-width:360px;">
                <button id="modeBrowser" class="mode-btn mode-active" style="flex:1; padding:12px 16px; border:none; cursor:pointer; font-weight:600; font-size:0.9rem; transition:all 0.2s; background:var(--accent, #2563eb); color:#fff;">
                    ⚡ Fast (Browser)
                </button>
                <button id="modeCloud" class="mode-btn" style="flex:1; padding:12px 16px; border:none; cursor:pointer; font-weight:600; font-size:0.9rem; transition:all 0.2s; background:var(--surface-1, #fff); color:var(--text-secondary, #64748b); ${!cloudAvailable ? 'opacity:0.5;' : ''}" ${!cloudAvailable ? 'disabled title="Cloud not configured yet"' : ''}>
                    🌐 High Quality (Cloud)
                </button>
            </div>
            <div id="modeDescription" style="font-size:0.8rem; color:var(--text-secondary, #64748b); text-align:center;">
                Processing happens 100% in your browser — fast and private.
            </div>
            ${cloudAvailable ? `<div style="font-size:0.75rem; color:var(--text-muted, #94a3b8);">${remaining}/${MONTHLY_LIMIT} cloud conversions remaining this month</div>` : ''}
        `;

        container.insertAdjacentElement('afterend', wrapper);

        // Event listeners
        const browserBtn = document.getElementById('modeBrowser');
        const cloudBtn = document.getElementById('modeCloud');
        const desc = document.getElementById('modeDescription');

        if (browserBtn) {
            browserBtn.addEventListener('click', function () {
                browserBtn.style.background = 'var(--accent, #2563eb)';
                browserBtn.style.color = '#fff';
                cloudBtn.style.background = 'var(--surface-1, #fff)';
                cloudBtn.style.color = 'var(--text-secondary, #64748b)';
                desc.textContent = 'Processing happens 100% in your browser — fast and private.';
                window._conversionMode = 'browser';
            });
        }

        if (cloudBtn && cloudAvailable) {
            cloudBtn.addEventListener('click', function () {
                cloudBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                cloudBtn.style.color = '#fff';
                browserBtn.style.background = 'var(--surface-1, #fff)';
                browserBtn.style.color = 'var(--text-secondary, #64748b)';
                desc.textContent = '📤 File is sent securely to our conversion server for pro-grade quality.';
                window._conversionMode = 'cloud';
            });
        }

        window._conversionMode = 'browser';
    }

    // ─── Cloud Conversion Request ─────────────────────────────────────
    async function cloudConvert(file, fromFormat, toFormat, onProgress) {
        if (!CLOUD_WORKER_URL) {
            throw new Error('Cloud conversion not configured. Using browser mode.');
        }

        if (getRemainingQuota() <= 0) {
            throw new Error('Monthly cloud quota exceeded. Using browser mode.');
        }

        if (onProgress) onProgress(10, 'Uploading file...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('from', fromFormat);
        formData.append('to', toFormat);

        try {
            const response = await fetch(CLOUD_WORKER_URL + '/convert', {
                method: 'POST',
                body: formData
            });

            if (onProgress) onProgress(60, 'Converting...');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Cloud conversion failed: ' + errorText);
            }

            if (onProgress) onProgress(90, 'Downloading result...');

            const blob = await response.blob();
            incrementUsage();

            if (onProgress) onProgress(100, 'Done!');

            return blob;
        } catch (err) {
            console.error('Cloud conversion error:', err);
            throw err;
        }
    }

    // ─── Is Cloud Mode Selected? ──────────────────────────────────────
    function isCloudMode() {
        return window._conversionMode === 'cloud' && isCloudAvailable();
    }

    // ─── Export ────────────────────────────────────────────────────────
    window.CloudConvert = {
        injectToggleUI,
        cloudConvert,
        isCloudMode,
        isCloudAvailable,
        getRemainingQuota,
        getUsage,
        MONTHLY_LIMIT
    };
})();
