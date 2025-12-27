// ============================================
// VIDEO PLAYER MANAGER
// ============================================

class VideoPlayer {
    constructor(containerId, config = {}) {
        this.containerId = containerId;
        this.config = { ...CONFIG.player, ...config };
        this.player = null;
        this.currentIndex = 0;
        this.playlist = CONFIG.defaultPlaylist;
        this.currentPlaylistId = 'default'; // Track current playlist ID
        this.isLiveMode = false;
        this.liveSource = null;
        this.retryCount = 0;
        this.maxRetries = CONFIG.stream.reconnectAttempts;
        this.scheduleCheckInterval = null;
        this.lastScheduleCheck = 0;
    }

    /**
     * Start playlist update listener
     */
    startPlaylistUpdateListener() {
        // Local Storage Listener
        let lastUpdate = Date.now();
        setInterval(() => {
            const updateTime = Utils.storage.get('playlistUpdateTimestamp') || 0;
            if (updateTime > lastUpdate) {
                console.log('Playlist update detected via timestamp');
                lastUpdate = updateTime;
                this.checkSchedule(false, true); // force=false, checkContent=true
            }
        }, 2000);

        // Cloud Listener (Real-time)
        if (window.Cloud && window.Cloud.enabled) {
            // Ensure Cloud is initialized first
            if (!window.Cloud.initialized) {
                 window.Cloud.init().then(() => {
                     this.setupCloudListeners();
                 });
            } else {
                 this.setupCloudListeners();
            }
        }
    }

    setupCloudListeners() {
        window.Cloud.listen('playlists', (playlists) => {
            if (playlists) {
                console.log('Received Cloud Update: Playlists');
                Utils.storage.set('adminPlaylists', playlists);
                this.checkSchedule(false, true);
            }
        });

        window.Cloud.listen('schedule', (schedule) => {
            if (schedule) {
                console.log('Received Cloud Update: Schedule');
                Utils.storage.set('scheduleEvents', schedule);
                this.checkSchedule(false, true);
            }
        });
        
        // Also listen for force play events from cloud
        window.Cloud.listen('forcePlay', (eventData) => {
            if (eventData) {
                console.log('Received Cloud Force Play');
                Utils.storage.set('forcePlayVideo', eventData);
                // The existing interval will pick this up, or we can handle immediately
            }
        });
    }

    /**
     * Start visibility listener to optimize for mobile
     */
    startVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('App visible, checking for updates...');
                
                // Check schedule immediately
                this.checkSchedule(false, true);
                
