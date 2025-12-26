# 🕌 Islamic Live TV - 24/7 Streaming Platform

A professional, feature-rich Islamic TV channel website with 24/7 continuous streaming, live broadcasting capabilities, recordings archive, program scheduling, and admin control panel. Fully responsive and optimized for mobile apps (WebView compatible).

## ✨ Features

### 🎥 Core Features
- **24/7 Continuous Streaming** - Auto-looping YouTube playlist that never stops
- **Manual Live Mode** - Switch to live streaming (RTMP, YouTube Live, Vimeo) anytime
- **Auto-Fallback System** - Automatically switches to playlist if live stream fails
- **Smart Player** - YouTube IFrame API integration with error handling and reconnection
- **Recordings Archive** - Organized library with categories (Lectures, Kids, Documentaries, Events)
- **Program Schedule** - Weekly/Daily view with timezone support
- **Admin Control Panel** - Secure dashboard for content management

### 📱 Mobile & Performance
- **Fully Responsive** - Mobile-first design
- **WebView Compatible** - Works perfectly in Android/iOS apps
- **PWA Support** - Installable as native app
- **Offline Support** - Service Worker caching
- **Lazy Loading** - Optimized image loading
- **Low Bandwidth Mode** - Adaptive streaming

### 🎨 UI/UX Features
- **Dark Elegant Theme** - Professional TV network style
- **Live Status Badge** - Real-time status indicator
- **Lower-Third Banner** - Professional on-screen graphics
- **Prayer Time Ticker** - Automatic prayer time display
- **Emergency Broadcast** - Override system for urgent announcements
- **Coming Soon Banner** - Highlight upcoming programs
- **Donation Bar** - Support channel integration
- **Social Sharing** - Easy content sharing

### 🔐 Security & Admin
- **Secure Admin Login** - Protected dashboard access
- **JWT-based Authentication** - Session management
- **Role-based Access** - Admin permissions
- **XSS Prevention** - Input sanitization
- **CSRF Protection** - Security tokens

### 📊 Analytics
- **Real-time Viewer Count** - Live audience metrics
- **Watch Time Tracking** - Total hours watched
- **Popular Content** - Most viewed programs
- **Activity Log** - Admin action tracking

## 🚀 Quick Start

### Prerequisites
- Web server (Apache, Nginx, or any HTTP server)
- Modern web browser
- YouTube API access (for video streaming)

### Installation

1. **Clone or download the project**
```bash
git clone <repository-url>
cd Livetvstream
```

2. **Configure YouTube playlist**
   - Edit `js/config.js`
   - Add your YouTube video IDs to the `defaultPlaylist` array
   ```javascript
   defaultPlaylist: [
       'YOUR_VIDEO_ID_1',
       'YOUR_VIDEO_ID_2',
       // Add more video IDs
   ]
   ```

3. **Update site information**
   - Edit `js/config.js`
   - Update site name, description, and contact info

4. **Configure admin credentials**
   - **IMPORTANT**: Change default admin password in `js/config.js`
   ```javascript
   admin: {
       defaultUsername: 'admin',
       defaultPassword: 'YOUR_SECURE_PASSWORD' // CHANGE THIS!
   }
   ```

5. **Add logo and icons**
   - Place your logo at `assets/images/logo.png`
   - Add PWA icons (72x72 to 512x512) in `assets/images/`
   - Update icon references in `manifest.json`

6. **Deploy to web server**
   - Upload all files to your web hosting
   - Ensure `manifest.json` and `sw.js` are in the root directory
   - Set proper MIME types if needed

## 📁 Project Structure

```
Livetvstream/
├── index.html              # Home page with live player
├── recordings.html         # Programs archive page
├── schedule.html          # Program schedule page
├── admin.html             # Admin control panel
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
│
├── css/
│   ├── main.css          # Global styles & variables
│   ├── player.css        # Video player styles
│   ├── recordings.css    # Recordings page styles
│   ├── schedule.css      # Schedule page styles (to be created)
│   ├── admin.css         # Admin panel styles (to be created)
│   └── responsive.css    # Mobile responsive styles
│
├── js/
│   ├── config.js         # Configuration settings
│   ├── utils.js          # Utility functions
│   ├── player.js         # Video player manager
│   ├── main.js           # Main application logic
│   ├── pwa.js            # PWA functionality
│   ├── analytics.js      # Analytics tracking (to be created)
│   ├── recordings.js     # Recordings page logic (to be created)
│   ├── schedule.js       # Schedule page logic (to be created)
│   └── admin.js          # Admin panel logic (to be created)
│
├── data/
│   ├── recordings.json   # Recordings database
│   ├── schedule.json     # Program schedule
│   └── playlist.json     # Current playlist
│
└── assets/
    └── images/
        ├── logo.png
        ├── favicon.png
        └── icon-*.png    # PWA icons
```

## ⚙️ Configuration

