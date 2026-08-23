// ==UserScript==
// @name         Instagram: Front Page > Following Feed
// @namespace    https://chrislowles.com/
// @version      2026.8.22
// @description  Redirects the Instagram front page to the Following feed variant when logged in, with a floating button to jump back to the For You feed.
// @author       Chris Lowles, Claude
// @match        https://www.instagram.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/ig-front-to-following.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/ig-front-to-following.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const BUTTON_ID = 'igff-foryou-btn';
    const STAY_PARAM = 'igff_stay'; // bypass flag: skip the auto-redirect when present

    // Instagram's "sessionid" cookie is HttpOnly, so document.cookie can never
    // see it. "ds_user_id" (your numeric account id) is set alongside it once
    // you're logged in, and unlike sessionid it's readable from JS.
    function isLoggedIn() {
        return document.cookie.split('; ').some(c => c.startsWith('ds_user_id='));
    }

    function onFollowingFeed() {
        return location.pathname === '/' && location.search.includes('variant=following');
    }

    function bypassRequested() {
        return new URLSearchParams(location.search).has(STAY_PARAM);
    }

    // Floating "back to For You" button

    function injectButton() {
        if (!onFollowingFeed()) {
            document.getElementById(BUTTON_ID)?.remove();
            return;
        }
        if (document.getElementById(BUTTON_ID)) return;

        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.type = 'button';
        btn.textContent = 'FYP';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: '9999',
            padding: '10px 16px',
            borderRadius: '4px',
            border: 'none',
            background: '#0095F6',
            color: '#FFF',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
        });
        btn.addEventListener('click', () => {
            window.location.href = `https://www.instagram.com/?${STAY_PARAM}=1`;
        });

        document.body.appendChild(btn);
    }

    // Redirect logic

    let prevURL = '';

    function checkAndRedirect() {
        if (location.href === prevURL) return;
        prevURL = location.href;

        if (
            location.pathname === '/' &&
            !location.search.includes('variant=following') &&
            !bypassRequested() &&
            isLoggedIn()
        ) {
            window.location.replace('https://www.instagram.com/?variant=following');
            return;
        }

        injectButton();
    }

    // Instagram is an SPA, so watch for client-side navigation.
    new MutationObserver(checkAndRedirect).observe(document, {
        subtree: true,
        childList: true
    });

    checkAndRedirect();
})();