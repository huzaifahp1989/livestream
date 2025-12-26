// ============================================
// PWA (Progressive Web App) FUNCTIONALITY
// ============================================

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    /**
     * Initialize PWA features
     */
    init() {
        // Register service worker
        this.registerServiceWorker();

        // Handle install prompt
        this.handleInstallPrompt();

        // Check if already installed
        this.checkInstallStatus();

        // Handle app installed event
        this.handleAppInstalled();
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            const register = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('Service Worker registered:', registration.scope);

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('Service Worker update found');

                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available
                                this.showUpdateNotification();
                            }
                        });
                    });
                } catch (error) {
                    // Ignore InvalidStateError which happens in some preview environments or restricted iframes
                    if (error.name !== 'InvalidStateError') {
                        console.error('Service Worker registration failed:', error);
                    } else {
                        console.warn('Service Worker registration skipped: Document in invalid state (likely preview environment)');
                    }
                }
            };

            if (document.readyState === 'complete') {
                register();
            } else {
                window.addEventListener('load', register);
            }
        }
    }

    /**
     * Handle install prompt
     */
    handleInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent default mini-infobar
            e.preventDefault();
            
            // Store the event for later use
            this.deferredPrompt = e;
            
            // Show custom install prompt
            this.showInstallPrompt();
        });
    }

    /**
     * Show custom install prompt
     */
    showInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        const installButton = document.getElementById('installButton');
        const dismissButton = document.getElementById('dismissInstall');

        if (!installPrompt) return;

        // Check if user has dismissed before
        const dismissed = Utils.storage.get('installPromptDismissed');
        if (dismissed) return;

        // Show prompt after delay
        setTimeout(() => {
            installPrompt.style.display = 'block';
        }, 10000); // Show after 10 seconds

        if (installButton) {
            installButton.addEventListener('click', () => {
                this.promptInstall();
            });
        }

        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                installPrompt.style.display = 'none';
                Utils.storage.set('installPromptDismissed', true);
            });
        }
    }

    /**
     * Prompt user to install app
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            Utils.showToast('Install prompt not available', 'info');
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for user's response
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            Utils.showToast('App installation started!', 'success');
        }

        // Clear the deferred prompt
        this.deferredPrompt = null;

        // Hide install prompt
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.style.display = 'none';
        }
    }

    /**
     * Check if app is already installed
     */
    checkInstallStatus() {
        // Check if running as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
            || window.navigator.standalone 
            || document.referrer.includes('android-app://');

        if (isStandalone) {
            console.log('App is installed and running in standalone mode');
            // Hide install prompts
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
        }
    }

    /**
     * Handle app installed event
     */
    handleAppInstalled() {
        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
            Utils.showToast('App installed successfully!', 'success');
            
            // Hide install prompt
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }

            // Track installation
            if (CONFIG.analytics.enabled) {
                // Track app installation event
                console.log('Track app installation');
            }
        });
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        Utils.showToast(
            'New version available! Refresh to update.',
            'info',
            10000
        );

        // Add refresh button
        const toast = document.getElementById('toast');
        if (toast) {
            const refreshBtn = document.createElement('button');
            refreshBtn.textContent = 'Refresh';
            refreshBtn.className = 'btn btn--sm btn--primary';
            refreshBtn.style.marginTop = '8px';
            refreshBtn.onclick = () => window.location.reload();
            toast.appendChild(refreshBtn);
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPush() {
        if (!('PushManager' in window)) {
            console.log('Push notifications not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(CONFIG.pushPublicKey)
            });

            console.log('Push subscription:', subscription);
            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to push:', error);
            return null;
        }
    }

    /**
     * Convert base64 string to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Initialize PWA when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (CONFIG.features.pwa) {
        window.pwaManager = new PWAManager();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}
