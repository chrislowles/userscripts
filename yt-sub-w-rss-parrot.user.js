// ==UserScript==
// @run-at          document-start
// @name            YouTube: Subscribe w/ RSS Parrot
// @description     Adds a button on YouTube watch and channel pages to compose a post on your ActivityPub instance addressed to @birb@rss-parrot.net, as an alternative to YouTube in-app subscriptions.
// @author          Chris Lowles, Claude
// @version         2026.5.18
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-sub-w-rss-parrot.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-sub-w-rss-parrot.user.js
// @require         https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @match           http*://www.youtube.com/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY   = 'rssparrot_instance';
    const BUTTON_TAG    = 'subwrss';
    const PARROT_HANDLE = '@birb@rss-parrot.net';

    // ── Instance config ──────────────────────────────────────────────────────

    function getInstance() {
        return GM_getValue(STORAGE_KEY, null);
    }

    function promptForInstance() {
        const current = getInstance() || '';
        const input = prompt(
            'Enter your ActivityPub instance hostname (without https://).\nExample: mastodon.social',
            current
        );
        if (input === null) return null;
        const hostname = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (!hostname) return null;
        GM_setValue(STORAGE_KEY, hostname);
        return hostname;
    }

    GM_registerMenuCommand('Configure ActivityPub instance', () => {
        const result = promptForInstance();
        if (result) alert(`RSS Parrot: Instance set to ${result}`);
    });

    // ── Styles ───────────────────────────────────────────────────────────────

    GM_addStyle(`
        ${BUTTON_TAG} {
            display: inline-flex;
            align-items: center;
            margin-left: 8px;
            flex-shrink: 0;
        }
        ${BUTTON_TAG} a {
            display: inline-flex;
            align-items: center;
            height: 36px;
            padding: 0 16px;
            border-radius: 18px;
            font-family: 'YouTube Sans', 'Roboto', Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #fff;
            background: #212121;
            text-decoration: none;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
        }
        ${BUTTON_TAG} a:hover {
            background: #3d3d3d;
        }
    `);

    // ── Button factory ───────────────────────────────────────────────────────

    function makeButton(channelUrl) {
        const wrapper = document.createElement(BUTTON_TAG);
        const anchor  = document.createElement('a');

        anchor.title       = 'Follow this channel via RSS Parrot on your ActivityPub instance';
        anchor.textContent = '🦜 Follow via RSS Parrot';

        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            let inst = getInstance();
            if (!inst) {
                inst = promptForInstance();
                if (!inst) return;
            }
            const text = `${PARROT_HANDLE} ${channelUrl}`;
            window.open(
                `https://${inst}/share?text=${encodeURIComponent(text)}`,
                '_blank',
                'noopener,noreferrer'
            );
        });

        wrapper.appendChild(anchor);
        return wrapper;
    }

    function removeButton() {
        document.querySelector(BUTTON_TAG)?.remove();
    }

    function injectButton(channelUrl, targetEl) {
        if (!targetEl || document.querySelector(BUTTON_TAG)) return;
        targetEl.insertAdjacentElement('afterend', makeButton(channelUrl));
    }

    // ── Channel URL helpers ──────────────────────────────────────────────────

    // Watch pages: pull the channel URL out of the owner row link.
    // Covers both /@handle and /channel/UCxxx href formats.
    function getChannelUrlFromOwner() {
        const link = document.querySelector(
            '#owner #channel-name a[href], #owner ytd-channel-name a[href]'
        );
        if (!link) return null;
        try {
            return new URL(link.getAttribute('href'), location.origin).href;
        } catch (_) {
            return null;
        }
    }

    // Channel pages: derive the canonical channel URL from the current path,
    // stripping sub-paths like /videos, /about, etc.
    function getChannelUrlFromPath() {
        const match = location.pathname.match(/^\/((?:channel\/UC[\w-]+|@[\w.]+))/);
        return match ? `${location.origin}/${match[1]}` : null;
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    document.addEventListener('yt-navigate-start', removeButton);

    document.addEventListener('yt-navigate-finish', (event) => {
        const pageType = event.detail?.pageType;

        if (pageType === 'watch') {
            // Wait for the subscribe button in the owner row to exist before injecting.
            waitForKeyElements(
                '#bottom-row ytd-subscribe-button-renderer, #bottom-row #subscribe-button',
                (el) => {
                    const channelUrl = getChannelUrlFromOwner();
                    if (channelUrl) injectButton(channelUrl, el);
                }
            );
        } else {
            // Channel pages, browse pages, etc.
            const channelUrl = getChannelUrlFromPath();
            if (!channelUrl) return;
            waitForKeyElements(
                'ytd-subscribe-button-renderer, #subscribe-button',
                (el) => injectButton(channelUrl, el)
            );
        }
    });

})();