### Video Player Settings
Edit `js/config.js` to customize player behavior:
```javascript
player: {
    autoplay: true,
    loop: true,
    controls: 1,
    quality: 'hd720'
}
```

### Stream Settings
```javascript
stream: {
    autoFallback: true,     // Auto switch to playlist on error
    lowLatency: false,      // Enable low-latency mode
    reconnectAttempts: 3    // Number of reconnection tries
}
```

### Prayer Times
```javascript
prayerTimes: {
    enabled: true,
    location: {
        city: 'Mecca',
        latitude: 21.4225,
        longitude: 39.8262
    }
}
```

## 🎮 Admin Panel

### Access
- URL: `admin.html`
- Default credentials:
  - Username: `admin`
  - Password: `admin123` (⚠️ CHANGE THIS!)

### Features
- **Dashboard**: View real-time analytics
- **Stream Control**: Toggle between auto/live mode
- **Playlist Manager**: Add/remove/reorder videos
- **Recordings Manager**: Upload and organize recordings
- **Schedule Manager**: Create and manage program schedule
- **Analytics**: View detailed statistics
- **Settings**: Configure site-wide options

### Live Streaming Setup

1. Go to Admin Panel → Live Stream Control
2. Select source type (YouTube Live, RTMP, Vimeo, Custom)
3. Enter stream URL or ID
4. Click "Start Live Stream"
5. Monitor status and switch back to auto mode when done

## 📱 Mobile App Integration

### Android WebView
```java
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();
webSettings.setJavaScriptEnabled(true);
webSettings.setDomStorageEnabled(true);
webSettings.setMediaPlaybackRequiresUserGesture(false);
webView.loadUrl("https://your-domain.com");
```

### iOS WebView (WKWebView)
```swift
let configuration = WKWebViewConfiguration()
configuration.allowsInlineMediaPlayback = true
configuration.mediaTypesRequiringUserActionForPlayback = []
let webView = WKWebView(frame: .zero, configuration: configuration)
webView.load(URLRequest(url: URL(string: "https://your-domain.com")!))
```

## 🔧 Customization

### Changing Colors
Edit CSS variables in `css/main.css`:
```css
:root {
    --color-primary: #16213e;
    --color-accent: #e94560;
    /* Customize other colors */
}
```

### Adding Custom Pages
1. Create HTML file in root directory
2. Include necessary CSS and JS files
3. Add navigation link in header
4. Update Service Worker cache list

### Custom Video Sources
To add non-YouTube sources, modify `js/player.js`:
- Implement custom player for RTMP/HLS streams
- Use video.js or similar library for broader format support

## 🚀 Deployment

### Hosting Recommendations
- **Shared Hosting**: Compatible with any web host (HostGator, Bluehost, etc.)
- **VPS/Cloud**: Recommended for better performance (DigitalOcean, AWS, etc.)
- **CDN**: Use Cloudflare for caching and DDoS protection
- **SSL**: Always use HTTPS for PWA features

### Production Checklist
- [ ] Change admin credentials
- [ ] Add real YouTube video IDs
- [ ] Upload logo and icons
- [ ] Configure prayer times location
- [ ] Set up analytics tracking
- [ ] Enable HTTPS/SSL
- [ ] Test on mobile devices
- [ ] Test in WebView apps
- [ ] Optimize images
- [ ] Set up backup system

## 🔐 Security Best Practices

1. **Change default admin password immediately**
2. **Use HTTPS only** - Required for PWA and service workers
3. **Implement backend authentication** - Don't rely on client-side only
4. **Sanitize all user inputs** - Prevent XSS attacks
5. **Use CSRF tokens** - Protect admin actions
6. **Regular backups** - Protect your content
7. **Keep dependencies updated** - Security patches

## 📊 Analytics Integration

To integrate Google Analytics or similar:
```javascript
// Add to js/analytics.js
gtag('event', 'video_play', {
    'event_category': 'Video',
    'event_label': videoTitle
});
```

## 🐛 Troubleshooting

### Player not loading
- Check YouTube video IDs are valid and public
- Verify YouTube IFrame API is loading
- Check browser console for errors

### PWA not installing
- Ensure HTTPS is enabled
- Verify manifest.json is accessible
- Check Service Worker registration

### Mobile not playing
- Enable JavaScript in WebView
- Allow media autoplay
- Check network connectivity

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Email: info@islamiclivetv.com
- Documentation: [Link to docs]

## 📄 License

This project is provided as-is for educational and commercial use. Modify as needed for your requirements.

## 🙏 Credits

- YouTube IFrame API
- Icons from Material Design
- Font system defaults for performance

## 🔄 Updates & Roadmap

### Coming Soon
- [ ] Backend API integration
- [ ] Real-time chat feature
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Video upload functionality
- [ ] User authentication system
- [ ] Comment system
- [ ] Live chat moderation

---

**Made with ❤️ for the Islamic community**

*May this platform help spread knowledge and strengthen faith worldwide*
