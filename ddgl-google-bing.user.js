// ==UserScript==
// @name DDG Lite > Google or Bing
// @description Adds two link shortcuts to open any query made on DuckDuckGo Lite on either Google or Bing, the ebil search engines.
// @author chrishazfun
// @version 1.1
// @match http*://lite.duckduckgo.com/lite*?q=*
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/ddgl-google-bing.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/ddgl-google-bing.user.js
// ==/UserScript==

let google = document.createElement('a');
google.href = `https://www.google.com/search?q=${document.querySelector("input.query").value}`;
google.target = "_top";
google.innerHTML = "Google";
google.style.margin = "0 0 0 .5rem";
google.style.fontSize = "1.1rem";

let bing = document.createElement('a');
bing.href = `https://www.bing.com/search?q=${document.querySelector("input.query").value}`;
bing.target = "_top";
bing.innerHTML = "Bing";
bing.style.margin = "0 0 0 .8rem";
bing.style.fontSize = "1.1rem";

document.querySelector(".filters select[name='df']").after(google);
document.querySelector(".filters select[name='df']").after(bing);