(function () {
  'use strict';

  var PROD_HOSTS = ['onlinepdfpro.com', 'www.onlinepdfpro.com'];
  var GA_ID = 'G-VMPCXTN3ES';
  var ADS_CLIENT = 'ca-pub-3541372477756449';
  var CLARITY_ID = 'vu83gydexm';

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

  initAnalytics();
  initAdsense();
  initClarity();

  window.OnlinePDFProThirdParty = {
    isProdHost: isProdHost,
    hideAdSlots: hideAdSlots
  };
})();
