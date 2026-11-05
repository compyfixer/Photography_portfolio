<?php
// Returns the live list of categories (one per images/ subfolder) with titles.
require __DIR__ . '/lib.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache');

$result = [];
foreach (list_categories() as $name) {
    $path = resolve_category_path($name);
    if ($path === null) continue;
    $result[] = ['name' => $name, 'title' => get_category_title($name, $path)];
}

echo json_encode($result);
