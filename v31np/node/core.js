const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const HOME = path.resolve(__dirname, '..');
const ROOT = path.dirname(HOME);
const LIB = path.join(HOME, 'lib');
const PRE = path.join(HOME, 'pre');
const LIMIT = 64 * 1024 * 1024;
const NAME = /^[A-Za-z0-9_-]+$/;
const INDEX_MAGIC = 'V31NBAIMITIF\0\0\0';
const INDEX_KEY = 'v31np index.txt';
const INDEX = path.join(ROOT, INDEX_KEY);
const HEAD_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const LEVELS = ['S', 'A', 'B', 'Ú', 'U', 'Ù'];
const SHIFT = 11644473600n;
const TICKS = 10000000n;

const readLib = f => fs.readFileSync(path.join(LIB, f), 'utf8');
const { V31nPack: P, V31nOrder: O } = vm.runInThisContext(
    '(function () {\nconst V31N_TABLES = ' + readLib('tables.json') + ';\n' + readLib('order.js') + '\n' + readLib('pack.js') + '\nreturn { V31nPack, V31nOrder };\n})'
)();

const types = {
    mp3: 'audio/mpeg', mp4: 'video/mp4', webm: 'video/webm', wav: 'audio/wav', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    svg: 'image/svg+xml', ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', css: 'text/css; charset=utf-8',
    js: 'text/javascript; charset=utf-8', json: 'application/json', txt: 'text/plain; charset=utf-8'
};
const typeOf = key => {
    const ext = path.posix.extname(key).slice(1).toLowerCase();
    return types[ext] || 'application/octet-stream';
};

const settings = name => {
    let all = {};
    try { all = JSON.parse(fs.readFileSync(path.join(HOME, 'settings.json'), 'utf8')); } catch {}
    if (!all || typeof all !== 'object') all = {};
    const own = all.archives && typeof all.archives[name] === 'object' && all.archives[name] ? all.archives[name] : {};
    const rest = { ...all };
    delete rest.archives;
    return { empty: '268', behind: '268', send: ['S'], sign: '', ...rest, ...own };
};

const unescapeText = s => {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        if (s[i] !== '\\') { out += s[i]; continue; }
        const e = { '\\': '\\', t: '\t', n: '\n', r: '\r' }[s[++i]];
        if (e === undefined) return null;
        out += e;
    }
    return out;
};
const escapeText = s => s.replace(/[\\\t\n\r]/g, c => ({ '\\': '\\\\', '\t': '\\t', '\n': '\\n', '\r': '\\r' })[c]);
const fileTime = st => (BigInt(Math.floor(st.mtimeMs / 1000)) + SHIFT) * TICKS;

const crcFile = async file => {
    const h = await fsp.open(file, 'r');
    try {
        const chunk = Buffer.alloc(1048576);
        let sum = 0, at = 0;
        for (;;) {
            const { bytesRead } = await h.read(chunk, 0, chunk.length, at);
            if (!bytesRead) break;
            sum = P.crc(chunk.subarray(0, bytesRead), sum);
            at += bytesRead;
        }
        return P.hex(sum);
    } finally {
        await h.close();
    }
};
const shaFile = async file => {
    const h = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(file)) h.update(chunk);
    return h.digest('hex').toUpperCase();
};
const shaOf = b => crypto.createHash('sha256').update(b).digest('hex').toUpperCase();

const seedOf = () => {
    const s = settings('').sign || '';
    if (!s) return null;
    const seed = fs.readFileSync(path.join(HOME, s), 'utf8').trim();
    if (!/^[0-9A-F]{64}$/.test(seed)) throw new Error('sign key');
    return seed;
};
const secretKey = () => {
    const seed = seedOf();
    if (!seed) return null;
    return crypto.createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seed, 'hex')]), format: 'der', type: 'pkcs8' });
};
const publicHex = secret => secret ? crypto.createPublicKey(secret).export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex').toUpperCase() : '';

