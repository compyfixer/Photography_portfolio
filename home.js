const categoriesContainer = document.getElementById('categories');

const categories = [
    {
        name: 'film',
        title: 'Film Photography',
        page: 'film.html'
    },
    {
        name: 'wildlife',
        title: 'Wildlife',
        page: 'wildlife.html'
    },
    {
        name: 'landscape',
        title: 'Landscape',
        page: 'landscape.html'
    },
    {
        name: 'portrait',
        title: 'Portrait',
        page: 'portrait.html'
    },
    {
       name: 'general',
       title: 'General',
        page: 'general.html'
    }
];

async function loadCategories() {
    for (const category of categories) {
        try {
            // Check if images exist for this category
            const response = await fetch(`images/${category.name}/thumbnails/`);
            const thumbnailsExist = response.ok;
            
            // Get list of images
            let imageFiles = [];
            try {
                const files = await fetch(`categories/${category.name}.json`);
                if (files.ok) {
                    imageFiles = await files.json();
                }
            } catch (e) {
                // Fallback: try to read from main images.json if it's film category
                if (category.name === 'film') {
                    try {
                        const filmFiles = await fetch('images.json');
                        if (filmFiles.ok) {
                            imageFiles = await filmFiles.json();
                        }
                    } catch (err) {}
                }
            }
            
            const categoryCard = document.createElement('a');
            categoryCard.className = 'category-card';
            categoryCard.href = category.page;
            
            const previewDiv = document.createElement('div');
            previewDiv.className = 'category-preview';
            
            // Show up to 5 thumbnail images
            const previewCount = Math.min(imageFiles.length, 5);
            for (let i = 0; i < previewCount; i++) {
                const img = document.createElement('img');
                img.src = `images/${category.name}/thumbnails/${imageFiles[i]}`;
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
            infoDiv.innerHTML = `
                <h2 class="category-name">${category.title}</h2>
                <p class="category-count">${imageFiles.length} ${imageFiles.length === 1 ? 'photo' : 'photos'}</p>
            `;
            
            categoryCard.appendChild(previewDiv);
            categoryCard.appendChild(infoDiv);
            categoriesContainer.appendChild(categoryCard);
            
        } catch (error) {
            console.error(`Error loading category ${category.name}:`, error);
        }
    }
}

loadCategories();
