// ==UserScript==
// @run-at      document-start
// @name        YouTube: Front Page > Subfeed
// @description Redirects the YouTube Front Page to the Subfeed, by adjusting links in elements that direct there as well as simple checking for the path upon load.
// @author      Chris Lowles
// @version     2026.8.7
// @updateURL   https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @match       http*://www.youtube.com/*
// @match       http*://m.youtube.com/*
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