// ==UserScript==
// @name         Bandcamp Auto-Close Follow/Mailing List Modal
// @namespace    https://chrislowles.com/
// @version      1.0
// @description  Automatically close the follow/mailing list modal on Bandcamp when it appears.
// @author       You
// @match        https://*.bandcamp.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/bandcamp-autoclose-mailing-list-modal.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/bandcamp-autoclose-mailing-list-modal.user.js
// ==/UserScript==

(function () {
    'use strict';

    const closeModal = () => {
        const closeButton = document.querySelectorAll('.mailing-list-opt-in .ui-dialog-titlebar-close')[0];
        if (closeButton) {
            console.log('Bandcamp follow/mailing list modal detected — closing.');
            closeButton.click();
        }
    };

    // Observe for dynamically added modals
    const observer = new MutationObserver(() => {
        closeModal();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setInterval(closeModal, 1000);

    // Also run once in case it's already open on page load
    closeModal();
})();