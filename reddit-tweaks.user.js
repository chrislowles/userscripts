// ==UserScript==
// @name         Reddit Tweaks
// @namespace    https://chrislowles.com/
// @version      2026.3.27
// @description  Strips ?tl= tracking param, redirects / to /top/, and /r/all to /r/all/top/.
// @author       Chris Lowles
// @match        https://www.reddit.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/reddit-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/reddit-tweaks.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    let prevURL = '';

    function handleURLChange() {
        if (location.href === prevURL) return;
        prevURL = location.href;

        // Strip ?tl= tracking param before doing anything else
        if (new URL(window.location.href).searchParams.get("tl")) {
            const params = new URLSearchParams(window.location.search);
            params.delete('tl');
            window.location.search = `?${params.toString()}`;
            return;
        }

        switch (window.location.pathname) {
            case "/":
                window.location.pathname = "/top/";
                break;
            case "/r/all":
            case "/r/all/":
                window.location.pathname = "/r/all/top/";
                break;
        }
    }

    const _pushState = history.pushState.bind(history);
    const _replaceState = history.replaceState.bind(history);

    history.pushState = function (...args) { _pushState(...args); handleURLChange(); };
    history.replaceState = function (...args) { _replaceState(...args); handleURLChange(); };

    window.addEventListener('popstate', handleURLChange);
    handleURLChange();
})();