// ==UserScript==
// @name         Bluesky > Blueviewer
// @namespace    https://chrislowles.com/
// @version      2026.6.10
// @description  Redirects Bluesky post URLs to blueviewer.pages.dev. Useful for posts linked from ActivityPub-syndicated content via Bridgy.
// @author       Chris Lowles
// @match        https://bsky.app/*
// @match        https://bsky.brid.gy/*
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

        // bsky.app: https://bsky.app/profile/{handle}/post/{rkey}
        const bskyMatch = window.location.href.match(
            /https?:\/\/(www\.)?bsky\.app\/profile\/([^/]+)\/post\/([a-zA-Z0-9]+)/
        );

        if (bskyMatch) {
            const handle = bskyMatch[2];
            const rkey = bskyMatch[3];
            window.location.replace(`https://blueviewer.pages.dev/view?actor=${handle}&rkey=${rkey}`);
            return;
        }

        // bsky.brid.gy: https://bsky.brid.gy/convert/ap/at://did:plc:{did}/app.bsky.feed.post/{rkey}
        const bridgyMatch = window.location.href.match(
            /https?:\/\/bsky\.brid\.gy\/convert\/ap\/at:\/\/(did:[^/]+)\/app\.bsky\.feed\.post\/([a-zA-Z0-9]+)/
        );

        if (bridgyMatch) {
            const did = bridgyMatch[1];
            const rkey = bridgyMatch[2];
            window.location.replace(`https://blueviewer.pages.dev/view?actor=${did}&rkey=${rkey}`);
            return;
        }
    }

    new MutationObserver(checkAndRedirect).observe(document, {
        subtree: true,
        childList: true
    });

    checkAndRedirect();
})();