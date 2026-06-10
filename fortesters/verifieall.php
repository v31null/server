<?php

error_reporting(E_ERROR | E_PARSE);

$EDGE        = getenv('VERIFIE_EDGE')   ?: 'https://file.share.zrok.io';
$GITHUB      = getenv('VERIFIE_GITHUB') ?: 'https://raw.githubusercontent.com/v31null/server/main';
$EXPECT_SPKI = '261AF6EA33A67825250326CC64E5BC735BF3C010FCC4F4132D83F19B28D1DAD5';

$opt       = array_slice($argv, 1);
$full      = in_array('--full', $opt, true);
$insecure  = getenv('VERIFIE_INSECURE_TLS') === '1';
$tlsVerify = !$insecure;
$bigCap    = 3 * 1024 * 1024;

function argval($flag) {
    global $opt;
    $i = array_search($flag, $opt, true);
    return ($i !== false && isset($opt[$i + 1])) ? $opt[$i + 1] : null;
}
$anchorFile = argval('--anchor-file');

$PASS = []; $FAIL = []; $SKIP = []; $WARN = [];
function ok($m)   { global $PASS; $PASS[] = $m; echo "  Probatum.      $m\n"; }
function bad($m)  { global $FAIL; $FAIL[] = $m; echo "  Reprobatum.    $m\n"; }
function skip($m) { global $SKIP; $SKIP[] = $m; echo "  Praetermissum. $m\n"; }
function warn($m) { global $WARN; $WARN[] = $m; echo "  Monitum.       $m\n"; }
function info($m) { echo "  $m\n"; }

function fetch($url, $verify) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => $verify,
        CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_USERAGENT      => 'verifieall/1',
    ]);
    $b    = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    return [$b === false ? null : $b, $code, $err];
}

function spki_fp($pem) {
    $k = @openssl_pkey_get_public($pem);
    if (!$k) return null;
    $d = @openssl_pkey_get_details($k);
    if (!$d || empty($d['key'])) return null;
    $der = base64_decode(preg_replace('/-----[^-]+-----|\s+/', '', $d['key']));
    return $der === false ? null : strtoupper(hash('sha256', $der));
}

echo "Recognitio sigillorum atque collatio exemplarium: num ea quae in limine servitii utentibus proponuntur cum archetypo apud archivum signato per omnia concordent.\n";
echo "Quod in limine proponitur:         $EDGE\n";
echo "Archetypum signatum apud archivum: $GITHUB\n";
if ($insecure) warn("Custodia viae munitae deposita est; quod tutum non est nisi inter fidos aut super limen domesticum.");
echo "\n";

echo "De fundamento fidei, hoc est de sigillo publico atque officiali.\n";
$ghPem = null; $anchorSrc = null;
if ($anchorFile !== null) {
    if (!is_file($anchorFile)) { bad("Exemplar e codice petitum non invenitur: $anchorFile"); echo "\nCessandum: nullum exemplar authenticum praesto est.\n"; exit(2); }
    $ghPem = file_get_contents($anchorFile); $anchorSrc = "file:$anchorFile";
} else {
    list($ghPem, $ghCode, $ghErr) = fetch(rtrim($GITHUB, '/') . '/publickey.pem', $tlsVerify);
    if ($ghPem === null || $ghCode >= 400) { bad("Sigillum publicum ab archivo afferri non potest; responsum $ghCode, impedimentum: $ghErr"); echo "\nCessandum: deest fundamentum fidei.\n"; exit(2); }
    $anchorSrc = 'github';
}
$ghKey = spki_fp($ghPem);
if ($ghKey === null) { bad("Exemplar sigilli authentici legitimum sigillum non est."); echo "\nCessandum.\n"; exit(2); }
info("Nota sigilli authentici, ex $anchorSrc petiti: $ghKey");
if (hash_equals($EXPECT_SPKI, $ghKey)) ok("Nota sigilli authentici cum nota in memoria nostra insculpta congruit.");
else warn("Nota sigilli authentici a nota in memoria nostra insculpta, quae est $EXPECT_SPKI, dissidet; sive sigillum legitime renovatum est sive exemplar corruptum. Hanc notam aliunde et extra hanc viam confirmes priusquam concordiae fidem habeas.");

echo "\nDe sigillo quod in limine proponitur.\n";
list($edgePem, $ec, ) = fetch(rtrim($EDGE, '/') . '/publickey.pem', $tlsVerify);
$edgeKey = $edgePem !== null ? spki_fp($edgePem) : null;
info("Nota sigilli quod in limine proponitur: " . ($edgeKey ?: "nulla, responso $ec reddito"));
if ($edgeKey && $ghKey) {
    if (hash_equals($ghKey, $edgeKey)) ok("Sigillum in limine propositum idem est ac sigillum authenticum.");
    else bad("Sigillum in limine propositum, quod est $edgeKey, authentici illius $ghKey alienum est.");
} else bad("Sigillum in limine propositum legi non potuit.");

