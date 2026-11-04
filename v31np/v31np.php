<?php
require __DIR__ . '/lib/pack.php';
require __DIR__ . '/lib/ranges.php';
require __DIR__ . '/lib/settings.php';

set_time_limit(0);
header('Cache-Control: no-store');
$name = $_GET['name'] ?? '';
$pre = __DIR__ . '/pre/';
if (!preg_match('/^[A-Za-z0-9_-]+$/', $name) || !is_file($pre . $name . '.v31np') || !is_file($pre . $name . '.json')) {
    http_response_code(404);
    exit;
}
$archive = $pre . $name . '.v31np';
$info = json_decode(file_get_contents($pre . $name . '.json'), true);
$settings = v31np_settings($name);
header('ETag: "' . $info['crc'] . '"');

$member = (string)($_GET['key'] ?? '');
if ($member !== '') {
    require_once __DIR__ . '/lib/index.php';
    $entry = null;
    $listing = null;
    foreach ($info['files'] as $f) {
        if ($f['key'] === $member) {
            $entry = $f;
        }
        if ($f['key'] === V31nIndex::KEY) {
            $listing = $f;
        }
    }
    if ($entry === null || $member === V31nIndex::KEY) {
        http_response_code(404);
        exit;
    }
    if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
        http_response_code(405);
        header('Allow: GET, HEAD');
        exit;
    }
    $heads = [];
    if ($listing !== null) {
        $h = fopen($archive, 'rb');
        fseek($h, $listing['at']);
        $text = fread($h, $listing['size']);
        fclose($h);
        foreach (preg_split('/\r?\n/', $text) as $line) {
            $f = explode("\t", $line);
            if ($f[0] === 'H' && count($f) === 4 && V31nIndex::unescape($f[1]) === $member) {
                $heads[] = [V31nIndex::unescape($f[2]), V31nIndex::unescape($f[3])];
            }
        }
    }
    $types = ['mp3' => 'audio/mpeg', 'mp4' => 'video/mp4', 'webm' => 'video/webm', 'wav' => 'audio/wav', 'png' => 'image/png',
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'svg' => 'image/svg+xml', 'ico' => 'image/x-icon',
        'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'otf' => 'font/otf', 'css' => 'text/css; charset=utf-8',
        'js' => 'text/javascript; charset=utf-8', 'json' => 'application/json', 'txt' => 'text/plain; charset=utf-8'];
    $type = $types[strtolower(pathinfo($member, PATHINFO_EXTENSION))] ?? 'application/octet-stream';
    v31np_ranges($archive, $entry['at'], $entry['size'], $type, $entry['crc'], $heads);
}

$full = function () use ($archive) {
    header('Content-Type: application/v31np');
    header('Accept-Ranges: bytes');
    header('Content-Length: ' . filesize($archive));
    if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
        readfile($archive);
    }
    exit;
};

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET' || $method === 'HEAD') {
    v31np_ranges($archive, 0, filesize($archive), 'application/v31np', $info['crc']);
}
if ($method !== 'POST') {
    http_response_code(405);
    header('Allow: GET, HEAD, POST');
    exit;
}

if (strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0])) !== 'application/v31np') {
    http_response_code(415);
    exit;
}
$most = (function (string $v): int {
    $n = (int)$v;
    return match (strtoupper(substr(trim($v), -1))) { 'G' => $n << 30, 'M' => $n << 20, 'K' => $n << 10, default => $n };
})((string)ini_get('post_max_size'));
if ($most > 0 && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $most) {
    http_response_code(413);
    exit;
}
$broken = function () {
    http_response_code(422);
    exit;
};
$body = file_get_contents('php://input');
$outer = V31nPack::parse(V31nPack::MAGIC, $body);
if ($outer === null || count($outer['entries']) !== 1 || $outer['entries'][0][0] !== '') {
    $broken();
}
[, $at, $size] = $outer['entries'][0];
$inner = substr($body, $at, $size);
$ask = V31nPack::parse(V31nPack::ASK, $inner);
if ($ask === null) {
    $broken();
}
$client = [];
foreach ($ask['entries'] as [$key, $at, $size]) {
    $text = substr($inner, $at, $size);
    if ($size !== 8 || !preg_match('/^[0-9A-F]{8}$/', $text)) {
        $broken();
    }
    $client[$key] = $text;
}

