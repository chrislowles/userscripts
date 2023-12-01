// ==UserScript==
// @name         Zero Out YT Timestamp
// @namespace    https://github.com/chrislowles
// @version      1.2.9
// @description  Zeros out any youtube.com timestamp upon loading, might be helpful for certain situations.
// @source       https://github.com/chrislowles
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/zero-out-yt-timestamp.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/zero-out-yt-timestamp.user.js
// @author       Chris Lowles
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @include      http*://www.youtube.com/*
// ==/UserScript==

if (new URL(window.location.href).searchParams.get("t").replace("s", "") > 0) {
	let url = new URL(window.location.href);
	let params = new URLSearchParams(url.search);
	params.set('t', 0);
	window.location.search = `?${params.toString()}`;
}