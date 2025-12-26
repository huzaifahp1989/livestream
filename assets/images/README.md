# Islamic Live TV Channel - Assets

This directory contains all image assets for the website.

## Required Images

### Logo
- **File**: `logo.png`
- **Size**: 200x200 pixels (minimum)
- **Format**: PNG with transparent background
- **Usage**: Header, footer, admin panel, PWA icons
- **Description**: Channel logo/branding

### Favicon
- **File**: `favicon.ico`
- **Size**: 32x32 pixels
- **Format**: ICO format
- **Usage**: Browser tab icon
- **Description**: Small icon for browser tabs

### PWA Icons (manifest.json)
Create the following icon sizes in PNG format with transparent background:

1. `icon-72x72.png` - 72x72 pixels
2. `icon-96x96.png` - 96x96 pixels
3. `icon-128x128.png` - 128x128 pixels
4. `icon-144x144.png` - 144x144 pixels
5. `icon-152x152.png` - 152x152 pixels
6. `icon-192x192.png` - 192x192 pixels
7. `icon-384x384.png` - 384x384 pixels
8. `icon-512x512.png` - 512x512 pixels

### PWA Screenshots (manifest.json)
1. `screenshot-mobile.png` - 375x667 pixels (iPhone size)
2. `screenshot-desktop.png` - 1920x1080 pixels

### Placeholder Images
- `video-placeholder.jpg` - 1280x720 pixels
- `program-placeholder.jpg` - 640x360 pixels
- `recording-thumbnail.jpg` - 480x270 pixels

## How to Add Images

1. Create/design your logo and branding images
2. Generate PWA icons in all required sizes (use tools like https://realfavicongenerator.net/)
3. Take screenshots of the website for PWA manifest
4. Replace the placeholder image URLs in the following files:
   - `manifest.json` (icon paths)
   - `index.html`, `recordings.html`, `schedule.html`, `admin.html` (logo paths)
   - `data/recordings.json` (thumbnail URLs - currently using YouTube thumbnails)

## Image Optimization Tips

- Use PNG for logos and icons (supports transparency)
- Use JPG for photos and screenshots (smaller file size)
- Compress images using tools like TinyPNG or ImageOptim
- Use WebP format for modern browsers (provide JPG/PNG fallbacks)
- Keep file sizes under 200KB for faster loading

## Current Status

⚠️ **Placeholder Status**: Currently using placeholder URLs and YouTube thumbnail URLs. Replace with actual channel branding and images before deployment.

## Tools & Resources

- **Icon Generator**: https://realfavicongenerator.net/
- **Image Compression**: https://tinypng.com/
- **Logo Design**: Canva, Figma, Adobe Illustrator
- **Free Islamic Graphics**: https://www.freepik.com/ (search "islamic")