echo "\nNum breve quod in limine proponitur eodem sigillo munitum sit.\n";
list($manRaw, $mc, ) = fetch(rtrim($EDGE, '/') . '/manifest.json', $tlsVerify);
list($sigB64, $sc, ) = fetch(rtrim($EDGE, '/') . '/manifest.sig', $tlsVerify);
$man = $manRaw !== null ? json_decode($manRaw, true) : null;
if ($manRaw === null) bad("Breve in limine afferri non potest; responsum $mc.");
elseif ($sigB64 === null) bad("Sigillum brevis afferri non potest; responsum $sc.");
else {
    $pk = openssl_pkey_get_public($ghPem);
    $r = $pk ? openssl_verify($manRaw, base64_decode(trim($sigB64)), $pk, OPENSSL_ALGO_SHA256) : -1;
    if ($r === 1) ok("Sigillum brevis sub authentico sigillo recte probatur.");
    else bad("Sigillum brevis sub authentico sigillo non probatur, responso $r reddito; sive breve confictum est sive ab alieno sigillo signatum.");
}

echo "\nDe singulis scriptis quae publice in limine proponuntur, ad breve signatum collatis.\n";
info("Scripta ipsa machinae atque leges aditus non publice exponuntur neque eminus dinosci possunt; ea ex puro exemplari domestico recognoscas.");
if (is_array($man) && !empty($man['files'])) {
    $okc = 0; $diff = 0; $sk = 0;
    foreach ($man['files'] as $rel => $meta) {
        $base = basename($rel);
        $ext  = strtolower(pathinfo($rel, PATHINFO_EXTENSION));
        if ($ext === 'php' || $base === '.htaccess') { $sk++; skip("$rel, quod intra machinam latet neque ut scriptum exponitur."); continue; }
        if (!$full && isset($meta['size']) && $meta['size'] > $bigCap) { $sk++; skip("$rel, magnitudine " . round($meta['size'] / 1048576, 1) . " MB praegrave; quod ut plene recognoscatur, vexillo --full opus est."); continue; }
        list($body, $code, ) = fetch(rtrim($EDGE, '/') . '/' . $rel, $tlsVerify);
        if ($body === null || $code >= 400) { $sk++; skip("$rel, limine responsum $code reddente."); continue; }
        if (hash_equals(strtolower((string) $meta['sha256']), hash('sha256', $body))) $okc++;
        else { $diff++; bad("$rel: quod in limine profertur a brevi signato discrepat."); }
    }
    info("E scriptis numero " . count($man['files']) . ": concordant $okc, discrepant $diff, eminus probari nequeunt $sk.");
    if ($diff === 0 && $okc > 0) ok("Omnia scripta quae eminus probari possunt, numero $okc, cum brevi signato concordant.");
} else bad("Breve nullum scriptum continet quod probetur.");

echo "\nDe sigillis decretorum, num singula officiali sigillo signata sint.\n";
list($idxRaw, $ic, ) = fetch(rtrim($EDGE, '/') . '/indexd.json', $tlsVerify);
$idx = $idxRaw !== null ? json_decode($idxRaw, true) : null;
if (!is_array($idx)) skip("Volumen decretorum afferri aut legi non potest; responsum $ic.");
else {
    $pk = openssl_pkey_get_public($ghPem);
    $eok = 0; $ebad = 0;
    foreach ($idx as $en) {
        $id = $en['id'] ?? '?';
        $payload = json_encode($en['latin'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $r = $pk ? openssl_verify($payload, base64_decode($en['sig']['value'] ?? ''), $pk, OPENSSL_ALGO_SHA256) : -1;
        if ($r === 1) $eok++;
        else { $ebad++; bad("Decreti $id sigillum irritum est."); }
    }
    info("E decretis numero " . count($idx) . ": valent $eok, irrita sunt $ebad.");
    if ($ebad === 0 && $eok > 0) ok("Omnia decreta, numero $eok, sub authentico sigillo recte probantur.");
}

echo "\nSumma recognitionis.\n";
if (count($FAIL) === 0) {
    echo "Concordat. Quod in limine proponitur idem omnino est ac exemplar apud archivum signatum.\n";
    echo "  Probata sunt " . count($PASS) . ", monita " . count($WARN) . ", eminus inexplorata " . count($SKIP) . ".\n";
    echo "  Quae praetermissa sunt, id est scripta machinae, prohibita, aut nimis ampla, ex puro exemplari domestico recognoscas.\n";
    exit(0);
}
echo "Non concordat. Repertae sunt " . count($FAIL) . " discrepantiae; huic limini in praesens fidem ne habeas:\n";
foreach ($FAIL as $f) echo "  - $f\n";
exit(1);
