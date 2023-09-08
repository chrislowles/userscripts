// ==UserScript==
// @name         old reddit mobile
// @namespace    http://chrishaz.fun/
// @version      1.0
// @description  Improves reddit by redirecting to old.reddit.com and adjusting some styles to fit the form better.
// @author       kain (ksir.pw) / chrishazfun (chrishaz.fun)
// @match        *://*.reddit.com/*
// @exclude      *://www.reddit.com/poll/*
// @icon         https://www.google.com/s2/favicons?domain=www.reddit.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

// chf section {
setTimeout(function() {
	// viewport is non-standard
	document.querySelector("meta[name='viewport']").setAttribute("content", "width=device-width, initial-scale=1");
}, 500);
let styles = `
body {
	display: flex;
	flex-direction: column;
}
.side {
	float: unset;
	background-color: unset;
	margin: 0px 5px 0 5px;
	width: unset;
}
#header { order: 1; }
.side { order: 3; }
.content { order: 2; }
.footer-parent { order: 4; }
.debuginfo { order: 5; }
`
let stylesEl = document.createElement("style");
stylesEl.innerHTML = styles;
document.querySelector("head").prepend(stylesEl);
// }

// kain section {
let oldredditpls = document.createElement("script");
oldredditpls.src = "https://greasyfork.org/scripts/40897-old-reddit-please/code/Old Reddit Please!.user.js";
document.querySelector("head").prepend(oldredditpls);
// }