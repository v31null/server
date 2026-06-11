<?php

require_once __DIR__ . '/../integritie.php'; integritie_gate(__FILE__);

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$in = json_decode(file_get_contents('php://input'), true);
$hash = (is_array($in) && isset($in['hash'])) ? $in['hash'] : (isset($_GET['hash']) ? $_GET['hash'] : '');

if (!preg_match('/^[a-f0-9]{64}$/', $hash)) {
    $hash = hash('sha256', $hash);
}

require_once __DIR__ . '/../db.php';
$db = getDb();

$stmt = $db->prepare('SELECT offset, length FROM chunks WHERE hash = ?');
$stmt->execute([$hash]);
$entry = $stmt->fetch(PDO::FETCH_ASSOC);

if ($entry) {
    $slugPath = __DIR__ . '/../storage/slug.v31n';
    $slugHandle = fopen($slugPath, 'rb');

    if ($slugHandle) {
        fseek($slugHandle, $entry['offset']);
        $raw = fread($slugHandle, $entry['length']);
        fclose($slugHandle);

        if (strlen($raw) === (int)$entry['length']) {
            $dataLength = unpack('N', substr($raw, 32, 4))[1];
            $iv = substr($raw, 36, 12);
            $data = substr($raw, 48, $dataLength);

            echo json_encode([
                'iv'   => base64_encode($iv),
                'data' => base64_encode($data)
            ]);
            exit;
        }
    }
}

$dummyIv = substr(hash('sha256', $hash . '_iv', true), 0, 12);
$lenHash = hexdec(substr(hash('sha256', $hash . '_len'), 0, 8));

if ($lenHash % 100 < 95) {
    $dummySize = 4112;
} else {
    $dummySize = 16 + ($lenHash % 4096);
}

$dummyIvForCrypto = substr(hash('sha256', $hash . '_iv_crypto', true), 0, 16);
$dummyKey = hash('sha256', $hash . '_key', true);
$nullBytes = str_repeat("\0", $dummySize);
$dummyData = openssl_encrypt($nullBytes, 'aes-256-ctr', $dummyKey, OPENSSL_RAW_DATA, $dummyIvForCrypto);

echo json_encode([
    'iv'   => base64_encode($dummyIv),
    'data' => base64_encode($dummyData)
]);
exit;
