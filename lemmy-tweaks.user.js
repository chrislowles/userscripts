// ==UserScript==
// @name         Lemmy Tweaks
// @namespace    https://chrislowles.com/
// @version      2026.5.20
// @description  Sorts post comment sections by Top and scrolls to comments on any Lemmy instance. Auto-detects Lemmy via application-name meta tag.
// @author       Chris Lowles
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/lemmy-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/lemmy-tweaks.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY_EXCLUDED = 'lemmy_excluded_instances';

    function getExcludedInstances() {
        const stored = GM_getValue(STORAGE_KEY_EXCLUDED, null);
        if (!stored) return [];
        return stored.split(',').map(s => s.trim()).filter(Boolean);
    }

    function saveExcludedInstances(list) {
        GM_setValue(STORAGE_KEY_EXCLUDED, list.join(','));
    }

    function isLemmyInstance() {
        const appName = document.querySelector('meta[name="application-name"]');
        return appName && appName.getAttribute('content').toLowerCase() === 'lemmy';
    }

    function isExcluded() {
        return getExcludedInstances().includes(window.location.hostname);
    }

    // ── Menu commands ───────────────────────────────────────────────────────────
    GM_registerMenuCommand('Manage excluded instances', () => {
        const current = getExcludedInstances().join(', ');
        const input = prompt(
            `Lemmy instances to exclude (comma-separated hostnames).\n\nExample: beehaw.org, aussie.zone`,
            current
        );

        if (input === null) return;

        const parsed = input.split(',').map(s => s.trim()).filter(Boolean);
        saveExcludedInstances(parsed);
        alert(parsed.length
            ? `Excluded: ${parsed.join(', ')}`
            : 'No instances excluded — script will run on all detected Lemmy instances.'
        );
    });

    GM_registerMenuCommand('Exclude this instance', () => {
        const host = window.location.hostname;
        const list = getExcludedInstances();
        if (list.includes(host)) {
            alert(`${host} is already excluded.`);
            return;
        }
        list.push(host);
        saveExcludedInstances(list);
        alert(`${host} added to exclusion list.`);
    });

    // ── URL change handler ──────────────────────────────────────────────────────
    let prevURL = '';

    function handleURLChange() {
        if (location.href === prevURL) return;
        prevURL = location.href;

        if (
            window.location.pathname.substr(1).split("/")[0] === "post" &&
            new URL(window.location.href).searchParams.get("sort") === null
        ) {
            const params = new URLSearchParams(window.location.search);
            params.set('scrollToComments', true);
            params.set('sort', "Top");
            window.location.search = `?${params.toString()}`;
        }
    }

    // ── Init ────────────────────────────────────────────────────────────────────
    // Detection runs at document-start so the meta tag may not yet be in the DOM.
    // We wait for it via DOMContentLoaded before deciding whether to activate.
    function init() {
        if (isExcluded()) {
            console.log(`[LemmyTweaks] Skipping excluded instance: ${window.location.hostname}`);
            return;
        }

        if (!isLemmyInstance()) return;

        console.log(`[LemmyTweaks] Lemmy instance detected: ${window.location.hostname}`);

        const _pushState = history.pushState.bind(history);
        const _replaceState = history.replaceState.bind(history);

        history.pushState = function (...args) { _pushState(...args); handleURLChange(); };
        history.replaceState = function (...args) { _replaceState(...args); handleURLChange(); };

        window.addEventListener('popstate', handleURLChange);
        handleURLChange();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();