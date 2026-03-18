// ==UserScript==
// @name         YouTube Auto-Expand Comments
// @namespace    http://tampermonkey.net/
// @version      2026.3.18
// @description  Automatically clicks "Read more" buttons on truncated YouTube comments
// @author       You
// @match        https://www.youtube.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-autoexpand-comments.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-autoexpand-comments.user.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Function to click all "Read more" buttons
    function expandComments() {
        // YouTube uses different selectors for "Read more" buttons
        const selectors = [
            'tp-yt-paper-button#more',
            'button#more',
            'ytd-expander tp-yt-paper-button',
            '#more-button button'
        ];

        selectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                // Check if button is visible and contains "more" text
                const text = button.textContent.toLowerCase();
                if ((text.includes('read more') || text.includes('show more')) &&
                    button.offsetParent !== null) {
                    button.click();
                }
            });
        });
    }

    // Initial expansion after page load
    setTimeout(expandComments, 2000);

    // Watch for dynamically loaded comments
    const observer = new MutationObserver((mutations) => {
        let shouldExpand = false;

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    // Check if the added node contains comments
                    if (node.matches && (
                        node.matches('ytd-comment-thread-renderer') ||
                        node.matches('ytd-comment-renderer') ||
                        node.querySelector('ytd-comment-thread-renderer') ||
                        node.querySelector('ytd-comment-renderer')
                    )) {
                        shouldExpand = true;
                    }
                }
            });
        });

        if (shouldExpand) {
            setTimeout(expandComments, 500);
        }
    });

    // Observe the comments section
    const config = {
        childList: true,
        subtree: true
    };

    // Start observing when comments section exists
    function startObserving() {
        const commentsSection = document.querySelector('ytd-comments#comments');
        if (commentsSection) {
            observer.observe(commentsSection, config);
        } else {
            // Retry if comments section not yet loaded
            setTimeout(startObserving, 1000);
        }
    }

    startObserving();

    // Also expand when scrolling (for lazy-loaded comments)
    let scrollTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(expandComments, 300);
    });
})();