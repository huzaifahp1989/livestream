# Islamic Live TV - System Architecture & Documentation

## 1. System Overview

Islamic Live TV is a Progressive Web App (PWA) designed to provide a 24/7 live TV channel experience using YouTube as the Content Delivery Network (CDN) and Firebase Firestore for real-time synchronization and data persistence.

### Key Features
- **Seamless Streaming:** Auto-healing player that skips unavailable videos.
- **Cross-Platform:** Works on Mobile (iOS/Android), Desktop, and Smart TVs via browser.
- **Cloud Sync:** Real-time playlist updates and "Force Play" synchronization across all connected devices.
- **Admin Panel:** Comprehensive dashboard for playlist management, scheduling, and live control.
- **Analytics:** Integrated viewership and error tracking.

## 2. Technical Architecture

### Frontend
- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Player:** YouTube IFrame Player API.
- **State Management:** LocalStorage (for offline fallback) + Firebase Firestore (for live sync).
- **PWA:** Service Worker (`sw.js`) for offline caching and installability.

### Backend (Serverless)
- **Database:** Google Firebase Firestore.
- **Auth:** (Optional) Firebase Auth for Admin Panel protection.
- **Hosting:** Vercel / Netlify / Firebase Hosting.

### File Structure
```
/
├── index.html          # Main Player Interface (Public)
├── admin.html          # Admin Dashboard (Protected)
├── sw.js               # Service Worker (Caching logic)
├── manifest.json       # PWA Manifest
├── css/
│   ├── main.css        # Global styles
│   ├── player.css      # Player specific styles
│   └── responsive.css  # Mobile responsiveness
└── js/
    ├── config.js       # Configuration (API Keys, Defaults)
    ├── main.js         # App initialization
    ├── player.js       # Core Video Player Logic (YouTube Wrapper)
    ├── admin.js        # Admin Panel Logic
    ├── cloud.js        # Firebase Firestore Wrapper
    └── utils.js        # Helper functions
```

## 3. Data Flow & Synchronization

### 3.1. Playlist Sync
1.  **Admin Action:** Admin adds a video in `admin.html`.
2.  **Local Save:** Data saved to `adminPlaylists` in LocalStorage.
3.  **Cloud Push:** `Cloud.set('playlists', ...)` pushes data to Firestore collection `app_data/main`.
4.  **Client Pull:** `player.js` listens to Firestore changes via `Cloud.listen('playlists', ...)`.
5.  **Hot Update:** Player detects change, updates internal queue, and seamlessly transitions if the current video was removed.

### 3.2. Global Force Play (Live Mode)
1.  **Admin Action:** Admin clicks "Play Now".
2.  **Event Broadcast:** `forcePlay` event sent to Firestore with `{ videoId, timestamp, duration }`.
3.  **Client Sync:** All clients receive event.
4.  **Time Alignment:** Clients calculate `serverTime - eventTime` to seek to the exact second, ensuring all viewers see the same frame simultaneously.

## 4. API Specifications

### `Cloud` (js/cloud.js)
Wrapper around Firebase Firestore.

-   `init()`: Initializes Firebase app.
-   `set(collection, data)`: Writes data to `app_data/main` (merged).
-   `listen(key, callback)`: Real-time listener for specific keys in `app_data/main`.
-   `log(level, message, details)`: Pushes logs to `system_logs` collection.
-   `track(action, data)`: Pushes events to `analytics` collection.

### `VideoPlayer` (js/player.js)
Wrapper around YouTube IFrame API.

-   `loadPlaylist(id)`: Loads a specific playlist.
-   `playNext()`: Advances queue (sequential or random).
-   `refreshPlaylistContent(newIds)`: Hot-swaps playlist without reload.
-   `startForcePlayListener()`: Handles global sync events.

## 5. Admin Panel Guidelines

### Access
Navigate to `/admin.html`. (Ensure you have configured protection in production).

### Managing Playlists
-   **Add Video:** Paste YouTube URL or ID. The system auto-fetches title/duration.
-   **Reorder:** Drag and drop support (if implemented) or use Up/Down controls.
-   **Delete:** Remove videos from the list.
-   **Sync:** Changes are auto-saved to Cloud. Look for "Synced to Cloud" toast.

### Scheduling
-   Set specific playlists to play at specific times (Daily, Weekly, Monthly).
-   The player checks schedule every minute (`checkSchedule()`).

## 6. Troubleshooting

### Issue: "Connecting..." stuck on Chrome
-   **Cause:** Service Worker cache mismatch.
-   **Fix:** Hard refresh (Ctrl+F5) or Unregister Service Worker in DevTools > Application.
-   **Prevention:** The system now uses versioned caches (`islamic-tv-v9`).

### Issue: Video not playing / Error 150
-   **Cause:** Video is restricted by owner (no embedding).
-   **System Behavior:** Player waits 500ms and skips to the next video automatically.
-   **Log:** Check Firestore `system_logs` for "Player Error".

### Issue: Changes not appearing on Mobile
-   **Cause:** Mobile sleep mode disconnecting WebSocket.
-   **Fix:** The App now has a `visibilityListener` that forces a sync check immediately upon waking up.

## 7. Deployment
1.  **Configure:** Update `js/config.js` with your Firebase keys and YouTube API Key.
2.  **Build:** No build step required (Vanilla JS).
3.  **Deploy:** Push to Vercel/Netlify.
4.  **Verify:** Check Console for "Firebase Initialized".
