<?php
final class V31nOrder
{
    private static ?array $ranges = null;
    private static ?array $slots = null;
    private static ?array $shifts = null;

    private static function load(): void
    {
        if (self::$slots !== null) {
            return;
        }
        $t = json_decode(file_get_contents(__DIR__ . '/tables.json'), true);
        self::$ranges = $t['ranges'];
        self::$shifts = $t['lower'];
        self::$slots = [];
        foreach ($t['slots'] as [$c, $rank, $place]) {
            self::$slots[$c] = [$rank, $place];
        }
    }

    private static function range(int $c): ?array
    {
        $lo = 0;
        $hi = count(self::$ranges) - 1;
        $hit = null;
        while ($lo <= $hi) {
            $mid = intdiv($lo + $hi, 2);
            if (self::$ranges[$mid][0] <= $c) {
                $hit = $mid;
                $lo = $mid + 1;
            } else {
                $hi = $mid - 1;
            }
        }
        return $hit !== null && $c <= self::$ranges[$hit][1] ? self::$ranges[$hit] : null;
    }

    private static function space(int $c): bool
    {
        $r = self::range($c);
        return $r !== null && $r[2];
    }

    private static function loose(int $c): bool
    {
        return self::range($c) !== null;
    }

    private static function points(string $s): array
    {
        return $s === '' ? [] : array_map('mb_ord', mb_str_split($s, 1, 'UTF-8'));
    }

    private static function text(array $p): string
    {
        return implode('', array_map('mb_chr', $p));
    }

    private static function normal(string $s, int $form): string
    {
        if ($s === '') {
            return $s;
        }
        $n = Normalizer::normalize($s, $form);
        return $n === false ? $s : $n;
    }

    private static function lowerCase(int $c): int
    {
        $lo = 0;
        $hi = count(self::$shifts) - 1;
        $hit = null;
        while ($lo <= $hi) {
            $mid = intdiv($lo + $hi, 2);
            if (self::$shifts[$mid][0] <= $c) {
                $hit = $mid;
                $lo = $mid + 1;
            } else {
                $hi = $mid - 1;
            }
        }
        if ($hit === null) {
            return $c;
        }
        [$first, $last, $step, $delta] = self::$shifts[$hit];
        return $c > $last || ($c - $first) % $step !== 0 ? $c : $c + $delta;
    }

    private static function fold(string $name): array
    {
        $t = self::points($name);
        $i = 0;
        while ($i < count($t) && self::space($t[$i])) {
            $i++;
        }
        if ($i < count($t) && $t[$i] === 0x5B) {
            $close = array_search(0x5D, array_slice($t, $i + 1), true);
            if ($close !== false && $close > 0) {
                $t = array_slice($t, $i + 1, $close);
            }
        }
        $i = 0;
        while ($i < count($t) && self::loose($t[$i])) {
            $i++;
        }
        $t = array_slice($t, $i);

        $d = self::points(self::normal(self::text($t), Normalizer::FORM_D));
        $doubled = [];
        for ($k = 0; $k < count($d); $k++) {
            if ($d[$k] !== 0x0A && $k + 1 < count($d) && $d[$k + 1] === 0x308) {
                $doubled[] = $d[$k];
                $doubled[] = $d[$k];
                $k++;
            } else {
                $doubled[] = $d[$k];
            }
        }
        $t = self::points(self::normal(self::text($doubled), Normalizer::FORM_C));

        $numbered = [];
        for ($k = 0; $k < count($t);) {
            if ($t[$k] === 0x2116) {
                $j = $k + 1;
                while ($j < count($t) && self::space($t[$j])) {
                    $j++;
                }
                $start = $j;
                while ($j < count($t) && $t[$j] >= 0x30 && $t[$j] <= 0x39) {
                    $j++;
                }
                if ($j > $start) {
                    $lead = $start;
                    while ($lead + 1 < $j && $t[$lead] === 0x30) {
                        $lead++;
                    }
                    $digits = array_slice($t, $lead, $j - $lead);
                    $numbered[] = 0x2116;
                    for ($p = count($digits); $p < 5; $p++) {
                        $numbered[] = 0x30;
                    }
                    array_push($numbered, ...$digits);
                    $k = $j;
                    continue;
                }
            }
            $numbered[] = $t[$k];
            $k++;
        }

        return array_map([self::class, 'lowerCase'], $numbered);
    }

