// Dashboard JavaScript

let currentEmployer = null;
let editingVacancyId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthAndLoadData();

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Create vacancy button
    const createVacancyBtn = document.getElementById('create-vacancy-btn');
    if (createVacancyBtn) {
        createVacancyBtn.addEventListener('click', () => openVacancyModal());
    }

    // Modal controls
    const modalClose = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('cancel-btn');

    if (modalClose) {
        modalClose.addEventListener('click', closeVacancyModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeVacancyModal);
    }

    // Close modal on outside click
    const modal = document.getElementById('vacancy-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVacancyModal();
            }
        });
    }

    // Vacancy form
    const vacancyForm = document.getElementById('vacancy-form');
    if (vacancyForm) {
        vacancyForm.addEventListener('submit', handleVacancySubmit);
    }
});

// Check authentication and load employer data
async function checkAuthAndLoadData() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            currentEmployer = data.employer;
            updateWelcomeMessage();
            loadEmployerVacancies();
        } else {
            // Not authenticated, redirect to login
            window.location.href = '/register';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/register';
    }
}

// Update welcome message
function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage && currentEmployer) {
        welcomeMessage.textContent = `Добро пожаловать, ${currentEmployer.organization_name}!`;
    }
}

// Load employer's vacancies
async function loadEmployerVacancies() {
    const vacanciesList = document.getElementById('my-vacancies');
    if (!vacanciesList) return;

    try {
        const response = await fetch('/api/employer/vacancies');
        const data = await response.json();

        if (data.vacancies && data.vacancies.length > 0) {
            const vacanciesHTML = data.vacancies.map(vacancy => createEmployerVacancyCard(vacancy)).join('');
            vacanciesList.innerHTML = vacanciesHTML;
        } else {
            vacanciesList.innerHTML = '<p>У вас пока нет вакансий. <a href="#" id="create-first-vacancy">Создайте первую вакансию</a></p>';

            // Add event listener for create first vacancy link
            const createLink = document.getElementById('create-first-vacancy');
            if (createLink) {
                createLink.addEventListener('click', () => openVacancyModal());
            }
        }
    } catch (error) {
        console.error('Error loading employer vacancies:', error);
        vacanciesList.innerHTML = '<p>Ошибка загрузки вакансий</p>';
    }
}

// Create vacancy card for employer dashboard
function createEmployerVacancyCard(vacancy) {
    const workTypeText = vacancy.work_type === 'замена' ? 'Замена' : 'Временная';
    const scheduleText = `${vacancy.schedule_from} - ${vacancy.schedule_to}`;
    const salaryText = `${vacancy.salary_amount} KZT ${vacancy.salary_type}`;

    return `
        <div class="vacancy-card" data-id="${vacancy.id}">
            <div class="vacancy-header">
                <div>
                    <h3 class="vacancy-title">${vacancy.subject}</h3>
                    <div class="vacancy-meta">
                        <span class="vacancy-meta-item">${workTypeText}</span>
                        <span class="vacancy-meta-item">${formatDate(vacancy.start_date)} - ${formatDate(vacancy.end_date)}</span>
                        <span class="vacancy-meta-item">${scheduleText}</span>
                    </div>
                </div>
            </div>
            <p class="vacancy-description">${truncateText(vacancy.description, 100)}</p>
            <div class="vacancy-footer">
                <span class="vacancy-salary">${salaryText}</span>
                <div class="vacancy-actions">
                    <button class="btn btn-secondary edit-btn" data-id="${vacancy.id}">Редактировать</button>
                    <button class="btn btn-secondary delete-btn" data-id="${vacancy.id}">Удалить</button>
                </div>
            </div>
        </div>
    `;
}

// Open vacancy modal for creating or editing
function openVacancyModal(vacancyId = null) {
    const modal = document.getElementById('vacancy-modal');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const form = document.getElementById('vacancy-form');

    if (!modal || !modalTitle || !submitBtn || !form) return;

    editingVacancyId = vacancyId;

    if (vacancyId) {
        modalTitle.textContent = 'Редактировать вакансию';
        submitBtn.textContent = 'Сохранить изменения';
        // Load vacancy data for editing
        loadVacancyForEditing(vacancyId);
    } else {
        modalTitle.textContent = 'Создать вакансию';
        submitBtn.textContent = 'Создать вакансию';
        form.reset();
    }

    modal.classList.add('active');
}

