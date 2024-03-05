// ==UserScript==
// @name Old Reddit & Fixes
// @namespace https://github.com/chrishazfun
// @version 1.2.65
// @description Comphrehensive script to redirect Reddit to an optimized version of old.reddit, with styles to clean CTAs for "New" Reddit and also code from "Old Reddit Please!"
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/old-reddit-and-fixes.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/old-reddit-and-fixes.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?domain=www.reddit.com
// --
// @match *://*.reddit.com/*
// @exclude *://www.reddit.com/poll/*
// @grant none
// @run-at document-start
// ==/UserScript==

function waitForEl(el) {
	return new Promise((resolve, reject) => {
		const intervalId = setInterval(() => {
			if (document.querySelector(el)) {
				clearInterval(intervalId);
				resolve();
			}
		}, 500);
	});
}

window.mobileAndTabletCheck = function() {
	let check = false;
	(function (a) {
		if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
	})(navigator.userAgent || navigator.vendor || window.opera);
	return check;
};

// simple styles to make site functional, without changing anything really
if (window.location.host == "old.reddit.com" && window.mobileAndTabletCheck() == true) {
	// personally, synced my userscripts on violentmonkey to both mobile and desktop so i need to actually check for mobile use in the script now lol
	if (document.querySelectorAll("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").length > 0) {
		// clear out custom styles, most of them are broken now anyway
		document.querySelector("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").remove();
	}
	setTimeout(() => {
		// viewport is non-standard, fixing that
		document.querySelector("meta[name='viewport']").setAttribute("content", "width=device-width, initial-scale=1");
		// scaling for zoom glitch, force it
		let viewportMeta = document.querySelector('meta[name="viewport"]');
		if (viewportMeta === null) {
			viewportMeta = document.createElement("meta");
			viewportMeta.setAttribute("name", "viewport");
			document.head.appendChild(viewportMeta);
			viewportMeta = document.querySelector('meta[name="viewport"]');
		}
		viewportMeta.setAttribute('content', "initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0");
		let stylesEl = document.createElement("style");
		stylesEl.innerHTML = `
		body {
			display: flex;
			flex-direction: column;
		}
		.listingsignupbar, .commentsignupbar, #hsts_pixel, .mobile-web-redirect-bar, #redesign-beta-optin-btn {
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
		`;
		document.querySelector("head").prepend(stylesEl);
	}, 5);
}

// styles from mobile cut out to also effect desktop use, these things are just shit anywhere you are
let stylesEl = document.createElement("style");
stylesEl.innerHTML = `
#redesign-beta-optin-btn {
	display: none !important;
}
`;
document.querySelector("head").prepend(stylesEl);

// >>> OLD-REDDIT-PLEASE <<<

// Used for optimization when there's too many links on a page
const use_optimization = true;

// Number of links on the page before using optimization
const opti_threshold = 250;
const opti_dataname = 'orp40897';

// Time between each cleanup (in ms)
const clean_interval = 1000;

const log = (msg) => console.log(`[old-reddit-mobile] ${msg}`);
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