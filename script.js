// Performance optimizations
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Advanced Modal scroll lock utilities with precise position restoration
let scrollPosition = 0;
let isModalOpen = false;
let savedScrollPosition = 0;
let scrollRestorationTimeout = null;

function lockBodyScroll() {
    if (isModalOpen) return; // Already locked
    
    // Save current scroll position precisely
    savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    isModalOpen = true;
    
    // Apply styles to prevent scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    
    // Also prevent scrolling on html element
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    
    // Store scroll position in sessionStorage as backup
    sessionStorage.setItem('modalScrollPosition', savedScrollPosition.toString());
}

function unlockBodyScroll() {
    if (!isModalOpen) return; // Not locked
    
    isModalOpen = false;
    
    // Remove styles first
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    
    document.documentElement.style.overflow = '';
    document.documentElement.style.position = '';
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';
    
    // Clear any existing timeout
    if (scrollRestorationTimeout) {
        clearTimeout(scrollRestorationTimeout);
    }
    
    // Restore scroll position with precise timing
    scrollRestorationTimeout = setTimeout(() => {
        // Use the enhanced scroll restoration utility
        restoreScrollPosition();
        
        // Clear the stored position
        sessionStorage.removeItem('modalScrollPosition');
        
        // Reset scroll restoration to auto after a short delay
        setTimeout(() => {
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'auto';
            }
        }, 100);
        
    }, 10); // Small delay to ensure DOM is ready
}

// Prevent scroll on modal content when reaching boundaries
function preventModalScroll(modalElement) {
    // Store original scroll position for restoration
    let originalScrollPosition = 0;
    
    modalElement.addEventListener('wheel', function(e) {
        const modalContent = modalElement.querySelector('.venue-details-content, .gallery-details-modal-content, .enhanced-details-content, .image-only-content');
        if (!modalContent) return;
        
        const isScrollable = modalContent.scrollHeight > modalContent.clientHeight;
        if (!isScrollable) {
            e.preventDefault();
            return;
        }
        
        const scrollTop = modalContent.scrollTop;
        const scrollHeight = modalContent.scrollHeight;
        const clientHeight = modalContent.clientHeight;
        
        // Prevent scrolling past boundaries
        if ((e.deltaY < 0 && scrollTop <= 0) || 
            (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent touch scroll on mobile
    modalElement.addEventListener('touchmove', function(e) {
        const modalContent = modalElement.querySelector('.venue-details-content, .gallery-details-modal-content, .enhanced-details-content, .image-only-content');
        if (!modalContent) {
            e.preventDefault();
            return;
        }
        
        const isScrollable = modalContent.scrollHeight > modalContent.clientHeight;
        if (!isScrollable) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Store scroll position when modal opens
    modalElement.addEventListener('click', function(e) {
        if (e.target === modalElement) {
            originalScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        }
    });
}

// Cache DOM elements for better performance
const domCache = new Map();
const getElement = (selector) => {
    if (!domCache.has(selector)) {
        const element = document.querySelector(selector);
        if (element) domCache.set(selector, element);
    }
    return domCache.get(selector);
};

const getElements = (selector) => {
    if (!domCache.has(selector + '_all')) {
        const elements = document.querySelectorAll(selector);
        if (elements.length) domCache.set(selector + '_all', elements);
    }
    return domCache.get(selector + '_all');
};

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
        initializeMobileMenu();
        initializeDropdowns();
        initializeActiveStates();
        initializeHeroSlider();
        initializeGallery();
        initializeAnimations();
        initializeContactForm();
        initializeSmoothScrolling();
        initializeModalKeyHandlers();
    });
});

// Function to open Google Maps with directions
function openGoogleMaps() {
    const address = "Indiranagar, Old E Seva Backside, SanthaPet, Chittoor, Andhra Pradesh, India";
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
}

// Initialize modal key handlers for ESC key support
function initializeModalKeyHandlers() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open modal
            const openModals = document.querySelectorAll('.gallery-details-modal[style*="display: flex"], .venue-details-modal[style*="display: flex"], .enhanced-details-modal[style*="display: flex"], .image-only-modal[style*="display: flex"]');
            
            if (openModals.length > 0) {
                const modal = openModals[0];
                if (modal.classList.contains('gallery-details-modal')) {
                    closeGalleryModal();
                } else if (modal.classList.contains('venue-details-modal')) {
                    closeVenueDetailsModal();
                } else if (modal.classList.contains('enhanced-details-modal')) {
                    closeEnhancedDetails();
                } else if (modal.classList.contains('image-only-modal')) {
                    closeImageOnly();
                }
            }
        }
    });
}

// Enhanced modal opening function with scroll position management
function openModalWithScrollLock(modal, scrollToTop = false) {
    if (scrollToTop) {
        // Scroll to top smoothly before opening modal
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Small delay to ensure scroll is complete
    setTimeout(() => {
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        // Trigger animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });
        
        lockBodyScroll();
    }, scrollToTop ? 300 : 10);
}

// Additional utility function for precise scroll restoration
function restoreScrollPosition() {
    // Multiple fallback methods for scroll restoration
    const positionToRestore = parseInt(sessionStorage.getItem('modalScrollPosition')) || savedScrollPosition;
    
    if (positionToRestore > 0) {
        // Method 1: Using scrollTo with instant behavior
        try {
            window.scrollTo({
                top: positionToRestore,
                left: 0,
                behavior: 'instant'
            });
        } catch (e) {
            // Method 2: Fallback for browsers that don't support 'instant'
            window.scrollTo(0, positionToRestore);
        }
        
        // Method 3: Additional fallback using scrollTop
        setTimeout(() => {
            if (window.pageYOffset !== positionToRestore) {
                document.documentElement.scrollTop = positionToRestore;
                document.body.scrollTop = positionToRestore;
            }
        }, 50);
    }
}

// Mobile Menu Functionality
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navbarNav = document.querySelector('.navbar-nav');
    
    if (mobileToggle && navbarNav) {
        mobileToggle.addEventListener('click', function() {
            // Toggle mobile menu
            navbarNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = navbarNav.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close mobile menu when clicking on nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // If it's a dropdown link, handle differently
                if (this.parentElement.classList.contains('dropdown')) {
                    e.preventDefault();
                    handleMobileDropdown(this.parentElement);
                } else {
                    // Close mobile menu
                    navbarNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navbarNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                navbarNav.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Handle Mobile Dropdown
function handleMobileDropdown(dropdownElement) {
    const dropdownMenu = dropdownElement.querySelector('.dropdown-menu');
    const chevronIcon = dropdownElement.querySelector('.fa-chevron-down');
    
    if (dropdownMenu) {
        dropdownElement.classList.toggle('active');
        
        // Rotate chevron icon
        if (chevronIcon) {
            chevronIcon.style.transform = dropdownElement.classList.contains('active') 
                ? 'rotate(180deg)' 
                : 'rotate(0deg)';
        }
    }
}

// Initialize Dropdown Functionality
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        let timeoutId;
        
        // Show dropdown on hover (desktop only)
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                clearTimeout(timeoutId);
                showDropdown(dropdownMenu);
            }
        });
        
        // Hide dropdown on mouse leave (desktop only)
        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                timeoutId = setTimeout(() => {
                    hideDropdown(dropdownMenu);
                }, 150);
            }
        });
        
        // Handle dropdown item clicks
        const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Add active state to clicked item
                dropdownItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                
                // Close mobile menu if open
                const navbarNav = document.querySelector('.navbar-nav');
                const mobileToggle = document.querySelector('.mobile-toggle');
                if (navbarNav.classList.contains('active')) {
                    navbarNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                console.log('Navigating to:', this.textContent);
                // Add your navigation logic here
            });
        });
    });
}

