// ==UserScript==
// @name Gloves
// @description Gloves for when you're made to read or interact with oligarch-run media.
// @author Chris Lowles
// @version 2025.1.27
// @run-at document-start
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/gloves.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/gloves.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @resource domains1 https://raw.githubusercontent.com/chrislowles/userscripts/refs/heads/main/gloves.txt
// @match *://*/*
// @grant GM_addStyle
// @grant GM_getResourceText
// ==/UserScript==

// grab txt file of outlet domains
var domains1 = GM_getResourceText("domains1");

// split per new line and filters empty items
var domains1Split = domains1.split(/\n/).filter(entry => {
  return entry.trim() != '';
});

// loop through array and push domains with "www." at the front
domains1Split.forEach(corp => domains1Split.push(`www.${corp}`));

// loop through array and redirect if you're on one of their outlets.
domains1Split.forEach((domain) => {
  if (window.location.host == domain) {
    GM_addStyle(`html{background-color:black}body{display:none}`);
    if (confirm("Wanna see an archive?") == true) {
      location.href = 'http://web.archive.org/web/*/' + location.href;
    }
  }
});

// TODO: SEARCH ENGINE RESULT HIGHLIGHTING BASED ON LIST
// TODO: SOCIAL MEDIA POST SOURCE HIGHLIGHTING BASED ON LIST (Bsky, Mastodon, YouTube, etc)