                // Check for force play updates immediately
                const eventData = Utils.storage.get('forcePlayVideo');
                if (eventData && Date.now() - eventData.timestamp < 10000) {
                     // The interval will pick this up, but we can log it
                     console.log('Force play pending on wake');
                }
            }
        });
    }

    /**
     * Start schedule checker
     */
    startScheduleChecker() {
        if (this.scheduleCheckInterval) clearInterval(this.scheduleCheckInterval);
        this.scheduleCheckInterval = setInterval(() => {
            this.checkSchedule();
        }, 60000); // Check every minute
    }

    /**
     * Start force play listener (Global State Sync)
     */
    startForcePlayListener() {
        setInterval(() => {
            const eventData = Utils.storage.get('forcePlayVideo');
            if (!eventData) return;

            const now = Date.now();
            const timeDiff = now - eventData.timestamp; // ms since start
            const durationMs = (eventData.duration || 0) * 1000;
            
            // Validity Window:
            // 1. If duration is known: valid if we are still within the duration window
            // 2. If duration is 0 (Live/Unknown): valid for 1 hour (fallback)
            // 3. Allow 60s future skew
            
            let isValid = false;
            if (durationMs > 0) {
                isValid = (timeDiff < durationMs) && (timeDiff > -60000);
            } else {
                isValid = (timeDiff < 3600000) && (timeDiff > -60000); // 1 hour default validity
            }

            if (isValid && this.player && typeof this.player.loadVideoById === 'function') {
                 
                 // 1. Ensure Playlist matches
                 if (eventData.playlistId && eventData.playlistId !== this.currentPlaylistId) {
                     console.log(`Global Sync: Switching to playlist ${eventData.playlistId}`);
                     this.loadPlaylist(eventData.playlistId);
                 }

                 // 2. Ensure Video matches
                 // We use try-catch because getVideoData might not be ready
                 try {
                     const currentVideoData = this.player.getVideoData();
                     const currentVideoId = currentVideoData ? currentVideoData.video_id : null;
                     
                     // If video is different, load it immediately
                     if (currentVideoId !== eventData.videoId) {
                         console.log(`Global Sync: Loading video ${eventData.videoId}`);
                         
                         // Update local playlist content first to ensure index is correct
                         const playlists = Utils.storage.get('adminPlaylists') || {};
                         const playlist = playlists[this.currentPlaylistId];
                         if (playlist) {
                             this.playlist = playlist.map(item => item.youtubeId || item);
                         }

                         this.player.loadVideoById(eventData.videoId);
                         
                         const index = this.playlist.indexOf(eventData.videoId);
                         if (index !== -1) {
                             this.currentIndex = index;
                         }
                         this.updateProgramInfo();
                     }
                     
                     // 3. Sync Time (Seek)
                     // Only seek if we have a valid duration and we are "Live Syncing"
                     if (durationMs > 0 && timeDiff > 0) {
                         const targetTime = timeDiff / 1000;
                         const currentTime = this.player.getCurrentTime();
                         
                         // If we are off by more than 5 seconds, seek
                         if (Math.abs(currentTime - targetTime) > 5) {
                             console.log(`Global Sync: Seeking to ${targetTime.toFixed(1)}s (Current: ${currentTime.toFixed(1)}s)`);
                             this.player.seekTo(targetTime, true);
                             
                             if (this.player.getPlayerState() !== YT.PlayerState.PLAYING && 
                                 this.player.getPlayerState() !== YT.PlayerState.BUFFERING) {
                                 this.player.playVideo();
                             }
                         }
                     }
                 } catch (e) {
                     // Player might not be fully ready
                 }
            }
        }, 1000);
    }

    /**
     * Check schedule and update playlist if needed
     */
    checkSchedule(force = false, checkContent = false) {
        const now = new Date();
        const scheduleEvents = Utils.storage.get('scheduleEvents') || [];
        
        let activeEvent = null;
        let maxPriority = -1;

        // Priority: One-time (3) > Monthly (2) > Weekly (1) > Daily (0)
        
        scheduleEvents.forEach(event => {
            if (this.isEventActive(event, now)) {
                let priority = -1;
                if (event.recurrence === 'daily') priority = 0;
                else if (event.recurrence === 'weekly') priority = 1;
                else if (event.recurrence === 'monthly') priority = 2;
                else if (event.recurrence === 'none') priority = 3;

                if (priority > maxPriority) {
                    maxPriority = priority;
                    activeEvent = event;
                }
            }
        });

        // Fallback to legacy playlistSchedule if no active event found
        if (!activeEvent) {
             const rules = Utils.storage.get('playlistSchedule') || [];
             const currentMinutes = now.getHours() * 60 + now.getMinutes();
             
             let activeRule = null;
             let maxRulePriority = -1;

             rules.forEach(rule => {
                const [h, m] = rule.time.split(':').map(Number);
                const ruleMinutes = h * 60 + m;

                if (ruleMinutes > currentMinutes) return;

                let priority = -1;
                if (rule.type === 'daily') priority = 0;
                else if (rule.type === 'weekly' && rule.dayOfWeek == now.getDay()) priority = 1;
                else if (rule.type === 'monthly' && rule.dayOfMonth == now.getDate()) priority = 2;
                else if (rule.type === 'date' && rule.date === now.toISOString().split('T')[0]) priority = 3;

                if (priority > maxRulePriority) {
                    maxRulePriority = priority;
                    activeRule = rule;
                } else if (priority === maxRulePriority) {
                    const activeTime = activeRule ? activeRule.time.split(':').map(Number) : [-1, -1];
                    const activeMinutes = activeTime[0] * 60 + activeTime[1];
                    if (ruleMinutes > activeMinutes) activeRule = rule;
                }
            });
            
            if (activeRule) {
                // Adapt legacy rule to event format
                activeEvent = {
                    contentType: 'playlist',
                    contentId: activeRule.playlistId,
                    title: 'Scheduled Playlist'
                };
            }
        }

        let targetContentId = 'default';
        let targetContentType = 'playlist';

        if (activeEvent) {
            targetContentId = activeEvent.contentId || activeEvent.playlistId || 'default'; // Fallback for legacy
            targetContentType = activeEvent.contentType || 'playlist';
            console.log(`Active Schedule Event: ${activeEvent.title} (${targetContentType}: ${targetContentId})`);
        } else {
            console.log('No active schedule, using default playlist');
        }

        // Handle Video Content Type
        if (targetContentType === 'video') {
            const pseudoPlaylistId = 'video-' + targetContentId;
            
            if (force || this.currentPlaylistId !== pseudoPlaylistId) {
                console.log(`Switching to single video: ${targetContentId}`);
                this.currentPlaylistId = pseudoPlaylistId;
                this.playlist = [targetContentId];
                this.currentIndex = 0;
                
                if (this.player && typeof this.player.loadVideoById === 'function') {
                    this.player.loadVideoById(targetContentId);
                    this.updateProgramInfo(); // Assuming this exists or will handle UI
                }
                
                // Update UI message
                const msg = document.getElementById('emptyPlaylistMsg');
                if (msg) msg.style.display = 'none';
            }
            return;
        }

        // Handle Playlist Content Type
        if (force || targetContentId !== this.currentPlaylistId) {
            console.log(`Switching to playlist: ${targetContentId}`);
            this.loadPlaylist(targetContentId);
        } else if (checkContent) {
            const storedPlaylists = Utils.storage.get('adminPlaylists') || {};
            let storedPlaylist = storedPlaylists[targetContentId];
            
            // STRICT MODE: NO LEGACY FALLBACK
            
            const newIds = (storedPlaylist || []).map(p => p.youtubeId || p);
            
            if (JSON.stringify(newIds) !== JSON.stringify(this.playlist)) {
                console.log('Playlist content changed, refreshing...');
                this.refreshPlaylistContent(newIds);
            }
        }
    }

    /**
     * Check if a schedule event is currently active
     */
    isEventActive(event, now) {
        if (!event.startDate || !event.startTime) return false;

        const [startHour, startMin] = event.startTime.split(':').map(Number);
        const duration = parseInt(event.duration || 60);
        
        // Check date/recurrence first
        let dateMatch = false;
        const eventStartDate = new Date(event.startDate);
        const todayDateStr = now.toISOString().split('T')[0];
        
        if (event.recurrence === 'none') {
            dateMatch = (event.startDate === todayDateStr);
        } else if (event.recurrence === 'daily') {
            // Check if start date is in the past or today
            const startCheck = new Date(event.startDate);
            startCheck.setHours(0,0,0,0);
            const todayCheck = new Date(now);
            todayCheck.setHours(0,0,0,0);
            dateMatch = (todayCheck >= startCheck);
        } else if (event.recurrence === 'weekly') {
            const startCheck = new Date(event.startDate);
            startCheck.setHours(0,0,0,0);
            const todayCheck = new Date(now);
            todayCheck.setHours(0,0,0,0);
            
            if (todayCheck >= startCheck) {
                const day = now.getDay();
                if (event.days && event.days.length) {
                    dateMatch = event.days.includes(day) || event.days.includes(String(day));
                } else {
                    // Fallback to start date's day
                    dateMatch = (day === eventStartDate.getDay());
                }
            }
        } else if (event.recurrence === 'monthly') {
            const startCheck = new Date(event.startDate);
            startCheck.setHours(0,0,0,0);
            const todayCheck = new Date(now);
            todayCheck.setHours(0,0,0,0);
            
            if (todayCheck >= startCheck) {
                dateMatch = (now.getDate() === eventStartDate.getDate());
            }
        }

        if (!dateMatch) return false;

        // Check time window
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = startMinutes + duration;

        // Handle midnight wrapping if needed (simple version assumes same day for now)
        return (nowMinutes >= startMinutes && nowMinutes < endMinutes);
    }


    /**
     * Refresh playlist content without restarting if possible
     */
    refreshPlaylistContent(newIds) {
        if (!newIds || newIds.length === 0) return;
        
        const currentVideoId = this.playlist[this.currentIndex];
        this.playlist = newIds;

        // Hide empty playlist message if exists
        const msg = document.getElementById('emptyPlaylistMsg');
        if (msg) msg.style.display = 'none';
        
        // INTERRUPT DEFAULT SEED LOGIC:
        // If we are currently playing a Default Seed video (Makkah/Madinah),
        // and the new playlist has user-added content (not just seeds),
        // we should switch immediately to the user's content.
        const defaultSeeds = CONFIG.defaultPlaylist || [];
        const isPlayingSeed = defaultSeeds.includes(currentVideoId);
        const hasNewContent = newIds.some(id => !defaultSeeds.includes(id));

        if (isPlayingSeed && hasNewContent) {
            console.log('Interrupting default seed to play user content');
            
            // Find the first non-seed video (user content)
            const firstUserVideoIndex = this.playlist.findIndex(id => !defaultSeeds.includes(id));
            
            if (firstUserVideoIndex !== -1) {
                this.currentIndex = firstUserVideoIndex;
            } else {
                this.currentIndex = 0;
            }

            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(this.playlist[this.currentIndex]);
                this.updateProgramInfo();
            }
            return;
        }

        const newIndex = this.playlist.indexOf(currentVideoId);
        
        if (newIndex !== -1) {
            this.currentIndex = newIndex;
            console.log('Video preserved at index', newIndex);
        } else {
            console.log('Current video deleted, playing next available');
            if (this.currentIndex >= this.playlist.length) {
                this.currentIndex = 0;
            }
            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.player.loadVideoById(this.playlist[this.currentIndex]);
                this.updateProgramInfo();
            }
        }
    }

    /**
     * Load a specific playlist
     */
    loadPlaylist(playlistId) {
        this.currentPlaylistId = playlistId;
        
        let playlists = Utils.storage.get('adminPlaylists') || {};
        
        // Auto-seed if empty (Fresh Install/Vercel)
        if ((!playlists['default'] || playlists['default'].length === 0) && CONFIG.defaultPlaylist && CONFIG.defaultPlaylist.length > 0) {
            console.log('Seeding default playlist from config...');
            playlists['default'] = CONFIG.defaultPlaylist.map(id => ({
                youtubeId: id,
                title: 'Default Stream',
                duration: 0,
                type: 'video',
                addedAt: new Date().toISOString()
            }));
            Utils.storage.set('adminPlaylists', playlists);
        }

        let playlist = playlists[playlistId];
        
        // STRICT MODE: NO LEGACY FALLBACK
        
        if (playlist && playlist.length > 0) {
            console.log(`Loaded playlist ${playlistId} with ${playlist.length} videos`);
            this.playlist = playlist.map(item => item.youtubeId || item);
            
            // Hide empty playlist message if exists
            const msg = document.getElementById('emptyPlaylistMsg');
            if (msg) msg.style.display = 'none';

            if (this.player && typeof this.player.loadVideoById === 'function') {
                this.currentIndex = 0;
                this.player.loadVideoById(this.playlist[0]);
                this.updateProgramInfo();
            }
        } else {
            console.warn(`Playlist ${playlistId} is empty or not found. Player idle.`);
            this.playlist = [];
            
            // Show empty playlist message
            const playerWrapper = document.querySelector('.player-wrapper');
            if (playerWrapper) {
                let msg = document.getElementById('emptyPlaylistMsg');
                if (!msg) {
                    msg = document.createElement('div');
                    msg.id = 'emptyPlaylistMsg';
                    msg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 8px; text-align: center; z-index: 20; pointer-events: none;';
                    msg.innerHTML = '<h3>No Content Scheduled</h3><p>Please add videos to the playlist in Admin Panel</p>';
                    playerWrapper.appendChild(msg);
                } else {
                    msg.style.display = 'block';
                }
            }

            // Stop player
            if (this.player && typeof this.player.stopVideo === 'function') {
                this.player.stopVideo();
            }
        }
    }

    /**
     * Initialize YouTube player
     */
    init() {
        // Start schedule checker
        this.startScheduleChecker();
        
        // Listen for force play events
        this.startForcePlayListener();

        // Listen for playlist updates
        this.startPlaylistUpdateListener();
        
        // Listen for visibility changes (Mobile optimization)
        this.startVisibilityListener();

        // Initial playlist load (Force Cloud Check)
        if (window.Cloud && window.Cloud.enabled) {
             if (!window.Cloud.initialized) {
                 window.Cloud.init().then(async () => {
                     try {
                         // Fetch latest playlist and schedule immediately
                         const [playlists, schedule] = await Promise.all([
                             window.Cloud.get('playlists'),
                             window.Cloud.get('schedule')
                         ]);

                         if (playlists) {
                             console.log('Initial Cloud Playlist Fetch Success');
                             Utils.storage.set('adminPlaylists', playlists);
                         }
                         
                         if (schedule) {
                             console.log('Initial Cloud Schedule Fetch Success');
                             Utils.storage.set('scheduleEvents', schedule);
                         }

                         this.checkSchedule(true, true); // force=true, checkContent=true
                     } catch (err) {
                         console.error('Error fetching initial cloud data:', err);
                         this.checkSchedule(true);
                     }
                 });
             }
        } else {
             this.checkSchedule(true);
        }

        // Create Debug Overlay (for diagnosing playlist issues)
        this.createDebugOverlay();

        return new Promise((resolve, reject) => {
            // Function to create player once API is ready
            const createPlayerWhenReady = () => {
                if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
                    console.log('YouTube API ready, creating player...');
                    this.createPlayer(resolve, reject);
                } else {
                    console.log('Waiting for YouTube API...');
                    setTimeout(createPlayerWhenReady, 100);
                }
            };

            // Set global callback for YouTube API
            if (typeof YT === 'undefined') {
                window.onYouTubeIframeAPIReady = () => {
                    console.log('YouTube API loaded via callback');
                    createPlayerWhenReady();
                };
            } else {
                createPlayerWhenReady();
            }
        });
    }

    /**
     * Create Debug Overlay
     */
    createDebugOverlay() {
        if (document.getElementById('debugOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'debugOverlay';
        overlay.style.cssText = 'position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: lime; padding: 10px; font-family: monospace; font-size: 12px; z-index: 9999; pointer-events: none; display: none;';
        document.body.appendChild(overlay);

        // Update loop
        setInterval(() => {
            if (this.player && this.player.getVideoData) {
                const data = this.player.getVideoData();
                const state = this.player.getPlayerState();
                const states = ['Ended', 'Playing', 'Paused', 'Buffering', 'Cued'];
                
                overlay.innerHTML = `
                    <strong>Debug Info</strong><br>
                    Playlist Length: ${this.playlist.length}<br>
                    Current Index: ${this.currentIndex}<br>
                    Video ID: ${data ? data.video_id : 'N/A'}<br>
                    State: ${states[state] || state}<br>
                    Playlist ID: ${this.currentPlaylistId}
                `;
            }
        }, 1000);

        // Toggle with 'D' key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    /**
     * Create YouTube player instance
     */
    createPlayer(resolve, reject) {
        try {
            console.log('Creating player with config:', {
                containerId: this.containerId,
                videoId: this.playlist.length > 0 ? this.playlist[0] : 'none',
                playlistLength: this.playlist.length
            });

            const playerConfig = {
                height: '100%',
                width: '100%',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    fs: 0, // Disable fullscreen button (reduces branding)
                    disablekb: 1 // Disable keyboard controls (prevents seeking/pausing)
                },
                events: {
                    onReady: (event) => {
                        console.log('✅ Player ready!');
                        this.onPlayerReady(event);
                        resolve(this.player);
                    },
                    onStateChange: (event) => this.onPlayerStateChange(event),
                    onError: (event) => this.onPlayerError(event),
                }
            };

            if (this.playlist.length > 0) {
                playerConfig.videoId = this.playlist[0];
            }

            this.player = new YT.Player(this.containerId, playerConfig);
        } catch (error) {
            console.error('❌ Error creating player:', error);
            reject(error);
        }
    }

    /**
     * Handle player ready event
     */
    onPlayerReady(event) {
        if (this.config.autoplay && this.playlist.length > 0) {
            if (this.config.muteOnAutoplay && typeof event.target.mute === 'function') {
                event.target.mute();
            }
            event.target.playVideo();
        }
        // Show overlay to prompt user gesture for audio
        if (this.config.muteOnAutoplay) {
            this.showOverlay();
        }
        this.updateProgramInfo();
    }

    /**
     * Handle player state changes
     */
    onPlayerStateChange(event) {
        const states = {
            '-1': 'unstarted',
            '0': 'ended',
            '1': 'playing',
            '2': 'paused',
            '3': 'buffering',
            '5': 'cued'
        };

        const state = states[event.data] || 'unknown';
        console.log('Player state:', state);

        // Auto-play next video when current ends
        if (event.data === YT.PlayerState.ENDED || event.data === 0) {
            if (!this.isLiveMode) {
                console.log('Video ended, triggering playNext...');
                this.playNext();
            }
        }

        // Update UI based on state
        if (event.data === YT.PlayerState.PLAYING) {
            // Keep overlay visible if muted to prompt user to unmute
            const isMuted = this.player && typeof this.player.isMuted === 'function' ? this.player.isMuted() : false;
            if (!isMuted) {
                this.hideOverlay();
            } else {
                this.showOverlay();
            }
            this.resetRetryCount();
            this.trackAnalytics('play');
        } else if (event.data === YT.PlayerState.PAUSED) {
            this.showOverlay();
        }
    }

    /**
     * Handle player errors
     */
    onPlayerError(event) {
        const errorCode = event.data;
        console.error('Player error code:', errorCode);
        
        const errors = {
            2: 'Invalid video ID',
            5: 'HTML5 player error',
            100: 'Video not found or private',
            101: 'Embedding disabled by owner',
            150: 'Embedding disabled by owner'
        };

        const errorMessage = errors[errorCode] || 'Unknown error';
        console.log(`⚠️ ${errorMessage} - Skipping to next video...`);

        // Log error to Cloud
        if (window.Cloud) {
            window.Cloud.log('error', 'Player Error', {
                code: errorCode,
                message: errorMessage,
                videoId: this.playlist[this.currentIndex]
            });
        }

        // Show visual feedback briefly
        const playerWrapper = document.querySelector('.player-wrapper');
        if (playerWrapper && (errorCode === 101 || errorCode === 150)) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'player-error-overlay';
            errorDiv.innerHTML = `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                            background: rgba(233, 69, 96, 0.9); padding: 20px; border-radius: 8px; color: white; text-align: center; z-index: 100;">
                    <h3>⚠️ Video Not Available</h3>
                    <p>${errorMessage}</p>
                    <p>Skipping...</p>
                </div>
            `;
            playerWrapper.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 1000);
        }

        // Auto-fallback if enabled
        if (CONFIG.stream.autoFallback && this.isLiveMode) {
            this.handleAutoFallback();
        } else if (!this.isLiveMode) {
            // Fast skip (500ms) for seamless experience
            setTimeout(() => {
                this.playNext();
            }, 500);
        }
    }

    /**
     * Handle auto-fallback to playlist
     */
    async handleAutoFallback() {
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            console.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`);
            await Utils.sleep(CONFIG.stream.reconnectDelay);
            this.player.loadVideoById(this.liveSource);
        } else {
            console.log('Max retries reached, falling back to playlist');
            Utils.showToast('Live stream unavailable. Switching to auto playlist.', 'warning', 5000);
            this.switchToPlaylistMode();
        }
    }

    /**
     * Play next video in playlist
     */
    playNext() {
        if (!this.playlist || this.playlist.length === 0) {
            console.warn('Cannot play next: Playlist is empty');
            return;
        }

        const playbackOrder = Utils.storage.get('playbackOrder') || 'sequential';

        // Ensure currentIndex is valid
        if (typeof this.currentIndex !== 'number' || isNaN(this.currentIndex)) {
            this.currentIndex = 0;
        }

        if (playbackOrder === 'random' && this.playlist.length > 1) {
            let nextIndex;
            // Simple random selection avoiding current video
            do {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } while (nextIndex === this.currentIndex);
            
            this.currentIndex = nextIndex;
            console.log(`Loading random video: index ${this.currentIndex} / ${this.playlist.length}`);
        } else {
            // Sequential order
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
            console.log(`Loading next video: index ${this.currentIndex} / ${this.playlist.length} (ID: ${this.playlist[this.currentIndex]})`);
        }

        const videoId = this.playlist[this.currentIndex];
        
        if (!videoId) {
            console.error('Invalid video ID at index', this.currentIndex);
            // Try next one
            setTimeout(() => this.playNext(), 500);
            return;
        }

        try {
            this.player.loadVideoById(videoId);
            this.updateProgramInfo();
        } catch (error) {
            console.error('Error loading video, trying next:', error);
            // If loading fails, try next video
            setTimeout(() => this.playNext(), 1000);
        }
    }

    /**
     * Play previous video in playlist
     */
    playPrevious() {
        this.currentIndex = this.currentIndex === 0 ? this.playlist.length - 1 : this.currentIndex - 1;
        const videoId = this.playlist[this.currentIndex];
        this.player.loadVideoById(videoId);
        this.updateProgramInfo();
    }

    /**
     * Switch to live mode
     */
    switchToLiveMode(source, sourceType = 'youtube') {
        this.isLiveMode = true;
        this.liveSource = source;
        this.resetRetryCount();

        if (sourceType === 'youtube') {
            const videoId = Utils.getYouTubeVideoId(source);
            this.player.loadVideoById(videoId);
        }

        this.updateLiveBadge(true);
        Utils.showToast('Switched to live mode', 'success');
    }

    /**
     * Switch to playlist mode
     */
    switchToPlaylistMode() {
        this.isLiveMode = false;
        this.liveSource = null;
        this.resetRetryCount();
        this.currentIndex = 0;
        this.player.loadVideoById(this.playlist[0]);
        this.updateLiveBadge(false);
        this.updateProgramInfo();
    }

    /**
     * Update playlist
     */
    updatePlaylist(newPlaylist) {
        if (!Array.isArray(newPlaylist) || newPlaylist.length === 0) {
            console.error('Invalid playlist');
            return false;
        }
        // Ensure we have IDs
        this.playlist = newPlaylist.map(p => p.youtubeId || p);
        this.currentIndex = 0;
        if (!this.isLiveMode && this.player) {
            this.player.loadVideoById(this.playlist[0]);
            this.updateProgramInfo();
        }
        return true;
    }

    /**
     * Update program information display
     */
    updateProgramInfo() {
        const nowPlayingTitle = document.getElementById('nowPlayingTitle');
        
        if (nowPlayingTitle) {
            // Get title from adminPlaylists storage
            const playlists = Utils.storage.get('adminPlaylists') || {};
            const playlist = playlists[this.currentPlaylistId] || [];
            const currentVideoId = this.playlist[this.currentIndex];
            
            // Handle both object format and simple ID format
            const videoData = playlist.find(item => {
                const id = typeof item === 'string' ? item : item.youtubeId;
                return id === currentVideoId;
            });
            
            if (videoData && videoData.title) {
                nowPlayingTitle.textContent = videoData.title;
            } else {
                // Fallback or default
                nowPlayingTitle.textContent = 'Islamic Live TV';
            }
        }
    }

    /**
     * Update live badge
     */
    updateLiveBadge(isLive) {
        const badge = document.getElementById('liveBadge');
        if (badge) {
            const text = badge.querySelector('.live-badge__text');
            if (text) {
                text.textContent = isLive ? 'LIVE NOW' : 'LIVE 24/7';
            }
        }
    }

    /**
     * Show player overlay
     */
    showOverlay() {
        const overlay = document.getElementById('playerOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    /**
     * Hide player overlay
     */
    hideOverlay() {
        const overlay = document.getElementById('playerOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * Reset retry count
     */
    resetRetryCount() {
        this.retryCount = 0;
    }

    /**
     * Track analytics
     */
    trackAnalytics(action) {
        if (window.Cloud && window.Cloud.enabled) {
            window.Cloud.track(action, {
                videoId: this.isLiveMode ? this.liveSource : this.playlist[this.currentIndex],
                isLive: this.isLiveMode,
                playlistId: this.currentPlaylistId
            });
        }
    }

    /**
     * Get current video info
     */
    getCurrentVideoInfo() {
        if (!this.player || !this.player.getVideoData) return null;
        return this.player.getVideoData();
    }

    /**
     * Get player state
     */
    getState() {
        if (!this.player || !this.player.getPlayerState) return null;
        return this.player.getPlayerState();
    }

    /**
     * Play video
     */
    play() {
        if (this.player && this.player.playVideo) {
            this.player.playVideo();
        }
    }

    /**
     * Pause video
     */
    pause() {
        if (this.player && this.player.pauseVideo) {
            this.player.pauseVideo();
        }
    }

    /**
     * Set volume (0-100)
     */
    setVolume(volume) {
        if (this.player && this.player.setVolume) {
            this.player.setVolume(Math.max(0, Math.min(100, volume)));
        }
    }

    /**
     * Mute player
     */
    mute() {
        if (this.player && this.player.mute) {
            this.player.mute();
        }
    }

    /**
     * Unmute player
     */
    unmute() {
        if (this.player && this.player.unMute) {
            this.player.unMute();
        }
    }

    /**
     * Destroy player
     */
    destroy() {
        if (this.player && this.player.destroy) {
            this.player.destroy();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPlayer;
}