const createIndex = (file, rootText) => ({ file, rootText, root: path.join(path.dirname(file), rootText), rows: new Map(), heads: [], dirty: true });
const loadIndex = file => {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
    let index = null, magic = false;
    for (const line of text.split(/\r?\n/)) {
        if (line === '') continue;
        if (!magic) {
            if (line !== INDEX_MAGIC) return null;
            magic = true;
            continue;
        }
        if (!index) {
            const root = unescapeText(line);
            if (!root) return null;
            index = createIndex(file, root);
            index.dirty = false;
            continue;
        }
        const f = line.split('\t');
        if (f[0] === 'I') {
            if (index.heads.length || f.length < 6 || f.length > 8) return null;
            const key = unescapeText(f[1]), p = unescapeText(f[4]);
            if (!key || !p || index.rows.has(key) || !/^\d+$/.test(f[2]) || !/^[0-9A-F]{8}$/.test(f[3]) || !/^\d+$/.test(f[5])) return null;
            let sha = null, level = null;
            for (const extra of f.slice(6)) {
                if (sha === null && level === null && /^[0-9A-F]{64}$/.test(extra)) sha = extra;
                else if (level === null && LEVELS.includes(extra)) level = extra;
                else return null;
            }
            index.rows.set(key, { size: Number(f[2]), crc: f[3], path: p, time: BigInt(f[5]), sha, level });
            continue;
        }
        if (f[0] === 'H' && f.length === 4) {
            const key = unescapeText(f[1]), n = unescapeText(f[2]), v = unescapeText(f[3]);
            if (key === null || !index.rows.has(key) || n === null || !HEAD_NAME.test(n) || v === null || /[\0\r\n]/.test(v)) return null;
            index.heads.push([key, n, v]);
            continue;
        }
        return null;
    }
    return index;
};
const freshRow = async (index, key, sha = false) => {
    const row = index.rows.get(key);
    if (!row) return null;
    const file = path.join(index.root, row.path);
    let st;
    try { st = await fsp.stat(file); } catch { return null; }
    if (!st.isFile()) return null;
    const time = fileTime(st);
    const changed = st.size !== row.size || time / TICKS !== row.time / TICKS;
    if (changed) {
        row.size = st.size;
        row.time = time;
        row.crc = await crcFile(file);
        index.dirty = true;
    }
    if (sha && (changed || !row.sha)) {
        row.sha = await shaFile(file);
        index.dirty = true;
    }
    return { ...row, file };
};
const headLines = (index, keys) => {
    let out = '';
    for (const key of keys) {
        for (const [k, n, v] of index.heads) {
            if (k === key) out += ['H', escapeText(key), escapeText(n), escapeText(v)].join('\t') + '\r\n';
        }
    }
    return out;
};
const saveIndex = async index => {
    if (!index.dirty) return true;
    const keys = [...index.rows.keys()].sort(O.key);
    let out = INDEX_MAGIC + '\r\n' + escapeText(index.rootText) + '\r\n';
    for (const key of keys) {
        const r = index.rows.get(key);
        const f = ['I', escapeText(key), r.size, r.crc, escapeText(r.path), r.time];
        if (r.sha) f.push(r.sha);
        if (r.level) f.push(r.level);
        out += f.join('\t') + '\r\n';
    }
    out += headLines(index, keys);
    const temp = index.file + '.' + crypto.randomBytes(16).toString('hex') + '.tmp';
    try {
        await fsp.writeFile(temp, out);
        await fsp.rename(temp, index.file);
    } catch {
        return false;
    }
    index.dirty = false;
    return true;
};
const indexEntry = (index, rows, secret) => {
    const keys = [...rows.keys()].sort(O.key);
    let out = INDEX_MAGIC + '\r\n';
    for (const key of keys) {
        const r = rows.get(key);
        const f = ['I', escapeText(key), r.size, r.crc];
        if (secret) f.push(r.sha);
        if (r.level) f.push(r.level);
        out += f.join('\t') + '\r\n';
    }
    out += headLines(index, keys);
    if (secret) out += 'S\t' + crypto.sign(null, Buffer.from(out), secret).toString('hex').toUpperCase() + '\r\n';
    return Buffer.from(out);
};

