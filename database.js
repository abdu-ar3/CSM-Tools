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

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS project_pics (
            record_id TEXT PRIMARY KEY,
            pic TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS customer_issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            customer TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'Open',
            priority TEXT DEFAULT 'Medium',
            assigned_to TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS project_timelines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT NOT NULL,
            task_name TEXT NOT NULL,
            due_date TEXT,
            actual_date TEXT,
            status TEXT DEFAULT 'Pending',
            order_index INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating project_timelines table', err);
            } else {
                db.all("PRAGMA table_info(project_timelines)", (err, rows) => {
                    if (err) {
                        console.error('Error checking project_timelines schema', err);
                        return;
                    }
                    const hasActualDate = rows.some(column => column.name === 'actual_date');
                    if (!hasActualDate) {
                        db.run('ALTER TABLE project_timelines ADD COLUMN actual_date TEXT', (err) => {
                            if (err) console.error('Error adding actual_date column', err);
                        });
                    }
                });
            }
        });
    }
});

module.exports = db;
