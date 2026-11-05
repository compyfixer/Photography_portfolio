<?php
// Serves a thumbnail for images/<cat>/<file>, generating and caching it on first request.
require __DIR__ . '/lib.php';

$cat = (string) ($_GET['cat'] ?? '');
$file = basename((string) ($_GET['file'] ?? ''));

$categoryPath = resolve_category_path($cat);
if ($categoryPath === null || $file === '') {
    http_response_code(404);
    exit;
}

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
if (!in_array($ext, IMAGE_EXTENSIONS, true)) {
    http_response_code(404);
    exit;
}

// Re-validate the resolved source path stays inside the category folder.
$sourcePath = realpath($categoryPath . '/' . $file);
if ($sourcePath === false || strpos($sourcePath, $categoryPath . DIRECTORY_SEPARATOR) !== 0 || !is_file($sourcePath)) {
    http_response_code(404);
    exit;
}

header('X-Content-Type-Options: nosniff');

// SVGs are vector and risky to rasterize - serve the original file as-is.
if ($ext === 'svg') {
    header('Content-Type: ' . MIME_TYPES[$ext]);
    header('Cache-Control: public, max-age=86400');
    readfile($sourcePath);
    exit;
}

$thumbDir = $categoryPath . '/thumbnails';
$thumbPath = $thumbDir . '/' . $file;

if (!is_file($thumbPath) || filemtime($sourcePath) > filemtime($thumbPath)) {
    if (!is_dir($thumbDir)) {
        mkdir($thumbDir, 0755, true);
    }
    if (!generate_thumbnail($sourcePath, $thumbPath, $ext)) {
        // Fall back to the original image if thumbnailing failed
        $thumbPath = $sourcePath;
    }
}

header('Content-Type: ' . MIME_TYPES[$ext]);
header('Cache-Control: public, max-age=86400');
header('Content-Length: ' . (string) filesize($thumbPath));
readfile($thumbPath);
