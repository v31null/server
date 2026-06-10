<?php

if (!defined('V31N_INTEGRITIE')) {
    define('V31N_INTEGRITIE', 1);
    define('V31N_ROOT', str_replace('\\', '/', __DIR__));
    define('V31N_PUBKEY_SPKI', '261AF6EA33A67825250326CC64E5BC735BF3C010FCC4F4132D83F19B28D1DAD5');

    function integritie_fail($why) {
        error_log('v31n integritie block: ' . $why);
        if (!headers_sent()) {
            http_response_code(503);
            header('Content-Type: text/plain; charset=utf-8');
            header('Cache-Control: no-store');
            header('X-Integritie: blocken');
        }
        echo "BLOCKEN INTEGRITIE TEST FÕL\n";
        exit;
    }

    function integritie_spki_fp($pem) {
        $k = @openssl_pkey_get_public($pem);
        if (!$k) return null;
        $d = @openssl_pkey_get_details($k);
        if (!$d || empty($d['key'])) return null;
        $der = base64_decode(preg_replace('/-----[^-]+-----|\s+/', '', $d['key']));
        return $der === false ? null : strtoupper(hash('sha256', $der));
    }

    function integritie_files() {
        static $files = false;
        if ($files !== false) return $files;

        $raw = @file_get_contents(V31N_ROOT . '/manifest.json');
        $sig = @file_get_contents(V31N_ROOT . '/manifest.sig');
        $pem = @file_get_contents(V31N_ROOT . '/publickey.pem');
        if ($raw === false || $sig === false || $pem === false) integritie_fail('artifact mißing');

        if (!hash_equals(V31N_PUBKEY_SPKI, (string) integritie_spki_fp($pem))) integritie_fail('serven pubkey != pinnen giþub key');

        $pk = @openssl_pkey_get_public($pem);
        $ok = $pk ? openssl_verify($raw, base64_decode(trim($sig)), $pk, OPENSSL_ALGO_SHA256) : -1;
        if ($ok !== 1) integritie_fail('manifest.sig non‑valid');

        $man = json_decode($raw, true);
        if (!is_array($man) || empty($man['files'])) integritie_fail('manifest unparseable');
        $files = $man['files'];

        $selfBytes = @file_get_contents(__FILE__);
        if ($selfBytes === false || !isset($files['integritie.php']) ||
            !hash_equals(strtolower($files['integritie.php']['sha256']), hash('sha256', $selfBytes))) {
            integritie_fail('verifier self-hash Mys‑match');
        }
        return $files;
    }

    function integritie_gate($self) {
        $files = integritie_files();
        $abs = str_replace('\\', '/', (string) realpath($self));
        $rel = ltrim(substr($abs, strlen(V31N_ROOT)), '/');
        if ($rel === '' || !isset($files[$rel])) integritie_fail("unlisted: $rel");
        $bytes = @file_get_contents($self);
        if ($bytes === false) integritie_fail("unreadable: $rel");
        if (!hash_equals(strtolower($files[$rel]['sha256']), hash('sha256', $bytes))) integritie_fail("hash mys match: $rel");
    }
}
