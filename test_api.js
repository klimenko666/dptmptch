// Simple test script to check API
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Testing database...');

const DB_PATH = path.join(__dirname, 'backend', 'database', 'temp_teachers.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database.');

    // Check table structure
    db.all("PRAGMA table_info(vacancies)", [], (err, columns) => {
        if (err) {
            console.error('❌ Error checking table info:', err);
            db.close();
            return;
        }

        const columnNames = columns.map(col => col.name);
        console.log('📋 Vacancies columns:', columnNames);

        // Check if required columns exist
        const requiredColumns = ['id', 'employer_id', 'subject', 'work_type', 'start_date', 'end_date', 'schedule_from', 'schedule_to', 'salary_amount', 'salary_type', 'description', 'contact_phone', 'status', 'created_at', 'updated_at', 'work_days', 'address'];

        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

        if (missingColumns.length > 0) {
            console.log('❌ Missing columns:', missingColumns);

            // Try to add missing columns
            let migrations = [];
            if (!columnNames.includes('work_days')) {
                migrations.push("ALTER TABLE vacancies ADD COLUMN work_days TEXT");
            }
            if (!columnNames.includes('address')) {
                migrations.push("ALTER TABLE vacancies ADD COLUMN address TEXT");
            }

            if (migrations.length > 0) {
                console.log('🔧 Applying migrations...');

                let index = 0;
                const runMigration = () => {
                    if (index >= migrations.length) {
                        console.log('✅ All migrations applied!');
                        testQuery();
                        return;
                    }

                    const migration = migrations[index];
                    console.log(`Executing: ${migration}`);

                    db.run(migration, (err) => {
                        if (err) {
                            console.error(`❌ Error: ${migration}`, err);
                            db.close();
                            return;
                        }
                        index++;
                        runMigration();
                    });
                };

                runMigration();
            } else {
                testQuery();
            }
        } else {
            console.log('✅ All required columns exist');
            testQuery();
        }
    });
});

function testQuery() {
    // Test query similar to what the API does
    db.all(`
        SELECT v.*, e.organization_name
        FROM vacancies v
        JOIN employers e ON v.employer_id = e.id
        LIMIT 1
    `, [], (err, rows) => {
        if (err) {
            console.error('❌ Error testing query:', err);
        } else {
            console.log('✅ Query executed successfully');
            console.log('Sample result:', rows.length > 0 ? 'Found vacancies' : 'No vacancies');
        }
        db.close();
        console.log('Database test complete.');
    });
}