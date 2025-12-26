# 🚀 Quick Launch Guide - Islamic Live TV Channel

## Get Started in 5 Minutes!

### Step 1: Open the Project
```bash
# Navigate to project folder
cd c:\Users\huzai\Livetvstream
```

### Step 2: Launch Local Server
**Option A: VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Site opens at `http://localhost:5500`

**Option B: Python Server**
```bash
# Python 3
python -m http.server 8000

# Access at http://localhost:8000
```

**Option C: Node.js Server**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000

# Access at http://localhost:8000
```

### Step 3: Test the Website
✅ Open in browser: `http://localhost:5500`
✅ Main features to test:
- Home page with video player
- Recordings page
- Schedule page
- Admin panel (`/admin.html`)

### Step 4: Access Admin Panel
1. Navigate to `http://localhost:5500/admin.html`
2. Login credentials:
   - Username: `admin`
   - Password: `admin123`
3. ⚠️ **IMPORTANT**: Change these before deployment!

### Step 5: Customize Your Channel

#### Update Config ([js/config.js](js/config.js))
```javascript
const CONFIG = {
    // Your channel name
    siteName: 'Your Islamic TV Channel',
    
    // Replace with your YouTube video IDs
    defaultPlaylist: [
        'YOUR_VIDEO_ID_1',
        'YOUR_VIDEO_ID_2',
        'YOUR_VIDEO_ID_3',
        // Add more...
    ],
    
    // Change admin credentials
    adminCredentials: {
        username: 'your_username',
        password: 'your_secure_password'
    }
};
```

#### Add Your Logo
1. Create/download your logo (200x200px PNG)
2. Save to `assets/images/logo.png`
3. Update references in HTML files

#### Update Content Data
- **Recordings**: Edit [data/recordings.json](data/recordings.json)
- **Schedule**: Edit [data/schedule.json](data/schedule.json)
- **Playlist**: Edit [data/playlist.json](data/playlist.json)

---

## 📱 Test on Mobile

### Find Your Local IP
**Windows:**
```bash
ipconfig
# Look for "IPv4 Address"
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" address
```

### Access from Mobile
1. Connect phone to same WiFi network
2. Open browser on phone
3. Go to `http://YOUR_IP:5500`
4. Example: `http://192.168.1.100:5500`

---

## 🌐 Deploy to Production

### Option 1: Netlify (Easiest)
1. Create account at https://netlify.com
2. Drag project folder to Netlify dashboard
3. Site is live in seconds!
4. Free HTTPS and custom domain

### Option 2: GitHub Pages
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin YOUR_GITHUB_REPO
git push -u origin main

# Enable GitHub Pages in repository settings
```

### Option 3: Traditional Web Hosting
1. Get hosting (Bluehost, HostGator, etc.)
2. Access cPanel or FTP
3. Upload all files to `public_html` folder
4. Visit your domain

### Option 4: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

---

## ✅ Pre-Deployment Checklist

### Security
- [ ] Change admin username and password in [js/config.js](js/config.js)
- [ ] Remove demo data and test content
- [ ] Enable HTTPS/SSL (required for PWA)
- [ ] Update CORS settings if using external APIs

### Content
- [ ] Replace YouTube video IDs with actual content
- [ ] Add real recordings data
- [ ] Update program schedule
- [ ] Add channel logo and favicon
- [ ] Update meta tags and SEO information

### Configuration
- [ ] Update site name and tagline
- [ ] Configure prayer times (manual or API)
- [ ] Set up analytics tracking
- [ ] Update social media links
- [ ] Configure donation links (if applicable)

### Testing
- [ ] Test video playback
- [ ] Test on mobile devices
- [ ] Test admin panel functionality
- [ ] Test PWA installation
- [ ] Test offline mode
- [ ] Verify responsive design
- [ ] Check page load speed
- [ ] Test all navigation links

### PWA Setup
- [ ] Update [manifest.json](manifest.json) with production URL
- [ ] Update [sw.js](sw.js) cache URLs
- [ ] Generate and add all PWA icons
- [ ] Test "Add to Home Screen" functionality

---

## 🎯 Quick Feature Reference

### Main Pages
- **Home** ([index.html](index.html)): Live 24/7 streaming player
- **Recordings** ([recordings.html](recordings.html)): Archive of past programs
- **Schedule** ([schedule.html](schedule.html)): Weekly program guide
- **Admin** ([admin.html](admin.html)): Control panel (password protected)

### Key Features
✅ Auto-playing YouTube playlist  
✅ Manual live stream switching  
✅ Search and filter recordings  
✅ Weekly/daily schedule views  
✅ Prayer time ticker  
✅ Emergency broadcast system  
✅ Analytics dashboard  
✅ PWA with offline support  
✅ Mobile WebView compatible  

---

## 💡 Pro Tips

### Performance
- Compress images before uploading (use TinyPNG)
- Enable caching in [sw.js](sw.js) (already configured)
- Use CDN for better global performance
- Minimize HTTP requests

### SEO
- Update meta descriptions in each HTML file
- Add structured data for videos
- Submit sitemap to Google Search Console
- Optimize page titles and headings

### Monitoring
- Set up Google Analytics or similar
- Monitor video playback errors
- Track user engagement metrics
- Check mobile device compatibility

### Content Strategy
- Rotate playlist monthly
- Add new recordings regularly
- Update schedule in advance
- Engage with viewers via social media

---

## 🆘 Troubleshooting

### Video Not Playing
- Check YouTube video IDs are correct and public
- Verify iframe API is loaded
- Check browser console for errors
- Ensure autoplay is allowed (some browsers block it)

### Admin Login Not Working
- Verify credentials in [js/config.js](js/config.js)
- Clear browser cache and cookies
- Check browser console for JavaScript errors

### PWA Not Installing
- Must use HTTPS in production (localhost works for testing)
- Check [manifest.json](manifest.json) has correct paths
- Verify service worker registration
- Icons must be in correct sizes

### Mobile Issues
- Test viewport meta tags
- Verify touch events work
- Check video playback on iOS/Android
- Test in WebView if building app

---

## 📚 Additional Resources

- **YouTube IFrame API**: https://developers.google.com/youtube/iframe_api_reference
- **PWA Guide**: https://web.dev/progressive-web-apps/
- **Prayer Times API**: https://aladhan.com/prayer-times-api
- **Islamic Resources**: https://www.islamicity.org/

---

## 🎉 You're Ready!

Your Islamic Live TV Channel is complete and ready to launch. Follow the steps above to customize and deploy.

**Need help?** Check the full [README.md](README.md) or [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed information.

**May Allah accept this effort and make it beneficial for the Muslim community! 🤲**
