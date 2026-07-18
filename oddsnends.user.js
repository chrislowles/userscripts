// ==UserScript==
// @name          Oddsnends (Personal Use)
// @description   Random bits of script that are too inconsequential to put into their own userscript. Now includes Breezewiki tweaks, Bluesky to Blueviewer, Gemini link fixer, Letterboxd review expander, Phanpy auto-local, SimpCity tweaks, YT autoexpand comments.
// @version       2026.7.18
// @author        Chris Lowles
// @run-at        document-start
// @match         *://*/*
// @require       https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.3/waitForKeyElements.js
// @grant         GM_addStyle
// @grant         GM_getResourceText
// @resource      libredirect https://raw.githubusercontent.com/libredirect/instances/refs/heads/main/data.json
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

    // Breezewiki Tweaks
    try {
        const libredirect = JSON.parse(GM_getResourceText("libredirect"));
        const breezewiki = libredirect["breezeWiki"]["clearnet"];
        breezewiki.forEach((instance) => {
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
                `);
            }
        });
    } catch (e) {
        // ignore if no GM or resource
    }
}

// Bluesky to Blueviewer
function bskyToBlueviewer() {
    let bsPrevURL = '';
    function checkAndRedirect() {
        if (location.href === bsPrevURL) return;
        bsPrevURL = location.href;

        const bskyMatch = window.location.href.match(
            /https?:\/\/(www\.)?bsky\.app\/profile\/([^/]+)\/post\/([a-zA-Z0-9]+)/
        );

        if (bskyMatch) {
            const handle = bskyMatch[2];
            const rkey = bskyMatch[3];
            window.location.replace(`https://blueviewer.pages.dev/view?actor=${handle}&rkey=${rkey}`);
            return;
        }

        const bridgyMatch = window.location.href.match(
            /https?:\/\/bsky\.brid\.gy\/convert\/ap\/at:\/\/(did:[^/]+)\/app\.bsky\.feed\.post\/([a-zA-Z0-9]+)/
        );

        if (bridgyMatch) {
            const did = bridgyMatch[1];
            const rkey = bridgyMatch[2];
            window.location.replace(`https://blueviewer.pages.dev/view?actor=${did}&rkey=${rkey}`);
            return;
        }
    }

    new MutationObserver(checkAndRedirect).observe(document, {
        subtree: true,
        childList: true
    });

    checkAndRedirect();
}

// Gemini Link Fixer
function geminiLinkFixer() {
    function fixLinks(node) {
        const links = (node.querySelectorAll ? node.querySelectorAll('a') : []);
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (href.includes('google.com/search') && href.includes('q=')) {
                try {
                    const currentUrl = new URL(href);
                    const queryParam = currentUrl.searchParams.get('q');
                    if (queryParam && queryParam.startsWith('http')) {
                        link.setAttribute('href', queryParam);
                        console.log('Gemini Link Fixer: Fixed URL ->', queryParam);
                    }
                } catch (e) {
                }
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    fixLinks(node);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    fixLinks(document);
}

// Letterboxd Review Autoexpander
function letterboxdExpander() {
    const expandedLinks = new Set();
    function expandAllReviews() {
        const allLinks = document.querySelectorAll('a');
        const expandLinks = Array.from(allLinks).filter(link => {
            const linkText = link.textContent.trim();
            const isReadFullReview = linkText === 'Read the full review';
            const isMoreLink = linkText === 'more';
            return (isReadFullReview || isMoreLink) && !expandedLinks.has(link);
        });
        if (expandLinks.length === 0) {
            return;
        }
        expandLinks.forEach(link => {
            link.click();
            expandedLinks.add(link);
        });
        console.log(`Expanded ${expandLinks.length} new review(s).`);
    }
    const observer = new MutationObserver(() => {
        expandAllReviews();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    setInterval(expandAllReviews, 1000);
    window.addEventListener('load', expandAllReviews);
}

// Phanpy Auto-Local
function phanpyAutoLocal() {
    function clickSwitchButton() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
            const buttonText = button.textContent.trim().toLowerCase();
            if (buttonText.includes('switch to my instance')) {
                console.log('Phanpy Auto-Switch: Found button, clicking...');
                button.click();
                return true;
            }
        }
        return false;
    }
    const observer = new MutationObserver((mutations) => {
        clickSwitchButton();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    setTimeout(clickSwitchButton, 500);
    setTimeout(clickSwitchButton, 1000);
    setTimeout(clickSwitchButton, 2000);
    console.log('Phanpy Auto-Switch: Userscript loaded and monitoring for switch button');
}

// SimpCity Tweaks
function simpcityTweaks() {
    if (location.pathname === "/account/alerts/mark-read") {
        waitForKeyElements("form[action='/account/alerts/mark-read'] button[type='submit']", btn => {
            setTimeout(() => btn.click(), 800);
        });
    }
    waitForKeyElements("form[action='/search/search'] [name='c[title_only]'][value='1']", input => {
        input.click();
    });
}

// YT Autoexpand Comments
function ytAutoexpandComments() {
  function expandComments() {
    const selectors = [
      'tp-yt-paper-button#more',
      'button#more',
      'ytd-expander tp-yt-paper-button',
      '#more-button button',
    ];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(button => {
        const text = button.textContent.toLowerCase();
        if (
          (text.includes('read more') || text.includes('show more')) &&
          button.offsetParent !== null
        ) {
          button.click();
        }
      });
    });
  }

  setTimeout(expandComments, 2000);

  const commentObserver = new MutationObserver(mutations => {
    let shouldExpand = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.matches && (
          node.matches('ytd-comment-thread-renderer') ||
          node.matches('ytd-comment-renderer') ||
          node.querySelector?.('ytd-comment-thread-renderer') ||
          node.querySelector?.('ytd-comment-renderer')
        )) {
          shouldExpand = true;
        }
      });
    });
    if (shouldExpand) setTimeout(expandComments, 500);
  });

  function startCommentObserver() {
    const commentsSection = document.querySelector('ytd-comments#comments');
    if (commentsSection) {
      commentObserver.observe(commentsSection, { childList: true, subtree: true });
    } else {
      setTimeout(startCommentObserver, 1000);
    }
  }

  window.addEventListener('load', startCommentObserver);

  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(expandComments, 300);
  });
}

const _pushState = history.pushState.bind(history);
const _replaceState = history.replaceState.bind(history);

history.pushState = (...args) => { _pushState(...args); handleURLChange(); };
history.replaceState = (...args) => { _replaceState(...args); handleURLChange(); };

window.addEventListener('popstate', handleURLChange);
handleURLChange();

// Run site-specific scripts conditionally
if (location.hostname.includes('bsky.app') || location.hostname.includes('bsky.brid.gy')) {
    bskyToBlueviewer();
}
if (location.hostname.includes('gemini.google.com')) {
    geminiLinkFixer();
}
if (location.hostname.includes('letterboxd.com')) {
    letterboxdExpander();
}
if (location.hostname.includes('phanpy.social')) {
    phanpyAutoLocal();
}
if (location.hostname.includes('simpcity.cr')) {
    simpcityTweaks();
}
if (location.hostname.includes('youtube.com') || location.hostname.includes('m.youtube.com')) {
    ytAutoexpandComments();
}