$server = [];
foreach ($info['files'] as $f) {
    $server[$f['key']] = $f;
}
$list = function () use ($archive, $server) {
    $f = $server['v31np index.txt'] ?? null;
    if ($f === null) {
        http_response_code(500);
        exit;
    }
    $h = fopen($archive, 'rb');
    fseek($h, $f['at']);
    $bytes = fread($h, $f['size']);
    fclose($h);
    $answer = V31nPack::write(V31nPack::MAGIC, [['v31np index.txt', $bytes]]);
    header('HTTP/1.1 268 List');
    header('Content-Type: application/v31np');
    header('Content-Length: ' . strlen($answer));
    echo $answer;
    exit;
};

if (!$client) {
    if ($settings['empty'] === '268') {
        $list();
    }
    if ($settings['empty'] === '303') {
        header('Location: /v31np/pre/' . $name . '.v31np', true, 303);
        exit;
    }
    $full();
}

if ($settings['behind'] === '268') {
    $wanted = [];
    foreach ($client as $key => $crc) {
        if ($crc === '00000000') {
            $wanted[] = (string)$key;
        }
    }
    if ($wanted) {
        $own = $server['v31np index.txt'] ?? null;
        if ($own !== null && ($client['v31np index.txt'] ?? null) !== $own['crc'] && !in_array('v31np index.txt', $wanted, true)) {
            $wanted[] = 'v31np index.txt';
        }
        usort($wanted, [V31nOrder::class, 'key']);
        $items = [];
        $innerLength = 0;
        foreach ($wanted as $key) {
            $size = isset($server[$key]) ? $server[$key]['size'] + 1 : 1;
            $items[] = [$key, $size];
            $innerLength += $size;
        }
        $innerHead = V31nPack::head(V31nPack::PATCH, $items);
        $innerLength += strlen($innerHead) + V31nPack::FOOT;
        $outerHead = V31nPack::head(V31nPack::MAGIC, [['', $innerLength]]);
        header('HTTP/1.1 267 Re-sync');
        header('Content-Type: application/v31np');
        header('Content-Length: ' . (strlen($outerHead) + $innerLength + V31nPack::FOOT));
        $outer = hash_init('crc32b');
        $inner = hash_init('crc32b');
        $put = function (string $bytes, bool $both = true) use ($outer, $inner): void {
            echo $bytes;
            hash_update($outer, $bytes);
            if ($both) {
                hash_update($inner, $bytes);
            }
        };
        $put($outerHead, false);
        $put($innerHead);
        $h = fopen($archive, 'rb');
        foreach ($wanted as $key) {
            if (!isset($server[$key])) {
                $put("\x01");
                continue;
            }
            fseek($h, $server[$key]['at']);
            $left = $server[$key]['size'];
            while ($left > 0) {
                $chunk = fread($h, min(1048576, $left));
                if ($chunk === false || $chunk === '') {
                    exit;
                }
                $put($chunk);
                $left -= strlen($chunk);
            }
            $put("\x00");
            flush();
        }
        fclose($h);
        $put(V31nPack::PI);
        $put(pack('V', hexdec(hash_final($inner))), false);
        $put(V31nPack::PI, false);
        echo pack('V', hexdec(hash_final($outer)));
        exit;
    }
    if (isset($server['v31np index.txt']) && ($client['v31np index.txt'] ?? null) === $server['v31np index.txt']['crc']) {
        http_response_code(304);
        exit;
    }
    $list();
}
$changed = [];
foreach ($server as $key => $f) {
    if (($client[$key] ?? null) !== $f['crc']) {
        $changed[] = $key;
    }
}
$deleted = array_values(array_diff(array_map('strval', array_keys($client)), array_map('strval', array_keys($server))));
if (!$changed && !$deleted) {
    http_response_code(304);
    exit;
}
if ($settings['behind'] === '200') {
    $full();
}

$keys = array_merge($changed, $deleted);
usort($keys, [V31nOrder::class, 'key']);
$h = fopen($archive, 'rb');
$entries = [];
foreach ($keys as $key) {
    if (isset($server[$key])) {
        $f = $server[$key];
        $bytes = '';
        if ($f['size'] > 0) {
            fseek($h, $f['at']);
            $bytes = fread($h, $f['size']);
        }
        $entries[] = [(string)$key, $bytes . "\x00"];
    } else {
        $entries[] = [(string)$key, "\x01"];
    }
}
fclose($h);
$answer = V31nPack::write(V31nPack::MAGIC, [['', V31nPack::write(V31nPack::PATCH, $entries)]]);
header('HTTP/1.1 267 Re-sync');
header('Content-Type: application/v31np');
header('Content-Length: ' . strlen($answer));
echo $answer;
