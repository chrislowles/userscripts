// ==UserScript==
// @name Old Reddit & Fixes
// @namespace https://github.com/chrishazfun
// @version 1.2.7
// @description Comphrehensive script to redirect Reddit to an optimized version of old.reddit, with styles to clean call-to-actions for "New" Reddit and also code from "Old Reddit Please!", basically pretend Reddit didn't completely fuck up their website.
// @source https://github.com/chrishazfun
// @updateURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/old-reddit-and-fixes.user.js
// @downloadURL https://raw.githubusercontent.com/chrishazfun/userscripts/main/old-reddit-and-fixes.user.js
// @author chrishazfun
// @icon https://www.google.com/s2/favicons?domain=www.reddit.com
// @grant GM_addStyle
// @run-at document-start
// --
// @match https://*.reddit.com/*
// @exclude https://*.reddit.com/poll/*
// @exclude https://*.reddit.com/gallery/*
// @exclude https://www.reddit.com/media*
// @exclude https://chat.reddit.com/*
// @exclude https://www.reddit.com/appeal*
// ==/UserScript==

window.mobileAndTabletCheck = function() {
	let check = false;
	(function (a) {
		if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
	})(navigator.userAgent || navigator.vendor || window.opera);
	return check;
};

let oldReddit = window.location.protocol + "//" + "old.reddit.com" + window.location.pathname + window.location.search + window.location.hash;
window.location.replace(oldReddit);

// Styles to make site functional for both mobile and desktop, adjusting metatags that mess up some other functionality
// Synced my userscripts on Violentmonkey to both mobile and desktop and realized I need to actually check for mobile use in the script now lol
if (window.location.host == "old.reddit.com" && window.mobileAndTabletCheck() == true) {

	// Clear out custom styles, most of them are broken now anyway
	if (document.querySelectorAll("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").length > 0) {
		document.querySelector("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").remove();
	}

	// Fixing nonstandard viewport (STEP 1)
	// document.querySelector("meta[name='viewport']").setAttribute("content", "width=device-width, initial-scale=1");
	// Fixing nonstandard viewport (STEP 2, FORCE SCALING)
	let META_VIEWPORT = document.querySelector('meta[name="viewport"]');
	if (META_VIEWPORT === null) {
		META_VIEWPORT = document.createElement("meta");
		META_VIEWPORT.setAttribute("name", "viewport");
		document.head.appendChild(META_VIEWPORT);
		META_VIEWPORT = document.querySelector('meta[name="viewport"]');
		META_VIEWPORT.setAttribute('content', "initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0");
	}

	// CSS styles for mobile UX
	GM_addStyle(`
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
	`);
}