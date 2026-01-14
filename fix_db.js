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

        if (!existingTables.includes('employers') || !existingTables.includes('vacancies')) {
            // Create tables if they don't exist
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
                    db.close();
                    console.log('Database initialization complete.');
                });
            } catch (fsError) {
                console.error('Error reading schema file:', fsError.message);
                db.close();
            }
            return;
        }

        // Tables exist, check for missing columns and add them
        console.log('Tables exist, checking for missing columns...');

        // Check vacancies table columns
        db.all("PRAGMA table_info(vacancies)", [], (err, columns) => {
            if (err) {
                console.error('Error checking table info:', err);
                db.close();
                return;
            }

            const columnNames = columns.map(col => col.name);
            console.log('Vacancies columns:', columnNames);

            let migrations = [];

            if (!columnNames.includes('work_days')) {
                migrations.push("ALTER TABLE vacancies ADD COLUMN work_days TEXT");
            }

            if (!columnNames.includes('address')) {
                migrations.push("ALTER TABLE vacancies ADD COLUMN address TEXT");
            }

            if (migrations.length > 0) {
                console.log('Applying migrations:', migrations);

                // Execute migrations one by one
                let migrationIndex = 0;
                const executeMigration = () => {
                    if (migrationIndex >= migrations.length) {
                        console.log('All migrations applied successfully.');
                        db.close();
                        console.log('Database update complete.');
                        return;
                    }

                    const migration = migrations[migrationIndex];
                    console.log(`Executing: ${migration}`);

                    db.run(migration, (err) => {
                        if (err) {
                            console.error(`Error executing migration: ${migration}`, err);
                            db.close();
                            return;
                        }

                        migrationIndex++;
                        executeMigration();
                    });
                };

                executeMigration();
            } else {
                console.log('No migrations needed.');
                db.close();
                console.log('Database is up to date.');
            }
        });
    });
});