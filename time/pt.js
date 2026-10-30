const propertime = require('../assets/js/time.js');

const [op, n, unit] = process.argv.slice(2);
let out = {};

if (op === 'day') {
    const p = propertime();
    out = { key: propertime(p.year + p.month + p.day + '000101AM').toSortKey() };
}

if (op === 'now') {
    out = { key: propertime().toSortKey() };
}

if (op === 'add') {
    out = { key: propertime().add(parseInt(n, 10), unit).toSortKey() };
}

process.stdout.write(JSON.stringify(out));
