// ==UserScript==
// @name         Gemini Link Fixer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Monitors Gemini for links that point to Google Search queries of URLs and converts them into direct links.
// @author       You
// @match        https://gemini.google.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/gemini-link-fixer.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/gemini-link-fixer.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 1. Define the function that cleans the links
    function fixLinks(node) {
        // We look for all anchor <a> tags within the new content
        // If 'node' is the document, we scan everything. If it's a small update, we scan just that.
        const links = (node.querySelectorAll ? node.querySelectorAll('a') : []);

        links.forEach(link => {
            const href = link.getAttribute('href');

            // Safety check: ensure the link actually has an href
            if (!href) return;

            // 2. The Pattern Matcher
            // We look for links starting with google.com/search that contain a "q=" parameter
            if (href.includes('google.com/search') && href.includes('q=')) {

                try {
                    // Create a URL object to easily parse the parameters
                    const currentUrl = new URL(href);
                    const queryParam = currentUrl.searchParams.get('q');

                    // 3. Verify if the query itself looks like a URL (starts with http)
                    // We check if "q" exists and starts with "http" (or https)
                    if (queryParam && queryParam.startsWith('http')) {

                        // 4. The Switch
                        // Set the link's href to the actual destination
                        link.setAttribute('href', queryParam);

                        // Optional: Add a visual cue (like a green border) so you know it was fixed
                        // link.style.borderBottom = "2px solid #4CAF50";

                        console.log('Gemini Link Fixer: Fixed URL ->', queryParam);
                    }
                } catch (e) {
                    // Ignore errors if URL parsing fails
                }
            }
        });
    }

    // 5. The Watcher (Mutation Observer)
    // This watches the entire body of the page for changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check added nodes (new chat bubbles appearing)
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Ensure it is an Element (not just text)
                    fixLinks(node);
                }
            });
        });
    });

    // Start watching the page body for added elements (subtree: true means look deep inside elements)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run once initially just in case content is already there
    fixLinks(document);

})();