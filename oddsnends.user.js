// ==UserScript==
// @name          Oddsnends (Personal Use)
// @description   Random bits of script that are too inconsequential to put into their own userscript.
// @version       2026.5.21
// @author        Chris Lowles
// @run-at        document-start
// @match         *://*/*
// @require       https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @grant         none
// @updateURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/oddsnends.user.js
// @downloadURL   https://raw.githubusercontent.com/chrislowles/userscripts/main/oddsnends.user.js
// ==/UserScript==

let prevURL = '';

function handleURLChange() {
    if (location.href === prevURL) return;
    prevURL = location.href;
    document.querySelector("body")?.setAttribute("data-url", window.location.href);

    switch (window.location.href) {
        case "https://music.apple.com/us/browse":
        case "https://music.apple.com/gb/browse":
            window.location.href = "https://music.apple.com/au/browse";
            break;
    }

    switch (window.location.host) {
        case "www.twitch.tv":
            if (window.location.pathname === "/") {
                window.location.href = "https://www.twitch.tv/directory/following";
            }
            break;
        case "www.threads.com":
            if (new URL(window.location.href).searchParams.get("hl")) {
                const params = new URLSearchParams(new URL(window.location.href).search);
                params.delete('hl');
                window.location.search = `?${params.toString()}`;
            }
            break;
        case "masto-fe.superseriousbusiness.org":
            waitForKeyElements(".spoiler-input__input", () => {
                setInterval(() => {
                    document.querySelector(".spoiler-input__input")
                        .setAttribute("placeholder", "(Optional) Title / CW");
                }, 1000);
            });
            break;
        case "lite.duckduckgo.com":
            waitForKeyElements(".query", () => {
                document.querySelector(".query").focus();
            });
            break;
        case "youtube-thumbnail-grabber.com":
            waitForKeyElements("#inputURL", () => {
                document.querySelector("#inputURL").focus();
            });
            break;
        case "arena.ai":
            if (window.location.pathname === "/") {
                window.location.pathname = "/text/direct";
            }
            break;
        case "nixos.wiki":
            window.location.hostname = "wiki.nixos.org";
            break;
        case "coomer.party":
            window.location.hostname = "coomer.su";
            break;
        case "kemono.party":
            window.location.hostname = "kemono.su";
            break;
        case "userscripts.org":
            window.location.hostname = "userscripts-mirror.org";
            break;
        case "www.amazon.com":
            window.location.hostname = "www.amazon.com.au";
            break;
        //case "x.com":
        //    window.location.hostname = "xcancel.com";
        //    break;
    }
}

const _pushState = history.pushState.bind(history);
const _replaceState = history.replaceState.bind(history);

history.pushState = (...args) => { _pushState(...args); handleURLChange(); };
history.replaceState = (...args) => { _replaceState(...args); handleURLChange(); };

window.addEventListener('popstate', handleURLChange);
handleURLChange();