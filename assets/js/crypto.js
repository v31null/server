

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

async function hashPassword(password) {
    const encoded = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return bytesToHex(new Uint8Array(digest));
}

async function deriveKeyFromPassword(password, salt) {
    const encoded = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoded,
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function deriveHmacKey(password, salt) {
    const encoded = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoded,
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'HMAC', hash: 'SHA-256', length: 256 },
        false,
        ['sign']
    );
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

async function encryptPayload(payloadObj, password, salt) {
    const plaintext = new TextEncoder().encode(JSON.stringify(payloadObj));
    const key = await deriveKeyFromPassword(password, salt);
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


async function chunkAndEncryptFile(file, password, decoyHashes, onProgress) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum 50 MiB.');
    }

    const salt = await generateSalt();

    const buffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(buffer);

    const totalChunks = Math.ceil(fileBytes.length / CHUNK_SIZE) || 1;
    const chunks = [];
    const map = [];
    const hmacKey = await deriveHmacKey(password, salt);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBytes.length);
        const chunkBytes = fileBytes.slice(start, end);

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
    const targetSize = totalCombinedChunks * 180 + 1500;
    const currentSize = new TextEncoder().encode(JSON.stringify(payload)).length;
    
    if (targetSize > currentSize) {
        payload.padding = 'A'.repeat(targetSize - currentSize);
    }

    const { iv: payload_iv, data: encrypted_payload } = await encryptPayload(payload, password, salt);

    const password_hash = await hashPassword(password);

    if (onProgress) {
        onProgress(0.85);
    }

    return { salt, encrypted_payload, payload_iv, password_hash, chunks };
}

async function decryptAndAssembleFile(encryptedPayload, payloadIv, salt, chunks, password, onProgress) {
    const permissive = await decryptPayloadPermissive(encryptedPayload, payloadIv, password, salt);

    if (permissive.success) {
        const { map, filename, mime, size } = permissive.payload;
        const decryptedParts = [];
        for (let i = 0; i < map.length; i++) {
            const item = map[i];
            const chunk = chunks.find(c => c.hash === item.id);
            if (!chunk) {
                throw new Error(`Missing chunk: ${item.id}`);
            }
            const plaintext = await decryptChunk(chunk.data, item.key);
            decryptedParts.push(plaintext);
            if (onProgress) {
                onProgress((i + 1) / map.length);
            }
        }
        const totalLength = decryptedParts.reduce((sum, part) => sum + part.length, 0);
        const data = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of decryptedParts) {
            data.set(part, offset);
            offset += part.length;
        }
        return { data, filename, mime, size, success: true };
    } else {
        const totalChunks = chunks.length;
        const encoded = new TextEncoder().encode(password);
        const baseKey = await crypto.subtle.importKey(
            'raw', encoded, 'PBKDF2', false, ['deriveBits']
        );
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 1000,
                hash: 'SHA-256'
            },
            baseKey,
            totalChunks * 256
        );
        const keyMaterial = new Uint8Array(derivedBits);

        const decryptedParts = [];
        for (let i = 0; i < totalChunks; i++) {
            const chunk = chunks[i];
            const chunkKeyBytes = keyMaterial.slice(i * 32, (i + 1) * 32);

            const ciphertext = chunk.data.slice(0, chunk.data.length - 16);
            const counter = new Uint8Array(16);
            counter.set(chunk.iv);
            counter[15] = 2;

            const ctrKey = await crypto.subtle.importKey(
                'raw', chunkKeyBytes, { name: 'AES-CTR' }, false, ['decrypt']
            );
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-CTR', counter, length: 32 },
                ctrKey,
                ciphertext
            );
            decryptedParts.push(new Uint8Array(decrypted));

            if (onProgress) {
                onProgress((i + 1) / totalChunks);
            }
        }

        const totalLength = decryptedParts.reduce((sum, part) => sum + part.length, 0);
        const data = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of decryptedParts) {
            data.set(part, offset);
            offset += part.length;
        }

        const pwHash = await hashPassword(password);
        const garbageTypes = [
            { ext: 'txt',  mime: 'text/plain' },
            { ext: 'png',  mime: 'image/png' },
            { ext: 'jpg',  mime: 'image/jpeg' },
            { ext: 'pdf',  mime: 'application/pdf' },
            { ext: 'mp3',  mime: 'audio/mpeg' },
            { ext: 'mp4',  mime: 'video/mp4' },
            { ext: 'zip',  mime: 'application/zip' }
        ];
        const hashInt = parseInt(pwHash.substring(0, 8), 16);
        const pick = garbageTypes[hashInt % garbageTypes.length];
        const filename = `decrypted_${pwHash.substring(0, 8)}.${pick.ext}`;

        return { data, filename, mime: pick.mime, size: totalLength, success: false };
    }
}


async function decryptPayloadPermissive(encryptedData, iv, password, salt) {
    try {
        const payload = await decryptPayload(encryptedData, iv, password, salt);
        return { success: true, payload };
    } catch (e) {
        const encoded = new TextEncoder().encode(password);
        const baseKey = await crypto.subtle.importKey(
            'raw', encoded, 'PBKDF2', false, ['deriveBits']
        );
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
            baseKey, 256
        );

        const ctrKey = await crypto.subtle.importKey(
            'raw', bits, { name: 'AES-CTR' }, false, ['decrypt']
        );

        const ciphertext = encryptedData.slice(0, encryptedData.length - 16);

        const counter = new Uint8Array(16);
        counter.set(iv);
        counter[15] = 2;

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CTR', counter, length: 32 },
            ctrKey,
            ciphertext
        );

        return { success: false, rawBytes: new Uint8Array(decrypted) };
    }
}


window.V31nCrypto = {
    generateSalt,
    hashPassword,
    deriveKeyFromPassword,
    deriveHmacKey,
    hashChunk,
    deriveKeyFromHash,
    encryptChunk,
    decryptChunk,
    encryptPayload,
    decryptPayload,
    decryptPayloadPermissive,
    chunkAndEncryptFile,
    decryptAndAssembleFile,

    bytesToBase64,
    base64ToBytes,
    bytesToHex,
    hexToBytes,

    CHUNK_SIZE,
    MAX_FILE_SIZE,
    PBKDF2_ITERATIONS
};
