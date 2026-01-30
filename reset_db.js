const Database = require('better-sqlite3');
const db = new Database('database.db');

try {
    const info = db.prepare('DELETE FROM pixels').run();
    console.log(`Deleted ${info.changes} rows from pixels table.`);
} catch (error) {
    console.error('Error resetting database:', error);
}
