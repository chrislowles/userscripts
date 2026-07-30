// ==UserScript==
// @name         Instagram Spam Hammer
// @namespace    https://chrislowles.com/
// @version      2026.7.30
// @description  Adds a shortcut button to each post that automatically walks through Instagram's report flow and reports the post as spam.
// @author       Chris Lowles, Claude
// @match        https://www.instagram.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/ig-spam-hammer.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/ig-spam-hammer.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Config
    const BUTTON_CLASS   = 'igsh-report-btn';
    const STEP_TIMEOUT   = 2000;   // how long to wait for each menu/dialog to appear
    const POLL_INTERVAL  = 100;

    // Text the script looks for at each stage of Instagram's report flow.
    // Kept as arrays since wording/casing can vary by locale or A/B test.
    const TEXT_MATCHERS = {
        moreOptions: ['more options'],
        report:      ['report'],
        // The "why are you reporting this" screen
        spamReason:  ["it's spam", "its spam", "spam"],
        // Some flows show an extra confirm screen after picking a reason
        submit:      ['submit', 'done', 'ok'],
    };

    // Helpers

    function normalize(str) {
        return (str || '').trim().toLowerCase();
    }

    function textMatches(el, candidates) {
        const t = normalize(el.textContent);
        if (!t) return false;
        return candidates.some(c => t === c || t.includes(c));
    }

    // Finds a clickable element (button, [role=button], [role=menuitem], a)
    // anywhere in the document whose text matches one of the candidates.
    function findClickable(candidates) {
        const selector = 'button, [role="button"], [role="menuitem"], a[role], div[role="button"]';
        const nodes = document.querySelectorAll(selector);
        for (const el of nodes) {
            // Prefer leaf-ish matches (avoid matching a huge wrapping container)
            if (textMatches(el, candidates)) return el;
        }
        return null;
    }

    function waitFor(fn, timeout = STEP_TIMEOUT) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const tick = () => {
                const result = fn();
                if (result) {
                    resolve(result);
                    return;
                }
                if (Date.now() - start > timeout) {
                    reject(new Error('igsh: timed out waiting for step'));
                    return;
                }
                setTimeout(tick, POLL_INTERVAL);
            };
            tick();
        });
    }

    function clickEl(el) {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.click();
    }

    // Report flow

    async function reportPostAsSpam(article, triggerBtn) {
        triggerBtn.disabled = true;
        const originalLabel = triggerBtn.textContent;
        triggerBtn.textContent = '...';

        try {
            // 1. Open the post's "More options" menu.
            const moreBtn = article.querySelector(`.${BUTTON_CLASS}`)
                ? findMoreOptionsButtonWithin(article)
                : null;
            if (!moreBtn) throw new Error('igsh: could not find the post\'s "More options" button');
            clickEl(moreBtn);

            // 2. Click "Report" in the resulting menu.
            const reportItem = await waitFor(() => findClickable(TEXT_MATCHERS.report));
            clickEl(reportItem);

            // 3. Pick "It's spam" as the reason.
            const spamItem = await waitFor(() => findClickable(TEXT_MATCHERS.spamReason));
            clickEl(spamItem);

            // 4. Some flows need an extra confirm/submit tap; if none appears within a short window, treat the report as already complete.
            try {
                const submitItem = await waitFor(() => findClickable(TEXT_MATCHERS.submit), 1500);
                clickEl(submitItem);
            } catch (_) {
                // No submit step shown — report likely already went through.
            }

            triggerBtn.textContent = '✓';
            console.log('[IGSH] Reported post as spam.');
        } catch (err) {
            triggerBtn.textContent = '⚠';
            console.warn(err.message || err);
        } finally {
            setTimeout(() => {
                triggerBtn.textContent = originalLabel;
                triggerBtn.disabled = false;
            }, 2000);
        }
    }

    function findMoreOptionsButtonWithin(article) {
        const selector = 'button, [role="button"], div[role="button"]';
        const nodes = article.querySelectorAll(selector);
        for (const el of nodes) {
            if (textMatches(el, TEXT_MATCHERS.moreOptions)) return el;
            // Instagram sometimes exposes it only via aria-label rather than text
            const label = normalize(el.getAttribute && el.getAttribute('aria-label'));
            if (label && TEXT_MATCHERS.moreOptions.some(c => label.includes(c))) return el;
        }
        return null;
    }

    // Button injection

    function makeReportButton(article) {
        const btn = document.createElement('button');
        btn.className = BUTTON_CLASS;
        btn.type = 'button';
        btn.textContent = 'THIS IS SPAM';
        btn.title = 'Quick-report this post as spam';
        Object.assign(btn.style, {
            marginLeft: '6px',
            padding: '2px 6px',
            fontSize: '13px',
            lineHeight: '1',
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer',
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!confirm('Report this post as spam?')) return;
            reportPostAsSpam(article, btn);
        });
        return btn;
    }

    function injectButtons(root = document) {
        const articles = root.querySelectorAll('article:not([data-igsh-done])');
        articles.forEach(article => {
            const moreBtn = findMoreOptionsButtonWithin(article);
            if (!moreBtn) return; // menu button not rendered yet for this post
            article.setAttribute('data-igsh-done', 'true');
            const btn = makeReportButton(article);
            moreBtn.insertAdjacentElement('afterend', btn);
        });
    }

    // Observe feed for new/changed posts

    const observer = new MutationObserver(() => injectButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial pass + a couple of retries in case the feed loads slowly.
    injectButtons();
    setTimeout(injectButtons, 1000);
    setTimeout(injectButtons, 3000);

})();