const end = (res, status, headers = {}, body) => {
    res.writeHead(status, headers);
    res.end(body);
};
const body = req => new Promise((resolve, reject) => {
    const parts = [];
    let n = 0;
    req.on('data', c => {
        n += c.length;
        if (n > LIMIT) { reject(new Error('large')); req.destroy(); return; }
        parts.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(parts)));
    req.on('error', reject);
});
const askOf = buf => {
    const outer = P.parse(P.MAGIC, buf);
    if (!outer || outer.entries.length !== 1 || outer.entries[0].key !== '') return null;
    const e = outer.entries[0];
    const inner = buf.subarray(e.at, e.at + e.size);
    const ask = P.parse(P.ASK, inner);
    if (!ask) return null;
    const client = new Map();
    for (const x of ask.entries) {
        const text = Buffer.from(inner.subarray(x.at, x.at + x.size)).toString('latin1');
        if (x.size !== 8 || !/^[0-9A-F]{8}$/.test(text)) return null;
        client.set(x.key, text);
    }
    return client;
};
const view = b => Buffer.from(b.buffer, b.byteOffset, b.length);

const ranges = (req, res, file, base, total, type, etag, heads = []) => {
    const headers = { 'Cache-Control': 'no-store', ETag: '"' + etag + '"' };
    const extra = heads.map(([n, v]) => [n, v]);
    const write = (status, h, reason) => {
        const all = { ...headers, ...h };
        const list = [...Object.entries(all), ...extra].flat().map(String);
        if (reason) res.writeHead(status, reason, list);
        else res.writeHead(status, list);
    };
    const pipe = (start, stop) => new Promise((ok, fail) => {
        const s = fs.createReadStream(file, { start: base + start, end: base + stop });
        s.on('end', ok);
        s.on('error', fail);
        s.pipe(res, { end: false });
    });
    const head = req.method === 'HEAD';
    const range = String(req.headers.range || '').trim();
    const ifRange = String(req.headers['if-range'] || '').trim();
    if (range === '' || (ifRange !== '' && ifRange !== '"' + etag + '"')) {
        write(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': total });
        if (head || total === 0) return res.end();
        return pipe(0, total - 1).then(() => res.end(), () => res.destroy());
    }
    if (!range.startsWith('bytes=')) { write(400, {}); return res.end(); }
    const parts = [];
    for (const spec of range.slice(6).split(',')) {
        const m = /^(\d*)-(\d*)$/.exec(spec.trim());
        if (!m || (m[1] === '' && m[2] === '')) { write(400, {}); return res.end(); }
        let start, stop;
        if (m[1] === '') { start = Math.max(0, total - Number(m[2])); stop = total - 1; }
        else { start = Number(m[1]); stop = m[2] === '' ? total - 1 : Math.min(Number(m[2]), total - 1); }
        if (start < total && start <= stop && (m[1] !== '' || Number(m[2]) > 0)) parts.push([start, stop]);
    }
    if (!parts.length) { write(416, { 'Content-Range': 'bytes */' + total }); return res.end(); }
    if (parts.length === 1) {
        const [start, stop] = parts[0];
        write(206, { 'Accept-Ranges': 'bytes', 'Content-Type': type, 'Content-Range': 'bytes ' + start + '-' + stop + '/' + total, 'Content-Length': stop - start + 1 });
        if (head) return res.end();
        return pipe(start, stop).then(() => res.end(), () => res.destroy());
    }
    const boundary = 'v31np-' + etag;
    const lines = parts.map(([start, stop]) => '--' + boundary + '\r\nContent-Type: ' + type + '\r\nContent-Range: bytes ' + start + '-' + stop + '/' + total + '\r\n\r\n');
    const closing = '--' + boundary + '--\r\n';
    const length = parts.reduce((n, [start, stop], i) => n + Buffer.byteLength(lines[i]) + (stop - start + 1) + 2, 0) + closing.length;
    write(206, { 'Accept-Ranges': 'bytes', 'Content-Type': 'multipart/byteranges; boundary=' + boundary, 'Content-Length': length });
    if (head) return res.end();
    return (async () => {
        for (let i = 0; i < parts.length; i++) {
            res.write(lines[i]);
            await pipe(parts[i][0], parts[i][1]);
            res.write('\r\n');
        }
        res.end(closing);
    })().catch(() => res.destroy());
};

const archive = name => {
    if (!NAME.test(name)) return null;
    const file = path.join(PRE, name + '.v31np');
    const meta = path.join(PRE, name + '.json');
    if (!fs.existsSync(file) || !fs.existsSync(meta)) return null;
    return { file, info: JSON.parse(fs.readFileSync(meta, 'utf8')) };
};
const indexBytes = a => {
    const f = a.info.files.find(x => x.key === INDEX_KEY);
    if (!f) return null;
    const fd = fs.openSync(a.file, 'r');
    const bytes = Buffer.alloc(f.size);
    try { fs.readSync(fd, bytes, 0, f.size, f.at); } finally { fs.closeSync(fd); }
    return bytes;
};

const exchange = async (req, res, name, query) => {
    const a = archive(name);
    const base = { 'Cache-Control': 'no-store' };
    if (!a) return end(res, 404, base);
    base.ETag = '"' + a.info.crc + '"';
    const set = settings(name);

    const member = query.get('key') || '';
    if (member !== '') {
        const entry = a.info.files.find(f => f.key === member);
        if (!entry || member === INDEX_KEY) return end(res, 404, base);
        if (req.method !== 'GET' && req.method !== 'HEAD') return end(res, 405, { ...base, Allow: 'GET, HEAD' });
        const heads = [];
        const ix = indexBytes(a);
        if (ix) {
            for (const line of ix.toString('utf8').split(/\r?\n/)) {
                const f = line.split('\t');
                if (f[0] === 'H' && f.length === 4 && unescapeText(f[1]) === member) heads.push([unescapeText(f[2]), unescapeText(f[3])]);
            }
        }
        return ranges(req, res, a.file, entry.at, entry.size, typeOf(member), entry.crc, heads);
    }
    if (req.method === 'GET' || req.method === 'HEAD') return ranges(req, res, a.file, 0, fs.statSync(a.file).size, 'application/v31np', a.info.crc);
    if (req.method !== 'POST') return end(res, 405, { ...base, Allow: 'GET, HEAD, POST' });
    if (String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/v31np') return end(res, 415, base);
    if (Number(req.headers['content-length'] || 0) > LIMIT) return end(res, 413, { ...base, Connection: 'close' });

    let client;
    try { client = askOf(await body(req)); } catch (e) { if (e && e.message === 'large') return end(res, 413, { ...base, Connection: 'close' }); client = null; }
    if (!client) return end(res, 422, base);

    const full = () => {
        const size = fs.statSync(a.file).size;
        res.writeHead(200, { ...base, 'Content-Type': 'application/v31np', 'Accept-Ranges': 'bytes', 'Content-Length': size });
        fs.createReadStream(a.file).pipe(res);
    };
    const list = () => {
        const bytes = indexBytes(a);
        if (!bytes) return end(res, 500, base);
        const answer = view(P.write(P.MAGIC, [{ key: INDEX_KEY, bytes }]).buf);
        res.writeHead(268, 'List', { ...base, 'Content-Type': 'application/v31np', 'Content-Length': answer.length });
        res.end(answer);
    };
    const server = new Map(a.info.files.map(f => [String(f.key), f]));
    if (client.size === 0) {
        if (set.empty === '268') return list();
        if (set.empty === '303') return end(res, 303, { ...base, Location: '/v31np/pre/' + name + '.v31np' });
        return full();
    }
    if (set.behind === '268') {
        const wanted = [...client.keys()].filter(k => client.get(k) === '00000000');
        if (wanted.length) {
            const own = server.get(INDEX_KEY);
            if (own && client.get(INDEX_KEY) !== own.crc && !wanted.includes(INDEX_KEY)) wanted.push(INDEX_KEY);
            wanted.sort(O.key);
            const items = wanted.map(key => ({ key, size: server.has(key) ? server.get(key).size + 1 : 1 }));
            const innerHead = P.head(P.PATCH, items);
            const innerLength = innerHead.length + items.reduce((n, x) => n + x.size, 0) + P.FOOT;
            const outerHead = P.head(P.MAGIC, [{ key: '', size: innerLength }]);
            res.writeHead(267, 'Re-sync', { ...base, 'Content-Type': 'application/v31np', 'Content-Length': outerHead.length + innerLength + P.FOOT });
            let outer = 0, inner = 0;
            const put = (b, both = true) => new Promise(resolve => {
                outer = P.crc(b, outer);
                if (both) inner = P.crc(b, inner);
                res.write(view(b)) ? resolve() : res.once('drain', resolve);
            });
            const word = v => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0, 0); return b; };
            await put(outerHead, false);
            await put(innerHead);
            const fd = await fsp.open(a.file, 'r');
            try {
                for (const key of wanted) {
                    const f = server.get(key);
                    if (!f) { await put(Buffer.from([1])); continue; }
                    let left = f.size, at = f.at;
                    while (left > 0) {
                        const chunk = Buffer.alloc(Math.min(1048576, left));
                        const { bytesRead } = await fd.read(chunk, 0, chunk.length, at);
                        if (!bytesRead) return res.destroy();
                        await put(chunk.subarray(0, bytesRead));
                        left -= bytesRead;
                        at += bytesRead;
                    }
                    await put(Buffer.from([0]));
                }
            } finally {
                await fd.close();
            }
            await put(P.PI);
            await put(word(inner), false);
            await put(P.PI, false);
            return res.end(word(outer));
        }
        const own = server.get(INDEX_KEY);
        if (own && client.get(INDEX_KEY) === own.crc) return end(res, 304, base);
        return list();
    }
    const changed = [...server.keys()].filter(k => client.get(k) !== server.get(k).crc);
    const deleted = [...client.keys()].filter(k => !server.has(k));
    if (!changed.length && !deleted.length) return end(res, 304, base);
    if (set.behind === '200') return full();
    const keys = [...changed, ...deleted].sort(O.key);
    const fd = await fsp.open(a.file, 'r');
    const entries = [];
    try {
        for (const key of keys) {
            const f = server.get(key);
            if (!f) { entries.push({ key, bytes: new Uint8Array([1]) }); continue; }
            const bytes = Buffer.alloc(f.size + 1);
            if (f.size > 0) await fd.read(bytes, 0, f.size, f.at);
            entries.push({ key, bytes });
        }
    } finally {
        await fd.close();
    }
    const answer = view(P.write(P.MAGIC, [{ key: '', bytes: P.write(P.PATCH, entries).buf }]).buf);
    res.writeHead(267, 'Re-sync', { ...base, 'Content-Type': 'application/v31np', 'Content-Length': answer.length });
    res.end(answer);
};

