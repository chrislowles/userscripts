// ==UserScript==
// @name Force Following Feed on Threads
// @namespace https://github.com/chrishazfun
// @version 1.0.6
// @description Uses multiple methods to force Threads to load in as Chronological by default.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/force-threads-feed-following.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/force-threads-feed-following.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=www.threads.net
// @match http*://www.threads.net/*
// ==/UserScript==

function forceFollowing() {
  if (
    window.location.host == "www.threads.net" &&
    window.location.pathname == "/" &&
    new URL(window.location.href).searchParams.get("variant") == null
  ) {
    window.location.href = "https://www.threads.net/?variant=following";
  }
}

forceFollowing();
setInterval(forceFollowing, 1000);