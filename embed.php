<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/ratelimit.php';

$id = isset($_GET['id']) ? $_GET['id'] : '';
$pass = isset($_GET['PASS']) ? $_GET['PASS'] : '';

if (!preg_match('/^[a-f0-9]{8}$/', $id) || empty($pass)) {
    http_response_code(404);
    exit;
}

$db = getDb();

$cacheDir = __DIR__ . '/storage/allreadydecoden';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}

$cacheKey = hash('sha256', $id . $pass);
$cacheFile = $cacheDir . '/' . $cacheKey;

if (file_exists($cacheFile) && file_exists($cacheFile . '.meta')) {
    $meta = json_decode(file_get_contents($cacheFile . '.meta'), true);
    serveFile($cacheFile, $meta['mime'], $id, $meta);
    exit;
}

rl_enforce('embed', 10);

$mapStmt = $db->prepare('SELECT encrypted_payload, payload_iv, salt FROM maps WHERE file_id = ?');
$mapStmt->execute([$id]);
$mapData = $mapStmt->fetch(PDO::FETCH_ASSOC);

if (!$mapData) {
    http_response_code(404);
    exit;
}

$claimStmt = $db->prepare('INSERT OR IGNORE INTO embed_bans (file_id, banned_at) VALUES (?, ?)');
$claimStmt->execute([$id, time()]);
if ($claimStmt->rowCount() === 0) {
    header('Location: /v/' . $id);
    exit;
}

$salt = base64_decode($mapData['salt']);
$payloadIv = base64_decode($mapData['payload_iv']);
$encPayload = base64_decode($mapData['encrypted_payload']);

$key = hash_pbkdf2('sha256', $pass, $salt, 600000, 32, true);

$ciphertext = substr($encPayload, 0, -16);
$tag = substr($encPayload, -16);

$decryptedPayload = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $payloadIv, $tag);

$payloadObj = null;
if ($decryptedPayload !== false) {
    $payloadObj = json_decode($decryptedPayload, true);
}

if (!$payloadObj || !isset($payloadObj['map'])) {
    header('Content-Type: image/jpeg');
    header('X-Content-Type-Options: nosniff');
    if ($decryptedPayload !== false) {
        echo $decryptedPayload;
    } else {
        echo random_bytes(256);
    }
    exit;
}

$db->prepare('DELETE FROM embed_bans WHERE file_id = ?')->execute([$id]);

$slugPath = __DIR__ . '/storage/slug.v31n';
$slugHandle = fopen($slugPath, 'rb');
if (!$slugHandle) {
    http_response_code(500);
    exit;
}

$chunkStmt = $db->prepare('SELECT offset, length FROM chunks WHERE hash = ?');

$tmpCacheFile = $cacheFile . '.tmp';
$outHandle = fopen($tmpCacheFile, 'wb');

foreach ($payloadObj['map'] as $item) {
    $chunkId = $item['id'];
    $chunkKey = hex2bin($item['key']);

    $chunkStmt->execute([$chunkId]);
    $entry = $chunkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$entry) {
        fclose($outHandle);
        fclose($slugHandle);
        unlink($tmpCacheFile);
        http_response_code(500);
        exit;
    }

    fseek($slugHandle, $entry['offset']);
    $raw = fread($slugHandle, $entry['length']);

    $dataLength = unpack('N', substr($raw, 32, 4))[1];
    $iv = substr($raw, 36, 12);
    $data = substr($raw, 48, $dataLength);

    $chunkCiphertext = substr($data, 0, -16);
    $chunkTag = substr($data, -16);

    $decryptedChunk = openssl_decrypt($chunkCiphertext, 'aes-256-gcm', $chunkKey, OPENSSL_RAW_DATA, $iv, $chunkTag);
    if ($decryptedChunk !== false) {
        fwrite($outHandle, $decryptedChunk);
    }
}

fclose($outHandle);
fclose($slugHandle);

rename($tmpCacheFile, $cacheFile);

$meta = [
    'mime' => $payloadObj['mime'],
    'name' => isset($payloadObj['name']) ? $payloadObj['name'] : 'file'
];
file_put_contents($cacheFile . '.meta', json_encode($meta));

serveFile($cacheFile, $payloadObj['mime'], $id, $meta);


function serveFile($filePath, $mime, $fileId, $meta) {
    if (isset($_GET['dl']) && $_GET['dl'] === '1') {
        $fileName = isset($meta['name']) ? $meta['name'] : 'file';
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . addslashes($fileName) . '"');
        header('Content-Length: ' . filesize($filePath));
        header('X-Content-Type-Options: nosniff');
        readfile($filePath);
        exit;
    }

    if (isSafeMime($mime)) {
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: public, max-age=31536000');
        header('X-Content-Type-Options: nosniff');
        header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'");
        readfile($filePath);
    } else {
        $fileName = isset($meta['name']) ? $meta['name'] : 'file';
        $safeName = htmlspecialchars($fileName, ENT_QUOTES, 'UTF-8');
        $currentUrl = $_SERVER['REQUEST_URI'];
        $dlUrl = htmlspecialchars($currentUrl . (strpos($currentUrl, '?') !== false ? '&' : '?') . 'dl=1', ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>v31nfiles</title>
    <link rel="stylesheet" href="/assets/css/style.css" integrity="sha384-XpkoMdA/xoiIJJhPMyhyUBtAxGFjk9vhCWO7HvJc91DvTA3ym/iJOLd7nHJRWcxE">
</head>
<body>
    <div class="container">
        <main>
            <div class="encrypted-notice">
                <p class="encrypted-text"><?php echo $safeName; ?></p>
            </div>
            <a href="<?php echo $dlUrl; ?>" class="btn" style="display:inline-block;text-align:center;text-decoration:none;margin-top:1rem;">Down‑load</a>
        </main>
    </div>
</body>
</html>
<?php
        exit;
    }
}


function isSafeMime($mime) {
    $mime = strtolower($mime);

    if (strpos($mime, 'image/') === 0) return true;
    if (strpos($mime, 'video/') === 0) return true;
    if (strpos($mime, 'audio/') === 0) return true;
    if ($mime === 'application/pdf') return true;

    return false;
}
