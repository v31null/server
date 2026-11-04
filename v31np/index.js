const fs = require('fs');
const path = require('path');
const core = require('./node/core.js');

const pathOf = req => {
    const url = new URL(req.originalUrl || req.url, 'http://x');
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { pathname = null; }
    return { pathname, query: url.searchParams };
};

const handle = async (req, res) => {
    const { pathname, query } = pathOf(req);
    if (pathname === null || !pathname.startsWith('/v31np/')) return false;
    if (pathname.includes('\0')) { core.end(res, 400); return true; }
    const rest = pathname.slice('/v31np/'.length);
    const name = /^([^/]+)\.v31np$/.exec(rest);
    if (name) { await core.exchange(req, res, name[1], query); return true; }
    const pre = /^pre\/([A-Za-z0-9_-]+)\.v31np$/.exec(rest);
    if (pre && core.archive(pre[1])) {
        const a = core.archive(pre[1]);
        if (req.method !== 'GET' && req.method !== 'HEAD') { core.end(res, 405, { Allow: 'GET, HEAD' }); return true; }
        core.ranges(req, res, a.file, 0, fs.statSync(a.file).size, 'application/v31np', a.info.crc);
        return true;
    }
    if (rest === 'v31np.js') {
        const file = path.join(core.HOME, 'v31np.js');
        if (!fs.existsSync(file)) { core.end(res, 404); return true; }
        if (req.method !== 'GET' && req.method !== 'HEAD') { core.end(res, 405, { Allow: 'GET, HEAD' }); return true; }
        const b = fs.readFileSync(file);
        core.end(res, 200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Content-Length': b.length }, req.method === 'HEAD' ? undefined : b);
        return true;
    }
    core.end(res, 404);
    return true;
};

function v31np(req, res, next) {
    const done = handle(req, res).catch(() => {
        if (!res.headersSent) core.end(res, 500);
        else res.destroy();
        return true;
    });
    if (typeof next !== 'function') return done;
    done.then(handled => { if (!handled) next(); });
}

v31np.page = async (req, res, name, html, look = '') => {
    if (!core.NAME.test(name)) return core.end(res, 500);
    const method = req.method;
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const accept = String(req.headers.accept || '');
    if ((method === 'POST' && type === 'application/v31np') || ((method === 'GET' || method === 'HEAD') && accept.includes('application/v31np'))) {
        const index = core.loadIndex(core.INDEX);
        if (!index) return core.end(res, 500);
        const page = typeof html === 'function' ? await html() : html;
        const send = [].concat(core.settings(name).send);
        const keys = [...index.rows.keys()].filter(k => send.includes(index.rows.get(k).level || 'Ù'));
        return core.sendAnswer(req, res, index, keys, page);
    }
    const shell = Buffer.from('<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<link rel="icon" href="data:,">\n'
        + '<meta name="v31np-archive" content="' + name + '">\n<meta name="v31np-url" content="/v31np/' + name + '.v31np">\n' + look + '<script>\n'
        + 'const V31N_PAGE = {};\n'
        + fs.readFileSync(path.join(core.HOME, 'v31np.js'), 'utf8')
        + '</script>\n</head>\n<body>\n</body>\n</html>\n');
    core.end(res, 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Accept, Content-Type', 'Content-Length': shell.length }, method === 'HEAD' ? undefined : shell);
};

module.exports = v31np;
