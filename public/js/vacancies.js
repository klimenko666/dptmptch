// Vacancies page JavaScript

let currentPage = 1;
const vacanciesPerPage = 10;
let allVacancies = [];
let filteredVacancies = [];

document.addEventListener('DOMContentLoaded', function() {
    loadVacancies();

    // Filters form
    const filtersForm = document.getElementById('filters-form');
    if (filtersForm) {
        filtersForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
});

// Load all vacancies
async function loadVacancies() {
    const vacanciesList = document.getElementById('vacancies-list');
    if (!vacanciesList) return;

    try {
        const response = await fetch('/api/vacancies');
        const data = await response.json();

        if (data.vacancies) {
            allVacancies = data.vacancies;
            filteredVacancies = [...allVacancies];
            displayVacancies();
        } else {
            vacanciesList.innerHTML = '<p>Вакансий не найдено</p>';
        }
    } catch (error) {
        console.error('Error loading vacancies:', error);
        vacanciesList.innerHTML = '<p>Ошибка загрузки вакансий</p>';
    }
}

// Apply filters
function applyFilters() {
    const subject = document.getElementById('subject-filter').value.trim();
    const startDate = document.getElementById('start-date-filter').value;
    const endDate = document.getElementById('end-date-filter').value;
    const minSalary = document.getElementById('salary-filter').value.trim();

    filteredVacancies = allVacancies.filter(vacancy => {
        // Subject filter
        if (subject && !vacancy.subject.toLowerCase().includes(subject.toLowerCase())) {
            return false;
        }

        // Date filters
        if (startDate && new Date(vacancy.start_date) < new Date(startDate)) {
            return false;
        }

        if (endDate && new Date(vacancy.end_date) > new Date(endDate)) {
            return false;
        }

        // Salary filter (simple text matching)
        if (minSalary && !vacancy.salary.toLowerCase().includes(minSalary.toLowerCase())) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    displayVacancies();
}

// Clear filters
function clearFilters() {
    document.getElementById('subject-filter').value = '';
    document.getElementById('start-date-filter').value = '';
    document.getElementById('end-date-filter').value = '';
    document.getElementById('salary-filter').value = '';

    filteredVacancies = [...allVacancies];
    currentPage = 1;
    displayVacancies();
}

// Display vacancies with pagination
function displayVacancies() {
    const vacanciesList = document.getElementById('vacancies-list');
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (!vacanciesList) return;

    const startIndex = (currentPage - 1) * vacanciesPerPage;
    const endIndex = startIndex + vacanciesPerPage;
    const vacanciesToShow = filteredVacancies.slice(startIndex, endIndex);

    if (vacanciesToShow.length === 0) {
        vacanciesList.innerHTML = '<p>Вакансий не найдено</p>';
        if (pagination) pagination.style.display = 'none';
        return;
    }

    const vacanciesHTML = vacanciesToShow.map(vacancy => createVacancyCard(vacancy)).join('');
    vacanciesList.innerHTML = vacanciesHTML;

    // Update pagination
    if (pagination) {
        const totalPages = Math.ceil(filteredVacancies.length / vacanciesPerPage);

        if (pageInfo) {
            pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
        }

        pagination.style.display = totalPages > 1 ? 'flex' : 'none';
    }
}

// Create vacancy card HTML
function createVacancyCard(vacancy) {
    const workTypeText = vacancy.work_type === 'замена' ? 'Замена преподавателя' : 'Временная нагрузка';
    const scheduleText = `${vacancy.schedule_from} - ${vacancy.schedule_to}`;
    const salaryText = `${vacancy.salary_amount} KZT ${vacancy.salary_type}`;
    const statusBadge = vacancy.status ? `<span class="status-badge status-${vacancy.status.toLowerCase()}">${getStatusText(vacancy.status)}</span>` : '';
    const availabilityIndicator = getAvailabilityIndicator(vacancy.status);

    return `
        <div class="vacancy-card ${vacancy.status === 'Открыта' ? 'available' : 'unavailable'}">
            <div class="vacancy-header">
                <div>
                    <h3 class="vacancy-title">${vacancy.subject} ${availabilityIndicator}</h3>
                    <div class="vacancy-meta">
                        <span class="vacancy-meta-item">🏢 <a href="/company/${vacancy.id}" class="company-link">${vacancy.organization_name}</a></span>
                        <span class="vacancy-meta-item">📅 ${formatDate(vacancy.start_date)} - ${formatDate(vacancy.end_date)}</span>
                        <span class="vacancy-meta-item">⏰ ${scheduleText}</span>
                        <span class="vacancy-meta-item">📋 ${workTypeText}</span>
                    </div>
                    ${statusBadge}
                </div>
            </div>
            <p class="vacancy-description">${truncateText(vacancy.description, 150)}</p>
            <div class="vacancy-footer">
                <span class="vacancy-salary">${salaryText}</span>
                <div class="vacancy-actions">
                    <a href="/vacancy/${vacancy.id}" class="btn btn-primary">Подробнее</a>
                </div>
            </div>
        </div>
    `;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredVacancies.length / vacanciesPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displayVacancies();
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

// Get availability indicator
function getAvailabilityIndicator(status) {
    if (status === 'Открыта') {
        return '<span class="availability-indicator available">●</span>';
    } else if (status === 'Забронирована' || status === 'Закрыта') {
        return '<span class="availability-indicator unavailable">●</span>';
    }
    return '';
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
