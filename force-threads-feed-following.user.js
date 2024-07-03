// ==UserScript==
// @name Force Following Feed on Threads
// @description Uses multiple methods to force Threads to load in as Chronological by default.
// @author chrishazfun
// @version 1.1
// @match http*://www.threads.net/*
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/force-threads-feed-following.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/force-threads-feed-following.user.js
// ==/UserScript==

function forceFollowing() {
  if (
    window.location.host == "www.threads.net" &&
    window.location.pathname == "/"
  ) {
    window.location.pathname = "/following";
  }
  document.querySelectorAll("[href='/']").forEach(a => {a.href="/following"});
}

forceFollowing();
setInterval(forceFollowing, 1000);