// ==UserScript==
// @name            YouTube Tweak: Front Page to Subscriptions
// @namespace       https://chrislowles.com/
// @version         2026.5.19
// @description     Redirects the YouTube front page to your subscriptions feed and rewrites home links.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @run-at          document-start
// ==/UserScript==

let prevURL = '';

new MutationObserver(mutations => {
    if (location.href !== prevURL) {
        prevURL = location.href;
        if (location.pathname == "/") location.pathname = '/feed/subscriptions';
    }
}).observe(document, {
    subtree: true,
    childList: true
});

window.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && new URL(a.href).pathname === '/') a.pathname = '/feed/subscriptions';
}, true);