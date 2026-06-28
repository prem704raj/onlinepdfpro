// ============================================
// ONLINEPDFPRO — ULTIMATE SECURITY SHIELD v2.0
// Prevents: DevTools, Right-Click, Source View,
// Copy/Paste theft, iframe embedding, console
// injection, DOM tampering, and automated bots.
// ============================================

(function() {
    'use strict';
    return; // Temporarily disabled for development

    // ── 1. DISABLE RIGHT-CLICK ──
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ── 2. BLOCK ALL DEVTOOLS KEYBOARD SHORTCUTS ──
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
        // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Picker)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
        // Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) { e.preventDefault(); return false; }
        // Ctrl+S (Save Page)
        if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) { e.preventDefault(); return false; }
        // Ctrl+A (Select All)  
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A' || e.keyCode === 65)) { e.preventDefault(); return false; }
    }, true);

    // ── 3. ANTI-DEBUGGING TRAP ──
    // Check once on load, then only on suspicious activity.
    // Continuous debugger statements break heavy async tasks (AI model downloads).
    function _antiDebugCheck() {
        var t1 = performance.now();
        debugger;
        var t2 = performance.now();
        if (t2 - t1 > 100) {
            document.documentElement.innerHTML = '';
            document.title = 'Access Denied';
            try { window.location.href = 'about:blank'; } catch(x) {}
        }
    }
    // Run once after page settles
    setTimeout(_antiDebugCheck, 3000);

    // ── 4. DISABLE TEXT SELECTION & COPY ──
    document.addEventListener('selectstart', function(e) {
        // Allow selection inside input/textarea for usability
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
    });
    document.addEventListener('copy', function(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
    });

    // ── 5. DISABLE DRAG (prevents dragging images/content out) ──
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });

    // ── 6. ANTI-IFRAME EMBEDDING (Clickjacking Protection) ──
    // If someone tries to embed your site in their iframe, break out.
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch(e) {
            // Cross-origin — hide everything
            document.documentElement.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#0a0a0a;color:#ff3333;font-family:monospace;font-size:20px;">This site cannot be embedded.</div>';
        }
    }

    // ── 7. CONSOLE POISONING ──
    // Overwrite console methods so injected scripts can't easily log/debug.
    var _noop = function() {};
    try {
        Object.defineProperty(window, 'console', {
            get: function() {
                return {
                    log: _noop, warn: _noop, error: _noop, info: _noop,
                    debug: _noop, dir: _noop, table: _noop, trace: _noop,
                    assert: _noop, clear: _noop, count: _noop, countReset: _noop,
                    group: _noop, groupCollapsed: _noop, groupEnd: _noop,
                    time: _noop, timeEnd: _noop, timeLog: _noop, timeStamp: _noop,
                    profile: _noop, profileEnd: _noop
                };
            },
            set: function() {},
            configurable: false
        });
    } catch(e) {
        // Fallback: just clear common methods
        ['log','warn','error','info','debug','dir','table','trace'].forEach(function(m) {
            try { console[m] = _noop; } catch(x) {}
        });
    }

    // ── 8. DOM INTEGRITY MONITOR ──
    // Watch for someone injecting malicious scripts/iframes via DevTools.
    if (typeof MutationObserver !== 'undefined') {
        var _observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        var tag = node.tagName ? node.tagName.toUpperCase() : '';
                        // Block injected scripts (except our own trusted CDNs)
                        if (tag === 'SCRIPT') {
                            var src = (node.src || '').toLowerCase();
                            var trusted = [
                                'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com',
                                'esm.sh', 'cdn.skypack.dev', 'huggingface.co',
                                'onlinepdfpro.com', '5gvci.com', 'pagead2.googlesyndication.com',
                                'googletagmanager.com', 'google-analytics.com',
                                'googlesyndication.com', 'adsbygoogle.js',
                                'highperformanceformat.com', 'effectivecpmnetwork.com'
                            ];
                            var isTrusted = !src || trusted.some(function(d) { return src.indexOf(d) > -1; });
                            if (!isTrusted) {
                                node.remove();
                            }
                        }
                        // Block injected iframes (except ads)
                        if (tag === 'IFRAME') {
                            var iframeSrc = (node.src || '').toLowerCase();
                            var trustedIframes = [
                                'googlesyndication.com', 'google.com', 'doubleclick.net',
                                'youtube.com', 'onlinepdfpro.com', 'about:blank',
                                'highperformanceformat.com', 'effectivecpmnetwork.com'
                            ];
                            var isOk = !iframeSrc || trustedIframes.some(function(d) { return iframeSrc.indexOf(d) > -1; });
                            if (!isOk) {
                                node.remove();
                            }
                        }
                    }
                });
            });
        });
        _observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ── 9. DEVTOOLS OPEN DETECTION (Window Size Method) ──
    // DevTools changes the window inner dimensions. Detect and warn.
    var _dtCheck = setInterval(function() {
        var widthThreshold = window.outerWidth - window.innerWidth > 160;
        var heightThreshold = window.outerHeight - window.innerHeight > 160;
        if (widthThreshold || heightThreshold) {
            // DevTools likely open — show warning overlay
            var existing = document.getElementById('__security_overlay');
            if (!existing) {
                var overlay = document.createElement('div');
                overlay.id = '__security_overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
                overlay.innerHTML = '<div style="color:#ff4444;font-family:monospace;font-size:28px;font-weight:bold;margin-bottom:16px;">⚠️ Security Warning</div><div style="color:#aaa;font-family:monospace;font-size:16px;text-align:center;max-width:500px;">Developer tools detected.<br>This website is protected.<br>Please close developer tools to continue.</div>';
                document.body.appendChild(overlay);
            }
        } else {
            var ov = document.getElementById('__security_overlay');
            if (ov) ov.remove();
        }
    }, 1000);

    // ── 10. PREVENT PAGE SAVE (Ctrl+S, Print) ──
    window.addEventListener('beforeprint', function() {
        document.body.style.display = 'none';
    });
    window.addEventListener('afterprint', function() {
        document.body.style.display = '';
    });

    // ── 11. ANTI-BOT / HEADLESS BROWSER DETECTION ──
    var isBot = (
        navigator.webdriver === true ||
        !!window._phantom ||
        !!window.__nightmare ||
        !!window.callPhantom ||
        /HeadlessChrome/i.test(navigator.userAgent) ||
        /PhantomJS/i.test(navigator.userAgent) ||
        /Puppeteer/i.test(navigator.userAgent)
    );
    if (isBot) {
        document.documentElement.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#0a0a0a;color:#ff3333;font-family:monospace;font-size:20px;">Automated access is not permitted.</div>';
    }

})();
