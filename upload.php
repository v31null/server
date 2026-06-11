<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'No.']);
    exit;
}

$maxPostBytes = 75 * 1024 * 1024;
$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > $maxPostBytes) {
    http_response_code(413);
    echo json_encode(['error' => 'No.']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'No.']);
    exit;
}

$hasChunks = isset($input['chunks']) && is_array($input['chunks']);
$isFinalize = isset($input['encrypted_payload']);

require_once __DIR__ . '/ratelimit.php';
if ($isFinalize) {
    rl_enforce('upload', 10);
} else {
    rl_enforce('store', 300);
}

if ($isFinalize) {
    foreach (['encrypted_payload', 'payload_iv', 'salt'] as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => 'No.']);
            exit;
        }
    }
} else {
    if (!$hasChunks) {
        http_response_code(400);
        echo json_encode(['error' => 'No.']);
        exit;
    }
    if (empty($input['chunks'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No.']);
        exit;
    }
}

require_once __DIR__ . '/init_storage.php';
initStorage();

require_once __DIR__ . '/db.php';
$db = getDb();

$totalChunks = $hasChunks ? count($input['chunks']) : 0;
$newChunksWritten = 0;

if ($hasChunks && $totalChunks > 0) {
    $storagePath = __DIR__ . '/storage';
    $slugPath = $storagePath . '/slug.v31n';

    $slugHandle = fopen($slugPath, 'r+b');
    if (!$slugHandle) {
        http_response_code(500);
        echo json_encode(['error' => 'No.']);
        exit;
    }

    if (!flock($slugHandle, LOCK_EX)) {
        fclose($slugHandle);
        http_response_code(503);
        echo json_encode(['error' => 'No.']);
        exit;
    }

    $header = fread($slugHandle, 3);
    if (strlen($header) < 3) {
        flock($slugHandle, LOCK_UN);
        fclose($slugHandle);
        http_response_code(500);
        echo json_encode(['error' => 'No.']);
        exit;
    }

    $byte0 = ord($header[0]);

    if (!($byte0 & 0x80)) {
        flock($slugHandle, LOCK_UN);
        fclose($slugHandle);
        http_response_code(503);
        echo json_encode(['error' => 'No.']);
        exit;
    }

    $byte0 |= 0x40;
    fseek($slugHandle, 0);
    fwrite($slugHandle, chr($byte0));
    fflush($slugHandle);

    $existsStmt = $db->prepare('SELECT 1 FROM chunks WHERE hash = ?');

    fseek($slugHandle, 0, SEEK_END);
    $currentOffset = ftell($slugHandle);

    $newChunkRecords = [];

    foreach ($input['chunks'] as $chunk) {
        if (!isset($chunk['hash'], $chunk['iv'], $chunk['data'])) {
            continue;
        }

        $hash = $chunk['hash'];

        if (!preg_match('/^[a-f0-9]{64}$/', $hash)) {
            continue;
        }

        $existsStmt->execute([$hash]);
        if ($existsStmt->fetch()) {
            continue;
        }

        $iv = base64_decode($chunk['iv'], true);
        $data = base64_decode($chunk['data'], true);

        if ($iv === false || $data === false) {
            continue;
        }

        if (strlen($iv) !== 12) {
            continue;
        }

        $hashBytes = hex2bin($hash);
        $dataLength = strlen($data);
        $lengthBytes = pack('N', $dataLength);

        $entry = $hashBytes . $lengthBytes . $iv . $data;
        $entryLength = strlen($entry);

        $bytesWritten = fwrite($slugHandle, $entry);
        if ($bytesWritten !== $entryLength) {
            break;
        }

        $newChunkRecords[] = [$hash, $currentOffset, $entryLength];

        $currentOffset += $entryLength;
        $newChunksWritten++;
    }

    fseek($slugHandle, 0);
    $headerByte = fread($slugHandle, 1);
    $byte0 = ord($headerByte) & ~0x40;
    fseek($slugHandle, 0);
    fwrite($slugHandle, chr($byte0));
    fflush($slugHandle);

    if (!empty($newChunkRecords)) {
        $db->beginTransaction();
        $insertStmt = $db->prepare('INSERT OR IGNORE INTO chunks (hash, offset, length) VALUES (?, ?, ?)');
        foreach ($newChunkRecords as $rec) {
            $insertStmt->execute($rec);
        }
        $db->commit();
    }

    flock($slugHandle, LOCK_UN);
    fclose($slugHandle);
}

if (!$isFinalize) {
    echo json_encode([
        'stored'   => $newChunksWritten,
        'received' => $totalChunks
    ]);
    exit;
}

$idStmt = $db->prepare('SELECT 1 FROM maps WHERE file_id = ?');
do {
    $uploadId = bin2hex(random_bytes(4));
    $idStmt->execute([$uploadId]);
} while ($idStmt->fetch());

$mapStmt = $db->prepare('INSERT INTO maps (file_id, encrypted_payload, payload_iv, salt, created_at) VALUES (?, ?, ?, ?, ?)');
$mapStmt->execute([
    $uploadId,
    $input['encrypted_payload'],
    $input['payload_iv'],
    $input['salt'],
    time()
]);

echo json_encode([
    'id'             => $uploadId,
    'url'            => '/v/' . $uploadId,
    'new_chunks'     => $newChunksWritten,
    'deduped_chunks' => $totalChunks - $newChunksWritten
]);
