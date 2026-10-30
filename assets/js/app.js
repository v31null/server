'use strict';

function v31nT(key, params) {
    const table = window.V31N_T || {};
    let text = typeof table[key] === 'string' ? table[key] : key;
    if (params) {
        Object.keys(params).forEach((k) => {
            text = text.split('{' + k + '}').join(String(params[k]));
        });
    }
    return text;
}
window.v31nT = v31nT;

document.addEventListener('DOMContentLoaded', () => {
    const mode = window.V31N_MODE;

    v31nEyes();

    if (mode === 'upload') {
        initUpload();
    } else if (mode === 'download') {
        initDownload();
    }
});


function getBaseUrl() {
    const path = window.location.pathname;
    const lower = path.toLowerCase();
    let idx = lower.indexOf('/w/');
    if (idx === -1) idx = lower.indexOf('/v/');
    if (idx !== -1) {
        return path.substring(0, idx) + '/';
    }
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash !== -1) {
        return path.substring(0, lastSlash) + '/';
    }
    return '/';
}


function v31nEyes() {
    document.querySelectorAll('.eye-toggle').forEach((btn) => {
        const input = document.getElementById(btn.dataset.eye);
        if (!input) return;
        btn.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('is-on', show);
            const label = show ? btn.dataset.hide : btn.dataset.show;
            btn.setAttribute('aria-label', label);
            btn.title = label;
        });
    });
}


function v31nOnEnter(input, btn) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btn.disabled) {
            e.preventDefault();
            btn.click();
        }
    });
}


function v31nSleep(ms, signal) {
    return new Promise((resolve) => {
        const timer = setTimeout(done, ms);
        function done() {
            clearTimeout(timer);
            if (signal) signal.removeEventListener('abort', done);
            resolve();
        }
        if (signal) signal.addEventListener('abort', done);
    });
}


function v31nWaitForOnline(maxWait) {
    if (navigator.onLine !== false) return Promise.resolve();
    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            window.removeEventListener('online', finish);
            resolve();
        };
        window.addEventListener('online', finish);
        setTimeout(finish, maxWait || 30000);
    });
}


async function v31nFetchRetry(url, options, cfg) {
    cfg = cfg || {};
    const signal = cfg.signal;
    const maxAttempts = cfg.maxAttempts || 10;
    const timeout = cfg.timeout || 120000;
    const maxDelay = 30000;
    let delay = cfg.baseDelay || 1500;
    let attempt = 0;
    let lastErr = null;

    while (attempt < maxAttempts) {
        attempt++;
        await v31nWaitForOnline();
        if (signal && signal.aborted) throw new DOMException('', 'AbortError');

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeout);
        const relay = () => ctrl.abort();
        if (signal) signal.addEventListener('abort', relay);
        try {
            const resp = await fetch(url, Object.assign({}, options, { signal: ctrl.signal }));
            clearTimeout(timer);

            if (resp.status === 429 || (resp.status >= 500 && resp.status < 600 && resp.status !== 507)) {
                if (attempt >= maxAttempts) return resp;
                const ra = parseInt(resp.headers.get('Retry-After') || '0', 10);
                const wait = (ra > 0 ? ra * 1000 : delay) + Math.floor(Math.random() * 750);
                await v31nSleep(wait, signal);
                delay = Math.min(delay * 2, maxDelay);
                continue;
            }

            return resp;
        } catch (e) {
            clearTimeout(timer);
            if (signal && signal.aborted) throw e;
            lastErr = e;
            if (attempt >= maxAttempts) break;
            await v31nSleep(delay + Math.floor(Math.random() * 750), signal);
            delay = Math.min(delay * 2, maxDelay);
        } finally {
            if (signal) signal.removeEventListener('abort', relay);
        }
    }

    throw lastErr || new Error(v31nT('network.failed'));
}


function v31nKb(bytes) {
    return (bytes / 1024).toFixed(2);
}


function v31nFit(files, max) {
    let total = files.reduce((sum, f) => sum + f.size, 0);
    const dropped = new Set();
    for (const f of files.slice().sort((a, b) => b.size - a.size)) {
        if (total <= max) break;
        dropped.add(f);
        total -= f.size;
    }
    return files.filter(f => !dropped.has(f));
}


function v31nListText(files) {
    const items = files.map(f => v31nT('file.item', { name: f.name, size: v31nKb(f.size) }));
    if (items.length === 1) return items[0];
    const list = items.length === 2
        ? items[0] + v31nT('file.list.and2') + items[1]
        : items.slice(0, -1).join(v31nT('file.list.sep')) + v31nT('file.list.and') + items[items.length - 1];
    return list + v31nT('file.list.sum', { size: v31nKb(files.reduce((sum, f) => sum + f.size, 0)) });
}


function v31nSafeMime(mime) {
    const m = String(mime || '').toLowerCase();
    return m.startsWith('image/') || m.startsWith('video/') || m.startsWith('audio/') || m === 'application/pdf';
}


const V31N_ORDER = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'aа', 'bб', 'úvв', 'uу', 'ùw', 'gг', 'dдþ', 'eеэ', 'żjж', 'zз',
    'iи', 'íyй', 'kк', 'lл', 'mм', 'nн', 'oо', 'pп', 'rр', 'sс',
    'tт', 'fф', 'țц', 'čч', 'șш', 'c', 'q', 'x', 'hх‘'
];
const V31N_RANK = (() => {
    const m = new Map();
    V31N_ORDER.forEach((chars, rank) => {
        for (const c of chars.toLowerCase()) m.set(c, rank);
    });
    return m;
})();


