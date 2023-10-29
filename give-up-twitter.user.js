// ==UserScript==
// @name Give Up Twitter/X
// @namespace https://github.com/chrishazfun
// @version 1.6.2
// @description Redirects any twitter.com/x.com (subdomains too) url and embed to Rick Astleys smash hit.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=x.com
// @match http*://*.twitter.com/*
// @match http*://*.x.com/*
// ==/UserScript==

if (!(window === window.parent)) {
	// iframes get it too
	window.addEventListener('load', function () {
		window.location.href = "https://www.youtube.com/embed/dQw4w9WgXcQ";
	});
} else {
	window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
}