// Close vacancy modal
function closeVacancyModal() {
    const modal = document.getElementById('vacancy-modal');
    if (modal) {
        modal.classList.remove('active');
        editingVacancyId = null;
    }
}

// Load vacancy data for editing
async function loadVacancyForEditing(vacancyId) {
    try {
        const response = await fetch(`/api/vacancies/${vacancyId}`);
        const data = await response.json();

        if (data.vacancy) {
            fillVacancyForm(data.vacancy);
        }
    } catch (error) {
        console.error('Error loading vacancy for editing:', error);
        showMessage('Ошибка загрузки вакансии', 'error');
    }
}

// Fill form with vacancy data
function fillVacancyForm(vacancy) {
    document.getElementById('vacancy-subject').value = vacancy.subject;
    document.getElementById('vacancy-type').value = vacancy.work_type;
    document.getElementById('vacancy-start').value = vacancy.start_date;
    document.getElementById('vacancy-end').value = vacancy.end_date;
    document.getElementById('vacancy-schedule-from').value = vacancy.schedule_from;
    document.getElementById('vacancy-schedule-to').value = vacancy.schedule_to;
    document.getElementById('vacancy-salary-amount').value = vacancy.salary_amount;
    document.getElementById('vacancy-salary-type').value = vacancy.salary_type;
    document.getElementById('vacancy-description').value = vacancy.description;
    document.getElementById('vacancy-contact-phone').value = vacancy.contact_phone;
    document.getElementById('vacancy-contact-email').value = vacancy.contact_email || '';
    document.getElementById('vacancy-contact-person').value = vacancy.contact_person || '';
}

// Handle vacancy form submission
async function handleVacancySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const vacancyData = {
        subject: formData.get('subject'),
        work_type: formData.get('work_type'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        schedule_from: formData.get('schedule_from'),
        schedule_to: formData.get('schedule_to'),
        salary_amount: formData.get('salary_amount'),
        salary_type: formData.get('salary_type'),
        description: formData.get('description'),
        contact_phone: formData.get('contact_phone'),
        contact_email: formData.get('contact_email'),
        contact_person: formData.get('contact_person')
    };

    try {
        let response;
        if (editingVacancyId) {
            // Update existing vacancy
            response = await fetch(`/api/employer/vacancies/${editingVacancyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vacancyData)
            });
        } else {
            // Create new vacancy
            response = await fetch('/api/employer/vacancies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vacancyData)
            });
        }

        const data = await response.json();

        if (response.ok) {
            const successMessage = editingVacancyId ? 'Вакансия обновлена!' : 'Вакансия создана!';
            showMessage(successMessage, 'success');
            closeVacancyModal();
            loadEmployerVacancies();
        } else {
            showMessage(data.error || 'Ошибка сохранения вакансии', 'error');
        }
    } catch (error) {
        console.error('Vacancy submit error:', error);
        showMessage('Ошибка сети. Попробуйте позже.', 'error');
    }
}

// Handle vacancy actions (edit/delete)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const vacancyId = e.target.getAttribute('data-id');
        openVacancyModal(vacancyId);
    } else if (e.target.classList.contains('delete-btn')) {
        const vacancyId = e.target.getAttribute('data-id');
        if (confirm('Вы уверены, что хотите удалить эту вакансию?')) {
            deleteVacancy(vacancyId);
        }
    }
});

// Delete vacancy
async function deleteVacancy(vacancyId) {
    try {
        const response = await fetch(`/api/employer/vacancies/${vacancyId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Вакансия удалена', 'success');
            loadEmployerVacancies();
        } else {
            const data = await response.json();
            showMessage(data.error || 'Ошибка удаления вакансии', 'error');
        }
    } catch (error) {
        console.error('Delete vacancy error:', error);
        showMessage('Ошибка сети. Попробуйте позже.', 'error');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/';
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error, .success');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;

    // Insert at the top of the dashboard section
    const dashboardSection = document.querySelector('.dashboard-section');
    if (dashboardSection) {
        dashboardSection.insertBefore(messageDiv, dashboardSection.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}
