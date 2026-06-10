<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

if (isset($_GET['data'])) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo '1';
    exit;
}

$log = __DIR__ . '/storage/aliveness.csv';
$rows = [];
if (is_file($log)) {
    foreach (file($log, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ln) {
        $cols = explode('|', $ln, 2);
        $rows[] = isset($cols[1]) ? trim($cols[1]) : '';
    }
}
?>
<!DOCTYPE html>
<html lang="la">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vigiliae</title>
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
<div class="container">
<div class="acta-card">
<p class="acta-body" id="vigiliae">Nulla adhuc vigilia.</p>
</div>
</div>
<script src="/assets/js/time.js"></script>
<script>
(function () {
    var rows = <?php echo json_encode($rows); ?>;
    var el = document.getElementById('vigiliae');
    var TOL = 10, LIVE = 500;

    function show(p) { try { return p.toString(); } catch (e) { return p.year + ' ' + p.month + '/' + p.day + ' ' + p.hr + ':' + p.min + ':' + p.sec + ' ' + p.ampm; } }
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
        var fmt = (shown.length === 1) ? ' ' + shown[0] : ' : ' + fmtList(shown);
        return ' cum ' + noun + ' circa' + fmt;
    }

    var intervals = [];
    var cur = null, prevPresent = null;
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
    if (!intervals.length) { return; }

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
    el.textContent = parts.join('; ') + '.';
})();
</script>
</body>
</html>
