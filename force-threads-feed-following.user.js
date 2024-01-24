// ==UserScript==
// @name Force Following Feed on Threads
// @namespace https://github.com/chrishazfun
// @version 1.0.55
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
  window.location.pathname == "/" &&
  document.querySelectorAll(".x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xjohtrz.x1s688f.xp07o12.x1yc453h.x1tu3fi.x3x7a5m")[0].innerHTML == "For you"
) {
  window.location.href = "https://www.threads.net/?variant=following";
}