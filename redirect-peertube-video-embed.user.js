// ==UserScript==
// @name Redirect PeerTube Video to Fullscreen Embed
// @namespace https://github.com/chrishazfun
// @version 1.0.11
// @description Redirects PeerTube videos to a fullscreen embed url that autoplays, QoL userscript for people that sub to PeerTube channels through Mastodon or other ActivityPub-supported platforms.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/redirect-peertube-video-embed.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/redirect-peertube-video-embed.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=joinpeertube.org
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