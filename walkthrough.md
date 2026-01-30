# Walkthrough - UI & Pricing Update

## Changes
### 1. Dynamic Pricing Zones
- [x] Defined 3 pricing zones based on distance from center.
    - **High Value (2,000 KRW)**: Center ~4,000px
    - **Mid Value (1,000 KRW)**: Surrounding ~24,000px
    - **Standard (500 KRW)**: Rest of the world
- [x] Visualized zones with faint colored overlays on the canvas.

### 2. Deployment Fixes
- [x] Updated `server.js` to strictly use `process.env.GOOGLE_CALLBACK_URL` for production compatibility (Render.com).

### 3. Mobile UX Improvements
- [x] Reduced "Long Press" duration from ~500ms to **150ms** for snappier dragging/selection on mobile devices.

### 4. UI Polish
- [x] **Sorted Idol List**: The dropdown menu is now automatically sorted from A-Z.
- [x] Removed hardcoded options from `index.html`.

## Verification Results
### Automated Tests
- `git status` confirmed files were updated.
# Walkthrough - UI & Pricing Update

## Changes
### 1. Dynamic Pricing Zones
- [x] Defined 3 pricing zones based on distance from center.
    - **High Value (2,000 KRW)**: Center ~4,000px
    - **Mid Value (1,000 KRW)**: Surrounding ~24,000px
    - **Standard (500 KRW)**: Rest of the world
- [x] Visualized zones with faint colored overlays on the canvas.

### 2. Deployment Fixes
- [x] Updated `server.js` to strictly use `process.env.GOOGLE_CALLBACK_URL` for production compatibility (Render.com).

### 3. Mobile UX Improvements
- [x] Reduced "Long Press" duration from ~500ms to **150ms** for snappier dragging/selection on mobile devices.

### 4. UI Polish
- [x] **Sorted Idol List**: The dropdown menu is now automatically sorted from A-Z.
- [x] Removed hardcoded options from `index.html`.

### 6. Mobile UX Refinements 📱
- **Multi-Touch Safety**: implemented smart detection to ignore pixel clicks when using 2+ fingers (pinch/zoom). Buying pixels now requires a deliberate single-finger tap or long-press.
- **Enhanced Zoom**: Significantly increased the zoom-out capability (min scale `0.0005`), allowing users to see the entire map even when UI elements cover part of the screen.

### 7. Bug Fixes 🛠️
- [x] **Minimap Accuracy**: Adjusted the minimap indicator logic to correctly calculate position based on dynamic container size (fixing offset issues on mobile).
- [x] **Mobile Layout**: Fixed overlap between Auth Header and Ranking Board by adjusting vertical spacing.
- [x] **Text Visibility**: Renamed "Fandom Ranking" to two lines to save horizontal space on small screens.
- [x] **Notice Modal**: Added FAQ tab with localized content and optimized tab styling for mobile.
- [x] **Footer**: Added contact email `kopick@fandompixer.com` to the site footer.
- [x] **Performance**: Implemented Offscreen Canvas optimization (cached chunks), integer coordinate rendering for mobile, and efficient data fetching with AbortController and browser caching.
- [x] **Data Loading**: Switched to **Binary Protocol** (Buffers) for pixel data to reduce payload size, and implemented **LOD (Level of Detail)** to show a server-generated low-res map when zoomed out, preventing unnecessary network requests.

### 8. Configuration & Fixes

### Manual Verification
- User should verify mobile drag feel (it should be much faster).
- User should check the dropdown list is sorted alphabetically.

### 6. Configuration & Fixes
- [x] **Payment Integration**: Configured Toss Payments (Korea) and PayPal (Global).
- [x] **PayPal Fix**: Resolved "Helper Error" by strictly enforcing Number type for USD amounts and adjusting parameters.
- [x] **Dynamic Pricing**: Verified logic (2000/1000/500 KRW) based on radial distance.

### 5. Internationalization (i18n)
- [x] **Multi-language Support**: Added full support for Korean (KO) and English (EN).
- [x] **Language Switcher**: Added a toggle button in the Status Bar.
- [x] **Auto-Detection**: Automatically detects browser language on first visit.
- [x] **Dynamic Localization**: Applied translations to Alerts, Share Cards, and Real-time Ticker.
