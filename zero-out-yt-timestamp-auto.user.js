// ==UserScript==
// @name Zero Out YT Timestamp (Automatic)
// @description Zeros out any youtube.com timestamp upon load, might be helpful for certain situations.
// @author chrishazfun
// @version 2024.7.15
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp-auto.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp-auto.user.js
// @match http*://www.youtube.com/*
// ==/UserScript==

// finish
document.addEventListener("yt-navigate-finish", function(event) {
	console.log(event.detail.pageType, event);
	if (event.detail.pageType == "watch") {
		if (new URL(window.location.href).searchParams.get("t").replace("s", "") > 0) {
			let url = new URL(window.location.href);
			let params = new URLSearchParams(url.search);
			params.set('t', 0);
			window.location.search = `?${params.toString()}`;
		}
	}
});