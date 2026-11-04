const V31nOrder = (tables => {
    const ranges = tables.ranges;
    const slots = new Map(tables.slots.map(([c, rank, place]) => [c, [rank, place]]));

    const range = c => {
        let lo = 0, hi = ranges.length - 1, hit = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (ranges[mid][0] <= c) { hit = mid; lo = mid + 1; } else hi = mid - 1;
        }
        return hit >= 0 && c <= ranges[hit][1] ? ranges[hit] : null;
    };
    const space = c => { const r = range(c); return r !== null && r[2]; };
    const loose = c => range(c) !== null;
    const points = s => Array.from(s, ch => ch.codePointAt(0));
    const text = p => String.fromCodePoint(...p);
    const shifts = tables.lower;
    const lowerCase = c => {
        let lo = 0, hi = shifts.length - 1, hit = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (shifts[mid][0] <= c) { hit = mid; lo = mid + 1; } else hi = mid - 1;
        }
        if (hit < 0) return c;
        const [first, last, step, delta] = shifts[hit];
        return c > last || (c - first) % step !== 0 ? c : c + delta;
    };

    const fold = name => {
        let t = points(name);
        let i = 0;
        while (i < t.length && space(t[i])) i++;
        if (i < t.length && t[i] === 0x5B) {
            const close = t.indexOf(0x5D, i + 1);
            if (close !== -1 && close > i + 1) t = t.slice(i + 1, close);
        }
        i = 0;
        while (i < t.length && loose(t[i])) i++;
        t = t.slice(i);

        const d = points(text(t).normalize('NFD'));
        const doubled = [];
        for (let k = 0; k < d.length; k++) {
            if (d[k] !== 0x0A && k + 1 < d.length && d[k + 1] === 0x308) {
                doubled.push(d[k], d[k]);
                k++;
            } else doubled.push(d[k]);
        }
        t = points(text(doubled).normalize('NFC'));

        const numbered = [];
        for (let k = 0; k < t.length;) {
            if (t[k] === 0x2116) {
                let j = k + 1;
                while (j < t.length && space(t[j])) j++;
                const start = j;
                while (j < t.length && t[j] >= 0x30 && t[j] <= 0x39) j++;
                if (j > start) {
                    let lead = start;
                    while (lead + 1 < j && t[lead] === 0x30) lead++;
                    const digits = t.slice(lead, j);
                    numbered.push(0x2116);
                    for (let p = digits.length; p < 5; p++) numbered.push(0x30);
                    numbered.push(...digits);
                    k = j;
                    continue;
                }
            }
            numbered.push(t[k]);
            k++;
        }
        return numbered.map(lowerCase);
    };

    const stem = name => {
        const dot = name.lastIndexOf('.');
        return dot === -1 || dot === 0 ? name : name.slice(0, dot);
    };

    const rank = (s1, s2) => {
        const min = Math.min(s1.length, s2.length);
        for (let i = 0; i < min; i++) {
            const c1 = s1[i], c2 = s2[i];
            if (c1 === c2) continue;
            const r1 = slots.get(c1), r2 = slots.get(c2);
            if (r1 && r2) {
                if (r1[0] !== r2[0]) return r1[0] < r2[0] ? -1 : 1;
            } else if (r1) return -1;
            else if (r2) return 1;
            else return c1 < c2 ? -1 : 1;
        }
        return s1.length === s2.length ? 0 : s1.length < s2.length ? -1 : 1;
    };

    const place = (s1, s2) => {
        const min = Math.min(s1.length, s2.length);
        for (let i = 0; i < min; i++) {
            if (s1[i] === s2[i]) continue;
            const r1 = slots.get(s1[i]), r2 = slots.get(s2[i]);
            if (r1 && r2 && r1[1] !== r2[1]) return r1[1] < r2[1] ? -1 : 1;
            return 0;
        }
        return 0;
    };

    const capital = c => lowerCase(c) !== c;

    const cases = (s1, s2) => {
        const min = Math.min(s1.length, s2.length);
        for (let i = 0; i < min; i++) {
            const c1 = capital(s1[i]), c2 = capital(s2[i]);
            if (c1 !== c2) return c1 ? -1 : 1;
        }
        return 0;
    };

    const name = (a, b) => {
        const stemA = fold(stem(a)), stemB = fold(stem(b));
        let c = rank(stemA, stemB);
        if (c !== 0) return c;
        const foldA = fold(a), foldB = fold(b);
        c = rank(foldA, foldB);
        if (c !== 0) return c;
        c = place(stemA, stemB);
        if (c !== 0) return c;
        c = place(foldA, foldB);
        if (c !== 0) return c;
        const pa = points(a), pb = points(b);
        c = cases(pa, pb);
        if (c !== 0) return c;
        if (pa.length !== pb.length) return pa.length < pb.length ? -1 : 1;
        for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
        return 0;
    };

    const key = (a, b) => {
        const pa = a.split('/'), pb = b.split('/');
        const n = Math.min(pa.length, pb.length);
        for (let i = 0; i < n; i++) {
            const folderA = i < pa.length - 1, folderB = i < pb.length - 1;
            if (folderA !== folderB) return folderA ? -1 : 1;
            const c = name(pa[i], pb[i]);
            if (c !== 0) return c;
        }
        return pa.length === pb.length ? 0 : pa.length < pb.length ? -1 : 1;
    };

    return { name, key };
})(V31N_TABLES);
