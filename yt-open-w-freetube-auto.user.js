// ==UserScript==
// @name YouTube: Open w/ FreeTube (Auto)
// @description Detects when you open a watch page on YouTube and asks if you want to open in FreeTube (if installed)
// @author Chris Lowles
// @version 2024.9.14
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube-auto.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube-auto.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @match http*://www.youtube.com/*
// @run-at document-start
// ==/UserScript==

document.addEventListener("yt-navigate-finish", function (event) {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") {
    window.open(`freetube://${window.location.href}`, "_top");
  }
});