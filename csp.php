<?php

require_once __DIR__ . '/integritie.php'; integritie_gate(__FILE__);

function v31n_csp() {
    $nonce = base64_encode(random_bytes(18));
    header("Content-Security-Policy: default-src 'none'; script-src 'self' 'nonce-" . $nonce . "'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src blob:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    return $nonce;
}
