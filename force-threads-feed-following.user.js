// ==UserScript==
// @name Force Following Feed on Threads
// @description Uses multiple methods to ensure you never have to see For You on Threads, works on Mobile and Desktop.
// @author Chris Lowles
// @version 2024.9.01
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/force-threads-feed-following.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/force-threads-feed-following.user.js
// @match http*://www.threads.net/*
// @grant GM_addStyle
// ==/UserScript==

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	// mobile device
	console.log("is mobile");
	function forceFollowing() {
		if (
			window.location.pathname == "/"
		) {
			window.location.pathname = "/following";
		}
		document.querySelectorAll("[href='/']").forEach(a => { a.href="/following" });
	}
	forceFollowing();
	setInterval(forceFollowing, 1000);
} else {
	// not mobile device
	console.log("not mobile");
	GM_addStyle(`
		.x78zum5.xq8finb.x1ck219j.xdux1f1.x3oybdh.x2pgyrj.x1bdjg05:has([role='link'][href='/for_you']):nth-child(1) {
		  display: none !important;
		}
	`);
}