<?php


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

    if ($isNew) {
        createSchema($pdo);
        migrateChunkIndex($pdo);
        migrateMaps($pdo);
    }

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
            created_at        INTEGER NOT NULL
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


function migrateMaps(PDO $pdo) {
    $mapsDir = __DIR__ . '/storage/maps';
    if (!is_dir($mapsDir)) {
        return;
    }

    $files = glob($mapsDir . '/*.json');
    if (empty($files)) {
        return;
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT OR IGNORE INTO maps (file_id, encrypted_payload, payload_iv, salt, created_at) VALUES (?, ?, ?, ?, ?)');

    foreach ($files as $file) {
        $fileId = basename($file, '.json');
        $data = json_decode(file_get_contents($file), true);
        if (!$data || !isset($data['encrypted_payload'], $data['payload_iv'], $data['salt'])) {
            continue;
        }

        $createdAt = filemtime($file) ?: time();
        $stmt->execute([
            $fileId,
            $data['encrypted_payload'],
            $data['payload_iv'],
            $data['salt'],
            $createdAt
        ]);
    }

    $pdo->commit();
}
