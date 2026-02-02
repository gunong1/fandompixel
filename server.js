require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const session = require('express-session');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();
app.set('trust proxy', 1);
const compression = require('compression');
app.use(compression());
app.use('/locales', express.static(path.join(__dirname, 'locales')));
app.use(express.static(__dirname)); // Serve other static files (css, js, images) from root
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (or restrict to your domain)
        methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8 // 100 MB
});

const port = process.env.PORT || 3000;
const db = new Database('database.db');

// --- DATABASE OPTIMIZATION ---
db.pragma('journal_mode = WAL'); // Better concurrency
db.prepare('CREATE INDEX IF NOT EXISTS idx_pixels_xy ON pixels(x, y)').run(); // Fast range queries

// --- Seasonal History Table (Hall of Fame) ---
db.exec(`
    CREATE TABLE IF NOT EXISTS season_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season_key TEXT UNIQUE, -- e.g. "2026-Q1"
        season_name TEXT,       -- e.g. "Season 1"
        winner_group TEXT,
        ranking_json TEXT,      -- Top 10 Ranking Snapshot (JSON)
        snapshot_path TEXT,     -- Path to pixel dump JSON
        pixel_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);
// --- DATABASE MIGRATIONS ---
try {
    console.log("[MIGRATION] Attempting to add columns...");
    // FIX: Removed DEFAULT CURRENT_TIMESTAMP to avoid "non-constant default" error
    db.prepare("ALTER TABLE pixels ADD COLUMN purchased_at DATETIME").run();
    console.log("[MIGRATION] Added 'purchased_at'");
} catch (e) {
    console.log("[MIGRATION] 'purchased_at' status: " + e.message);
}
try {
    db.prepare("ALTER TABLE pixels ADD COLUMN expires_at DATETIME").run();
    console.log("[MIGRATION] Added 'expires_at'");
} catch (e) {
    console.log("[MIGRATION] 'expires_at' status: " + e.message);
}

// Check Schema
try {
    const columns = db.pragma('table_info(pixels)');
    console.log("[SCHEMA] Current columns:", columns.map(c => c.name).join(', '));
} catch (e) {
    console.error("[SCHEMA] Failed to read schema:", e);
}

// --- Middleware ---
// ... (rest of middleware)

// ... (existing routes)

// (Moved to io.on connection block below)

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if behind HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname));

// --- Passport Configuration ---
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        console.log("Deserializing user ID:", id);
        done(null, user);
    } catch (err) {
        console.error("Error deserializing user:", err);
        done(err, null);
    }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID) {
    console.log("Google Client ID loaded:", process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "...");
    const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback";
    console.log("Google Auth Callback URL set to:", googleCallbackURL);

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackURL
    },
        function (accessToken, refreshToken, profile, cb) {
            console.log("Google Auth Callback received for:", profile.displayName);
            try {
                // Check if user exists
                let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get('google', profile.id);

                if (!user) {
                    console.log("Creating new user for:", profile.displayName);
                    // Create user
                    const email = (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : null;
                    const insert = db.prepare('INSERT INTO users (provider, provider_id, email, nickname) VALUES (?, ?, ?, ?)');
                    const info = insert.run('google', profile.id, email, profile.displayName);
                    user = { id: info.lastInsertRowid, provider: 'google', provider_id: profile.id, email: email, nickname: profile.displayName };
                } else {
                    console.log("Existing user found:", user.nickname);
                }
                return cb(null, user);
            } catch (err) {
                console.error("Error in Google Auth Callback:", err);
                return cb(err);
            }
        }
    ));
} else {
    console.warn("GOOGLE_CLIENT_ID not found in .env. Google Auth will strictly fail.");
}



// --- Helper: Dynamic Pricing ---
function getPixelPrice(x, y) {
    // Center based on WORLD_SIZE 63240 -> Center 31620
    const minCenter = 29620;
    const maxCenter = 33620;
    const minMid = 25620;
    const maxMid = 37620;

    if (x >= minCenter && x < maxCenter && y >= minCenter && y < maxCenter) {
        return 2000;
    }
    if (x >= minMid && x < maxMid && y >= minMid && y < maxMid) {
        return 1000;
    }
    return 500;
}

// --- Routes ---

// --- Auth Token Table (Session Recovery) ---
db.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
    )
`);

