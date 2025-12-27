// ============================================
// ADMIN PANEL
// ============================================

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.isAuthenticated = false;
        this.currentPlaylistId = 'default';
        this.init();
    }

    /**
     * Initialize admin panel
     */
    init() {
        this.checkAuthentication();
        
        if (!this.isAuthenticated) {
            this.showLoginScreen();
        } else {
            this.showDashboard();
        }
    }

    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        const session = Utils.storage.get('adminSession');
        
        if (session && session.expiry > Date.now()) {
            this.isAuthenticated = true;
            this.currentUser = session.username;
        }
    }

    /**
     * Show login screen
     */
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('adminDashboard');

        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';

        this.initLoginForm();
    }

    /**
     * Show dashboard
     */
    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('adminDashboard');

        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';

        this.initDashboard();
    }

    /**
     * Initialize login form
     */
    initLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    /**
     * Handle login
     */
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const errorElement = document.getElementById('loginError');

        // Simple authentication (In production, use backend API)
        if (username === CONFIG.admin.defaultUsername && password === CONFIG.admin.defaultPassword) {
            // Create session
            const session = {
                username: username,
                expiry: Date.now() + (rememberMe ? CONFIG.admin.sessionTimeout * 7 : CONFIG.admin.sessionTimeout)
            };

            Utils.storage.set('adminSession', session);
            this.isAuthenticated = true;
            this.currentUser = username;

            Utils.showToast('Login successful!', 'success');
            this.showDashboard();
        } else {
            if (errorElement) {
                errorElement.textContent = 'Invalid username or password';
                errorElement.style.display = 'block';
            }
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        Utils.storage.remove('adminSession');
        this.isAuthenticated = false;
        this.currentUser = null;
        Utils.showToast('Logged out successfully', 'success');
        this.showLoginScreen();
    }

    /**
     * Initialize dashboard
     */
    initDashboard() {
        this.initNavigation();
        this.initLogout();
        this.initMobileSidebar();
        this.initPlaylistManager(); // Initialize playlist manager
        this.initScheduleManager(); // Initialize schedule manager
        this.loadDashboardData();
    }

    /**
     * Initialize navigation
     */
    initNavigation() {
        const navLinks = document.querySelectorAll('.admin-nav__link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.dataset.section;
                this.switchSection(section);

                // Update active state
                navLinks.forEach(l => l.classList.remove('admin-nav__link--active'));
                link.classList.add('admin-nav__link--active');
            });
        });
    }

    /**
     * Initialize logout button
     */
    initLogout() {
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    /**
     * Initialize mobile sidebar
     */
    initMobileSidebar() {
        const toggle = document.getElementById('mobileSidebarToggle');
        const sidebar = document.getElementById('adminSidebar');

        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }

    /**
     * Switch section
     */
    switchSection(section) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(s => {
            s.style.display = 'none';
        });

        // Show selected section
        const sectionElement = document.getElementById(`section-${section}`);
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }

        // Update title
        const titleElement = document.getElementById('sectionTitle');
        if (titleElement) {
            titleElement.textContent = section.charAt(0).toUpperCase() + section.slice(1);
        }

        this.currentSection = section;

        // Load section data
        this.loadSectionData(section);
    }

    /**
     * Load dashboard data
     */
    loadDashboardData() {
        // Load stats
        this.updateStats();

        // Load most watched content
        this.loadMostWatched();

        // Load recent activity
        this.loadRecentActivity();
    }

    /**
     * Update statistics
     */
    updateStats() {
        if (window.Analytics) {
            const summary = window.Analytics.getSummary();
            
            const currentViewers = document.getElementById('currentViewers');
            if (currentViewers) {
                currentViewers.textContent = summary.currentViewers.toLocaleString();
            }

            const totalWatchTime = document.getElementById('totalWatchTime');
            if (totalWatchTime) {
                const hours = Math.floor(summary.totalWatchTime / 3600);
                totalWatchTime.textContent = `${hours.toLocaleString()}K`;
            }
        }
    }

    /**
     * Load most watched content
     */
    loadMostWatched() {
        const list = document.getElementById('mostWatchedList');
        if (!list) return;

        // Sample data
        const content = [
            { title: 'Islamic Lecture Series', views: 15420 },
            { title: 'Quran Recitation', views: 12800 },
            { title: 'Friday Khutbah', views: 9500 }
        ];

        list.innerHTML = content.map(item => `
            <div class="content-item">
                <span class="content-item__title">${item.title}</span>
                <span class="content-item__views">${item.views.toLocaleString()} views</span>
            </div>
        `).join('');
    }

    /**
     * Load recent activity
     */
    loadRecentActivity() {
        const list = document.getElementById('activityList');
        if (!list) return;

        // Sample data
        const activities = [
            { action: 'Video added to playlist', time: '2 hours ago' },
            { action: 'Live stream started', time: '5 hours ago' },
            { action: 'Schedule updated', time: '1 day ago' }
        ];

        list.innerHTML = activities.map(item => `
            <div class="activity-item">
                <span class="activity-item__action">${item.action}</span>
                <span class="activity-item__time">${item.time}</span>
            </div>
        `).join('');
    }

    /**
     * Load section data
     */
    loadSectionData(section) {
        switch (section) {
            case 'stream':
                this.initStreamControl();
                break;
            case 'playlist':
                this.loadPlaylist();
                break;
            case 'recordings':
                this.loadRecordings();
                break;
            case 'schedule':
                this.loadSchedule();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    /**
     * Initialize stream control
     */
    initStreamControl() {
        const autoModeBtn = document.getElementById('autoModeBtn');
        const liveModeBtn = document.getElementById('liveModeBtn');
        const liveConfig = document.getElementById('liveSourceConfig');
        const startLiveBtn = document.getElementById('startLiveBtn');
        const stopLiveBtn = document.getElementById('stopLiveBtn');

        if (autoModeBtn) {
            autoModeBtn.addEventListener('click', () => {
                autoModeBtn.classList.add('toggle-btn--active');
                liveModeBtn.classList.remove('toggle-btn--active');
                if (liveConfig) liveConfig.style.display = 'none';
                
                // Switch main player to auto mode
                if (window.videoPlayer) {
                    window.videoPlayer.switchToPlaylistMode();
                }
                Utils.showToast('Switched to auto playlist mode', 'success');
            });
        }

        if (liveModeBtn) {
            liveModeBtn.addEventListener('click', () => {
                liveModeBtn.classList.add('toggle-btn--active');
                autoModeBtn.classList.remove('toggle-btn--active');
                if (liveConfig) liveConfig.style.display = 'block';
            });
        }

        if (startLiveBtn) {
            startLiveBtn.addEventListener('click', () => {
                const sourceType = document.getElementById('liveSourceType').value;
                const streamUrl = document.getElementById('liveStreamUrl').value;
                const streamTitle = document.getElementById('liveStreamTitle').value;

                if (!streamUrl) {
                    Utils.showToast('Please enter stream URL', 'error');
                    return;
                }

                // Start live stream
                if (window.videoPlayer) {
                    window.videoPlayer.switchToLiveMode(streamUrl, sourceType);
                }

                startLiveBtn.style.display = 'none';
                stopLiveBtn.style.display = 'inline-flex';
                Utils.showToast('Live stream started!', 'success');
            });
        }

        if (stopLiveBtn) {
            stopLiveBtn.addEventListener('click', () => {
                if (window.videoPlayer) {
                    window.videoPlayer.switchToPlaylistMode();
                }

                stopLiveBtn.style.display = 'none';
                startLiveBtn.style.display = 'inline-flex';
                Utils.showToast('Live stream stopped', 'success');
            });
        }

        // Emergency broadcast
        const activateBtn = document.getElementById('activateEmergencyBtn');
        const deactivateBtn = document.getElementById('deactivateEmergencyBtn');

        if (activateBtn) {
            activateBtn.addEventListener('click', () => {
                const message = document.getElementById('emergencyMessage').value;
                if (!message) {
                    Utils.showToast('Please enter a message', 'error');
                    return;
                }

                // Show emergency broadcast
                if (typeof showEmergencyBroadcast === 'function') {
                    showEmergencyBroadcast(message);
                }

                activateBtn.style.display = 'none';
                deactivateBtn.style.display = 'inline-flex';
                Utils.showToast('Emergency broadcast activated', 'success');
            });
        }

        if (deactivateBtn) {
            deactivateBtn.addEventListener('click', () => {
                // Hide emergency broadcast
                if (typeof hideEmergencyBroadcast === 'function') {
                    hideEmergencyBroadcast();
                }

                deactivateBtn.style.display = 'none';
                activateBtn.style.display = 'inline-flex';
                Utils.showToast('Emergency broadcast deactivated', 'success');
            });
        }
    }

    /**
     * Load playlist
     */
    async loadPlaylist() {
        const tbody = document.getElementById('playlistTableBody');
        if (!tbody) return;

        // Initialize playlist controls if not already done
        if (!this.playlistControlsInitialized) {
            this.initPlaylistControls();
            this.playlistControlsInitialized = true;
        }

        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading playlist...</td></tr>';

        try {
            // First try to load from Cloud if available
            let cloudPlaylists = null;
            if (window.Cloud && window.Cloud.enabled && window.Cloud.initialized) {
                 cloudPlaylists = await window.Cloud.get('playlists');
                 if (cloudPlaylists) {
                     console.log('Loaded playlists from Cloud');
                     // Sync Cloud -> Local
                     Utils.storage.set('adminPlaylists', cloudPlaylists);
                 }
            }

            // Fallback to local storage (or if Cloud update updated it)
            let playlists = cloudPlaylists || Utils.storage.get('adminPlaylists') || {};
            
            // STRICT MODE: NO MIGRATION FROM LEGACY DATA
            if (!playlists['default'] || playlists['default'].length === 0) {
                // Initialize with default config if available (Fresh Install)
                if (CONFIG.defaultPlaylist && CONFIG.defaultPlaylist.length > 0) {
                    playlists['default'] = CONFIG.defaultPlaylist.map(id => ({
                        youtubeId: id,
                        title: 'Default Stream',
                        duration: 0,
                        type: 'video',
                        addedAt: new Date().toISOString()
                    }));
                    console.log('Initialized default playlist from config');
                } else {
                    playlists['default'] = [];
                }
                Utils.storage.set('adminPlaylists', playlists);
                // Sync back to cloud if it was empty
                if (window.Cloud && window.Cloud.enabled) {
                    window.Cloud.set('playlists', playlists);
                }
            }

            // Ensure currentPlaylistId exists
            if (!playlists[this.currentPlaylistId]) {
                this.currentPlaylistId = 'default';
            }
            
            // Update selector value
            const selector = document.getElementById('playlistSelector');
            if (selector) {
                // Re-populate options if needed (simple check)
                if (selector.options.length !== Object.keys(playlists).length) {
                    this.updatePlaylistSelector(playlists);
                }
                selector.value = this.currentPlaylistId;
            }

            // Update delete button visibility
            const deleteBtn = document.getElementById('deletePlaylistBtn');
            if (deleteBtn) {
                deleteBtn.style.display = this.currentPlaylistId === 'default' ? 'none' : 'inline-flex';
            }

            const currentPlaylist = playlists[this.currentPlaylistId] || [];
            this.renderPlaylist(currentPlaylist);

        } catch (error) {
            console.error('Error loading playlist:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-error">Error loading playlist</td></tr>';
        }
    }

    /**
     * Update Playlist Selector Options
     */
    updatePlaylistSelector(playlists) {
        const selector = document.getElementById('playlistSelector');
        if (!selector) return;
        
        selector.innerHTML = '';
        Object.keys(playlists).forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            // Format name: "my_playlist" -> "My Playlist"
            option.textContent = id === 'default' ? 'Default Playlist' : id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            selector.appendChild(option);
        });
        selector.value = this.currentPlaylistId;
    }

    /**
     * Initialize Playlist Manager (Selector, Create, Delete)
     */
    initPlaylistManager() {
        const selector = document.getElementById('playlistSelector');
        const createBtn = document.getElementById('createPlaylistBtn');
        const deleteBtn = document.getElementById('deletePlaylistBtn');
        const createModal = document.getElementById('createPlaylistModal');
        const createForm = document.getElementById('createPlaylistForm');
        const closeCreateModal = document.getElementById('closeCreatePlaylistModal');
        const cancelCreate = document.getElementById('cancelCreatePlaylist');

        if (selector) {
            selector.addEventListener('change', (e) => {
                this.currentPlaylistId = e.target.value;
                this.loadPlaylist();
            });
        }

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (createModal) createModal.style.display = 'flex';
                const input = document.getElementById('newPlaylistName');
                if (input) input.value = '';
                if (input) input.focus();
            });
        }

        const closeCreate = () => {
            if (createModal) createModal.style.display = 'none';
        };

        if (closeCreateModal) closeCreateModal.addEventListener('click', closeCreate);
        if (cancelCreate) cancelCreate.addEventListener('click', closeCreate);

        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('newPlaylistName');
                const name = nameInput.value.trim();
                if (name) {
                    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    let playlists = Utils.storage.get('adminPlaylists') || {};
                    
                    if (playlists[id]) {
                        Utils.showToast('Playlist already exists', 'error');
                        return;
                    }

                    playlists[id] = [];
                    Utils.storage.set('adminPlaylists', playlists);

                    // Sync to Cloud
                    if (window.Cloud && window.Cloud.enabled) {
                        if (!window.Cloud.initialized) await window.Cloud.init();
                        await window.Cloud.set('playlists', playlists);
                    }
                    
                    this.currentPlaylistId = id;
                    this.updatePlaylistSelector(playlists);
                    this.loadPlaylist();
                    closeCreate();
                    Utils.showToast('Playlist created', 'success');
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (this.currentPlaylistId === 'default') {
                    Utils.showToast('Cannot delete default playlist', 'error');
                    return;
                }

                if (confirm('Are you sure you want to delete this playlist? This cannot be undone.')) {
                    let playlists = Utils.storage.get('adminPlaylists') || {};
                    delete playlists[this.currentPlaylistId];
                    Utils.storage.set('adminPlaylists', playlists);
                    
                    // Sync to Cloud
                    if (window.Cloud && window.Cloud.enabled) {
                        if (!window.Cloud.initialized) await window.Cloud.init();
                        await window.Cloud.set('playlists', playlists);
                    }
                    
                    this.currentPlaylistId = 'default';
                    this.updatePlaylistSelector(playlists);
                    this.loadPlaylist();
                    Utils.showToast('Playlist deleted', 'success');
                }
            });
        }
    }

    /**
     * Render playlist table
     */
    renderPlaylist(playlist) {
        const tbody = document.getElementById('playlistTableBody');
        if (!tbody) return;

        if (playlist.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No videos in playlist. Add one to get started.</td></tr>';
            return;
        }

        tbody.innerHTML = playlist.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <img src="https://img.youtube.com/vi/${item.youtubeId}/default.jpg" 
                         alt="Thumbnail" 
                         style="height: 40px; border-radius: 4px;">
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 300px;" title="${item.title || item.youtubeId}">
                        ${item.title || item.youtubeId}
                    </div>
                </td>
                <td>${item.duration ? Utils.formatDuration(item.duration) : '--:--'}</td>
                <td>${item.type || 'video'}</td>
                <td>
                    <button class="btn btn--small btn--primary" onclick="window.adminPanel.playVideoNow(${index})" title="Play Now" style="margin-right: 5px;">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="btn btn--small btn--danger" onclick="window.adminPanel.deleteVideo(${index})" title="Remove">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Force play a video immediately
     */
    playVideoNow(index) {
        let playlists = Utils.storage.get('adminPlaylists') || {};
        let playlist = playlists[this.currentPlaylistId];
        
        if (playlist && playlist[index]) {
            const videoId = playlist[index].youtubeId;
            const duration = playlist[index].duration || 0;
            
            // Use a timestamp to ensure the event is always unique even for same video
            const eventData = {
                videoId: videoId,
                playlistId: this.currentPlaylistId,
                timestamp: Date.now(),
                duration: duration
            };
            Utils.storage.set('forcePlayVideo', eventData);

            // Sync Force Play to Cloud
            if (window.Cloud && window.Cloud.enabled) {
                window.Cloud.set('forcePlay', eventData);
            }

            Utils.showToast(`Requesting to play: ${playlist[index].title || videoId}`, 'success');
        }
    }

    /**
     * Initialize schedule manager
     */
    initScheduleManager() {
        const addBtn = document.getElementById('addScheduleBtn');
        const modal = document.getElementById('addScheduleModal');
        const closeBtn = document.getElementById('closeAddScheduleModal');
        const cancelBtn = document.getElementById('cancelAddSchedule');
        const form = document.getElementById('addScheduleForm');
        const recurrenceSelect = document.getElementById('scheduleRecurrence');
        const daysSelection = document.getElementById('daysSelection');
        
        // New elements
        const contentTypeSelect = document.getElementById('scheduleContentType');
        const playlistContainer = document.getElementById('schedulePlaylistContainer');
        const videoContainer = document.getElementById('scheduleVideoContainer');
        const playlistSelect = document.getElementById('schedulePlaylistSelect');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'flex';
                // Reset form
                if (form) form.reset();
                
                // Populate playlists
                if (playlistSelect) {
                    const playlists = Utils.storage.get('adminPlaylists') || {};
                    playlistSelect.innerHTML = '';
                    
                    // Add default first
                    const defaultOpt = document.createElement('option');
                    defaultOpt.value = 'default';
                    defaultOpt.textContent = 'Default Playlist';
                    playlistSelect.appendChild(defaultOpt);
                    
                    Object.keys(playlists).forEach(id => {
                        if (id === 'default') return;
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        playlistSelect.appendChild(option);
                    });
                }

                // Set default date/time
                const now = new Date();
                const dateInput = document.getElementById('scheduleDate');
                const timeInput = document.getElementById('scheduleTime');
                if (dateInput) dateInput.value = now.toISOString().split('T')[0];
                if (timeInput) timeInput.value = now.toTimeString().slice(0, 5);
                
                // Reset visibility
                if (playlistContainer) playlistContainer.style.display = 'block';
                if (videoContainer) videoContainer.style.display = 'none';
            });
        }

        if (contentTypeSelect) {
            contentTypeSelect.addEventListener('change', (e) => {
                if (e.target.value === 'playlist') {
                    if (playlistContainer) playlistContainer.style.display = 'block';
                    if (videoContainer) videoContainer.style.display = 'none';
                } else {
                    if (playlistContainer) playlistContainer.style.display = 'none';
                    if (videoContainer) videoContainer.style.display = 'block';
                }
            });
        }

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        if (recurrenceSelect) {
            recurrenceSelect.addEventListener('change', (e) => {
                if (daysSelection) {
                    daysSelection.style.display = e.target.value === 'weekly' ? 'block' : 'none';
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveScheduleEvent();
                closeModal();
            });
        }
        
        this.loadSchedule();
    }

    /**
     * Save schedule event
     */
    async saveScheduleEvent() {
        const title = document.getElementById('scheduleTitle').value;
        const description = document.getElementById('scheduleDescription').value;
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const duration = parseInt(document.getElementById('scheduleDuration').value) || 60;
        const recurrence = document.getElementById('scheduleRecurrence').value;
        
        const contentType = document.getElementById('scheduleContentType').value;
        let contentId = '';
        let contentName = '';

        if (contentType === 'playlist') {
            const select = document.getElementById('schedulePlaylistSelect');
            contentId = select.value;
            contentName = select.options[select.selectedIndex].text;
        } else {
            const input = document.getElementById('scheduleVideoId').value;
            // Extract ID if URL
            let videoId = input;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = input.match(regExp);
            if (match && match[2].length === 11) {
                videoId = match[2];
            }
            contentId = videoId;
            contentName = 'YouTube Video';
        }
        
        let days = [];
        if (recurrence === 'weekly') {
            document.querySelectorAll('input[name="days"]:checked').forEach(cb => {
                days.push(parseInt(cb.value));
            });
            // If no days selected but weekly, default to the day of the selected date
            if (days.length === 0) {
                const d = new Date(date);
                days.push(d.getDay());
            }
        }

        const event = {
            id: Date.now().toString(),
            title,
            description,
            startDate: date,
            startTime: time,
            duration,
            recurrence,
            days: recurrence === 'weekly' ? days : null,
            contentType,
            contentId,
            contentName,
            created: Date.now()
        };

        let schedule = Utils.storage.get('scheduleEvents') || [];
        schedule.push(event);
        Utils.storage.set('scheduleEvents', schedule);

        // Sync to Cloud
        if (window.Cloud && window.Cloud.enabled) {
            if (!window.Cloud.initialized) await window.Cloud.init();
            await window.Cloud.set('schedule', schedule);
        }

        Utils.showToast('Event scheduled successfully', 'success');
        this.loadSchedule();
    }

    /**
     * Delete schedule event
     */
    async deleteScheduleEvent(id) {
        if (confirm('Are you sure you want to delete this event?')) {
            let schedule = Utils.storage.get('scheduleEvents') || [];
            schedule = schedule.filter(e => e.id !== id.toString());
            Utils.storage.set('scheduleEvents', schedule);

            // Sync to Cloud
            if (window.Cloud && window.Cloud.enabled) {
                if (!window.Cloud.initialized) await window.Cloud.init();
                await window.Cloud.set('schedule', schedule);
            }

            Utils.showToast('Event deleted', 'success');
            this.loadSchedule();
        }
    }

    /**
     * Load schedule
     */
    async loadSchedule() {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading schedule...</td></tr>';

        try {
            // Try Cloud first
            if (window.Cloud && window.Cloud.enabled) {
                if (!window.Cloud.initialized) await window.Cloud.init();
                const cloudSchedule = await window.Cloud.get('schedule');
                if (cloudSchedule) {
                    Utils.storage.set('scheduleEvents', cloudSchedule);
                }
            }

            const schedule = Utils.storage.get('scheduleEvents') || [];

            if (schedule.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No scheduled events.</td></tr>';
                return;
            }

            // Sort by start date/time (simplified)
            schedule.sort((a, b) => (a.startDate + a.startTime).localeCompare(b.startDate + b.startTime));

            tbody.innerHTML = schedule.map(item => `
                <tr>
                    <td>
                        <div style="font-weight: bold;">${item.title}</div>
                        <div style="font-size: 0.8em; color: #aaa;">${item.description || ''}</div>
                        <div style="font-size: 0.8em; margin-top: 4px; color: #4CAF50;">
                            ${item.contentType === 'video' ? 'Video: ' : 'Playlist: '} 
                            ${item.contentName || item.contentId || 'Default'}
                        </div>
                    </td>
                    <td>
                        <div>${item.startDate}</div>
                        <div style="font-size: 1.1em;">${item.startTime}</div>
                    </td>
                    <td>${item.duration} min</td>
                    <td>
                        <span class="status-badge" style="background: #3498db;">
                            ${item.recurrence === 'none' ? 'One-time' : item.recurrence.toUpperCase()}
                        </span>
                        ${item.recurrence === 'weekly' && item.days ? `<div style="font-size: 0.8em; margin-top: 4px;">${this.formatDays(item.days)}</div>` : ''}
                    </td>
                    <td>
                        <button class="btn btn--small btn--danger" onclick="window.adminPanel.deleteScheduleEvent('${item.id}')">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading schedule:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">Error loading schedule</td></tr>';
        }
    }

    formatDays(days) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(d => dayNames[d]).join(', ');
    }

    /**
     * Initialize playlist controls
     */
    initPlaylistControls() {
        const addBtn = document.getElementById('addVideoBtn');
        const searchYoutubeBtn = document.getElementById('searchYoutubeBtn');
        const importBtn = document.getElementById('importPlaylistBtn');
        const importYoutubeBtn = document.getElementById('importYoutubeBtn');
        const forceSyncBtn = document.getElementById('forceSyncBtn');
        const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
        const fileInput = document.getElementById('playlistFileInput');
        const modal = document.getElementById('addVideoModal');
        const searchYoutubeModal = document.getElementById('searchYoutubeModal');
        const youtubeModal = document.getElementById('importYoutubeModal');
        const closeBtn = document.getElementById('closeAddVideoModal');
        const closeSearchYoutubeBtn = document.getElementById('closeSearchYoutubeModal');
        const closeYoutubeBtn = document.getElementById('closeImportYoutubeModal');
        const cancelBtn = document.getElementById('cancelAddVideo');
        const cancelYoutubeBtn = document.getElementById('cancelImportYoutube');
        const form = document.getElementById('addVideoForm');
        const youtubeForm = document.getElementById('importYoutubeForm');
        const playbackOrderSelect = document.getElementById('playbackOrderSelect');
        const youtubeSearchBtn = document.getElementById('youtubeSearchBtn');
        const youtubeSearchInput = document.getElementById('youtubeSearchInput');

        // Handle Playback Order
        if (playbackOrderSelect) {
            // Load saved setting
            const savedOrder = Utils.storage.get('playbackOrder') || 'sequential';
            playbackOrderSelect.value = savedOrder;

            // Save on change
            playbackOrderSelect.addEventListener('change', (e) => {
                Utils.storage.set('playbackOrder', e.target.value);
                Utils.showToast(`Playback order set to ${e.target.value}`, 'success');
            });
        }

        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
                // Set default order to last + 1
                let playlists = Utils.storage.get('adminPlaylists') || {};
                let playlist = playlists[this.currentPlaylistId] || [];
                // Fallback
                if (!playlist.length && this.currentPlaylistId === 'default') {
                    // STRICT MODE: NO FALLBACK
                    playlist = [];
                }

                const orderInput = form.querySelector('input[type="number"]');
                if (orderInput) orderInput.value = playlist.length + 1;
            });
        }

        if (searchYoutubeBtn && searchYoutubeModal) {
            searchYoutubeBtn.addEventListener('click', () => {
                searchYoutubeModal.style.display = 'flex';
                if (youtubeSearchInput) youtubeSearchInput.focus();
            });
        }

        if (youtubeSearchBtn && youtubeSearchInput) {
            youtubeSearchBtn.addEventListener('click', () => {
                this.handleSearchYoutube(youtubeSearchInput.value);
            });
            youtubeSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearchYoutube(youtubeSearchInput.value);
                }
            });
        }

        if (importYoutubeBtn && youtubeModal) {
            importYoutubeBtn.addEventListener('click', () => {
                youtubeModal.style.display = 'flex';
            });
        }

        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', async () => {
                forceSyncBtn.disabled = true;
                forceSyncBtn.innerHTML = 'Syncing...';
                try {
                    // Force upload of current local state to cloud
                    const playlists = Utils.storage.get('adminPlaylists') || {};
                    if (window.Cloud && window.Cloud.enabled) {
                        if (!window.Cloud.initialized) await window.Cloud.init();
                        
                        await window.Cloud.set('playlists', playlists);
                        await window.Cloud.set('lastUpdate', Date.now());
                        Utils.showToast('Forced Sync to Cloud Successful', 'success');
                    } else {
                        Utils.showToast('Cloud is disabled', 'error');
                    }
                } catch (e) {
                    console.error('Force Sync Error', e);
                    Utils.showToast('Sync Failed', 'error');
                } finally {
                    forceSyncBtn.disabled = false;
                    forceSyncBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                        Sync Cloud`;
                }
            });
        }

        if (clearPlaylistBtn) {
            clearPlaylistBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the entire playlist? This action cannot be undone.')) {
                    this.savePlaylist([]);
                    this.renderPlaylist([]);
                    Utils.showToast('Playlist cleared', 'success');
                }
            });
        }

        if (importBtn && fileInput) {
            importBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleImportPlaylist(e.target.files[0]);
                    // Reset input so same file can be selected again if needed
                    e.target.value = '';
                }
            });
        }

        const closeModal = () => {
            if (modal) modal.style.display = 'none';
            if (form) form.reset();
            if (youtubeModal) youtubeModal.style.display = 'none';
            if (youtubeForm) youtubeForm.reset();
            if (searchYoutubeModal) searchYoutubeModal.style.display = 'none';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeSearchYoutubeBtn) closeSearchYoutubeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (closeYoutubeBtn) closeYoutubeBtn.addEventListener('click', closeModal);
        if (cancelYoutubeBtn) cancelYoutubeBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddVideo(form, closeModal);
            });
        }

        if (youtubeForm) {
            youtubeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleImportYoutube(youtubeForm, closeModal);
            });
        }
    }

    /**
     * Handle Import YouTube Playlist
     */
    async handleImportYoutube(form, closeModalCallback) {
        const input = form.querySelector('#youtubePlaylistUrl');
        const urlOrId = input.value.trim();

        if (!urlOrId) {
            Utils.showToast('Please enter a Playlist URL or ID', 'error');
            return;
        }

        // Extract Playlist ID
        let playlistId = null;
        if (/^[a-zA-Z0-9_-]{34}$/.test(urlOrId) || /^[a-zA-Z0-9_-]{12,}$/.test(urlOrId)) {
            // Likely an ID
            playlistId = urlOrId;
        } else {
            // Try to extract from URL
            try {
                const url = new URL(urlOrId);
                playlistId = url.searchParams.get('list');
            } catch (e) {
                // Not a valid URL, maybe just try regex match
                const match = urlOrId.match(/[?&]list=([^#\&\?]+)/);
                if (match) playlistId = match[1];
            }
        }

        if (!playlistId) {
            Utils.showToast('Invalid Playlist ID or URL', 'error');
            return;
        }

        const apiKey = CONFIG.api && CONFIG.api.youtube && CONFIG.api.youtube.key;
        if (!apiKey) {
            Utils.showToast('YouTube API Key not configured', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Fetching...';
        submitBtn.disabled = true;

        try {
            const maxResults = 50; // Max allowed by API per page
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${maxResults}&playlistId=${encodeURIComponent(playlistId)}&key=${apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ? data.error.message : 'Failed to fetch playlist');
            }

            if (!data.items || data.items.length === 0) {
                Utils.showToast('No videos found in this playlist', 'warning');
                return;
            }

            // Batch fetch details for all videos to get durations
            const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
            let detailsMap = {};
            
            try {
                const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;
                const detailsResponse = await fetch(detailsUrl);
                const detailsData = await detailsResponse.json();
                
                if (detailsData.items) {
                    detailsData.items.forEach(item => {
                        detailsMap[item.id] = {
                            duration: this.parseDuration(item.contentDetails.duration),
                            title: item.snippet.title
                        };
                    });
                }
            } catch (err) {
                console.error('Error fetching batch details:', err);
            }

            const newItems = data.items.map(item => {
                const vid = item.contentDetails.videoId;
                const details = detailsMap[vid] || {};
                
                return {
                    youtubeId: vid,
                    title: details.title || item.snippet.title,
                    duration: details.duration || 0,
                    type: 'video',
                    addedAt: new Date().toISOString()
                };
            }).filter(item => item.youtubeId); // Filter out any missing IDs

            if (newItems.length === 0) {
                Utils.showToast('No valid videos found', 'warning');
                return;
            }

            closeModalCallback();

            if (confirm(`Found ${newItems.length} videos. Replace existing playlist? (Click Cancel to Append)`)) {
                this.savePlaylist(newItems);
                this.renderPlaylist(newItems);
                Utils.showToast('Playlist replaced successfully', 'success');
            } else {
                let playlists = Utils.storage.get('adminPlaylists') || {};
                let current = playlists[this.currentPlaylistId] || [];
                // Fallback
                if (!current.length && this.currentPlaylistId === 'default') {
                    // STRICT MODE: NO FALLBACK
                    current = [];
                }
                const updated = [...current, ...newItems];
                this.savePlaylist(updated);
                this.renderPlaylist(updated);
                Utils.showToast(`Appended ${newItems.length} videos`, 'success');
            }

        } catch (error) {
            console.error('Error fetching YouTube playlist:', error);
            Utils.showToast(`Error: ${error.message}`, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Handle Search YouTube
     */
    async handleSearchYoutube(query) {
        if (!query.trim()) return;

        const resultsContainer = document.getElementById('youtubeSearchResults');
        resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px;"><div class="spinner"></div> Searching...</div>';

        const apiKey = CONFIG.api && CONFIG.api.youtube && CONFIG.api.youtube.key;
        if (!apiKey) {
             resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">API Key Missing</div>';
             return;
        }

        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                resultsContainer.innerHTML = data.items.map(item => `
                    <div class="video-card" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                        <img src="${item.snippet.thumbnails.medium.url}" style="width: 100%; border-radius: 4px; margin-bottom: 8px;">
                        <div style="font-weight: bold; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 14px;">${item.snippet.title}</div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">${item.snippet.channelTitle}</div>
                        <button class="btn btn--small btn--primary" onclick="window.adminPanel.addSearchedVideo('${item.id.videoId}', '${item.snippet.title.replace(/'/g, "\\'")}')" style="width: 100%;">Add to Playlist</button>
                    </div>
                `).join('');
            } else {
                resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px;">No results found</div>';
            }
        } catch (error) {
            console.error(error);
            resultsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Error: ${error.message}</div>`;
        }
    }

    /**
     * Add Searched Video to Playlist
     */
    async addSearchedVideo(videoId, title) {
        if (confirm(`Add "${title}" to playlist?`)) {
             try {
                const details = await this.fetchVideoDetails(videoId);
                const newItem = {
                    youtubeId: videoId,
                    title: title,
                    duration: details ? details.duration : 0,
                    type: 'video',
                    addedAt: new Date().toISOString()
                };

                let playlists = Utils.storage.get('adminPlaylists') || {};
                let playlist = playlists[this.currentPlaylistId] || [];
                playlist.push(newItem);
                
                this.savePlaylist(playlist);
                this.renderPlaylist(playlist);
                Utils.showToast('Video added to playlist', 'success');
             } catch (e) {
                 console.error(e);
                 Utils.showToast('Error adding video', 'error');
             }
        }
    }

    /**
     * Handle import playlist
     */
    handleImportPlaylist(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            let newItems = [];

            try {
                // Attempt 1: Try parsing as JSON
                const data = JSON.parse(content);
                
                // Handle different formats
                // 1. Array of strings: ["id1", "id2"]
                // 2. Object with defaultPlaylist: { defaultPlaylist: [...] }
                // 3. Array of objects: [{youtubeId: "...", ...}]
                
                let rawList = [];
                if (Array.isArray(data)) {
                    rawList = data;
                } else if (data.defaultPlaylist && Array.isArray(data.defaultPlaylist)) {
                    rawList = data.defaultPlaylist;
                } else if (typeof data === 'object') {
                    // Try to find any array property
                    const key = Object.keys(data).find(k => Array.isArray(data[k]));
                    if (key) rawList = data[key];
                }
                
                newItems = rawList.map(item => {
                    if (typeof item === 'string') {
                        // Basic validation for ID
                        if (item.length < 5) return null;
                        return {
                            youtubeId: item,
                            title: 'Imported Video',
                            duration: 0,
                            type: 'video',
                            addedAt: new Date().toISOString()
                        };
                    } else if (item && item.youtubeId) {
                        return {
                            youtubeId: item.youtubeId,
                            title: item.title || 'Imported Video',
                            duration: item.duration || 0,
                            type: item.type || 'video',
                            addedAt: new Date().toISOString()
                        };
                    }
                    return null;
                }).filter(i => i !== null);

            } catch (err) {
                // Attempt 2: Try parsing as plain text / M3U (one URL/ID per line)
                console.log('JSON parse failed, trying text mode', err);
                const lines = content.split(/\r?\n/);
                newItems = lines.map(line => {
                    const trimmed = line.trim();
                    // Skip empty lines and comments (M3U comments start with #)
                    if (!trimmed || trimmed.startsWith('#')) return null;
                    
                    const youtubeId = this.extractYoutubeId(trimmed);
                    if (youtubeId) {
                        return {
                            youtubeId: youtubeId,
                            title: 'Imported Video',
                            duration: 0,
                            type: 'video',
                            addedAt: new Date().toISOString()
                        };
                    }
                    return null;
                }).filter(i => i !== null);
            }
                
            if (newItems.length === 0) {
                Utils.showToast('No valid videos found in file', 'error');
                return;
            }
            
            if (confirm(`Found ${newItems.length} videos. Replace existing playlist? (Click Cancel to Append)`)) {
                this.savePlaylist(newItems);
                this.renderPlaylist(newItems);
                Utils.showToast('Playlist replaced successfully', 'success');
            } else {
                let playlists = Utils.storage.get('adminPlaylists') || {};
                let current = playlists[this.currentPlaylistId] || [];
                // Fallback
                if (!current.length && this.currentPlaylistId === 'default') {
                    // STRICT MODE: NO FALLBACK
                    current = [];
                }
                const updated = [...current, ...newItems];
                this.savePlaylist(updated);
                this.renderPlaylist(updated);
                Utils.showToast(`Appended ${newItems.length} videos`, 'success');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Handle add video form submission
     */
    async handleAddVideo(form, closeModalCallback) {
        const inputs = form.querySelectorAll('input');
        const rawInput = inputs[0].value.trim();
        const titleInput = inputs[1].value.trim();
        const position = parseInt(inputs[2].value) || 1;

        if (!rawInput) {
            Utils.showToast('Please enter Video ID(s) or URL(s)', 'error');
            return;
        }

        const items = rawInput.split(/[\s,]+/).filter(Boolean);
        if (items.length === 0) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;

        let addedCount = 0;
        let playlists = Utils.storage.get('adminPlaylists') || {};
        let playlist = playlists[this.currentPlaylistId] || [];
        let insertIndex = Math.max(0, Math.min(position - 1, playlist.length));

        try {
            // Process sequentially to maintain order
            for (const item of items) {
                const youtubeId = this.extractYoutubeId(item);
                if (youtubeId) {
                    const details = await this.fetchVideoDetails(youtubeId);
                    const newItem = {
                        youtubeId: youtubeId,
                        title: (details && details.title) ? details.title : (items.length === 1 && titleInput ? titleInput : 'New Video'),
                        duration: details ? details.duration : 0,
                        type: 'video',
                        addedAt: new Date().toISOString()
                    };
                    playlist.splice(insertIndex + addedCount, 0, newItem);
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                this.savePlaylist(playlist);
                this.renderPlaylist(playlist);
                Utils.showToast(`Added ${addedCount} video(s) successfully`, 'success');
                closeModalCallback();
            } else {
                Utils.showToast('No valid YouTube IDs found', 'error');
            }
        } catch (error) {
            console.error(error);
            Utils.showToast('Error adding video(s)', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Delete video from playlist
     */
    deleteVideo(index) {
        if (confirm('Are you sure you want to remove this video?')) {
            let playlists = Utils.storage.get('adminPlaylists') || {};
            let playlist = playlists[this.currentPlaylistId] || [];
            // STRICT MODE: NO LEGACY FALLBACK

            if (index >= 0 && index < playlist.length) {
                playlist.splice(index, 1);
                this.savePlaylist(playlist);
                this.renderPlaylist(playlist);
                Utils.showToast('Video removed', 'success');
            }
        }
    }

    /**
     * Save playlist to storage and sync with player config
     */
    async savePlaylist(playlist) {
        // Save to current playlist in the map
        let playlists = Utils.storage.get('adminPlaylists') || {};
        playlists[this.currentPlaylistId] = playlist;
        Utils.storage.set('adminPlaylists', playlists);

        // Save to Cloud if enabled
        if (window.Cloud && window.Cloud.enabled) {
            console.log('Attempting to save playlist to Cloud...');
            // Ensure cloud is initialized
            if (!window.Cloud.initialized) {
                 await window.Cloud.init();
            }
            
            const success = await window.Cloud.set('playlists', playlists);
            await window.Cloud.set('lastUpdate', Date.now());
            
            if (success) {
                console.log('✅ Playlist saved to Cloud');
                Utils.showToast('Synced to Cloud', 'success');
                if (window.Cloud && typeof window.Cloud.log === 'function') {
                    window.Cloud.log('info', 'Playlist Updated', {
                        playlistId: this.currentPlaylistId,
                        itemCount: playlist.length
                    });
                }
            } else {
                console.error('❌ Failed to save playlist to Cloud');
                Utils.showToast('Cloud Sync Failed', 'error');
                if (window.Cloud && typeof window.Cloud.log === 'function') {
                    window.Cloud.log('error', 'Playlist Sync Failed', {
                        playlistId: this.currentPlaylistId
                    });
                }
            }
        } else {
            console.warn('Cloud Sync disabled or not available');
        }

        // Trigger update for player
        Utils.storage.set('playlistUpdateTimestamp', Date.now());
    }

    /**
     * Extract YouTube ID from URL or string
     */
    extractYoutubeId(url) {
        if (!url) return null;
        
        // If it's already an ID (11 chars, alphanumeric + _ -)
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }


    /**
     * Parse YouTube duration to seconds
     */
    parseDuration(duration) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        
        const hours = (parseInt(match[1]) || 0);
        const minutes = (parseInt(match[2]) || 0);
        const seconds = (parseInt(match[3]) || 0);
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    /**
     * Fetch video details from YouTube API
     */
    async fetchVideoDetails(videoId) {
        const apiKey = CONFIG.api && CONFIG.api.youtube && CONFIG.api.youtube.key;
        if (!apiKey) return null;

        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                return {
                    title: item.snippet.title,
                    duration: this.parseDuration(item.contentDetails.duration),
                    thumbnail: item.snippet.thumbnails.default.url
                };
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
        }
        return null;
    }

    /**
     * Load recordings
     */
    loadRecordings() {
        const tbody = document.getElementById('recordingsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading recordings...</td></tr>';

        setTimeout(() => {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Recordings will appear here</td></tr>';
        }, 500);
    }

    /**
     * Load schedule
     */
    loadSchedule() {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading schedule...</td></tr>';

        setTimeout(() => {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Schedule items will appear here</td></tr>';
        }, 500);
    }

    /**
     * Load analytics
     */
    loadAnalytics() {
        // Initialize charts and analytics data
        console.log('Loading analytics...');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        window.adminPanel = new AdminPanel();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}
