// ==UserScript==
// @name            YouTube Tweak: RSS Parrot Subscribe Button
// @namespace       https://chrislowles.com/
// @version         2026.5.20
// @description     Injects a "Follow via RSS Parrot" button next to the Subscribe button on watch and channel pages.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// @require         https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-rss-parrot-subscribe.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-rss-parrot-subscribe.user.js
// @run-at          document-start
// ==/UserScript==

(function () {
  'use strict';

  const KEY_PARROT_INSTANCE = 'rssparrot_instance';

  function get(key, def) { return GM_getValue(key, def); }
  function set(key, val) { GM_setValue(key, val); }

  GM_registerMenuCommand('RSS Parrot — Configure Instance', () => {
    const current = get(KEY_PARROT_INSTANCE, '');
    const input = prompt(
      'Enter your ActivityPub instance hostname (without https://).\nExample: mastodon.social',
      current
    );
    if (input === null) return;
    const hostname = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!hostname) { alert('No hostname entered — keeping existing.'); return; }
    set(KEY_PARROT_INSTANCE, hostname);
    alert(`RSS Parrot: Instance set to ${hostname}`);
  });

  const PARROT_BUTTON_TAG = 'subwrss';
  const PARROT_HANDLE     = '@birb@rss-parrot.net';

  GM_addStyle(`
    ${PARROT_BUTTON_TAG} {
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      flex-shrink: 0;
    }
    ${PARROT_BUTTON_TAG} a {
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
    ${PARROT_BUTTON_TAG} a:hover {
      background: #3d3d3d;
    }
  `);

  function getOrPromptInstance() {
    let inst = get(KEY_PARROT_INSTANCE, null);
    if (!inst) {
      const input = prompt(
        'Enter your ActivityPub instance hostname (without https://).\nExample: mastodon.social',
        ''
      );
      if (!input) return null;
      inst = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!inst) return null;
      set(KEY_PARROT_INSTANCE, inst);
    }
    return inst;
  }

  function makeParrotButton(channelUrl) {
    const wrapper = document.createElement(PARROT_BUTTON_TAG);
    const anchor  = document.createElement('a');
    anchor.title       = 'Follow this channel via RSS Parrot on your ActivityPub software instance';
    anchor.textContent = 'Follow via RSS Parrot';
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const inst = getOrPromptInstance();
      if (!inst) return;
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

  function removeParrotButton() {
    document.querySelector(PARROT_BUTTON_TAG)?.remove();
  }

  function injectParrotButton(channelUrl, targetEl) {
    if (!targetEl || document.querySelector(PARROT_BUTTON_TAG)) return;
    targetEl.insertAdjacentElement('afterend', makeParrotButton(channelUrl));
  }

  function getChannelUrlFromOwner() {
    const link = document.querySelector(
      '#owner #channel-name a[href], #owner ytd-channel-name a[href]'
    );
    if (!link) return null;
    try { return new URL(link.getAttribute('href'), location.origin).href; } catch (_) { return null; }
  }

  function getChannelUrlFromPath() {
    const match = location.pathname.match(/^\/((?:channel\/UC[\w-]+|@[\w.]+))/);
    return match ? `${location.origin}/${match[1]}` : null;
  }

  document.addEventListener('yt-navigate-start', removeParrotButton);

  document.addEventListener('yt-navigate-finish', event => {
    const pageType = event.detail?.pageType;
    if (pageType === 'watch') {
      waitForKeyElements(
        '#bottom-row ytd-subscribe-button-renderer, #bottom-row #subscribe-button',
        el => {
          const channelUrl = getChannelUrlFromOwner();
          if (channelUrl) injectParrotButton(channelUrl, el);
        }
      );
    } else {
      const channelUrl = getChannelUrlFromPath();
      if (!channelUrl) return;
      waitForKeyElements(
        'ytd-subscribe-button-renderer, #subscribe-button',
        el => injectParrotButton(channelUrl, el)
      );
    }
  });

})();