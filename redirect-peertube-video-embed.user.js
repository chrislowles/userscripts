// ==UserScript==
// @name Redirect PeerTube Video to Fullscreen Embed (WIP)
// @description Redirects detected PeerTube videos to a fullscreen embed url that autoplays, QoL userscript for people that sub to PeerTube channels through ActivityPub-compatible platforms that aren't PeerTube.
// @author Chris Lowles
// @version 2024.8.30
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-peertube-video-embed.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/redirect-peertube-video-embed.user.js
// ==/UserScript==

if (
	document.querySelectorAll("meta[property='og:platform']").length > 0 &&
	document.querySelectorAll("meta[property='og:platform']")[0].getAttribute("content") == "PeerTube" &&
	document.querySelectorAll(".standalone-video-embed").length < 1
) {
	window.location.href = document.querySelectorAll("meta[property='og:video:secure_url']")[0].getAttribute("content");
}

// set title on fullscreen-ish embed page redirect
if (
	document.querySelectorAll("meta[property='og:platform']").length > 0 &&
	document.querySelectorAll("meta[property='og:platform']")[0].getAttribute("content") == "PeerTube" &&
	document.querySelectorAll(".standalone-video-embed").length == 1
) {
	setTimeout(function() {
		document.querySelectorAll("title")[0].innerHTML = document.querySelectorAll(".peertube-dock-title")[0].innerHTML
	}, 1000);
}