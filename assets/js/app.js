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


function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KiB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MiB';
}


function v31nSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    const maxAttempts = cfg.maxAttempts || 10;
    const timeout = cfg.timeout || 120000;
    const maxDelay = 30000;
    let delay = cfg.baseDelay || 1500;
    let attempt = 0;
    let lastErr = null;

    while (attempt < maxAttempts) {
        attempt++;
        await v31nWaitForOnline();

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeout);
        try {
            const resp = await fetch(url, Object.assign({}, options, { signal: ctrl.signal }));
            clearTimeout(timer);

            if (resp.status === 429 || (resp.status >= 500 && resp.status < 600)) {
                if (attempt >= maxAttempts) return resp;
                const ra = parseInt(resp.headers.get('Retry-After') || '0', 10);
                const wait = (ra > 0 ? ra * 1000 : delay) + Math.floor(Math.random() * 750);
                await v31nSleep(wait);
                delay = Math.min(delay * 2, maxDelay);
                continue;
            }

            return resp;
        } catch (e) {
            clearTimeout(timer);
            lastErr = e;
            if (attempt >= maxAttempts) break;
            await v31nSleep(delay + Math.floor(Math.random() * 750));
            delay = Math.min(delay * 2, maxDelay);
        }
    }

    throw lastErr || new Error(v31nT('network.failed'));
}


