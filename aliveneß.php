<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

if (isset($_GET['data'])) {
    header('Content-Type: text/plain; charset=UTF-8');
    echo '1';
    exit;
}

$log = __DIR__ . '/storage/aliveness.csv';
$left = [];
$zrok = [];
$onion = [];
if (is_file($log)) {
    foreach (file($log, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ln) {
        $cols = explode('|', $ln);
        $left[]  = isset($cols[0]) ? trim($cols[0]) : '';
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
<link rel="stylesheet" href="/assets/css/style.css" integrity="sha384-XpkoMdA/xoiIJJhPMyhyUBtAxGFjk9vhCWO7HvJc91DvTA3ym/iJOLd7nHJRWcxE">
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
<div class="acta-header">
<p class="acta-intitulatio">Summa</p>
</div>
<p class="acta-inscriptio">Notum sit lectori huius rationis quae infra sequitur : vigiliam explorationem dicimus, statis temporibus per limen publicum emissam, quae an machina nostra respondeat inquirit. Exploratio quae machinam praesentem invenit prospera vocatur ; quae vacua redit, cassa. Ideo subicimus quot explorationes emissae sint, quot prosperae, quot cassae.</p>
<p class="acta-body" id="summa-publica">Nulla adhuc summa.</p>
<p class="acta-body" id="summa-propria">Summa viae nostrae propriae, non publicae;<span id="summa-propria-body">Nulla adhuc summa.</span></p>
</div>
<div class="acta-card">
<p class="acta-body"><a href="https://stats.uptimerobot.com/Y1UqdausP4/803270927">Hiis qui probare voluerint</a></p>
</div>
</div>
<script src="/assets/js/time.js"></script>
<script>
(function () {
    var leftRows = <?php echo json_encode($left); ?>;
    var zrokRows = <?php echo json_encode($zrok); ?>;
    var onionRows = <?php echo json_encode($onion); ?>;
    var TOL = 10, LIVE = 500, PERIOD = 300, SLACK = 60, BREAK = 600, JIT = 2, MAXGAP = 3600;

    function show(p) { try { return p.toString(); } catch (e) { return p.year + ' ' + p.month + '⁄' + p.day + ' ' + p.hr + ':' + p.min + ':' + p.sec + ' ' + p.ampm; } }
    function key(p) { return p.year + p.month + p.day + p.hr + p.min + p.sec + p.ampm; }
    function gapSec(a, b, max) {
        var kb = key(b);
        for (var d = 0; d <= max; d++) { if (key(a.add(d, 'SEC')) === kb) { return d; } }
        return -1;
    }
    function isRestart(a, b) {
        var g = gapSec(a, b, MAXGAP);
        if (g < 0) { return true; }
        var k = Math.round(g / PERIOD);
        if (k <= 1) { return false; }
        return Math.abs(g - k * PERIOD) > TOL + (k - 1) * JIT;
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
                var g = gapSec(prevPresent, pt, BREAK - 1);
                if (g < 0) {
                    intervals.push(cur);
                    cur = { from: pt, to: pt, unstable: [] };
                } else {
                    if (g < PERIOD - TOL || g > PERIOD + SLACK) { cur.unstable.push(pt); }
                    cur.to = pt;
                }
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
            var open = (k === intervals.length - 1) && lastRowPresent && now && gapSec(iv.to, now, LIVE) >= 0;
            var base = open ? (lead + show(iv.from) + ' adhuc') : (lead + show(iv.from) + ' usque ad ' + show(iv.to));
            parts.push(base + instab(iv.unstable));
        }
        return parts.join('; ') + '.';
    }

    function uncia(n) {
        return ['nihil', 'uncia', 'sextans', 'quadrans', 'triens', 'quincunx', 'semis', 'septunx', 'bes', 'dodrans', 'dextans', 'deunx', 'as'][n];
    }
    function summaItem(run) {
        var expected = run.reached + run.before;
        var n = (run.before <= 0) ? 12 : Math.min(11, Math.max(0, Math.round((run.reached / expected) * 12)));
        return 'Vigilatum ab ' + show(run.start) + ' statis temporibus. ' +
               'Ex explorationibus ' + expected + ', prosperae ' + run.reached + ', cassae ' + run.before + '. ' +
               'Ex asse, ' + uncia(n) + '.';
    }
    function renderSumma(left, chan) {
        var n = left.length, firstPresent = -1;
        for (var i = 0; i < n; i++) { if (chan[i] !== '') { firstPresent = i; break; } }
        if (firstPresent < 0) { return null; }
        var items = [], run = null, prevLeft = null, totR = 0, totB = 0;
        for (var i = 0; i < n; i++) {
            var lt;
            try { lt = propertime(left[i]); } catch (e) { continue; }
            var restarted = (prevLeft !== null) && isRestart(prevLeft, lt);
            prevLeft = lt;
            if (i < firstPresent) { continue; }
            if (run === null) {
                run = { start: lt, reached: 0, before: 0 };
            } else if (restarted) {
                items.push(summaItem(run));
                run = { start: lt, reached: 0, before: 0 };
            }
            if (chan[i] !== '') { run.reached++; totR++; } else { run.before++; totB++; }
        }
        if (run) { items.push(summaItem(run)); }
        if (!items.length) { return null; }
        var tot = totR + totB;
        var en = (totB <= 0) ? 12 : Math.min(11, Math.max(0, Math.round((totR / tot) * 12)));
        return items.join(' ').replace(/\.$/, '') + '; in pleno, cassae ' + totB + ', prosperae reliquae ' + totR + ', ex asse, ' + uncia(en) + '.';
    }

    var zp = renderProse(zrokRows);
    if (zp !== null) { document.getElementById('vigiliae').textContent = zp; }
    var op = renderProse(onionRows);
    if (op !== null) { document.getElementById('vigiliae-onion-body').textContent = op; }
    var sp = renderSumma(leftRows, zrokRows);
    if (sp !== null) { document.getElementById('summa-publica').textContent = sp; }
    var so = renderSumma(leftRows, onionRows);
    if (so !== null) { document.getElementById('summa-propria-body').textContent = so; }
})();
</script>
</body>
</html>
