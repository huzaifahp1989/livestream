// ============================================
// ANALYTICS MANAGER
// ============================================

class Analytics {
    constructor() {
        this.enabled = CONFIG.analytics.enabled;
        this.sessionStart = Date.now();
        this.events = [];
        this.viewerCount = 0;
        this.init();
    }

    /**
     * Initialize analytics
     */
    init() {
        if (!this.enabled) return;

        // Track page view
        this.trackPageView();

        // Track session duration
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('page_hidden');
            } else {
                this.track('page_visible');
            }
        });

        // Update viewer count periodically
        this.startViewerCountUpdate();
    }

    /**
     * Track generic event
     */
    track(eventName, data = {}) {
        const event = {
            name: eventName,
            timestamp: new Date().toISOString(),
            ...data
        };

        this.events.push(event);
        console.log('[Analytics]', event);

        // Send to Firebase
        if (this.firebaseAnalytics) {
            this.firebaseAnalytics.logEvent(eventName, data);
        }

        // Send to backend in production
        if (CONFIG.api && CONFIG.api.endpoints.analytics) {
            this.sendToBackend(event);
        }

        // Store locally for now
        this.storeEvent(event);
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.track('page_view', {
            page: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent
        });
    }

    /**
     * Track video play
     */
    trackVideoPlay(videoId) {
        this.track('video_play', {
            videoId,
            timestamp: Date.now()
        });
    }

    /**
     * Track video pause
     */
    trackVideoPause(videoId, watchTime) {
        this.track('video_pause', {
            videoId,
            watchTime
        });
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const duration = Date.now() - this.sessionStart;
        this.track('session_end', {
            duration,
            eventsCount: this.events.length
        });
    }

    /**
     * Start viewer count updates
     */
    startViewerCountUpdate() {
        if (!CONFIG.analytics.trackViewers) return;

        setInterval(() => {
            this.updateViewerCount();
        }, CONFIG.analytics.updateInterval);
    }

    /**
     * Update viewer count
     */
    async updateViewerCount() {
        // In production, fetch from backend
        // For now, simulate with random number
        this.viewerCount = Math.floor(Math.random() * 500) + 1000;
        
        // Update UI
        const viewerElement = document.getElementById('viewerCount');
        if (viewerElement) {
            viewerElement.textContent = `${this.viewerCount.toLocaleString()} watching`;
        }

        // Update admin dashboard if open
        const currentViewersElement = document.getElementById('currentViewers');
        if (currentViewersElement) {
            currentViewersElement.textContent = this.viewerCount.toLocaleString();
        }
    }

    /**
     * Get total watch time
     */
    getTotalWatchTime() {
        return this.events
            .filter(e => e.name === 'video_pause')
            .reduce((total, e) => total + (e.watchTime || 0), 0);
    }

    /**
     * Get most watched content
     */
    getMostWatched() {
        const videoPlays = {};
        
        this.events
            .filter(e => e.name === 'video_play')
            .forEach(e => {
                videoPlays[e.videoId] = (videoPlays[e.videoId] || 0) + 1;
            });

        return Object.entries(videoPlays)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }

    /**
     * Store event locally
     */
    storeEvent(event) {
        const stored = Utils.storage.get('analytics_events', []);
        stored.push(event);
        
        // Keep only last 1000 events
        if (stored.length > 1000) {
            stored.shift();
        }
        
        Utils.storage.set('analytics_events', stored);
    }

    /**
     * Send event to backend
     */
    async sendToBackend(event) {
        try {
            // In production, implement actual API call
            console.log('Sending to backend:', event);
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            totalEvents: this.events.length,
            currentViewers: this.viewerCount,
            totalWatchTime: this.getTotalWatchTime(),
            mostWatched: this.getMostWatched(),
            sessionDuration: Date.now() - this.sessionStart
        };
    }
}

// Initialize analytics
window.Analytics = new Analytics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}
