// ==UserScript==
// @name         Letterboxd Review Autoexpander
// @namespace    http://tampermonkey.net/
// @version      2026.8.7
// @description  Automatically expands all truncated reviews on Letterboxd film and reviews pages, including "more" links.
// @author       Chris Lowles, Gemini
// @match        https://letterboxd.com/film/*/
// @match        https://letterboxd.com/film/*/reviews/by/activity/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/letterboxd-review-autoexpander.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/letterboxd-review-autoexpander.user.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // A Set to keep track of links that have already been clicked to prevent redundant actions.
    const expandedLinks = new Set();

    /**
     * This function finds and clicks all unexpanded "Read the full review" or "more"
     * links on the page. It's designed to be called whenever new content is added.
     */
    function expandAllReviews() {
        // A robust selector that finds all <a> elements.
        const allLinks = document.querySelectorAll('a');

        // Filter the links to find those that contain the desired text,
        // either "Read the full review" or the "more" link.
        // This addresses your feedback and makes the script more flexible.
        const expandLinks = Array.from(allLinks).filter(link => {
            const linkText = link.textContent.trim();
            const isReadFullReview = linkText === 'Read the full review';
            const isMoreLink = linkText === 'more';
            return (isReadFullReview || isMoreLink) && !expandedLinks.has(link);
        });

        // If no new links are found, we can stop the function.
        if (expandLinks.length === 0) {
            return;
        }

        // Loop through each found link and programmatically click it to expand the review.
        expandLinks.forEach(link => {
            link.click();
            // Add the link to our Set so we don't try to click it again.
            expandedLinks.add(link);
        });

        console.log(`Expanded ${expandLinks.length} new review(s).`);
    }

    // We use a MutationObserver to watch for dynamic changes in the DOM.
    // This is the most efficient method for handling asynchronously loaded reviews,
    // as it will automatically run our function whenever new content is added to the page.
    const observer = new MutationObserver(() => {
        expandAllReviews();
    });

    // Start observing the entire document body for new child elements.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // We also use a setInterval as a robust fallback. This ensures that even if
    // the MutationObserver misses something or if there's a different loading
    // behavior, the script will check for new reviews every second.
    setInterval(expandAllReviews, 1000);

    // Run the function once when the window is fully loaded to expand any reviews
    // that are present on the initial page load.
    window.addEventListener('load', expandAllReviews);

})();
