#!/usr/bin/env node

// Migration script that can be run from any directory
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Find the database file by searching in common locations
const possiblePaths = [
    path.join(__dirname, 'backend', 'database', 'temp_teachers.db'),
    path.join(__dirname, 'database', 'temp_teachers.db'),
    path.resolve('backend', 'database', 'temp_teachers.db'),
    path.resolve('database', 'temp_teachers.db')
];

let dbPath = null;
for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
        dbPath = testPath;
        break;
    }
}

if (!dbPath) {
    console.error('❌ Database file not found. Please run this script from the project root directory.');
    process.exit(1);
}

console.log('🔍 Found database at:', dbPath);
console.log('🔧 Starting database migration...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

db.all("PRAGMA table_info(vacancies)", [], (err, columns) => {
    if (err) {
        console.error('❌ Error checking table structure:', err);
        db.close();
        process.exit(1);
    }

    const columnNames = columns.map(col => col.name);
    console.log('📋 Current columns:', columnNames);

    let migrations = [];

    if (!columnNames.includes('work_days')) {
        migrations.push("ALTER TABLE vacancies ADD COLUMN work_days TEXT");
    }

    if (!columnNames.includes('address')) {
        migrations.push("ALTER TABLE vacancies ADD COLUMN address TEXT");
    }

    if (migrations.length === 0) {
        console.log('✅ Database is already up to date');
        db.close();
        return;
    }

    console.log('🔄 Applying migrations:', migrations);

    let index = 0;
    const runMigration = () => {
        if (index >= migrations.length) {
            console.log('🎉 All migrations completed successfully!');
            console.log('📝 You can now start the server with: node backend/server.js');
            db.close();
            return;
        }

        const migration = migrations[index];
        console.log(`⚡ Executing: ${migration}`);

        db.run(migration, (err) => {
            if (err) {
                console.error(`❌ Migration failed: ${migration}`, err);
                db.close();
                process.exit(1);
            }

            console.log(`✅ Migration successful: ${migration}`);
            index++;
            runMigration();
        });
    };

    runMigration();
});