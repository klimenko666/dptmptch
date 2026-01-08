const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'temp_teachers.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database.');
            }
        });
    }

    // Employers methods
    createEmployer(employerData) {
        return new Promise((resolve, reject) => {
            const { organization_name, contact_name, phone, email, password_hash } = employerData;
            const sql = `
                INSERT INTO employers (organization_name, contact_name, phone, email, password_hash)
                VALUES (?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [organization_name, contact_name, phone, email, password_hash], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...employerData });
                }
            });
        });
    }

    getEmployerByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM employers WHERE email = ?';
            this.db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getEmployerById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, organization_name, contact_name, phone, email, created_at FROM employers WHERE id = ?';
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Vacancies methods
    createVacancy(vacancyData) {
        return new Promise((resolve, reject) => {
            const { employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person } = vacancyData;
            const sql = `
                INSERT INTO vacancies (employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...vacancyData });
                }
            });
        });
    }

    getVacancies(filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT v.*, e.organization_name, e.contact_name
                FROM vacancies v
                JOIN employers e ON v.employer_id = e.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.subject) {
                sql += ' AND v.subject LIKE ?';
                params.push(`%${filters.subject}%`);
            }

            if (filters.start_date) {
                sql += ' AND v.start_date >= ?';
                params.push(filters.start_date);
            }

            if (filters.end_date) {
                sql += ' AND v.end_date <= ?';
                params.push(filters.end_date);
            }

            if (filters.min_salary) {
                // Filter by minimum salary amount
                sql += ' AND v.salary_amount >= ?';
                params.push(parseInt(filters.min_salary));
            }

            sql += ' ORDER BY v.created_at DESC';

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getVacancyById(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT v.*, e.organization_name, e.contact_name, e.phone, e.email
                FROM vacancies v
                JOIN employers e ON v.employer_id = e.id
                WHERE v.id = ?
            `;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getVacanciesByEmployer(employerId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT v.*, e.organization_name
                FROM vacancies v
                JOIN employers e ON v.employer_id = e.id
                WHERE v.employer_id = ?
                ORDER BY v.created_at DESC
            `;
            this.db.all(sql, [employerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    updateVacancy(id, vacancyData) {
        return new Promise((resolve, reject) => {
            const { subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person } = vacancyData;
            const sql = `
                UPDATE vacancies
                SET subject = ?, work_type = ?, start_date = ?, end_date = ?, schedule_from = ?, schedule_to = ?, salary_amount = ?, salary_type = ?, description = ?, contact_phone = ?, contact_email = ?, contact_person = ?
                WHERE id = ?
            `;

            this.db.run(sql, [subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, id });
                }
            });
        });
    }

    deleteVacancy(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM vacancies WHERE id = ?';
            this.db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, id });
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

module.exports = new Database();
