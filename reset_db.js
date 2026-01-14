const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Путь к базе данных
const DB_PATH = path.join(__dirname, 'backend', 'database', 'temp_teachers.db');
const SCHEMA_PATH = path.join(__dirname, 'backend', 'database', 'schema.sql');

console.log('🔄 Сброс базы данных TempTeachers...');
console.log('📁 Путь к БД:', DB_PATH);

// Удаляем старую базу данных
if (fs.existsSync(DB_PATH)) {
    console.log('🗑️ Удаление старой базы данных...');
    fs.unlinkSync(DB_PATH);
    console.log('✅ Старая база данных удалена');
} else {
    console.log('ℹ️ База данных не найдена, создаем новую');
}

// Создаем новую базу данных
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Ошибка создания базы данных:', err.message);
        process.exit(1);
    }
    console.log('✅ База данных создана');
});

// Читаем схему
let schema;
try {
    schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log('📄 Схема загружена');
} catch (error) {
    console.error('❌ Ошибка чтения схемы:', error.message);
    db.close();
    process.exit(1);
}

// Выполняем схему
db.serialize(() => {
    // Разделяем схему на отдельные команды
    const commands = schema.split(';').filter(cmd => cmd.trim().length > 0);

    console.log(`⚡ Выполнение ${commands.length} SQL команд...`);

    let completedCommands = 0;

    commands.forEach((command, index) => {
        if (command.trim()) {
            db.run(command.trim(), (err) => {
                if (err) {
                    console.error(`❌ Ошибка в команде ${index + 1}:`, err.message);
                    console.error('Команда:', command.trim());
                    db.close();
                    process.exit(1);
                }

                completedCommands++;
                console.log(`✅ Команда ${index + 1}/${commands.length} выполнена`);

                if (completedCommands === commands.length) {
                    // Добавляем тестовые данные
                    addSampleData();
                }
            });
        }
    });
});

function addSampleData() {
    console.log('📝 Добавление тестовых данных...');

    // Добавляем работодателя
    const employerSql = `
        INSERT INTO employers (organization_name, contact_name, phone, email, password_hash, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Хэшированный пароль для "password" (bcrypt, 10 rounds)
    const hashedPassword = '$2a$10$example.hash.for.demo.purposes.only';

    db.run(employerSql, [
        'Образовательный центр "Техно"',
        'Иван Петрович Сидоров',
        '+7 (777) 123-45-67',
        'hr@techno-center.kz',
        hashedPassword,
        'Современный образовательный центр с передовыми технологиями обучения'
    ], function(err) {
        if (err) {
            console.error('❌ Ошибка добавления работодателя:', err);
            db.close();
            return;
        }

        const employerId = this.lastID;
        console.log(`✅ Работодатель добавлен (ID: ${employerId})`);

        // Добавляем вакансии
        addSampleVacancies(employerId);
    });
}

function addSampleVacancies(employerId) {
    const vacancies = [
        {
            subject: 'Математика',
            work_type: 'замена',
            start_date: '2025-01-15',
            end_date: '2025-01-22',
            schedule_from: '09:00',
            schedule_to: '15:00',
            work_days: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
            salary_amount: 25000,
            salary_type: 'в месяц',
            address: 'ул. Абая, 10, Алматы',
            description: 'Замена преподавателя математики на период болезни. Опыт преподавания в колледже приветствуется.',
            contact_phone: '+7 (777) 123-45-67',
            contact_email: 'hr@techno-center.kz',
            contact_person: 'Иван Петрович'
        },
        {
            subject: 'Информатика',
            work_type: 'временная',
            start_date: '2025-01-20',
            end_date: '2025-02-10',
            schedule_from: '14:00',
            schedule_to: '20:00',
            work_days: JSON.stringify(['monday', 'wednesday', 'friday']),
            salary_amount: 30000,
            salary_type: 'в месяц',
            address: 'пр. Назарбаева, 45, Алматы',
            description: 'Временная нагрузка по информатике. Требуется знание Python, C++, алгоритмов.',
            contact_phone: '+7 (777) 123-45-67',
            contact_email: 'hr@techno-center.kz',
            contact_person: 'Мария Сергеевна'
        }
    ];

    let addedVacancies = 0;

    vacancies.forEach((vacancy, index) => {
        const sql = `
            INSERT INTO vacancies (
                employer_id, subject, work_type, start_date, end_date,
                schedule_from, schedule_to, work_days, salary_amount, salary_type,
                address, description, contact_phone, contact_email, contact_person
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [
            employerId, vacancy.subject, vacancy.work_type, vacancy.start_date, vacancy.end_date,
            vacancy.schedule_from, vacancy.schedule_to, vacancy.work_days, vacancy.salary_amount, vacancy.salary_type,
            vacancy.address, vacancy.description, vacancy.contact_phone, vacancy.contact_email, vacancy.contact_person
        ], (err) => {
            if (err) {
                console.error(`❌ Ошибка добавления вакансии ${index + 1}:`, err);
                return;
            }

            addedVacancies++;
            console.log(`✅ Вакансия "${vacancy.subject}" добавлена`);

            if (addedVacancies === vacancies.length) {
                console.log('🎉 База данных успешно сброшена и заполнена!');
                console.log('');
                console.log('📊 Статистика:');
                console.log(`   • Работодателей: 1`);
                console.log(`   • Вакансий: ${vacancies.length}`);
                console.log('');
                console.log('🚀 Теперь можно запустить сервер:');
                console.log('   node backend/server.js');
                console.log('');
                console.log('🔑 Тестовый аккаунт:');
                console.log('   Email: hr@techno-center.kz');
                console.log('   Password: password');
                console.log('');

                db.close();
            }
        });
    });
}