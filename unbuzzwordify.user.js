// ==UserScript==
// @run-at          document-start
// @name            Unbuzzwordify
// @description     Replaces buzzwords with other, more entertaining words.
// @author          Chris Lowles
// @version         2026.8.7
// @updateURL       https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify.user.js
// @downloadURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/unbuzzwordify.user.js
// -- sites that break with this
// @exclude-match   *://onlyfans.com/*
// @exclude-match   *://*pcpartpicker.com/*
// @exclude-match   *://*.pcpartpicker.com.au/*
// @exclude-match   *://webapp.licenceready.com.au/*
// @exclude-match   *://*.deviantart.com/*
// @exclude-match   *://*.bandcamp.com/*
// @exclude-match   *://*.codetasty.com/*
// @exclude-match   *://*.vscode.dev/*
// @exclude-match   *://*.x.com/*
// ==/UserScript==

(function () {
    'use strict';

    const PHRASES = [
        "GOATSE",
        "BIG FAT CAWK",
        "DEEZ NUTS",
        "AIRPLANES FULL OF SNAKES",
        "HOLY SHIT THEY HIT THE PENTAGON",
        "Restauraunt QR Code Menu",
    ];

    // \b word boundaries prevent partial matches (e.g. "bespoke", "awoken", "cringeworthy")
    const PATTERN = /\b(?:woke|libtard|conservitard|conservatard|sjw|cringe|social justice warrior|cancel culture|fake news)\b/gi;

    const SKIP_TAGS = new Set([
        'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE',
    ]);

    // Tracks already-processed text nodes to avoid double-processing
    const seen = new WeakSet();

    function randomPhrase() {
        return PHRASES[Math.floor(Math.random() * PHRASES.length)];
    }

    function processTextNode(node) {
        if (seen.has(node)) return;
        seen.add(node);
        const original = node.nodeValue;
        // randomPhrase passed as a function so each individual match rolls independently
        const replaced = original.replace(PATTERN, randomPhrase);
        if (replaced !== original) node.nodeValue = replaced;
    }

    function walk(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
                    if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        let node;
        while ((node = walker.nextNode())) processTextNode(node);
    }

    // Only fires on newly added nodes — no more full-DOM polling
    const observer = new MutationObserver(mutations => {
        for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    processTextNode(node);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    walk(node);
                }
            }
        }
    });

    function start() {
        walk(document.body);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})();