// --- Helper: Generate Token ---
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// --- Routes ---

app.get('/', (req, res) => {
    // Session Recovery Logic
    const recoveryToken = req.query.restore_session;
    if (recoveryToken && !req.isAuthenticated()) {
        console.log(`[AUTH] Attempting session recovery with token: ${recoveryToken}`);
        try {
            const tokenParams = db.prepare('SELECT * FROM auth_tokens WHERE token = ?').get(recoveryToken);

            if (tokenParams) {
                const now = new Date();
                const expiry = new Date(tokenParams.expires_at);

                if (now < expiry) {
                    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(tokenParams.user_id);
                    if (user) {
                        req.login(user, (err) => {
                            if (err) {
                                console.error("[AUTH] Login error during recovery:", err);
                            } else {
                                console.log(`[AUTH] Session recovered for user: ${user.nickname}`);
                                // Consume token (One-time use)
                                db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(recoveryToken);
                            }
                        });
                    }
                } else {
                    console.log("[AUTH] Recovery token expired");
                    db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(recoveryToken); // Cleanup
                }
            } else {
                console.log("[AUTH] Invalid recovery token");
            }
        } catch (e) {
            console.error("[AUTH] Recovery error:", e);
        }
    }

    // Clean URL if token present (Optional, but good for UX)
    // Client-side can also do history.replaceState

    res.sendFile(__dirname + '/index.html');
});

