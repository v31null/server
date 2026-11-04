<?php
require_once __DIR__ . '/order.php';

final class V31nPack
{
    const MAGIC = 'V31NSPACKFORMAT';
    const ASK = 'V31NPIELALAIMIT';
    const PATCH = "V31N267\0\0\0\0\0\0\0\0";
    const PI = "\x24\x3F\x6A\x88\x85\xA3\x08\xD3\x13\x19\x8A\x2E";
    const PHI = "\x9E\x37\x79\xB9\x7F\x4A\x7C\x15\xF3\x9C\xC0\x60";
    const MARK = 12;
    const LEAD = 27;
    const FOOT = 16;
    const LIMIT = 4503599627370496;

    public static function hex(int $crc): string
    {
        return sprintf('%08X', $crc);
    }

    private static function times(array $mat, int $vec): int
    {
        $sum = 0;
        for ($i = 0; $vec !== 0; $i++, $vec >>= 1) {
            if ($vec & 1) {
                $sum ^= $mat[$i];
            }
        }
        return $sum;
    }

    private static function square(array $mat): array
    {
        $out = [];
        for ($n = 0; $n < 32; $n++) {
            $out[$n] = self::times($mat, $mat[$n]);
        }
        return $out;
    }

    public static function combine(int $crc1, int $crc2, int $len2): int
    {
        if ($len2 <= 0) {
            return $crc1;
        }
        $odd = [0xEDB88320];
        for ($n = 1, $row = 1; $n < 32; $n++, $row <<= 1) {
            $odd[$n] = $row;
        }
        $even = self::square($odd);
        $odd = self::square($even);
        do {
            $even = self::square($odd);
            if ($len2 & 1) {
                $crc1 = self::times($even, $crc1);
            }
            $len2 >>= 1;
            if ($len2 === 0) {
                break;
            }
            $odd = self::square($even);
            if ($len2 & 1) {
                $crc1 = self::times($odd, $crc1);
            }
            $len2 >>= 1;
        } while ($len2 !== 0);
        return ($crc1 ^ $crc2) & 0xFFFFFFFF;
    }

    private static function num(int $v): string
    {
        $out = '';
        do {
            $out .= chr($v & 0xFF);
            $v >>= 8;
        } while ($v > 0);
        return $out;
    }

    private static function sep(int $marker): string
    {
        return chr($marker) . self::PHI;
    }

    private static function split(string $key): array
    {
        $slash = strrpos($key, '/');
        $base = $slash === false ? 0 : $slash + 1;
        $dot = strrpos($key, '.');
        $ext = $dot === false || $dot < $base ? strlen($key) : $dot;
        return [substr($key, 0, $base), substr($key, $base, $ext - $base), substr($key, $ext)];
    }

    public static function head(string $magic, array $items): string
    {
        $t2 = '';
        foreach ($items as [$key, $size]) {
            $t2 .= self::sep(0) . $key . self::sep(1) . self::num($size);
            foreach (self::split($key) as $part) {
                $t2 .= self::sep(1) . $part;
            }
        }
        $start = 0;
        do {
            $previous = $start;
            $header = $magic . self::PI;
            $address = $previous;
            foreach ($items as [$key, $size]) {
                $header .= self::sep(0) . $key . self::sep(1) . self::num($address);
                $address += $size;
            }
            $header .= self::PI . $t2 . self::PI;
            $start = strlen($header);
        } while ($start !== $previous);
        return $header;
    }

    public static function write(string $magic, array $files): string
    {
        $items = [];
        foreach ($files as [$key, $bytes]) {
            $items[] = [$key, strlen($bytes)];
        }
        $out = self::head($magic, $items);
        foreach ($files as [, $bytes]) {
            $out .= $bytes;
        }
        $out .= self::PI;
        return $out . pack('V', crc32($out));
    }

    private static function rows(string $buf, int $from, int $to): ?array
    {
        $out = [];
        $open = false;
        $at = $from;
        for (;;) {
            $hit = $at < $to ? strpos($buf, self::PHI, $at) : false;
            if ($hit !== false && $hit + self::MARK > $to) {
                $hit = false;
            }
            if ($hit !== false && $hit <= $at) {
                return null;
            }
            $end = $hit === false ? $to : $hit - 1;
            if ($open) {
                $out[count($out) - 1][] = substr($buf, $at, $end - $at);
            } elseif ($end !== $from) {
                return null;
            }
            if ($hit === false) {
                return $out;
            }
            $marker = ord($buf[$hit - 1]);
            if ($marker === 0) {
                $out[] = [];
                $open = true;
            } elseif ($marker !== 1 || !$open) {
                return null;
            }
            $at = $hit + self::MARK;
        }
    }

    private static function value(string $b): ?int
    {
        $n = strlen($b);
        if ($n === 0 || $n > 7) {
            return null;
        }
        $v = 0;
        for ($i = $n - 1; $i >= 0; $i--) {
            $v = ($v << 8) | ord($b[$i]);
        }
        return $v < self::LIMIT ? $v : null;
    }

    public static function parse(string $magic, string $buf): ?array
    {
        $total = strlen($buf);
        if ($total < self::LEAD + 2 * self::MARK + self::FOOT) {
            return null;
        }
        if (substr($buf, 0, 15) !== $magic || substr($buf, 15, self::MARK) !== self::PI) {
            return null;
        }
        $body = $total - self::FOOT;
        $b = strpos($buf, self::PI, self::LEAD);
        if ($b === false || $b + self::MARK > $body) {
            return null;
        }
        $c = strpos($buf, self::PI, $b + self::MARK);
        if ($c === false || $c + self::MARK > $body) {
            return null;
        }
        $t1 = self::rows($buf, self::LEAD, $b);
        $t2 = self::rows($buf, $b + self::MARK, $c);
        if ($t1 === null || $t2 === null || count($t1) !== count($t2)) {
            return null;
        }
        $sizes = [];
        foreach ($t2 as $r) {
            if (count($r) !== 5) {
                return null;
            }
            $key = $r[0];
            $size = self::value($r[1]);
            if (!mb_check_encoding($key, 'UTF-8') || $size === null || array_key_exists($key, $sizes)) {
                return null;
            }
            if ([$r[2], $r[3], $r[4]] !== self::split($key)) {
                return null;
            }
            $sizes[$key] = $size;
        }
        $next = $c + self::MARK;
        $entries = [];
        foreach ($t1 as $r) {
            if (count($r) !== 2) {
                return null;
            }
            $at = self::value($r[1]);
            if ($at === null || $at !== $next || !array_key_exists($r[0], $sizes) || $sizes[$r[0]] > $body - $next) {
                return null;
            }
            $entries[] = [$r[0], $at, $sizes[$r[0]]];
            $next += $sizes[$r[0]];
            unset($sizes[$r[0]]);
        }
        if ($next !== $body || substr($buf, $body, self::MARK) !== self::PI) {
            return null;
        }
        $crc = unpack('V', substr($buf, $body + self::MARK, 4))[1];
        if (crc32(substr($buf, 0, $body + self::MARK)) !== $crc) {
            return null;
        }
        return ['entries' => $entries, 'crc' => $crc];
    }
}
