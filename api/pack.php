<?php

require_once __DIR__ . '/../integritie.php'; integritie_gate(__FILE__);

function pack_refuse($code) {
    http_response_code($code);
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['error' => 'No.']);
    exit;
}

function pack_num($v) {
    $b = '';
    do {
        $b .= chr($v & 0xFF);
        $v >>= 8;
    } while ($v > 0);
    return $b;
}

function pack_dummy($hash) {
    $iv = substr(hash('sha256', $hash . '_iv', true), 0, 12);
    $ctrIv = substr(hash('sha256', $hash . '_iv_crypto', true), 0, 16);
    $key = hash('sha256', $hash . '_key', true);
    return $iv . openssl_encrypt(str_repeat("\0", 4112), 'aes-256-ctr', $key, OPENSSL_RAW_DATA, $ctrIv);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pack_refuse(405);
}

require_once __DIR__ . '/../ratelimit.php';
rl_enforce('pack', 30);

$in = json_decode(file_get_contents('php://input'), true);
$hashes = (is_array($in) && isset($in['hashes']) && is_array($in['hashes'])) ? array_values($in['hashes']) : [];
$count = count($hashes);
if ($count < 1 || $count > 17000) {
    pack_refuse(400);
}

$seen = [];
foreach ($hashes as $h) {
    if (!is_string($h) || !preg_match('/^[a-f0-9]{64}\z/', $h) || isset($seen[$h])) {
        pack_refuse(400);
    }
    $seen[$h] = true;
}

$slot = null;
for ($i = 0; $i < 8; $i++) {
    $fh = @fopen(__DIR__ . '/../storage/pack-slot-' . $i, 'c');
    if ($fh && flock($fh, LOCK_EX | LOCK_NB)) {
        $slot = $fh;
        break;
    }
    if ($fh) {
        fclose($fh);
    }
}
if (!$slot) {
    header('Retry-After: 5');
    pack_refuse(503);
}

require_once __DIR__ . '/../db.php';
$db = getDb();
$stmt = $db->prepare('SELECT offset, length FROM chunks WHERE hash = ?');

$entries = [];
$bodyLen = 0;
foreach ($hashes as $h) {
    $stmt->execute([$h]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && (int)$row['length'] > 48) {
        $entries[] = [$h, (int)$row['offset'] + 36, (int)$row['length'] - 36];
    } else {
        $entries[] = [$h, -1, 12 + 4112];
    }
    $bodyLen += $entries[count($entries) - 1][2];
}
$stmt->closeCursor();

$PI = hex2bin('243F6A8885A308D313198A2E');
$PHI = hex2bin('9E3779B97F4A7C15F39CC060');
$head = "\x00" . $PHI;
$datum = "\x01" . $PHI;

$t2 = '';
foreach ($entries as $e) {
    $t2 .= $head . $e[0] . $datum . pack_num($e[2]) . $datum . $datum . $e[0] . $datum;
}

$start = 0;
do {
    $previous = $start;
    $t1 = '';
    $address = $previous;
    foreach ($entries as $e) {
        $t1 .= $head . $e[0] . $datum . pack_num($address);
        $address += $e[2];
    }
    $header = 'V31NSPACKFORMAT' . $PI . $t1 . $PI . $t2 . $PI;
    $start = strlen($header);
} while ($start !== $previous);

$total = strlen($header) + $bodyLen + 16;

$from = 0;
$range = isset($_SERVER['HTTP_RANGE']) ? $_SERVER['HTTP_RANGE'] : '';
if ($range !== '') {
    if (!preg_match('/^bytes=(\d{1,15})-\z/', $range, $m) || (int)$m[1] >= $total) {
        header('Content-Range: bytes */' . $total);
        pack_refuse(416);
    }
    $from = (int)$m[1];
}

while (ob_get_level() > 0) {
    ob_end_clean();
}
set_time_limit(0);

header('Content-Type: application/octet-stream');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Accept-Ranges: bytes');
if ($from > 0) {
    http_response_code(206);
    header('Content-Range: bytes ' . $from . '-' . ($total - 1) . '/' . $total);
}
header('Content-Length: ' . ($total - $from));

$pos = 0;
$sent = 0;
$out = function ($bytes) use (&$pos, &$sent, $from) {
    $len = strlen($bytes);
    if ($pos + $len > $from) {
        $chunk = $pos >= $from ? $bytes : substr($bytes, $from - $pos);
        echo $chunk;
        $sent += strlen($chunk);
    }
    $pos += $len;
};

$STALL_WINDOW = 30;
$STALL_MIN_BYTES = 64 * 1024;
$windowStart = microtime(true);
$windowSent = 0;

$crc = hash_init('crc32b');
hash_update($crc, $header);
$out($header);

$slug = @fopen(__DIR__ . '/../storage/slug.v31n', 'rb');
foreach ($entries as $n => $e) {
    $bytes = '';
    if ($e[1] >= 0) {
        if ($slug && fseek($slug, $e[1]) === 0) {
            $read = fread($slug, $e[2]);
            $bytes = $read === false ? '' : $read;
        }
        if (strlen($bytes) < $e[2]) {
            $bytes = str_pad($bytes, $e[2], "\0");
        }
    } else {
        $bytes = pack_dummy($e[0]);
    }
    hash_update($crc, $bytes);
    $out($bytes);
    if ($n % 8 === 7) {
        flush();
        if (connection_aborted()) {
            exit;
        }
        $elapsed = microtime(true) - $windowStart;
        if ($elapsed >= $STALL_WINDOW) {
            if ($sent - $windowSent < $STALL_MIN_BYTES) {
                exit;
            }
            $windowStart = microtime(true);
            $windowSent = $sent;
        }
    }
}
if ($slug) {
    fclose($slug);
}

hash_update($crc, $PI);
$out($PI . strrev(hash_final($crc, true)));
flush();

flock($slot, LOCK_UN);
fclose($slot);
