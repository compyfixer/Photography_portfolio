const categoriesContainer = document.getElementById('categories');

// The category list and thumbnails are generated live by categories.php/category.php/thumb.php
// from the images/ folders - no build step needed.
async function loadCategories() {
    let categories = [];
    try {
        const categoriesResponse = await fetch('categories.php');
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }
    } catch (e) {
        console.error('Error loading categories.php:', e);
    }

    if (categories.length === 0) {
        categoriesContainer.innerHTML = '<p class="placeholder-message">No categories found. Add a folder under images/.</p>';
        return;
    }

    for (const category of categories) {
        try {
            // Get list of images
            let imageFiles = [];
            try {
                const files = await fetch(`category.php?cat=${encodeURIComponent(category.name)}`);
                if (files.ok) {
                    imageFiles = await files.json();
                }
            } catch (e) {}
            
            const categoryCard = document.createElement('a');
            categoryCard.className = 'category-card';
            categoryCard.href = `gallery.html?cat=${encodeURIComponent(category.name)}`;
            
            const previewDiv = document.createElement('div');
            previewDiv.className = 'category-preview';
            
            // Show up to 6 thumbnail images (fills the 3x2 preview grid exactly)
            const previewCount = Math.min(imageFiles.length, 6);
            for (let i = 0; i < previewCount; i++) {
                const img = document.createElement('img');
                img.src = `thumb.php?cat=${encodeURIComponent(category.name)}&file=${encodeURIComponent(imageFiles[i])}`;
                img.alt = imageFiles[i];
                img.loading = 'lazy';
                previewDiv.appendChild(img);
            }
            
            // If no images, show placeholder
            if (previewCount === 0) {
                previewDiv.innerHTML = '<div class="placeholder-message">Coming soon</div>';
                previewDiv.style.gridTemplateColumns = '1fr';
                previewDiv.style.display = 'flex';
                previewDiv.style.alignItems = 'center';
                previewDiv.style.justifyContent = 'center';
            }
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'category-info';

            const nameHeading = document.createElement('h2');
            nameHeading.className = 'category-name';
            nameHeading.textContent = category.title;

            const countPara = document.createElement('p');
            countPara.className = 'category-count';
            countPara.textContent = `${imageFiles.length} ${imageFiles.length === 1 ? 'photo' : 'photos'}`;

            infoDiv.appendChild(nameHeading);
            infoDiv.appendChild(countPara);
            
            categoryCard.appendChild(previewDiv);
            categoryCard.appendChild(infoDiv);
            categoriesContainer.appendChild(categoryCard);
            
        } catch (error) {
            console.error(`Error loading category ${category.name}:`, error);
        }
    }
}

loadCategories();

