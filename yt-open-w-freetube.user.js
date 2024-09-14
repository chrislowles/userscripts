// ==UserScript==
// @name YouTube: Open w/ FreeTube
// @description Adds a button to open the currently opened video in FreeTube (if installed)
// @author Chris Lowles
// @version 2024.9.14-1
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @match http*://www.youtube.com/*
// @run-at document-start
// ==/UserScript==

document.addEventListener("yt-navigate-finish", function (event) {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") {
    if (confirm("Open in FreeTube?") == true) {
      window.open(`freetube://${window.location.href}`, "_top");
    } else {
      return false;
    }
  }
});