// ==UserScript==
// @name         YouTube Front Page to Subfeed
// @namespace    https://github.com/chrislowles
// @version      1.0.2
// @description  Redirects the YouTube Front Page to the Subfeed, by adjusting links in elements that direct there as well as simple checking for the path upon load.
// @source       https://github.com/chrislowles
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-front-to-subs.user.js
// @author       Chris Lowles
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @include      http*://www.youtube.com/*
// @include      http*://m.youtube.com/*
// ==/UserScript==

if (location.pathname === '/') {
	location.pathname = '/feed/subscriptions';
}

window.addEventListener('click', e => {
	const a = e.target.closest('a');
	const url = new URL(a.href);
	if (a && url.pathname === '/') {
		a.pathname = '/feed/subscriptions';
		a.search = '';
		a.className = '';
	}
}, true);