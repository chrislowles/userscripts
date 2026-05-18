// ==UserScript==
// @name            YouTube Tweak: Front Page to Subscriptions
// @namespace       https://chrislowles.com/
// @version         2026.5.18-2
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

    // Fires at the very start of a YouTube SPA transition — before any rendering
    // occurs, so there's no flash of the homepage.
    document.addEventListener('yt-navigate-start', redirectIfHome);

    // Fallback: fires after the transition completes.
    document.addEventListener('yt-navigate-finish', redirectIfHome);

    // Browser back/forward.
    window.addEventListener('popstate', redirectIfHome);

    // Belt-and-suspenders: MutationObserver catches any transitions that slip past
    // the YouTube events (e.g. edge cases in certain browser/extension combos).
    let prevURL = '';
    new MutationObserver(() => {
        if (location.href === prevURL) return;
        prevURL = location.href;
        redirectIfHome();
    }).observe(document, {
        subtree: true,
        childList: true
    });

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