// ==UserScript==
// @run-at document-start
// @name Give Up X
// @description Redirects any x.com (subdomains too) url and embed to Rick Astleys smash hit.
// @author Chris Lowles
// @version 2025.10.10
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-x.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-x.user.js
// @match http*://*.x.com/*
// @match http*://*.twitter.com/*
// @match http*://pbs.twimg.com/*
// ==/UserScript==

// if (!(window === window.parent))

window.location.replace("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&cc_load_policy=1&controls=0&fs=0&mute=1&rel=0");