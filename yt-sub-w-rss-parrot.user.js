// ==UserScript==
// @name YouTube: Subscribe w/ RSS Parrot
// @description Shortcut to ask RSS Parrot to create rss bot for YouTube channel that you can follow, used as alternative for subscribing.
// @author chrishazfun
// @version 1.2
// @match http*://www.youtube.com/*
// @run-at document-start
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-sub-w-rss-parrot.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/yt-sub-w-rss-parrot.user.js
// ==/UserScript==

document.addEventListener("yt-navigate-start", function() {
  document.querySelector("subwrss").remove();
});

function waitForEl(el){return new Promise((resolve,reject)=>{const intervalId=setInterval(()=>{if(document.querySelector(el)){clearInterval(intervalId);resolve();}},500);});}

function setMstInst(inst) {
  if (localStorage.getItem("mstinst-set") == null) {
    let instPrompt = prompt("You haven't set an instance yet, please do so.")
    
  }
}

document.addEventListener("yt-navigate-finish", function(event) {
  console.log(event.detail.pageType, event);
  if (event.detail.pageType == "watch") {
    waitForEl("#bottom-row #owner").then(() => {
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