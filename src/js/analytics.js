/* Shared, opt-in GA4 measurement and Cookie Consent management.
 * Never include uploaded content, file names, email addresses, or query parameters. */
(function () {
    'use strict';
    const measurementId = 'G-RPDGMCZ97D';
    const storageKey = 'onlinepdfpro-analytics-consent-v1';
    const cookieConsentKey = 'onlinepdfpro-cookie-consent-v1';
    const production = ['onlinepdfpro.com', 'www.onlinepdfpro.com'].includes(location.hostname);
    if (window.OnlinePDFProAnalytics) return;
    let choice = null;
    try { choice = localStorage.getItem(cookieConsentKey) || localStorage.getItem(storageKey); } catch {}
    let enabled = false;
    let loaded = false;
    const safeUrl = value => {
        try { const url = new URL(value); return `${url.origin}${url.pathname.replace(/\.html$/, '')}`; }
        catch { return ''; }
    };
    const privatePage = /^\/(?:login|library|history)(?:\.html)?\/?$/.test(location.pathname);
    const toolId = location.pathname.replace(/\.html$/, '').split('/').filter(Boolean).pop() || 'home';
    const raw = function () { window.dataLayer.push(arguments); };
    window.dataLayer = window.dataLayer || [];
    const permittedEvents = new Set(['tool_use', 'tool_interaction', 'file_download', 'download',
        'pwa_installed', 'tool_start', 'tool_complete', 'tool_error', 'tool_download', 'file_selected',
        'editor_open_success', 'existing_text_selected', 'inline_edit_started',
        'font_replacement_shown', 'export_success', 'export_failure']);
    const actions = new Set(['convert', 'download_all', 'download', 'upload', 'process', 'merge',
        'compress', 'split', 'start', 'complete', 'open', 'click']);
    function track(event, parameters = {}) {
        if (!enabled || !production || privatePage || !permittedEvents.has(event)) return;
        const safe = { tool_id: toolId };
        if (actions.has(parameters.action)) safe.action = parameters.action;
        if (['pdf', 'document', 'image', 'other'].includes(parameters.file_type)) safe.file_type = parameters.file_type;
        if (['under_1mb', '1_to_10mb', '10_to_50mb', 'over_50mb'].includes(parameters.size_bucket)) safe.size_bucket = parameters.size_bucket;
        if (Number.isSafeInteger(parameters.file_count) && parameters.file_count >= 0) safe.file_count = Math.min(parameters.file_count, 1000);
        if (['invalid_file', 'service_unavailable', 'verification_failed', 'processing_failed'].includes(parameters.error_code)) safe.error_code = parameters.error_code;
        raw('event', event, safe);
    }
    // Existing tools call gtag directly. Only accept event calls and known,
    // non-personal parameters; do not forward arbitrary payloads to Google.
    window.gtag = (command, event, parameters) => { if (command === 'event') track(event, parameters); };
    function enable() {
        if (enabled || privatePage) return;
        enabled = true;
        window[`ga-disable-${measurementId}`] = false;
        if (loaded) {
            raw('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
            });
            return;
        }
        loaded = true;
        raw('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted'
        });
        raw('js', new Date());
        raw('config', measurementId, {
            send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
            page_location: safeUrl(location.href), page_referrer: safeUrl(document.referrer),
            page_title: document.title
        });
        raw('event', 'page_view', { page_location: safeUrl(location.href),
            page_referrer: safeUrl(document.referrer), page_title: document.title });
        if (production) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
            document.head.appendChild(script);
        }
    }
    function choose(value) {
        choice = value;
        try {
            localStorage.setItem(cookieConsentKey, value);
            localStorage.setItem(storageKey, value);
        } catch {}
        if (value === 'granted') enable();
        else {
            enabled = false;
            window[`ga-disable-${measurementId}`] = true;
            if (loaded) {
                raw('consent', 'update', {
                    analytics_storage: 'denied',
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied'
                });
            }
            // Remove GA's first-party cookies when consent is withdrawn.
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (!/^_ga(?:_|$)|^_gid$/.test(name)) return;
                for (const domain of ['', location.hostname, '.onlinepdfpro.com']) {
                    document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ''}`;
                }
            });
        }
        hideBanner();
    }
    function hideBanner() {
        const banner = document.getElementById('cookieConsentBanner') || document.getElementById('analyticsConsent');
        if (banner) banner.style.display = 'none';
    }
    function showBanner() {
        let banner = document.getElementById('cookieConsentBanner');
        if (!banner) {
            banner = document.createElement('aside');
            banner.id = 'cookieConsentBanner';
            banner.className = 'cookie-consent-banner';
            banner.setAttribute('role', 'region');
            banner.setAttribute('aria-label', 'Cookie Consent & Privacy Choices');
            banner.innerHTML = `
                <div class="cookie-consent-container">
                    <div class="cookie-consent-text">
                        <p><strong>Cookie &amp; Privacy Notice:</strong> OnlinePDFPro uses cookies to analyze site traffic, personalize content, and serve relevant advertisements via Google AdSense. Your document files are always processed 100% locally in your browser and are never uploaded or stored. Learn more in our <a href="/privacy">Privacy &amp; Cookie Policy</a>.</p>
                    </div>
                    <div class="cookie-consent-actions">
                        <button type="button" id="cookieConsentAccept" class="cookie-btn cookie-btn-accept">Accept All Cookies</button>
                        <button type="button" id="cookieConsentDecline" class="cookie-btn cookie-btn-decline">Essential Only</button>
                    </div>
                </div>`;
            document.body.appendChild(banner);
        }
        banner.style.display = 'block';
        bindBannerEvents(banner);
    }
    function bindBannerEvents(banner) {
        const acceptBtn = banner.querySelector('#cookieConsentAccept');
        const declineBtn = banner.querySelector('#cookieConsentDecline');
        if (acceptBtn && !acceptBtn._bound) {
            acceptBtn._bound = true;
            acceptBtn.addEventListener('click', () => choose('granted'));
        }
        if (declineBtn && !declineBtn._bound) {
            declineBtn._bound = true;
            declineBtn.addEventListener('click', () => choose('denied'));
        }
    }
    window.OnlinePDFProAnalytics = { track, showPreferences: showBanner };
    function init() {
        const existingBanner = document.getElementById('cookieConsentBanner');
        if (existingBanner) bindBannerEvents(existingBanner);

        // Bind any footer cookie preference triggers
        document.querySelectorAll('#footerCookiePreferences, .footer-cookie-btn').forEach(btn => {
            btn.addEventListener('click', showBanner);
        });

        if (choice === 'granted') {
            enable();
            hideBanner();
        } else if (choice === 'denied') {
            hideBanner();
        } else {
            showBanner();
        }

        document.addEventListener('change', event => {
            const input = event.target;
            if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.length) return;
            const file = input.files[0];
            const fileType = file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' :
                /word|opendocument|rtf/.test(file.type) ? 'document' : 'other';
            const size = file.size / (1024 * 1024);
            track('file_selected', { file_count: input.files.length, file_type: fileType,
                size_bucket: size < 1 ? 'under_1mb' : size < 10 ? '1_to_10mb' : size <= 50 ? '10_to_50mb' : 'over_50mb' });
        }, true);
        document.addEventListener('click', event => {
            // Programmatic download links are measured by the exporting workflow.
            // Only count a real user's direct anchor click here.
            if (event.isTrusted && event.target.closest?.('a[download]')) track('tool_download', { action: 'download' });
        }, true);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
}());
