// ==UserScript==
// @name          Meanwhile on Reddit
// @namespace     https://chrislowles.com/
// @version       2026.4.29-1
// @description   Injects a header bar on your Lemmy instance showing today's top 3 Reddit posts from a configurable set of subreddits. Also redirects Reddit URLs to your configured Redlib instance.
// @author        Chris Lowles, Claude
// @match         *://*/*
// @grant         GM_xmlhttpRequest
// @grant         GM_setValue
// @grant         GM_getValue
// @grant         GM_deleteValue
// @grant         GM_registerMenuCommand
// @connect       www.reddit.com
// @updateURL     https://raw.githubusercontent.com/chrislowles/userscripts/main/meanwhile-on-reddit.user.js
// @downloadURL   https://raw.githubusercontent.com/chrislowles/userscripts/main/meanwhile-on-reddit.user.js
// @run-at        document-start
// ==/UserScript==

(function () {
  'use strict';

  // ── Defaults ─────────────────────────────────────────────────────────────────
  const DEFAULT_LEMMY_INSTANCE  = 'lemmy.zip';
  const DEFAULT_REDLIB_INSTANCE = 'https://redlib.perennialte.ch';
  const DEFAULT_SUBREDDITS = [
    'art',
    'askreddit',
    'books',
    'dataisbeautiful',
    'diy',
    'explainlikeimfive',
    'food',
    'gaming',
    'history',
    'wikipedia',
    'movies',
    'music',
    'news',
    'worldnews',
    'nottheonion',
    'pics',
    'sports',
    'television',
    'videos',
  ];

  // ── Storage keys ─────────────────────────────────────────────────────────────
  const STORAGE_KEY_SUBS     = 'rss_subreddits';
  const STORAGE_KEY_INSTANCE = 'rss_lemmy_instance';
  const STORAGE_KEY_REDLIB   = 'rss_redlib_instance';
  const STORAGE_KEY_REDIRECT = 'rss_reddit_redirect';

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

  function getRedditRedirectEnabled() {
    return GM_getValue(STORAGE_KEY_REDIRECT, true);
  }

  function getSubreddits() {
    const stored = GM_getValue(STORAGE_KEY_SUBS, null);
    if (!stored) return DEFAULT_SUBREDDITS;
    return stored.split(',').map(s => s.trim().replace(/^r\//i, '')).filter(Boolean);
  }

  function saveSubreddits(list)    { GM_setValue(STORAGE_KEY_SUBS, list.join(','));  }
  function saveLemmyInstance(host) { GM_setValue(STORAGE_KEY_INSTANCE, host);        }
  function saveRedlibInstance(url) { GM_setValue(STORAGE_KEY_REDLIB, url);           }

  // ── Reddit → Redlib Redirector ────────────────────────────────────────────────
  const REDDIT_DOMAINS = [
    'www.reddit.com',
    'reddit.com',
    'old.reddit.com',
    'np.reddit.com',
    'i.reddit.com',
  ];

  const REDLIB_ALLOWED = [
    /^\/?$/,
    /^\/(top|new|hot|rising|controversial)\/?$/,
    /^\/r\/[^/]+(\/)?$/,
    /^\/r\/[^/]+\/(top|new|hot|rising|controversial)\/?$/,
    /^\/r\/[^/]+\/comments\/[^/]+(\/.*)?$/,
    /^\/gallery\/[^/]+\/?$/,
    /^\/user\/[^/]+\/?$/,
    /^\/u\/[^/]+\/?$/,
    /^\/user\/[^/]+\/(posts|comments|submitted)\/?$/,
    /^\/u\/[^/]+\/(posts|comments|submitted)\/?$/,
    /^\/search\/?$/,
    /^\/r\/[^/]+\/search\/?$/,
  ];

  const REDLIB_EXCLUDED = [
    /^\/poll\//,
    /^\/r\/[^/]+\/wiki\//,
    /^\/message\//,
    /^\/inbox\//,
    /^\/settings\//,
    /^\/login\//,
    /^\/register\//,
    /^\/account\//,
    /^\/notifications\//,
    /^\/submit\//,
    /^\/r\/[^/]+\/submit\//,
    /^\/mod\//,
    /^\/r\/[^/]+\/mod\//,
    /^\/r\/[^/]+\/about\//,
    /^\/subreddits\//,
    /^\/r\/[^/]+\/rules\/?$/,
  ];

  function isRedditDomain() {
    return REDDIT_DOMAINS.includes(window.location.hostname);
  }

  function isRedlibPath(pathname) {
    if (REDLIB_EXCLUDED.some(p => p.test(pathname))) return false;
    return REDLIB_ALLOWED.some(p => p.test(pathname));
  }

  function redirectToRedlib() {
    if (!getRedditRedirectEnabled()) return;
    if (!isRedditDomain()) return;
    const pathname = window.location.pathname;
    if (!isRedlibPath(pathname)) return;
    const redlib = getRedlibInstance();
    const normPath = pathname.replace(/^\/u\//, '/user/');
    window.location.replace(`${redlib}${normPath}${window.location.search}`);
  }

  // ── Constants ────────────────────────────────────────────────────────────────
  const POST_COUNT   = 3;
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
      width: 100%;
      box-sizing: border-box;
      background: var(--bs-card-bg, #1E1E2E);
      border-bottom: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.1));
      font-size: 0.82rem;
      font-family: inherit;
      z-index: 900;
    }
    #${WIDGET_ID} .rsw-inner {
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      max-width: 100%;
    }
    #${WIDGET_ID} .rsw-label {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      white-space: nowrap;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--bs-secondary, #888);
      border-right: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.1));
      background: var(--bs-card-cap-bg, rgba(255, 255, 255, 0.04));
      gap: 0.4rem;
    }
    #${WIDGET_ID} .rsw-label a {
      color: inherit;
      text-decoration: none;
    }
    #${WIDGET_ID} .rsw-label a:hover {
      color: #FF4500;
    }
    #${WIDGET_ID} .rsw-refresh {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--bs-secondary, #888);
      font-size: 0.65rem;
      padding: 0;
      line-height: 1;
      font-family: inherit;
    }
    #${WIDGET_ID} .rsw-refresh:hover {
      color: var(--bs-body-color, #CDD6F4);
    }
    #${WIDGET_ID} .rsw-posts {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      min-width: 0;
    }
    #${WIDGET_ID} .rsw-post {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1 1 0;
      min-width: 180px;
      padding: 0.5rem 0.75rem;
      border-right: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.07));
      min-width: 0;
      gap: 0.15rem;
    }
    #${WIDGET_ID} .rsw-post:last-child {
      border-right: none;
    }
    #${WIDGET_ID} .rsw-post-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    #${WIDGET_ID} .rsw-post-title-link {
      color: var(--bs-body-color, #CDD6F4);
      text-decoration: none;
    }
    #${WIDGET_ID} .rsw-post-title-link:hover {
      color: #FF4500;
      text-decoration: underline;
    }
    #${WIDGET_ID} .rsw-meta {
      font-size: 0.68rem;
      color: var(--bs-secondary, #888);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
    }
    #${WIDGET_ID} .rsw-sub-link {
      color: #FF6534;
      text-decoration: none;
      font-weight: 600;
      flex-shrink: 0;
    }
    #${WIDGET_ID} .rsw-sub-link:hover {
      text-decoration: underline;
    }
    #${WIDGET_ID} .rsw-sep {
      opacity: 0.4;
      flex-shrink: 0;
    }
    #${WIDGET_ID} .rsw-comments-link {
      color: inherit;
      text-decoration: none;
      flex-shrink: 0;
    }
    #${WIDGET_ID} .rsw-comments-link:hover {
      color: #FF4500;
      text-decoration: underline;
    }
    #${WIDGET_ID} .rsw-score {
      flex-shrink: 0;
    }
    #${WIDGET_ID} .rsw-status {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.75rem;
      color: var(--bs-secondary, #888);
      font-style: italic;
      font-size: 0.78rem;
    }
    #${WIDGET_ID} .rsw-status.error {
      color: #F38BA8;
    }
    #${WIDGET_ID} .rsw-stale {
      display: flex;
      align-items: center;
      padding: 0 0.5rem;
      font-size: 0.65rem;
      color: #f9e2af;
      flex-shrink: 0;
      white-space: nowrap;
    }

    @media (max-width: 600px) {
      #${WIDGET_ID} .rsw-label {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.1));
        padding: 0.35rem 0.75rem;
      }
      #${WIDGET_ID} .rsw-posts {
        flex-direction: column;
        width: 100%;
      }
      #${WIDGET_ID} .rsw-post {
        border-right: none;
        border-bottom: 1px solid var(--bs-border-color, rgba(255, 255, 255, 0.07));
        flex: none;
        min-width: unset;
      }
      #${WIDGET_ID} .rsw-post:last-child {
        border-bottom: none;
      }
      #${WIDGET_ID} .rsw-post-title {
        white-space: normal;
      }
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
        permalinkPath: d.permalink,
        score:         d.score,
        numComments:   d.num_comments,
        url:           d.is_self ? null : d.url,
      };
    });
  }

  function fetchRedditPosts() {
    return new Promise((resolve, reject) => {
      const now            = Date.now();
      const cachedData     = GM_getValue(CACHE_KEY_DATA, null);
      const cachedTime     = GM_getValue(CACHE_KEY_TIME, 0);
      const backedOffUntil = GM_getValue(CACHE_KEY_BACKOFF, 0);

      if (cachedData && (now - cachedTime) < CACHE_TTL_MS) {
        resolve({ posts: JSON.parse(cachedData), stale: false });
        return;
      }

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
  function buildWidget(state) {
    const widget = document.createElement('div');
    widget.id = WIDGET_ID;

    const redlibMultiUrl = `${getRedlibInstance()}/r/${getSubreddits().join('+')}/top/?t=${TIME_FILTER}`;

    const inner = document.createElement('div');
    inner.className = 'rsw-inner';

    // Label / header cell
    const label = document.createElement('div');
    label.className = 'rsw-label';

    const labelLink = document.createElement('a');
    labelLink.href = redlibMultiUrl;
    labelLink.target = '_blank';
    labelLink.rel = 'noopener noreferrer';
    labelLink.textContent = 'Meanwhile on Reddit';
    label.appendChild(labelLink);

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'rsw-refresh';
    refreshBtn.title = 'Force refresh';
    refreshBtn.textContent = '↻';
    refreshBtn.addEventListener('click', () => {
      GM_setValue(CACHE_KEY_TIME, 0);
      GM_deleteValue(CACHE_KEY_BACKOFF);
      const existing = document.getElementById(WIDGET_ID);
      if (existing) existing.replaceWith(buildWidget('loading'));
      fetchAndRender();
    });
    label.appendChild(refreshBtn);

    inner.appendChild(label);

    if (state === 'loading') {
      const status = document.createElement('div');
      status.className = 'rsw-status';
      status.textContent = 'Fetching posts…';
      inner.appendChild(status);
    } else if (state === 'error') {
      const status = document.createElement('div');
      status.className = 'rsw-status error';
      status.textContent = 'Could not load — Reddit may be unavailable.';
      inner.appendChild(status);
    } else {
      const { posts, stale } = state;

      if (stale) {
        const notice = document.createElement('div');
        notice.className = 'rsw-stale';
        notice.textContent = '⚠ Cached';
        notice.title = 'Showing cached posts — Reddit rate limit active';
        inner.appendChild(notice);
      }

      const postsEl = document.createElement('div');
      postsEl.className = 'rsw-posts';

      posts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'rsw-post';

        // Title row
        const titleEl = document.createElement('div');
        titleEl.className = 'rsw-post-title';

        if (post.url) {
          const link = document.createElement('a');
          link.className = 'rsw-post-title-link';
          link.href = post.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = post.title;
          link.title = post.title;
          titleEl.appendChild(link);
        } else {
          const commentsLink = document.createElement('a');
          commentsLink.className = 'rsw-post-title-link';
          commentsLink.href = redlibPostUrl(post);
          commentsLink.target = '_blank';
          commentsLink.rel = 'noopener noreferrer';
          commentsLink.textContent = post.title;
          commentsLink.title = post.title;
          titleEl.appendChild(commentsLink);
        }

        // Meta row
        const meta = document.createElement('div');
        meta.className = 'rsw-meta';

        const subLink = document.createElement('a');
        subLink.className = 'rsw-sub-link';
        subLink.href = redlibSubUrl(post.sub);
        subLink.target = '_blank';
        subLink.rel = 'noopener noreferrer';
        subLink.textContent = `r/${post.sub}`;

        const sep1 = document.createElement('span');
        sep1.className = 'rsw-sep';
        sep1.textContent = '·';

        const score = document.createElement('span');
        score.className = 'rsw-score';
        score.textContent = `${formatNum(post.score)} pts`;

        const sep2 = document.createElement('span');
        sep2.className = 'rsw-sep';
        sep2.textContent = '·';

        const commentsLink = document.createElement('a');
        commentsLink.className = 'rsw-comments-link';
        commentsLink.href = redlibPostUrl(post);
        commentsLink.target = '_blank';
        commentsLink.rel = 'noopener noreferrer';
        commentsLink.textContent = `${formatNum(post.numComments)} comments`;

        meta.appendChild(subLink);
        meta.appendChild(sep1);
        meta.appendChild(score);
        meta.appendChild(sep2);
        meta.appendChild(commentsLink);

        postEl.appendChild(titleEl);
        postEl.appendChild(meta);
        postsEl.appendChild(postEl);
      });

      inner.appendChild(postsEl);
    }

    widget.appendChild(inner);
    return widget;
  }

  // ── Injection ────────────────────────────────────────────────────────────────

  function findNavTarget() {
    const candidates = [
      'nav.navbar',
      'nav',
      'header',
      '.site-header',
      '#navbar',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

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

    const nav = findNavTarget();
    if (!nav) return;

    const placeholder = buildWidget('loading');
    nav.insertAdjacentElement('afterend', placeholder);

    fetchAndRender();
  }

  function fetchAndRender() {
    fetchRedditPosts()
      .then(result => {
        const existing = document.getElementById(WIDGET_ID);
        if (existing) {
          existing.replaceWith(buildWidget(result));
        } else {
          const nav = findNavTarget();
          if (nav) nav.insertAdjacentElement('afterend', buildWidget(result));
        }
      })
      .catch(() => {
        const existing = document.getElementById(WIDGET_ID);
        if (existing) existing.replaceWith(buildWidget('error'));
      });
  }

  // ── Nav wait helper ───────────────────────────────────────────────────────────
  // Uses a MutationObserver for the initial wait, falls back to polling.
  // Self-cleans once the nav is found or the timeout expires.
  function waitForNav(cb, timeoutMs = 10000) {
    if (findNavTarget()) { cb(); return; }

    let done = false;
    let timer = null;

    const observer = new MutationObserver(() => {
      if (done) return;
      if (findNavTarget()) {
        done = true;
        clearTimeout(timer);
        observer.disconnect();
        cb();
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Hard timeout so we don't leak observers on pages where nav never appears.
    timer = setTimeout(() => {
      if (!done) {
        done = true;
        observer.disconnect();
      }
    }, timeoutMs);
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
          // Use waitForNav so we retry if the SPA nav hasn't re-rendered the
          // header yet by the time the debounce fires.
          waitForNav(injectWidget);
        }
      }, 500);
    });
  }

  // ── Mutation fallback ────────────────────────────────────────────────────────
  // Catches cases where the initial waitForNav fired before the SPA did a
  // second render pass that wiped the widget. Calls waitForNav (not injectWidget
  // directly) so we don't bail silently if the nav isn't stable yet.
  function setupMutationFallback() {
    let moDebounce = null;
    const observer = new MutationObserver(() => {
      if (!isOnFrontPage()) return;
      if (document.getElementById(WIDGET_ID)) return;
      clearTimeout(moDebounce);
      moDebounce = setTimeout(() => {
        if (!isOnFrontPage()) return;
        if (!document.getElementById(WIDGET_ID)) {
          waitForNav(injectWidget);
        }
      }, 1000);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Safety-net interval ───────────────────────────────────────────────────────
  // Last resort: if both the nav listener and mutation fallback miss, this will
  // catch the gap within a few seconds.
  function setupSafetyNet() {
    setInterval(() => {
      if (!isOnFrontPage()) return;
      if (!isOnConfiguredInstance()) return;
      if (document.getElementById(WIDGET_ID)) return;
      if (!findNavTarget()) return;
      injectWidget();
    }, 5000);
  }

  // ── Menu commands ────────────────────────────────────────────────────────────
  function registerMenuCommands() {
    GM_registerMenuCommand('Configure subreddits', () => {
      const current = getSubreddits().join(', ');
      const input = prompt(
        `Enter subreddits as a comma-separated list. r/ prefix optional.\n\nExample: linux, selfhosted, homelab`,
        current
      );
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
        `Enter your Lemmy instance hostname (no https://).\n\nExample: lemmy.world`,
        current
      );
      if (input === null) return;
      const hostname = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!hostname) { alert('No hostname entered — keeping existing.'); return; }
      saveLemmyInstance(hostname);
      alert(`Lemmy instance set to: ${hostname}\nReload the page after navigating there.`);
    });

    GM_registerMenuCommand('Configure Redlib instance', () => {
      const current = getRedlibInstance();
      const input = prompt(
        `Enter your Redlib instance URL (with https://).\n\nExample: https://redlib.example.com`,
        current
      );
      if (input === null) return;
      const url = input.trim().replace(/\/$/, '');
      if (!url) { alert('No URL entered — keeping existing.'); return; }
      saveRedlibInstance(url);
      GM_deleteValue(CACHE_KEY_DATA);
      GM_deleteValue(CACHE_KEY_TIME);
      const existing = document.getElementById(WIDGET_ID);
      if (existing) existing.replaceWith(buildWidget('loading'));
      fetchAndRender();
      alert(`Redlib instance set to: ${url}`);
    });

    GM_registerMenuCommand('Toggle Reddit → Redlib redirect', () => {
      const current = getRedditRedirectEnabled();
      GM_setValue(STORAGE_KEY_REDIRECT, !current);
      alert(`Reddit → Redlib redirect is now ${!current ? 'enabled' : 'disabled'}.`);
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    registerMenuCommands();

    if (isRedditDomain()) {
      redirectToRedlib();
      return;
    }

    if (!isOnConfiguredInstance()) return;

    injectStyles();
    setupNavListener();
    setupMutationFallback();
    setupSafetyNet();
    waitForNav(injectWidget);
  }

  init();
})();