const V31N_FOLDED = new Map();


function v31nFold(s) {
    s = String(s);
    if (V31N_FOLDED.has(s)) return V31N_FOLDED.get(s);
    let t = new DOMParser().parseFromString(s, 'text/html').documentElement.textContent;
    const bracket = /^\s*\[([^\]]+)\]/u.exec(t);
    if (bracket) t = bracket[1];
    t = t.replace(/^[\p{P}\p{Z}\s]+/u, '');
    t = t.normalize('NFD').replace(/(.)̈/gu, '$1$1').normalize('NFC');
    t = t.replace(/№\s*(\d+)/gu, (m, d) => '№' + String(parseInt(d, 10)).padStart(5, '0'));
    const folded = Array.from(t.toLowerCase());
    V31N_FOLDED.set(s, folded);
    return folded;
}


function v31nCmp(a, b) {
    const s1 = v31nFold(a);
    const s2 = v31nFold(b);
    const min = Math.min(s1.length, s2.length);
    for (let i = 0; i < min; i++) {
        const c1 = s1[i];
        const c2 = s2[i];
        if (c1 === c2) continue;
        const has1 = V31N_RANK.has(c1);
        const has2 = V31N_RANK.has(c2);
        if (has1 && has2) {
            const cmp = V31N_RANK.get(c1) - V31N_RANK.get(c2);
            if (cmp !== 0) return cmp;
        } else if (has1) {
            return -1;
        } else if (has2) {
            return 1;
        } else {
            return c1.codePointAt(0) - c2.codePointAt(0);
        }
    }
    return s1.length - s2.length;
}


function v31nBase(path) {
    const s = String(path || '');
    return s.substring(s.lastIndexOf('/') + 1);
}


function v31nEntry(file, path) {
    return {
        name: path || file.name,
        size: file.size,
        type: file.type,
        arrayBuffer: () => file.arrayBuffer()
    };
}


async function v31nWalk(entry, out) {
    if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        out.push(v31nEntry(file, entry.fullPath.replace(/^\/+/, '')));
    } else if (entry.isDirectory) {
        const reader = entry.createReader();
        for (;;) {
            const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
            if (!batch.length) break;
            for (const e of batch) await v31nWalk(e, out);
        }
    }
}


async function v31nDropped(dt) {
    const items = dt.items ? Array.from(dt.items) : [];
    const entries = items.map(i => (i.kind === 'file' && i.webkitGetAsEntry) ? i.webkitGetAsEntry() : null);
    const files = Array.from(dt.files || []);
    if (entries.length && entries.every(Boolean)) {
        const out = [];
        for (const e of entries) await v31nWalk(e, out);
        return out;
    }
    return files.map(f => v31nEntry(f));
}


