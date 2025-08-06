// ==UserScript==
// @run-at document-start
// @name Give Up Twitter/X
// @description Redirects any twitter.com/x.com (subdomains too) url and embed to Rick Astleys smash hit.
// @author Chris Lowles
// @version 2025.8.07
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-twitter.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/give-up-twitter.user.js
// @match http*://*.x.com/*
// @match http*://*.twitter.com/*
// @match http*://pbs.twimg.com/*
// ==/UserScript==

if (!(window === window.parent)) {
	// iframes get the wall too
	setTimeout(() => {
		document.querySelector("html").innerHTML = `
			<style>
				html, body {
					height: 100%;
					margin: 0;
					padding: 0;
				}
				div, iframe {
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					width: auto;
				}
			</style>
			<div title="STOP USING THAT FUCKING WEBSITE"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&cc_load_policy=1&controls=0&fs=0&mute=1&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" ></iframe></div>
		`;
	}, 20);
} else {
	document.querySelector("html").innerHTML = `
		<style>
			html, body {
				height: 100%;
				margin: 0;
				padding: 0;
			}
			div, iframe {
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				width: auto;
			}
		</style>
		<div title="STOP USING THAT FUCKING WEBSITE"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&cc_load_policy=1&controls=0&fs=0&mute=1&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" ></iframe></div>
	`
}