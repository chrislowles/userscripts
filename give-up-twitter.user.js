// ==UserScript==
// @name Give Up Twitter/X
// @namespace https://github.com/chrishazfun
// @version 1.6.0
// @description Redirects any twitter.com/x.com (subdomains too) url to Rick Astleys smash hit. NEW: Twitter embeds may get replaced with a YouTube embed of the song too.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/give-up-twitter.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=x.com
// @match http*://*.twitter.com/*
// @match http*://*.x.com/*
// ==/UserScript==

window.location.href = "https://youtu.be/dQw4w9WgXcQ";

if (!(window === window.parent)) {
	// quick and dirty means to redirect embeds to the video too lol
	window.location.href = "https://www.youtube.com/embed/dQw4w9WgXcQ";
}