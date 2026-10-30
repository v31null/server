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

$raw = file_get_contents('php://input', false, null, 0, $maxPostBytes + 1);
if ($raw === false || strlen($raw) > $maxPostBytes) {
    http_response_code(413);
    echo json_encode(['error' => 'No.']);
    exit;
}

$contentType = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
$isFinalize = $contentType !== 'application/octet-stream';
$RECORD = 4156;
$TICKET = 16;
$MAX_UPLOAD_CHUNKS = 12800;

require_once __DIR__ . '/ratelimit.php';
if ($isFinalize) {
    rl_enforce('upload', 10);
} else {
    rl_enforce('store', 300);
}

if ($isFinalize) {
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'No.']);
        exit;
    }
    foreach (['encrypted_payload', 'payload_iv', 'salt', 'ticket'] as $field) {
        if (!isset($input[$field]) || !is_string($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => 'No.']);
            exit;
        }
    }
    $ticket = $input['ticket'];
} else {
    if (strlen($raw) <= $TICKET || (strlen($raw) - $TICKET) % $RECORD !== 0) {
        http_response_code(400);
        echo json_encode(['error' => 'No.']);
        exit;
    }
    $ticket = bin2hex(substr($raw, 0, $TICKET));
}

require_once __DIR__ . '/init_storage.php';
initStorage();

require_once __DIR__ . '/db.php';
$db = getDb();

$ticketStmt = $db->prepare('SELECT chunks FROM tickets WHERE ticket = ?');
$ticketStmt->execute([$ticket]);
$ticketChunks = $ticketStmt->fetchColumn();
$ticketStmt->closeCursor();
if ($ticketChunks === false) {
    http_response_code(400);
    echo json_encode(['error' => 'No.']);
    exit;
}

$totalChunks = $isFinalize ? 0 : intdiv(strlen($raw) - $TICKET, $RECORD);
$newChunksWritten = 0;
$overCap = false;

