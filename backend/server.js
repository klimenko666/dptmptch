const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
const emailService = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to archive expired vacancies
async function archiveExpiredVacancies() {
    try {
        console.log('Checking for expired vacancies to archive...');
        const result = await db.archiveExpiredVacancies();
        if (result.changes > 0) {
            console.log(`Archived ${result.changes} expired vacancies`);
        }
    } catch (error) {
        console.error('Error archiving expired vacancies:', error);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
    secret: 'temp-teachers-platform-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.employerId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Temp Teachers Platform API is running' });
});

// Employer registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { organization_name, contact_name, phone, email, password } = req.body;

        // Validation
        if (!organization_name || !contact_name || !phone || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if employer already exists
        const existingEmployer = await db.getEmployerByEmail(email);
        if (existingEmployer) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create employer
        const employer = await db.createEmployer({
            organization_name,
            contact_name,
            phone,
            email,
            password_hash
        });

        // Set session
        req.session.employerId = employer.id;

        res.status(201).json({
            message: 'Registration successful',
            employer: {
                id: employer.id,
                organization_name: employer.organization_name,
                contact_name: employer.contact_name,
                email: employer.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Employer login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find employer
        const employer = await db.getEmployerByEmail(email);
        if (!employer) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, employer.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.employerId = employer.id;

        res.json({
            message: 'Login successful',
            employer: {
                id: employer.id,
                organization_name: employer.organization_name,
                contact_name: employer.contact_name,
                email: employer.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Employer logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get current employer session
app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const employer = await db.getEmployerById(req.session.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }
        res.json({ employer });
    } catch (error) {
        console.error('Get employer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all vacancies (public)
app.get('/api/vacancies', async (req, res) => {
    try {
        const filters = {
            subject: req.query.subject,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            min_salary: req.query.min_salary
        };

        const vacancies = await db.getVacancies(filters);
        res.json({ vacancies });
    } catch (error) {
        console.error('Get vacancies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single vacancy (public)
app.get('/api/vacancies/:id', async (req, res) => {
    try {
        const vacancy = await db.getVacancyById(req.params.id);
        if (!vacancy) {
            return res.status(404).json({ error: 'Vacancy not found' });
        }
        res.json({ vacancy });
    } catch (error) {
        console.error('Get vacancy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get employer's vacancies (protected)
app.get('/api/employer/vacancies', requireAuth, async (req, res) => {
    try {
        const vacancies = await db.getVacanciesByEmployer(req.session.employerId);
        res.json({ vacancies });
    } catch (error) {
        console.error('Get employer vacancies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get employer's archived vacancies (protected)
app.get('/api/employer/vacancies/archived', requireAuth, async (req, res) => {
    try {
        const vacancies = await db.getArchivedVacanciesByEmployer(req.session.employerId);
        res.json({ vacancies });
    } catch (error) {
        console.error('Get employer archived vacancies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get employer profile (protected)
app.get('/api/employer/profile', requireAuth, async (req, res) => {
    try {
        const employer = await db.getEmployerProfile(req.session.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }
        res.json({ employer });
    } catch (error) {
        console.error('Get employer profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update employer profile (protected)
app.put('/api/employer/profile', requireAuth, async (req, res) => {
    try {
        const { organization_name, contact_name, phone, email, city, address, description } = req.body;

        // Validation
        if (!organization_name || !contact_name || !phone || !email) {
            return res.status(400).json({ error: 'Required fields: organization_name, contact_name, phone, email' });
        }

        // Check if email is already taken by another employer
        const existingEmployer = await db.getEmployerByEmail(email);
        if (existingEmployer && existingEmployer.id !== req.session.employerId) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const result = await db.updateEmployerProfile(req.session.employerId, {
            organization_name,
            contact_name,
            phone,
            email,
            city,
            address,
            description
        });

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        const updatedEmployer = await db.getEmployerProfile(req.session.employerId);
        res.json({ employer: updatedEmployer });
    } catch (error) {
        console.error('Update employer profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get company profile by vacancy ID (public)
app.get('/api/companies/vacancy/:vacancyId', async (req, res) => {
    try {
        const vacancy = await db.getVacancyById(req.params.vacancyId);
        if (!vacancy) {
            return res.status(404).json({ error: 'Vacancy not found' });
        }

        const employer = await db.getEmployerProfile(vacancy.employer_id);
        if (!employer) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({ company: employer });
    } catch (error) {
        console.error('Get company profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create vacancy (protected)
app.post('/api/employer/vacancies', requireAuth, async (req, res) => {
    try {
        const { subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person } = req.body;

        // Validation
        if (!subject || !work_type || !start_date || !end_date || !schedule_from || !schedule_to || !salary_amount || !salary_type || !description || !contact_phone) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (!['замена', 'временная'].includes(work_type)) {
            return res.status(400).json({ error: 'Invalid work type' });
        }

        if (!['в месяц', 'за час', 'за день', 'за неделю', 'за урок', 'за смену'].includes(salary_type)) {
            return res.status(400).json({ error: 'Invalid salary type' });
        }

        if (isNaN(salary_amount) || salary_amount <= 0) {
            return res.status(400).json({ error: 'Salary amount must be a positive number' });
        }

        const vacancy = await db.createVacancy({
            employer_id: req.session.employerId,
            subject,
            work_type,
            start_date,
            end_date,
            schedule_from,
            schedule_to,
            salary_amount: parseInt(salary_amount),
            salary_type,
            description,
            contact_phone,
            contact_email,
            contact_person
        });

        // Send email notification
        try {
            const employer = await db.getEmployerById(req.session.employerId);
            await emailService.sendVacancyCreatedNotification(employer, vacancy);
        } catch (emailError) {
            console.error('Failed to send vacancy creation email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({ vacancy });
    } catch (error) {
        console.error('Create vacancy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update vacancy (protected)
app.put('/api/employer/vacancies/:id', requireAuth, async (req, res) => {
    try {
        const vacancyId = req.params.id;
        const { subject, work_type, start_date, end_date, schedule_from, schedule_to, salary_amount, salary_type, description, contact_phone, contact_email, contact_person } = req.body;

        // Check if vacancy belongs to employer
        const existingVacancy = await db.getVacancyById(vacancyId);
        if (!existingVacancy || existingVacancy.employer_id !== req.session.employerId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Validation
        if (!subject || !work_type || !start_date || !end_date || !schedule_from || !schedule_to || !salary_amount || !salary_type || !description || !contact_phone) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (!['замена', 'временная'].includes(work_type)) {
            return res.status(400).json({ error: 'Invalid work type' });
        }

        if (!['в месяц', 'за час', 'за день', 'за неделю', 'за урок', 'за смену'].includes(salary_type)) {
            return res.status(400).json({ error: 'Invalid salary type' });
        }

        if (isNaN(salary_amount) || salary_amount <= 0) {
            return res.status(400).json({ error: 'Salary amount must be a positive number' });
        }

        const result = await db.updateVacancy(vacancyId, {
            subject,
            work_type,
            start_date,
            end_date,
            schedule_from,
            schedule_to,
            salary_amount: parseInt(salary_amount),
            salary_type,
            description,
            contact_phone,
            contact_email,
            contact_person
        });

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Vacancy not found' });
        }

        const updatedVacancy = await db.getVacancyById(vacancyId);
        res.json({ vacancy: updatedVacancy });
    } catch (error) {
        console.error('Update vacancy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update vacancy status (protected)
app.patch('/api/employer/vacancies/:id/status', requireAuth, async (req, res) => {
    try {
        const vacancyId = req.params.id;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['Открыта', 'Забронирована', 'Закрыта'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: Открыта, Забронирована, Закрыта' });
        }

        // Check if vacancy belongs to employer
        const existingVacancy = await db.getVacancyById(vacancyId);
        if (!existingVacancy || existingVacancy.employer_id !== req.session.employerId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Validate status transition
        if (existingVacancy.status === 'Архивная') {
            return res.status(400).json({ error: 'Cannot change status of archived vacancy' });
        }

        if (existingVacancy.status === 'Закрыта' && status !== 'Открыта') {
            return res.status(400).json({ error: 'Closed vacancies can only be reopened' });
        }

        const result = await db.updateVacancyStatus(vacancyId, status);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Vacancy not found' });
        }

        const updatedVacancy = await db.getVacancyById(vacancyId);

        // Send email notification if vacancy is closed
        if (status === 'Закрыта') {
            try {
                const employer = await db.getEmployerById(req.session.employerId);
                await emailService.sendVacancyClosedNotification(employer, updatedVacancy);
            } catch (emailError) {
                console.error('Failed to send vacancy closed email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.json({ vacancy: updatedVacancy });
    } catch (error) {
        console.error('Update vacancy status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete vacancy (protected)
app.delete('/api/employer/vacancies/:id', requireAuth, async (req, res) => {
    try {
        const vacancyId = req.params.id;

        // Check if vacancy belongs to employer
        const existingVacancy = await db.getVacancyById(vacancyId);
        if (!existingVacancy || existingVacancy.employer_id !== req.session.employerId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await db.deleteVacancy(vacancyId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Vacancy not found' });
        }

        res.json({ message: 'Vacancy deleted successfully' });
    } catch (error) {
        console.error('Delete vacancy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/vacancies', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/vacancies.html'));
});

app.get('/vacancy/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/vacancy.html'));
});

app.get('/company/:vacancyId', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/company.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`Temp Teachers Platform server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);

    // Archive expired vacancies on startup
    await archiveExpiredVacancies();

    // Set up daily check for expired vacancies (every 24 hours)
    setInterval(archiveExpiredVacancies, 24 * 60 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close();
    process.exit(0);
});
