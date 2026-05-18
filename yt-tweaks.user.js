// ==UserScript==
// @name            YouTube Tweaks
// @namespace       https://chrislowles.com/
// @version         2026.5.18
// @description     Combined YouTube tweaks: front page redirect to subscriptions, comment auto-expander, FreeTube opener, RSS Parrot subscribe button, and timestamp zeroing. Each feature is individually toggleable from the script manager menu.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// @require         https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-tweaks.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-tweaks.user.js
// @run-at          document-start
// ==/UserScript==

(function () {
  'use strict';

  // ── Storage keys ─────────────────────────────────────────────────────────────

  const KEY_FRONT_TO_SUBS   = 'yt_tweak_front_to_subs';
  const KEY_AUTOEXPAND      = 'yt_tweak_autoexpand_comments';
  const KEY_FREETUBE        = 'yt_tweak_open_freetube';
  const KEY_RSS_PARROT      = 'yt_tweak_rss_parrot';
  const KEY_ZERO_TIMESTAMP  = 'yt_tweak_zero_timestamp';
  const KEY_PARROT_INSTANCE = 'rssparrot_instance';

  // ── Toggle helpers ───────────────────────────────────────────────────────────

  function get(key, def) { return GM_getValue(key, def); }
  function set(key, val) { GM_setValue(key, val); }

  function toggleFeature(key, label, def) {
    const next = !get(key, def);
    set(key, next);
    alert(`${label}: ${next ? 'ON' : 'OFF'}\nReload the page for this to take effect.`);
  }

  // ── Menu commands ─────────────────────────────────────────────────────────────
  // State is read at registration time and shown inline in the label.
  // After toggling, the user needs to reload for the label to update.

  GM_registerMenuCommand(
    `${get(KEY_FRONT_TO_SUBS, true) ? 'ON' : 'OFF'} Front Page → Subscriptions`,
    () => toggleFeature(KEY_FRONT_TO_SUBS,  'Front Page → Subscriptions', true)
  );
  GM_registerMenuCommand(
    `${get(KEY_AUTOEXPAND, true) ? 'ON' : 'OFF'} Auto-Expand Comments`,
    () => toggleFeature(KEY_AUTOEXPAND,     'Auto-Expand Comments', true)
  );
  GM_registerMenuCommand(
    `${get(KEY_FREETUBE, false) ? 'ON' : 'OFF'} Open in FreeTube`,
    () => toggleFeature(KEY_FREETUBE,       'Open in FreeTube', false)
  );
  GM_registerMenuCommand(
    `${get(KEY_RSS_PARROT, true) ? 'ON' : 'OFF'} RSS Parrot Subscribe Button`,
    () => toggleFeature(KEY_RSS_PARROT, 'RSS Parrot Subscribe Button', true)
  );
  GM_registerMenuCommand(
    `${get(KEY_ZERO_TIMESTAMP, true)  ? 'ON' : 'OFF'} Zero Out Timestamps`,
    () => toggleFeature(KEY_ZERO_TIMESTAMP, 'Zero Out Timestamps', true)
  );
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWEAK 1 — Front Page → Subscriptions
  // Redirects youtube.com/ to /feed/subscriptions and rewrites home links
  // before YouTube's own handlers fire.
  // ═══════════════════════════════════════════════════════════════════════════════

  if (get(KEY_FRONT_TO_SUBS, true)) {
    const SUBS = '/feed/subscriptions';

    function redirectIfHome() {
      if (location.pathname === '/') location.pathname = SUBS;
    }

    // YouTube's native SPA navigation event — fires on every page transition.
    document.addEventListener('yt-navigate-finish', redirectIfHome);

    // Browser back/forward.
    window.addEventListener('popstate', redirectIfHome);

    // Rewrite home links at the capture phase before YouTube's handlers fire.
    window.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a || !a.href) return;
      try {
        const url = new URL(a.href);
        if (url.hostname === location.hostname && url.pathname === '/') {
          a.pathname = SUBS;
        }
      } catch (_) {}
    }, true);

    // Initial check for direct navigation to youtube.com.
    redirectIfHome();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWEAK 2 — Auto-Expand Comments
  // Clicks truncated "Read more" / "Show more" buttons in comment threads.
  // ═══════════════════════════════════════════════════════════════════════════════

  if (get(KEY_AUTOEXPAND, true)) {
    function expandComments() {
      const selectors = [
        'tp-yt-paper-button#more',
        'button#more',
        'ytd-expander tp-yt-paper-button',
        '#more-button button',
      ];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(button => {
          const text = button.textContent.toLowerCase();
          if (
            (text.includes('read more') || text.includes('show more')) &&
            button.offsetParent !== null
          ) {
            button.click();
          }
        });
      });
    }

    setTimeout(expandComments, 2000);

    const commentObserver = new MutationObserver(mutations => {
      let shouldExpand = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.matches && (
            node.matches('ytd-comment-thread-renderer') ||
            node.matches('ytd-comment-renderer') ||
            node.querySelector?.('ytd-comment-thread-renderer') ||
            node.querySelector?.('ytd-comment-renderer')
          )) {
            shouldExpand = true;
          }
        });
      });
      if (shouldExpand) setTimeout(expandComments, 500);
    });

    function startCommentObserver() {
      const commentsSection = document.querySelector('ytd-comments#comments');
      if (commentsSection) {
        commentObserver.observe(commentsSection, { childList: true, subtree: true });
      } else {
        setTimeout(startCommentObserver, 1000);
      }
    }

    window.addEventListener('load', startCommentObserver);

    let scrollTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(expandComments, 300);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWEAK 3 — Open in FreeTube
  // Fires the freetube:// protocol handler whenever a watch page loads.
  // Defaults to OFF — enable from the menu if FreeTube is installed.
  // ═══════════════════════════════════════════════════════════════════════════════

  if (get(KEY_FREETUBE, false)) {
    document.addEventListener('yt-navigate-finish', event => {
      if (event.detail?.pageType === 'watch') {
        window.open(`freetube://${window.location.href}`, '_top');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWEAK 4 — RSS Parrot Subscribe Button
  // Injects a "🦜 Follow via RSS Parrot" button next to the Subscribe button on
  // watch pages and channel pages. Composes a post to @birb@rss-parrot.net on
  // your configured ActivityPub instance.
  // ═══════════════════════════════════════════════════════════════════════════════

  if (get(KEY_RSS_PARROT, true)) {
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

    // Falls back to prompting if instance not yet set (mirrors original behaviour).
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
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TWEAK 5 — Zero Out Timestamps
  // Silently zeros any ?t= parameter on /watch pages, forcing playback from the
  // start while cleanly removing the parameter from the URL.
  // ═══════════════════════════════════════════════════════════════════════════════

  if (get(KEY_ZERO_TIMESTAMP, true)) {
    let prevTimestampURL = '';

    new MutationObserver(() => {
      if (location.href === prevTimestampURL) return;
      prevTimestampURL = location.href;

      const tParam = new URL(window.location.href).searchParams.get('t');
      if (
        window.location.pathname === '/watch' &&
        tParam !== null &&
        parseInt(tParam.replace('s', '')) > 0
      ) {
        const params = new URLSearchParams(window.location.search);
        params.set('t', 0);
        window.location.search = `?${params.toString()}`;
      }
    }).observe(document, { subtree: true, childList: true });
  }

})();