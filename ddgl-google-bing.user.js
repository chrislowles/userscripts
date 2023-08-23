// ==UserScript==
// @name         DDG Lite > Google or Bing
// @namespace    https://github.com/chrishazfun
// @version      1.0.2
// @description  Adds two link shortcuts to open any query made on DuckDuckGo Lite on either Google or Bing, the ebil search engines.
// @source       https://github.com/chrishazfun
// @updateURL    https://raw.githubusercontent.com/chrishazfun/userscripts/main/ddgl-google-bing.user.js
// @downloadURL  https://raw.githubusercontent.com/chrishazfun/userscripts/main/ddgl-google-bing.user.js
// @author       chrishazfun
// @icon         https://www.google.com/s2/favicons?sz=64&domain=duckduckgo.com
// @match        http*://lite.duckduckgo.com/lite*?q=*
// ==/UserScript==

var google = document.createElement('a');
google.href = `https://www.google.com/search?q=${document.querySelector("input.query").value}`;
google.target = "_blank";
google.innerHTML = "Google";
// document.querySelector(".filters table tbody tr td:nth-of-type(2)").appendChild(google);

var bing = document.createElement('a');
bing.href = `https://www.bing.com/search?q=${document.querySelector("input.query").value}`;
// bing.style = "display:block";
bing.target = "_blank";
bing.innerHTML = "Bing";
// document.querySelector(".filters table tbody tr td:nth-of-type(2)").appendChild(bing);

document.querySelector(".filters select[name='df']").after(google)
document.querySelector(".filters select[name='df']").after(bing)