// ==UserScript==
// @run-at document-start
// @name Canonical Redirector
// @license MIT
// @description Automatically redirect referral articles to the original source, based on MSN Redirector by Jamie Landeg-Jones.
// @author Chris Lowles, Jamie Landeg-Jones
// @version 2025.4.5-4
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/canonical-redirector.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/canonical-redirector.user.js
// @grant none
// -- SUPPORTED SITES --
// @match https://*.yahoo.com/*
// @match https://www.msn.com/*
// ==/UserScript==

// Props to the hints from this post: joeytwiddle@github - https://github.com/Tampermonkey/tampermonkey/issues/1279#issuecomment-875386821

(function() {
	'use strict';
	function redirect_to_article() {
		let numAttempts = 0;
		let doneit = 0;
		let tryNow = function() {
			let link_tags = document.getElementsByTagName('link');
			for (let loop = 0; loop < link_tags.length; loop++) {
				if (link_tags[loop].rel && link_tags[loop].rel == 'canonical') {
					const new_url = link_tags[loop].href;
					doneit = 1;
					if (
						new_url.match("^https:\/\/(www\.)?yahoo.com\/") ||
						new_url.match("^https:\/\/(www\.)?msn.com\/")
					) {
						console.info(`Canonical Redirect: Ignoring redirect (same site): ${new_url}`);
					} else {
						console.info(`Canonical Redirect: Redirecting to ${new_url}`);
						window.location = new_url;
					}
				}
			}
			if (!doneit) {
				if (numAttempts++ >= 20) {
					console.warn('Giving up after 20 attempts. Could not find canonical link');
				} else {
					console.info(`Canonical Redirect: Retrying, attempt ${numAttempts.toString()} of 20.`);
					setTimeout(tryNow, 250 * Math.pow (1.1, numAttempts));
				}
			}
		}
		tryNow();
	}
	// Run the filter when the page loads
	window.addEventListener('load', redirect_to_article);
})();