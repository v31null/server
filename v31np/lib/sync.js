const V31nSync = (() => {
    const CHUNK = 4194304;
    const INDEX = 'V31NBAIMITIF\0\0\0';
    const INDEX_KEY = 'v31np index.txt';
    const LEVELS = ['S', 'A', 'B', '\u00DA', 'U', '\u00D9'];
    const request = r => new Promise((ok, fail) => { r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error); });
    const done = t => new Promise((ok, fail) => { t.oncomplete = () => ok(); t.onerror = () => fail(t.error); t.onabort = () => fail(t.error); });
    let opened = null;
    const db = () => opened || (opened = new Promise((ok, fail) => {
        const r = indexedDB.open('v31np', 3);
        r.onupgradeneeded = e => {
            const d = r.result;
            if (e.oldVersion < 3) {
                for (const name of ['files', 'archives']) if (d.objectStoreNames.contains(name)) d.deleteObjectStore(name);
            }
            for (const [name, keyPath] of [['files', ['name', 'key']], ['parts', ['id', 'n']], ['archives', 'name'], ['queries', ['name', 'key']], ['log', 'id']]) {
                if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, name === 'log' ? { keyPath, autoIncrement: true } : { keyPath });
            }
        };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => fail(r.error);
    }));
    const range = name => IDBKeyRange.bound([name], [name, []]);
    const idRange = id => IDBKeyRange.bound([id], [id, []]);
    const byKey = (a, b) => V31nOrder.key(a.key, b.key);
    const tx = async (stores, mode) => (await db()).transaction(stores, mode);
    const want = () => !!V31N_KEY;

    const held = async name => (await request((await tx('files', 'readonly')).objectStore('files').getAll(range(name)))).sort(byKey);
    const archive = async name => request((await tx('archives', 'readonly')).objectStore('archives').get(name));
    const file = async (name, key) => request((await tx('files', 'readonly')).objectStore('files').get([name, key]));
    const heads = async (name, key) => {
        const a = await archive(name);
        return a && a.heads && a.heads[key] ? a.heads[key] : [];
    };

    const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
    const putPart = async (id, n, blob) => {
        const t = await tx('parts', 'readwrite');
        t.objectStore('parts').put({ id, n, blob });
        await done(t);
    };
    const dropParts = async ids => {
        if (!ids.length) return;
        const t = await tx('parts', 'readwrite');
        const store = t.objectStore('parts');
        for (const id of ids) store.delete(idRange(id));
        await done(t);
    };
    const partsOf = async meta => {
        if (!meta.parts) return [];
        const all = await request((await tx('parts', 'readonly')).objectStore('parts').getAll(idRange(meta.id)));
        return all.sort((a, b) => a.n - b.n).map(p => p.blob);
    };
    const blob = async (meta, type) => new Blob(await partsOf(meta), type ? { type } : undefined);
    const slice = async (meta, start, end, type) => {
        const first = Math.floor(start / CHUNK), last = Math.floor(end / CHUNK);
        const store = (await tx('parts', 'readonly')).objectStore('parts');
        const asks = [];
        for (let n = first; n <= last; n++) asks.push(request(store.get([meta.id, n])));
        const got = await Promise.all(asks);
        const out = got.map((p, i) => {
            const base = (first + i) * CHUNK;
            return p.blob.slice(Math.max(0, start - base), Math.min(p.blob.size, end + 1 - base));
        });
        return new Blob(out, type ? { type } : undefined);
    };
    const bytesOf = async meta => new Uint8Array(await (await blob(meta)).arrayBuffer());

    const sink = () => {
        const id = newId();
        const sha = want() ? V31nSha256.create() : null;
        let n = 0, size = 0, crc = 0, buf = [], fill = 0;
        const flush = async () => {
            if (!fill) return;
            await putPart(id, n++, new Blob(buf));
            buf = [];
            fill = 0;
        };
        return {
            id,
            push: async data => {
                crc = V31nPack.crc(data, crc);
                if (sha) sha.update(data);
                size += data.length;
                let off = 0;
                while (off < data.length) {
                    const take = Math.min(CHUNK - fill, data.length - off);
                    buf.push(data.slice(off, off + take));
                    fill += take;
                    off += take;
                    if (fill === CHUNK) await flush();
                }
            },
            end: async () => {
                await flush();
                return { id, parts: n, size, crc: V31nPack.hex(crc), sha: sha ? sha.hex() : null };
            }
        };
    };
    const store = async (key, bytes) => {
        const s = sink();
        await s.push(bytes);
        return { key, ...(await s.end()) };
    };

    const strict = new TextDecoder('utf-8', { fatal: true });
    const isIndex = b => b.length >= 15 && [...INDEX].every((c, i) => b[i] === c.charCodeAt(0));
    const unescape = s => {
        let out = '';
        for (let i = 0; i < s.length; i++) {
            if (s[i] !== '\\') { out += s[i]; continue; }
            const e = { '\\': '\\', t: '\t', n: '\n', r: '\r' }[s[++i]];
            if (e === undefined) return null;
            out += e;
        }
        return out;
    };
    const readIndex = bytes => {
        if (!bytes || !isIndex(bytes)) return null;
        let text;
        try { text = strict.decode(bytes); } catch { return null; }
        const rows = new Map(), heads = {};
        let sig = null, signedTo = 0, at = 0, first = true;
        for (const raw of text.split('\n')) {
            const start = at;
            at += raw.length + 1;
            const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
            if (line === '') continue;
            if (first) { if (line !== INDEX) return null; first = false; continue; }
            if (sig !== null) return null;
            const f = line.split('\t');
            if (f[0] === 'I' && f.length >= 4 && f.length <= 6 && !Object.keys(heads).length) {
                const key = unescape(f[1]);
                if (key === null || rows.has(key) || !/^\d+$/.test(f[2]) || !/^[0-9A-F]{8}$/.test(f[3])) return null;
                let sha = null, level = null;
                for (const extra of f.slice(4)) {
                    if (sha === null && level === null && /^[0-9A-F]{64}$/.test(extra)) sha = extra;
                    else if (level === null && LEVELS.includes(extra)) level = extra;
                    else return null;
                }
                rows.set(key, { size: Number(f[2]), crc: f[3], sha, level: level || '\u00D9' });
            } else if (f[0] === 'H' && f.length === 4) {
                const key = unescape(f[1]), n = unescape(f[2]), v = unescape(f[3]);
                if (key === null || !rows.has(key) || !n || !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(n) || v === null || /[\0\r\n]/.test(v)) return null;
                (heads[key] = heads[key] || []).push([n, v]);
            } else if (f[0] === 'S' && f.length === 2 && /^[0-9A-F]{128}$/.test(f[1])) {
                sig = f[1];
                signedTo = start;
            } else return null;
        }
        return { rows, heads, sig, signed: sig ? new TextEncoder().encode(text.slice(0, signedTo)) : null };
    };
    const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));
    const signedBy = async ix => {
        if (!V31N_KEY) return true;
        if (!ix || !ix.sig) return false;
        try {
            const pub = await crypto.subtle.importKey('raw', unhex(V31N_KEY), { name: 'Ed25519' }, false, ['verify']);
            return await crypto.subtle.verify({ name: 'Ed25519' }, pub, unhex(ix.sig), ix.signed);
        } catch {
            return false;
        }
    };
    const fit = key => key === '' || key === INDEX_KEY || (key.startsWith('/') && !key.split('/').some(s => s === '.' || s === '..'));
    const matches = (row, m) => !!row && row.size === m.size && row.crc === m.crc && (!V31N_KEY || (!!row.sha && row.sha === m.sha));
    const checkWhole = async (metas, ix) => {
        if (!V31N_KEY) return true;
        if (!await signedBy(ix)) return false;
        const others = metas.filter(m => m.key !== INDEX_KEY);
        return others.length === [...ix.rows.keys()].filter(fit).length && others.every(m => matches(ix.rows.get(m.key), m));
    };
    const archiveSum = metas => {
        const header = V31nPack.head(V31nPack.MAGIC, metas.map(m => ({ key: m.key, size: m.size })));
        let sum = V31nPack.crc(header);
        for (const m of metas) sum = V31nPack.combine(sum, parseInt(m.crc, 16), m.size);
        return V31nPack.hex(V31nPack.combine(sum, V31nPack.crc(V31nPack.PI), V31nPack.MARK));
    };

    const streamFull = async response => {
        const reader = response.body.getReader();
        let pending = new Uint8Array(0);
        const pull = async () => {
            const r = await reader.read();
            if (r.done) return false;
            pending = pending.length ? V31nPack.join([pending, r.value]) : r.value;
            return true;
        };
        const made = [];
        const fail = async error => {
            try { await reader.cancel(); } catch {}
            await dropParts(made);
            return { error };
        };
        let head;
        for (;;) {
            head = V31nPack.headOf(V31nPack.MAGIC, pending);
            if (head !== 'more') break;
            if (!await pull()) return fail('short header');
        }
        if (!head) return fail('broken header');
        let sum = V31nPack.crc(pending.subarray(0, head.length));
        pending = pending.subarray(head.length);
        const metas = [];
        let indexBytes = null;
        for (const e of head.entries) {
            const s = fit(e.key) ? sink() : null;
            if (s) made.push(s.id);
            const keep = e.key === INDEX_KEY ? [] : null;
            let left = e.size;
            while (left > 0) {
                if (!pending.length && !await pull()) return fail('short');
                const take = pending.subarray(0, Math.min(left, pending.length));
                if (s) await s.push(take);
                sum = V31nPack.crc(take, sum);
                if (keep) keep.push(take.slice());
                pending = pending.subarray(take.length);
                left -= take.length;
            }
            if (s) metas.push({ key: e.key, ...(await s.end()) });
            if (keep) indexBytes = V31nPack.join(keep);
        }
        while (pending.length < V31nPack.FOOT) if (!await pull()) return fail('short footer');
        for (let k = 0; k < V31nPack.MARK; k++) if (pending[k] !== V31nPack.PI[k]) return fail('broken footer');
        sum = V31nPack.crc(pending.subarray(0, V31nPack.MARK), sum);
        const stated = new DataView(pending.buffer, pending.byteOffset + V31nPack.MARK, 4).getUint32(0, true);
        if (pending.length > V31nPack.FOOT || await pull()) return fail('trailing bytes');
        if (sum !== stated) return fail('crc');
        return { metas, ix: readIndex(indexBytes), crc: V31nPack.hex(sum), ids: made };
    };

    const commit = async (name, put, remove, record) => {
        const t = await tx(['files', 'archives'], 'readwrite');
        const files = t.objectStore('files');
        for (const key of remove) files.delete([name, key]);
        for (const m of put) files.put({ name, ...m });
        if (record) t.objectStore('archives').put({ name, ...record });
        await done(t);
    };

    const listOf = (ix, indexSize) => {
        const keys = [...ix.rows.keys(), INDEX_KEY].sort(V31nOrder.key);
        const items = keys.map(key => ({ key, size: key === INDEX_KEY ? indexSize : ix.rows.get(key).size }));
        let at = V31nPack.head(V31nPack.MAGIC, items).length;
        const list = {};
        for (const it of items) {
            list[it.key] = [at, it.size];
            at += it.size;
        }
        return list;
    };

    const etag = r => (r.headers.get('etag') || '').replace(/"/g, '') || null;

    const run = async (name, why, url = '/' + name + '.v31np', wanted = []) => {
        const log = { name, why, steps: [] };
        const step = (what, r, bytes) => log.steps.push({ what, status: r.status, redirected: r.redirected, etag: etag(r), bytes });
        const old = await held(name);

        const whole = async (r, again) => {
            const got = await streamFull(r);
            step(again ? 'full after failed check' : 'full', r, got.error ? null : got.metas.reduce((n, m) => n + m.size, 0));
            if (got.error) { log.result = 'broken full file: ' + got.error; return; }
            const tag = etag(r);
            if (tag && !r.redirected && tag !== got.crc) {
                await dropParts(got.ids);
                log.result = 'etag differs from full file';
                return;
            }
            if (!await checkWhole(got.metas, got.ix)) {
                await dropParts(got.ids);
                if (again) { log.result = 'refused, check failed'; return; }
                return whole(await fetch(url, { headers: { Accept: 'application/v31np' }, cache: 'no-store' }), true);
            }
            await commit(name, got.metas, old.map(m => m.key), { crc: got.crc, heads: got.ix ? got.ix.heads : {}, mode: 'full', url });
            await dropParts(old.map(m => m.id));
            log.result = 'stored ' + got.metas.length + ' files, crc ' + got.crc;
        };

        const listed = async (bytes, tag) => {
            const ix = readIndex(bytes);
            if (!ix) return null;
            const rows = [...ix.rows.keys(), INDEX_KEY].sort(V31nOrder.key).map(key => key === INDEX_KEY
                ? { key, size: bytes.length, crc: V31nPack.hex(V31nPack.crc(bytes)) }
                : { key, size: ix.rows.get(key).size, crc: ix.rows.get(key).crc });
            if (tag !== archiveSum(rows) || !await signedBy(ix)) return null;
            return { ix, list: listOf(ix, bytes.length) };
        };

        const asked = new Map(old.map(f => [f.key, f.crc]));
        for (const key of wanted) if (!asked.has(key)) asked.set(key, '00000000');
        const ask = V31nPack.write(V31nPack.ASK, [...asked].sort((x, y) => V31nOrder.key(x[0], y[0])).map(([key, crc]) => ({ key, bytes: V31nPack.bytes(crc) })));
        const body = V31nPack.write(V31nPack.MAGIC, [{ key: '', bytes: ask.buf }]);
        log.sent = body.buf.length;
        if (wanted.length) log.wanted = wanted.length;
        const before = await archive(name);
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/v31np' }, body: body.buf, cache: 'no-store' });

        if (r.status === 200) await whole(r, false);
        else if (r.status === 304) { step('sync', r, 0); log.result = 'in sync'; }
        else if (r.status === 268) {
            const buf = new Uint8Array(await r.arrayBuffer());
            step('sync', r, buf.length);
            const outer = V31nPack.parse(V31nPack.MAGIC, buf);
            const e = outer && outer.entries.length === 1 && outer.entries[0].key === INDEX_KEY ? outer.entries[0] : null;
            const bytes = e ? buf.slice(e.at, e.at + e.size) : null;
            const got = bytes ? await listed(bytes, etag(r)) : null;
            if (!got) await whole(await fetch(url, { headers: { Accept: 'application/v31np' }, cache: 'no-store' }), true);
            else {
                const im = await store(INDEX_KEY, bytes);
                const stale = old.filter(m => m.key === INDEX_KEY || !matches(got.ix.rows.get(m.key), m));
                await commit(name, [im], stale.map(m => m.key), { crc: etag(r), heads: got.ix.heads, mode: 'list', url, list: got.list });
                await dropParts(stale.map(m => m.id));
                log.result = 'list of ' + got.ix.rows.size + ' files, ' + (old.length - stale.length) + ' kept, crc ' + etag(r);
            }
        } else if (r.status === 267) {
            const buf = new Uint8Array(await r.arrayBuffer());
            step('sync', r, buf.length);
            const outer = V31nPack.parse(V31nPack.MAGIC, buf);
            const e = outer && outer.entries.length === 1 && outer.entries[0].key === '' ? outer.entries[0] : null;
            const inner = e ? buf.slice(e.at, e.at + e.size) : null;
            const patch = inner ? V31nPack.parse(V31nPack.PATCH, inner) : null;
            if (!patch) log.result = 'broken 267 answer';
            else if (before && before.mode === 'list') {
                const files = new Map(old.map(m => [m.key, m]));
                const added = [], removed = [], absent = [];
                let bad = false;
                for (const p of patch.entries) {
                    if (!fit(p.key)) continue;
                    const flag = p.size > 0 ? inner[p.at + p.size - 1] : -1;
                    if (flag === 1 && p.size === 1) {
                        if (files.has(p.key)) { files.delete(p.key); removed.push(p.key); }
                        else absent.push(p.key);
                    } else if (flag === 0) {
                        const m = await store(p.key, inner.slice(p.at, p.at + p.size - 1));
                        files.set(p.key, m);
                        added.push(m);
                    } else bad = true;
                }
                const im = files.get(INDEX_KEY);
                const indexBytes = im ? await bytesOf(im) : null;
                let got = null;
                if (added.some(m => m.key === INDEX_KEY)) got = await listed(indexBytes, etag(r));
                else if (indexBytes && etag(r) === before.crc) got = { ix: readIndex(indexBytes), list: before.list };
                const ok = !bad && !!got && !!got.ix && added.every(m => m.key === INDEX_KEY || matches(got.ix.rows.get(m.key), m));
                log.patch = { added: added.map(m => m.key), removed, absent, etag: etag(r) };
                if (ok) {
                    const stale = [...files.values()].filter(m => m.key !== INDEX_KEY && !matches(got.ix.rows.get(m.key), m));
                    const gone = [...removed, ...stale.map(m => m.key)];
                    const replaced = old.filter(m => gone.includes(m.key) || added.some(x => x.key === m.key));
                    await commit(name, added, gone, { crc: etag(r), heads: got.ix.heads, mode: 'list', url, list: got.list });
                    await dropParts(replaced.map(m => m.id));
                    log.result = 'took ' + added.length + ' files, crc ' + etag(r);
                } else {
                    await dropParts(added.map(m => m.id));
                    await whole(await fetch(url, { headers: { Accept: 'application/v31np' }, cache: 'no-store' }), true);
                }
            } else {
                const files = new Map(old.map(m => [m.key, m]));
                const added = [], removed = [];
                let bad = false;
                for (const p of patch.entries) {
                    if (!fit(p.key)) continue;
                    const flag = p.size > 0 ? inner[p.at + p.size - 1] : -1;
                    if (flag === 1 && p.size === 1) { files.delete(p.key); removed.push(p.key); }
                    else if (flag === 0) {
                        const m = await store(p.key, inner.slice(p.at, p.at + p.size - 1));
                        files.set(p.key, m);
                        added.push(m);
                    } else bad = true;
                }
                const rebuilt = [...files.values()].sort(byKey);
                const crc = archiveSum(rebuilt);
                const im = files.get(INDEX_KEY);
                const ix = im ? readIndex(await bytesOf(im)) : null;
                log.patch = { changed: added.map(m => m.key), removed, crc, etag: etag(r) };
                if (!bad && crc === etag(r) && await checkWhole(rebuilt, ix)) {
                    const replaced = old.filter(m => removed.includes(m.key) || added.some(x => x.key === m.key));
                    await commit(name, added, removed, { crc, heads: ix ? ix.heads : {}, mode: 'full', url });
                    await dropParts(replaced.map(m => m.id));
                    log.result = 'patched, crc ' + crc;
                } else {
                    await dropParts(added.map(m => m.id));
                    await whole(await fetch(url, { headers: { Accept: 'application/v31np' }, cache: 'no-store' }), true);
                }
            }
        } else { step('sync', r, null); log.result = 'status ' + r.status; }
        await note({ kind: 'sync', ...log });
        return log;
    };

    const chains = new Map();
    const enqueue = (name, fn) => {
        const next = (chains.get(name) || Promise.resolve()).catch(() => {}).then(fn);
        chains.set(name, next);
        return next;
    };
    const running = new Map();
    const sync = (name, why, url) => {
        if (!running.has(name)) running.set(name, enqueue(name, () => run(name, why, url)).finally(() => running.delete(name)));
        return running.get(name);
    };

    const listedSize = async (name, key) => {
        const a = await archive(name);
        return a && a.mode === 'list' && a.list && a.list[key] && key !== INDEX_KEY ? a.list[key][1] : null;
    };
    const waiting = new Map();
    const need = (name, key) => {
        let w = waiting.get(name);
        if (!w) {
            w = { keys: new Set() };
            w.done = new Promise(resolve => setTimeout(() => {
                waiting.delete(name);
                resolve(enqueue(name, async () => {
                    const a = await archive(name);
                    const keys = [];
                    for (const k of w.keys) if (a && a.list && a.list[k] && !await file(name, k)) keys.push(k);
                    if (keys.length) return run(name, 'want ' + keys.length, a.url, keys);
                }));
            }, 30));
            waiting.set(name, w);
        }
        w.keys.add(key);
        return w.done.catch(() => {}).then(() => file(name, key));
    };
    const remote = async (name, key, start, end) => {
        const a = await archive(name);
        if (!a || a.mode !== 'list' || !a.list || !a.list[key]) return null;
        const at = a.list[key][0];
        const want = 'bytes=' + (at + start) + '-' + (at + end);
        const r = await fetch(a.url, { headers: { Range: want, 'If-Range': '"' + a.crc + '"' }, cache: 'no-store' });
        if (r.status !== 206 || !(r.headers.get('content-range') || '').startsWith('bytes ' + (at + start) + '-' + (at + end) + '/')) {
            try { await r.body.cancel(); } catch {}
            return null;
        }
        return r.body;
    };

    const wantKeys = (name, keys) => enqueue(name, async () => {
        const a = await archive(name);
        const missing = [];
        for (const k of keys) if (a && a.list && a.list[k] && !await file(name, k)) missing.push(k);
        if (missing.length) return run(name, 'want ' + missing.length, a.url, missing);
    });
    const wantNow = async (name, keys) => {
        await (chains.get(name) || Promise.resolve()).catch(() => {});
        const a = await archive(name);
        const missing = [];
        for (const k of keys) if (a && a.list && a.list[k] && !await file(name, k)) missing.push(k);
        if (missing.length) return run(name, 'want ' + missing.length, a.url, missing);
    };
    const rows = async name => {
        const im = await file(name, INDEX_KEY);
        const ix = im ? readIndex(await bytesOf(im)) : null;
        return ix ? ix.rows : new Map();
    };

    const load = async name => {
        const files = [];
        for (const m of await held(name)) files.push({ key: m.key, bytes: await bytesOf(m) });
        const a = await archive(name);
        return { files, crc: a ? a.crc : null };
    };
    const query = async (name, key, value) => {
        const t = await tx('queries', 'readwrite');
        const s = t.objectStore('queries');
        const old = await request(s.get([name, key]));
        s.put({ name, key, value });
        await done(t);
        return old ? old.value : null;
    };
    const note = async entry => {
        const t = await tx('log', 'readwrite');
        t.objectStore('log').add(entry);
        await done(t);
    };
    const notes = async () => request((await tx('log', 'readonly')).objectStore('log').getAll());

    return { sync, load, file, blob, slice, need, want: wantKeys, wantNow, rows, remote, listed: listedSize, held, query, note, notes, heads };
})();
