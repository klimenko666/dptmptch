const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use absolute path to database
const DB_PATH = path.resolve('backend', 'database', 'temp_teachers.db');

console.log('Updating database...');
console.log('Database path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');

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
                    console.log('✅ All migrations applied successfully.');
                    db.close();
                    console.log('Database update complete.');
                    return;
                }

                const migration = migrations[migrationIndex];
                console.log(`Executing: ${migration}`);

                db.run(migration, (err) => {
                    if (err) {
                        console.error(`❌ Error executing migration: ${migration}`, err);
                        db.close();
                        return;
                    }

                    migrationIndex++;
                    executeMigration();
                });
            };

            executeMigration();
        } else {
            console.log('✅ No migrations needed.');
            db.close();
            console.log('Database is up to date.');
        }
    });
});