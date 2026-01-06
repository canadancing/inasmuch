# Inasmuch - Shared House Supply Tracker

A mobile-first web app for tracking household supply usage across residents. Built with React, Vite, Tailwind CSS, and Firebase.

![Inasmuch](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📱 **Mobile-First Design** - Native app feel with large touch targets
- 👥 **Multi-Resident** - Select who's logging supply usage
- 📦 **Visual Item Grid** - Icons + names for quick selection
- ➕➖ **Quantity Control** - Easy +/- stepper
- 📊 **History Log** - Track all used/restocked activity
- 🔐 **Admin Panel** - Manage residents, items, and restock
- 🌓 **Dark Mode** - Toggle with preference saved
- ⚡ **Real-Time Sync** - Changes appear instantly on all devices
- 🆓 **Free Hosting** - Deploy to Vercel, Netlify, or Firebase

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Setup Firebase

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── views/            # Page-level views
├── hooks/            # Custom React hooks
├── firebase/         # Firebase configuration
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## Default Admin PIN

The default admin PIN is `1234`. Change it in `src/views/AdminView.jsx`.

## License

MIT