// NEW: Generate Recovery Token Endpoint
app.post('/api/auth/recovery-token', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const token = generateToken();
        const userId = req.user.id;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 minutes from now

        db.prepare('INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt.toISOString());

        console.log(`[AUTH] Generated recovery token for user ${userId}: ${token}`);
        res.json({ token: token });
    } catch (e) {
        console.error("Token generation failed:", e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/api/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});


// API Routes

// NEW: History API (Moved here to be after middleware)
app.get('/api/history', (req, res) => {
    if (!req.isAuthenticated()) { // Now safe
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const nickname = req.user.nickname;
    try {
        // Aggregated History (Group by Purchase Time within 1 second window)
        // Note: We group by purchased_at which we set identical for batches.
        const stmt = db.prepare(`
            SELECT 
                idol_group_name, 
                purchased_at, 
                expires_at, 
                COUNT(*) as count 
            FROM pixels 
            WHERE owner_nickname = ? 
            GROUP BY purchased_at, idol_group_name
            ORDER BY purchased_at DESC 
            LIMIT 20
        `);
        const rows = stmt.all(nickname);
        console.log("[DEBUG] /api/history returns:", rows);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching history:", err);
        res.status(500).send(err.message);
    }
});

// NEW: Chunk Loading API
app.get('/api/pixels/chunk', (req, res) => {
    let { minX, minY, maxX, maxY } = req.query;

    // Validate inputs
    if (minX === undefined || minY === undefined || maxX === undefined || maxY === undefined) {
        return res.status(400).json({ error: 'Missing bounds parameters (minX, minY, maxX, maxY)' });
    }

    minX = Number(minX);
    minY = Number(minY);
    maxX = Number(maxX);
    maxY = Number(maxY);

    try {
        // Optimized range query using INDEX
        const stmt = db.prepare('SELECT * FROM pixels WHERE x >= ? AND x < ? AND y >= ? AND y < ?');
        const rows = stmt.all(minX, maxX, minY, maxY);

        // Cache for 10 seconds
        res.set('Cache-Control', 'public, max-age=10');

        if (req.query.format === 'json') {
            return res.json(rows);
        }

        // ALWAYS send binary for this optimized endpoint
        // Binary Schema: [x(2)][y(2)][r(1)][g(1)][b(1)][group_len(1)][group_bytes...][owner_len(1)][owner_bytes...]
        const buffers = [];
        for (const p of rows) {
            // Parse Color (#RRGGBB)
            let r = 0, g = 0, b = 0;
            if (p.color && p.color.startsWith('#') && p.color.length === 7) {
                r = parseInt(p.color.substring(1, 3), 16) || 0;
                g = parseInt(p.color.substring(3, 5), 16) || 0;
                b = parseInt(p.color.substring(5, 7), 16) || 0;
            }

            // Clamp strings to 255 bytes
            let groupBuf = Buffer.from(p.idol_group_name || '');
            if (groupBuf.length > 255) groupBuf = groupBuf.subarray(0, 255);

            let ownerBuf = Buffer.from(p.owner_nickname || '');
            if (ownerBuf.length > 255) ownerBuf = ownerBuf.subarray(0, 255);

            const buf = Buffer.alloc(2 + 2 + 3 + 1 + groupBuf.length + 1 + ownerBuf.length);
            let offset = 0;
            buf.writeUInt16BE(p.x, offset); offset += 2;
            buf.writeUInt16BE(p.y, offset); offset += 2;
            buf.writeUInt8(r, offset); offset += 1;
            buf.writeUInt8(g, offset); offset += 1;
            buf.writeUInt8(b, offset); offset += 1;

            buf.writeUInt8(groupBuf.length, offset); offset += 1;
            if (groupBuf.length > 0) {
                groupBuf.copy(buf, offset); offset += groupBuf.length;
            }

            buf.writeUInt8(ownerBuf.length, offset); offset += 1;
            if (ownerBuf.length > 0) {
                ownerBuf.copy(buf, offset); offset += ownerBuf.length;
            }
            buffers.push(buf);
        }
        const finalBuf = Buffer.concat(buffers);
        // console.log(`[DEBUG] /api/pixels/chunk: ${rows.length} pixels, Buffer len: ${finalBuf.length}`);
        res.set('Content-Type', 'application/octet-stream');
        res.send(finalBuf);
    } catch (err) {
        console.error("Error fetching chunk:", err);
        res.status(500).send(err.message);
    }
});

// NEW: Tile Map Service (TMS) Endpoint
// Generates a 256x256 PNG for a given grid coordinate (x, y)
const { PNG } = require('pngjs');

// Map Constants needed for Tile Calculation
// Server doesn't need to know exact world size if it just queries by range, but for tiles we need consistent grid.
// Tile Size = 256px
// Grid Scale = 20 (Actual pixels per coordinate point? No, DB stores x,y. 1 DB unit = 20px visualization? No. 
// "GRID_SIZE = 20" in main.js means visuals are 20x20. But DB x,y are arbitrary integers? 
// Let's assume DB x,y correlates to canvas pixels 1:1, but rendered as blocks.
// User said: "pixels are not appearing". 
// In main.js: const chunkMinX = cx * this.chunkSize;
// Data Schema: x, y are INTEGERS.
// Let's assume 1 Tile = 256x256 DB units.
app.get('/api/pixels/tile', (req, res) => {
    const tx = parseInt(req.query.x);
    const ty = parseInt(req.query.y);
    const zoom = parseInt(req.query.zoom) || 1;

    // Define Tile Size in "World Units"
    // If we want fine-grained tiles, 1 tile = 256 units.
    const TILE_SIZE = 256;

    // Calculate bounds
    const minX = tx * TILE_SIZE;
    const minY = ty * TILE_SIZE;
    const maxX = minX + TILE_SIZE;
    const maxY = minY + TILE_SIZE;

    try {
        // Fetch pixels in this tile
        // Use Index to be fast
        const stmt = db.prepare(`SELECT x, y, color FROM pixels WHERE x >= ? AND x < ? AND y >= ? AND y < ?`);
        const rows = stmt.all(minX, maxX, minY, maxY);

        // Create PNG
        const png = new PNG({ width: TILE_SIZE, height: TILE_SIZE });

        // Fill background (Transparent)
        // pngjs defaults to black transparent (0,0,0,0)

        // Draw Pixels
        // Each DB pixel is drawn as 1x1 pixel on the tile for now. 
        // If main.js zooms in, it might look tiny. But logic says "Client loads images".
        // Use 1:1 mapping for simplicity.

        for (const p of rows) {
            const lx = p.x - minX;
            const ly = p.y - minY;

            if (lx < 0 || lx >= TILE_SIZE || ly < 0 || ly >= TILE_SIZE) continue;

            let r = 0, g = 0, b = 0;
            if (p.color && p.color.startsWith('#') && p.color.length === 7) {
                r = parseInt(p.color.substring(1, 3), 16) || 0;
                g = parseInt(p.color.substring(3, 5), 16) || 0;
                b = parseInt(p.color.substring(5, 7), 16) || 0;
            }

            const idx = (ly * TILE_SIZE + lx) << 2;
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = 255; // Alpha
        }

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=60'); // Cache tiles for 1 min
        png.pack().pipe(res);

    } catch (err) {
        console.error("Error generating tile:", err);
        res.status(500).send("Tile Error");
    }
});

// NEW: Ranking API (Server-side Aggregation)
app.get('/api/ranking', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT idol_group_name as name, COUNT(*) as count 
            FROM pixels 
            WHERE idol_group_name IS NOT NULL 
            GROUP BY idol_group_name 
            ORDER BY count DESC 
            LIMIT 10
        `);
        const rows = stmt.all();
        res.json(rows);
    } catch (err) {
        console.error("Error fetching ranking:", err);
        res.status(500).send(err.message);
    }
});

// Legacy Endpoint (Deprecated for large scale, but kept for compatibility/initial debug)
app.get('/api/pixels', (req, res) => {
    try {
        // console.warn("WARNING: /api/pixels called. This is slow for large datasets.");
        const stmt = db.prepare('SELECT * FROM pixels');
        const rows = stmt.all();
        res.json(rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.onAny((event, ...args) => {
        console.log(`[DEBUG] Incoming Event: ${event}`, args);
    });

    socket.on('new_pixel', (data) => {
        console.log('[DEBUG] Received new_pixel:', data);
        try {
            // Use consistent timestamp for the entire batch to allow grouping in history
            const now = new Date();
            const nowStr = now.toISOString(); // UTC ISO String

            // Dynamic Season End (Quarterly: Mar, Jun, Sep, Dec)
            const year = now.getFullYear();
            const month = now.getMonth();
            const endMonth = (Math.floor(month / 3) * 3) + 2;
            const expiry = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
            const expiryStr = expiry.toISOString();

            const stmt = db.prepare(`INSERT INTO pixels (x, y, color, idol_group_name, owner_nickname, purchased_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            const info = stmt.run(data.x, data.y, data.color, data.idol_group_name, data.owner_nickname, nowStr, expiryStr);
            console.log('[DEBUG] Insert Success, ID:', info.lastInsertRowid);
            io.emit('pixel_update', {
                id: info.lastInsertRowid,
                x: data.x,
                y: data.y,
                color: data.color,
                idol_group_name: data.idol_group_name,
                owner_nickname: data.owner_nickname
            });
        } catch (err) {
            console.error('[DEBUG] INSERT ERROR:', err.message);
        }
    });

    // BATCH UPDATE HANDLER
    socket.on('batch_new_pixels', (pixels) => {
        console.log(`[SERVER] Received batch_new_pixels event with ${pixels ? pixels.length : 'undefined'} pixels`);
        try {
            // Use consistent timestamp for the entire batch to allow grouping in history
            const now = new Date();
            const nowStr = now.toISOString(); // UTC ISO String

            // Dynamic Season End (Quarterly: Mar, Jun, Sep, Dec)
            const year = now.getFullYear();
            const month = now.getMonth();
            const endMonth = (Math.floor(month / 3) * 3) + 2;
            const expiry = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
            const expiryStr = expiry.toISOString();

            const insert = db.prepare(`INSERT INTO pixels (x, y, color, idol_group_name, owner_nickname, purchased_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            const insertMany = db.transaction((pixels) => {
                const updates = [];
                for (const p of pixels) {
                    const info = insert.run(p.x, p.y, p.color, p.idol_group_name, p.owner_nickname, nowStr, expiryStr);
                    updates.push({
                        id: info.lastInsertRowid,
                        x: p.x,
                        y: p.y,
                        color: p.color,
                        idol_group_name: p.idol_group_name,
                        owner_nickname: p.owner_nickname
                    });
                }
                return updates;
            });

            if (pixels && pixels.length > 0) {
                const updates = insertMany(pixels);
                console.log('[DEBUG] Batch Insert Success, Count:', updates.length);
                // Broadcast all updates in one message
                io.emit('batch_pixel_update', updates);
            }
        } catch (err) {
            console.error('[DEBUG] BATCH INSERT ERROR:', err.message);
        }
    });

});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