function initUpload() {
    const BASE_URL = getBaseUrl();

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const passwordInput = document.getElementById('password-input');
    const uploadBtn = document.getElementById('upload-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultContainer = document.getElementById('result-container');
    const resultLink = document.getElementById('result-link');
    const resultEmbedLink = document.getElementById('result-embed-link');
    const resultQr = document.getElementById('result-qr');
    const copyFeedbackSecure = document.getElementById('copy-feedback-secure');
    const copyFeedbackEmbed = document.getElementById('copy-feedback-embed');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');

    let selectedFiles = [];
    let fullUrlWithHash = '';
    let run = null;

    function showError(msg) {
        errorText.textContent = msg;
        errorContainer.style.display = 'block';
    }

    function hideError() {
        errorContainer.style.display = 'none';
        errorText.textContent = '';
    }

    function updateButtonState() {
        const hasFile = selectedFiles.length > 0;
        uploadBtn.disabled = !hasFile || !!run;
    }

    function selectFiles(list) {
        hideError();
        if (!selectedFiles.length) {
            selectedFiles = v31nFit(list, V31nCrypto.MAX_FILE_SIZE);
            if (!selectedFiles.length) showError(v31nT('upload.too.large'));
        } else {
            let total = selectedFiles.reduce((sum, f) => sum + f.size, 0);
            let refused = false;
            for (const f of list) {
                if (total + f.size <= V31nCrypto.MAX_FILE_SIZE) {
                    selectedFiles.push(f);
                    total += f.size;
                } else {
                    refused = true;
                }
            }
            if (refused) showError(v31nT('upload.too.large'));
        }
        if (selectedFiles.length) {
            fileInfo.textContent = v31nListText(selectedFiles);
            fileInfo.style.display = 'block';
        } else {
            fileInfo.style.display = 'none';
        }
        updateButtonState();
    }

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            selectFiles(Array.from(fileInput.files).map(f => v31nEntry(f)));
        }
        fileInput.value = '';
    });

    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            v31nDropped(e.dataTransfer).then((list) => {
                if (list.length) selectFiles(list);
            }).catch(() => {});
        }
    });

    document.addEventListener('paste', (e) => {
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            selectFiles(Array.from(e.clipboardData.files).map(f => v31nEntry(f)));
        }
    });

    passwordInput.addEventListener('input', () => {
        updateButtonState();
    });

    v31nOnEnter(passwordInput, uploadBtn);

    cancelBtn.addEventListener('click', () => {
        if (run) run.abort();
    });

    window.addEventListener('beforeunload', (e) => {
        if (run) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    uploadBtn.addEventListener('click', async () => {
        const files = selectedFiles.slice();
        const file = files[0];
        let password = passwordInput.value;

        if (!file) return;
        if (!password) {
            password = '1';
        }

        if (/[&#]/.test(password)) {
            showError(v31nT('upload.unsupported'));
            return;
        }

        const ctl = new AbortController();
        const signal = ctl.signal;
        const halt = () => {
            if (signal.aborted) throw new DOMException('', 'AbortError');
        };
        run = ctl;

        uploadBtn.disabled = true;
        cancelBtn.style.display = 'block';
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = v31nT('upload.encrypting.progress', { p: 0 });
        resultContainer.style.display = 'none';
        hideError();

        try {
            const realCount = Math.ceil(files.reduce((sum, f) => sum + f.size, 0) / V31nCrypto.CHUNK_SIZE) || 1;
            const numPseudos = V31nCrypto.padme(realCount) - realCount;

            const decoyHashes = [];
            const decoyChunks = [];
            for (let p = 0; p < numPseudos; p++) {
                halt();
                const dummyData = crypto.getRandomValues(new Uint8Array(V31N_ENTRY));
                const dummyHash = V31nCrypto.bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', dummyData)));
                decoyChunks.push({
                    hash: dummyHash,
                    iv: crypto.getRandomValues(new Uint8Array(12)),
                    data: dummyData
                });
                decoyHashes.push(dummyHash);
            }

            const result = await V31nCrypto.chunkAndEncryptFile(files, password, decoyHashes, (progress) => {
                halt();
                progressFill.style.width = (progress * 40) + '%';
                progressText.textContent = v31nT('upload.encrypting.progress', { p: Math.round(progress * 100) });
            });

            const STORE_BATCH = 128;
            const STORE_PARALLEL = 2;
            const STATUS_BATCH = 2000;

            const allChunks = result.chunks.concat(decoyChunks);
            for (let i = allChunks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = allChunks[i];
                allChunks[i] = allChunks[j];
                allChunks[j] = tmp;
            }

            const missingOf = async (hashes, strict) => {
                const missing = new Set();
                for (let i = 0; i < hashes.length; i += STATUS_BATCH) {
                    const part = hashes.slice(i, i + STATUS_BATCH);
                    const resp = await v31nFetchRetry(BASE_URL + 'api/status.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ hashes: part })
                    }, { signal });
                    if (!resp.ok) {
                        if (strict) throw new Error(v31nT('upload.check.failed', { status: resp.status }));
                        part.forEach(h => missing.add(h));
                        continue;
                    }
                    (await resp.json()).missing.forEach(h => missing.add(h));
                }
                return missing;
            };

            progressText.textContent = v31nT('upload.checking');
            const firstMissing = await missingOf(allChunks.map(c => c.hash), true);
            let toUpload = allChunks.filter(c => firstMissing.has(c.hash));

            const ticketResp = await v31nFetchRetry(BASE_URL + 'api/ticket.php', { method: 'POST' }, { signal });
            if (!ticketResp.ok) {
                throw new Error(v31nT('upload.failed.http', { status: ticketResp.status }));
            }
            const ticket = (await ticketResp.json()).ticket;
            const ticketBytes = V31nCrypto.hexToBytes(ticket);

            const totalToStore = Math.max(1, toUpload.length);
            let storedSoFar = 0;
            let noSpace = false;
            let tooLarge = false;
            progressText.textContent = v31nT('upload.uploading');

            const sendBatch = async (batch) => {
                const body = new Uint8Array(ticketBytes.length + batch.length * V31N_RECORD);
                body.set(ticketBytes, 0);
                batch.forEach((c, k) => {
                    const o = ticketBytes.length + k * V31N_RECORD;
                    body.set(V31nCrypto.hexToBytes(c.hash), o);
                    body.set(c.iv, o + 32);
                    body.set(c.data, o + 44);
                });
                try {
                    const r = await v31nFetchRetry(BASE_URL + 'upload.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        body
                    }, { signal });
                    if (r.status === 507) {
                        noSpace = true;
                        return;
                    }
                    if (r.status === 413) {
                        tooLarge = true;
                        return;
                    }
                    if (!r.ok) return;
                    storedSoFar += batch.length;
                    const frac = Math.min(1, storedSoFar / totalToStore);
                    progressFill.style.width = (40 + frac * 45) + '%';
                    progressText.textContent = v31nT('upload.uploading.progress', { p: Math.round(frac * 100) });
                } catch (e) {
                }
            };

            let round = 0;
            while (toUpload.length) {
                round++;

                let next = 0;
                const lane = async () => {
                    while (!signal.aborted && !noSpace && !tooLarge && next < toUpload.length) {
                        const batch = toUpload.slice(next, next + STORE_BATCH);
                        next += STORE_BATCH;
                        await sendBatch(batch);
                    }
                };
                await Promise.all(Array.from({ length: STORE_PARALLEL }, lane));
                halt();

                if (noSpace) {
                    throw new Error(v31nT('upload.nospace'));
                }
                if (tooLarge) {
                    throw new Error(v31nT('upload.too.large'));
                }

                const stillMissing = await missingOf(toUpload.map(c => c.hash), false);
                toUpload = toUpload.filter(c => stillMissing.has(c.hash));

                if (!toUpload.length) break;
                if (round >= 6) {
                    throw new Error(v31nT('upload.unstable'));
                }

                await v31nSleep(2000 + Math.floor(Math.random() * 1500), signal);
                halt();
            }

            progressText.textContent = v31nT('upload.sealing');
            progressFill.style.width = '90%';

            const finalizeResp = await v31nFetchRetry(BASE_URL + 'upload.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encrypted_payload: V31nCrypto.bytesToBase64(result.encrypted_payload),
                    payload_iv: V31nCrypto.bytesToBase64(result.payload_iv),
                    salt: V31nCrypto.bytesToBase64(result.salt),
                    ticket
                })
            }, { maxAttempts: 12, signal });

            if (!finalizeResp.ok) {
                throw new Error(v31nT('upload.failed.http', { status: finalizeResp.status }));
            }

            const uploadResult = await finalizeResp.json();

            if (uploadResult.error) {
                throw new Error(uploadResult.error);
            }

            progressFill.style.width = '100%';
            progressText.textContent = v31nT('upload.complete');

            const origin = window.location.origin.replace('.com.pr', '.v31null.de');
            const baseUrl = origin + BASE_URL + 'w/' + uploadResult.id;
            
            const fileName = v31nBase(file.name) || 'file.bin';
            const extIdx = fileName.lastIndexOf('.');
            const ext = extIdx !== -1 && extIdx < fileName.length - 1 ? fileName.substring(extIdx + 1) : 'bin';
            const embedUrl = origin + BASE_URL + 'embed2/' + uploadResult.id + encodeURIComponent(password) + '.' + ext;

            resultLink.href = baseUrl;
            resultLink.textContent = baseUrl;
            
            resultEmbedLink.href = embedUrl;
            resultEmbedLink.textContent = embedUrl;
            resultEmbedLink.classList.add('blurred');
            resultEmbedLink.title = v31nT('upload.embed.reveal');

            v31nQr(resultQr, baseUrl);

            resultContainer.style.display = 'block';

            selectedFiles = [];
            fileInfo.style.display = 'none';

        } catch (err) {
            if (signal.aborted) {
                progressContainer.style.display = 'none';
            } else {
                showError(err.message || v31nT('upload.failed'));
            }
        } finally {
            run = null;
            cancelBtn.style.display = 'none';
            updateButtonState();
        }
    });

    resultLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(resultLink.href).then(() => {
            copyFeedbackSecure.style.display = 'inline';
            setTimeout(() => {
                copyFeedbackSecure.style.display = 'none';
            }, 2000);
        }).catch(() => {
            const range = document.createRange();
            range.selectNodeContents(resultLink);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    });

    resultEmbedLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (resultEmbedLink.classList.contains('blurred')) {
            resultEmbedLink.classList.remove('blurred');
            resultEmbedLink.title = v31nT('upload.embed.copy');
        } else {
            navigator.clipboard.writeText(resultEmbedLink.href).then(() => {
                copyFeedbackEmbed.style.display = 'inline';
                setTimeout(() => {
                    copyFeedbackEmbed.style.display = 'none';
                }, 2000);
            }).catch(() => {
                const range = document.createRange();
                range.selectNodeContents(resultEmbedLink);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });
        }
    });
}


