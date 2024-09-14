// ==UserScript==
// @name DDG Lite > Google or Bing
// @description Adds two shortcuts to open any query made on DuckDuckGo Lite on either Google or Bing, the ebil search engines.
// @author Chris Lowles
// @version 2024.9.05
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/ddgl-google-bing.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/ddgl-google-bing.user.js
// @match http*://lite.duckduckgo.com/lite*?q=*
// ==/UserScript==

document.querySelector(".filters select[name='df']").after(`
    <a href="https://www.google.com/search?q=${document.querySelector("input.query").value}" style="margin:0 0 0 .5rem;font-size:1.1rem;">Google</a>
    <a href="https://www.bing.com/search?q=${document.querySelector("input.query").value}" style="margin:0 0 0 .8rem;font-size:1.1rem;">Bing</a>
`);

document.querySelector(".filters select[name='df']").after(bing);