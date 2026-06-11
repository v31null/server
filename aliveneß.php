<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

if (isset($_GET['data'])) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo '1';
    exit;
}

$log = __DIR__ . '/storage/aliveness.csv';
$zrok = [];
$onion = [];
if (is_file($log)) {
    foreach (file($log, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ln) {
        $cols = explode('|', $ln);
        $zrok[]  = isset($cols[1]) ? trim($cols[1]) : '';
        $onion[] = isset($cols[2]) ? trim($cols[2]) : '';
    }
}
?>
<!DOCTYPE html>
<html lang="la">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vigiliae</title>
<link rel="stylesheet" href="/assets/css/style.css" integrity="sha384-I5BMPe0ktzGjaqQYJ19HI1oB3RSwRyOXnmDe5KskEjfaTpuABzvRv4N5r2VvKswI">
</head>
<body>
<div class="container">
<div class="acta-card">
<p class="acta-body" id="vigiliae-onion">De viis nostris propriis, quas regimus :‍— Acta earum sic se habent — Tempora apertionis earum ; <span id="vigiliae-onion-body">Nulla adhuc vigilia.</span></p>
</div>
<div class="acta-card">
<p class="acta-body" id="vigiliae">Nulla adhuc vigilia.</p>
</div>
<div class="acta-card">
<p class="acta-body"><a href="https://stats.uptimerobot.com/Y1UqdausP4/803270927">Hiis qui probare voluerint</a></p>
</div>
</div>
<script src="/assets/js/time.js"></script>
<script>
(function () {
    var zrokRows = <?php echo json_encode($zrok); ?>;
    var onionRows = <?php echo json_encode($onion); ?>;
    var TOL = 10, LIVE = 500;

    function show(p) {
        var s;
        try { s = p.toString(); } catch (e) { s = p.year + ' ' + p.month + '/' + p.day + ' ' + p.hr + ':' + p.min + ':' + p.sec + ' ' + p.ampm; }
        return s.replace(/(20\d{2})\s/g, '$1 ');
    }
    function epoch(p) {
        var h = parseInt(p.hr, 10);
        if (p.ampm === 'PM') { h += 12; }
        return Date.UTC(parseInt(p.year, 10), parseInt(p.month, 10) - 1, parseInt(p.day, 10), h, parseInt(p.min, 10) - 1, parseInt(p.sec, 10) - 1) / 1000;
    }
    function fmtList(items) {
        var NBSP = ' ', L = '⸄', R = '⸅';
        if (items.length === 1) { return items[0]; }
        if (items.length === 2) { return L + NBSP + items[0] + NBSP + '&' + NBSP + items[1] + NBSP + R; }
        var head = items.slice(0, items.length - 1);
        var last = items[items.length - 1];
        return L + NBSP + head.join(NBSP + ', ') + NBSP + ',' + NBSP + '&' + NBSP + last + NBSP + R;
    }
    function instab(list) {
        if (!list.length) { return ''; }
        var noun = (list.length === 1) ? 'instabilitate' : 'instabilitatibus';
        var shown = list.map(show);
        var fmt = (shown.length === 1) ? ' ' + shown[0] : ' : ' + fmtList(shown);
        return ' cum ' + noun + ' circa' + fmt;
    }

    function buildIntervals(rows) {
        var intervals = [], cur = null, prevPresent = null;
        for (var i = 0; i < rows.length; i++) {
            var s = rows[i];
            if (s === '') {
                if (cur) { intervals.push(cur); cur = null; prevPresent = null; }
                continue;
            }
            var pt;
            try { pt = propertime(s); } catch (e) { continue; }
            if (!cur) {
                cur = { from: pt, to: pt, unstable: [] };
            } else {
                var expected = prevPresent.add(300, 'SEC');
                if (Math.abs(epoch(pt) - epoch(expected)) > TOL) { cur.unstable.push(pt); }
                cur.to = pt;
            }
            prevPresent = pt;
        }
        if (cur) { intervals.push(cur); }
        return intervals;
    }

    function renderProse(rows) {
        var intervals = buildIntervals(rows);
        if (!intervals.length) { return null; }
        var now = null;
        try { now = propertime(); } catch (e) {}
        var lastRowPresent = rows.length > 0 && rows[rows.length - 1] !== '';
        var parts = [];
        for (var k = 0; k < intervals.length; k++) {
            var iv = intervals[k];
            var lead = (k === 0) ? 'Vigil ab ' : 'dehinc ab ';
            var open = (k === intervals.length - 1) && lastRowPresent && now && (epoch(now) - epoch(iv.to) <= LIVE);
            var base = open ? (lead + show(iv.from) + ' adhuc') : (lead + show(iv.from) + ' usque ad ' + show(iv.to));
            parts.push(base + instab(iv.unstable));
        }
        return parts.join('; ') + '.';
    }

    var zp = renderProse(zrokRows);
    if (zp !== null) { document.getElementById('vigiliae').textContent = zp; }
    var op = renderProse(onionRows);
    if (op !== null) { document.getElementById('vigiliae-onion-body').textContent = op; }
})();
</script>
</body>
</html>
