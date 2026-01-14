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
            const { organization_name, contact_name, phone, email, password_hash, city, address, description } = employerData;
            const sql = `
                INSERT INTO employers (organization_name, contact_name, phone, email, password_hash, city, address, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [organization_name, contact_name, phone, email, password_hash, city || null, address || null, description || null], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, organization_name, contact_name, phone, email, city, address, description });
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
            const sql = 'SELECT id, organization_name, contact_name, phone, email, city, address, description, created_at FROM employers WHERE id = ?';
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
            const { employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, work_days, salary_amount, salary_type, address, description, contact_phone, contact_email, contact_person } = vacancyData;
            const sql = `
                INSERT INTO vacancies (employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, work_days, salary_amount, salary_type, address, description, contact_phone, contact_email, contact_person, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Открыта')
            `;

            this.db.run(sql, [employer_id, subject, work_type, start_date, end_date, schedule_from, schedule_to, work_days ? JSON.stringify(work_days) : null, salary_amount, salary_type, address, description, contact_phone, contact_email, contact_person], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...vacancyData, status: 'Открыта' });
                }
            });
        });
    }

    getVacancies(filters = {}) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT v.*, e.organization_name, e.contact_name, e.city
                FROM vacancies v
                JOIN employers e ON v.employer_id = e.id
                WHERE v.status != 'Архивная'
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
                    // Parse work_days JSON for each row
                    const processedRows = rows.map(row => ({
                        ...row,
                        work_days: row.work_days ? JSON.parse(row.work_days) : null
                    }));
                    resolve(processedRows);
                }
            });
        });
    }

    getVacancyById(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT v.*, e.organization_name, e.contact_name, e.phone, e.email, e.city, e.description
                FROM vacancies v
                JOIN employers e ON v.employer_id = e.id
                WHERE v.id = ?
            `;
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse work_days JSON if exists
                    const processedRow = row ? {
                        ...row,
                        work_days: row.work_days ? JSON.parse(row.work_days) : null
                    } : null;
                    resolve(processedRow);
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
                ORDER BY
                    CASE v.status
                        WHEN 'Открыта' THEN 1
                        WHEN 'Забронирована' THEN 2
                        WHEN 'Закрыта' THEN 3
                        WHEN 'Архивная' THEN 4
                    END,
                    v.created_at DESC
            `;
            this.db.all(sql, [employerId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse work_days JSON for each row
                    const processedRows = rows.map(row => ({
                        ...row,
                        work_days: row.work_days ? JSON.parse(row.work_days) : null
                    }));
                    resolve(processedRows);
                }
            });
        });
    }

    updateVacancy(id, vacancyData) {
        return new Promise((resolve, reject) => {
            const { subject, work_type, start_date, end_date, schedule_from, schedule_to, work_days, salary_amount, salary_type, address, description, contact_phone, contact_email, contact_person, status } = vacancyData;
            const sql = `
                UPDATE vacancies
                SET subject = ?, work_type = ?, start_date = ?, end_date = ?, schedule_from = ?, schedule_to = ?, work_days = ?, salary_amount = ?, salary_type = ?, address = ?, description = ?, contact_phone = ?, contact_email = ?, contact_person = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            this.db.run(sql, [subject, work_type, start_date, end_date, schedule_from, schedule_to, work_days ? JSON.stringify(work_days) : null, salary_amount, salary_type, address, description, contact_phone, contact_email, contact_person, status || 'Открыта', id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, id });
                }
            });
        });
    }

    updateVacancyStatus(id, status) {
        return new Promise((resolve, reject) => {
            const validStatuses = ['Открыта', 'Забронирована', 'Закрыта', 'Архивная'];
            if (!validStatuses.includes(status)) {
                reject(new Error('Invalid status'));
                return;
            }

            const sql = 'UPDATE vacancies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(sql, [status, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, id });
                }
            });
        });
    }

    archiveExpiredVacancies() {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE vacancies SET status = 'Архивная', updated_at = CURRENT_TIMESTAMP WHERE status != 'Архивная' AND end_date < date('now')`;
            this.db.run(sql, [], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    getArchivedVacanciesByEmployer(employerId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT v.*, e.organization_name
                FROM vacancies v
                JOIN employers e ON v.employer_id = e.id
                WHERE v.employer_id = ? AND v.status = 'Архивная'
                ORDER BY v.updated_at DESC
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

    updateEmployerProfile(id, profileData) {
        return new Promise((resolve, reject) => {
            const { organization_name, contact_name, phone, email, description } = profileData;
            const sql = `
                UPDATE employers
                SET organization_name = ?, contact_name = ?, phone = ?, email = ?, description = ?
                WHERE id = ?
            `;

            this.db.run(sql, [organization_name, contact_name, phone, email, description, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, id });
                }
            });
        });
    }

    getEmployerProfile(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, organization_name, contact_name, phone, email, city, address, description, created_at FROM employers WHERE id = ?';
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    restoreVacancy(id) {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE vacancies SET status = 'Открыта', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'Архивная'";
            this.db.run(sql, [id], function(err) {
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
