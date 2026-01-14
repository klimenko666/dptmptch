const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка базы данных TempTeachers...');

// Путь к базе данных
const dbPath = path.join(__dirname, 'backend', 'database', 'temp_teachers.db');

try {
    // Создаем пустой файл (что удалит все данные)
    fs.writeFileSync(dbPath, '');
    console.log('✅ База данных очищена (создана пустая)');
    console.log('');
    console.log('🎯 Теперь при запуске сервера будет создана новая структура базы данных.');
    console.log('');
    console.log('🚀 Запустите сервер:');
    console.log('   node backend/server.js');
    console.log('');
    console.log('🔑 После запуска можно будет зарегистрировать нового пользователя.');

} catch (error) {
    console.error('❌ Ошибка очистки базы данных:', error.message);
    console.log('');
    console.log('💡 Попробуйте удалить файл вручную: backend/database/temp_teachers.db');
}