// ==UserScript==
// @name Force Following Feed on Threads
// @description Uses multiple methods to force Threads to load in as Chronological by default.
// @author Chris Lowles
// @version 2024.8.30
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/force-threads-feed-following.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/force-threads-feed-following.user.js
// @match http*://www.threads.net/*
// ==/UserScript==

function forceFollowing() {
	if (
		window.location.host == "www.threads.net" &&
		window.location.pathname == "/"
	) {
		window.location.pathname = "/following";
	}
	document.querySelectorAll("[href='/']").forEach(a => {a.href="/following"});
}

forceFollowing();
setInterval(forceFollowing, 1000);