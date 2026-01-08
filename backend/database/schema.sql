-- Database schema for Temporary Teachers Platform

-- Employers table
CREATE TABLE IF NOT EXISTS employers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vacancies table
CREATE TABLE IF NOT EXISTS vacancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    work_type TEXT NOT NULL CHECK (work_type IN ('замена', 'временная')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    schedule_from TEXT NOT NULL,
    schedule_to TEXT NOT NULL,
    salary_amount INTEGER NOT NULL,
    salary_type TEXT NOT NULL CHECK (salary_type IN ('в месяц', 'за час', 'за день', 'за неделю', 'за урок', 'за смену')),
    description TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    contact_person TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES employers (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vacancies_subject ON vacancies(subject);
CREATE INDEX IF NOT EXISTS idx_vacancies_dates ON vacancies(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vacancies_employer ON vacancies(employer_id);