if ($totalChunks > 0) {
    $storagePath = __DIR__ . '/storage';
    $slugPath = $storagePath . '/slug.v31n';

    clearstatcache(true, $slugPath);
    $slugBytes = @filesize($slugPath);
    $freeBytes = @disk_free_space($storagePath);
    $incomingBytes = $totalChunks * 4160;
    if ($slugBytes === false || $freeBytes === false
        || $slugBytes + $incomingBytes > 100 * 1024 ** 3
        || $freeBytes - $incomingBytes < 20 * 1024 ** 3) {
        http_response_code(507);
        echo json_encode(['error' => 'No.']);
        exit;
    }

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

    $existsStmt   = $db->prepare('SELECT 1 FROM chunks WHERE hash = ?');
    $occupantStmt = $db->prepare('SELECT hash FROM chunks WHERE offset = ?');

    $SLOT = 4160;
    $HEADER_LEN = 3;

    fseek($slugHandle, 0, SEEK_END);
    $fileSize = ftell($slugHandle);
    $slotCount = intdiv($fileSize - $HEADER_LEN, $SLOT);

    $ticketStmt->execute([$ticket]);
    $ticketChunks = (int)$ticketStmt->fetchColumn();
    $ticketStmt->closeCursor();

    for ($k = 0; $k < $totalChunks; $k++) {
        $record = substr($raw, $TICKET + $k * $RECORD, $RECORD);
        $hashBytes = substr($record, 0, 32);
        $hash = bin2hex($hashBytes);

        $existsStmt->execute([$hash]);
        if ($existsStmt->fetch()) {
            continue;
        }

        if ($ticketChunks + $newChunksWritten >= $MAX_UPLOAD_CHUNKS) {
            $overCap = true;
            break;
        }

        $iv = substr($record, 32, 12);
        $data = substr($record, 44);
        $dataLength = strlen($data);
        $lengthBytes = pack('N', $dataLength);

        $entry = $hashBytes . $lengthBytes . $iv . $data;
        $entryLength = strlen($entry);
        if ($entryLength > $SLOT) {
            continue;
        }
        $slotBytes = $entry . str_repeat("\0", $SLOT - $entryLength);

        $j = random_int(0, $slotCount);
        $targetOffset = $HEADER_LEN + $j * $SLOT;
        $endOffset = $HEADER_LEN + $slotCount * $SLOT;

        if ($j === $slotCount) {
            fseek($slugHandle, $endOffset);
            if (fwrite($slugHandle, $slotBytes) !== $SLOT) {
                break;
            }
            $db->beginTransaction();
            $insertStmt = $db->prepare('INSERT OR IGNORE INTO chunks (hash, offset, length) VALUES (?, ?, ?)');
            $insertStmt->execute([$hash, $targetOffset, $entryLength]);
            $db->commit();
        } else {
            fseek($slugHandle, $targetOffset);
            $occupantBytes = fread($slugHandle, $SLOT);
            if (strlen($occupantBytes) !== $SLOT) {
                break;
            }

            fseek($slugHandle, $endOffset);
            if (fwrite($slugHandle, $occupantBytes) !== $SLOT) {
                break;
            }

            $occupantStmt->execute([$targetOffset]);
            $occHash = $occupantStmt->fetchColumn();

            $db->beginTransaction();
            if ($occHash !== false) {
                $db->prepare('UPDATE chunks SET offset = ? WHERE hash = ?')->execute([$endOffset, $occHash]);
            }
            $db->commit();

            fseek($slugHandle, $targetOffset);
            if (fwrite($slugHandle, $slotBytes) !== $SLOT) {
                break;
            }

            $db->beginTransaction();
            $db->prepare('INSERT OR IGNORE INTO chunks (hash, offset, length) VALUES (?, ?, ?)')->execute([$hash, $targetOffset, $entryLength]);
            $db->commit();
        }

        fflush($slugHandle);
        $slotCount++;
        $newChunksWritten++;
    }

    if ($newChunksWritten > 0) {
        $db->prepare('UPDATE tickets SET chunks = chunks + ? WHERE ticket = ?')->execute([$newChunksWritten, $ticket]);
    }

    fseek($slugHandle, 0);
    $headerByte = fread($slugHandle, 1);
    $byte0 = ord($headerByte) & ~0x40;
    fseek($slugHandle, 0);
    fwrite($slugHandle, chr($byte0));
    fflush($slugHandle);

    flock($slugHandle, LOCK_UN);
    fclose($slugHandle);
}

if ($overCap) {
    http_response_code(413);
    echo json_encode(['error' => 'No.']);
    exit;
}

if (!$isFinalize) {
    echo json_encode([
        'stored'   => $newChunksWritten,
        'received' => $totalChunks
    ]);
    exit;
}

$pt = json_decode((string)shell_exec('node ' . escapeshellarg(__DIR__ . '/time/pt.js') . ' day'), true);
if (!is_array($pt) || !isset($pt['key']) || !is_string($pt['key']) || $pt['key'] === '') {
    http_response_code(500);
    echo json_encode(['error' => 'No.']);
    exit;
}
$createdAtDay = $pt['key'];

$alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
$idStmt = $db->prepare('SELECT 1 FROM maps WHERE file_id = ?');
do {
    $uploadId = '';
    for ($i = 0; $i < 26; $i++) {
        $uploadId .= $alphabet[random_int(0, 31)];
    }
    $idStmt->execute([$uploadId]);
} while ($idStmt->fetch());

$mapStmt = $db->prepare('INSERT INTO maps (file_id, encrypted_payload, payload_iv, salt, created_at) VALUES (?, ?, ?, ?, ?)');
$mapStmt->execute([
    $uploadId,
    $input['encrypted_payload'],
    $input['payload_iv'],
    $input['salt'],
    $createdAtDay
]);
$db->prepare('DELETE FROM tickets WHERE ticket = ?')->execute([$ticket]);

echo json_encode([
    'id'             => $uploadId,
    'url'            => '/w/' . $uploadId,
    'new_chunks'     => $newChunksWritten,
    'deduped_chunks' => $totalChunks - $newChunksWritten
]);
