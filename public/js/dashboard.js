// Dashboard JavaScript

let currentEmployer = null;
let editingVacancyId = null;
let map = null;
let marker = null;
let selectedAddress = '';
let searchMarker = null;

// Initialize date validation on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDateValidation();
});

// Initialize date validation
function initializeDateValidation() {
    const today = new Date().toISOString().split('T')[0];

    // Set min date for start date input
    const startDateInput = document.getElementById('vacancy-start');
    if (startDateInput) {
        startDateInput.min = today;
        // If current value is in the past, set it to today
        if (startDateInput.value && startDateInput.value < today) {
            startDateInput.value = today;
            updateEndDateMin();
        }
    }

    // Set min date for end date input
    updateEndDateMin();
}

// Update minimum date for end date when start date changes
function updateEndDateMin() {
    const startDateInput = document.getElementById('vacancy-start');
    const endDateInput = document.getElementById('vacancy-end');

    if (startDateInput && endDateInput) {
        const startDate = startDateInput.value;
        if (startDate) {
            endDateInput.min = startDate;
            // If end date is before start date, set it to start date
            if (endDateInput.value && endDateInput.value < startDate) {
                endDateInput.value = startDate;
            }
        }
    }
}

// Validate that end date is not before start date
function validateDates() {
    const startDateInput = document.getElementById('vacancy-start');
    const endDateInput = document.getElementById('vacancy-end');

    if (startDateInput && endDateInput) {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (endDate < startDate) {
            showMessage('Дата окончания не может быть раньше даты начала!', 'error');
            endDateInput.value = startDateInput.value;
        }
    }
}

