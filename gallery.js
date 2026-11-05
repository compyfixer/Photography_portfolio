const gallery = document.getElementById('gallery');
const galleryTitle = document.getElementById('gallery-title');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close');

// Category comes from the URL, e.g. gallery.html?cat=wildlife
const category = new URLSearchParams(window.location.search).get('cat');

let allImages = [];
let currentImageIndex = 0;

function titleCase(name) {
    return name
        .replace(/[-_]+/g, ' ')
        .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1));
}

// Load images for the requested category
async function loadGallery() {
    if (!category) {
        gallery.innerHTML = '<p style="padding: 2rem; text-align: center;">No category specified.</p>';
        return;
    }

    galleryTitle.textContent = titleCase(category);

    try {
        // Prefer the title from categories.php if one was found for this category
        const categoriesResponse = await fetch('categories.php');
        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            const entry = categories.find(item => item.name === category);
            if (entry && entry.title) {
                galleryTitle.textContent = entry.title;
            }
        }
    } catch (e) {
        // Category list is optional here; fall back to the derived title
    }

    document.title = `${galleryTitle.textContent} - Photography Portfolio`;

    try {
        const response = await fetch(`category.php?cat=${encodeURIComponent(category)}`);
        allImages = await response.json();

        allImages.forEach((imageName, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            const img = document.createElement('img');
            // Use thumbnail for grid display
            img.src = `thumb.php?cat=${encodeURIComponent(category)}&file=${encodeURIComponent(imageName)}`;
            img.alt = imageName;
            img.loading = 'lazy';


            galleryItem.appendChild(img);
            // Load full resolution image in lightbox
            galleryItem.addEventListener('click', () => openLightbox(index));

            gallery.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('Error loading images:', error);
        gallery.innerHTML = '<p style="padding: 2rem; text-align: center;">No images found. Please add images to the images folder.</p>';
    }
}

// Open lightbox with clicked image
function openLightbox(index) {
    currentImageIndex = index;
    showImage(currentImageIndex);
    lightbox.classList.add('active');
}

// Show image at specific index
function showImage(index) {
    if (index >= 0 && index < allImages.length) {
        currentImageIndex = index;
        lightboxImg.src = `images/${category}/${allImages[currentImageIndex]}`;
    }
}

// Navigate to next image
function nextImage() {
    if (currentImageIndex < allImages.length - 1) {
        showImage(currentImageIndex + 1);
    }
}

// Navigate to previous image
function prevImage() {
    if (currentImageIndex > 0) {
        showImage(currentImageIndex - 1);
    }
}

// Close lightbox
function closeLightbox() {
    lightbox.classList.remove('active');
}

// Touch/swipe handling
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 50;

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
}

function handleTouchMove(e) {
    // Prevent default scrolling while swiping
    if (lightbox.classList.contains('active')) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
}

function handleSwipe() {
    const swipeDistanceX = touchStartX - touchEndX;
    const swipeDistanceY = touchStartY - touchEndY;

    // Only register horizontal swipes (ignore if vertical movement is greater)
    if (Math.abs(swipeDistanceX) > minSwipeDistance && Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY)) {
        if (swipeDistanceX > 0) {
            // Swiped left - next image
            nextImage();
        } else {
            // Swiped right - previous image
            prevImage();
        }
    }
}

// Event listeners
closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
        closeLightbox();
    } else if (e.key === 'ArrowRight') {
        nextImage();
    } else if (e.key === 'ArrowLeft') {
        prevImage();
    }
});

// Touch/swipe events
lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
lightbox.addEventListener('touchmove', handleTouchMove, { passive: false });
lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });

// Initialize gallery
loadGallery();
