const Database = require('better-sqlite3');
const db = new Database('database.db');

console.log("--- DB DIAGNOSIS ---");
try {
    const row0 = db.prepare('SELECT count(*) as c FROM pixels').get();
    console.log("Initial Count:", row0.c);

    // Check strict schema
    const schema = db.pragma('table_info(pixels)');
    console.log("Schema Columns:", schema.map(c => c.name));

    // Try dummy insert
    try {
        const stmt = db.prepare("INSERT INTO pixels (x, y, color, idol_group_name, owner_nickname, purchased_at) VALUES (?, ?, ?, ?, ?, ?)");
        const res = stmt.run(99999, 99999, '#ffffff', 'TEST', 'TESTER', new Date().toISOString());
        console.log("Test Insert Result:", res);
    } catch (e) {
        console.log("Test Insert Failed:", e.message);
    }

    const row1 = db.prepare('SELECT count(*) as c FROM pixels').get();
    console.log("Post-Insert Count:", row1.c);

    // Check if it persists (better-sqlite3 is sync, so it should)

} catch (e) {
    console.error("Diagnosis Error:", e);
}