// Helper function to format work days
function formatWorkDays(workDays) {
    if (!workDays || !Array.isArray(workDays) || workDays.length === 0) return '';

    const dayNames = {
        monday: 'Пн',
        tuesday: 'Вт',
        wednesday: 'Ср',
        thursday: 'Чт',
        friday: 'Пт',
        saturday: 'Сб',
        sunday: 'Вс'
    };

    const shortNames = workDays.map(day => dayNames[day] || day).join(', ');
    return `📅 ${shortNames}`;
}

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

    // Edit profile button
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => openProfileModal());
    }

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

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

    // Address picker button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'pick-address-btn') {
            openAddressPicker();
        }
    });

    // Address picker modal controls
    const addressPickerClose = document.getElementById('address-picker-close');
    const confirmAddressBtn = document.getElementById('confirm-address-btn');
    const mapSearchBtn = document.getElementById('map-search-btn');
    const mapSearchInput = document.getElementById('map-search-input');

    if (addressPickerClose) {
        addressPickerClose.addEventListener('click', closeAddressPicker);
    }

    if (confirmAddressBtn) {
        confirmAddressBtn.addEventListener('click', confirmSelectedAddress);
    }

    if (mapSearchBtn) {
        mapSearchBtn.addEventListener('click', () => {
            const searchQuery = mapSearchInput.value.trim();
            if (searchQuery) {
                geocodeAddress(searchQuery);
            }
        });
    }

    if (mapSearchInput) {
        mapSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchQuery = mapSearchInput.value.trim();
                if (searchQuery) {
                    geocodeAddress(searchQuery);
                }
            }
        });
    }

    // Close address picker modal on outside click
    const addressPickerModal = document.getElementById('address-picker-modal');
    if (addressPickerModal) {
        addressPickerModal.addEventListener('click', function(e) {
            if (e.target === addressPickerModal) {
                closeAddressPicker();
            }
        });
    }

    // Address picker modal controls
    document.addEventListener('click', function(e) {
        if (e.target.id === 'address-picker-close' || e.target.id === 'address-picker-cancel') {
            closeAddressPicker();
        } else if (e.target.id === 'address-picker-confirm') {
            confirmSelectedAddress();
        } else if (e.target.id === 'map-search-btn') {
            searchOnMap();
        }
    });

    // Search on Enter key in map search input
    document.addEventListener('keypress', function(e) {
        if (e.target.id === 'map-search-input' && e.key === 'Enter') {
            searchOnMap();
        }
    });

    // Vacancy form
    const vacancyForm = document.getElementById('vacancy-form');
    if (vacancyForm) {
        vacancyForm.addEventListener('submit', handleVacancySubmit);
    }

    // Status change buttons (delegated event)
    const activeVacanciesList = document.getElementById('active-vacancies');
    if (activeVacanciesList) {
        activeVacanciesList.addEventListener('click', function(e) {
            if (e.target.classList.contains('status-btn')) {
                const vacancyId = e.target.dataset.id;
                const newStatus = e.target.dataset.status;
                if (vacancyId && newStatus) {
                    handleStatusChange(vacancyId, newStatus);
                }
            }
        });
    }

    // Profile modal controls
    const profileModalClose = document.getElementById('profile-modal-close');
    const profileCancelBtn = document.getElementById('profile-cancel-btn');

    if (profileModalClose) {
        profileModalClose.addEventListener('click', closeProfileModal);
    }

    if (profileCancelBtn) {
        profileCancelBtn.addEventListener('click', closeProfileModal);
    }

    // Profile modal outside click
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                closeProfileModal();
            }
        });
    }

    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
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
            loadActiveVacancies(); // Load active vacancies by default
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

            // Add event listeners for action buttons
            setupVacancyActionListeners();
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
    const statusBadge = vacancy.status ? `<span class="status-badge status-${vacancy.status.toLowerCase()}">${getStatusText(vacancy.status)}</span>` : '';
    const statusButtons = createStatusButtons(vacancy);

    // Work days display
    const workDaysText = vacancy.work_days ? formatWorkDays(vacancy.work_days) : '';

    // Address display
    const addressText = vacancy.address ? `<span class="vacancy-address">📍 ${vacancy.address}</span>` : '';

    // Action buttons based on status
    let actionButtons = '';
    if (vacancy.status === 'Архивная') {
        actionButtons = `
            <button class="btn btn-outline restore-btn" data-id="${vacancy.id}">Восстановить</button>
            <button class="btn btn-danger delete-btn" data-id="${vacancy.id}">Удалить навсегда</button>
        `;
    } else {
        actionButtons = `
            ${statusButtons}
            <button class="btn btn-outline edit-btn" data-id="${vacancy.id}">Редактировать</button>
            <button class="btn btn-warning archive-btn" data-id="${vacancy.id}">Архивировать</button>
        `;
    }

    return `
        <div class="vacancy-card" data-id="${vacancy.id}">
            <div class="vacancy-header">
                <div>
                    <h3 class="vacancy-title">${vacancy.subject}</h3>
                    <div class="vacancy-meta">
                        <span class="vacancy-meta-item">${workTypeText}</span>
                        <span class="vacancy-meta-item">${formatDate(vacancy.start_date)} - ${formatDate(vacancy.end_date)}</span>
                        <span class="vacancy-meta-item">${scheduleText}</span>
                        ${workDaysText ? `<span class="vacancy-meta-item">${workDaysText}</span>` : ''}
                    </div>
                    ${addressText}
                    ${statusBadge}
                </div>
            </div>
            <p class="vacancy-description">${truncateText(vacancy.description, 100)}</p>
            <div class="vacancy-footer">
                <span class="vacancy-salary">${salaryText}</span>
                <div class="vacancy-actions">
                    ${actionButtons}
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
        // Initialize date validation for new vacancy
        setTimeout(() => {
            initializeDateValidation();
        }, 100);
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

// Global variables for map functionality (continued from top of file)
// map, marker, selectedAddress, searchMarker already declared at top

// Open address picker modal with embedded OpenStreetMap
function openAddressPicker() {
    const modal = document.getElementById('address-picker-modal');
    if (!modal) return;

    modal.classList.add('active');

    // Initialize map after modal is shown
    setTimeout(() => {
        initializeMap();
    }, 100);
}

// Close address picker modal
function closeAddressPicker() {
    const modal = document.getElementById('address-picker-modal');
    if (modal) {
        modal.classList.remove('active');
    }

    // Clean up map
    if (map) {
        map.remove();
        map = null;
        marker = null;
        searchMarker = null;
        selectedAddress = '';
    }
}

// Confirm selected address
function confirmSelectedAddress() {
    const selectedAddressInput = document.getElementById('selected-address-input');
    const vacancyAddressInput = document.getElementById('vacancy-address');

    if (selectedAddressInput && vacancyAddressInput) {
        const selectedAddress = selectedAddressInput.value.trim();
        if (selectedAddress && selectedAddress !== '') {
            vacancyAddressInput.value = selectedAddress;
            closeAddressPicker();
            showMessage('Адрес успешно выбран!', 'success');
        } else {
            showMessage('Пожалуйста, выберите адрес на карте', 'warning');
        }
    }
}

// Initialize Leaflet map with OpenStreetMap
function initializeMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // Clear any existing map
    mapContainer.innerHTML = '';

    try {
        // Default center on Almaty
        const center = [43.238949, 76.889709];

        // Initialize Leaflet map
        map = L.map('map-container').setView(center, 12);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Add click handler to map
        map.on('click', function(e) {
            selectLocationOnMap(e.latlng.lat, e.latlng.lng);
        });

        // Try to geocode current address if exists
        const currentAddress = document.getElementById('vacancy-address').value;
        if (currentAddress) {
            // Fill search input with current address
            const mapSearchInput = document.getElementById('map-search-input');
            if (mapSearchInput) {
                mapSearchInput.value = currentAddress;
            }
            geocodeAddress(currentAddress);
        }

        console.log('OpenStreetMap карта инициализирована');
    } catch (error) {
        console.error('Error loading OpenStreetMap:', error);
        showMessage('Ошибка загрузки карты', 'error');
    }
}

// Select location on map and get address
function selectLocationOnMap(lat, lng) {
    // Remove existing marker
    if (marker) {
        map.removeLayer(marker);
    }

    // Add new marker
    marker = L.marker([lat, lng]).addTo(map);

    // Center map on marker
    map.setView([lat, lng], 16);

    // Get address from coordinates (reverse geocoding)
    reverseGeocode(lat, lng);
}

// Reverse geocoding - get address from coordinates using Nominatim
function reverseGeocode(lat, lng) {
    if (!map) return;

    // Show coordinates initially
    selectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById('selected-address-input').value = `Загрузка адреса...`;

    // Use Nominatim API for reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ru`;

    fetch(nominatimUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                // Extract meaningful address parts
                const address = data.display_name;
                selectedAddress = address;
                document.getElementById('selected-address-input').value = address;
                console.log('Адрес найден:', address);
            } else {
                // Fallback to coordinates
                document.getElementById('selected-address-input').value = `Координаты: ${selectedAddress}`;
                console.log('Адрес не найден, используем координаты');
            }
        })
        .catch(error => {
            console.error('Ошибка геокодирования:', error);
            document.getElementById('selected-address-input').value = `Координаты: ${selectedAddress}`;
        });
}

