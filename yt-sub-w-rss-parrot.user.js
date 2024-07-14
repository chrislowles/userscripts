// ==UserScript==
// @name YouTube: Subscribe w/ RSS Parrot (WIP)
// @description Shortcut to ask RSS Parrot to create rss bot for YouTube channel that you can follow, used as alternative for subscribing.
// @author chrishazfun
// @version 2024.7.15-1
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-sub-w-rss-parrot.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-sub-w-rss-parrot.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @match http*://www.youtube.com/*
// @run-at document-start
// ==/UserScript==

document.addEventListener("yt-navigate-start", function() {
  document.querySelector("subwrss").remove();
});

function setMstInst(inst) {
  if (localStorage.getItem("mstinst-set") == null) {
    let instPrompt = prompt("You haven't set an instance yet, please do so.")
    
  }
}

document.addEventListener("yt-navigate-finish", function(event) {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") {
    waitForKeyElements("#bottom-row #owner", () => {
      document.querySelector("#bottom-row #owner #subscribe-button").insertAdjacentHTML("afterend", `
        <subwrss>
          <style>
            #bottom-row #owner #subscribe-button {display:none}
            .subwrss a {
              padding: 10px 12px;
              margin-left: 8px;
              border-radius: 17px;
              font-size: 13.5px;
              font-weight: bold;
              color: white;
              background: black;
              text-decoration: none;
            } .subwrss a:hover {
              text-decoration:underline;
            }
          </style>
          <a href="https://${mstInst}/share?text=@birb@rss-parrot.net ${document.querySelector("#owner [href^='/@']").href}" target="_blank">Add</a>
        </subwrss>
      `);
    });
  }
});