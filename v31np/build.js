const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const core = require('./node/core.js');
const take = require('./node/take.js');
const { P, O, INDEX_KEY } = core;

const glob = pattern => {
    let out = '';
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (c === '*') out += '[^/]*';
        else if (c === '?') out += '[^/]';
        else if (c === '[') {
            const close = pattern.indexOf(']', i + 2);
            if (close < 0) { out += '\\['; continue; }
            let set = pattern.slice(i + 1, close);
            if (set[0] === '!') set = '^' + set.slice(1);
            out += '[' + set.replace(/\\/g, '\\\\') + ']';
            i = close;
        } else out += c.replace(/[.+^${}()|\\/]/g, '\\$&');
    }
    return new RegExp('^' + out + '$');
};

const walk = async (dir, rel, found) => {
    for (const e of await fsp.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        const key = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) await walk(full, key, found);
        else if (e.isFile() || (e.isSymbolicLink() && (await fsp.stat(full).catch(() => null))?.isFile())) found.push(key);
    }
};

(async () => {
    const name = process.argv[2] || '';
    const skip = process.argv.slice(3).map(glob);
    if (!core.NAME.test(name)) {
        process.stderr.write('usage: node v31np/build.js <name> [skip pattern ...]\n');
        process.exit(1);
    }
    const secret = core.secretKey();

    const js = 'const V31N_TABLES = ' + core.readLib('tables.json').trim() + ';\n'
        + "const V31N_KEY = (k => /^[0-9A-Fa-f]{64}$/.test(k) ? k.toUpperCase() : '" + core.publicHex(secret) + "')(String((document.currentScript && document.currentScript.dataset.key) || ''));\n"
        + ['sha256.js', 'order.js', 'pack.js', 'sync.js', 'show.js'].map(core.readLib).join('');
    const jsFile = path.join(core.HOME, 'v31np.js');
    const jsTemp = jsFile + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
    await fsp.writeFile(jsTemp, js);
    await fsp.rename(jsTemp, jsFile);

    let index = core.loadIndex(core.INDEX);
    if (!index) {
        if (fs.existsSync(core.INDEX)) {
            process.stderr.write('broken index\n');
            process.exit(1);
        }
        index = core.createIndex(core.INDEX, '.');
    }
    const types = take.types(core.settings(name));
    const rules = new Map();
    const ok = key => !(key === INDEX_KEY || key.startsWith('v31np/') || key.split('/').includes('node_modules') || !types.includes(path.posix.extname(key).slice(1).toLowerCase())
        || take.denied(index.root, key, rules) || skip.some(r => r.test(key)));
    const found = [];
    await walk(index.root, '', found);
    const seen = new Set();
    for (const rel of found) {
        if (!ok(rel)) continue;
        const key = '/' + rel;
        seen.add(key);
        if (!index.rows.has(key)) {
            index.rows.set(key, { size: -1, crc: '00000000', path: rel, time: 0n, sha: null, level: null });
            index.dirty = true;
        }
    }
    for (const key of [...index.rows.keys()]) {
        if (!seen.has(key)) {
            index.rows.delete(key);
            index.dirty = true;
        } else await core.freshRow(index, key, !!secret);
    }
    const kept = index.heads.filter(h => index.rows.has(h[0]));
    if (kept.length !== index.heads.length) {
        index.heads = kept;
        index.dirty = true;
    }
    if (!await core.saveIndex(index)) {
        process.stderr.write('index save failed\n');
        process.exit(1);
    }

    const rows = new Map();
    for (const key of index.rows.keys()) rows.set(key, await core.freshRow(index, key, !!secret));
    const entry = core.indexEntry(index, rows, secret);
    const keys = [...index.rows.keys(), INDEX_KEY].sort(O.key);
    const head = P.head(P.MAGIC, keys.map(key => ({ key, size: key === INDEX_KEY ? entry.length : rows.get(key).size })));

    await fsp.mkdir(core.PRE, { recursive: true });
    const target = path.join(core.PRE, name + '.v31np');
    const temp = target + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
    const out = await fsp.open(temp, 'w');
    let sum = 0;
    const put = async b => {
        sum = P.crc(b, sum);
        await out.write(Buffer.from(b.buffer, b.byteOffset, b.length));
    };
    const info = { files: [] };
    let at = head.length;
    await put(head);
    for (const key of keys) {
        let size, crc;
        if (key === INDEX_KEY) {
            await put(entry);
            size = entry.length;
            crc = P.hex(P.crc(entry));
        } else {
            const r = rows.get(key);
            size = r.size;
            crc = r.crc;
            const h = await fsp.open(r.file, 'r');
            try {
                let left = size, from = 0;
                while (left > 0) {
                    const chunk = Buffer.alloc(Math.min(4194304, left));
                    const { bytesRead } = await h.read(chunk, 0, chunk.length, from);
                    if (!bytesRead) throw new Error('read ' + key);
                    await put(chunk.subarray(0, bytesRead));
                    left -= bytesRead;
                    from += bytesRead;
                }
            } finally {
                await h.close();
            }
        }
        info.files.push({ key, at, size, crc });
        at += size;
    }
    await put(P.PI);
    const tail = Buffer.alloc(4);
    tail.writeUInt32LE(sum >>> 0, 0);
    await out.write(tail);
    await out.close();
    await fsp.rename(temp, target);
    const crcText = P.hex(sum);
    await fsp.writeFile(path.join(core.PRE, name + '.json'), JSON.stringify({ crc: crcText, ...info }, null, 4));
    console.log(name + '.v31np ' + (at + P.FOOT) + ' bytes, ' + keys.length + ' files, crc ' + crcText + (secret ? ', signed' : ''));
})().catch(e => {
    process.stderr.write(String(e && e.stack || e) + '\n');
    process.exit(1);
});
