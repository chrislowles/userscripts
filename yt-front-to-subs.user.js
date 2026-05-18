// ==UserScript==
// @run-at      document-start
// @name        YouTube: Front Page > Subfeed
// @description Redirects the YouTube Front Page to the Subfeed, by adjusting links in elements that direct there as well as simple checking for the path upon load.
// @author      Chris Lowles
// @version     2026.5.18
// @updateURL   https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @match       http*://www.youtube.com/*
// @match       http*://m.youtube.com/*
// ==/UserScript==

const SUBS = '/feed/subscriptions';

function redirectIfHome() {
    if (location.pathname === '/') location.pathname = SUBS;
}

// YouTube's native SPA navigation event — fires on every page transition
document.addEventListener('yt-navigate-finish', redirectIfHome);

// Browser back/forward
window.addEventListener('popstate', redirectIfHome);

// Rewrite home links at the capture phase before YouTube's handlers fire
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

// Initial check for direct navigation to youtube.com
redirectIfHome();