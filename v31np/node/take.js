const fs = require('fs');
const path = require('path');

const TYPES = ['html', 'htm', 'css', 'js', 'mjs', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'bmp', 'woff', 'woff2', 'ttf', 'otf',
    'mp3', 'wav', 'ogg', 'oga', 'opus', 'm4a', 'aac', 'flac', 'mp4', 'm4v', 'webm', 'ogv', 'mov', 'vtt'];

const types = settings => [...new Set([...TYPES, ...[].concat(settings.types || []).map(t => String(t).replace(/^\./, '').toLowerCase())])];

const rulesOf = dir => {
    let text;
    try { text = fs.readFileSync(path.join(dir, '.htaccess'), 'utf8'); } catch { return []; }
    const rules = [];
    let block = null;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line === '' || line[0] === '#') continue;
        let m;
        if ((m = /^<FilesMatch\s+"?([^">]+)"?\s*>$/i.exec(line))) { block = ['match', m[1]]; continue; }
        if ((m = /^<Files\s+"?([^">]+)"?\s*>$/i.exec(line))) { block = ['files', m[1]]; continue; }
        if (/^<\/Files(Match)?>$/i.test(line)) { block = null; continue; }
        let verdict = null;
        if (/^Require\s+all\s+denied$/i.test(line) || /^Deny\s+from\s+all$/i.test(line)) verdict = true;
        else if (/^Require\s+all\s+granted$/i.test(line)) verdict = false;
        if (verdict !== null) { rules.push([block ? block[0] : 'all', block ? block[1] : '', verdict]); continue; }
        if (!block && (m = /^RedirectMatch\s+(403|404|410|gone)\s+"?([^"\s]+)"?/i.exec(line))) { rules.push(['url', m[2], true]); continue; }
        if (!block && (m = /^RewriteRule\s+"?([^"\s]+)"?\s+-\s+\[([^\]]*)\]/i.exec(line)) && /(^|,)\s*(F|G|forbidden|gone)\s*(,|$)/i.test(m[2])) rules.push(['rewrite', m[1], true]);
    }
    return rules;
};

const regex = (pattern, subject) => {
    let p = pattern, flags = 'u';
    if (p.includes('(?i)')) { p = p.split('(?i)').join(''); flags += 'i'; }
    try { return new RegExp(p, flags).test(subject); } catch { return false; }
};
const wild = (pattern, subject) => new RegExp('^' + pattern.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(subject);

const denied = (root, key, cache) => {
    const parts = key.split('/');
    const base = parts.pop();
    let out = false, dir = root, rel = '';
    for (let i = 0; i <= parts.length; i++) {
        if (!cache.has(dir)) cache.set(dir, rulesOf(dir));
        const below = key.slice(rel.length);
        for (const [kind, pattern, verdict] of cache.get(dir)) {
            const hit = kind === 'all' ? true
                : kind === 'match' ? regex(pattern, base)
                : kind === 'files' ? wild(pattern, base)
                : kind === 'url' ? regex(pattern, '/' + key)
                : regex(pattern, below);
            if (hit) out = verdict;
        }
        if (i < parts.length) {
            dir = path.join(dir, parts[i]);
            rel += parts[i] + '/';
        }
    }
    return out;
};

module.exports = { types, denied };
