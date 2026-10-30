<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

function getDb() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbPath = __DIR__ . '/storage/v31n.sqlite3';
    $isNew = !file_exists($dbPath);

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA journal_mode=WAL');
    $pdo->exec('PRAGMA foreign_keys=ON');
    $pdo->exec('PRAGMA busy_timeout=5000');

    if ($isNew) {
        createSchema($pdo);
        migrateChunkIndex($pdo);
    }

    $pdo->exec('CREATE INDEX IF NOT EXISTS chunks_offset ON chunks(offset)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS tickets (ticket TEXT PRIMARY KEY, chunks INTEGER NOT NULL)');

    return $pdo;
}


function createSchema(PDO $pdo) {
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS chunks (
            hash   TEXT PRIMARY KEY,
            offset INTEGER NOT NULL,
            length INTEGER NOT NULL
        )
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS maps (
            file_id           TEXT PRIMARY KEY,
            encrypted_payload TEXT NOT NULL,
            payload_iv        TEXT NOT NULL,
            salt              TEXT NOT NULL,
            created_at        VARCHAR(24) NOT NULL
        )
    ');

    $pdo->exec('
        CREATE TABLE IF NOT EXISTS embed_bans (
            file_id   TEXT PRIMARY KEY,
            banned_at INTEGER NOT NULL
        )
    ');
}


function migrateChunkIndex(PDO $pdo) {
    $indexPath = __DIR__ . '/storage/chunk_index.json';
    if (!file_exists($indexPath)) {
        return;
    }

    $content = file_get_contents($indexPath);
    $index = json_decode($content, true);
    if (!$index || !is_array($index)) {
        return;
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT OR IGNORE INTO chunks (hash, offset, length) VALUES (?, ?, ?)');

    foreach ($index as $hash => $entry) {
        $stmt->execute([$hash, $entry['offset'], $entry['length']]);
    }

    $pdo->commit();
}
