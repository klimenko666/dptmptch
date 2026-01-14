// Vacancy detail page JavaScript

// Helper function to format work days
function formatWorkDays(workDays) {
    if (!workDays || !Array.isArray(workDays) || workDays.length === 0) return 'Не указано';

    const dayNames = {
        monday: 'Понедельник',
        tuesday: 'Вторник',
        wednesday: 'Среда',
        thursday: 'Четверг',
        friday: 'Пятница',
        saturday: 'Суббота',
        sunday: 'Воскресенье'
    };

    return workDays.map(day => dayNames[day] || day).join(', ');
}

document.addEventListener('DOMContentLoaded', function() {
    const vacancyId = getVacancyIdFromUrl();
    if (vacancyId) {
        loadVacancyDetail(vacancyId);
    }
});

// Get vacancy ID from URL
function getVacancyIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/vacancy\/(\d+)/);
    return match ? match[1] : null;
}

// Load vacancy details
async function loadVacancyDetail(vacancyId) {
    const vacancyDetail = document.getElementById('vacancy-detail');
    if (!vacancyDetail) return;

    try {
        const response = await fetch(`/api/vacancies/${vacancyId}`);
        const data = await response.json();

        if (data.vacancy) {
            displayVacancyDetail(data.vacancy);
        } else {
            vacancyDetail.innerHTML = '<p>Вакансия не найдена</p>';
        }
    } catch (error) {
        console.error('Error loading vacancy detail:', error);
        vacancyDetail.innerHTML = '<p>Ошибка загрузки вакансии</p>';
    }
}

// Display vacancy details
function displayVacancyDetail(vacancy) {
    const vacancyDetail = document.getElementById('vacancy-detail');
    if (!vacancyDetail) return;

    const workTypeText = vacancy.work_type === 'замена' ? 'Замена преподавателя' : 'Временная нагрузка';

    const vacancyHTML = `
        <div class="vacancy-detail-header">
            <h1 class="vacancy-detail-title">${vacancy.subject}</h1>
            <p class="vacancy-detail-org">
                <a href="/company/${vacancy.id}" class="company-link">${vacancy.organization_name}</a>
            </p>
            ${vacancy.status ? `<span class="status-badge status-${vacancy.status.toLowerCase()}">${getStatusText(vacancy.status)}</span>` : ''}
        </div>

        <div class="vacancy-detail-grid">
            <div class="detail-item">
                <div class="detail-label">Тип работы</div>
                <div class="detail-value">${workTypeText}</div>
            </div>

            <div class="detail-item">
                <div class="detail-label">Период работы</div>
                <div class="detail-value">${formatDate(vacancy.start_date)} - ${formatDate(vacancy.end_date)}</div>
            </div>

            <div class="detail-item">
                <div class="detail-label">График работы</div>
                <div class="detail-value">${vacancy.schedule_from} - ${vacancy.schedule_to}</div>
            </div>

            ${vacancy.work_days ? `
            <div class="detail-item">
                <div class="detail-label">Дни работы</div>
                <div class="detail-value">${formatWorkDays(vacancy.work_days)}</div>
            </div>
            ` : ''}

            <div class="detail-item">
                <div class="detail-label">Оплата</div>
                <div class="detail-value">${vacancy.salary_amount} KZT ${vacancy.salary_type}</div>
            </div>

            ${vacancy.address ? `
            <div class="detail-item">
                <div class="detail-label">Адрес</div>
                <div class="detail-value">📍 ${vacancy.address}</div>
            </div>
            ` : ''}
        </div>

        <div class="vacancy-detail-description">
            <div class="detail-label">Описание вакансии</div>
            <div class="detail-value">${vacancy.description}</div>
        </div>

        <div class="vacancy-contact">
            <div class="detail-label">Контакты для связи</div>
            <div class="detail-value">${formatContactInfo(vacancy)}</div>
            <div class="contact-actions">
                ${createContactButtons(vacancy)}
            </div>
        </div>
    `;

    vacancyDetail.innerHTML = vacancyHTML;
}

// Format contact information
function formatContactInfo(vacancy) {
    let contactInfo = [];

    if (vacancy.contact_phone) {
        contactInfo.push(`📞 ${vacancy.contact_phone}`);
    }

    if (vacancy.contact_email) {
        contactInfo.push(`📧 ${vacancy.contact_email}`);
    }

    if (vacancy.contact_person) {
        contactInfo.push(`👤 ${vacancy.contact_person}`);
    }

    return contactInfo.join('<br>');
}

// Create contact buttons
function createContactButtons(vacancy) {
    let buttons = '';

    // Phone button
    if (vacancy.contact_phone) {
        const phoneNumber = vacancy.contact_phone.replace(/[\s\-\(\)]/g, '');
        buttons += `<a href="tel:${phoneNumber}" class="btn btn-primary">📞 Позвонить</a>`;
        buttons += `<a href="https://wa.me/${phoneNumber.replace('+', '')}" target="_blank" class="btn btn-secondary">💬 WhatsApp</a>`;
    }

    // Email button
    if (vacancy.contact_email) {
        buttons += `<a href="mailto:${vacancy.contact_email}" class="btn btn-secondary">📧 Написать</a>`;
    }

    // Map button (OpenStreetMap) - open vacancy address only
    if (vacancy.address) {
        const encodedAddress = encodeURIComponent(vacancy.address);
        buttons += `<a href="https://www.openstreetmap.org/search?query=${encodedAddress}" target="_blank" class="btn btn-outline" title="Показать адрес вакансии на карте">🗺️ На карте</a>`;
    }

    return buttons;
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'Открыта': 'Открыта',
        'Забронирована': 'Забронирована',
        'Закрыта': 'Закрыта',
        'Архивная': 'В архиве'
    };
    return statusMap[status] || status;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}
