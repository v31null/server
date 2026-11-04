<?php

function v31np_settings(string $name): array
{
    $all = json_decode((string)@file_get_contents(dirname(__DIR__) . '/settings.json'), true);
    $all = is_array($all) ? $all : [];
    $own = is_array($all['archives'][$name] ?? null) ? $all['archives'][$name] : [];
    unset($all['archives']);
    return $own + $all + ['empty' => '268', 'behind' => '268', 'send' => ['S'], 'sign' => ''];
}
