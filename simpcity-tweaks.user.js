// ==UserScript==
// @name         SimpCity Tweaks
// @namespace    https://chrislowles.com/
// @version      2026.8.7
// @description  Auto-accepts the mark-read screen and checks title-only on search.
// @author       Chris Lowles
// @match        https://simpcity.cr/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/simpcity-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/simpcity-tweaks.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Auto-click accept on mark-read screen
    if (location.pathname === "/account/alerts/mark-read") {
        waitForKeyElements("form[action='/account/alerts/mark-read'] button[type='submit']", btn => {
            setTimeout(() => btn.click(), 800);
        });
    }

    // Auto-check "title only" on search
    waitForKeyElements("form[action='/search/search'] [name='c[title_only]'][value='1']", input => {
        input.click();
    });
})();