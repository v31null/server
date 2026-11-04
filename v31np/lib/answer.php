<?php
require_once __DIR__ . '/pack.php';
require_once __DIR__ . '/index.php';

final class V31nAnswer
{
    public static function start(): void
    {
        ob_start();
    }

    private static function clear(): void
    {
        while (ob_get_level()) {
            ob_end_clean();
        }
    }

    private static function ask(string $body): ?array
    {
        $outer = V31nPack::parse(V31nPack::MAGIC, $body);
        if ($outer === null || count($outer['entries']) !== 1 || $outer['entries'][0][0] !== '') {
            return null;
        }
        [, $at, $size] = $outer['entries'][0];
        $inner = substr($body, $at, $size);
        $ask = V31nPack::parse(V31nPack::ASK, $inner);
        if ($ask === null) {
            return null;
        }
        $client = [];
        foreach ($ask['entries'] as [$key, $at, $size]) {
            $text = substr($inner, $at, $size);
            if ($size !== 8 || !preg_match('/^[0-9A-F]{8}$/', $text)) {
                return null;
            }
            $client[(string)$key] = $text;
        }
        return $client;
    }

    public static function send(V31nIndex $index, array $keys): void
    {
        $html = ob_get_clean();
        $rows = [];
        $secret = V31nIndex::secret();
        foreach ($keys as $key) {
            $key = (string)$key;
            if ($key === '' || $key === V31nIndex::KEY || isset($rows[$key])) {
                continue;
            }
            $row = $index->fresh($key, $secret !== null);
            if ($row !== null) {
                $rows[$key] = $row;
            }
        }
        $index->save();
        $page = ['size' => strlen($html), 'crc' => V31nPack::hex(crc32($html)), 'sha' => strtoupper(hash('sha256', $html))];
        $mem = ['' => $html, V31nIndex::KEY => $index->entry(['' => $page] + $rows, $secret)];
        $all = array_merge(array_map('strval', array_keys($mem)), array_map('strval', array_keys($rows)));
        usort($all, [V31nOrder::class, 'key']);
        $server = [];
        $items = [];
        foreach ($all as $key) {
            $size = isset($mem[$key]) ? strlen($mem[$key]) : $rows[$key]['size'];
            $crc = isset($mem[$key]) ? V31nPack::hex(crc32($mem[$key])) : $rows[$key]['crc'];
            $server[$key] = ['size' => $size, 'crc' => $crc];
            $items[] = [$key, $size];
        }
        $head = V31nPack::head(V31nPack::MAGIC, $items);
        $sum = crc32($head);
        $length = strlen($head) + V31nPack::FOOT;
        foreach ($all as $key) {
            $sum = V31nPack::combine($sum, hexdec($server[$key]['crc']), $server[$key]['size']);
            $length += $server[$key]['size'];
        }
        $sum = V31nPack::combine($sum, crc32(V31nPack::PI), V31nPack::MARK);
        self::clear();
        header('Cache-Control: no-store');
        header('ETag: "' . V31nPack::hex($sum) . '"');

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($method === 'POST') {
            $client = self::ask(file_get_contents('php://input'));
            if ($client === null) {
                http_response_code(422);
                exit;
            }
            if ($client) {
                $changed = [];
                foreach ($all as $key) {
                    if (($client[$key] ?? null) !== $server[$key]['crc']) {
                        $changed[] = $key;
                    }
                }
                $deleted = array_values(array_diff(array_keys($client), $all));
                if (!$changed && !$deleted) {
                    http_response_code(304);
                    exit;
                }
                $keys = array_merge($changed, array_map('strval', $deleted));
                usort($keys, [V31nOrder::class, 'key']);
                $entries = [];
                foreach ($keys as $key) {
                    if (!isset($server[$key])) {
                        $entries[] = [$key, "\x01"];
                    } elseif (isset($mem[$key])) {
                        $entries[] = [$key, $mem[$key] . "\x00"];
                    } else {
                        $bytes = $server[$key]['size'] > 0 ? file_get_contents($index->path($key), false, null, 0, $server[$key]['size']) : '';
                        if (strlen($bytes) !== $server[$key]['size']) {
                            http_response_code(500);
                            exit;
                        }
                        $entries[] = [$key, $bytes . "\x00"];
                    }
                }
                $answer = V31nPack::write(V31nPack::MAGIC, [['', V31nPack::write(V31nPack::PATCH, $entries)]]);
                header('HTTP/1.1 267 Re-sync');
                header('Content-Type: application/v31np');
                header('Content-Length: ' . strlen($answer));
                echo $answer;
                exit;
            }
        } elseif ($method !== 'GET' && $method !== 'HEAD') {
            http_response_code(405);
            header('Allow: GET, HEAD, POST');
            exit;
        }

        header('Content-Type: application/v31np');
        header('Content-Length: ' . $length);
        if ($method === 'HEAD') {
            exit;
        }
        $ctx = hash_init('crc32b');
        echo $head;
        hash_update($ctx, $head);
        foreach ($all as $key) {
            if (isset($mem[$key])) {
                echo $mem[$key];
                hash_update($ctx, $mem[$key]);
                continue;
            }
            $left = $rows[$key]['size'];
            $h = fopen($index->path($key), 'rb');
            while ($left > 0 && $h !== false && !feof($h)) {
                $chunk = fread($h, min(1048576, $left));
                if ($chunk === false || $chunk === '') {
                    break;
                }
                echo $chunk;
                hash_update($ctx, $chunk);
                $left -= strlen($chunk);
                flush();
            }
            if ($h !== false) {
                fclose($h);
            }
            if ($left !== 0) {
                exit;
            }
        }
        echo V31nPack::PI;
        hash_update($ctx, V31nPack::PI);
        echo pack('V', hexdec(hash_final($ctx)));
        exit;
    }
}
