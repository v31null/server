<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/lib/pack.php';
require __DIR__ . '/lib/index.php';
require __DIR__ . '/lib/settings.php';
require __DIR__ . '/lib/take.php';

$name = $argv[1] ?? '';
$skip = array_slice($argv, 2);
if (!preg_match('/^[A-Za-z0-9_-]+$/', $name)) {
    fwrite(STDERR, "usage: php v31np/build.php <name> [skip pattern ...]\n");
    exit(1);
}
$root = dirname(__DIR__);
$secret = V31nIndex::secret();

$lib = __DIR__ . '/lib/';
$key = $secret === null ? '' : strtoupper(bin2hex(sodium_crypto_sign_publickey_from_secretkey($secret)));
$js = 'const V31N_TABLES = ' . trim(file_get_contents($lib . 'tables.json')) . ";\n"
    . 'const V31N_KEY = (k => /^[0-9A-Fa-f]{64}$/.test(k) ? k.toUpperCase() : \'' . $key . '\')(String((document.currentScript && document.currentScript.dataset.key) || \'\'));' . "\n";
foreach (['sha256.js', 'order.js', 'pack.js', 'sync.js', 'show.js'] as $f) {
    $js .= file_get_contents($lib . $f);
}
$temp = __DIR__ . '/v31np.js.' . bin2hex(random_bytes(8)) . '.tmp';
if (file_put_contents($temp, $js) !== strlen($js) || !rename($temp, __DIR__ . '/v31np.js')) {
    fwrite(STDERR, "v31np.js write failed\n");
    exit(1);
}

$file = $root . '/' . V31nIndex::KEY;
$index = V31nIndex::load($file) ?? (is_file($file) ? null : V31nIndex::create($file, '.'));
if ($index === null) {
    fwrite(STDERR, "broken index\n");
    exit(1);
}
$types = v31np_types(v31np_settings($name));
$rules = [];
$take = function (string $key) use ($skip, $types, $root, &$rules): bool {
    if ($key === V31nIndex::KEY || str_starts_with($key, 'v31np/') || in_array('node_modules', explode('/', $key), true) || !in_array(strtolower(pathinfo($key, PATHINFO_EXTENSION)), $types, true)
        || v31np_denied($root, $key, $rules)) {
        return false;
    }
    foreach ($skip as $pattern) {
        if (fnmatch($pattern, $key, FNM_PATHNAME)) {
            return false;
        }
    }
    return true;
};
$index->scan($take, $secret !== null);
if (!$index->save()) {
    fwrite(STDERR, "index save failed\n");
    exit(1);
}
$rows = [];
foreach ($index->keys() as $k) {
    $rows[$k] = $index->fresh($k, $secret !== null);
}
$entry = $index->entry($rows, $secret);
$keys = array_merge($index->keys(), [V31nIndex::KEY]);
usort($keys, [V31nOrder::class, 'key']);
$items = [];
foreach ($keys as $k) {
    $items[] = [$k, $k === V31nIndex::KEY ? strlen($entry) : $rows[$k]['size']];
}
$head = V31nPack::head(V31nPack::MAGIC, $items);

$pre = __DIR__ . '/pre/';
if (!is_dir($pre) && !mkdir($pre, 0777, true)) {
    fwrite(STDERR, "no pre folder\n");
    exit(1);
}
$target = $pre . $name . '.v31np';
$temp = $target . '.' . bin2hex(random_bytes(8)) . '.tmp';
$out = fopen($temp, 'wb');
$ctx = hash_init('crc32b');
$put = function (string $bytes) use ($out, $ctx): void {
    if (fwrite($out, $bytes) !== strlen($bytes)) {
        throw new RuntimeException('write');
    }
    hash_update($ctx, $bytes);
};
$info = ['files' => []];
$at = strlen($head);
$put($head);
foreach ($keys as $k) {
    if ($k === V31nIndex::KEY) {
        $put($entry);
        $size = strlen($entry);
        $crc = V31nPack::hex(crc32($entry));
    } else {
        $size = $rows[$k]['size'];
        $crc = $rows[$k]['crc'];
        $in = fopen($index->path($k), 'rb');
        $left = $size;
        while ($left > 0) {
            $chunk = fread($in, min(4194304, $left));
            if ($chunk === false || $chunk === '') {
                throw new RuntimeException('read ' . $k);
            }
            $put($chunk);
            $left -= strlen($chunk);
        }
        fclose($in);
    }
    $info['files'][] = ['key' => $k, 'at' => $at, 'size' => $size, 'crc' => $crc];
    $at += $size;
}
$put(V31nPack::PI);
$sum = hexdec(hash_final($ctx));
fwrite($out, pack('V', $sum));
fclose($out);
if (!rename($temp, $target)) {
    fwrite(STDERR, "rename failed\n");
    exit(1);
}
$info = ['crc' => V31nPack::hex($sum)] + $info;
file_put_contents($pre . $name . '.json', json_encode($info, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
echo $name, '.v31np ', $at + V31nPack::FOOT, ' bytes, ', count($keys), ' files, crc ', $info['crc'], $secret !== null ? ', signed' : '', "\n";
