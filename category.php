<?php
// Returns the live list of image filenames for a given ?cat= category.
require __DIR__ . '/lib.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache');

$cat = (string) ($_GET['cat'] ?? '');
$categoryPath = resolve_category_path($cat);

if ($categoryPath === null) {
    http_response_code(404);
    echo json_encode([]);
    exit;
}

echo json_encode(list_images($categoryPath));
