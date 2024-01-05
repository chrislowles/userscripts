// ==UserScript==
// @name Old Reddit Mobile
// @namespace https://github.com/chrishazfun
// @version 1.2.61
// @description Redirects www.reddit to an optimized version of old.reddit, uses code from "Old Reddit Please!"
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/old-reddit-mobile.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/old-reddit-mobile.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?domain=www.reddit.com
// --
// @match *://*.reddit.com/*
// @exclude *://www.reddit.com/poll/*
// @grant none
// @run-at document-start
// ==/UserScript==

if (window.location.host == "old.reddit.com") {
	if (document.querySelectorAll("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").length > 0) {
		// clear out custom styles, most of them are broken now anyway
		document.querySelector("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").remove();
	}
	setTimeout(() => {
		// viewport is non-standard, fixing that
		document.querySelector("meta[name='viewport']").setAttribute("content", "width=device-width, initial-scale=1");
		// scaling for zoom glitch, force it
		let vpmeta = document.querySelector('meta[name="viewport"]');
		if (vpmeta === null) {
			vpmeta = document.createElement("meta");
			vpmeta.setAttribute("name", "viewport");
			document.head.appendChild(vpmeta);
			vpmeta = document.querySelector('meta[name="viewport"]');
		}
		vpmeta.setAttribute('content', "initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0");
		let styles = `
		body {
			display: flex;
			flex-direction: column;
		}
		.listingsignupbar, .commentsignupbar, #hsts_pixel, .mobile-web-redirect-bar {
			display: none !important;
		}
		.side {
			float: unset !important;
			width: unset !important;
		}
		.panestack-title {
			border-bottom: unset !important;
		}
		#search input[type="text"] {
			width: 100%
		}
		#header-bottom-right {
			line-height: 9px;
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
	}, 5);
}

// >>> OLD-REDDIT-PLEASE <<<

// Used for optimization when there's too many links on a page
const use_optimization = true;
// Number of links on the page before using optimization
const opti_threshold = 250;
const opti_dataname = 'orp40897';
// Time between each cleanup (in ms)
const clean_interval = 1000;

const log = (msg) => console.log(`[old-reddit-please] ${msg}`);
log("loaded");

/*
	* Pass a link and return the new one if it's a reddit link.
	* Anything else and you'll get the original input back.
*/
function updateLink(url) {
	try {
		var target = new URL(url);
		if (target.hostname == 'www.reddit.com') {
			target.hostname = 'old.reddit.com';
			return target.href;
		} else return url;
	} catch(e) {
		return url;
	}
}

// Main Function
(() => {
	let ready = true;
	let last_count = 0;
	let selector = 'a';
	const update_links = () => {
		if (ready) {
			ready = false;
			if (use_optimization && last_count >= opti_threshold) {
				selector = `a:not([data-${opti_dataname}])`;
			}
			const links = document.querySelectorAll(selector);
			last_count = links.length;
			if (last_count > 0) log('Updated ' + links.length + ' links');
			for (const link of links) {
				// Don't clean links that have already been cleaned
				// This is to prevent slowing down pages when there are a lot of links
				// For example, endless scroll on reddit
				if (use_optimization && selector !== 'a') {
					link.setAttribute(`data-${opti_dataname}`, '1');
				}
				try {
					// Make sure it's a valid URL
					new URL(link.href);
					// Run the cleaner
					const updated = updateLink(link.href);
					if (updated !== link.href) link.setAttribute('href', updated);
				} catch (error) {
					// Ignore invalid URLs
				}
			}
			setTimeout(() => (ready = true), clean_interval);
		}
	};
	const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	const observer = new MutationObserver(update_links);
	observer.observe(document, { childList: true, subtree: true });
	window.addEventListener('load', () => setInterval(update_links, clean_interval));
	update_links();
})();

// Text a URL to make sure it's a Reddit domain
function test(url) {
	return !!url.match(/^(|http(s?):\/\/)(|www.)reddit.com(\/.*|$)/gim);
}

if (test(window.location.href)) {
	window.location.assign(updateLink(window.location.href));
}