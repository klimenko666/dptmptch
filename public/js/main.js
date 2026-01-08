// Main JavaScript for TempTeachers platform

document.addEventListener('DOMContentLoaded', function() {
    // Load statistics on homepage
    if (document.getElementById('vacancies-count')) {
        loadStatistics();
    }
});

// Load platform statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/vacancies');
        const data = await response.json();

        if (data.vacancies) {
            document.getElementById('vacancies-count').textContent = data.vacancies.length;

            // Count unique employers
            const employers = new Set(data.vacancies.map(v => v.organization_name));
            document.getElementById('employers-count').textContent = employers.size;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('vacancies-count').textContent = '0';
        document.getElementById('employers-count').textContent = '0';
    }
}

// Utility functions
function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error, .success');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;

    // Insert at the top of the main content
    const main = document.querySelector('main') || document.body;
    main.insertBefore(messageDiv, main.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Check if user is logged in
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            return data.employer;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
    return null;
}

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}
