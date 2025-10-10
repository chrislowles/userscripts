// ==UserScript==
// @run-at document-start
// @name YouTube: Open w/ FreeTube
// @description Redirects any YT watch pages to be opened in FreeTube/FreeTube Android (if installed)
// @author Chris Lowles
// @version 2025.9.30
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @match http*://www.youtube.com/*
// ==/UserScript==

document.addEventListener("yt-navigate-finish", event => {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") window.open(`freetube://${window.location.href}`, "_top");
});