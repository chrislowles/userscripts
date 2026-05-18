// ==UserScript==
// @name            YouTube Tweak: Zero Out Timestamps
// @namespace       https://chrislowles.com/
// @version         2026.5.18
// @description     Silently zeros any ?t= parameter on watch pages to force playback from the start.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-zero-out-timestamps.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-zero-out-timestamps.user.js
// @run-at          document-start
// ==/UserScript==

(function () {
  'use strict';

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

})();