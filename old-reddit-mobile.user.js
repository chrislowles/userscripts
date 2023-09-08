// ==UserScript==
// @name         Old Reddit Mobile
// @namespace    http://chrishaz.fun/
// @version      1.1.0
// @description  Redirects www.reddit to an optimized version of old.reddit, uses code from Kain.pw's "Old Reddit Please!"
// @author       chrishazfun (chrishaz.fun)
// @match        *://*.reddit.com/*
// @exclude      *://www.reddit.com/poll/*
// @icon         https://www.google.com/s2/favicons?domain=www.reddit.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

if (window.location.host == "old.reddit.com") {
    setTimeout(() => {
        // viewport is non-standard
        document.querySelector("meta[name='viewport']").setAttribute("content", "width=device-width, initial-scale=1");
        // restyle for mobile
        let styles = `
        body {
            display: flex;
            flex-direction: column;
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
        #header { order: 1; }
        .side { order: 3; }
        .content { order: 2; }
        .footer-parent { order: 4; }
        .debuginfo { order: 5; }
        `
        let stylesEl = document.createElement("style");
        stylesEl.innerHTML = styles;
        document.querySelector("head").prepend(stylesEl);
    }, 100);
}

// Used for optimization when there's too many links on a page
const use_optimization = true;
// Number of links on the page before using optimization
const opti_threshold = 250;
const opti_dataname = 'orp40897';
// Time between each cleanup (in ms)
const clean_interval = 1000;

const log = (msg) => console.log(`[old-reddit-please] ${msg}`);
log("Loaded");

// Text a URL to make sure it's a Reddit domain
function test(url) {
    return !!url.match(/^(|http(s?):\/\/)(|www.)reddit.com(\/.*|$)/gim);
}

/**
 * Pass a link and return the new one if it's a reddit link.
 * Anything else and you'll get the original input back.
 **/
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
                    if(updated !== link.href) link.setAttribute('href', updated);
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

if (test(window.location.href)) {
  window.location.assign(updateLink(window.location.href));
}