// ==UserScript==
// @name         Fediverse > Local (fediverse.ooo) Redirector
// @namespace    chrislowles.com
// @version      2026.3.18
// @description  Redirects posts on instances of fediverse software to fediverse.ooo.
// @author       Chris, Claude
// @match        *://*/*
// @exclude      *://fediverse.ooo/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/fediverse-ooo-redirector.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/fediverse-ooo-redirector.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 1. Enter your home instance domain here (without https://).
    //    Example: ['mastodon.social', 'sharkey.local']
    const EXCLUDED_DOMAINS = ['mastodon.social','chrislowles.social'];

    // 2. The service you are redirecting to
    const SERVICE_DOMAIN = "fediverse.ooo";

    // --- CONFIGURATION END ---

    const constructRedirectUrl = (currentUrl) => {
        return `https://${SERVICE_DOMAIN}/${currentUrl}`;
    };

    /**
     * Detection Logic
     */
    function isFediverseInstance() {
        // 1. Check for standard "application-name" meta tags
        const appName = document.querySelector('meta[name="application-name"]');
        if (appName) {
            const content = appName.getAttribute('content').toLowerCase();
            const knownApps = ['mastodon', 'misskey', 'sharkey', 'firefish', 'pleroma', 'akkoma', 'friendica', 'pixelfed'];
            if (knownApps.some(app => content.includes(app))) return true;
        }

        // 2. Check for GoToSocial specific signatures
        const fediCreator = document.querySelector('meta[name="fediverse:creator"]');
        if (fediCreator && fediCreator.getAttribute('content').toLowerCase().includes('gotosocial')) return true;

        const generator = document.querySelector('meta[name="generator"]');
        if (generator && generator.getAttribute('content').toLowerCase().includes('gotosocial')) return true;

        // 3. Generic ActivityPub detection (High reliability)
        const activityLink = document.querySelector('link[rel="alternate"][type="application/activity+json"]');
        if (activityLink) return true;

        // 4. DOM-based fallbacks
        if (document.getElementById('mastodon') || document.getElementById('misskey_app')) return true;

        return false;
    }

    // Execution
    const currentHostname = window.location.hostname;

    // CHECK: Is the current domain in our excluded list?
    if (EXCLUDED_DOMAINS.includes(currentHostname)) {
        console.log(`[FediRedirect] Ignored excluded domain: ${currentHostname}`);
        return; // Stop the script here.
    }

    if (isFediverseInstance()) {
        const currentUrl = window.location.href;
        if (currentHostname === SERVICE_DOMAIN) return;

        const newUrl = constructRedirectUrl(currentUrl);
        console.log(`[FediRedirect] Redirecting to ${newUrl}`);
        window.location.replace(newUrl);
    }

})();