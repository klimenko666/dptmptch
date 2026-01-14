const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('Fixing database...');

// Use the same path as in db.js
const DB_PATH = path.join(__dirname, 'backend', 'database', 'temp_teachers.db');
const SCHEMA_PATH = path.join(__dirname, 'backend', 'database', 'schema.sql');

console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');

    // Check if tables exist
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('employers', 'vacancies')", [], (err, rows) => {
        if (err) {
            console.error('Error checking tables:', err.message);
            db.close();
            return;
        }

        const existingTables = rows.map(row => row.name);
        console.log('Existing tables:', existingTables);

        if (existingTables.includes('employers') && existingTables.includes('vacancies')) {
            console.log('Tables already exist. No need to initialize.');
            db.close();
            return;
        }

        // Create tables
        try {
            const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
            console.log('Executing schema...');

            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error creating tables:', err.message);
                    db.close();
                    return;
                }

                console.log('Database tables created successfully.');

                // Verify tables were created
                db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
                    if (err) {
                        console.error('Error verifying tables:', err.message);
                    } else {
                        console.log('All tables:', rows.map(row => row.name));
                    }
                    db.close();
                    console.log('Database initialization complete.');
                });
            });
        } catch (fsError) {
            console.error('Error reading schema file:', fsError.message);
            db.close();
        }
    });
});