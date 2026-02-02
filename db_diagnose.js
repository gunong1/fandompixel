const mongoose = require('mongoose');
require('dotenv').config();

const base = "mongodb://clghthd_db_user:vkNLy1XiFjyNjMqI@ac-g0nxqmu-shard-00-00.k9a53aj.mongodb.net:27017,ac-g0nxqmu-shard-00-01.k9a53aj.mongodb.net:27017,ac-g0nxqmu-shard-00-02.k9a53aj.mongodb.net:27017";
const suffix = "replicaSet=atlas-c6r5za-shard-0&ssl=true";

const variations = [
    { name: "AuthSource Admin", uri: `${base}/idolpixel?${suffix}&authSource=admin` },
    { name: "AuthSource Self", uri: `${base}/idolpixel?${suffix}&authSource=idolpixel` },
    { name: "No AuthSource", uri: `${base}/idolpixel?${suffix}` },
    { name: "Root Admin", uri: `${base}/admin?${suffix}&authSource=admin` }
];

async function test() {
    for (const v of variations) {
        console.log(`\n--- Testing ${v.name} ---`);
        try {
            await mongoose.connect(v.uri, { serverSelectionTimeoutMS: 2000 });
            console.log("SUCCESS!");
            await mongoose.disconnect();
            process.exit(0);
        } catch (e) {
            console.log("Failed:", e.message);
        }
    }
    process.exit(1);
}

test();
