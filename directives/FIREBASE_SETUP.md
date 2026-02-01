# Firebase Setup Guide for Inasmuch

This guide walks you through setting up Firebase for your Inasmuch supply tracker.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `inasmuch` (or your preferred name)
4. Disable Google Analytics (optional, not needed)
5. Click **"Create project"**
6. Wait for the project to be created, then click **"Continue"**

---

## Step 2: Add a Web App

1. On the project overview page, click the **Web icon** (`</>`) to add a web app
2. Enter a nickname: `inasmuch-web`
3. ✅ Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. **Copy the Firebase config object** - you'll need this!

It looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Click **"Continue to console"**

---

## Step 3: Set Up Firestore Database

1. In the left sidebar, click **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select a location closest to you (e.g., `us-central` or `europe-west`)
5. Click **"Enable"**

---

## Step 4: Add Your Config to the App

1. Open `src/firebase/config.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 5: Secure Your Database (Production)

For production, update Firestore Security Rules in the Firebase Console:

1. Go to **Firestore Database → Rules**
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for all authenticated users or from your domain
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
    
    // For production, consider more restrictive rules:
    // match /residents/{doc} { allow read, write: if true; }
    // match /items/{doc} { allow read, write: if true; }
    // match /logs/{doc} { allow read, write: if true; }
  }
}
```

3. Click **"Publish"**

> ⚠️ **Note**: For a household app, simple rules are fine. For public apps, implement proper authentication.

---

## Step 6: Run the App

```bash
cd inasmuch
npm install
npm run dev
```

Open http://localhost:5173 in your browser!

---

## Free Hosting Options

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"**
4. Import your `inasmuch` repository
5. Framework: **Vite**
6. Click **"Deploy"**

Your app will be live at `https://your-project.vercel.app`

### Option B: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click **"Add new site" → "Import an existing project"**
4. Choose GitHub and select your repo
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click **"Deploy"**

### Option C: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Choose your project
# Public directory: dist
# Single-page app: Yes
# Overwrite index.html: No

npm run build
firebase deploy
```

---

## Troubleshooting

### "Firebase not configured" message
- Make sure you've replaced the placeholder values in `src/firebase/config.js`
- Check that `apiKey` is not `"YOUR_API_KEY"`

### Data not syncing
- Check Firebase Console → Firestore → Data to see if documents exist
- Verify Firestore rules allow read/write
- Check browser console for errors

### "Permission denied" errors
- Go to Firestore → Rules and ensure test mode is enabled
- Update rules to allow access

---

## Firebase Free Tier Limits

- **Firestore**: 1GB storage, 20K writes/day, 50K reads/day
- **Hosting**: 10GB storage, 360MB/day bandwidth
- **Plenty for a household app!**
