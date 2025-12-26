// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');

    // Initialize Video Player
    initPlayer();

    // Initialize UI Components
    initUI();

    // Initialize PWA features
    if (window.PWA) {
        window.PWA.init();
    }
});

/**
 * Initialize Video Player
 */
function initPlayer() {
    const playerContainer = document.getElementById('videoPlayer');
    if (!playerContainer) return;

    // Create player instance
    const player = new VideoPlayer('videoPlayer', {
        autoplay: true,
        muteOnAutoplay: true
    });

    // Initialize player
    player.init().then(() => {
        console.log('Video Player initialized successfully');
    }).catch(error => {
        console.error('Failed to initialize video player:', error);
    });

    // Expose to window for global access (needed for admin control)
    window.videoPlayer = player;

    // Handle overlay play button
    const playButton = document.getElementById('playButton');
    const overlay = document.getElementById('playerOverlay');
    
    if (playButton) {
        playButton.addEventListener('click', () => {
            player.unmute();
            player.play();
            if (overlay) overlay.classList.remove('active');
        });
    }

    // Handle overlay tap on mobile
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.overlay-info')) {
                player.unmute();
                player.play();
                overlay.classList.remove('active');
            }
        });
    }
}

/**
 * Initialize UI Components
 */
function initUI() {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('nav--active');
            menuToggle.classList.toggle('active');
            
            // Animate hamburger icon
            const spans = menuToggle.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (nav && nav.classList.contains('nav--active') && 
            !nav.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            nav.classList.remove('nav--active');
            menuToggle.classList.remove('active');
        }
    });

    // Cookie Banner
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptCookies = document.getElementById('acceptCookies');
    const declineCookies = document.getElementById('declineCookies');

    if (cookieBanner && !localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            cookieBanner.classList.add('active');
        }, 2000);
    }

    if (acceptCookies) {
        acceptCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            if (cookieBanner) cookieBanner.classList.remove('active');
        });
    }

    if (declineCookies) {
        declineCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'false');
            if (cookieBanner) cookieBanner.classList.remove('active');
        });
    }

    // Donate Button
    const donateButton = document.getElementById('donateButton');
    if (donateButton) {
        donateButton.addEventListener('click', () => {
            // Scroll to bottom or open modal
            // For now, just show a toast
            if (window.Utils) {
                window.Utils.showToast('Donation feature coming soon!', 'info');
            } else {
                alert('Donation feature coming soon!');
            }
        });
    }

    // Share Button
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: document.title,
                        text: 'Watch Islamic Live TV - 24/7 Live Stream',
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            } else {
                // Fallback
                if (window.Utils) {
                    window.Utils.copyToClipboard(window.location.href);
                    window.Utils.showToast('Link copied to clipboard!', 'success');
                } else {
                    prompt('Copy this link:', window.location.href);
                }
            }
        });
    }
}
