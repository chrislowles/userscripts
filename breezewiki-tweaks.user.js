// ==UserScript==
// @name         BreezeWiki Tweaks
// @namespace    https://chrislowles.com/
// @version      2026.8.7
// @description  Detects BreezeWiki instances and applies minimal layout cleanup CSS.
// @author       Chris Lowles
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @resource     libredirect https://raw.githubusercontent.com/libredirect/instances/refs/heads/main/data.json
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/breezewiki-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/breezewiki-tweaks.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const libredirect = JSON.parse(GM_getResourceText("libredirect"));
    const breezewiki = libredirect["breezeWiki"]["clearnet"];

    breezewiki.forEach((instance) => {
        if (instance === `${window.location.protocol}//${window.location.host}`) {
            console.log("You're on a BreezeWiki instance");
            GM_addStyle(`
                .spoiler, .notice, .pull-quote::before, .bw-theme__select, .bw-top-banner {
                    display: none !important;
                }
                .page {
                    max-width: 100vw !important;
                    margin: 0 auto !important;
                }
            `);
        }
    });
})();