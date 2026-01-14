// Test script to verify the fix
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'backend', 'database', 'temp_teachers.db');

console.log('🔍 Проверка базы данных...');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения:', err.message);
        return;
    }
    console.log('✅ Подключено к БД');
});

db.all("SELECT v.id, v.subject, v.address, e.organization_name FROM vacancies v JOIN employers e ON v.employer_id = e.id", [], (err, rows) => {
    if (err) {
        console.error('❌ Ошибка запроса:', err);
    } else {
        console.log('📋 Вакансии в базе данных:');
        if (rows.length === 0) {
            console.log('   ℹ️ Вакансий нет');
        } else {
            rows.forEach((row, index) => {
                console.log(`   ${index + 1}. ${row.subject} - ${row.organization_name}`);
                console.log(`      Адрес: ${row.address || 'не указан'}`);
            });
        }
    }
    db.close();
});