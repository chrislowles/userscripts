// ==UserScript==
// @name ActivtyPub - Open Remote Profile in Home Instance
// @namespace https://github.com/chrishazfun
// @version 0.3
// @description Adds button that opens remote profile in a home instance, generic just in case.
// @author chrishazfun
// @match https://*/*
// @grant none
// ==/UserScript==

(function() {

    // Waits for a node to exist before returning it
    function getNode(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
            }
            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    async function createLink() {
        // if (!document.querySelector("#remote-follow")) {
            const accountBtns = document.querySelectorAll(".account__header__tabs__buttons")[0];
            const newBtn = document.createElement("a");
            newBtn.href = `https://${myServer}/${document.querySelector(".account__header__tabs__name h1 small").innerText}`;
            newBtn.innerText = "Open in Home Instance";
            newBtn.style.appearance = "button";
            newBtn.classList.add("button");
            accountBtns.prepend(newBtn);
        // }
    }

    function detectPageChange() {
        let prevURL = '';
        const observer = new MutationObserver((mutations) => {
            if (location.href !== prevURL) {
                prevURL = window.location.href;
                if (host !== myServer && prevURL.match(/^https:\/\/.*\/@.*$/)) {
                    createLink();
                }
            }
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    const myServer = "mastodon.social";
    const host = window.location.host;
    const url = window.location.href;
    const body = document.querySelector("body > #mastodon");

    if (host !== myServer && url.match(/^https:\/\/.*\/@.*$/) && body) {
        createLink();
    } else if (body) {
        detectPageChange();
    }
})();