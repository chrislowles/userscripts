// ==UserScript==
// @name         Skipper
// @description  Marks various sections on YouTube's progress bar using the SponsorBlock API. Press a configurable key to skip the current segment manually.
// @version      2026.5.20
// @author       Chris Lowles, Claude
// @license      AGPL-3.0-or-later
// @namespace    https://greasyfork.org/
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @match        *://youtu.be/*
// @match        *://www.youtube-nocookie.com/embed/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @connect      sponsor.ajay.app
// @connect      *
// @run-at       document-start
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
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
 * CONFIGURE: Open your userscript manager's menu while on YouTube and choose "Manual Sponsor Skipper — Settings" to change the skip key, active categories, minimum vote threshold, and SponsorBlock instance.
 */

(async function () {
  "use strict";

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
    // Remove any you don't want from this list.
    categories: ["sponsor", "selfpromo", "intro", "outro", "music_offtopic"],

    // Keyboard key that triggers a skip while inside a segment.
    // Must be a single character (case-insensitive).
    skipKey: "s",

    // Minimum SponsorBlock vote count to show a segment.
    // -2 is the SponsorBlock default (very permissive).
    upvotes: -2,

    // SponsorBlock API instance hostname.
    instance: "sponsor.ajay.app",

    // Set true only if crypto.subtle.digest is unavailable in your browser
    // (e.g. old Pale Moon). Disables privacy-preserving hashed lookups.
    disable_hashing: false,
  };

  const SCRIPT_KEY = "skipper_cfg";
  const PLR_SELECTOR = "#movie_player video, video#player_html5_api, video#player";

  // ── Load & merge settings ───────────────────────────────────────────────────

  let cfg = await GM.getValue(SCRIPT_KEY);
  if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.categories)) {
    cfg = { ...DEFAULTS };
    await GM.setValue(SCRIPT_KEY, cfg);
    console.log("[SKIPPER] Default settings saved.");
  } else {
    // Merge saved settings with defaults so new keys are always present
    cfg = { ...DEFAULTS, ...cfg };
  }

  async function saveCfg() {
    await GM.setValue(SCRIPT_KEY, cfg);
  }

  // ── Runtime state ───────────────────────────────────────────────────────────

  let segments      = [];   // Sorted array of segment objects from the API
  let currentSegIdx = -1;   // Index of segment player is currently inside (-1 = none)
  let player        = null; // The <video> element
  let markerContainer = null;
  let bannerEl      = null;
  let activeVideoId = "";

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

  // ── SponsorBlock API ────────────────────────────────────────────────────────

  async function fetchSegments(videoId) {
    const inst = cfg.instance || "sponsor.ajay.app";
    const cat  = encodeURIComponent(JSON.stringify(cfg.categories));
    let url;

    if (cfg.disable_hashing) {
      url = `https://${inst}/api/skipSegments?videoID=${videoId}&categories=${cat}`;
    } else {
      const hash = await sha256(videoId);
      url = `https://${inst}/api/skipSegments/${hash.slice(0, 4)}?categories=${cat}`;
      console.log(`[SKIPPER] Hash prefix: ${hash.slice(0, 4)}`);
    }

    console.log("[SKIPPER] API >", url);

    return new Promise(resolve => {
      GM.xmlHttpRequest({
        method: "GET",
        url,
        headers: {
          Accept: "application/json"
        },
        onload(resp) {
          try {
            const data = cfg.disable_hashing
              ? [{ videoID: videoId, segments: JSON.parse(resp.responseText) }]
              : JSON.parse(resp.responseText);

            for (const entry of data) {
              if (entry.videoID === videoId) {
                const segs = entry.segments
                  .filter(s => s.category !== "poi_highlight" && s.votes >= cfg.upvotes)
                  .sort((a, b) => a.segment[0] - b.segment[0]);
                resolve(segs);
                return;
              }
            }
          } catch (_) {}
          resolve([]);
        },
        onerror: () => resolve([]),
      });
    });
  }

  // ── Progress bar markers ────────────────────────────────────────────────────

  function clearMarkers() {
    if (markerContainer) {
      markerContainer.remove();
      markerContainer = null;
    }
  }

  function injectMarkers() {
    clearMarkers();
    if (!player || !segments.length) return;

    const duration = player.duration;
    if (!duration || isNaN(duration) || duration <= 0) return;

    // YouTube's progress bar container; this element spans the full width of
    // the bar and already has a positioning context we can attach to.
    const progressBarContainer = document.querySelector(
      "#movie_player .ytp-progress-bar-container, .html5-video-player .ytp-progress-bar-container"
    );
    if (!progressBarContainer) {
      console.warn("[SKIPPER] Progress bar container not found; markers not injected.");
      return;
    }

    // Ensure the container is positioned so absolute children work
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

      const pct = (v) => `${(v / duration) * 100}%`;

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
    console.log(`[SKIPPER] Injected ${segments.length} marker(s).`);
  }

  // ── Skip banner ─────────────────────────────────────────────────────────────

  function getOrCreateBanner() {
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
    const b = getOrCreateBanner();
    if (!b) return;
    const meta = CATEGORY_META[seg.category] || { color: "#AAA", label: seg.category };
    b.style.borderLeftColor = meta.color;
    b.textContent = `${meta.label}: press ${cfg.skipKey.toUpperCase()} to skip`;
    b.style.display = "block";
    // Trigger transition after paint
    requestAnimationFrame(() => { b.style.opacity = "1"; });
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.style.opacity = "0";
    setTimeout(() => { if (bannerEl) bannerEl.style.display = "none"; }, 160);
  }

  // ── Playback tracking ───────────────────────────────────────────────────────

  function onTimeUpdate() {
    if (!segments.length) return;

    const t = player.currentTime;
    let found = -1;

    for (let i = 0; i < segments.length; i++) {
      if (t >= segments[i].segment[0] && t < segments[i].segment[1]) {
        found = i;
        break;
      }
    }

    if (found !== currentSegIdx) {
      currentSegIdx = found;
      if (found >= 0) showBanner(segments[found]);
      else hideBanner();
    }
  }

  // ── Keyboard handler ────────────────────────────────────────────────────────

  function onKeyDown(e) {
    // Don't fire while typing in an input field
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) return;

    if (e.key.toLowerCase() === cfg.skipKey.toLowerCase()) {
      if (currentSegIdx >= 0 && player) {
        const seg = segments[currentSegIdx];
        console.log(
          `[SKIPPER] Skip: ${seg.category} ` +
          `(${fmtTime(seg.segment[0])} > ${fmtTime(seg.segment[1])})`
        );
        player.currentTime = seg.segment[1];
        currentSegIdx = -1;
        hideBanner();
      }
    }
  }

  // ── Per-video setup ─────────────────────────────────────────────────────────

  function cleanup() {
    clearMarkers();
    if (bannerEl)  { bannerEl.remove();  bannerEl  = null; }
    if (player)    { player.removeEventListener("timeupdate", onTimeUpdate); }
    segments      = [];
    currentSegIdx = -1;
  }

  async function go(videoId) {
    if (videoId === activeVideoId) return;
    activeVideoId = videoId;

    console.log(`[SKIPPER] Video changed: ${videoId}`);
    cleanup();

    // Wait for the <video> element to be present and have readyState >= 1
    // (HAVE_METADATA — duration is known)
    player = await new Promise(resolve => {
      const t = setInterval(() => {
        const el = document.querySelector(PLR_SELECTOR);
        if (el && el.readyState >= 1) { clearInterval(t); resolve(el); }
      }, 100);
    });

    player.addEventListener("timeupdate", onTimeUpdate);

    segments = await fetchSegments(videoId);
    console.log(`[SKIPPER] ${segments.length} segment(s) loaded for ${videoId}.`);
    if (!segments.length) return;

    // Inject markers; if duration isn't known yet wait for loadedmetadata
    if (player.duration && !isNaN(player.duration) && player.duration > 0) {
      injectMarkers();
    } else {
      player.addEventListener("loadedmetadata", injectMarkers, { once: true });
    }

    // Also re-inject if YouTube re-renders the progress bar (e.g. chapter update)
    // by watching for the progress bar container being replaced.
    const progressBarArea = document.querySelector(
      "#movie_player .ytp-chrome-bottom, .html5-video-player .ytp-chrome-bottom"
    );
    if (progressBarArea) {
      new MutationObserver(() => {
        if (!document.getElementById("skipper-markers")) {
          injectMarkers();
        }
      }).observe(progressBarArea, { childList: true, subtree: true });
    }
  }

  // ── YouTube SPA navigation detection ────────────────────────────────────────

  function checkForVideo() {
    const params = new URLSearchParams(location.search);
    if (params.has("v")) {
      go(params.get("v"));
    } else if (/^\/(embed|v)\//.test(location.pathname)) {
      const parts = location.pathname.split("/").filter(Boolean);
      if (parts[1]) go(parts[1]);
    }
  }

  // ── Initialise ──────────────────────────────────────────────────────────────

  document.addEventListener("keydown", onKeyDown, true);
  checkForVideo();

  window.addEventListener("load", () => {
    // Observe DOM mutations to catch YouTube SPA page transitions
    new MutationObserver(checkForVideo)
      .observe(document.body, { childList: true, subtree: true });
  });

  // ── Userscript manager menu ─────────────────────────────────────────────────

  if (typeof GM.registerMenuCommand !== "undefined") {
    GM.registerMenuCommand("Settings", () => {
      // Skip key
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

      // Minimum upvotes
      const newUpvotes = window.prompt(
        "Minimum SponsorBlock vote threshold (default -2):\nCurrent: " + cfg.upvotes,
        String(cfg.upvotes)
      );
      if (newUpvotes !== null) {
        const parsed = parseInt(newUpvotes, 10);
        if (!isNaN(parsed)) cfg.upvotes = parsed;
      }

      // Instance
      const newInst = window.prompt(
        "SponsorBlock API instance hostname:\nCurrent: " + cfg.instance,
        cfg.instance
      );
      if (newInst !== null && newInst.trim() !== "") {
        cfg.instance = newInst.trim().replace(/^https?:\/\//, "");
      }

      // Categories (comma-separated)
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