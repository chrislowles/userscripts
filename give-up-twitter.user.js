// ==UserScript==
// @name Give Up Twitter/X
// @description Redirects any twitter.com/x.com (subdomains too) url and embed to Rick Astleys smash hit.
// @author chrishazfun
// @version 1.7
// @match http*://*.twitter.com/*
// @match http*://*.x.com/*
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// ==/UserScript==

// alternate means
// [document.querySelectorAll("blockquote.twitter-tweet")].map(i => i.replaceWith(``))

if (!(window === window.parent)) {
	// iframes get the wall too
	//window.addEventListener('load', function () {
		setTimeout(() => {
			window.location.href = "https://www.youtube.com/embed/dQw4w9WgXcQ";
		}, 20);
	//});
} else {
	window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
}