function v31nQr(box, text) {
    const NS = 'http://www.w3.org/2000/svg';
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const quiet = 4;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + (n + quiet * 2) + ' ' + (n + quiet * 2));
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#fff');
    svg.appendChild(bg);
    let d = '';
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (qr.isDark(r, c)) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
        }
    }
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', '#000');
    svg.appendChild(path);
    box.textContent = '';
    box.appendChild(svg);
}


function v31nSave(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'file.bin';
    document.body.appendChild(a);
    a.click();
    a.remove();
}


function initDownload() {
    const BASE_URL = getBaseUrl();

    const passwordInput = document.getElementById('download-password-input');
    const downloadBtn = document.getElementById('download-btn');
    const progressContainer = document.getElementById('download-progress-container');
    const progressFill = document.getElementById('download-progress-fill');
    const progressText = document.getElementById('download-progress-text');
    const errorContainer = document.getElementById('download-error');
    const errorText = document.getElementById('download-error-text');
    const dir = document.getElementById('dir');
    const dirCount = document.getElementById('dir-count');
    const dirTable = document.getElementById('dir-table');
    const dirAll = document.getElementById('dir-all');

    const fileId = window.V31N_FILE_ID;

    function folderRow(text, onClick) {
        const tr = document.createElement('tr');
        const icon = document.createElement('td');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'dir-icon');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z');
        svg.appendChild(path);
        icon.appendChild(svg);
        const label = document.createElement('td');
        label.textContent = text;
        tr.append(icon, label);
        tr.addEventListener('click', onClick);
        return tr;
    }

    function showDir(list) {
        const total = list.reduce((sum, f) => sum + f.bytes.length, 0);
        const items = v31nExpand(list, '').map((f) => {
            const bytes = f.bytes;
            const safe = v31nSafeMime(f.mime);
            const url = URL.createObjectURL(new Blob([bytes], { type: safe ? f.mime : 'application/octet-stream' }));
            return { f, safe, url, bytes, path: String(f.filename || '') };
        });

        dirAll.onclick = () => {
            const letters = V31N_ORDER.filter(g => !/^[0-9]$/.test(g)).map(g => Array.from(g)[0]);
            const taken = new Set(list.map(f => String(f.filename || '')));
            const used = new Set();
            const entries = list.map((f) => {
                let key = String(f.filename || '');
                if (used.has(key)) {
                    const slash = key.lastIndexOf('/') + 1;
                    const dot = key.lastIndexOf('.');
                    const cut = dot > slash ? dot : key.length;
                    for (let k = 1; ; k++) {
                        let suffix = '';
                        for (let n = k; n > 0; n = Math.floor((n - 1) / letters.length)) {
                            suffix = letters[(n - 1) % letters.length] + suffix;
                        }
                        const next = key.substring(0, cut) + suffix + key.substring(cut);
                        if (!taken.has(next) && !used.has(next)) {
                            key = next;
                            break;
                        }
                    }
                }
                used.add(key);
                return { key, bytes: f.bytes };
            });
            v31nSave(URL.createObjectURL(v31nPackBlob(entries)), fileId + '.v31np');
        };

        const render = (cwd) => {
            dirTable.textContent = '';
            if (cwd) {
                const up = cwd.slice(0, -1);
                dirTable.appendChild(folderRow('../', () => render(up.substring(0, up.lastIndexOf('/') + 1))));
            }
            const folders = [];
            items.forEach((it) => {
                if (!it.path.startsWith(cwd)) return;
                const rest = it.path.substring(cwd.length);
                const slash = rest.indexOf('/');
                if (slash !== -1 && !folders.includes(rest.substring(0, slash))) folders.push(rest.substring(0, slash));
            });
            folders.sort(v31nCmp).forEach((name) => {
                dirTable.appendChild(folderRow(name, () => render(cwd + name + '/')));
            });
            const here = items.filter(({ path }) => path.startsWith(cwd) && path.indexOf('/', cwd.length) === -1);
            here.sort((a, b) => v31nCmp(v31nBase(a.path), v31nBase(b.path)));
            here.forEach(({ f, safe, url, bytes, path }) => {
                const name = v31nBase(path);

                const tr = document.createElement('tr');
                const preview = document.createElement('td');
                const box = document.createElement('div');
                box.className = 'dir-preview';
                if (String(f.mime).toLowerCase().startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = '';
                    box.appendChild(img);
                } else {
                    const dot = name.lastIndexOf('.');
                    box.textContent = dot !== -1 && dot < name.length - 1 ? name.substring(dot + 1).toLowerCase() : '';
                }
                preview.appendChild(box);
                const label = document.createElement('td');
                label.textContent = v31nT('file.item', { name, size: v31nKb(bytes.length) });
                tr.append(preview, label);
                tr.addEventListener('click', () => {
                    if (safe) {
                        window.open(url, '_blank');
                    } else {
                        v31nSave(url, name);
                    }
                });
                dirTable.appendChild(tr);
            });
        };
        render('');
        dirCount.textContent = v31nT('download.dir.count', { n: list.length, size: v31nKb(total) });
        document.querySelectorAll('.encrypted-notice, .form-group').forEach((el) => {
            el.style.display = 'none';
        });
        downloadBtn.style.display = 'none';
        progressContainer.style.display = 'none';
        dir.style.display = 'block';
    }

    function showError(msg) {
        errorText.textContent = msg;
        errorContainer.style.display = 'block';
    }

    function hideError() {
        errorContainer.style.display = 'none';
        errorText.textContent = '';
    }

    async function decryptAndOpen(password) {
        downloadBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = v31nT('download.meta');
        hideError();

        try {
            const resp = await fetch(BASE_URL + 'download.php?id=' + encodeURIComponent(fileId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (resp.status === 404) throw new Error(v31nT('download.notfound'));
            if (!resp.ok) throw new Error(v31nT('download.server'));

            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            const encPayload = V31nCrypto.base64ToBytes(data.encrypted_payload);
            const payloadIv = V31nCrypto.base64ToBytes(data.payload_iv);
            const salt = V31nCrypto.base64ToBytes(data.salt);

            progressText.textContent = v31nT('download.auth');
            let payload;
            try {
                payload = await V31nCrypto.decryptPayload(encPayload, payloadIv, password, salt);
            } catch (e) {
                throw new Error(v31nT('download.wrong'));
            }

            const realHashes = payload.map.map(m => m.id);
            const payloadDecoys = payload.decoys || [];
            const hashesToFetch = [...new Set([...realHashes, ...payloadDecoys])].sort(() => Math.random() - 0.5);

            progressText.textContent = v31nT('download.fetching', { n: hashesToFetch.length });
            progressFill.style.width = '20%';

            const fetchedChunks = await v31nFetchPack(BASE_URL + 'api/pack.php', hashesToFetch, new Set(realHashes), {
                progress(frac, resumed) {
                    progressFill.style.width = (20 + frac * 60) + '%';
                    progressText.textContent = v31nT(resumed ? 'download.resuming' : 'download.progress', { p: Math.round(frac * 100) });
                },
                waiting() {
                    progressText.textContent = v31nT('download.waiting');
                }
            });

            progressText.textContent = v31nT('download.assembling');
            progressFill.style.width = '90%';

            const file = await V31nCrypto.assembleFile(payload, fetchedChunks, (p) => {
                progressFill.style.width = (90 + p * 10) + '%';
            });

            if (file.files && file.files.length > 1) {
                let at = 0;
                showDir(file.files.map((f) => {
                    const bytes = file.data.subarray(at, at + f.size);
                    at += f.size;
                    return { filename: f.filename, mime: f.mime, bytes };
                }));
                return;
            }

            if (/\.v31np$/i.test(String(file.filename || ''))) {
                const unpacked = v31nUnpack(file.data);
                if (unpacked) {
                    showDir(unpacked);
                    return;
                }
            }

            const safe = v31nSafeMime(file.mime);
            const blobUrl = URL.createObjectURL(new Blob([file.data], { type: safe ? file.mime : 'application/octet-stream' }));
            if (safe) {
                window.location.href = blobUrl;
                return;
            }
            v31nSave(blobUrl, v31nBase(file.filename));
            progressFill.style.width = '100%';
            downloadBtn.disabled = false;
            return;

        } catch (err) {
            progressContainer.style.display = 'none';
            showError(err.message || v31nT('download.decrypt.failed'));
            downloadBtn.disabled = false;
        }
    }

    downloadBtn.addEventListener('click', () => {
        const password = passwordInput.value;
        if (!password || !password.trim()) {
            showError(v31nT('download.empty'));
            return;
        }
        decryptAndOpen(password);
    });

    v31nOnEnter(passwordInput, downloadBtn);

    const hash = window.location.hash;
    if (hash && hash.length > 1) {
        const password = decodeURIComponent(hash.substring(1));
        passwordInput.value = password;
        decryptAndOpen(password);
    }
}


const V31N_PI = new Uint8Array([0x24, 0x3F, 0x6A, 0x88, 0x85, 0xA3, 0x08, 0xD3, 0x13, 0x19, 0x8A, 0x2E]);
const V31N_PHI = new Uint8Array([0x9E, 0x37, 0x79, 0xB9, 0x7F, 0x4A, 0x7C, 0x15, 0xF3, 0x9C, 0xC0, 0x60]);
const V31N_MAGIC = new TextEncoder().encode('V31NSPACKFORMAT');
const V31N_ENTRY = 4112;
const V31N_RECORD = 32 + 12 + V31N_ENTRY;
const V31N_CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
    }
    return t;
})();


