<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');

function rl_client_ip() {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    $loopback = ($remote === '127.0.0.1' || $remote === '::1' || $remote === '0:0:0:0:0:0:0:1');
    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($loopback && $xff !== '') {
        $parts = array_values(array_filter(array_map('trim', explode(',', $xff)), function ($p) {
            return $p !== '';
        }));
        if (!empty($parts)) {
            return end($parts);
        }
    }
    return $remote !== '' ? $remote : 'unknown';
}

function rl_enforce($bucket, $limit, $window = 60) {
    $ip = rl_client_ip();
    $key = $bucket . '|' . $ip;
    $file = __DIR__ . '/storage/ratelimit.json';

    if (!file_exists($file)) {
        @file_put_contents($file, '{}');
    }

    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return;
    }

    if (flock($fh, LOCK_EX)) {
        $content = stream_get_contents($fh);
        $state = json_decode($content, true);
        if (!is_array($state)) {
            $state = [];
        }

        $now = time();
        $hits = array_values(array_filter($state[$key] ?? [], function ($ts) use ($now, $window) {
            return $ts > $now - $window;
        }));

        if (count($hits) >= $limit) {
            $state[$key] = $hits;
            $prune = $now - $window;
            foreach ($state as $k => $list) {
                $kept = array_values(array_filter($list, function ($ts) use ($prune) {
                    return $ts > $prune;
                }));
                if (empty($kept)) {
                    unset($state[$k]);
                } else {
                    $state[$k] = $kept;
                }
            }
            rewind($fh);
            ftruncate($fh, 0);
            fwrite($fh, json_encode($state));
            flock($fh, LOCK_UN);
            fclose($fh);

            http_response_code(429);
            header('Retry-After: ' . $window);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Too many requests. Try again later.']);
            exit;
        }

        $hits[] = $now;
        $state[$key] = $hits;

        rewind($fh);
        ftruncate($fh, 0);
        fwrite($fh, json_encode($state));
        flock($fh, LOCK_UN);
    }

    fclose($fh);
}
