# Mobile Responsiveness

- [x] Create Implementation Plan <!-- id: 16 -->
- [x] HTML: Update Meta & Add Mobile Controls <!-- id: 17 -->
- [x] CSS: Responsive Layouts & Bottom Sheet <!-- id: 18 -->
- [x] JS: Touch Events (Pan, Select, Pinch) <!-- id: 19 -->
- [x] Verify on Mobile <!-- id: 20 -->

# Scalability & Performance ⭐️
- [x] **Backend Chunking API**: Create `/api/chunks` or `/api/pixels?bounds=...` to load only visible area.
- [x] **Frontend Chunk Manager**: Implement `ChunkManager` to dynamically load/unload pixels.
- [x] **Database Optimization**: Enable SQLite WAL mode & Add Indexes (x, y).
- [ ] **(Optional) DB Migration**: Guide user to install PostgreSQL if SQLite limits are reached.

# Advanced Rendering Optimization 🚀
- [x] **Offscreen Canvas Caching**: Pre-render chunks to images to avoid `fillRect` loops.
- [x] **Cluster Logic Separation**: Move `recalculateClusters` out of render loop; only run on data updates.
- [x] **Text LOD**: Hide text at low zoom; optimize style changes.
- [x] **Text LOD**: Hide text at low zoom; optimize style changes.
- [x] **Strict Culling**: Prevent rendering logic for invisible chunks.
- [x] **Debugging**: Fix Missing Content & Rendering Issues (Resolved blank canvas, transparent pixels, and data type errors).
- [x] **Feature: Notice Modal**
  - [x] Add Notice button to `index.html`.
  - [x] Create Notice modal structure in `index.html`.
  - [x] Implement toggle logic in `main.js`.
- [x] **Feature: Dynamic Pricing**
  - [x] Implement `getPixelPrice` in `server.js` and `main.js`.
  - [x] Update frontend to calculate total price during selection.
  - [x] Update backend to validate price during purchase (if applicable) or ensure correct amount is passed.
  - [x] Draw visual guide for high-value zones on canvas.
- [ ] **Deployment: Fix Google OAuth**
  - [ ] Update `server.js` to strictly checking `callbackURL` from env.
  - [ ] Document Redirect URIs for user.
- [ ] **Mobile UX: Touch Sensitivity**
  - [x] Reduce Long Press Duration to 0.15s.
- [x] **UI: Sort Idol List**
  - [x] Sort dropdown alphabetically (ABC).