function v31nCrc(bytes, crc) {
    let c = ~crc;
    for (let i = 0; i < bytes.length; i++) c = V31N_CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (~c) >>> 0;
}


function v31nNumBytes(v) {
    const out = [];
    do {
        out.push(v % 256);
        v = Math.floor(v / 256);
    } while (v > 0);
    return new Uint8Array(out);
}


function v31nJoin(parts) {
    const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
    let at = 0;
    for (const p of parts) {
        out.set(p, at);
        at += p.length;
    }
    return out;
}


function v31nPackBlob(entries) {
    const enc = new TextEncoder();
    const head = v31nJoin([new Uint8Array([0]), V31N_PHI]);
    const datum = v31nJoin([new Uint8Array([1]), V31N_PHI]);
    const keys = entries.map(e => enc.encode(e.key));

    const t2 = v31nJoin(entries.flatMap((e, i) => [head, keys[i], datum, v31nNumBytes(e.bytes.length), datum, datum, keys[i], datum]));

    let header;
    let start = 0;
    let previous;
    do {
        previous = start;
        let address = previous;
        const t1 = v31nJoin(entries.flatMap((e, i) => {
            const row = [head, keys[i], datum, v31nNumBytes(address)];
            address += e.bytes.length;
            return row;
        }));
        header = v31nJoin([V31N_MAGIC, V31N_PI, t1, V31N_PI, t2, V31N_PI]);
        start = header.length;
    } while (start !== previous);

    let crc = v31nCrc(header, 0);
    entries.forEach((e) => {
        crc = v31nCrc(e.bytes, crc);
    });
    crc = v31nCrc(V31N_PI, crc);
    const foot = new Uint8Array([crc & 0xFF, (crc >>> 8) & 0xFF, (crc >>> 16) & 0xFF, (crc >>> 24) & 0xFF]);

    return new Blob([header, ...entries.map(e => e.bytes), V31N_PI, foot], { type: 'application/octet-stream' });
}


