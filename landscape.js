const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close');

let allImages = [];
let currentImageIndex = 0;

// Load images from the images folder
async function loadGallery() {
    try {
        // Fetch the list of images from categories/landscape.json
        const response = await fetch('categories/landscape.json');
        allImages = await response.json();
        
        allImages.forEach((imageName, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            const img = document.createElement('img');
            // Use thumbnail for grid display
            img.src = `images/landscape/thumbnails/${imageName}`;
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
        lightboxImg.src = `images/landscape/${allImages[currentImageIndex]}`;
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
