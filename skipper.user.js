// ==UserScript==
// @name         Skipper
// @description  (WARNING: VIBE CODED, MAY SUCK BAWLS) Marks various sections on YouTube's progress bar using the SponsorBlock API. Press a configurable key to skip the current segment manually.
// @version      2026.10.5
// @author       Chris Lowles, Claude
// @license      AGPL-3.0-or-later
// @namespace    https://greasyfork.org/
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @match        *://www.youtube-nocookie.com/embed/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @connect      sponsor.ajay.app
// @connect      *
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/skipper.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/skipper.user.js
// ==/UserScript==

/**
 * Skipper: Using the SponsorBlock API, this script marks segments on the YouTube progress bar and waits for you to decide when to skip.
 *
 * HOW IT WORKS:
 * - Coloured markers appear on the progress bar for each detected segment.
 * - When playback enters a marked segment, a banner appears at the bottom-left of the player showing the segment type and your configured skip key.
 * - Press that key to instantly jump to the end of the segment.
 * DEFAULT KEY: s
 * CONFIGURE: Open your userscript manager's menu while on YouTube and choose "Settings" to change the skip key, active categories, minimum vote threshold, and SponsorBlock instance.
 */

(async function () {
  "use strict";

  // Flip to true for console diagnostics.
  const DEBUG = false;
  const log = (...args) => { if (DEBUG) console.log("[SKIPPER]", ...args); };

  // ── Category metadata (labels + SponsorBlock standard colours) ─────────────

  const CATEGORY_META = {
    sponsor:        { label: "Sponsor",               color: "#00D400" },
    intro:          { label: "Intro",                 color: "#00FFFF" },
    outro:          { label: "Outro / Endcard",       color: "#0202ED" },
    selfpromo:      { label: "Self-promotion",        color: "#FFFF00" },
    interaction:    { label: "Interaction reminder",  color: "#CC00FF" },
    music_offtopic: { label: "Non-music section",     color: "#FF9900" },
    preview:        { label: "Preview",               color: "#008FD6" },
    filler:         { label: "Filler",                color: "#7300FF" },
  };

  // ── Default settings ────────────────────────────────────────────────────────

  const DEFAULTS = {
    // Which segment types to fetch and mark.
    categories: [
      "sponsor",
      "intro",
      "outro",
      "selfpromo",
      "interaction",
      "music_offtopic",
      "preview",
      "filler"
    ],

    // Keyboard key that triggers a skip while inside a segment.
    skipKey: "s",

    // Minimum SponsorBlock vote count to show a segment.
    upvotes: -2,

    // SponsorBlock API instance hostname.
    instance: "sponsor.ajay.app",

    // Set true only if crypto.subtle.digest is unavailable in your browser.
    disable_hashing: false,
  };

  const SCRIPT_KEY        = "skipper_cfg";
  const PLR_SELECTOR      = "#movie_player video, video#player_html5_api, video#player";
  const PROGRESS_SELECTOR = "#movie_player .ytp-progress-bar-container, .html5-video-player .ytp-progress-bar-container";
  const WAIT_INTERVAL_MS  = 200;
  const WAIT_MAX_TRIES    = 50;   // ~10s before giving up on finding a ready <video>
  const CACHE_MAX         = 50;

  // ── Load & merge settings ───────────────────────────────────────────────────

  let cfg = await GM.getValue(SCRIPT_KEY);
  if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.categories)) {
    cfg = { ...DEFAULTS };
    await GM.setValue(SCRIPT_KEY, cfg);
    log("Default settings saved.");
  } else {
    cfg = { ...DEFAULTS, ...cfg };
  }

  async function saveCfg() {
    await GM.setValue(SCRIPT_KEY, cfg);
  }

  // ── Runtime state ───────────────────────────────────────────────────────────

  let segments         = [];
  let currentSegIdx    = -1;
  let segStart         = -1;   // cached start of currentSegIdx — fast-path for onTimeUpdate
  let segEnd           = -1;   // cached end of currentSegIdx
  let player           = null;
  let markerContainer  = null;
  let bannerEl         = null;
  let hideTimer        = null; // pending banner hide, cleared when a banner is shown again
  let activeVideoId    = "";
  let goGeneration     = 0;    // incremented on each navigation; lets stale async work detect and bail
  let progressObserver = null; // stored so cleanup() can disconnect it and prevent leaks
  let markerDebounce   = null; // debounce handle for re-injection triggered by progressObserver

  // Per-video segment cache (insertion-ordered; oldest entry evicted first).
  // Only successful results are stored, so a failed request is retried next visit.
  const segCache = new Map();
  function cacheSet(id, segs) {
    segCache.delete(id);
    segCache.set(id, segs);
    if (segCache.size > CACHE_MAX) segCache.delete(segCache.keys().next().value);
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function fmtTime(s) {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return (h > 0 ? h + ":" : "")
      + (h > 0 && m < 10 ? "0" : "") + m
      + ":" + (sec < 10 ? "0" : "") + sec;
  }

  // Ads play in the same <video> element, so their currentTime/duration must not
  // be compared against the real video's segments.
  function isAd() {
    return !!document.getElementById("movie_player")?.classList.contains("ad-showing");
  }

  // ── SponsorBlock API ────────────────────────────────────────────────────────

  function gmGet(url, timeout = 8000) {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: "GET",
        url,
        timeout,
        headers: { Accept: "application/json" },
        onload: resolve,
        onerror: reject,
        ontimeout: reject,
      });
    });
  }

  // Returns parsed JSON, [] for "no data" responses (404 / non-retryable 4xx),
  // or null if every attempt failed (network error, timeout, 429, 5xx).
  async function getJSON(url) {
    for (let i = 0; i < 3; i++) {
      try {
        const r = await gmGet(url);
        if (r.status === 200) return JSON.parse(r.responseText);
        if (r.status === 404) return [];
        if (r.status < 500 && r.status !== 429) return [];
      } catch (_) {}
      if (i < 2) await new Promise(res => setTimeout(res, 500 * 2 ** i));
    }
    return null;
  }

  // Resolves to an array of segments (possibly empty), or null if the lookup failed.
  async function fetchSegments(videoId) {
    if (segCache.has(videoId)) return segCache.get(videoId);

    const inst    = cfg.instance || "sponsor.ajay.app";
    const cat     = encodeURIComponent(JSON.stringify(cfg.categories));
    const actions = encodeURIComponent(JSON.stringify(["skip"]));
    let url;

    try {
      if (cfg.disable_hashing) {
        url = `https://${inst}/api/skipSegments?videoID=${videoId}&categories=${cat}&actionTypes=${actions}`;
      } else {
        const hash = await sha256(videoId);
        url = `https://${inst}/api/skipSegments/${hash.slice(0, 4)}?categories=${cat}&actionTypes=${actions}`;
      }
    } catch (e) {
      console.warn("[SKIPPER] Hashing failed (try enabling disable_hashing):", e);
      return null;
    }

    log("API >", url);

    const data = await getJSON(url);
    if (data === null) {
      console.warn("[SKIPPER] SponsorBlock request failed for", videoId);
      return null;
    }

    const entries = cfg.disable_hashing
      ? [{ videoID: videoId, segments: Array.isArray(data) ? data : [] }]
      : (Array.isArray(data) ? data : []);

    const entry = entries.find(e => e.videoID === videoId);
    const segs = (entry?.segments || [])
      .filter(s =>
        s.category !== "poi_highlight" &&
        (s.actionType || "skip") === "skip" &&
        s.votes >= cfg.upvotes &&
        s.segment[1] > s.segment[0]
      )
      .sort((a, b) => a.segment[0] - b.segment[0]);

    cacheSet(videoId, segs);
    return segs;
  }

  // ── Progress bar markers ────────────────────────────────────────────────────

  function clearMarkers() {
    if (markerContainer) {
      markerContainer.remove();
      markerContainer = null;
    }
  }

  // Returns true if markers were injected.
  function injectMarkers() {
    clearMarkers();
    if (!player || !segments.length || isAd()) return false;

    const duration = player.duration;
    if (!duration || isNaN(duration) || duration <= 0) return false;

    const progressBarContainer = document.querySelector(PROGRESS_SELECTOR);
    if (!progressBarContainer) return false;

    if (getComputedStyle(progressBarContainer).position === "static") {
      progressBarContainer.style.position = "relative";
    }

    markerContainer = document.createElement("div");
    markerContainer.id = "skipper-markers";
    Object.assign(markerContainer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "40",
    });

    for (const seg of segments) {
      const [start, end] = seg.segment;
      const meta = CATEGORY_META[seg.category] || { color: "#FF0000", label: seg.category };
      const pct  = (v) => `${(v / duration) * 100}%`;

      const marker = document.createElement("div");
      marker.title = `${meta.label}\n${fmtTime(start)} > ${fmtTime(end)}\nPress ${cfg.skipKey.toUpperCase()} to skip`;
      Object.assign(marker.style, {
        position: "absolute",
        left: pct(start),
        width: pct(end - start),
        top: "0",
        height: "100%",
        background: meta.color,
        opacity: "0.75",
        borderRadius: "2px",
      });
      markerContainer.appendChild(marker);
    }

    progressBarContainer.appendChild(markerContainer);
    log(`Injected ${segments.length} marker(s).`);
    return true;
  }

  // Watches only direct children of the progress bar (to notice our markers being
  // wiped) and of its parent (to notice the bar itself being replaced). No subtree,
  // so hover previews / buffering / chapter-title churn doesn't wake it up.
  function watchMarkers() {
    if (progressObserver) { progressObserver.disconnect(); progressObserver = null; }

    const bar = document.querySelector(PROGRESS_SELECTOR);
    if (!bar) return false;

    progressObserver = new MutationObserver(() => {
      if (isAd() || (markerContainer && markerContainer.isConnected)) return;
      clearTimeout(markerDebounce);
      markerDebounce = setTimeout(() => {
        if (injectMarkers()) watchMarkers(); // re-attach in case the bar element changed
      }, 150);
    });

    progressObserver.observe(bar, { childList: true });
    if (bar.parentElement) progressObserver.observe(bar.parentElement, { childList: true });
    return true;
  }

  // Inject + watch, retrying briefly if the player UI isn't in the DOM yet.
  function setupMarkers(myGen, attempt = 0) {
    if (myGen !== goGeneration || !player || !segments.length || isAd()) return;
    if (injectMarkers()) {
      watchMarkers();
      return;
    }
    if (attempt < 5) setTimeout(() => setupMarkers(myGen, attempt + 1), 1000);
  }

  // ── Skip banner ─────────────────────────────────────────────────────────────

  function getOrCreateBanner() {
    // YouTube can re-parent the player; drop a banner that's no longer in the DOM.
    if (bannerEl && !bannerEl.isConnected) bannerEl = null;
    if (bannerEl) return bannerEl;

    const playerEl = document.querySelector("#movie_player, .html5-video-player");
    if (!playerEl) return null;

    bannerEl = document.createElement("div");
    bannerEl.id = "skipper-banner";
    Object.assign(bannerEl.style, {
      position: "absolute",
      bottom: "72px",
      left: "12px",
      padding: "7px 14px 7px 10px",
      borderLeft: "4px solid transparent",
      borderRadius: "5px",
      fontFamily: "'YouTube Sans', 'Roboto', Arial, sans-serif",
      fontSize: "13px",
      fontWeight: "600",
      color: "#FFF",
      background: "rgba(18, 18, 18, 0.92)",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.55)",
      zIndex: "9999",
      display: "none",
      opacity: "0",
      pointerEvents: "none",
      transition: "opacity 0.15s ease",
      whiteSpace: "nowrap",
    });

    playerEl.appendChild(bannerEl);
    return bannerEl;
  }

  function showBanner(seg) {
    clearTimeout(hideTimer); // cancel a pending hide from a segment we just left
    const b = getOrCreateBanner();
    if (!b) return;
    const meta = CATEGORY_META[seg.category] || { color: "#AAA", label: seg.category };
    b.style.borderLeftColor = meta.color;
    b.textContent = `${meta.label}: press ${cfg.skipKey.toUpperCase()} to skip`;
    b.style.display = "block";
    requestAnimationFrame(() => { b.style.opacity = "1"; });
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.style.opacity = "0";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (bannerEl) bannerEl.style.display = "none"; }, 160);
  }

  // ── Playback tracking ───────────────────────────────────────────────────────

  function resetSegmentState() {
    currentSegIdx = -1;
    segStart = segEnd = -1;
  }

  function onTimeUpdate() {
    if (!segments.length) return;

    if (isAd()) {
      if (currentSegIdx !== -1) { resetSegmentState(); hideBanner(); }
      return;
    }

    const t = player.currentTime;

    // Fast path: still within the cached bounds of the current segment — skip the scan.
    // timeupdate fires ~4× per second so this saves a full array scan the vast majority of the time.
    if (currentSegIdx >= 0 && t >= segStart && t < segEnd) return;

    let found = -1;
    for (let i = 0; i < segments.length; i++) {
      if (t >= segments[i].segment[0] && t < segments[i].segment[1]) {
        found = i;
        break;
      }
    }

    if (found !== currentSegIdx) {
      currentSegIdx = found;
      if (found >= 0) {
        segStart = segments[found].segment[0];
        segEnd   = segments[found].segment[1];
        showBanner(segments[found]);
      } else {
        segStart = segEnd = -1;
        hideBanner();
      }
    }
  }

  // Fires when the real duration arrives, and when an ad starts/ends (ads swap the
  // <video> duration). Drop markers while an ad is showing, rebuild them afterwards.
  function onDurationChange() {
    if (!segments.length) return;
    if (isAd()) {
      clearMarkers();
      return;
    }
    setupMarkers(goGeneration);
  }

  // ── Keyboard handler ────────────────────────────────────────────────────────

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

    // composedPath()[0] sees through shadow DOM, where e.target is retargeted to the host.
    const t = e.composedPath ? e.composedPath()[0] : e.target;
    if (
      t &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
    ) return;

    if (e.key.toLowerCase() === cfg.skipKey.toLowerCase()) {
      if (currentSegIdx >= 0 && player && !isAd()) {
        const seg = segments[currentSegIdx];
        log(`Skip: ${seg.category} (${fmtTime(seg.segment[0])} > ${fmtTime(seg.segment[1])})`);
        player.currentTime = seg.segment[1];
        resetSegmentState(); // invalidate fast-path cache after a manual skip
        hideBanner();
      }
    }
  }

  // ── Per-video setup ─────────────────────────────────────────────────────────

  function cleanup() {
    clearMarkers();
    clearTimeout(markerDebounce);
    markerDebounce = null;
    clearTimeout(hideTimer);
    hideTimer = null;
    if (progressObserver) { progressObserver.disconnect(); progressObserver = null; }
    if (bannerEl) { bannerEl.remove(); bannerEl = null; }
    if (player) {
      player.removeEventListener("timeupdate", onTimeUpdate);
      player.removeEventListener("durationchange", onDurationChange);
    }
    player   = null;
    segments = [];
    resetSegmentState();
  }

  // Polls (bounded) for a <video> that is ready AND actually belongs to videoId.
  // YouTube reuses the same element across SPA navigations, so readyState alone can
  // describe the previous video. Resolves null on timeout or if superseded.
  function waitForPlayer(videoId, myGen) {
    return new Promise(resolve => {
      const tryFind = () => {
        const el = document.querySelector(PLR_SELECTOR);
        if (!el || el.readyState < 1) return null;
        const id = document.getElementById("movie_player")?.getVideoData?.().video_id;
        return (!id || id === videoId) ? el : null;
      };

      const immediate = tryFind();
      if (immediate) { resolve(immediate); return; }

      let tries = 0;
      const t = setInterval(() => {
        if (myGen !== goGeneration || ++tries > WAIT_MAX_TRIES) {
          clearInterval(t);
          resolve(null);
          return;
        }
        const el = tryFind();
        if (el) { clearInterval(t); resolve(el); }
      }, WAIT_INTERVAL_MS);
    });
  }

  async function go(videoId) {
    if (videoId === activeVideoId) return;
    activeVideoId = videoId;

    // Capture generation before any await so stale calls can detect they've been superseded.
    const myGen = ++goGeneration;
    cleanup();

    log(`Video changed: ${videoId}`);

    // Start the API lookup right away so it overlaps with waiting for the player.
    // fetchSegments never rejects: it resolves to an array, or null on failure.
    const segPromise = fetchSegments(videoId);

    const el = await waitForPlayer(videoId, myGen);
    if (!el || myGen !== goGeneration) return;
    player = el;

    player.addEventListener("timeupdate", onTimeUpdate);
    player.addEventListener("durationchange", onDurationChange);

    // Assign only after confirming this call is still current, so a slow response
    // for an old video can't overwrite the new video's state.
    const segs = await segPromise;
    if (myGen !== goGeneration) return;
    if (!segs) return; // lookup failed; nothing cached, so the next visit retries

    segments = segs;
    log(`${segments.length} segment(s) loaded for ${videoId}.`);
    if (!segments.length) return;

    setupMarkers(myGen);
  }

  // ── YouTube SPA navigation detection ────────────────────────────────────────

  function checkForVideo() {
    const params = new URLSearchParams(location.search);
    if (params.has("v")) {
      go(params.get("v"));
      return;
    }
    if (/^\/(embed|v)\//.test(location.pathname)) {
      const parts = location.pathname.split("/").filter(Boolean);
      if (parts[1]) { go(parts[1]); return; }
    }
    // Not a video page — remove any residual markers/banner left from the previous video.
    if (activeVideoId) {
      activeVideoId = "";
      ++goGeneration; // also cancels any in-flight go()
      cleanup();
    }
  }

  // ── Initialise ──────────────────────────────────────────────────────────────

  document.addEventListener("keydown", onKeyDown, true);

  // YouTube's own SPA events replace a broad MutationObserver on document.body,
  // which would have fired on every DOM mutation across the entire page.
  document.addEventListener("yt-navigate-start", () => {
    ++goGeneration;   // invalidate any in-flight go() calls
    activeVideoId = "";
    cleanup();        // remove stale markers/banner before the new page renders
  });
  document.addEventListener("yt-navigate-finish", checkForVideo);

  // Initial check: handles the very first page load and non-SPA embed/v/ paths
  // where yt-navigate-finish may have fired before our listener was registered.
  checkForVideo();

  // ── Userscript manager menu ─────────────────────────────────────────────────

  if (typeof GM.registerMenuCommand !== "undefined") {
    GM.registerMenuCommand("Settings", () => {
      const newKey = window.prompt(
        "Skip key (single character):\nCurrent: " + cfg.skipKey.toUpperCase(),
        cfg.skipKey
      );
      if (newKey !== null) {
        if (newKey.length === 1) {
          cfg.skipKey = newKey.toLowerCase();
        } else {
          alert("Skip key must be a single character. Not saved.");
        }
      }

      const newUpvotes = window.prompt(
        "Minimum SponsorBlock vote threshold (default -2):\nCurrent: " + cfg.upvotes,
        String(cfg.upvotes)
      );
      if (newUpvotes !== null) {
        const parsed = parseInt(newUpvotes, 10);
        if (!isNaN(parsed)) cfg.upvotes = parsed;
      }

      const newInst = window.prompt(
        "SponsorBlock API instance hostname:\nCurrent: " + cfg.instance,
        cfg.instance
      );
      if (newInst !== null && newInst.trim() !== "") {
        cfg.instance = newInst.trim().replace(/^https?:\/\//, "");
      }

      const catList = Object.keys(CATEGORY_META).join(", ");
      const newCats = window.prompt(
        `Active categories (comma-separated).\nAvailable: ${catList}\nCurrent: ${cfg.categories.join(", ")}`,
        cfg.categories.join(", ")
      );
      if (newCats !== null) {
        const parsed = newCats
          .split(",")
          .map(s => s.trim().toLowerCase())
          .filter(s => CATEGORY_META[s]);
        if (parsed.length > 0) {
          cfg.categories = parsed;
        } else {
          alert("No valid categories entered. Keeping existing list.");
        }
      }

      saveCfg();
      alert(
        "Settings saved!\n\n" +
        `Skip key:    ${cfg.skipKey.toUpperCase()}\n` +
        `Min votes:   ${cfg.upvotes}\n` +
        `Instance:    ${cfg.instance}\n` +
        `Categories:  ${cfg.categories.join(", ")}\n\n` +
        "Reload the page for changes to take effect."
      );
    });
  }

})();