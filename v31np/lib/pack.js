const V31nPack = (() => {
    const enc = new TextEncoder();
    const dec = new TextDecoder('utf-8', { fatal: true });
    const bytes = s => enc.encode(s);
    const MAGIC = bytes('V31NSPACKFORMAT');
    const ASK = bytes('V31NPIELALAIMIT');
    const PATCH = new Uint8Array([0x56, 0x33, 0x31, 0x4E, 0x32, 0x36, 0x37, 0, 0, 0, 0, 0, 0, 0, 0]);
    const PI = new Uint8Array([0x24, 0x3F, 0x6A, 0x88, 0x85, 0xA3, 0x08, 0xD3, 0x13, 0x19, 0x8A, 0x2E]);
    const PHI = new Uint8Array([0x9E, 0x37, 0x79, 0xB9, 0x7F, 0x4A, 0x7C, 0x15, 0xF3, 0x9C, 0xC0, 0x60]);
    const MARK = 12, LEAD = 27, FOOT = 16, LIMIT = 4503599627370496;

    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
    }
    const crc = (data, prev = 0) => {
        let c = (prev ^ 0xFFFFFFFF) >>> 0;
        for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    };
    const hex = v => v.toString(16).toUpperCase().padStart(8, '0');
    const times = (mat, vec) => {
        let sum = 0;
        for (let i = 0; vec !== 0; i++, vec >>>= 1) if (vec & 1) sum = (sum ^ mat[i]) >>> 0;
        return sum;
    };
    const square = mat => mat.map(v => times(mat, v));
    const combine = (crc1, crc2, len2) => {
        if (len2 <= 0) return crc1;
        let odd = [0xEDB88320];
        for (let n = 1, row = 1; n < 32; n++, row = (row << 1) >>> 0) odd[n] = row;
        let even = square(odd);
        odd = square(even);
        for (;;) {
            even = square(odd);
            if (len2 % 2) crc1 = times(even, crc1);
            len2 = Math.floor(len2 / 2);
            if (len2 === 0) break;
            odd = square(even);
            if (len2 % 2) crc1 = times(odd, crc1);
            len2 = Math.floor(len2 / 2);
            if (len2 === 0) break;
        }
        return (crc1 ^ crc2) >>> 0;
    };

    const join = parts => {
        let n = 0;
        for (const p of parts) n += p.length;
        const out = new Uint8Array(n);
        let at = 0;
        for (const p of parts) { out.set(p, at); at += p.length; }
        return out;
    };
    const num = v => {
        const out = [];
        do { out.push(v % 256); v = Math.floor(v / 256); } while (v > 0);
        return new Uint8Array(out);
    };
    const sep = marker => join([new Uint8Array([marker]), PHI]);
    const split = key => {
        const slash = key.lastIndexOf('/');
        const base = slash === -1 ? 0 : slash + 1;
        const dot = key.lastIndexOf('.');
        const ext = dot === -1 || dot < base ? key.length : dot;
        return [key.slice(0, base), key.slice(base, ext), key.slice(ext)];
    };

    const head = (magic, items) => {
        const t2 = [];
        for (const { key, size } of items) {
            t2.push(sep(0), bytes(key), sep(1), num(size));
            for (const part of split(key)) t2.push(sep(1), bytes(part));
        }
        const t2b = join(t2);
        let start = 0, previous, header;
        do {
            previous = start;
            const parts = [magic, PI];
            let address = previous;
            for (const { key, size } of items) {
                parts.push(sep(0), bytes(key), sep(1), num(address));
                address += size;
            }
            parts.push(PI, t2b, PI);
            header = join(parts);
            start = header.length;
        } while (start !== previous);
        return header;
    };

    const archiveCrc = (magic, files) => {
        const header = head(magic, files.map(f => ({ key: f.key, size: f.bytes.length })));
        let sum = crc(header);
        for (const f of files) sum = crc(f.bytes, sum);
        return { header, crc: crc(PI, sum) };
    };

    const write = (magic, files) => {
        const { header, crc: c } = archiveCrc(magic, files);
        const tail = new Uint8Array(FOOT);
        tail.set(PI);
        new DataView(tail.buffer).setUint32(MARK, c, true);
        return { buf: join([header, ...files.map(f => f.bytes), tail]), crc: c };
    };

    const find = (buf, pat, from, to) => {
        if (to > buf.length) to = buf.length;
        outer: for (let i = from; i + pat.length <= to; i++) {
            for (let k = 0; k < pat.length; k++) if (buf[i + k] !== pat[k]) continue outer;
            return i;
        }
        return -1;
    };
    const same = (buf, at, pat) => {
        if (at + pat.length > buf.length) return false;
        for (let k = 0; k < pat.length; k++) if (buf[at + k] !== pat[k]) return false;
        return true;
    };

    const rows = (buf, from, to) => {
        const out = [];
        let open = false, at = from;
        for (;;) {
            const hit = find(buf, PHI, at, to);
            if (hit >= 0 && hit <= at) return null;
            const end = hit < 0 ? to : hit - 1;
            if (open) out[out.length - 1].push(buf.subarray(at, end));
            else if (end !== from) return null;
            if (hit < 0) return out;
            const marker = buf[hit - 1];
            if (marker === 0) { out.push([]); open = true; }
            else if (marker !== 1 || !open) return null;
            at = hit + MARK;
        }
    };
    const value = b => {
        if (b.length === 0 || b.length > 7) return null;
        let v = 0;
        for (let i = b.length - 1; i >= 0; i--) v = v * 256 + b[i];
        return v < LIMIT ? v : null;
    };
    const text = b => { try { return dec.decode(b); } catch { return null; } };

    const parse = (magic, buf) => {
        const total = buf.length;
        if (total < LEAD + 2 * MARK + FOOT) return null;
        if (!same(buf, 0, magic) || !same(buf, 15, PI)) return null;
        const body = total - FOOT;
        const b = find(buf, PI, LEAD, body);
        if (b < 0) return null;
        const c = find(buf, PI, b + MARK, body);
        if (c < 0) return null;
        const t1 = rows(buf, LEAD, b), t2 = rows(buf, b + MARK, c);
        if (!t1 || !t2 || t1.length !== t2.length) return null;
        const sizes = new Map();
        for (const r of t2) {
            if (r.length !== 5) return null;
            const key = text(r[0]), size = value(r[1]);
            if (key === null || size === null || sizes.has(key)) return null;
            const parts = split(key);
            for (let k = 0; k < 3; k++) if (text(r[k + 2]) !== parts[k]) return null;
            sizes.set(key, size);
        }
        let next = c + MARK;
        const entries = [];
        for (const r of t1) {
            if (r.length !== 2) return null;
            const key = text(r[0]), at = value(r[1]);
            if (key === null || at === null || at !== next || !sizes.has(key) || sizes.get(key) > body - next) return null;
            entries.push({ key, at, size: sizes.get(key) });
            next += sizes.get(key);
            sizes.delete(key);
        }
        if (next !== body || !same(buf, body, PI)) return null;
        const want = new DataView(buf.buffer, buf.byteOffset + body + MARK, 4).getUint32(0, true);
        if (crc(buf.subarray(0, body + MARK)) !== want) return null;
        return { entries, crc: want };
    };

    const headOf = (magic, buf) => {
        if (buf.length < LEAD) return 'more';
        if (!same(buf, 0, magic) || !same(buf, 15, PI)) return null;
        const b = find(buf, PI, LEAD, buf.length);
        if (b < 0) return 'more';
        const c = find(buf, PI, b + MARK, buf.length);
        if (c < 0) return 'more';
        const t1 = rows(buf, LEAD, b), t2 = rows(buf, b + MARK, c);
        if (!t1 || !t2 || t1.length !== t2.length) return null;
        const sizes = new Map();
        for (const r of t2) {
            if (r.length !== 5) return null;
            const key = text(r[0]), size = value(r[1]);
            if (key === null || size === null || sizes.has(key)) return null;
            const parts = split(key);
            for (let k = 0; k < 3; k++) if (text(r[k + 2]) !== parts[k]) return null;
            sizes.set(key, size);
        }
        let next = c + MARK;
        const entries = [];
        for (const r of t1) {
            if (r.length !== 2) return null;
            const key = text(r[0]), at = value(r[1]);
            if (key === null || at === null || at !== next || !sizes.has(key)) return null;
            entries.push({ key, at, size: sizes.get(key) });
            next += sizes.get(key);
            sizes.delete(key);
        }
        return { entries, length: c + MARK, end: next };
    };

    return { MAGIC, ASK, PATCH, PI, FOOT, MARK, crc, hex, combine, bytes, join, head, write, archiveCrc, parse, headOf };
})();
