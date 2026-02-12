# 📱 Mayaa Driver Portal - PWA Setup Guide

## ✅ What's Been Implemented

Your driver portal is now a **Progressive Web App (PWA)**! This means drivers can install it on their Android phones and use it like a native app.

### Features Implemented:

1. ✅ **Installable App** - Drivers can add to home screen
2. ✅ **Persistent Login** - Stay logged in for 90 days
3. ✅ **Offline Support** - Works without internet (cached pages)
4. ✅ **App Icons** - Professional app icons generated
5. ✅ **Service Worker** - Background sync and caching
6. ✅ **Install Prompt** - Automatic prompt to install
7. ✅ **App Shortcuts** - Quick access to Add Entry and Dashboard

---

## 🚀 How Drivers Install the App

### Method 1: Chrome Browser (Recommended)

1. **Open the website** in Chrome on Android:
   ```
   https://your-domain.com/driver/dashboard
   ```

2. **Login** with driver credentials

3. **Install prompt will appear** after 3 seconds:
   - Shows benefits: "Stay logged in permanently", "Works offline", "Home screen access"
   - Click "Install App"

4. **Alternative manual install**:
   - Tap the **3 dots menu** (⋮) in Chrome
   - Select **"Add to Home screen"** or **"Install app"**
   - Tap "Install"

5. **App is now on home screen** 🎉
   - Icon appears like any other app
   - Opens in full-screen mode
   - No browser UI visible

### Method 2: Edge Browser

1. Open in Microsoft Edge
2. Tap the menu (⋯)
3. Select "Add to phone"
4. Confirm installation

---

## 📱 Driver Experience After Installation

### Login Once, Stay Logged In
- Drivers login **once**
- Session stays active for **90 days**
- No need to login daily
- Just tap the app icon and start working

### Quick Access
- **Home Screen Icon** - One tap access
- **App Shortcuts** - Long press icon shows:
  - "Add Entry" - Go directly to entry form
  - "Dashboard" - Go to home screen

### Works Offline
- Previously loaded pages work without internet
- Can view dashboard even offline
- Entries sync automatically when online

---

## 🔧 Technical Details

### Files Created/Modified

**PWA Configuration:**
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `public/icons/` - App icons (8 sizes)

**Components:**
- `src/components/driver/install-prompt.tsx` - Install prompt UI
- `src/components/driver/pwa-handler.tsx` - Service worker handler

**Configuration Updates:**
- `src/app/layout.tsx` - Added PWA meta tags
- `src/app/driver/layout.tsx` - Added PWA components
- `src/lib/auth.ts` - Extended session to 90 days

### Session Management

```typescript
session: {
  strategy: 'jwt',
  maxAge: 90 * 24 * 60 * 60, // 90 days
  updateAge: 24 * 60 * 60, // Refresh every 24 hours
}
```

### Caching Strategy

- **Network First** for API calls - Always try to get fresh data
- **Cache Fallback** - Use cached data when offline
- **Auto-sync** - Syncs when connection restored

---

## 🎨 Customizing Icons

### Using Current Icons
The generated SVG icons work perfectly for Android PWA.

### Replacing with Custom Icons (Optional)

#### Option 1: Use HTML Generator
1. Open in browser: `fleet-management/public/icons/generate-icons.html`
2. Icons auto-generate on page load
3. Click "Download" under each icon
4. Save as PNG files in `public/icons/`
5. Update `manifest.json` to use `.png` instead of `.svg`

#### Option 2: Use Your Logo
1. Get your logo in high resolution (512x512 minimum)
2. Generate all sizes using online tool: https://realfavicongenerator.net/
3. Download and replace files in `public/icons/`

---

## 📊 Admin Panel Integration

**Everything works automatically!** ✅

```
Driver App (PWA)
    ↓
Same API endpoints (/api/driver/...)
    ↓
Same Database
    ↓
Admin Dashboard
```

When driver makes an entry in the app:
1. Entry is saved to database
2. Admin sees it immediately
3. No extra configuration needed

---

## 🧪 Testing the PWA

### Development Testing

1. **Start the dev server:**
   ```bash
   cd fleet-management
   npm run dev
   ```

2. **Test on Android:**
   - Find your local IP: `ipconfig` (look for IPv4)
   - Access from phone: `http://192.168.x.x:3000/driver/dashboard`
   - Login and test install

### Production Testing

1. **Deploy to production** (Vercel, Netlify, etc.)
2. **HTTPS required** - PWA only works on HTTPS
3. Test installation on real device

---

## 🐛 Troubleshooting

### Install Button Not Showing

**Cause:** PWA requirements not met
**Solution:**
- Ensure you're on HTTPS (not HTTP)
- Check browser console for errors
- Clear browser cache and reload

### Session Expires Too Soon

**Cause:** Browser clearing data
**Solution:**
- Tell drivers to NOT clear browser data
- In phone settings > Apps > Chrome > Storage
- Ensure "Clear on exit" is OFF

### App Not Working Offline

**Cause:** Service worker not registered
**Solution:**
- Check browser console: `navigator.serviceWorker.ready`
- Reload the page once after login
- Visit pages you want available offline

### Icons Not Showing

**Cause:** Icon files not loaded
**Solution:**
- Check if files exist in `public/icons/`
- Run: `node fleet-management/scripts/generate-pwa-icons.js`
- Verify manifest.json paths

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Test PWA on real Android device
- [ ] Verify HTTPS is enabled
- [ ] Test install functionality
- [ ] Check offline mode works
- [ ] Verify session persistence (leave app, return next day)
- [ ] Test entry creation in PWA
- [ ] Confirm entries show in admin panel
- [ ] Check app icons display correctly
- [ ] Test shortcuts (long-press icon)

---

## 📱 Alternative: Building APK (Optional)

If you still want a real APK file instead of PWA:

### Using Capacitor

1. **Install Capacitor:**
   ```bash
   cd fleet-management
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Mayaa Driver" "com.mayaa.driver"
   ```

2. **Add Android platform:**
   ```bash
   npm run build
   npx cap add android
   npx cap sync
   ```

3. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Build APK:**
   - In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

**Note:** PWA is recommended as it's simpler and updates automatically!

---

## 💡 Best Practices for Drivers

**Share these tips with drivers:**

1. **First Time Setup:**
   - Install the app using Chrome
   - Login once
   - Bookmark frequently used pages

2. **Daily Usage:**
   - Just tap the app icon
   - No need to login again
   - Make entries as usual

3. **If Session Expires:**
   - Simply login again
   - App will remember for 90 more days

4. **Keep App Updated:**
   - PWA updates automatically
   - Just refresh if you see issues
   - No manual updates needed

---

## 📞 Support

If you have any issues:
1. Check browser console for errors (F12)
2. Verify service worker is registered
3. Test in incognito mode to rule out cache issues
4. Ensure HTTPS is working in production

---

## 🎉 Summary

You now have a fully functional PWA! Drivers can:
- ✅ Install app on home screen
- ✅ Stay logged in for 90 days
- ✅ Use offline (cached pages)
- ✅ Make entries that sync to admin
- ✅ Quick access via app shortcuts

**No app store needed, no APK distribution needed!** 🚀

