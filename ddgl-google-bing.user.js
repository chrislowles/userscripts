// ==UserScript==
// @name DDG Lite > Google or Bing
// @namespace https://github.com/chrishazfun
// @version 1.0.7
// @description Adds two link shortcuts to open any query made on DuckDuckGo Lite on either Google or Bing, the ebil search engines.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/ddgl-google-bing.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/ddgl-google-bing.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?sz=64&domain=duckduckgo.com
// @match http*://lite.duckduckgo.com/lite*?q=*
// @match https://lite.duckduckgo.com/lite/
// ==/UserScript==

let google = document.createElement('a');
google.href = `https://www.google.com/search?q=${document.querySelector("input.query").value}`;
google.target = "_top";
google.innerHTML = "Google";
google.style.margin = "0 0 0 10px";
google.style.fontSize = "1.4rem";

let bing = document.createElement('a');
bing.href = `https://www.bing.com/search?q=${document.querySelector("input.query").value}`;
bing.target = "_top";
bing.innerHTML = "Bing";
bing.style.margin = "0 0 0 10px";
bing.style.fontSize = "1.4rem";

document.querySelector(".filters select[name='df']").after(google)
document.querySelector(".filters select[name='df']").after(bing)