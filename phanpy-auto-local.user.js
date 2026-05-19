// ==UserScript==
// @name         Phanpy Auto-Switch to My Instance
// @version      2026.5.20
// @description  Automatically clicks "Switch to my instance" button in Phanpy.
// @author       Chris Lowles, Claude
// @match        https://phanpy.social/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/phanpy-auto-local.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/phanpy-auto-local.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Function to click the button if it exists
    function clickSwitchButton() {
        // Look for the button by its text content
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

    // Create a MutationObserver to watch for the button appearing
    const observer = new MutationObserver((mutations) => {
        clickSwitchButton();
    });

    // Start observing the document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also check immediately when script loads
    setTimeout(clickSwitchButton, 500);
    setTimeout(clickSwitchButton, 1000);
    setTimeout(clickSwitchButton, 2000);

    console.log('Phanpy Auto-Switch: Userscript loaded and monitoring for switch button');
})();