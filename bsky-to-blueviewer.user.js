// ==UserScript==
// @name         Bluesky > Blueviewer
// @namespace    https://chrislowles.com/
// @version      2026.5.20
// @description  Redirects Bluesky post URLs to blueviewer.pages.dev. Useful for posts linked from ActivityPub-syndicated content via Bridgy.
// @author       Chris Lowles
// @match        https://bsky.app/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/bsky-to-blueviewer.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/bsky-to-blueviewer.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    let prevURL = '';

    function checkAndRedirect() {
        if (location.href === prevURL) return;
        prevURL = location.href;

        const match = window.location.href.match(
            /https?:\/\/(www\.)?bsky\.app\/profile\/([^/]+)\/post\/([a-zA-Z0-9]+)/
        );

        if (match) {
            const handle = match[2];
            const rkey = match[3];
            window.location.replace(`https://blueviewer.pages.dev/view?actor=${handle}&rkey=${rkey}`);
        }
    }

    new MutationObserver(checkAndRedirect).observe(document, { subtree: true, childList: true });

    checkAndRedirect();
})();

// Quote Repost of Bridgy Post uses this URL format, adapt this into regex too
// https://bsky.brid.gy/convert/ap/at://did:plc:44ybard66vv44zksje25o7dz/app.bsky.feed.post/3miv2r32nns2e