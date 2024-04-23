// ==UserScript==
// @name Zero Out YT Timestamp
// @namespace https://github.com/chrishazfun
// @version 1.2.91
// @description Zeros out any youtube.com timestamp upon loading, might be helpful for certain situations.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/zero-out-yt-timestamp.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @include http*://www.youtube.com/*
// ==/UserScript==

document.addEventListener("yt-navigate-start", function() {
	callToThing();
});
  
document.addEventListener("yt-navigate-finish", function(event) {
	console.log(event.detail.pageType, event);
	if (event.detail.pageType == "watch") callToThing();
});

function callToThing() {
	if (new URL(window.location.href).searchParams.get("t").replace("s", "") > 0) {
		if (confirm("We detected you have a timestamp in this video, do you want to clear it out?") == true) {
			let url = new URL(window.location.href);
			let params = new URLSearchParams(url.search);
			params.set('t', 0);
			window.location.search = `?${params.toString()}`;
		} else {
			return false;
		}
	}
}