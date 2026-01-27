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

// --- Middleware ---
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
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
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
app.get('/api/pixels', (req, res) => {
    try {
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

    socket.on('new_pixel', (data) => {
        try {
            const stmt = db.prepare(`INSERT INTO pixels (x, y, color, idol_group_name, owner_nickname) VALUES (?, ?, ?, ?, ?)`);
            const info = stmt.run(data.x, data.y, data.color, data.idol_group_name, data.owner_nickname);
            io.emit('pixel_update', {
                id: info.lastInsertRowid,
                x: data.x,
                y: data.y,
                color: data.color,
                idol_group_name: data.idol_group_name,
                owner_nickname: data.owner_nickname
            });
        } catch (err) {
            console.log(err.message);
        }
    });

    // BATCH UPDATE HANDLER
    socket.on('batch_new_pixels', (pixels) => {
        console.log(`[SERVER] Received batch_new_pixels event with ${pixels ? pixels.length : 'undefined'} pixels`);
        try {
            const insert = db.prepare(`INSERT INTO pixels (x, y, color, idol_group_name, owner_nickname) VALUES (?, ?, ?, ?, ?)`);
            const insertMany = db.transaction((pixels) => {
                const updates = [];
                for (const p of pixels) {
                    const info = insert.run(p.x, p.y, p.color, p.idol_group_name, p.owner_nickname);
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
                // Broadcast all updates in one message
                io.emit('batch_pixel_update', updates);
            }
        } catch (err) {
            console.error('Batch insert error:', err.message);
        }
    });

});

server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
