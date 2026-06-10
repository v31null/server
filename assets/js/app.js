'use strict';

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
    const idx = path.toLowerCase().indexOf('/v/');
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
            showError('Un‑supporten characters.');
            return;
        }

        uploadBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Encrypting... 0%';
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
                progressFill.style.width = (progress * 100) + '%';
                progressText.textContent = 'Encrypting... ' + Math.round(progress * 100) + '%';
            });

            progressText.textContent = 'Checking for duplicates...';
            const hashes = result.chunks.map(c => c.hash);

            const statusResp = await fetch(BASE_URL + 'api/status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hashes })
            });

            if (!statusResp.ok) {
                throw new Error('Failed to check chunk status (HTTP ' + statusResp.status + ')');
            }

            const status = await statusResp.json();

            const newChunks = result.chunks.filter(c => status.missing.includes(c.hash));

            progressText.textContent = 'Uploading...';
            progressFill.style.width = '90%';

            const preparedChunks = newChunks.map(c => ({
                hash: c.hash,
                iv: V31nCrypto.bytesToBase64(c.iv),
                data: V31nCrypto.bytesToBase64(c.data)
            }));

            for (const dc of decoyChunks) {
                preparedChunks.push(dc);
            }

            preparedChunks.sort(() => Math.random() - 0.5);

            const uploadBody = {
                chunks: preparedChunks,
                encrypted_payload: V31nCrypto.bytesToBase64(result.encrypted_payload),
                payload_iv: V31nCrypto.bytesToBase64(result.payload_iv),
                salt: V31nCrypto.bytesToBase64(result.salt)
            };

            const uploadResp = await fetch(BASE_URL + 'upload.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadBody)
            });

            if (!uploadResp.ok) {
                throw new Error('Upload failed (HTTP ' + uploadResp.status + ')');
            }

            const uploadResult = await uploadResp.json();

            if (uploadResult.error) {
                throw new Error(uploadResult.error);
            }

            progressFill.style.width = '100%';
            progressText.textContent = 'Complete!';

            const origin = window.location.origin.replace('.com.pr', '.share.zrok.io');
            const baseUrl = origin + BASE_URL + 'v/' + uploadResult.id;
            
            const fileName = file.name || 'file.bin';
            const extIdx = fileName.lastIndexOf('.');
            const ext = extIdx !== -1 && extIdx < fileName.length - 1 ? fileName.substring(extIdx + 1) : 'bin';
            const embedUrl = origin + BASE_URL + 'embed/' + uploadResult.id + encodeURIComponent(password) + '.' + ext;

            resultLink.href = baseUrl;
            resultLink.textContent = baseUrl;
            
            resultEmbedLink.href = embedUrl;
            resultEmbedLink.textContent = embedUrl;
            resultEmbedLink.classList.add('blurred');
            resultEmbedLink.title = 'Click to reveal embed link';

            resultContainer.style.display = 'block';

        } catch (err) {
            showError(err.message || 'Upload failed');
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
            resultEmbedLink.title = 'Click to copy embed link';
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
        progressText.textContent = 'Requesting metadata...';
        hideError();

        try {
            const resp = await fetch(BASE_URL + 'download.php?id=' + encodeURIComponent(fileId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (resp.status === 404) throw Object.assign(new Error('File not found'), { realError: true });
            if (!resp.ok) throw Object.assign(new Error('Server error'), { realError: true });

            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            const encPayload = V31nCrypto.base64ToBytes(data.encrypted_payload);
            const payloadIv = V31nCrypto.base64ToBytes(data.payload_iv);
            const salt = V31nCrypto.base64ToBytes(data.salt);

            progressText.textContent = 'Authenticating password...';
            const permissive = await V31nCrypto.decryptPayloadPermissive(encPayload, payloadIv, password, salt);

            let hashesToFetch = [];
            let isCorrect = permissive.success;

            if (isCorrect) {
                const realMap = permissive.payload.map;
                const realHashes = realMap.map(m => m.id);
                const payloadDecoys = permissive.payload.decoys || [];

                hashesToFetch = [...realHashes, ...payloadDecoys].sort(() => Math.random() - 0.5);
            } else {
                const estimatedChunks = Math.max(1, Math.round((encPayload.length - 1516) / 180));
                
                const encoded = new TextEncoder().encode(password);
                const baseKey = await crypto.subtle.importKey(
                    'raw', encoded, 'PBKDF2', false, ['deriveBits']
                );
                const derivedBits = await crypto.subtle.deriveBits(
                    { name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' },
                    baseKey, estimatedChunks * 256
                );
                const keyMaterial = new Uint8Array(derivedBits);
                for (let i = 0; i < estimatedChunks; i++) {
                    hashesToFetch.push(V31nCrypto.bytesToHex(keyMaterial.slice(i * 32, (i + 1) * 32)));
                }
            }

            progressText.textContent = `Downloading ${hashesToFetch.length} encrypted chunks...`;
            progressFill.style.width = '20%';

            let loadedCount = 0;
            const chunkPromises = hashesToFetch.map(async (hash) => {
                const chunkResp = await fetch(BASE_URL + 'api/chunk.php?hash=' + encodeURIComponent(hash), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                if (!chunkResp.ok) throw new Error('Chunk download failed');
                const chunkJson = await chunkResp.json();
                
                loadedCount++;
                progressFill.style.width = (20 + (loadedCount / hashesToFetch.length) * 60) + '%';
                progressText.textContent = `Downloading chunks... ${Math.round((loadedCount / hashesToFetch.length) * 100)}%`;

                return {
                    hash,
                    iv: V31nCrypto.base64ToBytes(chunkJson.iv),
                    data: V31nCrypto.base64ToBytes(chunkJson.data)
                };
            });

            const fetchedChunks = await Promise.all(chunkPromises);

            progressText.textContent = 'Assembling file...';
            progressFill.style.width = '90%';

            const file = await V31nCrypto.decryptAndAssembleFile(
                encPayload, payloadIv, salt, fetchedChunks, password,
                (p) => {
                    progressFill.style.width = (90 + p * 10) + '%';
                }
            );

            const blob = new Blob([file.data], { type: file.mime });
            const blobUrl = URL.createObjectURL(blob);
            window.location.href = blobUrl;
            return;

        } catch (err) {
            progressContainer.style.display = 'none';
            showError(err.message || 'Decryption failed');
            downloadBtn.disabled = false;
        }
    }

    downloadBtn.addEventListener('click', () => {
        const password = passwordInput.value;
        if (!password || !password.trim()) {
            showError('Please enter a password.');
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
