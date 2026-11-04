const V31nShow = (() => {
    const INDEX_KEY = 'v31np index.txt';
    const SVG = 'http://www.w3.org/2000/svg';
    const types = {
        html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
        mjs: 'text/javascript; charset=utf-8', json: 'application/json', txt: 'text/plain; charset=utf-8', xml: 'application/xml', svg: 'image/svg+xml',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon', webp: 'image/webp', avif: 'image/avif',
        bmp: 'image/bmp', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', wasm: 'application/wasm', pdf: 'application/pdf',
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac',
        mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime', vtt: 'text/vtt; charset=utf-8', stl: 'model/stl'
    };
    const extOf = key => {
        const dot = key.lastIndexOf('.');
        return dot > key.lastIndexOf('/') && dot >= 0 ? key.slice(dot + 1).toLowerCase() : '';
    };
    const typeOf = key => types[extOf(key)] || 'application/octet-stream';
    const isCss = key => extOf(key) === 'css';
    const skip = /^(?:blob:|data:|about:|javascript:|mailto:|tel:|#)/i;
    const fileUrl = key => location.origin + key.split('/').map(encodeURIComponent).join('/');
    const target = (raw, base) => {
        if (typeof raw !== 'string') return null;
        const t = raw.trim();
        if (t === '' || skip.test(t)) return null;
        let u;
        try { u = new URL(t, base); } catch { return null; }
        if (u.origin !== location.origin) return null;
        let key;
        try { key = decodeURIComponent(u.pathname); } catch { return null; }
        let search = u.search;
        try { search = decodeURIComponent(u.search); } catch {}
        return { key, search, rawSearch: u.search, hash: u.hash, href: u.href };
    };
    const cssPattern = () => /url\(\s*(["']?)([^"')]+?)\1\s*\)|@import\s+(["'])([^"']+)\3/g;
    const cssRefs = text => {
        const out = [];
        for (const m of String(text).matchAll(cssPattern())) out.push(m[2] !== undefined ? m[2] : m[4]);
        return out;
    };
    const faces = () => /@font-face\s*\{[^}]*\}/gi;
    const firstFont = face => {
        const s = /(?:^|[;{\s])src\s*:\s*([^;}]*)/i.exec(face);
        return s ? cssRefs(s[1])[0] : undefined;
    };
    const cssWants = text => {
        const out = [];
        for (const m of String(text).matchAll(faces())) {
            const f = firstFont(m[0]);
            if (f !== undefined) out.push(f);
        }
        return out.concat(cssRefs(String(text).replace(faces(), '')));
    };
    const srcsetRefs = value =>String(value).split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);

    const links = /(?:^|\s)(?:stylesheet|icon|shortcut|apple-touch-icon|mask-icon|preload|modulepreload|prefetch)(?:\s|$)/i;
    const kinds = el => {
        const name = el.namespaceURI === SVG ? el.localName : el.tagName;
        switch (name) {
            case 'IMG': return { src: 'take', srcset: 'set' };
            case 'SCRIPT': return { src: 'take' };
            case 'INPUT': return { src: 'take' };
            case 'EMBED': return { src: 'take' };
            case 'OBJECT': return { data: 'take' };
            case 'LINK': return links.test(el.getAttribute('rel') || '') ? { href: 'take' } : {};
            case 'AUDIO': return { src: 'play' };
            case 'VIDEO': return { src: 'play', poster: 'take' };
            case 'SOURCE': return el.parentNode && /^(AUDIO|VIDEO)$/.test(el.parentNode.tagName || '') ? { src: 'play' } : { src: 'take', srcset: 'set' };
            case 'TRACK': return { src: 'play' };
            case 'image': case 'use': case 'feImage': return { href: 'take', 'xlink:href': 'take' };
            default: return {};
        }
    };

    const pinned = async (meta, bytes) => {
        const algs = { sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' };
        const list = String(meta || '').trim().split(/\s+/).map(s => /^(sha256|sha384|sha512)-([A-Za-z0-9+/=]+)/.exec(s)).filter(Boolean);
        if (!list.length) return true;
        const best = ['sha512', 'sha384', 'sha256'].find(a => list.some(m => m[1] === a));
        const sum = new Uint8Array(await crypto.subtle.digest(algs[best], bytes));
        let bin = '';
        for (const c of sum) bin += String.fromCharCode(c);
        const got = btoa(bin);
        return list.some(m => m[1] === best && m[2] === got);
    };
    const report = entry => console.log('v31np', JSON.stringify(entry));
    const leave = async () => {
        if (!navigator.serviceWorker) return;
        for (const r of await navigator.serviceWorker.getRegistrations()) {
            const w = r.active || r.waiting || r.installing;
            if (w && new URL(w.scriptURL).pathname === '/v31np/sw.js') await r.unregister();
        }
    };

    const start = async ({ archive, page, html, started, logs, queries = [] }) => {
        const archiveAbs = new URL(archive, location.href).href;
        const listed = await V31nSync.rows(archive);
        const held = new Map();
        const fill = async () => {
            for (const m of await V31nSync.held(archive)) if (m.key !== INDEX_KEY) held.set(m.key, m);
            if (page) for (const m of await V31nSync.held(page)) if (m.key !== '' && m.key !== INDEX_KEY) held.set(m.key, m);
        };
        await fill();

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const baseEl = doc.querySelector('base[href]');
        const base = baseEl ? new URL(baseEl.getAttribute('href'), location.href).href : location.href;

        const refs = new Set();
        const add = (raw, b) => {
            const t = target(raw, b);
            if (t && listed.has(t.key)) refs.add(t.key);
        };
        const each = (fn, els = doc.querySelectorAll('*')) => {
            for (const el of els) {
                const k = kinds(el);
                for (const a of [...el.attributes]) {
                    if (a.name === 'style') fn(el, a, 'style');
                    else if (k[a.name]) fn(el, a, k[a.name]);
                }
                if (el.tagName === 'STYLE') fn(el, null, 'sheet');
                if (el.tagName === 'SCRIPT' && (el.getAttribute('type') || '').toLowerCase() === 'importmap') fn(el, null, 'importmap');
            }
        };
        each((el, a, kind) => {
            if (kind === 'take') add(a.value, base);
            else if (kind === 'set') for (const u of srcsetRefs(a.value)) add(u, base);
            else if (kind === 'style') for (const u of cssRefs(a.value)) add(u, base);
            else if (kind === 'sheet') for (const u of cssRefs(el.textContent)) add(u, base);
            else if (kind === 'importmap') {
                try { for (const v of Object.values(JSON.parse(el.textContent).imports || {})) add(String(v), base); } catch {}
            }
        });

        const asked = new Set();
        const rounds = [];
        const round = async keys => {
            const fresh = [...keys].filter(k => !held.has(k) && !asked.has(k));
            if (!fresh.length) return false;
            for (const k of fresh) asked.add(k);
            const got = await V31nSync.want(archive, fresh);
            rounds.push({ wanted: fresh.length, result: got && got.result, steps: got && got.steps });
            await fill();
            return true;
        };
        const levelOf = key => (listed.get(key) && listed.get(key).level) || 'Ù';
        await round([...refs].filter(k => isCss(k) || levelOf(k) === 'S'));
        const read = new Set();
        for (;;) {
            const more = new Set();
            for (const key of [...refs]) {
                if (!isCss(key) || read.has(key) || !held.has(key)) continue;
                read.add(key);
                const text = await (await V31nSync.blob(held.get(key))).text();
                for (const u of cssWants(text)) {
                    const t = target(u, fileUrl(key));
                    if (!t || !listed.has(t.key)) continue;
                    refs.add(t.key);
                    if (!held.has(t.key) && (isCss(t.key) || levelOf(t.key) === 'S')) more.add(t.key);
                }
            }
            if (!more.size || !await round(more)) break;
        }

        const order = ['A', 'B', 'Ú', 'U', 'Ù'];
        const groupOf = new Map();
        for (const k of refs) if (!held.has(k)) groupOf.set(k, order.includes(levelOf(k)) ? levelOf(k) : 'A');
        for (const [k, row] of listed) if (row.level === 'A' && !held.has(k)) groupOf.set(k, 'A');
        const coming = order.map(level => [level, [...groupOf].filter(([, l]) => l === level).map(([k]) => k)])
            .filter(([, keys]) => keys.length)
            .map(([level, keys]) => [level, keys.length, V31nSync.wantNow(archive, keys)]);
        const done = new Set();
        const ready = key => held.has(key) && (!groupOf.has(key) || done.has(groupOf.get(key)));

        const urls = new Map();
        const map = (raw, b, absolute = false) => {
            const t = target(raw, b);
            if (!t) return raw;
            if (t.search && urls.has(t.key + t.search)) return urls.get(t.key + t.search) + t.hash;
            if (urls.has(t.key)) return urls.get(t.key) + t.hash;
            if (listed.has(t.key)) return archiveAbs + '?key=' + encodeURIComponent(t.key) + t.hash;
            return absolute ? t.href : raw;
        };
        const cssMap = (text, b, absolute = false) => String(text).replace(cssPattern(), (m, q, u, q2, u2) => u !== undefined
            ? 'url(' + q + map(u, b, absolute) + q + ')'
            : '@import ' + q2 + map(u2, b, absolute) + q2);
        const setMap = (value, b) => String(value).split(',').map(part => {
            const s = part.trim();
            const at = s.search(/\s/);
            return at < 0 ? map(s, b) : map(s.slice(0, at), b) + s.slice(at);
        }).join(', ');
        const cssSource = new Map();
        const cssMade = new Map();
        const swaps = [];
        const makeCss = async (key, seen) => {
            if (seen.has(key)) return;
            seen.add(key);
            const own = fileUrl(key);
            const m = held.get(key);
            if (!cssSource.has(key) || cssSource.get(key)[0] !== m.id) cssSource.set(key, [m.id, await (await V31nSync.blob(m)).text()]);
            const text = cssSource.get(key)[1];
            for (const u of cssRefs(text)) {
                const t = target(u, own);
                if (t && isCss(t.key) && held.has(t.key)) await makeCss(t.key, seen);
            }
            const out = cssMap(String(text).replace(faces(), face => {
                const f = firstFont(face);
                const t = f === undefined ? null : target(f, own);
                return t && listed.has(t.key) && !ready(t.key) ? '' : face;
            }), own, true);
            if (cssMade.get(key) === out) return;
            cssMade.set(key, out);
            const old = urls.get(key);
            urls.set(key, URL.createObjectURL(new Blob([out], { type: typeOf(key) })));
            if (old) swaps.push([old, urls.get(key)]);
        };
        const make = async () => {
            for (const [key, m] of held) if (!isCss(key) && !urls.has(key)) urls.set(key, URL.createObjectURL(await V31nSync.blob(m, typeOf(key))));
            const seen = new Set();
            for (const key of held.keys()) if (isCss(key)) await makeCss(key, seen);
        };
        await make();

        for (const el of doc.querySelectorAll('link[integrity]')) {
            const t = target(el.getAttribute('href') || '', base);
            if (!t || !isCss(t.key) || !held.has(t.key)) continue;
            if (await pinned(el.getAttribute('integrity'), await (await V31nSync.blob(held.get(t.key))).arrayBuffer())) el.removeAttribute('integrity');
            else el.remove();
        }

        const scripts = [...doc.querySelectorAll('script')];
        for (const s of scripts) s.remove();
        const later = [];
        for (const el of doc.querySelectorAll('*')) {
            const k = kinds(el);
            const attrs = [], keys = new Set();
            for (const a of [...el.attributes]) {
                if (k[a.name] !== 'take' && k[a.name] !== 'set') continue;
                const waiting = (k[a.name] === 'set' ? srcsetRefs(a.value) : [a.value]).map(v => target(v, base))
                    .filter(t => t && listed.has(t.key) && !isCss(t.key) && !ready(t.key));
                if (!waiting.length) continue;
                attrs.push([a.name, a.value]);
                for (const t of waiting) keys.add(t.key);
            }
            if (!attrs.length) continue;
            el.setAttribute('data-v31np', String(later.length));
            for (const [n] of attrs) if (el.tagName === 'LINK') el.setAttribute(n, 'data:,'); else el.removeAttribute(n);
            later.push({ attrs, keys, done: false });
        }

        const fix = (el, a, kind) => {
            if (kind === 'take' || kind === 'play') a.value = map(a.value, base);
            else if (kind === 'set') a.value = setMap(a.value, base);
            else if (kind === 'style') a.value = cssMap(a.value, base);
            else if (kind === 'sheet') el.textContent = cssMap(el.textContent, base);
            else if (kind === 'importmap') {
                let o;
                try { o = JSON.parse(el.textContent); } catch { return; }
                o.imports = o.imports || {};
                for (const k of Object.keys(o.imports)) o.imports[k] = map(String(o.imports[k]), base);
                for (const [key, u] of urls) if (/\.m?js$/i.test(key)) o.imports[fileUrl(key)] = o.imports[fileUrl(key)] || u;
                el.textContent = JSON.stringify(o);
            }
        };
        each(fix);

        const fixAttr =(el, attr, value) => {
            if (attr === 'style') return cssMap(value, document.baseURI);
            const kind = kinds(el)[attr];
            if (kind === 'set') return setMap(value, document.baseURI);
            return kind ? map(value, document.baseURI) : value;
        };
        const wrap = (proto, prop, fix) => {
            const d = proto && Object.getOwnPropertyDescriptor(proto, prop);
            if (!d || !d.set) return;
            Object.defineProperty(proto, prop, { ...d, set(v) { d.set.call(this, typeof v === 'string' ? fix(this, v) : v); } });
        };
        const byAttr = attr => (el, v) => fixAttr(el, attr, v);
        wrap(HTMLImageElement.prototype, 'src', byAttr('src'));
        wrap(HTMLImageElement.prototype, 'srcset', byAttr('srcset'));
        wrap(HTMLSourceElement.prototype, 'src', byAttr('src'));
        wrap(HTMLSourceElement.prototype, 'srcset', byAttr('srcset'));
        wrap(HTMLMediaElement.prototype, 'src', (el, v) => map(v, document.baseURI));
        wrap(HTMLVideoElement.prototype, 'poster', (el, v) => map(v, document.baseURI));
        wrap(HTMLTrackElement.prototype, 'src', (el, v) => map(v, document.baseURI));
        wrap(HTMLLinkElement.prototype, 'href', (el, v) => map(v, document.baseURI));
        wrap(HTMLScriptElement.prototype, 'src', (el, v) => map(v, document.baseURI));
        wrap(HTMLInputElement.prototype, 'src', (el, v) => map(v, document.baseURI));
        wrap(HTMLEmbedElement.prototype, 'src', (el, v) => map(v, document.baseURI));
        wrap(HTMLObjectElement.prototype, 'data', (el, v) => map(v, document.baseURI));
        for (const prop of ['background', 'backgroundImage', 'cursor', 'content', 'listStyle', 'listStyleImage', 'borderImage', 'borderImageSource', 'maskImage', 'webkitMaskImage', 'cssText']) {
            wrap(CSSStyleDeclaration.prototype, prop, (el, v) => cssMap(v, document.baseURI));
        }
        const setProperty = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function (prop, value, priority) {
            return setProperty.call(this, prop, typeof value === 'string' ? cssMap(value, document.baseURI) : value, priority);
        };
        const setAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (attr, value) {
            return setAttribute.call(this, attr, typeof value === 'string' ? fixAttr(this, String(attr).toLowerCase(), value) : value);
        };
        const realFetch = window.fetch.bind(window);
        const shown = new Map();
        window.fetch = async (input, init) => {
            const isReq = input instanceof Request;
            const raw = typeof input === 'string' || input instanceof URL ? String(input) : isReq ? input.url : null;
            const method = String((init && init.method) || (isReq ? input.method : 'GET')).toUpperCase();
            if (raw === null || method !== 'GET') return realFetch(input, init);
            const accept = String(new Headers((init && init.headers) || (isReq ? input.headers : undefined)).get('accept') || '');
            const t = target(raw, document.baseURI);
            if (t && queries.includes(t.key) && !accept.includes('application/v31np')) {
                const name = new URL(t.href).pathname + t.rawSearch;
                const got = await V31nSync.sync(name, 'query', name);
                const metas = await V31nSync.held(name);
                const own = metas.find(m => m.key === '');
                if (own) {
                    for (const m of metas) {
                        if (m.key === '' || m.key === INDEX_KEY || (urls.has(m.key) && shown.get(m.key) === m.id)) continue;
                        shown.set(m.key, m.id);
                        const old = urls.get(m.key);
                        urls.set(m.key, URL.createObjectURL(await V31nSync.blob(m, typeOf(m.key.split('?')[0]))));
                        if (old) URL.revokeObjectURL(old);
                    }
                    report({ what: 'query', url: name, result: got && got.result, steps: got && got.steps, files: metas.length - 2 });
                    return new Response(await V31nSync.blob(own), { status: 200 });
                }
            }
            if (t && listed.has(t.key) && !urls.has(t.key) && !/^(?:audio|video)\//.test(typeOf(t.key))) {
                await V31nSync.need(archive, t.key);
                await fill();
                await make();
            }
            const mapped = map(raw, document.baseURI);
            if (mapped === raw) return realFetch(input, init);
            return realFetch(mapped, isReq ? { method: 'GET', headers: input.headers, signal: input.signal, ...init } : init);
        };
        const htmlMap = text => String(text)
            .replace(/(\s(?:src|poster)\s*=\s*)(["'])([^"']*)\2/gi, (whole, a, q, u) => {
                const plain = u.replace(/&amp;/g, '&');
                const m = map(plain, document.baseURI);
                return m === plain ? whole : a + q + m + q;
            })
            .replace(/(\ssrcset\s*=\s*)(["'])([^"']*)\2/gi, (whole, a, q, u) => a + q + setMap(u.replace(/&amp;/g, '&'), document.baseURI) + q)
            .replace(/(\sstyle\s*=\s*)(["'])([^"']*)\2/gi, (whole, a, q, u) => a + q + cssMap(u, document.baseURI) + q);
        for (const prop of ['innerHTML', 'outerHTML']) {
            const d = Object.getOwnPropertyDescriptor(Element.prototype, prop);
            if (d && d.set) Object.defineProperty(Element.prototype, prop, { ...d, set(v) { d.set.call(this, typeof v === 'string' ? htmlMap(v) : v); } });
        }
        const adjacent = Element.prototype.insertAdjacentHTML;
        Element.prototype.insertAdjacentHTML = function (where, text) {
            return adjacent.call(this, where, typeof text === 'string' ? htmlMap(text) : text);
        };
        const open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            return open.call(this, method, typeof url === 'string' && String(method).toUpperCase() === 'GET' ? map(url, document.baseURI) : url, ...rest);
        };
        window.Audio = new Proxy(window.Audio, { construct: (t, args) => new t(...args.map((a, i) => i === 0 && typeof a === 'string' ? map(a, document.baseURI) : a)) });
        window.FontFace = new Proxy(window.FontFace, { construct: (t, args) => new t(...args.map((a, i) => i === 1 && typeof a === 'string' ? cssMap(a, document.baseURI) : a)) });
        if (window.Worker) window.Worker = new Proxy(window.Worker, { construct: (t, args) => new t(...args.map((a, i) => i === 0 && typeof a === 'string' ? map(a, document.baseURI) : a)) });

        const nonce = (me && (me.nonce || me.getAttribute('nonce'))) || '';
        const out = (doc.doctype ? '<!DOCTYPE ' + doc.doctype.name + '>\n' : '') + doc.documentElement.outerHTML;
        report({ what: 'page', ...logs, rounds, refs: refs.size, files: urls.size, listed: listed.size, coming: coming.map(([level, n]) => level + ' ' + n), ms: Math.round(performance.now() - started) });
        document.open();
        document.write(out);

        let closed = false;
        const finish = () => {
            if (closed) return;
            closed = true;
            each(fix, scripts);
            if (nonce) for (const s of scripts) s.setAttribute('nonce', nonce);
            document.write(scripts.map(s => s.outerHTML).join('\n'));
            document.close();
        };
        const swap = () => {
            for (const [old, now] of swaps.splice(0)) {
                for (const link of document.querySelectorAll('link')) {
                    if (link.getAttribute('href') !== old) continue;
                    const next = link.cloneNode();
                    next.setAttribute('href', now);
                    const drop = () => link.remove();
                    next.addEventListener('load', drop, { once: true });
                    next.addEventListener('error', drop, { once: true });
                    link.after(next);
                }
            }
        };
        const restore = all => {
            for (const [i, w] of later.entries()) {
                if (w.done || (!all && ![...w.keys].every(ready))) continue;
                w.done = true;
                const el = document.querySelector('[data-v31np="' + i + '"]');
                if (!el) continue;
                el.removeAttribute('data-v31np');
                for (const [n, v] of w.attrs) el.setAttribute(n, v);
            }
        };

        if (!coming.some(([level]) => level === 'A')) finish();
        for (const [level, n, p] of coming) {
            const got = await p.catch(() => null);
            done.add(level);
            await fill();
            await make();
            swap();
            if (level === 'A') finish();
            restore(false);
            report({ what: 'level ' + level, wanted: n, result: got && got.result, steps: got && got.steps, files: urls.size, ms: Math.round(performance.now() - started) });
        }
        finish();
        restore(true);
    };

    const me = document.currentScript;
    const stub = (() => {
        const meta = n => {
            const m = document.querySelector('meta[name="' + n + '"]');
            return m ? String(m.getAttribute('content') || '') : null;
        };
        const name = me && me.dataset.archive !== undefined ? me.dataset.archive : meta('v31np-archive');
        const url = me && me.dataset.url !== undefined ? me.dataset.url : meta('v31np-url');
        return name === null || url === null ? null : { name, url };
    })();
    if (typeof V31N_PAGE !== 'undefined' && stub && /^[A-Za-z0-9_-]+$/.test(stub.name) && stub.url !== '') {
        const started = performance.now();
        const archive = new URL(stub.url, location.href).href;
        const name = location.pathname + location.search;
        (async () => {
            await leave();
            const [pageLog, listLog] = await Promise.all([V31nSync.sync(name, 'page', name), V31nSync.sync(archive, 'list', archive)]);
            const logs = { page: { result: pageLog.result, steps: pageLog.steps }, list: { result: listLog.result, steps: listLog.steps } };
            const pm = (await V31nSync.held(name)).find(m => m.key === '');
            if (!pm) return report({ what: 'page', shown: false, ...logs });
            await start({ archive, page: name, html: await (await V31nSync.blob(pm)).text(), started, logs });
        })();
    } else if (stub && /^[A-Za-z0-9_-]+$/.test(stub.name) && stub.url !== '') {
        const started = performance.now();
        const archive = new URL(stub.url, location.href).href;
        const queries = String((me && me.dataset.query) || '').split(/\s+/).filter(Boolean).map(q => '/' + q.replace(/^\/+/, ''));
        const listing = leave().then(() => V31nSync.sync(archive, 'list', archive));
        const whole = document.documentElement.outerHTML;
        const mine = me.outerHTML;
        const at = whole.lastIndexOf(mine);
        const prefix = (document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>\n' : '') + (at < 0 ? '' : whole.slice(0, at));
        document.write('<plaintext style="display:none">');
        document.addEventListener('DOMContentLoaded', async () => {
            const rest = document.querySelector('plaintext');
            const listLog = await listing;
            await start({ archive, page: null, html: prefix + (rest ? rest.textContent : ''), started, logs: { list: { result: listLog.result, steps: listLog.steps } }, queries });
        }, { once: true });
    }

    return { start };
})();
