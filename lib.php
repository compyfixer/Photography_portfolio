<?php
// Shared helpers for the dynamic category/image/thumbnail endpoints.
// Nothing here is reachable directly as a page - it's included by the *.php endpoints.

define('IMAGES_DIR', __DIR__ . '/images');
define('IMAGE_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']);
define('THUMBNAIL_WIDTH', 400);
define('THUMBNAIL_QUALITY', 85);

const MIME_TYPES = [
    'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
    'gif' => 'image/gif', 'webp' => 'image/webp', 'bmp' => 'image/bmp',
    'svg' => 'image/svg+xml',
];

function title_case(string $name): string {
    $name = str_replace(['-', '_'], ' ', $name);
    return mb_convert_case($name, MB_CASE_TITLE, 'UTF-8');
}

// Validates a category name and resolves it to a real path strictly inside IMAGES_DIR,
// preventing path traversal. Returns null if the category doesn't exist or is unsafe.
function resolve_category_path(string $name): ?string {
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $name)) {
        return null;
    }
    $imagesReal = realpath(IMAGES_DIR);
    $path = $imagesReal !== false ? realpath($imagesReal . '/' . $name) : false;
    if ($imagesReal === false || $path === false) {
        return null;
    }
    if (strpos($path, $imagesReal . DIRECTORY_SEPARATOR) !== 0) {
        return null;
    }
    if (!is_dir($path) || basename($path) === 'thumbnails') {
        return null;
    }
    return $path;
}

function list_categories(): array {
    $result = [];
    if (!is_dir(IMAGES_DIR)) {
        return $result;
    }
    foreach (scandir(IMAGES_DIR) as $entry) {
        if ($entry === '.' || $entry === '..' || $entry === 'thumbnails') continue;
        if (is_dir(IMAGES_DIR . '/' . $entry)) {
            $result[] = $entry;
        }
    }
    sort($result);
    return $result;
}

// Optional images/<category>/meta.json can override the auto-generated title,
// e.g. { "title": "Buildings & Architecture" }
function get_category_title(string $name, string $categoryPath): string {
    $metaPath = $categoryPath . '/meta.json';
    if (is_file($metaPath)) {
        $meta = json_decode((string) file_get_contents($metaPath), true);
        if (is_array($meta) && !empty($meta['title'])) {
            return (string) $meta['title'];
        }
    }
    return title_case($name);
}

function list_images(string $categoryPath): array {
    $files = [];
    foreach (scandir($categoryPath) as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $full = $categoryPath . '/' . $entry;
        if (!is_file($full)) continue;
        $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if (in_array($ext, IMAGE_EXTENSIONS, true)) {
            $files[] = $entry;
        }
    }
    sort($files);
    return $files;
}

// Generates (or regenerates) a resized thumbnail. Returns true on success.
function generate_thumbnail(string $sourcePath, string $destPath, string $ext): bool {
    try {
        if (extension_loaded('imagick')) {
            $img = new Imagick($sourcePath);
            $img->autoOrient();
            $img->resizeImage(THUMBNAIL_WIDTH, 0, Imagick::FILTER_LANCZOS, 1);
            $img->setImageCompressionQuality(THUMBNAIL_QUALITY);
            $img->stripImage();
            $img->writeImage($destPath);
            $img->destroy();
            return true;
        }
        if (extension_loaded('gd')) {
            return generate_thumbnail_gd($sourcePath, $destPath, $ext);
        }
    } catch (Throwable $e) {
        error_log('Thumbnail generation failed for ' . $sourcePath . ': ' . $e->getMessage());
    }
    return false;
}

function generate_thumbnail_gd(string $sourcePath, string $destPath, string $ext): bool {
    $info = getimagesize($sourcePath);
    if ($info === false) return false;
    [$width, $height] = $info;
    if ($width <= 0 || $height <= 0) return false;

    $newWidth = min(THUMBNAIL_WIDTH, $width);
    $newHeight = (int) round($height * ($newWidth / $width));

    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $src = @imagecreatefromjpeg($sourcePath);
            break;
        case 'png':
            $src = @imagecreatefrompng($sourcePath);
            break;
        case 'gif':
            $src = @imagecreatefromgif($sourcePath);
            break;
        case 'webp':
            $src = @imagecreatefromwebp($sourcePath);
            break;
        case 'bmp':
            $src = @imagecreatefrombmp($sourcePath);
            break;
        default:
            return false;
    }
    if (!$src) return false;

    $dst = imagecreatetruecolor($newWidth, $newHeight);
    if (in_array($ext, ['png', 'gif', 'webp'], true)) {
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
    }
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    $result = false;
    switch ($ext) {
        case 'jpg':
        case 'jpeg':
            $result = imagejpeg($dst, $destPath, THUMBNAIL_QUALITY);
            break;
        case 'png':
            $result = imagepng($dst, $destPath);
            break;
        case 'gif':
            $result = imagegif($dst, $destPath);
            break;
        case 'webp':
            $result = imagewebp($dst, $destPath, THUMBNAIL_QUALITY);
            break;
        case 'bmp':
            $result = imagebmp($dst, $destPath);
            break;
    }
    imagedestroy($src);
    imagedestroy($dst);
    return $result;
}
