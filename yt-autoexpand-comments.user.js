// ==UserScript==
// @name            YouTube Tweak: Auto-Expand Comments
// @namespace       https://chrislowles.com/
// @version         2026.5.18
// @description     Automatically clicks truncated "Read more" or "Show more" buttons in comment threads.
// @author          Chris Lowles, Claude
// @license         AGPL-3.0-or-later
// @match           http*://www.youtube.com/*
// @match           http*://m.youtube.com/*
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-autoexpand-comments.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-autoexpand-comments.user.js
// @run-at          document-start
// ==/UserScript==

(function () {
  'use strict';

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

})();