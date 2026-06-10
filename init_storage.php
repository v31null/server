<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

require_once __DIR__ . '/db.php';

function initStorage() {
    $base = __DIR__ . '/storage';

    if (!is_dir($base)) {
        mkdir($base, 0755, true);
    }
    if (!is_dir($base . '/maps')) {
        mkdir($base . '/maps', 0755, true);
    }
    if (!is_dir(__DIR__ . '/incoming')) {
        mkdir(__DIR__ . '/incoming', 0755, true);
    }

    $slugPath = $base . '/slug.v31n';
    if (!file_exists($slugPath)) {
        $header = pack('C3', 0x80, 0x00, 0x00);
        file_put_contents($slugPath, $header);
    }

    $htPath = $base . '/.htaccess';
    if (!file_exists($htPath)) {
        file_put_contents($htPath, "Order deny,allow\nDeny from all\n");
    }

    getDb();
}
