# Islamic Live TV Channel - Copilot Instructions

## Project Overview
24/7 Islamic Live TV Channel website with continuous streaming, admin controls, and mobile WebView compatibility.

## Key Features
- Continuous 24/7 YouTube playlist streaming with auto-loop
- Manual live mode switching (RTMP, YouTube Live, Vimeo)
- Recordings/programs archive with categories
- Program schedule with timezone support
- Secure admin panel with authentication
- Mobile responsive and WebView compatible
- Dark elegant theme UI
- PWA support with offline capabilities

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Video Player: Custom player with YouTube IFrame API
- Authentication: JWT-based
- Storage: LocalStorage for client-side, JSON for backend data
- PWA: Service Worker + Manifest

## Development Guidelines
- Keep code lightweight and optimized for mobile
- Ensure WebView compatibility (no external dependencies that break in WebView)
- Use modern ES6+ features with fallbacks
- Implement lazy loading for images and videos
- Use CSS Grid and Flexbox for layouts
- Follow mobile-first responsive design
- Minimize external dependencies
- Optimize for low-bandwidth connections

## Code Standards
- Use semantic HTML5 elements
- BEM methodology for CSS class naming
- Modular JavaScript with clear separation of concerns
- Comprehensive error handling
- Security best practices (XSS prevention, CSRF protection)
- GDPR compliant cookie handling
- SEO optimized meta tags and structured data

## File Structure
- `/index.html` - Home page with live player
- `/recordings.html` - Programs archive
- `/schedule.html` - Program schedule
- `/admin.html` - Admin control panel
- `/css/` - Stylesheets
- `/js/` - JavaScript modules
- `/assets/` - Images, icons, media
- `/data/` - JSON data files
- `manifest.json` - PWA manifest
- `sw.js` - Service Worker

## Status
Project in development - scaffolding phase complete
