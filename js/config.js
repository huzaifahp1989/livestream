// ============================================
// CONFIGURATION FILE
// ============================================

const CONFIG = {
    // Site Information
    site: {
        name: 'Islamic Live TV',
        description: '24/7 Islamic Live TV Channel',
        url: 'https://islamiclivetv.com',
        email: 'info@islamiclivetv.com'
    },

    // Default Playlist - YouTube Video IDs for 24/7 streaming
    // First item will play initially
    defaultPlaylist: [
        '7-Qf3g-0xEI', // Makkah Live (Updated)
        'q_0755f2i5k', // Madinah Live (Legacy)
        // Add videos via Admin Panel > Playlist Manager
    ],

    // Player Settings
    player: {
        autoplay: true,
        loop: true,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playsinline: 1,
        muteOnAutoplay: true,
        quality: 'hd720', // default, hd720, hd1080
    },

    // Stream Settings
    stream: {
        autoFallback: true, // Auto fallback to playlist if live stream fails
        lowLatency: false,
        reconnectAttempts: 3,
        reconnectDelay: 5000, // ms
    },

    // Live Stream Settings
    live: {
        enabled: false,          // Set true to default to live mode
        sourceType: 'youtube',   // 'youtube' | 'rtmp' | 'hls' (future)
        youtubeId: '',           // e.g., '9w7_ITXrJMQ' (YouTube video/live ID)
    },

    // Admin Settings
    admin: {
        // WARNING: This is for demo purposes only
        // In production, implement proper backend authentication
        defaultUsername: 'admin',
        defaultPassword: 'admin123', // CHANGE THIS!
        sessionTimeout: 3600000, // 1 hour in ms
    },

    // Analytics Settings
    analytics: {
        enabled: true,
        updateInterval: 60000, // Update every 60 seconds
        trackViewers: true,
        trackWatchTime: true,
    },

    // Prayer Times Settings
    prayerTimes: {
        enabled: true,
        location: {
            city: 'Mecca',
            country: 'Saudi Arabia',
            latitude: 21.4225,
            longitude: 39.8262,
        },
        method: 'mwl', // mwl, isna, egypt, makkah, etc.
        updateInterval: 60000, // Check every minute
    },

    // Emergency Broadcast
    emergency: {
        active: false,
        message: '',
    },

    // API Endpoints (if using backend)
    api: {
        baseUrl: '/api',
        endpoints: {
            playlist: '/playlist',
            recordings: '/recordings',
            schedule: '/schedule',
            analytics: '/analytics',
            auth: '/auth',
        },
        // YouTube Data API v3 settings (optional)
        youtube: {
            key: 'AIzaSyCpbPttef53NMoWPIVmUSGLFZ6bcEjT8G8', // Provided API key
            maxResults: 20 // Default number of videos to fetch
        },
    },

    // CLOUD SYNC SETTINGS (FIREBASE)
    // To enable cross-device sync:
    // 1. Create a project at https://console.firebase.google.com/
    // 2. Add a Web App to your project
    // 3. Copy the "firebaseConfig" object below
    firebase: {
        enabled: true, // Set to true after adding config
        config: {
            apiKey: "AIzaSyCXdFOrKRfptYknbX8lZc4IRNjHzXoImrs",
            authDomain: "livestream-d9e34.firebaseapp.com",
            // IMPORTANT: If this URL is wrong, Cloud Sync will stay "Disconnected".
            // Go to Firebase Console -> Realtime Database -> Data to find your correct URL.
            // Common formats:
            // 1. https://<project-id>-default-rtdb.firebaseio.com (US Central)
            // 2. https://<project-id>-default-rtdb.europe-west1.firebasedatabase.app (Europe)
            // 3. https://<project-id>.firebaseio.com (Legacy)
            databaseURL: "https://livestream-d9e34-default-rtdb.firebaseio.com", 
            projectId: "livestream-d9e34",
            storageBucket: "livestream-d9e34.firebasestorage.app",
            messagingSenderId: "776310968372",
            appId: "1:776310968372:web:7777f4d1ca596e9d1cba61",
            measurementId: "G-SGXEJEH2W2"
        }
    },

    // Cache Settings
    cache: {
        enabled: true,
        duration: 3600000, // 1 hour
    },

    // Channel playlist defaults (optional)
    channel: {
        defaultHandle: '@huzaify786', // Provided channel handle
        useOnStartup: true            // Auto-load on startup (requires API key)
    },

    // Feature Flags
    features: {
        donations: true,
        socialSharing: true,
        pwa: true,
        notifications: true,
        downloadApp: true,
    },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
