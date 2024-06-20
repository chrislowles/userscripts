// ==UserScript==
// @name YouTube: Open w/ FreeTube
// @namespace https://github.com/chrishazfun
// @version 1.0.0
// @description Adds a button to open the currently opened video in FreeTube (if installed)
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-open-w-freetube.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-open-w-freetube.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=www.youtube.com
// @match http*://www.youtube.com/*
// @run-at document-start
// @grant none
// ==/UserScript==

document.addEventListener("yt-navigate-start", function() {
  document.querySelector("openwft").remove();
});

function waitForEl(el){return new Promise((resolve,reject)=>{const intervalId=setInterval(()=>{if(document.querySelector(el)){clearInterval(intervalId);resolve();}},500);});}

document.addEventListener("yt-navigate-finish", function(event) {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") {
    waitForEl("#bottom-row #owner").then(() => {
      document.querySelector("#bottom-row #owner #subscribe-button").insertAdjacentHTML("afterend", `
        <openwft>
          <style>
            .open-freetube {
              padding: 10px 12px;
              margin-left: 12px;
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
  }
});