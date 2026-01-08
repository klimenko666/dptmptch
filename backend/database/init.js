const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'temp_teachers.db');

// Check if database already exists
const dbExists = fs.existsSync(DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Read and execute schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
    // Execute schema
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error creating tables:', err.message);
            return;
        }

        if (dbExists) {
            console.log('Database schema verified successfully.');
        } else {
            console.log('Database initialized successfully.');

            // Add some sample data for testing
            const sampleEmployer = {
                organization_name: 'Образовательный центр "Техно"',
                contact_name: 'Иван Петрович Сидоров',
                phone: '+7 (999) 123-45-67',
                email: 'hr@techno-center.ru',
                password_hash: '$2a$10$example.hash.for.demo.purposes.only' // This would be properly hashed in real app
            };

            db.run(`
                INSERT INTO employers (organization_name, contact_name, phone, email, password_hash)
                VALUES (?, ?, ?, ?, ?)
            `, [sampleEmployer.organization_name, sampleEmployer.contact_name,
                sampleEmployer.phone, sampleEmployer.email, sampleEmployer.password_hash],
            function(err) {
                if (err) {
                    console.error('Error inserting sample employer:', err.message);
                    return;
                }

                const employerId = this.lastID;

                // Add sample vacancies
                const sampleVacancies = [
                    {
                        subject: 'Математика',
                        work_type: 'замена',
                        start_date: '2025-01-15',
                        end_date: '2025-01-22',
                        schedule_from: '09:00',
                        schedule_to: '15:00',
                        salary_amount: 25000,
                        salary_type: 'в месяц',
                        description: 'Замена преподавателя математики на период болезни. Опыт преподавания в колледже приветствуется.',
                        contact_phone: '+7 (999) 123-45-67',
                        contact_email: 'hr@techno-center.ru',
                        contact_person: 'Иван Петрович'
                    },
                    {
                        subject: 'Информатика',
                        work_type: 'временная',
                        start_date: '2025-01-20',
                        end_date: '2025-02-10',
                        schedule_from: '14:00',
                        schedule_to: '20:00',
                        salary_amount: 30000,
                        salary_type: 'в месяц',
                        description: 'Временная нагрузка по информатике. Требуется знание Python, C++, алгоритмов.',
                        contact_phone: '+7 (999) 123-45-67',
                        contact_email: 'hr@techno-center.ru',
                        contact_person: 'Мария Сергеевна'
                    }
                ];

                sampleVacancies.forEach(vacancy => {
                    db.run(`
                        INSERT INTO vacancies (employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [employerId, vacancy.subject, vacancy.work_type, vacancy.start_date,
                        vacancy.end_date, vacancy.schedule_from, vacancy.schedule_to, vacancy.salary_amount, vacancy.salary_type, vacancy.description, vacancy.contact_phone, vacancy.contact_email, vacancy.contact_person]);
                });

                console.log('Sample data inserted successfully.');
            });
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
        return;
    }
    console.log('Database connection closed.');
});