function v31nUnpack(buf) {
    const lead = V31N_MAGIC.length + V31N_PI.length;
    if (buf.length < lead + 16) return null;
    for (let i = 0; i < lead; i++) {
        if (buf[i] !== (i < V31N_MAGIC.length ? V31N_MAGIC[i] : V31N_PI[i - V31N_MAGIC.length])) return null;
    }
    const b = v31nIndexOf(buf, V31N_PI, lead);
    const c = b < 0 ? -1 : v31nIndexOf(buf, V31N_PI, b + V31N_PI.length);
    if (c < 0) return null;
    const headerLen = c + V31N_PI.length;
    const parsed = v31nParseHeader(buf.subarray(0, headerLen), null);
    if (!parsed || parsed.end + 16 !== buf.length) return null;
    const foot = buf.subarray(parsed.end);
    for (let i = 0; i < 12; i++) if (foot[i] !== V31N_PI[i]) return null;
    const crc = v31nCrc(V31N_PI, v31nCrc(buf.subarray(0, parsed.end), 0));
    if (crc !== ((foot[12] | (foot[13] << 8) | (foot[14] << 16) | (foot[15] << 24)) >>> 0)) return null;
    return parsed.entries.map(e => ({ filename: e.key, mime: v31nExtMime(e.key), bytes: buf.subarray(e.at, e.at + e.size) }));
}


