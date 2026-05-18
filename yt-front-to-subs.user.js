// ==UserScript==
// @name            YouTube Tweak: Front Page to Subscriptions
// @namespace       https://chrislowles.com/
// @version         2026.5.18
// @description     Redirects the YouTube front page to your subscriptions feed and rewrites home links.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @run-at          document-start
// ==/UserScript==

(function () {
  'use strict';

  const SUBS = '/feed/subscriptions';

  function redirectIfHome() {
    if (location.pathname === '/') location.pathname = SUBS;
  }

  // YouTube's native SPA navigation event — fires on every page transition.
  document.addEventListener('yt-navigate-finish', redirectIfHome);

  // Browser back/forward.
  window.addEventListener('popstate', redirectIfHome);

  // Rewrite home links at the capture phase before YouTube's handlers fire.
  window.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || !a.href) return;
    try {
      const url = new URL(a.href);
      if (url.hostname === location.hostname && url.pathname === '/') {
        a.pathname = SUBS;
      }
    } catch (_) {}
  }, true);

  // Initial check for direct navigation to youtube.com.
  redirectIfHome();

})();