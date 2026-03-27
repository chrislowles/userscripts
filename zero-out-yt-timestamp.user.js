// ==UserScript==
// @run-at       document-start
// @name         Zero Out YT Timestamp
// @description  Silently zeros out any youtube.com timestamp on load, forcing playback from the start while cleanly removing the parameter.
// @author       Chris Lowles
// @version      2026.3.27
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/zero-out-yt-timestamp.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/zero-out-yt-timestamp.user.js
// @match        http*://www.youtube.com/*
// ==/UserScript==

let prevURL = '';

new MutationObserver(() => {
    if (location.href === prevURL) return;
    prevURL = location.href;

    const tParam = new URL(window.location.href).searchParams.get("t");

    if (
        window.location.pathname === "/watch" &&
        tParam !== null &&
        parseInt(tParam.replace("s", "")) > 0
    ) {
        const params = new URLSearchParams(window.location.search);
        params.set('t', 0);
        window.location.search = `?${params.toString()}`;
    }
}).observe(document, {
    subtree: true,
    childList: true
});