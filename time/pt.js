const propertime = require('../assets/js/time.js');

const [op] = process.argv.slice(2);
let out = {};

if (op === 'day') {
    const p = propertime();
    out = { key: propertime(p.year + p.month + p.day + '000101AM').toSortKey() };
}

process.stdout.write(JSON.stringify(out));