const V31N_EXT_MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
    avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon',
    mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg',
    flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac',
    pdf: 'application/pdf'
};


function v31nExtMime(path) {
    const name = v31nBase(path);
    const dot = name.lastIndexOf('.');
    const ext = dot > 0 ? name.substring(dot + 1).toLowerCase() : '';
    return V31N_EXT_MIME[ext] || '';
}


function v31nExpand(list, prefix) {
    const out = [];
    list.forEach((f) => {
        const path = prefix + String(f.filename || '');
        if (/\.v31np$/i.test(path)) {
            const inner = v31nUnpack(f.bytes);
            if (inner) {
                out.push(...v31nExpand(inner, path + '/'));
                return;
            }
        }
        out.push({ filename: path, mime: f.mime, bytes: f.bytes });
    });
    return out;
}


function v31nIndexOf(buf, pat, from, limit) {
    const end = (limit === undefined ? buf.length : limit) - pat.length;
    outer:
    for (let i = Math.max(0, from); i <= end; i++) {
        for (let j = 0; j < pat.length; j++) {
            if (buf[i + j] !== pat[j]) continue outer;
        }
        return i;
    }
    return -1;
}


function v31nRows(buf) {
    const output = [];
    let row = null;
    let from = 0;
    for (;;) {
        const hit = v31nIndexOf(buf, V31N_PHI, from);
        const end = hit < 0 ? buf.length : hit - 1;
        if (row) row.push(buf.subarray(from, end));
        else if (end !== 0) return null;
        if (hit < 0) return output;
        if (hit < 1) return null;
        if (buf[hit - 1] === 0) output.push(row = []);
        else if (buf[hit - 1] !== 1 || !row) return null;
        from = hit + V31N_PHI.length;
    }
}


function v31nNum(b) {
    if (b.length === 0 || b.length > 7) return null;
    let n = 0;
    for (let i = b.length - 1; i >= 0; i--) n = n * 256 + b[i];
    return n < 4503599627370496 ? n : null;
}


function v31nParseHeader(head, keys) {
    const dec = new TextDecoder();
    const a = V31N_MAGIC.length + V31N_PI.length;
    const b = v31nIndexOf(head, V31N_PI, a);
    const c = b < 0 ? -1 : v31nIndexOf(head, V31N_PI, b + V31N_PI.length);
    if (c < 0) return null;
    const t1 = v31nRows(head.subarray(a, b));
    const t2 = v31nRows(head.subarray(b + V31N_PI.length, c));
    if (!t1 || !t2 || t1.length !== t2.length || (keys && t1.length !== keys.size)) return null;
    const sizes = new Map();
    for (const r of t2) {
        if (r.length !== 5) return null;
        const key = dec.decode(r[0]);
        const size = v31nNum(r[1]);
        if (size === null || sizes.has(key) || dec.decode(r[2]) + dec.decode(r[3]) + dec.decode(r[4]) !== key) return null;
        sizes.set(key, size);
    }
    const entries = [];
    let next = c + V31N_PI.length;
    for (const r of t1) {
        if (r.length !== 2) return null;
        const key = dec.decode(r[0]);
        const at = v31nNum(r[1]);
        if (at !== next || !sizes.has(key) || (keys && !keys.has(key))) return null;
        entries.push({ key, at, size: sizes.get(key) });
        next = at + sizes.get(key);
        sizes.delete(key);
    }
    return { entries, end: next };
}


