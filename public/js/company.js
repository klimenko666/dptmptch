// Company detail page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const vacancyId = getVacancyIdFromUrl();
    if (vacancyId) {
        loadCompanyDetail(vacancyId);
    }
});

// Get vacancy ID from URL
function getVacancyIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/company\/(\d+)/);
    return match ? match[1] : null;
}

// Load company details
async function loadCompanyDetail(vacancyId) {
    const companyDetail = document.getElementById('company-detail');
    if (!companyDetail) return;

    try {
        const response = await fetch(`/api/companies/vacancy/${vacancyId}`);
        const data = await response.json();

        if (data.company) {
            displayCompanyDetail(data.company);
        } else {
            companyDetail.innerHTML = '<p>Информация о компании не найдена</p>';
        }
    } catch (error) {
        console.error('Error loading company detail:', error);
        companyDetail.innerHTML = '<p>Ошибка загрузки информации о компании</p>';
    }
}

// Display company details
function displayCompanyDetail(company) {
    const companyDetail = document.getElementById('company-detail');
    if (!companyDetail) return;

    const companyHTML = `
        <div class="company-detail-header">
            <h1 class="company-detail-title">${company.organization_name}</h1>
            <p class="company-detail-location">${formatLocation(company)}</p>
        </div>

        <div class="company-detail-info">
            <div class="info-section">
                <h3>Контактная информация</h3>
                <div class="detail-item">
                    <div class="detail-label">Контактное лицо</div>
                    <div class="detail-value">${company.contact_name}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Телефон</div>
                    <div class="detail-value">
                        <a href="tel:${company.phone}">${company.phone}</a>
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">
                        <a href="mailto:${company.email}">${company.email}</a>
                    </div>
                </div>

                ${company.address ? `
                <div class="detail-item">
                    <div class="detail-label">Адрес</div>
                    <div class="detail-value">${company.address}</div>
                </div>
                ` : ''}
            </div>

            ${company.description ? `
            <div class="info-section">
                <h3>О компании</h3>
                <div class="company-description">
                    ${company.description}
                </div>
            </div>
            ` : ''}
        </div>

        <div class="company-actions">
            <h3>Связаться с компанией</h3>
            <div class="contact-actions">
                <a href="tel:${company.phone}" class="btn btn-primary">📞 Позвонить</a>
                <a href="https://wa.me/${company.phone.replace(/[\s\-\(\)\+]/g, '')}" target="_blank" class="btn btn-secondary">💬 WhatsApp</a>
                <a href="mailto:${company.email}" class="btn btn-secondary">📧 Написать</a>
            </div>
        </div>
    `;

    companyDetail.innerHTML = companyHTML;
}

// Format location information
function formatLocation(company) {
    let location = [];

    if (company.city) {
        location.push(company.city);
    }

    if (company.address) {
        location.push(company.address);
    }

    return location.join(', ') || 'Местоположение не указано';
}

