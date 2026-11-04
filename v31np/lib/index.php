<?php
require_once __DIR__ . '/order.php';

final class V31nIndex
{
    const MAGIC = "V31NBAIMITIF\0\0\0";
    const KEY = 'v31np index.txt';
    const SHIFT = 11644473600;
    const LEVELS = ['S', 'A', 'B', 'Ú', 'U', 'Ù'];

    private string $file;
    private string $root;
    private string $rootText;
    private array $rows = [];
    private array $heads = [];
    private bool $dirty = false;

    private function __construct(string $file, string $rootText)
    {
        $this->file = $file;
        $this->rootText = $rootText;
        $this->root = dirname($file) . '/' . $rootText;
    }

    public static function escape(string $s): string
    {
        return strtr($s, ['\\' => '\\\\', "\t" => '\\t', "\n" => '\\n', "\r" => '\\r']);
    }

    public static function unescape(string $s): ?string
    {
        $out = '';
        $n = strlen($s);
        for ($i = 0; $i < $n; $i++) {
            $c = $s[$i];
            if ($c !== '\\') {
                $out .= $c;
                continue;
            }
            $e = $s[++$i] ?? '';
            $map = ['\\' => '\\', 't' => "\t", 'n' => "\n", 'r' => "\r"];
            if (!isset($map[$e])) {
                return null;
            }
            $out .= $map[$e];
        }
        return mb_check_encoding($out, 'UTF-8') ? $out : null;
    }

    public static function fileTime(string $path): int
    {
        return (filemtime($path) + self::SHIFT) * 10000000;
    }

    public static function crcOf(string $path): string
    {
        return strtoupper(hash_file('crc32b', $path));
    }

    public static function shaOf(string $path): string
    {
        return strtoupper(hash_file('sha256', $path));
    }

    public static function secret(): ?string
    {
        $settings = json_decode((string)@file_get_contents(__DIR__ . '/../settings.json'), true);
        $file = is_array($settings) ? (string)($settings['sign'] ?? '') : '';
        if ($file === '') {
            return null;
        }
        $seed = trim((string)@file_get_contents(__DIR__ . '/../' . $file));
        if (!preg_match('/^[0-9A-F]{64}$/', $seed)) {
            throw new RuntimeException('sign key');
        }
        return sodium_crypto_sign_secretkey(sodium_crypto_sign_seed_keypair(hex2bin($seed)));
    }

    public static function load(string $file): ?self
    {
        $text = @file_get_contents($file);
        if ($text === false) {
            return null;
        }
        $index = null;
        $magic = false;
        foreach (preg_split('/\r?\n/', $text) as $line) {
            if ($line === '') {
                continue;
            }
            if (!$magic) {
                if ($line !== self::MAGIC) {
                    return null;
                }
                $magic = true;
                continue;
            }
            if ($index === null) {
                $root = self::unescape($line);
                if ($root === null || $root === '') {
                    return null;
                }
                $index = new self($file, $root);
                continue;
            }
            $f = explode("\t", $line);
            if ($f[0] === 'I') {
                if ($index->heads || count($f) < 6 || count($f) > 8) {
                    return null;
                }
                $key = self::unescape($f[1]);
                $path = self::unescape($f[4]);
                if ($key === null || $key === '' || $path === null || $path === '' || isset($index->rows[$key])
                    || !preg_match('/^\d+$/', $f[2]) || !preg_match('/^[0-9A-F]{8}$/', $f[3]) || !preg_match('/^\d+$/', $f[5])) {
                    return null;
                }
                $sha = null;
                $level = null;
                foreach (array_slice($f, 6) as $extra) {
                    if ($sha === null && $level === null && preg_match('/^[0-9A-F]{64}$/', $extra)) {
                        $sha = $extra;
                    } elseif ($level === null && in_array($extra, self::LEVELS, true)) {
                        $level = $extra;
                    } else {
                        return null;
                    }
                }
                $index->rows[$key] = ['size' => (int)$f[2], 'crc' => $f[3], 'path' => $path, 'time' => (int)$f[5], 'sha' => $sha, 'level' => $level];
                continue;
            }
            if ($f[0] === 'H' && count($f) === 4) {
                $key = self::unescape($f[1]);
                $name = self::unescape($f[2]);
                $value = self::unescape($f[3]);
                if ($key === null || !isset($index->rows[$key]) || $name === null || !preg_match('/^[!#$%&\'*+.^_`|~0-9A-Za-z-]+$/', $name)
                    || $value === null || preg_match('/[\x00\r\n]/', $value)) {
                    return null;
                }
                $index->heads[] = [$key, $name, $value];
                continue;
            }
            return null;
        }
        return $index;
    }

    public static function create(string $file, string $rootText): self
    {
        $index = new self($file, $rootText);
        $index->dirty = true;
        return $index;
    }

    public function scan(callable $take, bool $sha): void
    {
        $base = rtrim(str_replace('\\', '/', realpath($this->root)), '/') . '/';
        $found = [];
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($this->root, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $info) {
            if (!$info->isFile()) {
                continue;
            }
            $rel = substr(str_replace('\\', '/', realpath($info->getPathname())), strlen($base));
            if (!$take($rel)) {
                continue;
            }
            $key = '/' . $rel;
            $found[$key] = true;
            if (!isset($this->rows[$key])) {
                $this->rows[$key] = ['size' => -1, 'crc' => '00000000', 'path' => $rel, 'time' => 0, 'sha' => null, 'level' => null];
                $this->dirty = true;
            }
        }
        foreach (array_keys($this->rows) as $key) {
            $key = (string)$key;
            if (!isset($found[$key])) {
                unset($this->rows[$key]);
                $this->dirty = true;
            } else {
                $this->fresh($key, $sha);
            }
        }
        $kept = array_values(array_filter($this->heads, fn($h) => isset($this->rows[$h[0]])));
        if (count($kept) !== count($this->heads)) {
            $this->heads = $kept;
            $this->dirty = true;
        }
    }

