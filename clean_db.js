const fs = require('fs');
const path = require('path');

// Функция для поиска файла базы данных
function findDatabaseFile() {
    const possiblePaths = [
        path.join(__dirname, 'backend', 'database', 'temp_teachers.db'),
        path.join(__dirname, 'database', 'temp_teachers.db'),
        path.resolve('backend', 'database', 'temp_teachers.db'),
        path.resolve('database', 'temp_teachers.db'),
        // Проверяем все возможные пути
        'C:\\Users\\misha\\OneDrive\\Рабочий стол\\dptmptch\\backend\\database\\temp_teachers.db'
    ];

    for (const testPath of possiblePaths) {
        try {
            if (fs.existsSync(testPath)) {
                console.log('✅ Найден файл базы данных:', testPath);
                return testPath;
            }
        } catch (e) {
            // Игнорируем ошибки доступа
        }
    }

    console.log('❌ Файл базы данных не найден');
    return null;
}

// Функция для удаления файла
function deleteDatabaseFile(dbPath) {
    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('🗑️ База данных удалена:', dbPath);
            return true;
        } else {
            console.log('ℹ️ Файл базы данных не существует');
            return true;
        }
    } catch (error) {
        console.error('❌ Ошибка удаления файла:', error.message);
        return false;
    }
}

// Основная функция
function main() {
    console.log('🔄 Очистка базы данных TempTeachers...\n');

    const dbPath = findDatabaseFile();

    if (!dbPath) {
        console.log('ℹ️ База данных не найдена - очистка не требуется');
        console.log('🎉 Готово! Можно запускать сервер.');
        return;
    }

    const deleted = deleteDatabaseFile(dbPath);

    if (deleted) {
        console.log('\n🎉 База данных успешно очищена!');
        console.log('📝 Теперь при первом запуске сервера будет создана новая пустая база данных.');
        console.log('\n🚀 Запустите сервер командой:');
        console.log('   node backend/server.js');
        console.log('\n🔑 После запуска сервера можно будет зарегистрировать нового пользователя.');
    } else {
        console.log('\n❌ Не удалось очистить базу данных');
        console.log('💡 Попробуйте удалить файл вручную: backend/database/temp_teachers.db');
    }
}

// Запуск
main();