const sendAnswer = async (req, res, index, keys, page) => {
    const secret = secretKey();
    const rows = new Map();
    for (const key of keys) {
        if (key === '' || key === INDEX_KEY || rows.has(key)) continue;
        const r = await freshRow(index, key, !!secret);
        if (r) rows.set(key, r);
    }
    await saveIndex(index);
    const pageBytes = Buffer.from(page);
    const listed = new Map([['', { size: pageBytes.length, crc: P.hex(P.crc(pageBytes)), sha: shaOf(pageBytes) }], ...rows]);
    const mem = new Map([['', pageBytes], [INDEX_KEY, indexEntry(index, listed, secret)]]);
    const all = [...mem.keys(), ...rows.keys()].sort(O.key);
    const server = new Map(all.map(key => [key, mem.has(key)
        ? { size: mem.get(key).length, crc: P.hex(P.crc(mem.get(key))) }
        : { size: rows.get(key).size, crc: rows.get(key).crc }]));
    const items = all.map(key => ({ key, size: server.get(key).size }));
    const header = P.head(P.MAGIC, items);
    const length = header.length + items.reduce((n, x) => n + x.size, 0) + P.FOOT;
    let whole = P.crc(header);
    for (const key of all) whole = P.combine(whole, parseInt(server.get(key).crc, 16), server.get(key).size);
    whole = P.combine(whole, P.crc(P.PI), P.PI.length);
    const base = { 'Cache-Control': 'no-store', Vary: 'Accept, Content-Type', ETag: '"' + P.hex(whole) + '"' };

    if (req.method === 'POST') {
        let client;
        try { client = askOf(await body(req)); } catch { client = null; }
        if (!client) return end(res, 422, base);
        if (client.size) {
            const changed = all.filter(k => client.get(k) !== server.get(k).crc);
            const deleted = [...client.keys()].filter(k => !server.has(k));
            if (!changed.length && !deleted.length) return end(res, 304, base);
            const entries = [];
            for (const key of [...changed, ...deleted].sort(O.key)) {
                if (!server.has(key)) { entries.push({ key, bytes: new Uint8Array([1]) }); continue; }
                if (mem.has(key)) { entries.push({ key, bytes: Buffer.concat([mem.get(key), Buffer.from([0])]) }); continue; }
                const size = server.get(key).size;
                const bytes = Buffer.alloc(size + 1);
                const h = await fsp.open(rows.get(key).file, 'r');
                try {
                    const { bytesRead } = size > 0 ? await h.read(bytes, 0, size, 0) : { bytesRead: 0 };
                    if (bytesRead !== size) return end(res, 500, base);
                } finally {
                    await h.close();
                }
                entries.push({ key, bytes });
            }
            const answer = view(P.write(P.MAGIC, [{ key: '', bytes: P.write(P.PATCH, entries).buf }]).buf);
            res.writeHead(267, 'Re-sync', { ...base, 'Content-Type': 'application/v31np', 'Content-Length': answer.length });
            return res.end(answer);
        }
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
        return end(res, 405, { ...base, Allow: 'GET, HEAD, POST' });
    }

    res.writeHead(200, { ...base, 'Content-Type': 'application/v31np', 'Content-Length': length });
    if (req.method === 'HEAD') return res.end();
    const put = b => new Promise(resolve => res.write(b) ? resolve() : res.once('drain', resolve));
    let sum = P.crc(header);
    await put(view(header));
    for (const key of all) {
        if (mem.has(key)) {
            sum = P.crc(mem.get(key), sum);
            await put(mem.get(key));
            continue;
        }
        const r = rows.get(key);
        const h = await fsp.open(r.file, 'r');
        try {
            let left = r.size, at = 0;
            while (left > 0) {
                const chunk = Buffer.alloc(Math.min(1048576, left));
                const { bytesRead } = await h.read(chunk, 0, chunk.length, at);
                if (!bytesRead) return res.destroy();
                const part = chunk.subarray(0, bytesRead);
                sum = P.crc(part, sum);
                await put(part);
                left -= bytesRead;
                at += bytesRead;
            }
        } finally {
            await h.close();
        }
    }
    sum = P.crc(P.PI, sum);
    const tail = Buffer.alloc(P.FOOT);
    tail.set(P.PI);
    tail.writeUInt32LE(sum >>> 0, 12);
    res.end(tail);
};

module.exports = {
    P, O, HOME, ROOT, LIB, PRE, NAME, INDEX, INDEX_KEY, settings, readLib, secretKey, publicHex, createIndex, loadIndex, freshRow, saveIndex, indexEntry,
    crcFile, shaFile, fileTime, end, ranges, archive, exchange, sendAnswer
};
