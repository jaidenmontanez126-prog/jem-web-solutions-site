// JEM's own GA4 stream. Embedded demo previews and local development are excluded.
(() => {
  'use strict';
  const productionHosts = ['jemwebsolutions.com', 'www.jemwebsolutions.com'];
  if (window.self !== window.top || !productionHosts.includes(window.location.hostname)) return;
  if (window.jemAnalyticsLoaded) return;
  window.jemAnalyticsLoaded = true;

  const measurementId = 'G-6RVVMDC24T';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(tag);
})();
