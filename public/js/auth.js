// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Update tab buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.getAttribute('data-tab') === tabName) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Switch tab links
    const switchLinks = document.querySelectorAll('.switch-tab');
    switchLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');
            const targetButton = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
            if (targetButton) {
                targetButton.click();
            }
        });
    });

    // Registration form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if user is already logged in
    checkCurrentUser();
});

// Handle registration
async function handleRegistration(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const registrationData = {
        organization_name: formData.get('organization_name'),
        contact_name: formData.get('contact_name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Регистрация успешна! Перенаправление в личный кабинет...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showMessage(data.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Ошибка сети. Попробуйте позже.', 'error');
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Вход выполнен успешно! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showMessage(data.error || 'Ошибка входа', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Ошибка сети. Попробуйте позже.', 'error');
    }
}

// Check current user and redirect if logged in
async function checkCurrentUser() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            // User is logged in, redirect to dashboard
            window.location.href = '/dashboard';
        }
    } catch (error) {
        // User not logged in, stay on auth page
        console.log('User not authenticated');
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

    // Insert before the auth container
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        authContainer.parentNode.insertBefore(messageDiv, authContainer);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}
