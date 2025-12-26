// ============================================
// CLOUD STORAGE MANAGER (FIREBASE)
// ============================================

class CloudStorage {
    constructor() {
        this.enabled = CONFIG.firebase && CONFIG.firebase.enabled;
        this.db = null;
        this.app = null;
        this.initialized = false;
        this.connected = false;
        
        if (this.enabled) {
            this.init();
        }
    }

    /**
     * Initialize Firebase
     */
    async init(retryCount = 0) {
        const MAX_RETRIES = 10;
        
        // Immediate feedback that init has started
        if (retryCount === 0) {
             console.log('Cloud.init started');
             this.updateUIStatus(false, 'Initializing...');
        }
        
        if (!window.firebase) {
            if (retryCount >= MAX_RETRIES) {
                console.error('Firebase SDK failed to load after multiple attempts.');
                this.updateUIStatus(false, 'SDK Load Error');
                return;
            }

            console.warn(`Firebase SDK not loaded. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            this.updateUIStatus(false, `Loading SDK (${retryCount + 1})...`);
            
            setTimeout(() => {
                this.init(retryCount + 1);
            }, 1000);
            return;
        }

        try {
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(CONFIG.firebase.config);
            } else {
                this.app = firebase.app();
            }
            
            // Switch to Firestore
            this.db = firebase.firestore();

            // Enable Offline Persistence
            try {
                await this.db.enablePersistence();
                console.log('✅ Firestore Offline Persistence Enabled');
            } catch (err) {
                if (err.code == 'failed-precondition') {
                    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
                    console.warn('Persistence failed: Multiple tabs open');
                } else if (err.code == 'unimplemented') {
                    // The current browser does not support all of the features required to enable persistence
                    console.warn('Persistence not supported by browser');
                }
            }
            
            // Test connection by trying to read metadata (optional, but good for verification)
            // or just assume connected.
            
            this.initialized = true;
            console.log('✅ Firebase Cloud Firestore Initialized');
            
            this.connected = true;
            this.updateUIStatus(true);
            
        } catch (error) {
            console.error('❌ Firebase Init Error:', error);
            this.enabled = false;
            this.updateUIStatus(false, error.message);
        }
    }

    /**
     * Monitor connection state
     * Firestore handles offline persistence automatically
     */
    monitorConnection() {
        // Firestore doesn't have a direct .info/connected equivalent like RTDB
        // We assume connected if initialized successfully
    }

    /**
     * Update UI Status Indicator if it exists
     */
    updateUIStatus(isConnected, errorMessage = '') {
        const indicator = document.getElementById('cloudStatus');
        const text = document.getElementById('cloudStatusText');
        
        // Log to console for debugging
        console.log(`Cloud Status Update: Connected=${isConnected}, Msg=${errorMessage}`);
        
        if (indicator && text) {
            if (isConnected) {
                indicator.className = 'status-indicator status-online';
                text.textContent = 'Cloud Connected';
                text.style.color = 'var(--color-success)';
                text.title = 'Sync is active';
            } else {
                indicator.className = 'status-indicator status-offline';
                text.textContent = errorMessage || 'Cloud Disconnected';
                text.style.color = 'var(--color-error)';
                text.title = 'Check Firebase Console > Realtime Database';
            }
        } else {
            console.warn('Cloud status elements not found in DOM');
        }
    }

    /**
     * Save data to cloud (Firestore)
     */
    async set(collection, data) {
        if (!this.enabled || !this.initialized) return false;
        try {
            // Flatten data if needed or use specific document
            // For simple key-value storage migration:
            // collection -> collection name
            // data -> document data
            
            // We'll use a single document 'config' in collection 'app_data' for simple syncing
            if (collection === 'playlists' || collection === 'lastUpdate') {
                await this.db.collection('app_data').doc('main').set({
                    [collection]: data
                }, { merge: true });
            } else {
                 await this.db.collection('app_data').doc('main').set({
                    [collection]: data
                }, { merge: true });
            }
            
            return true;
        } catch (error) {
            console.error('Cloud Save Error:', error);
            if (error.code === 'permission-denied') {
                this.updateUIStatus(false, 'Permission Denied');
            }
            return false;
        }
    }

    /**
     * Get data from cloud (Firestore)
     */
    async get(key) {
        if (!this.enabled || !this.initialized) return null;
        try {
            const doc = await this.db.collection('app_data').doc('main').get();
            if (doc.exists) {
                return doc.data()[key];
            }
            return null;
        } catch (error) {
            console.error('Cloud Get Error:', error);
            return null;
        }
    }

    /**
     * Listen for real-time updates (Firestore)
     */
    listen(key, callback) {
        if (!this.enabled) return;
        
        if (!this.initialized) {
            const checkInit = setInterval(() => {
                if (this.initialized) {
                    clearInterval(checkInit);
                    this.listen(key, callback);
                }
            }, 500);
            return;
        }

        this.db.collection('app_data').doc('main')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data && data[key]) {
                        callback(data[key]);
                    }
                }
            }, (error) => {
                console.error(`Error in snapshot listener for ${key}:`, error);
                if (error.code === 'permission-denied') {
                    this.updateUIStatus(false, 'Permission Denied');
                    console.warn('Check your Firestore Security Rules. See FIREBASE_SETUP.md');
                } else {
                    this.updateUIStatus(false, 'Sync Error');
                }
            });
        console.log(`Listening for updates on: ${key}`);
    }

    /**
     * Stop listening
     */
    stopListening(path) {
        // Firestore unsubscribe is returned by onSnapshot
        // This is a placeholder as we aren't tracking unsubscribe functions yet
        if (!this.enabled || !this.initialized) return;
        console.warn('stopListening not implemented for Firestore');
    }

    /**
     * Log system events to Cloud
     */
    async log(level, message, details = {}) {
        if (!this.enabled || !this.initialized) return;
        try {
            await this.db.collection('system_logs').add({
                level: level,
                message: message,
                details: details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            });
        } catch (e) {
            console.warn('Failed to send log to cloud:', e);
        }
    }

    /**
     * Track analytics events
     */
    async track(action, data = {}) {
        if (!this.enabled || !this.initialized) return;
        try {
            // Use batching or debounce in production, but direct write for now
            await this.db.collection('analytics').add({
                action: action,
                data: data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            console.warn('Failed to track analytics:', e);
        }
    }
}

// Initialize and export
try {
    window.Cloud = new CloudStorage();
} catch (e) {
    console.error('Failed to initialize CloudStorage:', e);
    const text = document.getElementById('cloudStatusText');
    if (text) {
        text.textContent = 'Init Error';
        text.title = e.message;
    }
}
