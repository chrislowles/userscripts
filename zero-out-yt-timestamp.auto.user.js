// ==UserScript==
// @name Zero Out YT Timestamp (Auto)
// @description Prompts to zero out any youtube.com timestamp upon load (without prompt), might be helpful for certain situations.
// @author Chris Lowles
// @version 2025.2.6
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/zero-out-yt-timestamp.auto.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/zero-out-yt-timestamp.auto.user.js
// @match http*://www.youtube.com/*
// ==/UserScript==

document.addEventListener("yt-navigate-finish", function (event) {
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