// Search for address on map
function searchOnMap() {
    const searchInput = document.getElementById('map-search-input');
    if (!searchInput || !searchInput.value.trim()) return;

    geocodeAddress(searchInput.value.trim());
}

// Geocode address - get coordinates from address
function geocodeAddress(address) {
    if (!map || !address.trim()) return;

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=KZ&accept-language=ru`;

    fetch(nominatimUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const location = data[0];
                const lat = parseFloat(location.lat);
                const lng = parseFloat(location.lon);

                // Remove existing search marker
                if (searchMarker) {
                    map.removeLayer(searchMarker);
                }

                // Add search marker
                searchMarker = L.marker([lat, lng]).addTo(map)
                    .bindPopup(`<b>${location.display_name}</b>`)
                    .openPopup();

                // Center map on location
                map.setView([lat, lng], 16);

                // Select this location
                selectLocationOnMap(lat, lng);

                console.log('Адрес найден на карте:', location.display_name);
            } else {
                showMessage('Адрес не найден. Попробуйте другой вариант написания.', 'warning');
            }
        })
        .catch(error => {
            console.error('Ошибка поиска адреса:', error);
            showMessage('Ошибка поиска адреса', 'error');
        });
}

// Confirm selected address and close modal
function confirmSelectedAddress() {
    if (!selectedAddress) {
        showMessage('Пожалуйста, выберите адрес на карте', 'error');
        return;
    }

    // Set address in the form
    const addressInput = document.getElementById('vacancy-address');
    if (addressInput) {
        addressInput.value = selectedAddress;
    }

    closeAddressPicker();
    showMessage('Адрес выбран успешно', 'success');
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
    document.getElementById('vacancy-address').value = vacancy.address || '';
    document.getElementById('vacancy-description').value = vacancy.description;
    document.getElementById('vacancy-contact-phone').value = vacancy.contact_phone;
    document.getElementById('vacancy-contact-email').value = vacancy.contact_email || '';
    document.getElementById('vacancy-contact-person').value = vacancy.contact_person || '';

    // Fill work days checkboxes
    const workDaysCheckboxes = document.querySelectorAll('input[name="work_days"]');
    workDaysCheckboxes.forEach(checkbox => {
        checkbox.checked = vacancy.work_days && vacancy.work_days.includes(checkbox.value);
    });

    // Initialize date validation for editing
    setTimeout(() => {
        initializeDateValidation();
        updateEndDateMin();
    }, 100);
}

// Handle vacancy form submission
async function handleVacancySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Collect work days from checkboxes
    const workDaysCheckboxes = e.target.querySelectorAll('input[name="work_days"]:checked');
    const work_days = Array.from(workDaysCheckboxes).map(cb => cb.value);

    const vacancyData = {
        subject: formData.get('subject'),
        work_type: formData.get('work_type'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        schedule_from: formData.get('schedule_from'),
        schedule_to: formData.get('schedule_to'),
        work_days: work_days.length > 0 ? work_days : null,
        salary_amount: formData.get('salary_amount'),
        salary_type: formData.get('salary_type'),
        address: formData.get('address'),
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

// Handle vacancy actions (edit/archive/restore/delete)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-btn')) {
        const vacancyId = e.target.getAttribute('data-id');
        openVacancyModal(vacancyId);
    } else if (e.target.classList.contains('archive-btn')) {
        const vacancyId = e.target.getAttribute('data-id');
        if (confirm('Вы уверены, что хотите архивировать эту вакансию?')) {
            archiveVacancy(vacancyId);
        }
    } else if (e.target.classList.contains('restore-btn')) {
        const vacancyId = e.target.getAttribute('data-id');
        if (confirm('Вы уверены, что хотите восстановить эту вакансию?')) {
            restoreVacancy(vacancyId);
        }
    } else if (e.target.classList.contains('delete-btn')) {
        const vacancyId = e.target.getAttribute('data-id');
        const isArchived = e.target.textContent === 'Удалить навсегда';
        const message = isArchived ? 'Вы уверены, что хотите окончательно удалить эту вакансию?' : 'Вы уверены, что хотите удалить эту вакансию?';
        if (confirm(message)) {
            deleteVacancy(vacancyId, isArchived);
        }
    }
});

// Archive vacancy
async function archiveVacancy(vacancyId) {
    try {
        const response = await fetch(`/api/employer/vacancies/${vacancyId}/archive`, {
            method: 'PATCH'
        });

        if (response.ok) {
            showMessage('Вакансия архивирована', 'success');

            // Update current active tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tabName = activeTab.dataset.tab;
                if (tabName === 'active') {
                    loadActiveVacancies();
                } else if (tabName === 'archived') {
                    loadArchivedVacancies();
                }
            }
        } else {
            const data = await response.json();
            showMessage(data.error || 'Ошибка архивирования вакансии', 'error');
        }
    } catch (error) {
        console.error('Error archiving vacancy:', error);
        showMessage('Ошибка архивирования вакансии', 'error');
    }
}

// Restore vacancy
async function restoreVacancy(vacancyId) {
    try {
        const response = await fetch(`/api/employer/vacancies/${vacancyId}/restore`, {
            method: 'PATCH'
        });

        if (response.ok) {
            showMessage('Вакансия восстановлена', 'success');

            // Update current active tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tabName = activeTab.dataset.tab;
                if (tabName === 'active') {
                    loadActiveVacancies();
                } else if (tabName === 'archived') {
                    loadArchivedVacancies();
                }
            }
        } else {
            const data = await response.json();
            showMessage(data.error || 'Ошибка восстановления вакансии', 'error');
        }
    } catch (error) {
        console.error('Error restoring vacancy:', error);
        showMessage('Ошибка восстановления вакансии', 'error');
    }
}

// Delete vacancy (permanently for archived, or archive for active)
async function deleteVacancy(vacancyId, permanent = false) {
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

// Create status control buttons
function createStatusButtons(vacancy) {
    if (vacancy.status === 'Архивная') {
        return '<span class="status-archived">В архиве</span>';
    }

    let buttons = '';

    if (vacancy.status === 'Открыта') {
        buttons += `<button class="btn btn-warning status-btn" data-id="${vacancy.id}" data-status="Забронирована">Забронировать</button>`;
    }

    if (vacancy.status === 'Забронирована') {
        buttons += `<button class="btn btn-success status-btn" data-id="${vacancy.id}" data-status="Закрыта">Закрыть</button>`;
        buttons += `<button class="btn btn-outline status-btn" data-id="${vacancy.id}" data-status="Открыта">Вернуть в открытие</button>`;
    }

    if (vacancy.status === 'Закрыта') {
        buttons += `<button class="btn btn-outline status-btn" data-id="${vacancy.id}" data-status="Открыта">Открыть снова</button>`;
    }

    return buttons;
}

// Handle status change
async function handleStatusChange(vacancyId, newStatus) {
    try {
        const response = await fetch(`/api/employer/vacancies/${vacancyId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`Статус вакансии изменен на "${getStatusText(newStatus)}"`, 'success');

            // Update current active tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const tabName = activeTab.dataset.tab;
                if (tabName === 'active') {
                    loadActiveVacancies();
                } else if (tabName === 'archived') {
                    loadArchivedVacancies();
                }
            }
        } else {
            showMessage(data.error || 'Ошибка изменения статуса', 'error');
        }
    } catch (error) {
        console.error('Error changing vacancy status:', error);
        showMessage('Ошибка изменения статуса вакансии', 'error');
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-vacancies-tab`);
    });

    // Load data for the tab
    if (tabName === 'active') {
        loadActiveVacancies();
    } else if (tabName === 'archived') {
        loadArchivedVacancies();
    }
}

// Load active vacancies
async function loadActiveVacancies() {
    const vacanciesList = document.getElementById('active-vacancies');
    if (!vacanciesList) return;

    try {
        const response = await fetch('/api/employer/vacancies');
        const data = await response.json();

        if (data.vacancies) {
            // Filter only active vacancies (not archived)
            const activeVacancies = data.vacancies.filter(vacancy => vacancy.status !== 'Архивная');

            if (activeVacancies.length > 0) {
                const vacanciesHTML = activeVacancies.map(vacancy => createEmployerVacancyCard(vacancy)).join('');
                vacanciesList.innerHTML = vacanciesHTML;

                // Add event listeners for buttons
                addVacancyEventListeners(vacanciesList);
            } else {
                vacanciesList.innerHTML = '<p>Активных вакансий нет</p>';
            }
        } else {
            vacanciesList.innerHTML = '<p>Активных вакансий нет</p>';
        }
    } catch (error) {
        console.error('Error loading active vacancies:', error);
        vacanciesList.innerHTML = '<p>Ошибка загрузки вакансий</p>';
    }
}

// Load archived vacancies
async function loadArchivedVacancies() {
    const vacanciesList = document.getElementById('archived-vacancies');
    if (!vacanciesList) return;

    try {
        const response = await fetch('/api/employer/vacancies/archived');
        const data = await response.json();

        if (data.vacancies && data.vacancies.length > 0) {
            const vacanciesHTML = data.vacancies.map(vacancy => createEmployerVacancyCard(vacancy)).join('');
            vacanciesList.innerHTML = vacanciesHTML;
        } else {
            vacanciesList.innerHTML = '<p>Архив пуст</p>';
        }
    } catch (error) {
        console.error('Error loading archived vacancies:', error);
        vacanciesList.innerHTML = '<p>Ошибка загрузки архива</p>';
    }
}

// Open profile modal
async function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    const form = document.getElementById('profile-form');

    if (!modal || !form) return;

    try {
        const response = await fetch('/api/employer/profile');
        const data = await response.json();

        if (data.employer) {
            fillProfileForm(data.employer);
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Ошибка загрузки профиля', 'error');
    }
}

// Close profile modal
function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Fill profile form with data
function fillProfileForm(employer) {
    document.getElementById('company-name').value = employer.organization_name || '';
    document.getElementById('contact-name').value = employer.contact_name || '';
    document.getElementById('company-phone').value = employer.phone || '';
    document.getElementById('company-email').value = employer.email || '';
    document.getElementById('company-description').value = employer.description || '';
}

// Handle profile form submission
async function handleProfileSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const profileData = {
        organization_name: formData.get('organization_name'),
        contact_name: formData.get('contact_name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        description: formData.get('description')
    };

    try {
        const response = await fetch('/api/employer/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Профиль успешно обновлен', 'success');
            closeProfileModal();
            // Update current employer data
            currentEmployer = data.employer;
            updateWelcomeMessage();
        } else {
            showMessage(data.error || 'Ошибка обновления профиля', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Ошибка обновления профиля', 'error');
    }
}

// Add event listeners for vacancy buttons
function addVacancyEventListeners(container) {
    // Edit buttons
    const editButtons = container.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const vacancyId = button.dataset.id;
            if (vacancyId) {
                openVacancyModal(vacancyId);
            }
        });
    });

    // Delete buttons
    const deleteButtons = container.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const vacancyId = button.dataset.id;
            if (vacancyId && confirm('Вы уверены, что хотите удалить эту вакансию?')) {
                deleteVacancy(vacancyId);
            }
        });
    });

    // Archive buttons
    const archiveButtons = container.querySelectorAll('.archive-btn');
    archiveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const vacancyId = button.dataset.id;
            if (vacancyId && confirm('Вы уверены, что хотите архивировать эту вакансию?')) {
                archiveVacancy(vacancyId);
            }
        });
    });

    // Restore buttons
    const restoreButtons = container.querySelectorAll('.restore-btn');
    restoreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const vacancyId = button.dataset.id;
            if (vacancyId && confirm('Вы уверены, что хотите восстановить эту вакансию?')) {
                restoreVacancy(vacancyId);
            }
        });
    });

    // Status change buttons
    const statusButtons = container.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const vacancyId = button.dataset.id;
            const newStatus = button.dataset.status;
            if (vacancyId && newStatus) {
                handleStatusChange(vacancyId, newStatus);
            }
        });
    });
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