// Show Dropdown
function showDropdown(dropdown) {
    if (dropdown) {
        dropdown.style.opacity = '1';
        dropdown.style.visibility = 'visible';
        dropdown.style.transform = 'translateY(0)';
    }
}

// Hide Dropdown
function hideDropdown(dropdown) {
    if (dropdown) {
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
        dropdown.style.transform = 'translateY(-10px)';
    }
}

// Initialize Active States
function initializeActiveStates() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't prevent default for dropdown toggles
            if (!this.parentElement.classList.contains('dropdown')) {
                // Remove active class from all nav links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
            }
        });
    });
    
    // Set home as active by default
    const homeLink = document.querySelector('.nav-link[href="#"]:not(.dropdown .nav-link)');
    if (homeLink) {
        homeLink.classList.add('active');
    }
}

// Smooth Scroll Functionality
function smoothScrollTo(targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Window Resize Handler
window.addEventListener('resize', function() {
    const navbarNav = document.querySelector('.navbar-nav');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
        navbarNav.classList.remove('active');
        mobileToggle.classList.remove('active');
        document.body.style.overflow = '';
        
        // Close all mobile dropdowns
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
            const chevronIcon = dropdown.querySelector('.fa-chevron-down');
            if (chevronIcon) {
                chevronIcon.style.transform = 'rotate(0deg)';
            }
        });
    }
});

// Keyboard Navigation Support
document.addEventListener('keydown', function(e) {
    // ESC key to close mobile menu
    if (e.key === 'Escape') {
        const navbarNav = document.querySelector('.navbar-nav');
        const mobileToggle = document.querySelector('.mobile-toggle');
        
        if (navbarNav.classList.contains('active')) {
            navbarNav.classList.remove('active');
            mobileToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Navbar Scroll Effect (Optional)
let lastScrollTop = 0;
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add/remove scrolled class for styling
    if (currentScrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
}, { passive: true });

// Add scrolled class styling
const style = document.createElement('style');
style.textContent = `
    .navbar.scrolled {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// Revamped Hero Slider Functionality
function initializeHeroSlider() {
    const videos = document.querySelectorAll('.hero-video');
    const slides = document.querySelectorAll('.hero-slide-modern');
    const eventTabs = document.querySelectorAll('.event-tab');
    const progressDots = document.querySelectorAll('.progress-dot');
    const progressFill = document.querySelector('.progress-fill');
    const prevArrow = document.querySelector('.prev-arrow-modern');
    const nextArrow = document.querySelector('.next-arrow-modern');
    
    let currentSlide = 0;
    let slideInterval;
    
    // Auto-play interval (8 seconds to match video duration)
    function startAutoPlay() {
        slideInterval = setInterval(() => {
            nextSlide();
        }, 8000);
    }
    
    // Video duration control
    function setupVideoControl() {
        videos.forEach((video, index) => {
            video.addEventListener('loadedmetadata', () => {
                // Ensure video plays for maximum 8 seconds
                video.addEventListener('timeupdate', () => {
                    if (video.currentTime >= 8) {
                        video.currentTime = 0; // Loop after 8 seconds
                    }
                });
            });
        });
    }
    
    function stopAutoPlay() {
        clearInterval(slideInterval);
    }
    
    function showSlide(index) {
        // Hide all videos, slides, event tabs, and progress dots
        videos.forEach(video => video.classList.remove('active'));
        slides.forEach(slide => slide.classList.remove('active'));
        eventTabs.forEach(tab => tab.classList.remove('active'));
        progressDots.forEach(dot => dot.classList.remove('active'));
        
        // Show current video, slide, event tab, and progress dot
        videos[index].classList.add('active');
        slides[index].classList.add('active');
        eventTabs[index].classList.add('active');
        progressDots[index].classList.add('active');
        
        // Update progress bar
        if (progressFill) {
            progressFill.style.width = `${((index + 1) / slides.length) * 100}%`;
        }
        
        // Reset video to start and ensure it plays
        videos[index].currentTime = 0;
        videos[index].play();
        
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    function prevSlide() {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }
    
    // Event listeners
    if (nextArrow) {
        nextArrow.addEventListener('click', () => {
            nextSlide();
            stopAutoPlay();
            startAutoPlay(); // Restart auto-play
        });
    }
    
    if (prevArrow) {
        prevArrow.addEventListener('click', () => {
            prevSlide();
            stopAutoPlay();
            startAutoPlay(); // Restart auto-play
        });
    }
    
    // Event tab navigation
    eventTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            showSlide(index);
            stopAutoPlay();
            startAutoPlay(); // Restart auto-play
        });
    });
    
    // Progress dot navigation
    progressDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoPlay();
            startAutoPlay(); // Restart auto-play
        });
    });
    
    // Pause on hover
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopAutoPlay);
        heroSection.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        }
    });
    
    // Setup video controls and start auto-play
    setupVideoControl();
    startAutoPlay();
}

// Gallery Functionality
function initializeGallery() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const seeMoreContainer = document.getElementById('gallery-see-more-container');
    const seeMoreBtn = document.getElementById('gallery-see-more-btn');
    
    if (tabBtns.length === 0 || galleryItems.length === 0) return;
    
    // Track if all items are shown
    let allItemsShown = false;
    
    // Function to show only first 6 items for "all" category
    function showLimitedItems() {
        const allItems = document.querySelectorAll('.gallery-item[data-category="all"]');
        allItems.forEach((item, index) => {
            if (index < 6) {
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            } else {
                item.style.display = 'none';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
            }
        });
        
        // Show see more button if there are more than 6 items
        if (allItems.length > 6) {
            seeMoreContainer.style.display = 'flex';
            allItemsShown = false;
        } else {
            seeMoreContainer.style.display = 'none';
        }
    }
    
    // Function to show all items
    function showAllItems() {
        const allItems = document.querySelectorAll('.gallery-item[data-category="all"]');
        allItems.forEach(item => {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }, 100);
        });
        
        seeMoreContainer.style.display = 'none';
        allItemsShown = true;
    }
    
    // See More button functionality
    if (seeMoreBtn) {
        seeMoreBtn.addEventListener('click', () => {
            if (!allItemsShown) {
                showAllItems();
                seeMoreBtn.innerHTML = '<i class="fas fa-minus"></i><span>Show Less</span>';
            } else {
                showLimitedItems();
                seeMoreBtn.innerHTML = '<i class="fas fa-plus"></i><span>See More Images & Videos</span>';
            }
        });
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            // Update active tab
            tabBtns.forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            
            // Reset see more state
            allItemsShown = false;
            if (seeMoreBtn) {
                seeMoreBtn.innerHTML = '<i class="fas fa-plus"></i><span>See More Images & Videos</span>';
            }
            
            // Filter gallery items
            galleryItems.forEach(item => {
                if (category === 'all') {
                    // For "all" category, show limited items initially
                    showLimitedItems();
                } else if (item.dataset.category === category) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 100);
                    seeMoreContainer.style.display = 'none';
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Initialize with "all" tab active
    const allTab = document.querySelector('.tab-btn[data-category="all"]');
    if (allTab) {
        allTab.click();
    }
}

// Animation on Scroll
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const delay = element.dataset.aosDelay || 0;
                
                setTimeout(() => {
                    element.classList.add('aos-animate');
                }, delay);
                
                observer.unobserve(element);
            }
        });
    }, observerOptions);
    
    // Observe all elements with data-aos attributes
    const animatedElements = document.querySelectorAll('[data-aos]');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Contact Form Functionality
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const phone = contactForm.querySelector('input[type="tel"]').value;
            const eventType = contactForm.querySelector('select').value;
            const message = contactForm.querySelector('textarea').value;
            
            // Simple validation
            if (!name || !email || !phone || !eventType || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('.contact-btn');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Smooth Scrolling Navigation
function initializeSmoothScrolling() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Calculate offset for fixed navbar
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navbarHeight - 20;
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const navbarNav = document.querySelector('.navbar-nav');
                if (navbarNav.classList.contains('active')) {
                    navbarNav.classList.remove('active');
                }
                
                // Close dropdown if open
                const dropdowns = document.querySelectorAll('.dropdown-menu');
                dropdowns.forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
            }
        });
    });
}

// Gallery Details Functionality
let galleryTooltip = null;

// Show tooltip on hover
function showGalleryTooltip(element, text) {
    if (!galleryTooltip) {
        galleryTooltip = document.createElement('div');
        galleryTooltip.className = 'gallery-tooltip';
        document.body.appendChild(galleryTooltip);
    }
    
    galleryTooltip.textContent = text;
    galleryTooltip.classList.add('show');
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    galleryTooltip.style.left = rect.left + 'px';
    galleryTooltip.style.top = (rect.top - 40) + 'px';
}

// Hide tooltip
function hideGalleryTooltip() {
    if (galleryTooltip) {
        galleryTooltip.classList.remove('show');
    }
}

// Show detailed modal
function showGalleryDetails(eventType, eventTitle) {
    const eventDetails = getEventDetails(eventType);
    
    // Create or get existing modal
    let modal = document.querySelector('.gallery-details-modal');
    if (!modal) {
        modal = createGalleryModal();
    }
    
    // Update modal content
    updateGalleryModal(modal, eventTitle, eventDetails);
    
    // Show modal
    modal.style.display = 'flex';
    lockBodyScroll();
}

// Create gallery modal
function createGalleryModal() {
    const modal = document.createElement('div');
    modal.className = 'gallery-details-modal';
    modal.innerHTML = `
        <div class="gallery-details-modal-content">
            <div class="gallery-details-modal-header">
                <h2 class="gallery-details-modal-title"></h2>
                <button class="gallery-details-modal-close">&times;</button>
            </div>
            <div class="gallery-details-modal-body">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.gallery-details-modal-close');
    closeBtn.addEventListener('click', closeGalleryModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeGalleryModal();
        }
    });
    
    // Prevent background scroll
    preventModalScroll(modal);
    
    return modal;
}