async function v31nFetchPack(url, hashes, realSet, on) {
    const body = JSON.stringify({ hashes });
    const keys = new Set(hashes);
    const got = new Map();
    const fatal = () => Object.assign(new Error(v31nT('download.failed')), { fatal: true });
    let parsed = null;
    let total = 0;
    let idx = 0;
    let pos = 0;
    let crc = 0;
    let failures = 0;
    let crcRetries = 0;
    let delay = 1500;

    const reset = () => {
        got.clear();
        parsed = null;
        total = 0;
        idx = 0;
        pos = 0;
        crc = 0;
    };

    const backoff = async () => {
        failures++;
        if (failures >= 10) throw fatal();
        await v31nSleep(delay + Math.floor(Math.random() * 750));
        delay = Math.min(delay * 2, 30000);
    };

    const discard = async (resp) => {
        try { await resp.body.cancel(); } catch (e) {}
    };

    for (;;) {
        await v31nWaitForOnline();
        const resumed = pos > 0;
        const headers = { 'Content-Type': 'application/json' };
        if (resumed) headers['Range'] = 'bytes=' + pos + '-';

        let resp;
        try {
            resp = await fetch(url, { method: 'POST', headers, body });
        } catch (e) {
            await backoff();
            continue;
        }

        if (resp.status === 503) {
            await discard(resp);
            on.waiting();
            const ra = parseInt(resp.headers.get('Retry-After') || '0', 10);
            await v31nSleep((ra > 0 ? ra * 1000 : 5000) + Math.floor(Math.random() * 1500));
            continue;
        }

        let skip = 0;
        if (resp.status === 206) {
            const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(resp.headers.get('Content-Range') || '');
            if (!m || +m[1] !== pos || +m[3] !== total) {
                await discard(resp);
                await backoff();
                continue;
            }
        } else if (resp.status === 200) {
            skip = pos;
            const cl = parseInt(resp.headers.get('Content-Length') || '0', 10);
            if (cl > 0 && total && cl !== total) {
                await discard(resp);
                reset();
                await backoff();
                continue;
            }
            if (cl > 0) total = cl;
        } else {
            await discard(resp);
            if (resp.status === 429) {
                const ra = parseInt(resp.headers.get('Retry-After') || '0', 10);
                if (ra > 0) await v31nSleep(ra * 1000);
            }
            await backoff();
            continue;
        }

        const reader = resp.body.getReader();
        const startIdx = idx;
        let headBuf = new Uint8Array(0);
        let headFill = 0;
        let bAt = -1;
        let scan = V31N_MAGIC.length + V31N_PI.length;
        let cur = null;
        let curFill = 0;
        let foot = null;
        let footFill = 0;
        let done = false;

        const accept = async () => {
            const e = parsed.entries[idx];
            if (realSet.has(e.key)) {
                const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', cur.subarray(12)));
                if (V31nCrypto.bytesToHex(digest) !== e.key) return false;
                got.set(e.key, cur.subarray(12));
            }
            crc = v31nCrc(cur, crc);
            idx++;
            pos += e.size;
            cur = null;
            curFill = 0;
            return true;
        };

        const feedBody = async (chunk) => {
            let o = 0;
            while (o < chunk.length) {
                if (idx < parsed.entries.length) {
                    const e = parsed.entries[idx];
                    if (!cur) {
                        cur = new Uint8Array(e.size);
                        curFill = 0;
                    }
                    const take = Math.min(chunk.length - o, e.size - curFill);
                    cur.set(chunk.subarray(o, o + take), curFill);
                    curFill += take;
                    o += take;
                    if (curFill === e.size && !(await accept())) return false;
                } else {
                    if (!foot) {
                        foot = new Uint8Array(16);
                        footFill = 0;
                    }
                    const take = Math.min(chunk.length - o, 16 - footFill);
                    foot.set(chunk.subarray(o, o + take), footFill);
                    footFill += take;
                    o += take;
                    if (footFill === 16) {
                        done = true;
                        return true;
                    }
                }
            }
            return true;
        };

        try {
            for (;;) {
                const r = await reader.read();
                if (r.done) break;
                let chunk = r.value;
                if (skip > 0) {
                    const s = Math.min(skip, chunk.length);
                    chunk = chunk.subarray(s);
                    skip -= s;
                    if (!chunk.length) continue;
                }
                if (!parsed) {
                    if (headFill + chunk.length > headBuf.length) {
                        const grown = new Uint8Array(Math.max(headBuf.length * 2, headFill + chunk.length, 65536));
                        grown.set(headBuf.subarray(0, headFill));
                        headBuf = grown;
                    }
                    headBuf.set(chunk, headFill);
                    headFill += chunk.length;
                    const view = headBuf.subarray(0, headFill);
                    const lead = V31N_MAGIC.length + V31N_PI.length;
                    for (let i = 0; i < Math.min(headFill, lead); i++) {
                        const want = i < V31N_MAGIC.length ? V31N_MAGIC[i] : V31N_PI[i - V31N_MAGIC.length];
                        if (view[i] !== want) throw fatal();
                    }
                    if (bAt < 0) {
                        bAt = v31nIndexOf(view, V31N_PI, scan);
                        if (bAt < 0) {
                            scan = Math.max(lead, headFill - V31N_PI.length + 1);
                            continue;
                        }
                        scan = bAt + V31N_PI.length;
                    }
                    const cAt = v31nIndexOf(view, V31N_PI, scan);
                    if (cAt < 0) {
                        scan = Math.max(bAt + V31N_PI.length, headFill - V31N_PI.length + 1);
                        continue;
                    }
                    const headerLen = cAt + V31N_PI.length;
                    parsed = v31nParseHeader(view.subarray(0, headerLen), keys);
                    if (!parsed || (total && parsed.end !== total - 16)) throw fatal();
                    total = parsed.end + 16;
                    crc = v31nCrc(view.subarray(0, headerLen), 0);
                    pos = headerLen;
                    chunk = view.subarray(headerLen);
                }
                if (!(await feedBody(chunk))) break;
                on.progress((pos + curFill) / total, resumed);
                if (done) break;
            }
        } catch (e) {
            if (e && e.fatal) throw e;
        }

        try { await reader.cancel(); } catch (e) {}

        if (done) {
            let ok = v31nCrc(V31N_PI, crc) === ((foot[12] | (foot[13] << 8) | (foot[14] << 16) | (foot[15] << 24)) >>> 0);
            for (let i = 0; i < 12; i++) if (foot[i] !== V31N_PI[i]) ok = false;
            if (ok) return got;
            if (crcRetries >= 1) throw fatal();
            crcRetries++;
            reset();
            continue;
        }

        if (!parsed) pos = 0;
        if (idx > startIdx) {
            failures = 0;
            delay = 1500;
        }
        await backoff();
    }
}