function initUpload() {
    const BASE_URL = getBaseUrl();

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileInfo = document.getElementById('file-info');
    const passwordInput = document.getElementById('password-input');
    const uploadBtn = document.getElementById('upload-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultContainer = document.getElementById('result-container');
    const resultLink = document.getElementById('result-link');
    const resultEmbedLink = document.getElementById('result-embed-link');
    const copyFeedbackSecure = document.getElementById('copy-feedback-secure');
    const copyFeedbackEmbed = document.getElementById('copy-feedback-embed');
    const errorContainer = document.getElementById('error-container');
    const errorText = document.getElementById('error-text');

    let selectedFile = null;
    let fullUrlWithHash = '';

    function showError(msg) {
        errorText.textContent = msg;
        errorContainer.style.display = 'block';
    }

    function hideError() {
        errorContainer.style.display = 'none';
        errorText.textContent = '';
    }

    function updateButtonState() {
        const hasFile = selectedFile !== null;
        uploadBtn.disabled = !hasFile;
    }

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            selectedFile = fileInput.files[0];
            showFileInfo(selectedFile);
            updateButtonState();
        }
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
            selectedFile = e.dataTransfer.files[0];
            showFileInfo(selectedFile);
            updateButtonState();
        }
    });

    document.addEventListener('paste', (e) => {
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            selectedFile = e.clipboardData.files[0];
            showFileInfo(selectedFile);
            updateButtonState();
        }
    });

    function showFileInfo(file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'block';
    }

    passwordInput.addEventListener('input', () => {
        updateButtonState();
    });

    uploadBtn.addEventListener('click', async () => {
        const file = selectedFile;
        let password = passwordInput.value;

        if (!file) return;
        if (!password) {
            password = '1';
        }

        if (/[&#]/.test(password)) {
            showError(v31nT('upload.unsupported'));
            return;
        }

        uploadBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = v31nT('upload.encrypting.progress', { p: 0 });
        resultContainer.style.display = 'none';
        hideError();

        try {
            const baseDecoys = Math.floor(Math.random() * 21) + 10;
            const proportionalDecoys = Math.floor((file.size / 4096) * (0.1 + Math.random() * 0.2));
            const numPseudos = baseDecoys + proportionalDecoys;
            
            const decoyHashes = [];
            const decoyChunks = [];
            for (let p = 0; p < numPseudos; p++) {
                const dummyBytes = crypto.getRandomValues(new Uint8Array(32));
                const dummyHash = V31nCrypto.bytesToHex(dummyBytes);
                const dummySize = Math.random() < 0.95 ? 4112 : 16 + Math.floor(Math.random() * 4096);
                const dummyData = new Uint8Array(dummySize);
                crypto.getRandomValues(dummyData);
                const dummyIv = crypto.getRandomValues(new Uint8Array(12));
                decoyChunks.push({
                    hash: dummyHash,
                    iv: V31nCrypto.bytesToBase64(dummyIv),
                    data: V31nCrypto.bytesToBase64(dummyData)
                });
                decoyHashes.push(dummyHash);
            }

            const result = await V31nCrypto.chunkAndEncryptFile(file, password, decoyHashes, (progress) => {
                progressFill.style.width = (progress * 40) + '%';
                progressText.textContent = v31nT('upload.encrypting.progress', { p: Math.round(progress * 100) });
            });

            const STORE_BATCH = 40;

            progressText.textContent = v31nT('upload.checking');
            const realHashes = result.chunks.map(c => c.hash);

            const statusResp = await v31nFetchRetry(BASE_URL + 'api/status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hashes: realHashes })
            });

            if (!statusResp.ok) {
                throw new Error(v31nT('upload.check.failed', { status: statusResp.status }));
            }

            const status = await statusResp.json();
            const missingSet = new Set(status.missing);

            const realMissing = result.chunks
                .filter(c => missingSet.has(c.hash))
                .map(c => ({
                    hash: c.hash,
                    iv: V31nCrypto.bytesToBase64(c.iv),
                    data: V31nCrypto.bytesToBase64(c.data)
                }));

            const requiredHashes = realMissing.map(c => c.hash);

            let toUpload = realMissing.concat(decoyChunks);
            for (let i = toUpload.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = toUpload[i];
                toUpload[i] = toUpload[j];
                toUpload[j] = tmp;
            }

            const totalToStore = Math.max(1, toUpload.length);
            let storedSoFar = 0;
            progressText.textContent = v31nT('upload.uploading');

            let round = 0;
            while (true) {
                round++;

                for (let i = 0; i < toUpload.length; i += STORE_BATCH) {
                    const batch = toUpload.slice(i, i + STORE_BATCH);
                    try {
                        const r = await v31nFetchRetry(BASE_URL + 'upload.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chunks: batch })
                        });
                        if (!r.ok) throw new Error('store HTTP ' + r.status);
                        storedSoFar += batch.length;
                        const frac = Math.min(1, storedSoFar / totalToStore);
                        progressFill.style.width = (40 + frac * 45) + '%';
                        progressText.textContent = v31nT('upload.uploading.progress', { p: Math.round(frac * 100) });
                    } catch (e) {
                    }
                }

                if (!requiredHashes.length) break;

                const recheck = await v31nFetchRetry(BASE_URL + 'api/status.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hashes: requiredHashes })
                });
                const recheckJson = recheck.ok ? await recheck.json() : { missing: requiredHashes };
                const stillMissing = new Set(recheckJson.missing);
                const remainingReal = realMissing.filter(c => stillMissing.has(c.hash));

                if (!remainingReal.length) break;
                if (round >= 6) {
                    throw new Error(v31nT('upload.unstable'));
                }

                toUpload = remainingReal;
                await v31nSleep(2000 + Math.floor(Math.random() * 1500));
            }

            progressText.textContent = v31nT('upload.sealing');
            progressFill.style.width = '90%';

            const finalizeResp = await v31nFetchRetry(BASE_URL + 'upload.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encrypted_payload: V31nCrypto.bytesToBase64(result.encrypted_payload),
                    payload_iv: V31nCrypto.bytesToBase64(result.payload_iv),
                    salt: V31nCrypto.bytesToBase64(result.salt)
                })
            }, { maxAttempts: 12 });

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
            
            const fileName = file.name || 'file.bin';
            const extIdx = fileName.lastIndexOf('.');
            const ext = extIdx !== -1 && extIdx < fileName.length - 1 ? fileName.substring(extIdx + 1) : 'bin';
            const embedUrl = origin + BASE_URL + 'embed2/' + uploadResult.id + encodeURIComponent(password) + '.' + ext;

            resultLink.href = baseUrl;
            resultLink.textContent = baseUrl;
            
            resultEmbedLink.href = embedUrl;
            resultEmbedLink.textContent = embedUrl;
            resultEmbedLink.classList.add('blurred');
            resultEmbedLink.title = v31nT('upload.embed.reveal');

            resultContainer.style.display = 'block';

        } catch (err) {
            showError(err.message || v31nT('upload.failed'));
        } finally {
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


function initDownload() {
    const BASE_URL = getBaseUrl();

    const passwordInput = document.getElementById('download-password-input');
    const downloadBtn = document.getElementById('download-btn');
    const progressContainer = document.getElementById('download-progress-container');
    const progressFill = document.getElementById('download-progress-fill');
    const progressText = document.getElementById('download-progress-text');
    const errorContainer = document.getElementById('download-error');
    const errorText = document.getElementById('download-error-text');

    const fileId = window.V31N_FILE_ID;

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

            const blob = new Blob([file.data], { type: file.mime });
            const blobUrl = URL.createObjectURL(blob);
            window.location.href = blobUrl;
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
    if (!t1 || !t2 || t1.length !== t2.length || t1.length !== keys.size) return null;
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
        if (at !== next || !sizes.has(key) || !keys.has(key)) return null;
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
