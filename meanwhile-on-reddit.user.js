// ==UserScript==
// @name Meanwhile on Reddit
// @namespace https://github.com/
// @version 2.1.0
// @description Injects a sidebar widget on your Lemmy instance showing today's top Reddit posts from a configurable set of subreddits.
// @author Chris, Claude
// @match *://*/*
// @grant GM_xmlhttpRequest
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_registerMenuCommand
// @connect www.reddit.com
// @updateURL https://raw.githubusercontent.com/chrislowles/userscripts/main/meanwhile-on-reddit.user.js
// @downloadURL https://raw.githubusercontent.com/chrislowles/userscripts/main/meanwhile-on-reddit.user.js
// @run-at document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ── Defaults ─────────────────────────────────────────────────────────────────
  const DEFAULT_LEMMY_INSTANCE  = 'lemmy.zip';
  const DEFAULT_REDLIB_INSTANCE = 'https://redlib.perennialte.ch';
  const DEFAULT_SUBREDDITS = [
    'art', 'askreddit', 'books', 'dataisbeautiful', 'diy',
    'explainlikeimfive', 'food', 'gaming', 'history', 'wikipedia',
    'movies', 'music', 'news', 'worldnews', 'nottheonion',
    'pics', 'sports', 'television', 'videos',
  ];

  // ── Storage keys ─────────────────────────────────────────────────────────────
  const STORAGE_KEY_SUBS     = 'rss_subreddits';
  const STORAGE_KEY_INSTANCE = 'rss_lemmy_instance';
  const STORAGE_KEY_REDLIB   = 'rss_redlib_instance';

  // ── Config accessors ─────────────────────────────────────────────────────────
  function getLemmyInstance() {
    return GM_getValue(STORAGE_KEY_INSTANCE, DEFAULT_LEMMY_INSTANCE)
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
  }

  function getRedlibInstance() {
    return GM_getValue(STORAGE_KEY_REDLIB, DEFAULT_REDLIB_INSTANCE)
      .replace(/\/$/, '');
  }

  function getSubreddits() {
    const stored = GM_getValue(STORAGE_KEY_SUBS, null);
    if (!stored) return DEFAULT_SUBREDDITS;
    return stored.split(',').map(s => s.trim().replace(/^r\//i, '')).filter(Boolean);
  }

  function saveSubreddits(list)    { GM_setValue(STORAGE_KEY_SUBS, list.join(','));  }
  function saveLemmyInstance(host) { GM_setValue(STORAGE_KEY_INSTANCE, host);           }
  function saveRedlibInstance(url) { GM_setValue(STORAGE_KEY_REDLIB, url);            }

  // ── Constants ────────────────────────────────────────────────────────────────
  const POST_COUNT   = 20;
  const TIME_FILTER  = 'day';
  const CACHE_TTL_MS = 60 * 60 * 1000;
  const BACKOFF_MS   = 60 * 60 * 1000;
  const WIDGET_ID    = 'meanwhile-on-reddit';

  const CACHE_KEY_DATA    = 'rss_cache_data';
  const CACHE_KEY_TIME    = 'rss_cache_time';
  const CACHE_KEY_BACKOFF = 'rss_cache_backoff';

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatNum(n) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }

  function redlibPostUrl(post) {
    return `${getRedlibInstance()}${post.permalinkPath}`;
  }

  function redlibSubUrl(sub) {
    return `${getRedlibInstance()}/r/${sub}/`;
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  const CSS = `
    #${WIDGET_ID} {
      margin-bottom: 1rem;
      border-radius: 0.5rem;
      overflow: hidden;
      background: var(--bs-card-bg, #1E1E2E);
      border: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.1));
      font-size: 0.95rem;
    }
    #${WIDGET_ID} .rsw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.75rem;
      background: var(--bs-card-cap-bg, rgba(255, 255, 255, 0.05));
      border-bottom: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.1));
      font-weight: 600;
      color: var(--bs-body-color, #CDD6F4);
      letter-spacing: 0.03em;
      text-transform: uppercase;
      font-size: 0.7rem;
    }
    #${WIDGET_ID} .rsw-header-left {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    #${WIDGET_ID} .rsw-refresh {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--bs-secondary, #888);
      font-size: 0.75rem;
      padding: 0;
      line-height: 1;
    }
    #${WIDGET_ID} .rsw-refresh:hover {
      color: var(--bs-body-color, #CDD6F4);
    }
    #${WIDGET_ID} ol {
      margin: 0;
      padding: 0 0 0.4rem;
      list-style: none;
    }
    #${WIDGET_ID} li {
      padding: 0.45rem 0.75rem;
      border-bottom: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.05));
    }
    #${WIDGET_ID} li:last-child {
      border-bottom: none;
    }
    #${WIDGET_ID} .rsw-post {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }
    #${WIDGET_ID} .rsw-title {
      line-height: 1.35;
    }
    #${WIDGET_ID} .rsw-post-title-link {
      color: var(--bs-body-color, #CDD6F4);
      text-decoration: none;
    }
    #${WIDGET_ID} .rsw-post-title-link:hover {
      text-decoration: underline;
      color: #FF4500;
    }
    #${WIDGET_ID} .rsw-post-title-text {
      color: var(--bs-body-color, #CDD6F4);
    }
    #${WIDGET_ID} .rsw-meta {
      font-size: 0.7rem;
      color: var(--bs-secondary, #888);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    #${WIDGET_ID} .rsw-sub-link {
      color: #FF6534;
      text-decoration: none;
      font-weight: 500;
    }
    #${WIDGET_ID} .rsw-sub-link:hover {
      text-decoration: underline;
    }
    #${WIDGET_ID} .rsw-meta-sep {
      margin: 0 0.3em;
      opacity: 0.5;
    }
    #${WIDGET_ID} .rsw-comments-link {
      color: inherit;
      text-decoration: none;
    }
    #${WIDGET_ID} .rsw-comments-link:hover {
      color: #FF4500;
      text-decoration: underline;
    }
    #${WIDGET_ID} .rsw-stale {
      padding: 0.35rem 0.75rem;
      font-size: 0.68rem;
      color: #f9e2af;
      background: rgba(249, 226, 175, 0.08);
      border-bottom: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.05));
    }
    #${WIDGET_ID} .rsw-loading, #${WIDGET_ID} .rsw-error {
      padding: 0.75rem;
      color: var(--bs-secondary, #888);
      text-align: center;
      font-style: italic;
    }
    #${WIDGET_ID} .rsw-error {
      color: #F38BA8;
    }
    #${WIDGET_ID} .rsw-footer {
      padding: 0.35rem 0.75rem;
      text-align: right;
      border-top: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.05));
      color: var(--bs-secondary, #888);
      font-size: 0.65rem;
    }
    #${WIDGET_ID} .rsw-footer a {
      color: inherit;
      text-decoration: none;
    }
    #${WIDGET_ID} .rsw-footer a:hover {
      text-decoration: underline;
    }
  `;

  function injectStyles() {
    if (document.getElementById('rsw-styles')) return;
    const style = document.createElement('style');
    style.id = 'rsw-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ── Reddit fetch ─────────────────────────────────────────────────────────────
  function buildFetchUrl() {
    const multi = getSubreddits().join('+');
    return `https://www.reddit.com/r/${multi}/top.json?limit=${POST_COUNT}&t=${TIME_FILTER}&raw_json=1`;
  }

  function parseJSON(responseText) {
    const json = JSON.parse(responseText);
    return json.data.children.map(c => {
      const d = c.data;
      return {
        title:         d.title,
        sub:           d.subreddit,
        permalinkPath: d.permalink,           // e.g. /r/sub/comments/id/slug/
        score:         d.score,
        numComments:   d.num_comments,
        url:           d.is_self ? null : d.url, // null = text post, otherwise link target
      };
    });
  }

  function fetchRedditPosts() {
    return new Promise((resolve, reject) => {
      const now            = Date.now();
      const cachedData     = GM_getValue(CACHE_KEY_DATA, null);
      const cachedTime     = GM_getValue(CACHE_KEY_TIME, 0);
      const backedOffUntil = GM_getValue(CACHE_KEY_BACKOFF, 0);

      // Fresh cache — serve immediately
      if (cachedData && (now - cachedTime) < CACHE_TTL_MS) {
        resolve({ posts: JSON.parse(cachedData), stale: false });
        return;
      }

      // Still within a 429 backoff window
      if (now < backedOffUntil) {
        if (cachedData) {
          resolve({ posts: JSON.parse(cachedData), stale: true });
        } else {
          const minutesLeft = Math.ceil((backedOffUntil - now) / 60000);
          reject(new Error(`rate_limited:${minutesLeft}`));
        }
        return;
      }

      GM_xmlhttpRequest({
        method: 'GET',
        url: buildFetchUrl(),
        onload(response) {
          if (response.status === 429) {
            GM_setValue(CACHE_KEY_BACKOFF, now + BACKOFF_MS);
            if (cachedData) {
              resolve({ posts: JSON.parse(cachedData), stale: true });
            } else {
              reject(new Error('rate_limited:60'));
            }
            return;
          }
          if (response.status !== 200) {
            if (cachedData) {
              resolve({ posts: JSON.parse(cachedData), stale: true });
            } else {
              reject(new Error(`Reddit returned HTTP ${response.status}`));
            }
            return;
          }
          try {
            const posts = parseJSON(response.responseText);
            GM_setValue(CACHE_KEY_DATA, JSON.stringify(posts));
            GM_setValue(CACHE_KEY_TIME, now);
            GM_deleteValue(CACHE_KEY_BACKOFF);
            resolve({ posts, stale: false });
          } catch (e) {
            reject(e);
          }
        },
        onerror() {
          if (cachedData) {
            resolve({ posts: JSON.parse(cachedData), stale: true });
          } else {
            reject(new Error('Network error fetching Reddit posts'));
          }
        },
      });
    });
  }

  // ── Widget DOM ───────────────────────────────────────────────────────────────
  function buildWidget(state /* 'loading' | 'error' | { posts, stale } */) {
    const widget = document.createElement('div');
    widget.id = WIDGET_ID;

    const redlibMultiUrl = `${getRedlibInstance()}/r/${getSubreddits().join('+')}/top/?t=${TIME_FILTER}`;

    // Header
    const header = document.createElement('div');
    header.className = 'rsw-header';

    const headerLeft = document.createElement('span');
    headerLeft.className = 'rsw-header-left';
    headerLeft.textContent = 'Meanwhile on Reddit';

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'rsw-refresh';
    refreshBtn.title = 'Force refresh';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.addEventListener('click', () => {
      GM_setValue(CACHE_KEY_TIME, 0);
      GM_deleteValue(CACHE_KEY_BACKOFF);
      const existing = document.getElementById(WIDGET_ID);
      if (existing) existing.replaceWith(buildWidget('loading'));
      fetchAndRender();
    });

    header.appendChild(headerLeft);
    header.appendChild(refreshBtn);
    widget.appendChild(header);

    // Body
    if (state === 'loading') {
      const loading = document.createElement('div');
      loading.className = 'rsw-loading';
      loading.textContent = 'Fetching posts…';
      widget.appendChild(loading);
    } else if (state === 'error' || typeof state === 'string') {
      const err = document.createElement('div');
      err.className = 'rsw-error';
      err.textContent = 'Could not load posts. Reddit may be unavailable.';
      widget.appendChild(err);
    } else {
      const { posts, stale } = state;

      if (stale) {
        const notice = document.createElement('div');
        notice.className = 'rsw-stale';
        notice.textContent = '!!! Showing cached posts — Reddit rate limit active';
        widget.appendChild(notice);
      }

      const ol = document.createElement('ol');

      posts.forEach(post => {
        const li = document.createElement('li');

        const postDiv = document.createElement('div');
        postDiv.className = 'rsw-post';

        // ── Row 1: post title ────────────────────────────────────────────────
        // Link post → links to the content URL; text/self post → plain text
        const titleEl = document.createElement('div');
        titleEl.className = 'rsw-title';

        if (post.url) {
          const postTitleLink = document.createElement('a');
          postTitleLink.className = 'rsw-post-title-link';
          postTitleLink.href = post.url;
          postTitleLink.target = '_blank';
          postTitleLink.rel = 'noopener noreferrer';
          postTitleLink.textContent = post.title;
          titleEl.appendChild(postTitleLink);
        } else {
          const postTitleSpan = document.createElement('span');
          postTitleSpan.className = 'rsw-post-title-text';
          postTitleSpan.textContent = post.title;
          titleEl.appendChild(postTitleSpan);
        }

        // ── Row 2: r/subreddit - score points - comment count ────────────────
        const meta = document.createElement('div');
        meta.className = 'rsw-meta';

        const subLink = document.createElement('a');
        subLink.className = 'rsw-sub-link';
        subLink.href = redlibSubUrl(post.sub);
        subLink.target = '_blank';
        subLink.rel = 'noopener noreferrer';
        subLink.textContent = `r/${post.sub}`;

        const sep1 = document.createElement('span');
        sep1.className = 'rsw-meta-sep';
        sep1.textContent = '-';

        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = `${formatNum(post.score)} points`;

        const sep2 = document.createElement('span');
        sep2.className = 'rsw-meta-sep';
        sep2.textContent = '-';

        const commentsLink = document.createElement('a');
        commentsLink.className = 'rsw-comments-link';
        commentsLink.href = redlibPostUrl(post);
        commentsLink.target = '_blank';
        commentsLink.rel = 'noopener noreferrer';
        commentsLink.textContent = `${formatNum(post.numComments)} comments`;

        meta.appendChild(subLink);
        meta.appendChild(sep1);
        meta.appendChild(scoreSpan);
        meta.appendChild(sep2);
        meta.appendChild(commentsLink);

        postDiv.appendChild(titleEl);
        postDiv.appendChild(meta);
        li.appendChild(postDiv);
        ol.appendChild(li);
      });

      widget.appendChild(ol);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'rsw-footer';
    footer.innerHTML = `<a href="${redlibMultiUrl}" target="_blank" rel="noopener noreferrer">Browse on Redlib</a>`;
    widget.appendChild(footer);

    return widget;
  }

  // ── Injection ────────────────────────────────────────────────────────────────
  // Lemmy-UI sidebar selector — the right-hand col on the home/listing pages.
  //
  // Lemmy uses Bootstrap. The front page is a two-col Bootstrap row; the sidebar
  // is the narrower right column. We try a ranked list of selectors and also
  // fall back to heuristic detection (narrow col containing recognisable content).
  //
  // To find the correct selector for your instance, run in DevTools console:
  //   window.__rswDebug()
  function findSidebarTarget() {
    const candidates = [
      '.col-md-4',
      '.container-lg .col-md-4',
      '.container .col-md-4',
      'aside',
      '.site-sidebar',
      '.sidebar-col',
      'div[class*="col-md-4"]',
      'div[class*="col-lg-4"]',
      'div[class*="col-sm-4"]',
    ];

    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.offsetWidth > 0 && el.offsetWidth < window.innerWidth * 0.5) {
        return el;
      }
    }

    // Last-resort heuristic: find Bootstrap col elements, pick the narrow right one
    const allCols = [...document.querySelectorAll('[class]')].filter(el => {
      const cls = el.className;
      return /col-\w*-?[34]/.test(cls) && el.offsetWidth > 0;
    });
    if (allCols.length) {
      allCols.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left);
      return allCols[0];
    }

    return null;
  }

  // Debug helper — call window.__rswDebug() in DevTools to find the right selector
  window.__rswDebug = function () {
    console.group('[RSW] Sidebar selector debug');
    [...document.querySelectorAll('[class]')]
      .filter(el => {
        const w = el.offsetWidth;
        return w > 0 && w < window.innerWidth * 0.5 && el.children.length > 0;
      })
      .slice(0, 20)
      .forEach(el => {
        const r = el.getBoundingClientRect();
        console.log(`x:${Math.round(r.left)} w:${Math.round(r.width)}`, el.tagName, `"${el.className}"`, el);
      });
    console.log('findSidebarTarget() returned:', findSidebarTarget());
    console.groupEnd();
  };

  function isOnFrontPage() {
    const path = window.location.pathname;
    return path === '/' || path === '/home' || path === '';
  }

  function isOnConfiguredInstance() {
    return window.location.hostname === getLemmyInstance();
  }

  function injectWidget() {
    if (!isOnFrontPage()) return;
    if (document.getElementById(WIDGET_ID)) return;

    const target = findSidebarTarget();
    if (!target) return;

    const placeholder = buildWidget('loading');
    target.prepend(placeholder);

    fetchAndRender();
  }

  function fetchAndRender() {
    fetchRedditPosts()
      .then(result => {
        const existing = document.getElementById(WIDGET_ID);
        if (existing) {
          existing.replaceWith(buildWidget(result));
        } else {
          const target = findSidebarTarget();
          if (target) target.prepend(buildWidget(result));
        }
      })
      .catch(() => {
        const existing = document.getElementById(WIDGET_ID);
        if (existing) existing.replaceWith(buildWidget('error'));
      });
  }

  // ── SPA nav detection ────────────────────────────────────────────────────────
  function interceptHistoryMethod(method) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event('rsw:navchange'));
      return result;
    };
  }

  function setupNavListener() {
    interceptHistoryMethod('pushState');
    interceptHistoryMethod('replaceState');
    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('rsw:navchange'));
    });

    let navDebounce = null;
    window.addEventListener('rsw:navchange', () => {
      clearTimeout(navDebounce);
      navDebounce = setTimeout(() => {
        if (!isOnFrontPage()) {
          const w = document.getElementById(WIDGET_ID);
          if (w) w.remove();
          return;
        }
        if (!document.getElementById(WIDGET_ID)) {
          waitForSidebar(injectWidget);
        }
      }, 300);
    });
  }

  // ── MutationObserver fallback ────────────────────────────────────────────────
  function setupMutationFallback() {
    let moDebounce = null;
    const observer = new MutationObserver(() => {
      if (!isOnFrontPage()) return;
      if (document.getElementById(WIDGET_ID)) return;
      clearTimeout(moDebounce);
      moDebounce = setTimeout(injectWidget, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Wait for sidebar to exist ────────────────────────────────────────────────
  function waitForSidebar(cb, attempts = 20, interval = 300) {
    if (findSidebarTarget()) { cb(); return; }
    if (attempts <= 0) return;
    setTimeout(() => waitForSidebar(cb, attempts - 1, interval), interval);
  }

  // ── Menu commands ────────────────────────────────────────────────────────────
  function registerMenuCommands() {
    GM_registerMenuCommand('Configure subreddits', () => {
      const current = getSubreddits().join(', ');
      const input = prompt(`Enter subreddits as a comma-separated list. You can include or omit the r/ prefix — both work.\n\nExample: linux, selfhosted, homelab`, current);

      if (input === null) return;

      const parsed = input
        .split(',')
        .map(s => s.trim().replace(/^r\//i, ''))
        .filter(Boolean);

      if (parsed.length === 0) {
        alert('No valid subreddits entered — keeping existing list.');
        return;
      }

      saveSubreddits(parsed);
      GM_deleteValue(CACHE_KEY_DATA);
      GM_deleteValue(CACHE_KEY_TIME);
      GM_deleteValue(CACHE_KEY_BACKOFF);

      const existing = document.getElementById(WIDGET_ID);
      if (existing) existing.replaceWith(buildWidget('loading'));
      fetchAndRender();

      alert(`Saved! Now tracking: ${parsed.map(s => 'r/' + s).join(', ')}`);
    });

    GM_registerMenuCommand('Configure Lemmy instance', () => {
      const current = getLemmyInstance();
      const input = prompt(
        'Enter your Lemmy instance hostname (no https://).\n\n' +
        'Example: lemmy.world',
        current
      );

      if (input === null) return;

      const hostname = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!hostname) {
        alert('No hostname entered — keeping existing.');
        return;
      }

      saveLemmyInstance(hostname);
      alert(`Lemmy instance set to: ${hostname}
        The widget will now only inject on that domain.
        Reload the page after navigating there.`);
    });

    GM_registerMenuCommand('⚙ Configure Redlib instance', () => {
      const current = getRedlibInstance();
      const input = prompt(
        'Enter your Redlib instance URL (with https://).\n\n' +
        'Example: https://redlib.example.com',
        current
      );

      if (input === null) return;

      const url = input.trim().replace(/\/$/, '');
      if (!url) {
        alert('No URL entered — keeping existing.');
        return;
      }

      saveRedlibInstance(url);

      // Rebuild widget so all links update immediately
      GM_deleteValue(CACHE_KEY_DATA);
      GM_deleteValue(CACHE_KEY_TIME);
      const existing = document.getElementById(WIDGET_ID);
      if (existing) existing.replaceWith(buildWidget('loading'));
      fetchAndRender();

      alert(`Redlib instance set to: ${url}`);
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    // Always register menu commands so the user can configure the instance
    // even before the widget is active on a new domain
    registerMenuCommands();

    if (!isOnConfiguredInstance()) return;

    injectStyles();
    setupNavListener();
    setupMutationFallback();
    waitForSidebar(injectWidget);
  }

  init();
})();