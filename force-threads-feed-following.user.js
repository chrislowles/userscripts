// ==UserScript==
// @name Force Following Feed on Threads
// @namespace https://github.com/chrishazfun
// @version 1.0.54
// @description Tries to force Threads to stay on Following by checking sessionStorage keys and refreshing on load detection of "For You" feeds being used.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/force-threads-feed-following.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/force-threads-feed-following.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=www.threads.net
// @match http*://www.threads.net/*
// ==/UserScript==

if (
  window.location.host == "www.threads.net" &&
  (sessionStorage.getItem("feed_variant") == "FOR_YOU" || sessionStorage.getItem("feed_variant") == "for_you" || sessionStorage.getItem("feed_variant") == null)
) {
  sessionStorage.setItem("feed_variant", "following");
  location.reload();
}