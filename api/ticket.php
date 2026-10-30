<?php

require_once __DIR__ . '/../integritie.php'; integritie_gate(__FILE__);

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'No.']);
    exit;
}

require_once __DIR__ . '/../ratelimit.php';
rl_enforce('ticket', 10);

require_once __DIR__ . '/../init_storage.php';
initStorage();

$db = getDb();
$ticket = bin2hex(random_bytes(16));
$db->prepare('INSERT INTO tickets (ticket, chunks) VALUES (?, 0)')->execute([$ticket]);

echo json_encode(['ticket' => $ticket]);
