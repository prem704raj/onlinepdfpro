(function () {
  'use strict';

  var PROD_HOSTS = ['onlinepdfpro.com', 'www.onlinepdfpro.com'];
  var GA_ID = 'G-VMPCXTN3ES';
  var ADS_CLIENT = 'ca-pub-3541372477756449';
  var CLARITY_ID = 'vu83gydexm';
  var CONSENT_KEY = 'cookie_consent';

  function isProdHost() {
    var host = window.location.hostname;
    return PROD_HOSTS.indexOf(host) !== -1;
  }

  function loadScript(src, attrs, onError) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    }
    if (onError) {
      s.onerror = onError;
    }
    document.head.appendChild(s);
    return s;
  }

  function hideAdSlots() {
    var selectors = ['.adsbygoogle', '.ad-slot', '[data-ad-slot]'];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.style.display = 'none';
      });
    });
  }

  function setupStubs() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
    window.adsbygoogle = window.adsbygoogle || [];
  }

  function initAnalytics() {
    setupStubs();

    if (!isProdHost()) {
      return;
    }

    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID, null, function () {
      console.warn('Analytics script blocked/unavailable. Continuing without analytics.');
    });

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      send_page_view: true,
      anonymize_ip: true
    });
  }

  function initAdsterra() {
    if (!isProdHost()) {
      return;
    }
    loadScript(
      'https://pl29768747.effectivecpmnetwork.com/35/f0/6e/35f06e68ee472a590a944b692558f78a.js',
      null,
      function () {
        console.warn('Adsterra blocked/unavailable.');
      }
    );
  }

  function initAdsense() {
    setupStubs();

    if (!isProdHost()) {
      hideAdSlots();
      return;
    }

    loadScript(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CLIENT,
      { crossorigin: 'anonymous' },
      function () {
        console.warn('AdSense blocked/unavailable. Hiding ad slots.');
        hideAdSlots();
      }
    );
  }

  function initClarity() {
    if (!isProdHost()) {
      return;
    }

    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };

    loadScript('https://www.clarity.ms/tag/' + CLARITY_ID, null, function () {
      console.warn('Clarity blocked/unavailable.');
    });
  }

  /* =============================================
     COOKIE CONSENT BANNER
     ============================================= */
  function getConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) { /* ignore */ }
  }

  function loadThirdParties() {
    initAnalytics();
    initAdsense();
    initAdsterra();
    initClarity();
  }

  function createConsentBanner() {
    // Don't show in non-prod
    if (!isProdHost()) {
      setupStubs();
      return;
    }

    var consent = getConsent();

    if (consent === 'accepted') {
      loadThirdParties();
      return;
    }

    if (consent === 'rejected') {
      setupStubs();
      hideAdSlots();
      return;
    }

    // No consent yet — show banner
    var banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie Consent');
    banner.innerHTML =
      '<div style="max-width:960px;margin:0 auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:260px;">' +
          '<p style="margin:0;font-size:14px;line-height:1.6;color:#e2e8f0;">' +
            '🍪 We use cookies for analytics (Google Analytics), advertising (Google AdSense), and session insights (Clarity) to keep our tools free. ' +
            'Your PDF files are <strong>never uploaded</strong> — all processing is 100% local. ' +
            '<a href="/privacy.html" style="color:#93c5fd;text-decoration:underline;">Privacy Policy</a>' +
          '</p>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-shrink:0;">' +
          '<button id="cookieAccept" style="padding:10px 24px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;font-size:14px;cursor:pointer;transition:background 0.2s;">Accept All</button>' +
          '<button id="cookieReject" style="padding:10px 24px;border:1px solid rgba(255,255,255,0.25);border-radius:10px;background:transparent;color:#e2e8f0;font-weight:600;font-size:14px;cursor:pointer;transition:background 0.2s;">Reject</button>' +
        '</div>' +
      '</div>';

    // Styles
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:18px 20px;background:rgba(15,23,42,0.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid rgba(255,255,255,0.08);box-shadow:0 -4px 24px rgba(0,0,0,0.3);font-family:Inter,system-ui,sans-serif;animation:slideUpConsent 0.4s ease;';

    // Add keyframe animation
    var style = document.createElement('style');
    style.textContent = '@keyframes slideUpConsent{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}';
    document.head.appendChild(style);

    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', function () {
      setConsent('accepted');
      banner.style.animation = 'none';
      banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity = '0';
      setTimeout(function () { banner.remove(); }, 350);
      loadThirdParties();
    });

    document.getElementById('cookieReject').addEventListener('click', function () {
      setConsent('rejected');
      banner.style.animation = 'none';
      banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      banner.style.transform = 'translateY(100%)';
      banner.style.opacity = '0';
      setTimeout(function () { banner.remove(); }, 350);
      setupStubs();
      hideAdSlots();
    });
  }

  // Initialize with consent gating
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createConsentBanner);
  } else {
    createConsentBanner();
  }

  window.OnlinePDFProThirdParty = {
    isProdHost: isProdHost,
    hideAdSlots: hideAdSlots
  };
})();
