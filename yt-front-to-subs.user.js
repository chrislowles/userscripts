// ==UserScript==
// @name YouTube Front Page to Subfeed
// @description Redirects the YouTube Front Page to the Subfeed, by adjusting links in elements that direct there as well as simple checking for the path upon load.
// @author chrishazfun
// @version 1.2
// @match http*://www.youtube.com/*
// @match http*://m.youtube.com/*
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-front-to-subs.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-front-to-subs.user.js
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