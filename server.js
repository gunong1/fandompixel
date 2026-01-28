require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = process.env.PORT || 3000;
const db = new Database('database.db');

// --- DATABASE OPTIMIZATION ---
db.pragma('journal_mode = WAL'); // Better concurrency
db.prepare('CREATE INDEX IF NOT EXISTS idx_pixels_xy ON pixels(x, y)').run(); // Fast range queries
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
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID) {
    console.log("Google Client ID loaded:", process.env.GOOGLE_CLIENT_ID.substring(0, 10) + "...");
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
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
            // console.log(`[DEBUG] /api/pixels/chunk params: ${minX},${minY} to ${maxX},${maxY} -> Count: ${rows.length}`);
            res.json(rows);
        } catch (err) {
            console.error("Error fetching chunk:", err);
            res.status(500).send(err.message);
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

                const expiry = new Date(now);
                expiry.setDate(expiry.getDate() + 30); // 30 Days Expiry
                const expiryStr = expiry.toISOString(); // UTC ISO String

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

                const expiry = new Date(now);
                expiry.setDate(expiry.getDate() + 30); // 30 Days Expiry
                const expiryStr = expiry.toISOString(); // UTC ISO String

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
