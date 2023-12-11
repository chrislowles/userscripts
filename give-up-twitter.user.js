// ==UserScript==
// @name Give Up Twitter/X
// @namespace https://github.com/chrishazfun
// @version 1.6.72
// @description Redirects any twitter.com/x.com (subdomains too) url and embed to Rick Astleys smash hit.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=x.com
// @match http*://*.twitter.com/*
// @match http*://*.x.com/*
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