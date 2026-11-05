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

// Get all category folders
function getCategories() {
    if (!fs.existsSync(imagesDir)) {
        console.error('Error: images folder not found!');
        console.log('Please create an "images" folder and add category subfolders.');
        process.exit(1);
    }
    
    const items = fs.readdirSync(imagesDir);
    return items.filter(item => {
        const itemPath = path.join(imagesDir, item);
        return fs.statSync(itemPath).isDirectory() && item !== 'thumbnails';
    });
}

// Get image files from a category
function getImageFiles(categoryPath) {
    const files = fs.readdirSync(categoryPath);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext) && file !== 'thumbnails';
    });
    return imageFiles.sort();
}

// Main execution
try {
    const categories = getCategories();
    
    if (categories.length === 0) {
        console.log('No category folders found in images directory.');
        console.log('Please create category folders like images/film/, images/wildlife/, etc.');
        process.exit(0);
    }
    
    console.log(`Found ${categories.length} categories:\n`);
    
    let totalImages = 0;
    
    categories.forEach(category => {
        const categoryPath = path.join(imagesDir, category);
        const imageFiles = getImageFiles(categoryPath);
        
        if (imageFiles.length > 0) {
            const outputPath = path.join(categoriesDir, `${category}.json`);
            const jsonContent = JSON.stringify(imageFiles, null, 2);
            fs.writeFileSync(outputPath, jsonContent, 'utf8');
            
            console.log(`✓ ${category}: ${imageFiles.length} images`);
            totalImages += imageFiles.length;
        } else {
            console.log(`- ${category}: 0 images`);
        }
    });
    
    console.log(`\n✓ Total: ${totalImages} images across ${categories.length} categories`);
    
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
