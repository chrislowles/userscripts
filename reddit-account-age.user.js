// ==UserScript==
// @name         Reddit Account Age
// @namespace    http://tampermonkey.net/
// @version      2026.3.18
// @description  Displays the account age of a user next to their username in Reddit comments.
// @author       Chris Lowles, Claude
// @match        https://*.reddit.com/*
// @grant        GM_xmlhttpRequest
// @connect      reddit.com
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/reddit-account-age.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/reddit-account-age.user.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 1. SETUP: Keep track of users we have already checked to avoid spamming Reddit.
    const userCache = {};

    // 2. HELPER: Calculate the readable age (e.g., "2 years")
    function calculateAge(createdUTC) {
        const now = Date.now() / 1000; // Current time in seconds
        const diff = now - createdUTC;
        const days = Math.floor(diff / 86400);

        if (days < 30) return `${days}d`;
        if (days < 365) return `${Math.floor(days / 30)}mo`;
        return `${(days / 365).toFixed(1)}y`;
    }

    // 3. HELPER: Fetch data from Reddit's API
    function fetchUserAge(username, element) {
        // If we already know the age, just display it immediately.
        if (userCache[username]) {
            appendAgeTag(element, userCache[username]);
            return;
        }

        // Otherwise, ask Reddit for the info.
        // We use the public "about.json" endpoint.
        const url = `https://www.reddit.com/user/${username}/about.json`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                try {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        const createdUTC = data.data.created_utc;
                        const ageText = calculateAge(createdUTC);

                        // Save to cache so we don't ask again
                        userCache[username] = ageText;

                        // Display the tag
                        appendAgeTag(element, ageText);
                    }
                } catch (e) {
                    console.error("Error parsing Reddit data for:", username);
                }
            }
        });
    }

    // 4. HELPER: Create and attach the "Age Tag" to the username
    function appendAgeTag(element, text) {
        // Prevent adding the tag twice
        if (element.getAttribute('data-age-checked') === 'true') return;

        const badge = document.createElement('span');
        badge.innerText = ` [${text}]`;
        badge.style.color = '#FF4500'; // Reddit Orange
        badge.style.marginLeft = '5px';
        badge.style.fontWeight = 'bold';

        // Add the badge after the username
        element.appendChild(badge);
        element.setAttribute('data-age-checked', 'true');
    }

    // 5. MAIN LOOP: Find usernames on the page
    function scanComments() {
        // This selector targets usernames in comments on modern Reddit and Old Reddit
        // It looks for links containing "/user/"
        const userLinks = document.querySelectorAll(`a[href^="/user/"]:not([data-age-checked]):not([aria-label$="'s profile --- avatar"])`);

        userLinks.forEach(link => {
            // Clean up the username from the link (remove "/user/" and trailing slashes)
            const username = link.getAttribute('href').split('/user/')[1].replace('/', '');

            // Ignore system accounts like [deleted] or AutoModerator if you want
            if (username !== '[deleted]') {
                fetchUserAge(username, link);
            }
        });
    }

    // 6. EXECUTION: Run the scan every 2 seconds to catch new comments as you scroll
    setInterval(scanComments, 2000);

})();