// ==UserScript==
// @name         Git Repo to Prompt
// @namespace    https://chrislowles.com/
// @version      2026.5.26
// @description  Fetches a public GitHub repo's file tree and contents, formats them as context, and inserts them alongside a custom request into supported AI chat inputs.
// @author       Chris Lowles, Claude
// @license      GPL-2.0-or-later
// @match        https://claude.ai/*
// @match        https://chatgpt.com/*
// @match        https://gemini.google.com/*
// @match        https://grok.com/*
// @match        https://chat.deepseek.com/*
// @match        https://www.perplexity.ai/*
// @match        https://chat.mistral.ai/*
// @match        https://poe.com/*
// @match        https://copilot.microsoft.com/*
// @match        https://aistudio.google.com/*
// @match        https://kimi.ai/*
// @match        https://www.doubao.com/*
// @match        https://arena.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/chrislowles/userscripts/main/git-repo-to-prompt.user.js
// @downloadURL  https://raw.githubusercontent.com/chrislowles/userscripts/main/git-repo-to-prompt.user.js
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ── Storage keys ──────────────────────────────────────────────────────────

    const KEY_TOKEN        = 'grtp_token';
    const KEY_MAX_SIZE_KB  = 'grtp_max_size_kb';
    const KEY_MAX_FILES    = 'grtp_max_files';
    const KEY_EXCL_EXTS    = 'grtp_excl_exts';
    const KEY_FORMAT       = 'grtp_format';
    const KEY_REQ_POSITION = 'grtp_req_position';

    const DEFAULT_MAX_SIZE_KB = 100;
    const DEFAULT_MAX_FILES   = 60;
    const DEFAULT_FORMAT      = 'xml';
    const DEFAULT_REQ_POS     = 'before'; // 'before' | 'after'

    // Extensions treated as binary/noise — skipped by default.
    // User can override in Settings.
    const DEFAULT_EXCL_EXTS = [
        'png','jpg','jpeg','gif','webp','ico','bmp','tiff','avif',
        'svg','pdf','eps','ai',
        'mp4','mp3','wav','ogg','flac','aac','mov','avi','mkv',
        'zip','tar','gz','bz2','xz','7z','rar','zst',
        'exe','dll','so','dylib','bin','obj','o','a',
        'woff','woff2','ttf','otf','eot',
        'pyc','pyo','pyd','class','jar',
        'db','sqlite','sqlite3',
        'lock',
    ].join(', ');

    // ── Platform input detection ──────────────────────────────────────────────
    // Each entry is tried in order; the first visible match wins.
    // 'type' drives injection strategy: 'ce' = contenteditable, 'ta' = textarea.

    const PLATFORMS = {
        'claude.ai': {
            name: 'Claude',
            selectors: [
                'div.ProseMirror[contenteditable="true"]',
                'div[contenteditable="true"][data-placeholder]',
                'div[contenteditable="true"]',
            ],
            type: 'ce',
        },
        'chatgpt.com': {
            name: 'ChatGPT',
            selectors: [
                'div#prompt-textarea[contenteditable="true"]',
                '#prompt-textarea',
                'div[contenteditable="true"]',
            ],
            type: 'ce',
        },
        'gemini.google.com': {
            name: 'Gemini',
            selectors: [
                'div.ql-editor[contenteditable="true"]',
                'rich-textarea div[contenteditable="true"]',
                'div[contenteditable="true"]',
            ],
            type: 'ce',
        },
        'grok.com': {
            name: 'Grok',
            selectors: [
                'div[contenteditable="true"]',
                'textarea',
            ],
            type: 'auto',
        },
        'chat.deepseek.com': {
            name: 'DeepSeek',
            selectors: [
                'textarea#chat-input',
                'textarea',
                'div[contenteditable="true"]',
            ],
            type: 'auto',
        },
        'www.perplexity.ai': {
            name: 'Perplexity',
            selectors: [
                'textarea[placeholder]',
                'textarea',
                'div[contenteditable="true"]',
            ],
            type: 'auto',
        },
        'chat.mistral.ai': {
            name: 'Mistral',
            selectors: [
                'textarea',
                'div[contenteditable="true"]',
            ],
            type: 'auto',
        },
        'poe.com': {
            name: 'Poe',
            selectors: [
                'textarea[class*="GrowingTextArea"]',
                'textarea',
            ],
            type: 'ta',
        },
        'copilot.microsoft.com': {
            name: 'Copilot',
            selectors: [
                'textarea',
                'div[contenteditable="true"]',
            ],
            type: 'auto',
        },
        'aistudio.google.com': {
            name: 'AI Studio',
            selectors: [
                'div[contenteditable="true"]',
                'textarea',
            ],
            type: 'auto',
        },
        'kimi.ai': {
            name: 'Kimi',
            selectors: [
                'div[contenteditable="true"]',
                'textarea',
            ],
            type: 'auto',
        },
        'www.doubao.com': {
            name: 'Doubao',
            selectors: [
                'div[contenteditable="true"]',
                'textarea',
            ],
            type: 'auto',
        },
        'arena.ai': {
            name: 'Arena',
            selectors: [
                'div[contenteditable="true"]',
                'textarea',
            ],
            type: 'auto',
        },
    };

    function getPlatformConfig() {
        return PLATFORMS[window.location.hostname] ?? null;
    }

    function findInputElement() {
        const cfg = getPlatformConfig();
        const selectors = cfg?.selectors ?? [
            'div[contenteditable="true"]',
            'textarea',
        ];

        for (const sel of selectors) {
            try {
                const el = document.querySelector(sel);
                // Must be in the DOM and visible
                if (el && el.offsetParent !== null) return el;
            } catch { /* invalid selector */ }
        }
        return null;
    }

    // ── Text injection ────────────────────────────────────────────────────────

    function resolveType(el) {
        const cfg = getPlatformConfig();
        if (cfg?.type === 'ce') return 'ce';
        if (cfg?.type === 'ta') return 'ta';
        // 'auto': inspect element
        if (el.tagName === 'TEXTAREA') return 'ta';
        if (el.contentEditable === 'true') return 'ce';
        return 'ta';
    }

    function injectIntoTextarea(el, text) {
        // Native setter trick to bypass React / Vue synthetic event wrappers
        const proto   = window.HTMLTextAreaElement.prototype;
        const setter  = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        const current = el.value;

        if (setter) {
            setter.call(el, current ? current + '\n\n' + text : text);
        } else {
            el.value = current ? current + '\n\n' + text : text;
        }

        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function injectIntoContentEditable(el, text) {
        el.focus();

        // Move cursor to end
        const sel   = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        // Prefix with separator if the editor already has content
        const hasContent = el.textContent.trim().length > 0;
        const payload    = hasContent ? '\n\n' + text : text;

        // execCommand still functions for insertText in all relevant browsers
        const ok = document.execCommand('insertText', false, payload);

        if (!ok) {
            // Hard fallback: overwrite (loses existing content but at least inserts)
            el.textContent = (hasContent ? el.textContent + '\n\n' : '') + text;
            el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: payload }));
        }
    }

    function injectText(text) {
        const el = findInputElement();
        if (!el) {
            alert(
                'Could not find the chat input on this page.\n\n' +
                'The platform may have updated its UI. Please report this to the script author.'
            );
            return false;
        }

        const type = resolveType(el);
        if (type === 'ta') {
            injectIntoTextarea(el, text);
        } else {
            injectIntoContentEditable(el, text);
        }

        // Scroll the element into view so the user can see what was inserted
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
    }

    // ── GitHub helpers ────────────────────────────────────────────────────────

    function parseGitHubURL(raw) {
        let url;
        try {
            url = new URL(raw.trim());
        } catch {
            return null;
        }

        if (!url.hostname.endsWith('github.com')) return null;

        // Strip leading slash and split
        const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
        // Minimum: owner + repo
        if (parts.length < 2) return null;

        const owner  = parts[0];
        const repo   = parts[1].replace(/\.git$/, '');
        // /tree/BRANCH or /blob/BRANCH/... → parts[3]
        const branch = (parts[2] === 'tree' || parts[2] === 'blob') ? parts[3] : 'HEAD';

        return { owner, repo, branch };
    }

    function ghFetch(path, token) {
        return new Promise((resolve, reject) => {
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            GM_xmlhttpRequest({
                method:  'GET',
                url:     `https://api.github.com/${path}`,
                headers,
                onload(r) {
                    if (r.status === 401) { reject(new Error('bad_token'));   return; }
                    if (r.status === 403) { reject(new Error('rate_limit'));  return; }
                    if (r.status === 404) { reject(new Error('not_found'));   return; }
                    if (r.status !== 200) { reject(new Error(`http_${r.status}`)); return; }
                    try   { resolve(JSON.parse(r.responseText)); }
                    catch { reject(new Error('parse_error')); }
                },
                onerror() { reject(new Error('network_error')); },
                ontimeout() { reject(new Error('timeout')); },
            });
        });
    }

    function rawFetch(owner, repo, branch, path, token) {
        return new Promise(resolve => {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            GM_xmlhttpRequest({
                method:  'GET',
                url:     `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
                headers,
                onload(r)    { resolve(r.status === 200 ? r.responseText : null); },
                onerror()    { resolve(null); },
                ontimeout()  { resolve(null); },
            });
        });
    }

    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    async function fetchRepo(owner, repo, branch, token, opts, onProgress) {
        const { maxSizeKB, maxFiles, exclExts } = opts;

        // ── 1. Tree ──
        onProgress('Fetching file tree…', 5);
        let treeData;
        try {
            treeData = await ghFetch(
                `repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
                token
            );
        } catch (err) {
            const msgs = {
                bad_token:     'Invalid GitHub token — check Settings.',
                rate_limit:    'GitHub API rate limit reached. Add a token in Settings to raise the limit to 5,000 req/hr.',
                not_found:     `"${owner}/${repo}" not found. It may be private (add a token) or the URL is wrong.`,
                network_error: 'Network error contacting GitHub API.',
                timeout:       'Request to GitHub API timed out.',
            };
            throw new Error(msgs[err.message] ?? `GitHub API error: ${err.message}`);
        }

        if (treeData.truncated) {
            console.warn('[GRTP] Tree was truncated by GitHub (repo too large). Results may be incomplete.');
        }

        // ── 2. Filter ──
        const blobs = treeData.tree.filter(n => n.type === 'blob');

        const skipNames = new Set([
            '.DS_Store', 'Thumbs.db', '.gitkeep', '.editorconfig',
        ]);
        const skipDirs = new Set([
            'node_modules', '.git', 'dist', 'build', '__pycache__',
            '.next', '.nuxt', 'vendor', 'coverage', '.cache',
        ]);
        const skipPatterns = [
            /\.(min|bundle|compiled|prod)\.(js|css)$/,
            /\.d\.ts$/,
        ];

        const filtered = blobs.filter(n => {
            const parts = n.path.split('/');
            // Skip anything inside blacklisted directories
            if (parts.some(p => skipDirs.has(p))) return false;

            const basename = parts.at(-1);
            if (skipNames.has(basename)) return false;

            const ext = basename.includes('.')
                ? basename.split('.').pop().toLowerCase()
                : '';
            if (exclExts.includes(ext)) return false;
            if (skipPatterns.some(rx => rx.test(n.path))) return false;

            // n.size is bytes
            if (n.size > maxSizeKB * 1024) return false;

            return true;
        }).slice(0, maxFiles);

        if (!filtered.length) {
            throw new Error(
                'No text files remain after filtering. Try relaxing the excluded extensions or increasing the max file size in Settings.'
            );
        }

        // ── 3. Fetch contents ──
        const results = [];
        for (let i = 0; i < filtered.length; i++) {
            const f = filtered[i];
            const pct = 10 + ((i / filtered.length) * 88);
            onProgress(`[${i + 1}/${filtered.length}] ${f.path}`, pct);

            const content = await rawFetch(owner, repo, branch, f.path, token);
            if (content !== null) results.push({ path: f.path, content });

            // Micro-delay every 15 files to avoid hammering the CDN
            if (i > 0 && i % 15 === 0) await sleep(100);
        }

        if (!results.length) {
            throw new Error('All files failed to download. Check your network connection.');
        }

        onProgress('Done', 100);
        return results;
    }

    // ── Formatters ────────────────────────────────────────────────────────────

    const EXT_TO_LANG = {
        js: 'javascript', mjs: 'javascript', cjs: 'javascript',
        ts: 'typescript', tsx: 'tsx', jsx: 'jsx',
        py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
        java: 'java', kt: 'kotlin', swift: 'swift',
        cs: 'csharp', cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
        c: 'c', h: 'c', hpp: 'cpp',
        sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
        ps1: 'powershell', psm1: 'powershell',
        php: 'php', lua: 'lua', r: 'r', m: 'matlab',
        html: 'html', htm: 'html',
        css: 'css', scss: 'scss', sass: 'sass', less: 'less',
        json: 'json', json5: 'json5',
        yaml: 'yaml', yml: 'yaml',
        toml: 'toml', ini: 'ini', env: 'dotenv',
        xml: 'xml', svg: 'xml',
        sql: 'sql', graphql: 'graphql', gql: 'graphql',
        md: 'markdown', mdx: 'mdx', rst: 'rst',
        dockerfile: 'dockerfile', tf: 'hcl', hcl: 'hcl',
        nix: 'nix', vim: 'vim', el: 'elisp',
    };

    function getLang(path) {
        const base = path.split('/').at(-1).toLowerCase();
        // Special filenames with no extension
        const noExtMap = { dockerfile: 'dockerfile', makefile: 'makefile', gemfile: 'ruby' };
        if (noExtMap[base]) return noExtMap[base];
        const ext = base.includes('.') ? base.split('.').at(-1) : '';
        return EXT_TO_LANG[ext] ?? '';
    }

    function formatXML(owner, repo, branch, files) {
        const header = [
            `<repository name="${owner}/${repo}" branch="${branch}" file_count="${files.length}">`,
            `<!-- Fetched ${new Date().toISOString()} -->`,
        ].join('\n');

        const docs = files.map(({ path, content }) =>
            `<document path="${path}">\n${content}\n</document>`
        ).join('\n\n');

        return `${header}\n\n${docs}\n\n</repository>`;
    }

    function formatMarkdown(owner, repo, branch, files) {
        const header = `# Repository: \`${owner}/${repo}\` (branch: \`${branch}\`)\n_${files.length} files — fetched ${new Date().toUTCString()}_\n`;

        const sections = files.map(({ path, content }) => {
            const lang = getLang(path);
            return `---\n\n### \`${path}\`\n\`\`\`${lang}\n${content}\n\`\`\``;
        }).join('\n\n');

        return `${header}\n${sections}`;
    }

    function buildFinalPrompt(request, repoText, reqPosition) {
        if (!request) return repoText;
        const sep = '\n\n---\n\n';
        return reqPosition === 'after'
            ? repoText + sep + request
            : request + sep + repoText;
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    GM_addStyle(`
        #grtp-fab {
            position: fixed;
            bottom: 80px;
            right: 16px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #5865f2;
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 89990;
            box-shadow: 0 2px 10px rgba(0,0,0,0.35);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            padding: 0;
        }
        #grtp-fab:hover {
            transform: scale(1.12);
            box-shadow: 0 4px 18px rgba(88,101,242,0.55);
        }
        #grtp-fab svg { pointer-events: none; }

        #grtp-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.65);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            z-index: 89991;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0s linear 0.2s;
        }
        #grtp-overlay.open {
            opacity: 1;
            visibility: visible;
            transition-delay: 0s;
        }

        #grtp-modal {
            position: relative;
            background: #1e1e2e;
            color: #cdd6f4;
            border: 1px solid #313244;
            border-radius: 14px;
            width: min(94vw, 660px);
            max-height: 92vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.55);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            overflow: hidden;
            transform: scale(0.96) translateY(8px);
            opacity: 0;
            transition: transform 0.2s ease, opacity 0.2s ease;
        }
        #grtp-overlay.open #grtp-modal {
            transform: scale(1) translateY(0);
            opacity: 1;
        }

        /* ── Header ── */
        #grtp-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 18px 20px 0;
            flex-shrink: 0;
        }
        #grtp-title {
            font-size: 16px;
            font-weight: 700;
            color: #cdd6f4;
            margin: 0;
            flex: 1;
        }
        #grtp-close {
            background: none;
            border: none;
            color: #585b70;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            padding: 4px 6px;
            border-radius: 6px;
            transition: color 0.15s;
            flex-shrink: 0;
        }
        #grtp-close:hover { color: #cdd6f4; }

        /* ── Tabs ── */
        #grtp-tabs {
            display: flex;
            padding: 12px 20px 0;
            gap: 2px;
            border-bottom: 1px solid #313244;
            margin-top: 12px;
            flex-shrink: 0;
        }
        .grtp-tab {
            padding: 7px 14px;
            background: none;
            border: none;
            color: #6c7086;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.02em;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: color 0.15s;
            border-radius: 4px 4px 0 0;
        }
        .grtp-tab:hover:not(.active) { color: #a6adc8; }
        .grtp-tab.active {
            color: #89b4fa;
            border-bottom-color: #89b4fa;
        }

        /* ── Body / Panels ── */
        #grtp-body {
            overflow-y: auto;
            padding: 16px 20px 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            flex: 1;
            min-height: 0;
        }

        .grtp-panel { display: none; flex-direction: column; gap: 14px; }
        .grtp-panel.active { display: flex; }

        /* ── Form elements ── */
        .grtp-field { display: flex; flex-direction: column; gap: 5px; }
        .grtp-label {
            font-size: 11px;
            font-weight: 700;
            color: #7f849c;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        .grtp-hint {
            font-size: 11px;
            color: #585b70;
            line-height: 1.4;
        }
        .grtp-input,
        .grtp-textarea {
            width: 100%;
            background: #181825;
            color: #cdd6f4;
            border: 1px solid #313244;
            border-radius: 8px;
            padding: 9px 12px;
            font-size: 13px;
            font-family: inherit;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.15s;
        }
        .grtp-input:focus,
        .grtp-textarea:focus { border-color: #89b4fa; }
        .grtp-input::placeholder,
        .grtp-textarea::placeholder { color: #45475a; }
        .grtp-textarea { resize: vertical; min-height: 90px; line-height: 1.5; }

        .grtp-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        /* ── Format picker ── */
        .grtp-format-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .grtp-format-opt {
            padding: 10px;
            background: #181825;
            border: 1px solid #313244;
            border-radius: 8px;
            color: #7f849c;
            cursor: pointer;
            text-align: center;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.15s;
            user-select: none;
        }
        .grtp-format-opt strong { display: block; font-size: 13px; color: #a6adc8; margin-bottom: 2px; }
        .grtp-format-opt:hover { border-color: #45475a; color: #a6adc8; }
        .grtp-format-opt.selected {
            background: rgba(137,180,250,0.12);
            border-color: #89b4fa;
            color: #89b4fa;
        }
        .grtp-format-opt.selected strong { color: #89b4fa; }

        /* ── Position picker ── */
        .grtp-pos-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .grtp-pos-opt {
            padding: 8px 12px;
            background: #181825;
            border: 1px solid #313244;
            border-radius: 8px;
            color: #7f849c;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.15s;
            user-select: none;
            text-align: center;
        }
        .grtp-pos-opt:hover { border-color: #45475a; color: #a6adc8; }
        .grtp-pos-opt.selected {
            background: rgba(137,180,250,0.12);
            border-color: #89b4fa;
            color: #89b4fa;
        }

        /* ── Progress ── */
        #grtp-progress {
            display: none;
            flex-direction: column;
            gap: 6px;
        }
        #grtp-progress.visible { display: flex; }
        #grtp-progress-track {
            height: 5px;
            background: #313244;
            border-radius: 3px;
            overflow: hidden;
        }
        #grtp-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #89b4fa, #cba6f7);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 3px;
        }
        #grtp-progress-msg {
            font-size: 11px;
            color: #7f849c;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* ── Feedback ── */
        #grtp-error {
            display: none;
            font-size: 12px;
            color: #f38ba8;
            background: rgba(243,139,168,0.1);
            border: 1px solid rgba(243,139,168,0.25);
            border-radius: 8px;
            padding: 9px 12px;
            line-height: 1.5;
        }
        #grtp-error.visible { display: block; }

        #grtp-stats {
            display: none;
            font-size: 12px;
            color: #a6e3a1;
            background: rgba(166,227,161,0.08);
            border: 1px solid rgba(166,227,161,0.2);
            border-radius: 8px;
            padding: 9px 12px;
        }
        #grtp-stats.visible { display: block; }

        /* ── Footer buttons ── */
        #grtp-footer {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            padding: 12px 20px 16px;
            border-top: 1px solid #313244;
            flex-shrink: 0;
        }
        .grtp-btn {
            padding: 9px 18px;
            border-radius: 8px;
            border: none;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s, opacity 0.15s;
            font-family: inherit;
        }
        .grtp-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .grtp-btn-secondary {
            background: #313244;
            color: #cdd6f4;
            border: 1px solid #45475a;
        }
        .grtp-btn-secondary:hover:not(:disabled) { background: #45475a; }
        .grtp-btn-primary {
            background: #89b4fa;
            color: #1e1e2e;
        }
        .grtp-btn-primary:hover:not(:disabled) { background: #b4d0fb; }
        .grtp-btn-danger {
            background: transparent;
            color: #f38ba8;
            border: 1px solid rgba(243,139,168,0.35);
        }
        .grtp-btn-danger:hover:not(:disabled) {
            background: rgba(243,139,168,0.1);
        }

        /* ── Settings input group ── */
        .grtp-settings-note {
            font-size: 11px;
            color: #585b70;
            background: #181825;
            border-radius: 6px;
            padding: 8px 10px;
            line-height: 1.5;
            border: 1px solid #313244;
        }
    `);

    // ── Modal state ───────────────────────────────────────────────────────────

    let cachedFiles  = null;
    let cachedMeta   = null;
    let isFetching   = false;

    // ── Build DOM ─────────────────────────────────────────────────────────────

    function buildUI() {
        // FAB
        const fab = document.createElement('button');
        fab.id    = 'grtp-fab';
        fab.title = 'Import GitHub Repo as Prompt';
        fab.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61
                         c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77
                         5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0
                         C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78
                         c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>`;
        document.body.appendChild(fab);

        // Overlay + modal
        const overlay = document.createElement('div');
        overlay.id    = 'grtp-overlay';
        overlay.innerHTML = `
            <div id="grtp-modal">
                <div id="grtp-header">
                    <h2 id="grtp-title">📦 Git Repo to Prompt</h2>
                    <button id="grtp-close" title="Close (Esc)">✕</button>
                </div>

                <div id="grtp-tabs">
                    <button class="grtp-tab active" data-panel="import">Import</button>
                    <button class="grtp-tab" data-panel="request">Request</button>
                    <button class="grtp-tab" data-panel="settings">Settings</button>
                </div>

                <div id="grtp-body">

                    <!-- ── Import panel ── -->
                    <div class="grtp-panel active" id="grtp-panel-import">
                        <div class="grtp-field">
                            <label class="grtp-label">GitHub Repository URL</label>
                            <input class="grtp-input" id="grtp-url"
                                placeholder="https://github.com/owner/repo  or  …/tree/branch"
                                type="url" autocomplete="url">
                            <span class="grtp-hint">Public repos work out of the box. Private repos require a token (Settings).</span>
                        </div>

                        <div id="grtp-progress">
                            <div id="grtp-progress-msg">Starting…</div>
                            <div id="grtp-progress-track">
                                <div id="grtp-progress-fill"></div>
                            </div>
                        </div>

                        <div id="grtp-error"></div>
                        <div id="grtp-stats"></div>

                        <div class="grtp-field">
                            <label class="grtp-label">Output Format</label>
                            <div class="grtp-format-grid">
                                <div class="grtp-format-opt selected" data-fmt="xml">
                                    <strong>XML</strong>Claude-style documents
                                </div>
                                <div class="grtp-format-opt" data-fmt="markdown">
                                    <strong>Markdown</strong>Fenced code blocks
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Request panel ── -->
                    <div class="grtp-panel" id="grtp-panel-request">
                        <div class="grtp-field">
                            <label class="grtp-label">Your Request / Question</label>
                            <textarea class="grtp-textarea" id="grtp-request"
                                rows="6"
                                placeholder="What would you like to ask about this repository?

Examples:
- Explain the overall architecture and how the pieces fit together.
- Find any potential security issues in the authentication logic.
- Suggest refactors for the functions in src/utils.js.
- Write unit tests for the exported functions."></textarea>
                            <span class="grtp-hint">Leave blank to insert only the repo context.</span>
                        </div>

                        <div class="grtp-field">
                            <label class="grtp-label">Request Position</label>
                            <div class="grtp-pos-grid">
                                <div class="grtp-pos-opt selected" data-pos="before">Request first, then repo</div>
                                <div class="grtp-pos-opt" data-pos="after">Repo first, then request</div>
                            </div>
                        </div>
                    </div>

                    <!-- ── Settings panel ── -->
                    <div class="grtp-panel" id="grtp-panel-settings">
                        <div class="grtp-field">
                            <label class="grtp-label">GitHub Personal Access Token</label>
                            <input class="grtp-input" id="grtp-token"
                                type="password" placeholder="ghp_…" autocomplete="off">
                            <span class="grtp-hint">
                                Optional. Raises the rate limit from 60 → 5,000 req/hr and enables private repo access.<br>
                                Needs <code>public_repo</code> scope (or <code>repo</code> for private repos).
                            </span>
                        </div>

                        <div class="grtp-row">
                            <div class="grtp-field">
                                <label class="grtp-label">Max File Size (KB)</label>
                                <input class="grtp-input" id="grtp-max-size"
                                    type="number" min="1" max="2048">
                            </div>
                            <div class="grtp-field">
                                <label class="grtp-label">Max Files</label>
                                <input class="grtp-input" id="grtp-max-files"
                                    type="number" min="1" max="500">
                            </div>
                        </div>

                        <div class="grtp-field">
                            <label class="grtp-label">Excluded Extensions (comma-separated)</label>
                            <textarea class="grtp-textarea" id="grtp-excl-exts"
                                rows="3"></textarea>
                            <span class="grtp-hint">Binary, media, and generated files are excluded by default.</span>
                        </div>

                        <div class="grtp-settings-note">
                            <strong>Auto-excluded directories:</strong>
                            <code>node_modules</code>, <code>dist</code>, <code>build</code>,
                            <code>__pycache__</code>, <code>.next</code>, <code>vendor</code>,
                            <code>coverage</code>, <code>.git</code>
                        </div>
                    </div>
                </div><!-- /#grtp-body -->

                <div id="grtp-footer">
                    <!-- buttons injected by JS depending on active tab -->
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return { fab, overlay };
    }

    // ── Controller ────────────────────────────────────────────────────────────

    function init() {
        const { fab, overlay } = buildUI();

        // ── Helpers ──
        function open()  { overlay.classList.add('open'); }
        function close() { overlay.classList.remove('open'); }

        function setProgress(msg, pct) {
            const wrap = document.getElementById('grtp-progress');
            wrap.classList.add('visible');
            document.getElementById('grtp-progress-msg').textContent  = msg;
            document.getElementById('grtp-progress-fill').style.width = `${pct}%`;
            if (pct >= 100) {
                setTimeout(() => wrap.classList.remove('visible'), 900);
            }
        }

        function showError(msg) {
            const el = document.getElementById('grtp-error');
            el.textContent = msg;
            el.classList.add('visible');
        }

        function clearError() {
            document.getElementById('grtp-error').classList.remove('visible');
        }

        function showStats(meta, files) {
            const chars = files.reduce((s, f) => s + f.content.length, 0);
            const el = document.getElementById('grtp-stats');
            el.innerHTML =
                `✓ <strong>${meta.owner}/${meta.repo}</strong> &mdash; ` +
                `${files.length} files, ~${(chars / 1000).toFixed(1)}K characters`;
            el.classList.add('visible');
        }

        function clearStats() {
            document.getElementById('grtp-stats').classList.remove('visible');
        }

        // ── Footer button rendering ──
        const IMPORT_FOOTER = `
            <button class="grtp-btn grtp-btn-secondary" id="grtp-fetch-btn">Fetch Repo</button>
            <button class="grtp-btn grtp-btn-primary" id="grtp-insert-btn" disabled>Insert into Chat</button>
        `;
        const REQUEST_FOOTER = `
            <button class="grtp-btn grtp-btn-primary" id="grtp-insert-btn-2" disabled>Insert into Chat</button>
        `;
        const SETTINGS_FOOTER = `
            <button class="grtp-btn grtp-btn-danger" id="grtp-reset-btn">Reset Defaults</button>
            <button class="grtp-btn grtp-btn-primary" id="grtp-save-btn">Save Settings</button>
        `;

        function renderFooter(panel) {
            const footer = document.getElementById('grtp-footer');
            footer.innerHTML = {
                import:   IMPORT_FOOTER,
                request:  REQUEST_FOOTER,
                settings: SETTINGS_FOOTER,
            }[panel] ?? '';

            const insertReady = !!cachedFiles;

            if (panel === 'import') {
                document.getElementById('grtp-insert-btn').disabled = !insertReady;
                attachFetchHandler();
                attachInsertHandler('grtp-insert-btn');
            }
            if (panel === 'request') {
                document.getElementById('grtp-insert-btn-2').disabled = !insertReady;
                attachInsertHandler('grtp-insert-btn-2');
            }
            if (panel === 'settings') {
                attachSettingsHandlers();
            }
        }

        // ── Tab switching ──
        let activePanel = 'import';
        overlay.querySelectorAll('.grtp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelectorAll('.grtp-tab').forEach(t => t.classList.remove('active'));
                overlay.querySelectorAll('.grtp-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                activePanel = tab.dataset.panel;
                document.getElementById(`grtp-panel-${activePanel}`).classList.add('active');
                renderFooter(activePanel);
            });
        });

        // ── Format picker ──
        overlay.querySelectorAll('.grtp-format-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                overlay.querySelectorAll('.grtp-format-opt').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // ── Position picker ──
        overlay.querySelectorAll('.grtp-pos-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                overlay.querySelectorAll('.grtp-pos-opt').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // ── Close ──
        document.getElementById('grtp-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) close();
        });

        // ── Fetch handler ──
        function attachFetchHandler() {
            document.getElementById('grtp-fetch-btn')?.addEventListener('click', async () => {
                if (isFetching) return;

                clearError();
                clearStats();
                cachedFiles = null;
                cachedMeta  = null;
                document.getElementById('grtp-insert-btn').disabled = true;

                const url = document.getElementById('grtp-url').value.trim();
                if (!url) { showError('Please enter a GitHub repository URL.'); return; }

                const parsed = parseGitHubURL(url);
                if (!parsed) {
                    showError('Couldn\'t parse that URL. Expected: https://github.com/owner/repo');
                    return;
                }

                const token = GM_getValue(KEY_TOKEN, '');
                const opts  = {
                    maxSizeKB: GM_getValue(KEY_MAX_SIZE_KB, DEFAULT_MAX_SIZE_KB),
                    maxFiles:  GM_getValue(KEY_MAX_FILES,   DEFAULT_MAX_FILES),
                    exclExts:  GM_getValue(KEY_EXCL_EXTS,   DEFAULT_EXCL_EXTS)
                                   .split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
                };

                isFetching = true;
                const fetchBtn = document.getElementById('grtp-fetch-btn');
                fetchBtn.disabled    = true;
                fetchBtn.textContent = 'Fetching…';

                try {
                    const files = await fetchRepo(
                        parsed.owner, parsed.repo, parsed.branch,
                        token, opts, setProgress
                    );
                    cachedFiles = files;
                    cachedMeta  = parsed;
                    showStats(parsed, files);
                    document.getElementById('grtp-insert-btn').disabled = false;
                } catch (err) {
                    showError(err.message);
                } finally {
                    isFetching              = false;
                    fetchBtn.disabled       = false;
                    fetchBtn.textContent    = 'Fetch Repo';
                }
            });
        }

        // ── Insert handler ──
        function attachInsertHandler(btnId) {
            document.getElementById(btnId)?.addEventListener('click', () => {
                if (!cachedFiles || !cachedMeta) return;

                const fmt = overlay.querySelector('.grtp-format-opt.selected')?.dataset.fmt
                    ?? GM_getValue(KEY_FORMAT, DEFAULT_FORMAT);
                const pos = overlay.querySelector('.grtp-pos-opt.selected')?.dataset.pos
                    ?? GM_getValue(KEY_REQ_POSITION, DEFAULT_REQ_POS);
                const request = document.getElementById('grtp-request').value.trim();

                const repoText = fmt === 'xml'
                    ? formatXML(cachedMeta.owner, cachedMeta.repo, cachedMeta.branch, cachedFiles)
                    : formatMarkdown(cachedMeta.owner, cachedMeta.repo, cachedMeta.branch, cachedFiles);

                const final = buildFinalPrompt(request, repoText, pos);

                if (injectText(final)) close();
            });
        }

        // ── Settings handlers ──
        function attachSettingsHandlers() {
            document.getElementById('grtp-save-btn')?.addEventListener('click', () => {
                GM_setValue(KEY_TOKEN,       document.getElementById('grtp-token').value.trim());
                GM_setValue(KEY_MAX_SIZE_KB, parseInt(document.getElementById('grtp-max-size').value) || DEFAULT_MAX_SIZE_KB);
                GM_setValue(KEY_MAX_FILES,   parseInt(document.getElementById('grtp-max-files').value) || DEFAULT_MAX_FILES);
                GM_setValue(KEY_EXCL_EXTS,   document.getElementById('grtp-excl-exts').value);

                const btn = document.getElementById('grtp-save-btn');
                btn.textContent = '✓ Saved';
                setTimeout(() => { btn.textContent = 'Save Settings'; }, 1800);
            });

            document.getElementById('grtp-reset-btn')?.addEventListener('click', () => {
                document.getElementById('grtp-max-size').value  = DEFAULT_MAX_SIZE_KB;
                document.getElementById('grtp-max-files').value = DEFAULT_MAX_FILES;
                document.getElementById('grtp-excl-exts').value = DEFAULT_EXCL_EXTS;
            });
        }

        // ── Populate settings fields on open ──
        function populateSettings() {
            document.getElementById('grtp-token').value     = GM_getValue(KEY_TOKEN,       '');
            document.getElementById('grtp-max-size').value  = GM_getValue(KEY_MAX_SIZE_KB, DEFAULT_MAX_SIZE_KB);
            document.getElementById('grtp-max-files').value = GM_getValue(KEY_MAX_FILES,   DEFAULT_MAX_FILES);
            document.getElementById('grtp-excl-exts').value = GM_getValue(KEY_EXCL_EXTS,  DEFAULT_EXCL_EXTS);
        }

        // ── Open ──
        fab.addEventListener('click', () => {
            populateSettings();
            // Re-render footer for whichever tab is currently active
            renderFooter(activePanel);
            open();
        });

        // Initial footer render
        renderFooter('import');

        // ── Userscript manager menu command ──
        GM_registerMenuCommand('Git Repo to Prompt — Open', () => {
            populateSettings();
            renderFooter(activePanel);
            open();
        });
    }

    // ── Boot ─────────────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();