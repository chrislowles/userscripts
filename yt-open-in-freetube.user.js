// ==UserScript==
// @name            YouTube Tweak: Open in FreeTube
// @namespace       https://chrislowles.com/
// @version         2026.8.7
// @description     Fires the freetube:// protocol handler whenever a watch page loads.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-in-freetube.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-in-freetube.user.js
// @run-at          document-start
// ==/UserScript==

(function () {
  'use strict';

  document.addEventListener('yt-navigate-finish', event => {
    if (event.detail?.pageType === 'watch') {
      window.open(`freetube://${window.location.href}`, '_top');
    }
  });

})();