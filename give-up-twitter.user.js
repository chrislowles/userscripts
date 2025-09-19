// ==UserScript==
// @run-at document-start
// @name Give Up Twitter/X
// @description Redirects any twitter.com/x.com (subdomains too) url and embed to Rick Astleys smash hit.
// @author Chris Lowles
// @version 2025.9.20
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-twitter.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-twitter.user.js
// @match http*://*.x.com/*
// @match http*://*.twitter.com/*
// @match http*://pbs.twimg.com/*
// ==/UserScript==

// if (!(window === window.parent))

window.location.replace("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&cc_load_policy=1&controls=0&fs=0&mute=1&rel=0");