    public static function rooted(string $key): string
    {
        return str_starts_with($key, '/') ? $key : '/' . $key;
    }

    public function put(string $key, string $path): bool
    {
        if ($key === '' || $path === '' || !is_file($this->root . '/' . $path)) {
            return false;
        }
        $key = self::rooted($key);
        if (!isset($this->rows[$key]) || $this->rows[$key]['path'] !== $path) {
            $this->rows[$key] = ['size' => -1, 'crc' => '00000000', 'path' => $path, 'time' => 0, 'sha' => null, 'level' => null];
            $this->dirty = true;
        }
        return true;
    }

    public function has(string $key): bool
    {
        return isset($this->rows[$key]);
    }

    public function keys(): array
    {
        return array_map('strval', array_keys($this->rows));
    }

    public function path(string $key): string
    {
        return $this->root . '/' . $this->rows[$key]['path'];
    }

    public function fresh(string $key, bool $sha = false): ?array
    {
        if (!isset($this->rows[$key])) {
            return null;
        }
        $row = $this->rows[$key];
        $path = $this->path($key);
        clearstatcache(true, $path);
        if (!is_file($path)) {
            return null;
        }
        $size = filesize($path);
        $time = self::fileTime($path);
        $changed = $size !== $row['size'] || intdiv($time, 10000000) !== intdiv($row['time'], 10000000);
        if ($changed) {
            $row['size'] = $size;
            $row['time'] = $time;
            $row['crc'] = self::crcOf($path);
        }
        if ($sha && ($changed || $row['sha'] === null)) {
            $row['sha'] = self::shaOf($path);
        }
        if ($row !== $this->rows[$key]) {
            $this->rows[$key] = $row;
            $this->dirty = true;
        }
        return $row;
    }

    public function level(string $key): string
    {
        return $this->rows[$key]['level'] ?? 'Ù';
    }

    public function setLevel(string $key, ?string $level): void
    {
        if (isset($this->rows[$key]) && ($level === null || in_array($level, self::LEVELS, true)) && $this->rows[$key]['level'] !== $level) {
            $this->rows[$key]['level'] = $level;
            $this->dirty = true;
        }
    }

    public function heads(string $key): array
    {
        return array_values(array_filter($this->heads, fn($h) => $h[0] === $key));
    }

    public function setHeads(string $key, array $pairs): void
    {
        $others = array_values(array_filter($this->heads, fn($h) => $h[0] !== $key));
        $mine = array_map(fn($p) => [$key, $p[0], $p[1]], $pairs);
        if ($mine !== $this->heads($key)) {
            $this->heads = array_merge($others, $mine);
            $this->dirty = true;
        }
    }

    private static function order(array $keys): array
    {
        $keys = array_map('strval', $keys);
        usort($keys, [V31nOrder::class, 'key']);
        return $keys;
    }

    private function headLines(array $keys): string
    {
        $out = '';
        foreach ($keys as $key) {
            foreach ($this->heads($key) as [, $name, $value]) {
                $out .= implode("\t", ['H', self::escape($key), self::escape($name), self::escape($value)]) . "\r\n";
            }
        }
        return $out;
    }

    public function save(): bool
    {
        if (!$this->dirty) {
            return true;
        }
        $keys = self::order($this->keys());
        $out = self::MAGIC . "\r\n" . self::escape($this->rootText) . "\r\n";
        foreach ($keys as $key) {
            $r = $this->rows[$key];
            $f = ['I', self::escape($key), $r['size'], $r['crc'], self::escape($r['path']), $r['time']];
            if ($r['sha'] !== null) {
                $f[] = $r['sha'];
            }
            if (($r['level'] ?? null) !== null) {
                $f[] = $r['level'];
            }
            $out .= implode("\t", $f) . "\r\n";
        }
        $out .= $this->headLines($keys);
        $temp = $this->file . '.' . bin2hex(random_bytes(16)) . '.tmp';
        if (file_put_contents($temp, $out) !== strlen($out) || !rename($temp, $this->file)) {
            @unlink($temp);
            return false;
        }
        $this->dirty = false;
        return true;
    }

    public function entry(array $rows, ?string $secret): string
    {
        $keys = self::order(array_keys($rows));
        $out = self::MAGIC . "\r\n";
        foreach ($keys as $key) {
            $r = $rows[$key];
            $f = ['I', self::escape($key), $r['size'], $r['crc']];
            if ($secret !== null) {
                $f[] = $r['sha'];
            }
            if (($r['level'] ?? null) !== null) {
                $f[] = $r['level'];
            }
            $out .= implode("\t", $f) . "\r\n";
        }
        $out .= $this->headLines($keys);
        if ($secret !== null) {
            $out .= "S\t" . strtoupper(bin2hex(sodium_crypto_sign_detached($out, $secret))) . "\r\n";
        }
        return $out;
    }
}