// Update modal content
function updateGalleryModal(modal, title, details) {
    const titleElement = modal.querySelector('.gallery-details-modal-title');
    const bodyElement = modal.querySelector('.gallery-details-modal-body');
    
    titleElement.textContent = title;
    bodyElement.innerHTML = `
        <div class="gallery-details-section">
            <h3><i class="fas fa-star"></i> Services Included</h3>
            <ul class="gallery-details-list">
                ${details.services.map(service => `
                    <li><i class="fas fa-check-circle"></i> ${service}</li>
                `).join('')}
            </ul>
        </div>
        
        <div class="gallery-details-section">
            <h3><i class="fas fa-map-marker-alt"></i> Contact & Location</h3>
            <div class="gallery-contact-info">
                <h4>BR Events - Chittoor</h4>
                <p><i class="fas fa-map-marker-alt"></i> Indiranagar, Old E Seva Backside, SanthaPet, Chittoor, Andhra Pradesh, India</p>
                <p><i class="fas fa-phone"></i> Bala Chander: +91 8247719664<br>Dilli Kumar: +91 8885868791</p>
                <p><i class="fas fa-envelope"></i> info@brevents.com</p>
                <p><i class="fas fa-clock"></i> Available 365 days</p>
            </div>
        </div>
        
        <div class="gallery-action-buttons">
            <a href="tel:+918247719664" class="gallery-action-btn call">
                <i class="fas fa-phone"></i> Call Bala Chander
            </a>
            <a href="tel:+918885868791" class="gallery-action-btn call">
                <i class="fas fa-phone"></i> Call Dilli Kumar
            </a>
            <a href="https://wa.me/918247719664?text=Hi, I'm interested in ${title}. Could you please provide more details?" class="gallery-action-btn whatsapp" target="_blank">
                <i class="fab fa-whatsapp"></i> WhatsApp Bala
            </a>
            <a href="https://wa.me/918885868791?text=Hi, I'm interested in ${title}. Could you please provide more details?" class="gallery-action-btn whatsapp" target="_blank">
                <i class="fab fa-whatsapp"></i> WhatsApp Dilli
            </a>
            <a href="mailto:info@brevents.com?subject=Inquiry about ${title}" class="gallery-action-btn email">
                <i class="fas fa-envelope"></i> Email
            </a>
        </div>
    `;
}

