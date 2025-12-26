# Firebase Setup Guide

## 1. Firestore Database Setup

The "Permission Denied" error occurs because your Firebase Firestore Security Rules are blocking access. Since this application manages authentication locally (via `config.js` admin credentials) and not via Firebase Auth, you need to configure your rules to allow read/write access to the `app_data` collection.

### **Step-by-Step Fix:**

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**livestream-d9e34**).
3.  Navigate to **Firestore Database** > **Rules**.
4.  Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow public read/write access to the app_data collection
    // WARNING: This allows anyone with your API key to write to this specific document.
    // For a production app, you should implement Firebase Authentication.
    match /app_data/{document=**} {
      allow read, write: if true;
    }
    
    // Default deny for everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5.  Click **Publish**.

## 2. Verify Connection

1.  Reload your Admin Panel (`/admin.html`).
2.  The status indicator in the sidebar should turn **Green** and say "Cloud Connected".

## 3. (Optional) Production Security

For a production environment, you should integrate Firebase Authentication:

1.  Enable **Email/Password** sign-in in Firebase Console > Authentication.
2.  Update the code to use `firebase.auth().signInWithEmailAndPassword(...)`.
3.  Update rules to: `allow read, write: if request.auth != null;`
