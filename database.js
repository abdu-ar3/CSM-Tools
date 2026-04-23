const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.resolve(__dirname, 'csm_database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, 
            industry TEXT,
            plan TEXT,
            health_score INTEGER,
            status TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err);
            } else {
                // Initialize with some seed data if empty
                db.get("SELECT COUNT(*) AS count FROM clients", (err, row) => {
                    if (row && row.count === 0) {
                        const insert = 'INSERT INTO clients (name, industry, plan, health_score, status) VALUES (?,?,?,?,?)';
                        db.run(insert, ["Acme Corp", "Technology", "Enterprise", 92, "Active"]);
                        db.run(insert, ["Globex Inc", "Manufacturing", "Pro", 65, "Active"]);
                        db.run(insert, ["Soylent Corp", "Food", "Basic", 85, "Active"]);
                        db.run(insert, ["Initech", "Software", "Pro", 45, "Review"]);
                    }
                });
            }
        });
    }
});

module.exports = db;