// Get event details based on type
function getEventDetails(eventType) {
    const eventData = {
        'wedding-ceremony': {
            services: [
                'Complete Wedding Planning & Coordination',
                'Mandap Design & Decoration',
                'Floral Arrangements & Garlands',
                'Traditional Music & Entertainment',
                'Photography & Videography Coordination',
                'Guest Management & Seating Arrangements'
            ]
        },
        'wedding-reception': {
            services: [
                'Venue Decoration & Lighting',
                'Stage Setup & Backdrop Design',
                'Sound System & DJ Services',
                'Catering & Menu Planning',
                'Guest Reception & Management',
                'Photography & Video Coverage'
            ]
        },
        'wedding-setup': {
            services: [
                'Complete Venue Transformation',
                'Professional Event Management',
                'Decoration & Styling Services',
                'Lighting & Sound Setup',
                'Vendor Coordination',
                'Timeline Management & Execution'
            ]
        },
        'engagement-party': {
            services: [
                'Engagement Ceremony Planning',
                'Ring Exchange Setup',
                'Decoration & Floral Arrangements',
                'Photography & Documentation',
                'Catering & Refreshments',
                'Guest Coordination & Management'
            ]
        },
        'business-event': {
            services: [
                'Corporate Event Planning & Management',
                'Conference & Meeting Setup',
                'Professional Audio/Visual Equipment',
                'Business Catering Services',
                'Registration & Guest Management',
                'Branding & Marketing Support'
            ]
        },
        'corporate-birthday': {
            services: [
                'Corporate Birthday Party Planning',
                'Professional Decoration Setup',
                'Team Building Activities',
                'Corporate Catering Services',
                'Entertainment & Music',
                'Photography & Memory Creation'
            ]
        },
        'product-launch': {
            services: [
                'Product Launch Event Planning',
                'Media Coverage & PR Coordination',
                'Stage Design & Branding Setup',
                'Professional Photography & Videography',
                'Guest Management & Invitations',
                'Marketing Material & Presentation Setup'
            ]
        },
        'business-setup': {
            services: [
                'Business Event Setup & Coordination',
                'Conference Room Arrangements',
                'Professional Equipment Setup',
                'Catering & Hospitality Services',
                'Registration & Welcome Desk',
                'Technical Support & Management'
            ]
        },
        'birthday-planning': {
            services: [
                'Complete Birthday Party Planning',
                'Theme-based Decoration',
                'Entertainment & Games Organization',
                'Birthday Cake & Catering',
                'Photography & Video Services',
                'Gift Coordination & Surprises'
            ]
        },
        'birthday-decoration': {
            services: [
                'Creative Birthday Decorations',
                'Balloon Arrangements & Designs',
                'Theme-based Setup',
                'Photo Booth & Props',
                'Lighting & Ambiance Creation',
                'Party Favors & Return Gifts'
            ]
        }
    };
    
    return eventData[eventType] || {
        services: ['Professional Event Planning', 'Complete Setup & Coordination', 'Quality Service Guarantee']
    };
}

// Close gallery modal with enhanced scroll restoration
function closeGalleryModal() {
    const modal = document.querySelector('.gallery-details-modal');
    if (modal) {
        // Add fade out animation
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '';
            modal.style.transform = '';
            unlockBodyScroll();
        }, 150);
    }
}

// Image Only Viewer Functions
function showImageOnly(imageSrc, imageTitle) {
    // Create or get existing image-only modal
    let modal = document.querySelector('.image-only-modal');
    if (!modal) {
        modal = createImageOnlyModal();
    }
    
    // Update modal content
    const img = modal.querySelector('.image-only-content img');
    const title = modal.querySelector('.image-only-title');
    
    img.src = imageSrc;
    img.alt = imageTitle;
    title.textContent = imageTitle;
    
    // Show modal with enhanced animation
    openModalWithScrollLock(modal);
}

function createImageOnlyModal() {
    const modal = document.createElement('div');
    modal.className = 'image-only-modal';
    modal.innerHTML = `
        <div class="image-only-content">
            <button class="image-only-close">&times;</button>
            <img src="" alt="">
            <div class="image-only-title"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.image-only-close');
    closeBtn.addEventListener('click', closeImageOnly);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageOnly();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageOnly();
        }
    });
    
    // Prevent background scroll
    preventModalScroll(modal);
    
    return modal;
}

function closeImageOnly() {
    const modal = document.querySelector('.image-only-modal');
    if (modal) {
        // Add smooth fade out
        modal.style.opacity = '0';
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '';
            unlockBodyScroll();
        }, 300);
    }
}

// Enhanced Details Functions
function showEnhancedDetails(type, title, data) {
    // Create or get existing enhanced details modal
    let modal = document.querySelector('.enhanced-details-modal');
    if (!modal) {
        modal = createEnhancedDetailsModal();
    }
    
    // Update modal content
    updateEnhancedDetailsModal(modal, type, title, data);
    
    // Show modal with enhanced animation
    openModalWithScrollLock(modal);
}

function createEnhancedDetailsModal() {
    const modal = document.createElement('div');
    modal.className = 'enhanced-details-modal';
    modal.innerHTML = `
        <div class="enhanced-details-content">
            <div class="enhanced-details-header">
                <h2 class="enhanced-details-title"></h2>
                <button class="enhanced-details-close">&times;</button>
            </div>
            <div class="enhanced-details-body">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.enhanced-details-close');
    closeBtn.addEventListener('click', closeEnhancedDetails);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEnhancedDetails();
        }
    });
    
    // Prevent background scroll
    preventModalScroll(modal);
    
    return modal;
}

