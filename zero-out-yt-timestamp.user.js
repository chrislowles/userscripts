// ==UserScript==
// @name Zero Out YT Timestamp
// @description Prompts to zero out any youtube.com timestamp upon load, might be helpful for certain situations.
// @author chrishazfun
// @version 1.4
// @match http*://www.youtube.com/*
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp.user.js
// ==/UserScript==

// finish
document.addEventListener("yt-navigate-finish", function(event) {
	console.log(event.detail.pageType, event);
	if (event.detail.pageType == "watch") {
		if (new URL(window.location.href).searchParams.get("t").replace("s", "") > 0) {
			if (confirm("We detected you have a timestamp in this video, do you want to clear it out and start from the beginning?") == true) {
				let url = new URL(window.location.href);
				let params = new URLSearchParams(url.search);
				params.set('t', 0);
				window.location.search = `?${params.toString()}`;
			} else {
				return false;
			}
		}
	}
});