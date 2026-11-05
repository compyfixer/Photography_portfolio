const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');
const categoriesDir = path.join(__dirname, 'categories');

// Supported image extensions
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

// Create categories directory if needed
if (!fs.existsSync(categoriesDir)) {
    fs.mkdirSync(categoriesDir);
}

// Turn a folder name like "street_photography" into "Street Photography"
function titleCase(name) {
    return name
        .replace(/[-_]+/g, ' ')
        .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1));
}

// Optional images/<category>/meta.json can override the auto-generated title,
// e.g. { "title": "Buildings & Architecture" }
function getCategoryTitle(category, categoryPath) {
    const metaPath = path.join(categoryPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (meta.title) return meta.title;
        } catch (e) {
            console.warn(`  ! Could not parse meta.json for ${category}: ${e.message}`);
        }
    }
    return titleCase(category);
}

// Get all category folders
function getCategories() {
    if (!fs.existsSync(imagesDir)) {
        console.error('Error: images folder not found!');
        process.exit(1);
    }
    
    const items = fs.readdirSync(imagesDir);
    return items.filter(item => {
        const itemPath = path.join(imagesDir, item);
        return fs.statSync(itemPath).isDirectory() && item !== 'thumbnails';
    }).sort();
}

// Get image files from a category
function getImageFiles(categoryPath) {
    const files = fs.readdirSync(categoryPath);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
    });
    return imageFiles.sort();
}

// Remove categories/<name>.json files for folders that no longer exist under images/
function removeStaleCategoryFiles(currentCategories) {
    const keep = new Set([...currentCategories.map(c => `${c}.json`), 'manifest.json']);
    for (const file of fs.readdirSync(categoriesDir)) {
        if (file.endsWith('.json') && !keep.has(file)) {
            fs.unlinkSync(path.join(categoriesDir, file));
            console.log(`  - removed stale ${file}`);
        }
    }
}

// Main execution
try {
    const categories = getCategories();
    
    if (categories.length === 0) {
        console.log('No category folders found in images directory.');
        process.exit(0);
    }
    
    console.log(`Found ${categories.length} categories:`);
    
    let totalImages = 0;
    const manifest = [];
    
    categories.forEach(category => {
        const categoryPath = path.join(imagesDir, category);
        const imageFiles = getImageFiles(categoryPath);
        const title = getCategoryTitle(category, categoryPath);
        
        manifest.push({ name: category, title });
        
        if (imageFiles.length > 0) {
            const outputPath = path.join(categoriesDir, `${category}.json`);
            const jsonContent = JSON.stringify(imageFiles, null, 2);
            fs.writeFileSync(outputPath, jsonContent, 'utf8');
            
            console.log(`  ✓ ${category}: ${imageFiles.length} images`);
            totalImages += imageFiles.length;
        } else {
            console.log(`  - ${category}: 0 images`);
        }
    });
    
    removeStaleCategoryFiles(categories);
    
    const manifestPath = path.join(categoriesDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    console.log(`\n✓ Total: ${totalImages} images across ${categories.length} categories`);
    
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
