// ==UserScript==
// @name          Oddsnends (Personal Use)
// @description   Random bits of script that are too inconsequential to actually put into its own userscript.
// @version       2026.3.26-1
// @author        Chris Lowles
// @run-at        document-start
// @resource      libredirect https://raw.githubusercontent.com/libredirect/instances/refs/heads/main/data.json
// @require       https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @require       https://cdn.jsdelivr.net/gh/CoeJoder/GM_wrench@v1.5/dist/GM_wrench.min.js
// @require       https://cdn.jsdelivr.net/gh/hgoebl/mobile-detect.js@1.4.5/mobile-detect.min.js
// @grant         GM_addStyle
// @grant         GM_getResourceText
// @grant         GM_xmlhttpRequest
// @updateURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/oddsnends.user.js
// @downloadURL   https://raw.githubusercontent.com/chrislowles/userscripts/main/oddsnends.user.js
// ==/UserScript==

// redirect medium to scribe.rip (refer to contents in libredirect variable)

const md = new MobileDetect(window.navigator.userAgent);
var libredirect = JSON.parse(GM_getResourceText("libredirect"));

// Detect Breezewiki instances and apply CSS
var breezewiki = libredirect["breezeWiki"]["clearnet"];
breezewiki.forEach((instance, index) => {
    if (instance === `${window.location.protocol}//${window.location.host}`) {
        console.log("You're on a BreezeWiki instance");
        GM_addStyle(`
            .spoiler, .notice, .pull-quote::before, .bw-theme__select, .bw-top-banner {
                display: none !important;
            }
            .page {
                max-width: 100vw !important;
                margin: 0 auto !important;
            }
        `)
    }
});

// Single page app tweaks
let prevURL = '';
let simpCityClicked = false;

function handleURLChange() {
    if (location.href === prevURL) return;
    prevURL = location.href;
    console.log(`URL changed to ${location.href}`);
    document.querySelector("body")?.setAttribute("data-url", window.location.href);

    // Reset the simpcity flag on URL change
    simpCityClicked = false;

    switch (window.location.href) {
        case "https://music.apple.com/us/browse":
        case "https://music.apple.com/gb/browse": {
            window.location.href = "https://music.apple.com/au/browse";
        }
    }

    switch (window.location.host) {
        case "codeberg.org": {
            if (window.location.pathname.substr(1).split("/")[0] == "explore") {
                switch (window.location.pathname.substr(1).split("/")[1]) {
                    // case "repos":
                    // case "users":
                    // case "organizations":
                    // fix links to re-query current query as repo/user/org search
                }
            }
        }
        case "www.twitch.tv": {
            if (window.location.pathname == "/") {
                window.location.href = "https://www.twitch.tv/directory/following";
            }
        }
        case "bsky.app": {
            // I'm primarily on Mastodon/GTS and follow Bluesky accounts through Bridgy middleware,
            // the stored permalink in syndicated posts leads to the official Bluesky web app post view,
            // this conditionally checks if it's that and asks if you want to view it through blueviewer.pages.dev, a thirdparty BSKY/ATProto dataviewer.
            // Match the URL to extract the handle (Group 2) and the Post RKey (Group 3)
            const bskyMatch = window.location.href.match(/https?:\/\/(www\.)?bsky\.app\/profile\/([^\/]+)\/post\/([a-zA-Z0-9]+)/);
            if (bskyMatch) {
                const handle = bskyMatch[2];
                const rkey = bskyMatch[3];
                window.location.replace(`https://blueviewer.pages.dev/view?actor=${handle}&rkey=${rkey}`)
            }
        }
        // Reverse image search sometimes returns multiples of the same Threads posts and Reddit threads
        case "www.threads.com": {
            if (new URL(window.location.href).searchParams.get("hl")) {
                let url = new URL(window.location.href);
                let params = new URLSearchParams(url.search);
                params.delete('hl');
                window.location.search = `?${params.toString()}`;
            }
        }
        case "www.reddit.com": {
            if (new URL(window.location.href).searchParams.get("tl")) {
                let url = new URL(window.location.href);
                let params = new URLSearchParams(url.search);
                params.delete('tl');
                window.location.search = `?${params.toString()}`;
            }
            switch (window.location.pathname) {
                case "/":
                    window.location.pathname = "/top/";
                break;
                case "/r/all":
                case "/r/all/":
                    window.location.pathname = "/r/all/top/";
                break;
            }
        }
        case "www.youtube.com": {
                const tParam = new URL(window.location.href).searchParams.get("t");
                if (window.location.pathname == "/watch" && tParam !== null && parseInt(tParam) > 0) {
                    let url = new URL(window.location.href);
                    let params = new URLSearchParams(url.search);
                    params.set('t', 0);
                    window.location.search = `?${params.toString()}`;
                }
            break;
        }
        case "lemmy.zip": {
            if (
                window.location.pathname.substr(1).split("/")[0] == "post" &&
                new URL(window.location.href).searchParams.get("sort") === null
            ) {
                let url = new URL(window.location.href);
                let params = new URLSearchParams(url.search);
                params.set('scrollToComments', true);
                params.set('sort', "Top");
                window.location.search = `?${params.toString()}`;
            }
        }
        case "masto-fe.superseriousbusiness.org": {
            waitForKeyElements(".spoiler-input__input", () => {
                setInterval(() => {
                    document.querySelector(".spoiler-input__input").setAttribute("placeholder", "(Optional) Title / CW");
                }, 1000);
            });
        }
        case "lite.duckduckgo.com": {
            waitForKeyElements(".query", () => {
                document.querySelector(".query").focus();
            });
        }
        case "youtube-thumbnail-grabber.com": {
            waitForKeyElements("#inputURL", () => {
                document.querySelectorAll("#inputURL")[0].focus();
            });
        }
        case "arena.ai": {
            if (window.location.pathname === "/") {
                window.location.pathname = "/text/direct";
            }
        }
        case "nixos.wiki": {
            window.location.hostname = "wiki.nixos.org";
        }
        case "coomer.party": {
            window.location.hostname = "coomer.su";
        }
        case "kemono.party": {
            window.location.hostname = "kemono.su";
        }
        case "userscripts.org": {
            window.location.hostname = "userscripts-mirror.org";
        }
        case "www.amazon.com": {
            window.location.hostname = "www.amazon.com.au";
        }
        case "x.com": {
            window.location.hostname = "xcancel.com";
        }
    }
}

// Intercept pushState and replaceState
const _pushState = history.pushState.bind(history);
const _replaceState = history.replaceState.bind(history);

history.pushState = function (...args) {
    _pushState(...args);
    handleURLChange();
};

history.replaceState = function (...args) {
    _replaceState(...args);
    handleURLChange();
};

// Back/forward navigation
window.addEventListener('popstate', handleURLChange);

// Run once on initial load
handleURLChange();

/// SimpCity
// Automatically click accept on mark read screen
if (location.hostname === "simpcity.cr" && location.pathname === "/account/alerts/mark-read") {
    waitForKeyElements("form[action='/account/alerts/mark-read'] button[type='submit']", btn => {
        setTimeout(() => {
            btn.click();
        }, 800);
    });
}
// Automatically check "title only" on the search box
if (location.hostname === "simpcity.cr") {
    waitForKeyElements("form[action='/search/search'] [name='c[title_only]'][value='1']", input_thing => {
        input_thing.click();
    });
}