<?php

function v31np_query(string $indexFile, callable $keys): void
{
    header('Vary: Accept, Content-Type');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    $accept = (string)($_SERVER['HTTP_ACCEPT'] ?? '');
    if (!(($method === 'POST' && $type === 'application/v31np') || (($method === 'GET' || $method === 'HEAD') && str_contains($accept, 'application/v31np')))) {
        return;
    }
    require_once __DIR__ . '/lib/answer.php';
    set_time_limit(0);
    v31np_plain();
    $index = V31nIndex::load($indexFile) ?? (is_file($indexFile) ? null : V31nIndex::create($indexFile, '.'));
    if ($index === null) {
        http_response_code(500);
        exit;
    }
    $level = ob_get_level();
    V31nAnswer::start();
    register_shutdown_function(function () use ($index, $level, $keys): void {
        while (ob_get_level() > $level + 1) {
            ob_end_flush();
        }
        V31nAnswer::send($index, array_values(array_filter(array_map(fn($k) => V31nIndex::rooted((string)$k), (array)$keys((string)ob_get_contents(), $index)), fn($k) => $index->has($k))));
    });
}

function v31np_plain(): void
{
    if (function_exists('apache_setenv')) {
        apache_setenv('no-gzip', '1');
        apache_setenv('no-brotli', '1');
    }
    ini_set('zlib.output_compression', '0');
}

function v31np(string $name, string $look = '', string $nonce = ''): void
{
    require_once __DIR__ . '/lib/settings.php';
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $name)) {
        http_response_code(500);
        exit;
    }
    header('Vary: Accept, Content-Type');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    $accept = (string)($_SERVER['HTTP_ACCEPT'] ?? '');
    if (($method === 'POST' && $type === 'application/v31np') || (($method === 'GET' || $method === 'HEAD') && str_contains($accept, 'application/v31np'))) {
        require_once __DIR__ . '/lib/answer.php';
        set_time_limit(0);
        v31np_plain();
        $file = dirname(__DIR__) . '/' . V31nIndex::KEY;
        if (V31nIndex::load($file) === null) {
            http_response_code(500);
            exit;
        }
        $level = ob_get_level();
        V31nAnswer::start();
        register_shutdown_function(function () use ($file, $level, $name): void {
            while (ob_get_level() > $level + 1) {
                ob_end_flush();
            }
            $index = V31nIndex::load($file);
            $send = (array)v31np_settings($name)['send'];
            V31nAnswer::send($index, array_values(array_filter($index->keys(), fn($k) => in_array($index->level($k), $send, true))));
        });
        return;
    }
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<link rel=\"icon\" href=\"data:,\">\n";
    echo '<meta name="v31np-archive" content="', $name, "\">\n", '<meta name="v31np-url" content="/v31np/', $name, ".v31np\">\n", $look, $nonce === '' ? "<script>\n" : '<script nonce="' . htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8') . "\">\n";
    echo "const V31N_PAGE = {};\n";
    readfile(__DIR__ . '/v31np.js');
    echo "</script>\n</head>\n<body>\n</body>\n</html>\n";
    exit;
}
