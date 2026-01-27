const Database = require('better-sqlite3');
const db = new Database('database.db');

// Drop the old table if it exists to apply changes
// db.exec('DROP TABLE IF EXISTS pixels');

const createTable = db.prepare(`CREATE TABLE IF NOT EXISTS pixels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  color TEXT NOT NULL,
  idol_group_name TEXT,
  owner_nickname TEXT
)`);
createTable.run();

const insert = db.prepare(`INSERT INTO pixels (x, y, color, idol_group_name, owner_nickname) VALUES (?, ?, ?, ?, ?)`);
// Only insert initial data if table is empty, or just let it append if we want?
// For now, let's just keep the single sample insert command but maybe wrap in try/catch or check count?
// The original script just ran it. Since we removed DROP TABLE, running this every time adds a pixel.
// Let's comment this out too to avoid duplicate initial pixels on every restart, 
// OR just leave it as user requested persistence.
// Ideally, we shouldn't add the sample pixel every time.
// insert.run(1500, 1500, 'rgba(0, 212, 255, 0.3)', 'BTS', 'ARMY');

db.close();
