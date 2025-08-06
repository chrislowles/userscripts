// ==UserScript==
// @run-at document-start
// @name Random Stuff For Shows (DNI)
// @description Random quirks to automate and run when doing our show.
// @author Chris Lowles
// @version 2025.8.01
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/show.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/show.user.js
// ==/UserScript==

let prevURL = "";
new MutationObserver(mutations => {
	if (location.href !== prevURL) {
		prevURL = location.href;
		switch (window.location.host) {
			case "www.reddit.com":
			case "reddit.com":
				if (
					![
						"/gallery",
						"/media",
						"/poll",
						"/notifications"
					].find(
						pathPrefix => window.location.pathname.toLowerCase().startsWith(pathPrefix)
					)
				) {
					window.location.host = "old.reddit.com";
				}
				if (
					new URL(window.location.href).searchParams.get("tl")
				) {
					let url = new URL(window.location.href);
					let params = new URLSearchParams(url.search);
					params.delete("tl");
					window.location.search = `?${params.toString()}`;
				}
			break;
			case "www.youtube.com":
				if (
					window.location.pathname == "/watch" &&
					new URL(window.location.href).searchParams.get("list") !== null &&
					new URL(window.location.href).searchParams.get("index") !== null
				) {
					let url = new URL(window.location.href);
					let params = new URLSearchParams(url.search);
					params.set("list", null);
					params.set("index", null);
					params.set("t", 0);
					window.location.search = `?${params.toString()}`;
				}
			break;
			case "x.com":
				window.location.hostname = "xcancel.com";
			break;
			case "old.reddit.com":
				document.querySelector("link[rel='stylesheet'][ref='applied_subreddit_stylesheet']").remove();
			break;
		}
	}
}).observe(document, {
	subtree: true,
	childList: true,
});
