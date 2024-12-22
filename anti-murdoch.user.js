// ==UserScript==
// @name Anti-Murdoch
// @description Makes sure that no matter what, Murdoch-owned outlets never benefit from you.
// @author Chris Lowles
// @version 2024.12.23
// @run-at document-start
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/anti-murdoch.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/anti-murdoch.user.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @resource newscorp-domains https://raw.githubusercontent.com/unixben/blocknewscorp/refs/heads/main/domains.txt
// @match *://*/*
// @grant GM_addStyle
// @grant GM_getResourceText
// ==/UserScript==

// >> Redirect to Wayback if you find yourself on one of their outlets. <<
// Grab txt file of outlet domains
var newscorp = GM_getResourceText("newscorp-domains");
// Split per new line and filters empty items
var newscorpSplit = newscorp.split(/\n/).filter((entry) => {
  return entry.trim() != '';
});
newscorpSplit.forEach((corp, index) => {
  newscorpSplit.push(`www.${corp}`);
});
newscorpSplit.forEach((domain) => {
  if (window.location.host == domain) {
    if (confirm("YOU'RE ON A MURDOCH-RUN SITE, WANNA SEE AN ARCHIVE?") == true) {
      location.href = 'http://web.archive.org/web/*/' + location.href;
    }
  }
});

// TODO: SEARCH ENGINE RESULT HIGHLIGHTING BASED ON LIST
// TODO: SOCIAL MEDIA POST SOURCE HIGHLIGHTING BASED ON LIST (Bsky, Mastodon, YouTube, etc)