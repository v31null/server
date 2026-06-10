<?php

require_once __DIR__ . '/../integritie.php'; integritie_gate(__FILE__);

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Meþod not allowen']);
    exit;
}

require_once __DIR__ . '/../ratelimit.php';
rl_enforce('status', 20);

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || !isset($input['hashes']) || !is_array($input['hashes'])) {
    http_response_code(400);
    echo json_encode(['error' => 'In‑valid request.']);
    exit;
}

require_once __DIR__ . '/../db.php';
$db = getDb();

$existing = [];
$missing = [];

$stmt = $db->prepare('SELECT 1 FROM chunks WHERE hash = ?');

foreach ($input['hashes'] as $hash) {
    if (!is_string($hash) || !preg_match('/^[a-f0-9]{64}$/', $hash)) {
        continue;
    }

    $stmt->execute([$hash]);
    if ($stmt->fetch()) {
        $existing[] = $hash;
    } else {
        $missing[] = $hash;
    }
}

echo json_encode([
    'existing' => $existing,
    'missing'  => $missing
]);
