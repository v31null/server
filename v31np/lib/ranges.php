<?php

function v31np_ranges(string $file, int $base, int $total, string $type, string $etag, array $heads = []): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    header('ETag: "' . $etag . '"');
    foreach ($heads as [$n, $v]) {
        header($n . ': ' . $v, false);
    }
    $send = function (int $start, int $end) use ($file, $base): void {
        $h = fopen($file, 'rb');
        fseek($h, $base + $start);
        $left = $end - $start + 1;
        while ($left > 0) {
            $chunk = fread($h, min(1048576, $left));
            if ($chunk === false || $chunk === '') {
                break;
            }
            echo $chunk;
            $left -= strlen($chunk);
            flush();
        }
        fclose($h);
    };
    $range = trim($_SERVER['HTTP_RANGE'] ?? '');
    $ifRange = trim($_SERVER['HTTP_IF_RANGE'] ?? '');
    if ($range === '' || ($ifRange !== '' && $ifRange !== '"' . $etag . '"')) {
        header('Content-Type: ' . $type);
        header('Accept-Ranges: bytes');
        header('Content-Length: ' . $total);
        if ($method === 'GET' && $total > 0) {
            $send(0, $total - 1);
        }
        exit;
    }
    if (!str_starts_with($range, 'bytes=')) {
        http_response_code(400);
        exit;
    }
    $parts = [];
    foreach (explode(',', substr($range, 6)) as $spec) {
        if (!preg_match('/^(\d*)-(\d*)$/', trim($spec), $m) || ($m[1] === '' && $m[2] === '')) {
            http_response_code(400);
            exit;
        }
        if ($m[1] === '') {
            $start = max(0, $total - (int)$m[2]);
            $end = $total - 1;
        } else {
            $start = (int)$m[1];
            $end = $m[2] === '' ? $total - 1 : min((int)$m[2], $total - 1);
        }
        if ($start < $total && $start <= $end && ($m[1] !== '' || (int)$m[2] > 0)) {
            $parts[] = [$start, $end];
        }
    }
    if (!$parts) {
        http_response_code(416);
        header('Content-Range: bytes */' . $total);
        exit;
    }
    http_response_code(206);
    header('Accept-Ranges: bytes');
    if (count($parts) === 1) {
        [$start, $end] = $parts[0];
        header('Content-Type: ' . $type);
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $total);
        header('Content-Length: ' . ($end - $start + 1));
        if ($method === 'GET') {
            $send($start, $end);
        }
        exit;
    }
    $boundary = 'v31np-' . $etag;
    $lines = [];
    $length = 0;
    foreach ($parts as $i => [$start, $end]) {
        $lines[$i] = '--' . $boundary . "\r\nContent-Type: " . $type . "\r\nContent-Range: bytes " . $start . '-' . $end . '/' . $total . "\r\n\r\n";
        $length += strlen($lines[$i]) + ($end - $start + 1) + 2;
    }
    $closing = '--' . $boundary . "--\r\n";
    header('Content-Type: multipart/byteranges; boundary=' . $boundary);
    header('Content-Length: ' . ($length + strlen($closing)));
    if ($method === 'GET') {
        foreach ($parts as $i => [$start, $end]) {
            echo $lines[$i];
            $send($start, $end);
            echo "\r\n";
        }
        echo $closing;
    }
    exit;
}
