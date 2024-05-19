// ==UserScript==
// @name Zero Out YT Timestamp (Automatic)
// @namespace https://github.com/chrishazfun
// @version 1.0
// @description Zeros out any youtube.com timestamp upon load, might be helpful for certain situations.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp-auto.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp-auto.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @include http*://www.youtube.com/*
// ==/UserScript==

// finish
document.addEventListener("yt-navigate-start", function(event) {
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