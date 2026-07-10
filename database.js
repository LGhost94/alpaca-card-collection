const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function connectDatabase() {
    const dbPath = path.join(__dirname, "database", "cards.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    return open({
        filename: dbPath,
        driver: sqlite3.Database
    });
}

module.exports = connectDatabase;