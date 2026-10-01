/* Shared, opt-in GA4 measurement. Never include uploaded content, file names,
 * email addresses, auth callbacks, or URL query/fragment values in our events. */
(function () {
    'use strict';
    const measurementId = 'G-RPDGMCZ97D';
    const storageKey = 'onlinepdfpro-analytics-consent-v1';
    const production = ['onlinepdfpro.com', 'www.onlinepdfpro.com'].includes(location.hostname);
    if (!production || window.OnlinePDFProAnalytics) return;
    let choice = null;
    try { choice = localStorage.getItem(storageKey); } catch {}
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
        'pwa_installed', 'tool_start', 'tool_complete', 'tool_error', 'tool_download', 'file_selected']);
    const actions = new Set(['convert', 'download_all', 'download', 'upload', 'process', 'merge',
        'compress', 'split', 'start', 'complete', 'open', 'click']);
    function track(event, parameters = {}) {
        if (!enabled || privatePage || !permittedEvents.has(event)) return;
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
            raw('consent', 'update', { analytics_storage: 'granted' });
            return;
        }
        loaded = true;
        raw('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied',
            ad_user_data: 'denied', ad_personalization: 'denied' });
        raw('js', new Date());
        raw('config', measurementId, {
            send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
            page_location: safeUrl(location.href), page_referrer: safeUrl(document.referrer),
            page_title: document.title
        });
        raw('event', 'page_view', { page_location: safeUrl(location.href),
            page_referrer: safeUrl(document.referrer), page_title: document.title });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
    }
    function choose(value) {
        choice = value;
        try { localStorage.setItem(storageKey, value); } catch {}
        if (value === 'granted') enable();
        else {
            enabled = false;
            window[`ga-disable-${measurementId}`] = true;
            if (loaded) raw('consent', 'update', { analytics_storage: 'denied' });
            // Remove GA's first-party cookies when consent is withdrawn.
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (!/^_ga(?:_|$)|^_gid$/.test(name)) return;
                for (const domain of ['', location.hostname, '.onlinepdfpro.com']) {
                    document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ''}`;
                }
            });
        }
        document.getElementById('analyticsConsent')?.remove();
    }
    function showPreferences() {
        if (document.getElementById('analyticsConsent')) return;
        const panel = document.createElement('section');
        panel.id = 'analyticsConsent';
        panel.className = 'analytics-consent';
        panel.setAttribute('aria-label', 'Analytics privacy choices');
        const text = document.createElement('p');
        text.textContent = 'Allow optional Google Analytics to help us improve these tools? Your files stay out of our analytics. You can change this choice anytime.';
        const controls = document.createElement('div');
        controls.className = 'analytics-consent-actions';
        for (const [label, value] of [['Essential only', 'denied'], ['Allow analytics', 'granted']]) {
            const button = document.createElement('button');
            button.type = 'button'; button.textContent = label;
            button.addEventListener('click', () => {
                choose(value);
                document.getElementById('analyticsPreferences')?.focus({ preventScroll: true });
            });
            controls.appendChild(button);
        }
        const privacy = document.createElement('a');
        privacy.href = '/privacy'; privacy.textContent = 'Privacy policy';
        controls.appendChild(privacy);
        panel.append(text, controls);
        document.body.appendChild(panel);
    }
    window.OnlinePDFProAnalytics = { track, showPreferences };
    function init() {
        const preferences = document.createElement('button');
        preferences.id = 'analyticsPreferences'; preferences.type = 'button';
        preferences.className = 'analytics-preferences'; preferences.textContent = 'Privacy choices';
        preferences.addEventListener('click', showPreferences);
        (document.querySelector('footer') || document.querySelector('.blog-footer') || document.body).appendChild(preferences);
        if (choice === 'granted') enable();
        else if (choice !== 'denied') showPreferences();
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
            if (event.target.closest?.('a[download]')) track('tool_download');
        }, true);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
}());
