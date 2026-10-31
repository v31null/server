

const CHUNK_SIZE = 4096;
const PBKDF2_ITERATIONS = 600000;
const MAX_FILE_SIZE = 50 * 1024 * 1024;


function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}

function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function concatBytes(a, b) {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
}


async function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(32));
}

async function deriveMasterKey(password, salt) {
    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    return new Uint8Array(await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        256
    ));
}

function importAesKey(master) {
    return crypto.subtle.importKey('raw', master, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function importHmacKey(master) {
    return crypto.subtle.importKey('raw', master, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function deriveKeyFromPassword(password, salt) {
    return importAesKey(await deriveMasterKey(password, salt));
}

async function deriveHmacKey(password, salt) {
    return importHmacKey(await deriveMasterKey(password, salt));
}

async function hashChunk(chunkBytes, hmacKey) {
    const signature = await crypto.subtle.sign('HMAC', hmacKey, chunkBytes);
    return bytesToHex(new Uint8Array(signature));
}

async function deriveKeyFromHash(hashHex) {
    return crypto.subtle.importKey(
        'raw',
        hexToBytes(hashHex),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptChunk(chunkBytes, baseHashHex) {
    const baseHashBytes = hexToBytes(baseHashHex);
    const iv = baseHashBytes.slice(0, 12);
    const key = await crypto.subtle.importKey(
        'raw',
        baseHashBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        chunkBytes
    );
    const data = new Uint8Array(encrypted);
    const idBuffer = await crypto.subtle.digest('SHA-256', data);
    const chunkId = bytesToHex(new Uint8Array(idBuffer));
    return { iv, data, chunkId };
}

async function decryptChunk(encryptedData, baseHashHex) {
    const baseHashBytes = hexToBytes(baseHashHex);
    const iv = baseHashBytes.slice(0, 12);
    const key = await crypto.subtle.importKey(
        'raw',
        baseHashBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );
    return new Uint8Array(decrypted);
}

async function encryptPayload(payloadObj, password, salt, aesKey) {
    const plaintext = new TextEncoder().encode(JSON.stringify(payloadObj));
    const key = aesKey || await deriveKeyFromPassword(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
    );
    return { iv, data: new Uint8Array(encrypted) };
}

async function decryptPayload(encryptedData, iv, password, salt) {
    const key = await deriveKeyFromPassword(password, salt);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );
    const json = new TextDecoder().decode(decrypted);
    return JSON.parse(json);
}


function padme(n) {
    const e = 31 - Math.clz32(n);
    const s = 32 - Math.clz32(e);
    const step = 2 ** Math.max(0, e - s);
    return Math.ceil(n / step) * step;
}

async function chunkAndEncryptFile(file, password, decoyHashes, onProgress) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(window.v31nT('upload.too.large'));
    }

    const salt = await generateSalt();

    const fileBytes = new Uint8Array(await file.arrayBuffer());

    const totalChunks = Math.ceil(fileBytes.length / CHUNK_SIZE) || 1;
    const chunks = [];
    const map = [];
    const master = await deriveMasterKey(password, salt);
    const hmacKey = await importHmacKey(master);
    const aesKey = await importAesKey(master);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBytes.length);
        const chunkBytes = new Uint8Array(CHUNK_SIZE);
        chunkBytes.set(fileBytes.subarray(start, end));

        const baseHash = await hashChunk(chunkBytes, hmacKey);

        const enc = await encryptChunk(chunkBytes, baseHash);

        chunks.push({ hash: enc.chunkId, iv: enc.iv, data: enc.data });
        map.push({ id: enc.chunkId, key: baseHash });

        if (onProgress) {
            onProgress(((i + 1) / totalChunks) * 0.8);
        }
    }

    const payload = {
        map,
        decoys: decoyHashes || [],
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        padding: ""
    };

    const totalCombinedChunks = map.length + (decoyHashes ? decoyHashes.length : 0);
    const currentSize = new TextEncoder().encode(JSON.stringify(payload)).length;
    let targetSize = totalCombinedChunks * 180 + 1500;
    if (currentSize > targetSize) {
        targetSize = padme(currentSize);
    }

    if (targetSize > currentSize) {
        payload.padding = 'A'.repeat(targetSize - currentSize);
    }

    const { iv: payload_iv, data: encrypted_payload } = await encryptPayload(payload, password, salt, aesKey);

    if (onProgress) {
        onProgress(0.85);
    }

    return { salt, encrypted_payload, payload_iv, chunks };
}

async function assembleFile(payload, chunks, onProgress) {
    const { map, filename, mime, size } = payload;
    const parts = [];
    let totalLength = 0;
    for (let i = 0; i < map.length; i++) {
        const item = map[i];
        const data = chunks.get(item.id);
        if (!data) {
            throw new Error(window.v31nT('download.missing', { id: item.id }));
        }
        const plaintext = await decryptChunk(data, item.key);
        parts.push(plaintext);
        totalLength += plaintext.length;
        if (onProgress) {
            onProgress((i + 1) / map.length);
        }
    }
    const data = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
        data.set(part, offset);
        offset += part.length;
    }
    return { data: data.subarray(0, Math.min(size, totalLength)), filename, mime, size };
}


window.V31nCrypto = {
    generateSalt,
    deriveKeyFromPassword,
    deriveHmacKey,
    hashChunk,
    deriveKeyFromHash,
    encryptChunk,
    decryptChunk,
    encryptPayload,
    decryptPayload,
    chunkAndEncryptFile,
    assembleFile,
    padme,

    bytesToBase64,
    base64ToBytes,
    bytesToHex,
    hexToBytes,

    CHUNK_SIZE,
    MAX_FILE_SIZE,
    PBKDF2_ITERATIONS
};
