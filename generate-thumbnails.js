const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const imagesDir = path.join(__dirname, 'images');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// Thumbnail settings
const THUMBNAIL_WIDTH = 400; // Adjust as needed
const THUMBNAIL_QUALITY = 85; // JPEG quality (1-100)

// Get all category folders
function getCategories() {
    if (!fs.existsSync(imagesDir)) {
        console.error('Error: images folder not found!');
        process.exit(1);
    }
    
    const items = fs.readdirSync(imagesDir);
    return items.filter(item => {
        const itemPath = path.join(imagesDir, item);
        return fs.statSync(itemPath).isDirectory();
    });
}

// Get all image files from a category
function getImageFiles(categoryPath) {
    const files = fs.readdirSync(categoryPath);
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
    });
}

// Check if ImageMagick or GraphicsMagick is available
async function checkImageProcessor() {
    try {
        await execPromise('convert -version');
        return 'imagemagick';
    } catch (e) {
        try {
            await execPromise('gm version');
            return 'graphicsmagick';
        } catch (e) {
            return null;
        }
    }
}

// Generate thumbnail using ImageMagick
async function generateThumbnailIM(sourcePath, destPath) {
    const cmd = `convert "${sourcePath}" -auto-orient -resize ${THUMBNAIL_WIDTH}x -quality ${THUMBNAIL_QUALITY} "${destPath}"`;
    await execPromise(cmd);
}

// Generate thumbnail using GraphicsMagick
async function generateThumbnailGM(sourcePath, destPath) {
    const cmd = `gm convert "${sourcePath}" -auto-orient -resize ${THUMBNAIL_WIDTH}x -quality ${THUMBNAIL_QUALITY} "${destPath}"`;
    await execPromise(cmd);
}

// Generate thumbnail using Node.js (fallback - requires sharp)
async function generateThumbnailSharp(sourcePath, destPath) {
    try {
        const sharp = require('sharp');
        
        await sharp(sourcePath)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(THUMBNAIL_WIDTH, null, {
                withoutEnlargement: true
            })
            .jpeg({ quality: THUMBNAIL_QUALITY })
            .toFile(destPath);
    } catch (e) {
        throw new Error('Sharp module not available. Install with: npm install sharp');
    }
}

// Main execution
async function main() {
    console.log('Checking for image processing tools...');
    
    const processor = await checkImageProcessor();
    let generateThumbnail;
    
    if (processor === 'imagemagick') {
        console.log('✓ Using ImageMagick');
        generateThumbnail = generateThumbnailIM;
    } else if (processor === 'graphicsmagick') {
        console.log('✓ Using GraphicsMagick');
        generateThumbnail = generateThumbnailGM;
    } else {
        console.log('ImageMagick/GraphicsMagick not found. Trying Sharp...');
        try {
            require('sharp');
            console.log('✓ Using Sharp');
            generateThumbnail = generateThumbnailSharp;
        } catch (e) {
            console.error('\n❌ No image processing tool found!');
            console.error('\nPlease install one of the following:');
            console.error('  1. ImageMagick: sudo apt-get install imagemagick');
            console.error('  2. GraphicsMagick: sudo apt-get install graphicsmagick');
            console.error('  3. Sharp (Node.js): npm install sharp');
            process.exit(1);
        }
    }
    
    const categories = getCategories();
    
    if (categories.length === 0) {
        console.log('No category folders found in images directory.');
        process.exit(0);
    }
    
    console.log(`\nFound ${categories.length} categories\n`);
    
    let totalGenerated = 0;
    
    for (const category of categories) {
        const categoryPath = path.join(imagesDir, category);
        const thumbnailsDir = path.join(categoryPath, 'thumbnails');
        
        // Create thumbnails directory for this category
        if (!fs.existsSync(thumbnailsDir)) {
            fs.mkdirSync(thumbnailsDir, { recursive: true });
        }
        
        const imageFiles = getImageFiles(categoryPath);
        
        if (imageFiles.length === 0) {
            console.log(`${category}: No images found`);
            continue;
        }
        
        console.log(`${category}: Generating thumbnails for ${imageFiles.length} images...`);
        let generated = 0;
        
        for (const file of imageFiles) {
            const sourcePath = path.join(categoryPath, file);
            const destPath = path.join(thumbnailsDir, file);
            
            // Regenerate all thumbnails
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            
            try {
                await generateThumbnail(sourcePath, destPath);
                generated++;
                process.stdout.write(`\r  ✓ Generated: ${generated}/${imageFiles.length}`);
            } catch (error) {
                console.error(`\n  ✗ Error processing ${file}:`, error.message);
            }
        }
        
        console.log(`\n`);
        totalGenerated += generated;
    }
    
    console.log(`✓ Complete! Generated ${totalGenerated} thumbnails total`);
}

main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});
