// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const roleSelect = document.getElementById('role');
const loginBtn = document.getElementById('loginBtn');
const forgotPasswordLink = document.getElementById('forgotPassword');
const registerOrgLink = document.getElementById('registerOrg');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
forgotPasswordLink.addEventListener('click', handleForgotPassword);
registerOrgLink.addEventListener('click', handleRegisterOrg);

// Login Handler
async function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const role = roleSelect.value;

    // Hide previous messages
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');

    // Validate role selection
    if (!role) {
        errorMessage.textContent = 'Please select a role';
        errorMessage.classList.remove('hidden');
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Check if user's role matches selected role
            if (data.data.user.role !== role) {
                errorMessage.textContent = `Invalid role. Your account is registered as: ${formatRole(data.data.user.role)}`;
                errorMessage.classList.remove('hidden');
                loginBtn.disabled = false;
                loginBtn.classList.remove('loading');
                return;
            }

            // Store token
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Show success message
            successMessage.classList.remove('hidden');

            // Reset form
            loginForm.reset();

        } else {
            // Show error
            errorMessage.textContent = data.message || 'Invalid email or password';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Unable to connect to server. Please try again.';
        errorMessage.classList.remove('hidden');
    } finally {
        // Remove loading state
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
}

// Forgot Password Handler
function handleForgotPassword(e) {
    e.preventDefault();
    alert('Please contact your administrator to reset your password.');
}

// Register Organization Handler
function handleRegisterOrg(e) {
    e.preventDefault();
    alert('Organization registration is currently invite-only. Please contact support.');
}

// Helper to format role name
function formatRole(role) {
    const roleMap = {
        'employee': 'Employee',
        'hr_admin': 'HR',
        'admin': 'Admin',
        'payroll_admin': 'Payroll Admin',
        'finance': 'Finance',
        'superadmin': 'Super Admin'
    };
    return roleMap[role] || role;
}