    private static function stem(string $name): string
    {
        $dot = strrpos($name, '.');
        return $dot === false || $dot === 0 ? $name : substr($name, 0, $dot);
    }

    private static function rank(array $s1, array $s2): int
    {
        $min = min(count($s1), count($s2));
        for ($i = 0; $i < $min; $i++) {
            $c1 = $s1[$i];
            $c2 = $s2[$i];
            if ($c1 === $c2) {
                continue;
            }
            $r1 = self::$slots[$c1] ?? null;
            $r2 = self::$slots[$c2] ?? null;
            if ($r1 !== null && $r2 !== null) {
                if ($r1[0] !== $r2[0]) {
                    return $r1[0] < $r2[0] ? -1 : 1;
                }
            } elseif ($r1 !== null) {
                return -1;
            } elseif ($r2 !== null) {
                return 1;
            } else {
                return $c1 < $c2 ? -1 : 1;
            }
        }
        return count($s1) <=> count($s2);
    }

    private static function place(array $s1, array $s2): int
    {
        $min = min(count($s1), count($s2));
        for ($i = 0; $i < $min; $i++) {
            if ($s1[$i] === $s2[$i]) {
                continue;
            }
            $r1 = self::$slots[$s1[$i]] ?? null;
            $r2 = self::$slots[$s2[$i]] ?? null;
            if ($r1 !== null && $r2 !== null && $r1[1] !== $r2[1]) {
                return $r1[1] < $r2[1] ? -1 : 1;
            }
            return 0;
        }
        return 0;
    }

    private static function capital(int $c): bool
    {
        return self::lowerCase($c) !== $c;
    }

    private static function cases(array $s1, array $s2): int
    {
        $min = min(count($s1), count($s2));
        for ($i = 0; $i < $min; $i++) {
            $c1 = self::capital($s1[$i]);
            $c2 = self::capital($s2[$i]);
            if ($c1 !== $c2) {
                return $c1 ? -1 : 1;
            }
        }
        return 0;
    }

    public static function name(string $a, string $b): int
    {
        self::load();
        $stemA = self::fold(self::stem($a));
        $stemB = self::fold(self::stem($b));
        $c = self::rank($stemA, $stemB);
        if ($c !== 0) {
            return $c;
        }
        $foldA = self::fold($a);
        $foldB = self::fold($b);
        $c = self::rank($foldA, $foldB);
        if ($c !== 0) {
            return $c;
        }
        $c = self::place($stemA, $stemB);
        if ($c !== 0) {
            return $c;
        }
        $c = self::place($foldA, $foldB);
        if ($c !== 0) {
            return $c;
        }
        $pointsA = self::points($a);
        $pointsB = self::points($b);
        $c = self::cases($pointsA, $pointsB);
        if ($c !== 0) {
            return $c;
        }
        if (count($pointsA) !== count($pointsB)) {
            return count($pointsA) < count($pointsB) ? -1 : 1;
        }
        return $pointsA <=> $pointsB;
    }

    public static function key(string $a, string $b): int
    {
        $pa = explode('/', $a);
        $pb = explode('/', $b);
        $n = min(count($pa), count($pb));
        for ($i = 0; $i < $n; $i++) {
            $folderA = $i < count($pa) - 1;
            $folderB = $i < count($pb) - 1;
            if ($folderA !== $folderB) {
                return $folderA ? -1 : 1;
            }
            $c = self::name($pa[$i], $pb[$i]);
            if ($c !== 0) {
                return $c;
            }
        }
        return count($pa) <=> count($pb);
    }
}