function updateEnhancedDetailsModal(modal, type, title, data) {
    const titleElement = modal.querySelector('.enhanced-details-title');
    const bodyElement = modal.querySelector('.enhanced-details-body');
    
    titleElement.textContent = title;
    
    let contentHTML = '';
    
    // Services Section
    if (data.services && data.services.length > 0) {
        contentHTML += `
            <div class="details-section">
                <h3><i class="fas fa-star"></i> Services & Features</h3>
                <div class="details-grid">
                    ${data.services.map(service => `
                        <div class="details-card">
                            <h4><i class="fas fa-check-circle"></i> ${service}</h4>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Specifications Section (for venues/vendors)
    if (data.specifications) {
        contentHTML += `
            <div class="details-section">
                <h3><i class="fas fa-info-circle"></i> Specifications</h3>
                <div class="details-grid">
                    ${Object.entries(data.specifications).map(([key, value]) => `
                        <div class="details-card">
                            <h4>${key}</h4>
                            <p>${value}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Contact Information
    contentHTML += `
        <div class="details-section">
            <h3><i class="fas fa-phone"></i> Contact Information</h3>
            <div class="contact-info-enhanced">
                <h4>BR Events - Chittoor</h4>
                <div class="contact-details-grid">
                    <div class="contact-item-enhanced">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Indiranagar, Old E Seva Backside, SanthaPet, Chittoor, Andhra Pradesh</span>
                    </div>
                    <div class="contact-item-enhanced">
                        <i class="fas fa-phone"></i>
                        <span>Bala Chander: +91 8247719664</span>
                    </div>
                    <div class="contact-item-enhanced">
                        <i class="fas fa-phone"></i>
                        <span>Dilli Kumar: +91 8885868791</span>
                    </div>
                    <div class="contact-item-enhanced">
                        <i class="fas fa-envelope"></i>
                        <span>info@brevents.com</span>
                    </div>
                    <div class="contact-item-enhanced">
                        <i class="fas fa-clock"></i>
                        <span>Available 365 Days</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Action Buttons
    contentHTML += `
        <div class="action-buttons-enhanced">
            <a href="tel:+918247719664" class="action-btn-enhanced btn-call">
                <i class="fas fa-phone"></i> Call Bala
            </a>
            <a href="tel:+918885868791" class="action-btn-enhanced btn-call">
                <i class="fas fa-phone"></i> Call Dilli
            </a>
            <a href="https://wa.me/918247719664?text=Hi, I'm interested in ${title}. Could you please provide more details?" class="action-btn-enhanced btn-whatsapp" target="_blank">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <a href="mailto:info@brevents.com?subject=Inquiry about ${title}" class="action-btn-enhanced btn-email">
                <i class="fas fa-envelope"></i> Email Us
            </a>
            <a href="https://www.google.com/maps/search/Indiranagar+Old+E+Seva+Backside+SanthaPet+Chittoor+Andhra+Pradesh" class="action-btn-enhanced btn-map" target="_blank">
                <i class="fas fa-map-marker-alt"></i> View Map
            </a>
            <a href="https://www.google.com/search?q=${encodeURIComponent(title + ' BR Events Chittoor')}" class="action-btn-enhanced btn-search" target="_blank">
                <i class="fas fa-search"></i> Search Info
            </a>
        </div>
    `;
    
    bodyElement.innerHTML = contentHTML;
}

function closeEnhancedDetails() {
    const modal = document.querySelector('.enhanced-details-modal');
    if (modal) {
        // Add smooth fade out animation
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '';
            modal.style.transform = '';
            unlockBodyScroll();
        }, 150);
    }
}

// Get detailed data for different types
function getDetailedData(type, itemName) {
    const detailsData = {
        'gallery-wedding': {
            services: [
                'Complete Wedding Planning & Coordination',
                'Mandap Design & Decoration',
                'Floral Arrangements & Garlands',
                'Traditional Music & Entertainment',
                'Photography & Videography Coordination',
                'Guest Management & Seating'
            ]
        },
        'gallery-corporate': {
            services: [
                'Corporate Event Planning & Management',
                'Conference & Meeting Setup',
                'Professional Audio/Visual Equipment',
                'Business Catering Services',
                'Registration & Guest Management',
                'Branding & Marketing Support'
            ]
        },
        'gallery-birthday': {
            services: [
                'Complete Birthday Party Planning',
                'Theme-based Decoration',
                'Entertainment & Games Organization',
                'Birthday Cake & Catering',
                'Photography & Video Services',
                'Gift Coordination & Surprises'
            ]
        },
        'event-wedding': {
            services: [
                'Ceremony Planning & Coordination',
                'Reception Management',
                'Bridal Services & Support',
                'Wedding Coordination',
                'Vendor Management',
                'Timeline Coordination'
            ],
            specifications: {
                'Event Type': 'Wedding Celebrations',
                'Capacity': '50 - 1000+ guests',
                'Duration': 'Full day events',
                'Customization': 'Fully customizable'
            }
        },
        'event-birthday': {
            services: [
                'Themed Decorations',
                'Custom Cakes & Catering',
                'Entertainment Shows',
                'Party Favors & Gifts',
                'Photography Services',
                'Games & Activities'
            ],
            specifications: {
                'Event Type': 'Birthday Celebrations',
                'Age Groups': 'All ages welcome',
                'Venue Options': 'Indoor & Outdoor',
                'Themes': 'Custom themes available'
            }
        },
        'event-corporate': {
            services: [
                'Conference Planning',
                'Product Launches',
                'Team Building Activities',
                'Award Ceremonies',
                'Professional Setup',
                'Business Networking'
            ],
            specifications: {
                'Event Type': 'Corporate Events',
                'Capacity': '20 - 500+ attendees',
                'Equipment': 'Professional A/V setup',
                'Catering': 'Business dining options'
            }
        }
    };
    
    return detailsData[type] || {
        services: ['Professional Event Planning', 'Complete Setup & Coordination', 'Quality Service Guarantee']
    };
}

// Initialize image click handlers
function initializeImageClickHandlers() {
    // Gallery images
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const title = this.closest('.gallery-item').querySelector('h4').textContent;
            showImageOnly(this.src, title);
        });
    });
    
    // Event images
    document.querySelectorAll('.event-image img').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const title = this.closest('.event-card').querySelector('h3').textContent;
            showImageOnly(this.src, title);
        });
    });
    
    // Venue images
    document.querySelectorAll('.venue-image img').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const title = this.closest('.venue-card').querySelector('h4').textContent;
            showImageOnly(this.src, title);
        });
    });
    
    // Vendor images
    document.querySelectorAll('.vendor-image img').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const title = this.closest('.vendor-card').querySelector('h4').textContent;
            showImageOnly(this.src, title);
        });
    });
}

// Initialize enhanced view details handlers
function initializeEnhancedDetailsHandlers() {
    // Update existing gallery buttons to use enhanced details
    document.querySelectorAll('.gallery-btn').forEach(btn => {
        const originalOnclick = btn.getAttribute('onclick');
        if (originalOnclick) {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const galleryItem = this.closest('.gallery-item');
                const title = galleryItem.querySelector('h4').textContent;
                const category = galleryItem.getAttribute('data-category');
                const data = getDetailedData('gallery-' + category, title);
                showEnhancedDetails('gallery', title, data);
            });
        }
    });
    
    // Event buttons
    document.querySelectorAll('.event-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const eventCard = this.closest('.event-card');
            const title = eventCard.querySelector('h3').textContent;
            const eventType = title.toLowerCase().includes('wedding') ? 'wedding' : 
                            title.toLowerCase().includes('birthday') ? 'birthday' : 'corporate';
            const data = getDetailedData('event-' + eventType, title);
            showEnhancedDetails('event', title, data);
        });
    });
}

// Enhanced Venue System Functions
function initializeVenueEnhancements() {
    // Add hover handlers to venue images (show on hover, hide on mouse leave)
    document.querySelectorAll('.venue-image img').forEach(img => {
        img.addEventListener('mouseenter', function(e) {
            e.stopPropagation();
            const venueCard = this.closest('.venue-card');
            const venueName = venueCard.querySelector('h4').textContent;
            showVenueImageViewer(this.src, venueName);
        });
    });
    
    // Add click handlers to venue buttons
    document.querySelectorAll('.venue-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const venueCard = this.closest('.venue-card');
            const venueName = venueCard.querySelector('h4').textContent;
            const venueType = this.textContent.toLowerCase();
            showVenueDetailsModal(venueName, venueType);
        });
    });
}

// Enhanced Vendor System Functions
function initializeVendorEnhancements() {
    // Add hover handlers to vendor images (show on hover)
    document.querySelectorAll('.vendor-image img').forEach(img => {
        img.addEventListener('mouseenter', function(e) {
            e.stopPropagation();
            const vendorCard = this.closest('.vendor-card');
            const vendorName = vendorCard.querySelector('h4').textContent;
            showVendorImageViewer(this.src, vendorName);
        });
    });
    
    // Add click handlers to vendor buttons
    document.querySelectorAll('.vendor-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const vendorCard = this.closest('.vendor-card');
            const vendorName = vendorCard.querySelector('h4').textContent;
            const vendorType = this.textContent.toLowerCase();
            showVendorDetailsModal(vendorName, vendorType);
        });
    });
}

function showVenueImageViewer(imageSrc, venueName) {
    // Create or get existing venue image viewer
    let viewer = document.querySelector('.venue-image-viewer');
    if (!viewer) {
        viewer = createVenueImageViewer();
    }
    
    // Update viewer content
    const img = viewer.querySelector('.venue-viewer-content img');
    const title = viewer.querySelector('.venue-viewer-title');
    
    img.src = imageSrc;
    img.alt = venueName;
    title.textContent = venueName;
    
    // Show viewer with smooth animation (immediate on hover)
    viewer.style.display = 'flex';
    setTimeout(() => {
        viewer.classList.add('show');
    }, 50); // Slightly faster animation for hover
    
    document.body.style.overflow = 'hidden';
}

function createVenueImageViewer() {
    const viewer = document.createElement('div');
    viewer.className = 'venue-image-viewer';
    viewer.innerHTML = `
        <div class="venue-viewer-content">
            <button class="venue-viewer-close">&times;</button>
            <img src="" alt="">
            <div class="venue-viewer-title"></div>
        </div>
    `;
    
    document.body.appendChild(viewer);
    
    // Add close functionality
    const closeBtn = viewer.querySelector('.venue-viewer-close');
    closeBtn.addEventListener('click', closeVenueImageViewer);
    
    viewer.addEventListener('click', function(e) {
        if (e.target === viewer) {
            closeVenueImageViewer();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVenueImageViewer();
        }
    });
    
    return viewer;
}

function closeVenueImageViewer() {
    const viewer = document.querySelector('.venue-image-viewer');
    if (viewer) {
        viewer.classList.remove('show');
        setTimeout(() => {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }, 400);
    }
}

function showVenueDetailsModal(venueName, venueType) {
    // Create or get existing venue details modal
    let modal = document.querySelector('.venue-details-modal');
    if (!modal) {
        modal = createVenueDetailsModal();
    }
    
    // Get venue data based on name and type
    const venueData = getVenueDetailsByName(venueName, venueType);
    
    // Update modal content
    updateVenueDetailsContent(modal, venueData);
    
    // Show modal with enhanced animation
    openModalWithScrollLock(modal);
}

function createVenueDetailsModal() {
    const modal = document.createElement('div');
    modal.className = 'venue-details-modal';
    modal.innerHTML = `
        <div class="venue-details-content">
            <div class="venue-details-header">
                <h2 class="venue-details-title"></h2>
                <button class="venue-details-close">&times;</button>
            </div>
            <div class="venue-details-body">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close functionality
    const closeBtn = modal.querySelector('.venue-details-close');
    closeBtn.addEventListener('click', closeVenueDetailsModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeVenueDetailsModal();
        }
    });
    
    // Prevent background scroll
    preventModalScroll(modal);
    
    return modal;
}

