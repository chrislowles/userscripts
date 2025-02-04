// ==UserScript==
// @name Gloves
// @description Gloves for when you're made to read or interact with oligarch-run media.
// @author Chris Lowles
// @version 2025.2.4
// @run-at document-start
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/gloves.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/gloves.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @resource domains https://raw.githubusercontent.com/chrislowles/userscripts/refs/heads/main/gloves.txt
// @match *://*/*
// @grant GM_addStyle
// @grant GM_getResourceText
// ==/UserScript==

// grab txt file of outlet domains
var domains = GM_getResourceText("domains");

// split per new line and filters empty items
var domainsSplit = domains.split(/\n/).filter(entry => {
  return entry.trim() != '';
});

// loop through array and push domains with "www." at the front
domainsSplit.forEach(corp => domainsSplit.push(`www.${corp}`));

// loop through array and redirect if you're on one of their outlets.
domainsSplit.forEach((domain) => {
  if (window.location.host == domain) {
    if (confirm("Wanna see an archive?") == true) {
      location.href = 'http://web.archive.org/web/*/' + location.href;
    }
  }
});

// TODO: SEARCH ENGINE RESULT HIGHLIGHTING BASED ON LIST
// TODO: SOCIAL MEDIA POST SOURCE HIGHLIGHTING BASED ON LIST (Bsky, Mastodon, YouTube, etc)