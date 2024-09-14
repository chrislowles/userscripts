// ==UserScript==
// @name YouTube: Open w/ FreeTube
// @description Adds a button to open the currently opened video in FreeTube (if installed)
// @author Chris Lowles
// @version 2024.9.14
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/yt-open-w-freetube.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @match http*://www.youtube.com/*
// @run-at document-start
// ==/UserScript==

document.addEventListener("yt-navigate-start", function () {
  document.querySelector("openwft").remove();
});

document.addEventListener("yt-navigate-finish", function (event) {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") {
    waitForKeyElements("#bottom-row #owner", () => {
      document.querySelector("#bottom-row #owner #subscribe-button").insertAdjacentHTML("afterend", `
        <openwft>
          <style>
            .open-freetube {
              padding: 10px 12px;
              margin-left: 8px;
              border-radius: 17px;
              font-size: 13.5px;
              font-weight: bold;
              color: var(--primary-background-color);
              background: var(--paper-menu-background-color);
              text-decoration: none;
            } .open-freetube:hover {
              text-decoration:underline;
            }
          </style>
          <a href="freetube://${window.location.href}" class="open-freetube">FreeTube</a>
        </openwft>
      `);
    });
    waitForEl();
  }
});