function updateVenueDetailsContent(modal, venueData) {
    const titleElement = modal.querySelector('.venue-details-title');
    const bodyElement = modal.querySelector('.venue-details-body');
    
    titleElement.textContent = venueData.name;
    
    let contentHTML = `
        <div class="venue-info-section">
            <h3><i class="fas fa-info-circle"></i> Venue Information</h3>
            <div class="venue-info-grid">
                <div class="venue-info-card">
                    <h4><i class="fas fa-map-marker-alt"></i> Location & Area</h4>
                    <p>${venueData.location}</p>
                    <p>Accessible from major roads in Chittoor</p>
                </div>
                <div class="venue-info-card">
                    <h4><i class="fas fa-users"></i> Guest Capacity</h4>
                    <p>${venueData.capacity}</p>
                    <p>Flexible seating arrangements available</p>
                </div>
                <div class="venue-info-card">
                    <h4><i class="fas fa-rupee-sign"></i> Pricing Range</h4>
                    <p>${venueData.priceRange}</p>
                    <p>Customizable packages available</p>
                </div>
                <div class="venue-info-card">
                    <h4><i class="fas fa-clock"></i> Availability</h4>
                    <p>Available 365 days a year</p>
                    <p>Advance booking recommended</p>
                </div>
            </div>
        </div>
        
        <div class="venue-info-section">
            <h3><i class="fas fa-star"></i> Facilities & Amenities</h3>
            <div class="venue-facilities-list">
                ${venueData.facilities.map(facility => `
                    <div class="facility-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${facility}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="contact-section-enhanced">
            <h4>BR Events - Your Venue Partner in Chittoor</h4>
            <div class="contact-grid">
                <div class="contact-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Our Office: Indiranagar, Old E Seva Backside, SanthaPet, Chittoor, Andhra Pradesh</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>Bala Chander: +91 8247719664</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>Dilli Kumar: +91 8885868791</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <span>info@brevents.com</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-building"></i>
                    <span>15+ Premium Venues Available</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-car"></i>
                    <span>Easy venue visits from our Chittoor office</span>
                </div>
            </div>
        </div>
        
        <div class="venue-exploration">
            <h3><i class="fas fa-compass"></i> Explore More Options</h3>
            <div class="exploration-buttons">
                <a href="https://www.google.com/search?q=hotels+near+${encodeURIComponent(venueData.searchLocation)}" class="exploration-button btn-explore-hotels" target="_blank">
                    <i class="fas fa-hotel"></i> Explore Hotels
                </a>
                <a href="https://www.google.com/maps/search/${encodeURIComponent(venueData.searchLocation)}" class="exploration-button btn-view-locations" target="_blank">
                    <i class="fas fa-map-marked-alt"></i> View Locations
                </a>
                <a href="https://www.google.com/search?q=${encodeURIComponent(venueData.name + ' ' + venueData.searchLocation + ' reviews booking')}" class="exploration-button btn-discover-more" target="_blank">
                    <i class="fas fa-search-plus"></i> Discover More
                </a>
            </div>
        </div>
        
        <div class="venue-action-buttons">
            <a href="tel:+918247719664" class="venue-action-btn btn-call-venue">
                <i class="fas fa-phone"></i> Call Bala
            </a>
            <a href="tel:+918885868791" class="venue-action-btn btn-call-venue">
                <i class="fas fa-phone"></i> Call Dilli
            </a>
            <a href="https://wa.me/918247719664?text=Hi, I'm interested in ${venueData.name} for an event. Could you please provide more details and arrange a venue visit?" class="venue-action-btn btn-whatsapp-venue" target="_blank">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <a href="mailto:info@brevents.com?subject=Venue Inquiry - ${venueData.name}" class="venue-action-btn btn-email-venue">
                <i class="fas fa-envelope"></i> Email Us
            </a>
            <a href="https://www.google.com/maps/dir/Indiranagar+Old+E+Seva+Backside+SanthaPet+Chittoor+Andhra+Pradesh/${encodeURIComponent(venueData.searchLocation)}" class="venue-action-btn btn-directions" target="_blank">
                <i class="fas fa-directions"></i> Get Directions
            </a>
        </div>
    `;
    
    bodyElement.innerHTML = contentHTML;
}

function getVenueDetailsByName(venueName, venueType) {
    const venueDatabase = {
        'Luxurious Banquet Halls': {
            name: 'Luxurious Banquet Halls',
            location: 'Multiple locations across Chittoor - Tirupati Road, Madanapalle Road, Renigunta Road',
            capacity: '300 - 1000 guests',
            priceRange: '₹40,000 - ₹1,20,000 per event',
            searchLocation: 'Banquet Halls Chittoor Andhra Pradesh',
            facilities: [
                'Grand Architecture & Elegant Interiors',
                'Central Air Conditioning System',
                'Professional Sound & Lighting',
                'Spacious Dance Floor',
                'In-house Catering Kitchen',
                'Ample Parking Space (100+ vehicles)',
                'Bridal Room with Amenities',
                'Generator Backup Power',
                'Security Services Available',
                'Event Decoration Support',
                'Professional Photography Areas',
                'Guest Seating Arrangements'
            ]
        },
        '5-Star Hotel Venues': {
            name: '5-Star Hotel Venues',
            location: 'Premium hotel locations - Gandhi Road, Bangalore Road, Central Chittoor',
            capacity: '150 - 400 guests',
            priceRange: '₹25,000 - ₹60,000 per event',
            searchLocation: '5 Star Hotels Chittoor Andhra Pradesh',
            facilities: [
                'Luxury Hotel Accommodation',
                'Multi-cuisine Restaurant',
                'Conference Hall with A/V Equipment',
                'High-speed WiFi Throughout',
                'Room Service Available',
                'Valet Parking Service',
                'Business Center Facilities',
                'Laundry & Dry Cleaning',
                '24/7 Concierge Service',
                'Event Coordination Team',
                'Spa & Wellness Center',
                'Travel & Tourism Desk'
            ]
        },
        'Scenic Outdoor Locations': {
            name: 'Scenic Outdoor Locations',
            location: 'Beautiful outdoor venues - Garden locations, Vellore Road, Horsley Hills area',
            capacity: '100 - 500 guests',
            priceRange: '₹20,000 - ₹1,50,000 per event',
            searchLocation: 'Outdoor Wedding Venues Chittoor',
            facilities: [
                'Beautiful Garden Settings',
                'Open Air Event Spaces',
                'Stage Setup Available',
                'Professional Lighting Arrangements',
                'Tent & Canopy Services',
                'Catering Support Areas',
                'Parking Facilities',
                'Weather Protection Options',
                'Sound System Available',
                'Decoration Support Services',
                'Photography Friendly Locations',
                'Natural Scenic Backdrops'
            ]
        },
        'Charming Farmhouse Venues': {
            name: 'Charming Farmhouse Venues',
            location: 'Rustic farmhouse settings - Palamaner Road, Rural Chittoor areas',
            capacity: '50 - 200 guests',
            priceRange: '₹35,000 - ₹75,000 per event',
            searchLocation: 'Farmhouse Venues Chittoor',
            facilities: [
                'Rustic Farmhouse Architecture',
                'Open Spaces for Events',
                'Traditional Setup Options',
                'Organic Catering Available',
                'Bonfire & BBQ Areas',
                'Natural Green Surroundings',
                'Parking Space Available',
                'Basic Accommodation Options',
                'Photography Friendly Environment',
                'Event Support Services',
                'Traditional Games & Activities',
                'Peaceful Rural Setting'
            ]
        }
    };
    
    return venueDatabase[venueName] || {
        name: venueName,
        location: 'Chittoor, Andhra Pradesh',
        capacity: '100 - 500 guests',
        priceRange: '₹25,000 - ₹1,00,000 per event',
        searchLocation: 'Event Venues Chittoor',
        facilities: ['Professional Event Space', 'Complete Event Support', 'Quality Service Guarantee']
    };
}

function closeVenueDetailsModal() {
    const modal = document.querySelector('.venue-details-modal');
    if (modal) {
        // Add smooth fade out animation
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '';
            modal.style.transform = '';
            unlockBodyScroll();
        }, 150);
    }
}

// Vendor Image Viewer Functions
function showVendorImageViewer(imageSrc, vendorName) {
    // Reuse the same image viewer as venues
    let viewer = document.querySelector('.venue-image-viewer');
    if (!viewer) {
        viewer = createVenueImageViewer();
    }
    
    // Update viewer content
    const img = viewer.querySelector('.venue-viewer-content img');
    const title = viewer.querySelector('.venue-viewer-title');
    
    img.src = imageSrc;
    img.alt = vendorName;
    title.textContent = vendorName;
    
    // Show viewer with smooth animation (immediate on hover)
    viewer.style.display = 'flex';
    setTimeout(() => {
        viewer.classList.add('show');
    }, 50);
    
    document.body.style.overflow = 'hidden';
}

// Vendor Details Modal Functions
function showVendorDetailsModal(vendorName, vendorType) {
    // Create or get existing venue details modal (reuse same modal)
    let modal = document.querySelector('.venue-details-modal');
    if (!modal) {
        modal = createVenueDetailsModal();
    }
    
    // Get vendor data based on name and type
    const vendorData = getVendorDetailsByName(vendorName, vendorType);
    
    // Update modal content
    updateVendorDetailsContent(modal, vendorData);
    
    // Show modal with enhanced animation
    openModalWithScrollLock(modal);
}

function updateVendorDetailsContent(modal, vendorData) {
    const titleElement = modal.querySelector('.venue-details-title');
    const bodyElement = modal.querySelector('.venue-details-body');
    
    titleElement.textContent = vendorData.name;
    
    let contentHTML = `
        <div class="venue-info-section">
            <h3><i class="fas fa-info-circle"></i> Vendor Information</h3>
            <div class="venue-info-grid">
                <div class="venue-info-card">
                    <h4><i class="fas fa-briefcase"></i> Service Type</h4>
                    <p>${vendorData.serviceType}</p>
                    <p>Professional ${vendorData.category} services</p>
                </div>
                <div class="venue-info-card">
                    <h4><i class="fas fa-star"></i> Experience</h4>
                    <p>${vendorData.experience}</p>
                    <p>Proven track record of excellence</p>
                </div>
                <div class="venue-info-card">
                    <h4><i class="fas fa-rupee-sign"></i> Pricing Range</h4>
                    <p>${vendorData.priceRange}</p>
                    <p>Customizable packages available</p>
                </div>
                <div class="venue-info-card">
                    <h4><i class="fas fa-clock"></i> Availability</h4>
                    <p>Available 365 days a year</p>
                    <p>Advance booking recommended</p>
                </div>
            </div>
        </div>
        
        <div class="venue-info-section">
            <h3><i class="fas fa-star"></i> Services & Specialties</h3>
            <div class="venue-facilities-list">
                ${vendorData.services.map(service => `
                    <div class="facility-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${service}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="contact-section-enhanced">
            <h4>BR Events - Your Vendor Connection Partner in Chittoor</h4>
            <div class="contact-grid">
                <div class="contact-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Our Office: Indiranagar, Old E Seva Backside, SanthaPet, Chittoor, Andhra Pradesh</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>Bala Chander: +91 8247719664</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <span>Dilli Kumar: +91 8885868791</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-envelope"></i>
                    <span>info@brevents.com</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-users"></i>
                    <span>Network of 50+ Professional Vendors</span>
                </div>
                <div class="contact-item">
                    <i class="fas fa-handshake"></i>
                    <span>Direct vendor coordination from our office</span>
                </div>
            </div>
        </div>
        
        <div class="venue-exploration">
            <h3><i class="fas fa-compass"></i> Explore More Options</h3>
            <div class="exploration-buttons">
                <a href="https://www.google.com/search?q=${encodeURIComponent(vendorData.searchLocation + ' near me')}" class="exploration-button btn-explore-hotels" target="_blank">
                    <i class="fas fa-search"></i> Find Similar
                </a>
                <a href="https://www.google.com/maps/search/${encodeURIComponent(vendorData.searchLocation + ' Chittoor Andhra Pradesh')}" class="exploration-button btn-view-locations" target="_blank">
                    <i class="fas fa-map-marked-alt"></i> View Locations
                </a>
                <a href="https://www.google.com/search?q=${encodeURIComponent(vendorData.name + ' ' + vendorData.searchLocation + ' reviews portfolio')}" class="exploration-button btn-discover-more" target="_blank">
                    <i class="fas fa-search-plus"></i> Discover More
                </a>
            </div>
        </div>
        
        <div class="venue-action-buttons">
            <a href="tel:+918247719664" class="venue-action-btn btn-call-venue">
                <i class="fas fa-phone"></i> Call Bala
            </a>
            <a href="tel:+918885868791" class="venue-action-btn btn-call-venue">
                <i class="fas fa-phone"></i> Call Dilli
            </a>
            <a href="https://wa.me/918247719664?text=Hi, I'm interested in ${vendorData.name} services for an event. Could you please connect me with reliable vendors and provide more details?" class="venue-action-btn btn-whatsapp-venue" target="_blank">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <a href="mailto:info@brevents.com?subject=Vendor Inquiry - ${vendorData.name}" class="venue-action-btn btn-email-venue">
                <i class="fas fa-envelope"></i> Email Us
            </a>
            <a href="https://www.google.com/maps/search/${encodeURIComponent(vendorData.searchLocation + ' Chittoor Andhra Pradesh')}" class="venue-action-btn btn-directions" target="_blank">
                <i class="fas fa-search-location"></i> Find Vendors
            </a>
        </div>
    `;
    
    bodyElement.innerHTML = contentHTML;
}

function getVendorDetailsByName(vendorName, vendorType) {
    const vendorDatabase = {
        'Expert Photography Services': {
            name: 'Expert Photography Services',
            serviceType: 'Photography & Videography',
            category: 'Photography',
            experience: '10+ years of professional experience',
            priceRange: '₹15,000 - ₹75,000 per event',
            searchLocation: 'Professional Photographers',
            services: [
                'Wedding Photography & Videography',
                'Pre-wedding & Engagement Shoots',
                'Live Event Streaming',
                'Drone Photography & Aerial Shots',
                'Professional Photo Albums',
                'Digital Image Processing',
                'Same-day Photo Delivery',
                'Candid & Traditional Photography',
                'Portrait & Family Photography',
                'Event Documentation',
                'High-resolution Image Gallery',
                'Custom Photography Packages'
            ]
        },
        'Culinary Excellence': {
            name: 'Culinary Excellence',
            serviceType: 'Catering & Food Services',
            category: 'Catering',
            experience: '15+ years of culinary expertise',
            priceRange: '₹200 - ₹800 per person',
            searchLocation: 'Premium Caterers',
            services: [
                'Multi-cuisine Wedding Catering',
                'Corporate Event Catering',
                'Traditional South Indian Cuisine',
                'North Indian & Punjabi Specialties',
                'Chinese & Continental Options',
                'Live Cooking Stations',
                'Custom Menu Planning',
                'Dietary Restriction Accommodations',
                'Professional Service Staff',
                'Premium Tableware & Setup',
                'Beverage & Bar Services',
                'Special Occasion Cakes'
            ]
        },
        'Artistic Decoration Services': {
            name: 'Artistic Decoration Services',
            serviceType: 'Event Decoration & Design',
            category: 'Decoration',
            experience: '12+ years of creative design',
            priceRange: '₹25,000 - ₹2,00,000 per event',
            searchLocation: 'Event Decorators',
            services: [
                'Wedding Mandap Design & Setup',
                'Floral Arrangements & Garlands',
                'Themed Event Decorations',
                'Stage Design & Backdrop',
                'Lighting Design & Installation',
                'Entrance & Reception Decoration',
                'Table Centerpieces & Linens',
                'Balloon Decorations & Arches',
                'Cultural & Traditional Setups',
                'Modern & Contemporary Designs',
                'Venue Transformation Services',
                'Custom Decoration Concepts'
            ]
        },
        'Professional Entertainment': {
            name: 'Professional Entertainment',
            serviceType: 'DJ & Music Services',
            category: 'Entertainment',
            experience: '8+ years of entertainment expertise',
            priceRange: '₹10,000 - ₹50,000 per event',
            searchLocation: 'DJ Music Services',
            services: [
                'Professional DJ Services',
                'Premium Sound System Setup',
                'Wireless Microphone Systems',
                'Live Band Performances',
                'Cultural Music & Dance',
                'Custom Playlist Creation',
                'Karaoke & Interactive Entertainment',
                'Lighting & Visual Effects',
                'Master of Ceremony Services',
                'Background Music for Events',
                'Dance Floor Setup',
                'Multi-language Music Collection'
            ]
        }
    };
    
    return vendorDatabase[vendorName] || {
        name: vendorName,
        serviceType: 'Professional Services',
        category: 'Event Services',
        experience: '5+ years of professional experience',
        priceRange: '₹10,000 - ₹1,00,000 per event',
        searchLocation: 'Event Service Providers',
        services: ['Professional Service Delivery', 'Quality Assurance', 'Customer Satisfaction Guarantee']
    };
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeImageClickHandlers();
    initializeEnhancedDetailsHandlers();
    initializeVenueEnhancements();
    initializeVendorEnhancements();
});

// Function to play video when clicked
function playVideo(videoContainer) {
    const video = videoContainer.querySelector('video');
    const playOverlay = videoContainer.querySelector('.video-play-overlay');
    
    if (video) {
        // Pause all other videos first
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(v => {
            if (v !== video) {
                v.pause();
                v.currentTime = 0;
            }
        });
        
        // Hide all play overlays
        const allOverlays = document.querySelectorAll('.video-play-overlay');
        allOverlays.forEach(overlay => {
            if (overlay !== playOverlay) {
                overlay.style.display = 'none';
            }
        });
        
        // Toggle current video
        if (video.paused) {
            video.play();
            if (playOverlay) {
                playOverlay.style.display = 'none';
            }
        } else {
            video.pause();
            if (playOverlay) {
                playOverlay.style.display = 'flex';
            }
        }
    }
}

// Export functions for external use
window.BREvents = {
    showDropdown,
    hideDropdown,
    smoothScrollTo,
    showGalleryDetails,
    showGalleryTooltip,
    hideGalleryTooltip,
    closeGalleryModal,
    showImageOnly,
    closeImageOnly,
    showEnhancedDetails,
    closeEnhancedDetails,
    playVideo
};