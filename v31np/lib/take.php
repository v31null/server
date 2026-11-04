<?php

const V31NP_TYPES = ['html', 'htm', 'css', 'js', 'mjs', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'bmp', 'woff', 'woff2', 'ttf', 'otf',
    'mp3', 'wav', 'ogg', 'oga', 'opus', 'm4a', 'aac', 'flac', 'mp4', 'm4v', 'webm', 'ogv', 'mov', 'vtt'];

function v31np_types(array $settings): array
{
    $extra = array_map(fn($t) => strtolower(ltrim((string)$t, '.')), (array)($settings['types'] ?? []));
    return array_values(array_unique(array_merge(V31NP_TYPES, $extra)));
}

function v31np_rules(string $dir): array
{
    $text = @file_get_contents($dir . '/.htaccess');
    if ($text === false) {
        return [];
    }
    $rules = [];
    $block = null;
    foreach (preg_split('/\r?\n/', $text) as $raw) {
        $line = trim($raw);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        if (preg_match('/^<FilesMatch\s+"?([^">]+)"?\s*>$/i', $line, $m)) {
            $block = ['match', $m[1]];
            continue;
        }
        if (preg_match('/^<Files\s+"?([^">]+)"?\s*>$/i', $line, $m)) {
            $block = ['files', $m[1]];
            continue;
        }
        if (preg_match('/^<\/Files(Match)?>$/i', $line)) {
            $block = null;
            continue;
        }
        $verdict = null;
        if (preg_match('/^Require\s+all\s+denied$/i', $line) || preg_match('/^Deny\s+from\s+all$/i', $line)) {
            $verdict = true;
        } elseif (preg_match('/^Require\s+all\s+granted$/i', $line)) {
            $verdict = false;
        }
        if ($verdict !== null) {
            $rules[] = [$block === null ? 'all' : $block[0], $block[1] ?? '', $verdict];
            continue;
        }
        if ($block === null && preg_match('/^RedirectMatch\s+(403|404|410|gone)\s+"?([^"\s]+)"?/i', $line, $m)) {
            $rules[] = ['url', $m[2], true];
            continue;
        }
        if ($block === null && preg_match('/^RewriteRule\s+"?([^"\s]+)"?\s+-\s+\[([^\]]*)\]/i', $line, $m) && preg_match('/(^|,)\s*(F|G|forbidden|gone)\s*(,|$)/i', $m[2])) {
            $rules[] = ['rewrite', $m[1], true];
        }
    }
    return $rules;
}

function v31np_regex(string $pattern, string $subject): bool
{
    $r = @preg_match('~' . str_replace('~', '\~', $pattern) . '~u', $subject);
    return $r === 1;
}

function v31np_denied(string $root, string $key, array &$cache): bool
{
    $parts = explode('/', $key);
    $base = array_pop($parts);
    $denied = false;
    $dir = $root;
    $rel = '';
    for ($i = 0; $i <= count($parts); $i++) {
        if (!isset($cache[$dir])) {
            $cache[$dir] = v31np_rules($dir);
        }
        $below = substr($key, strlen($rel));
        foreach ($cache[$dir] as [$kind, $pattern, $verdict]) {
            $hit = match ($kind) {
                'all' => true,
                'match' => v31np_regex($pattern, $base),
                'files' => fnmatch($pattern, $base),
                'url' => v31np_regex($pattern, '/' . $key),
                'rewrite' => v31np_regex($pattern, $below),
            };
            if ($hit) {
                $denied = $verdict;
            }
        }
        if ($i < count($parts)) {
            $dir .= '/' . $parts[$i];
            $rel .= $parts[$i] . '/';
        }
    }
    return $denied;
}
