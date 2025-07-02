// DOM Elements
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

// Event listeners
loginForm.addEventListener('submit', handleLogin);

/**
 * Handle admin login
 * @param {Event} e - Form submit event
 */
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    // Accept any email and password
    if (email && password) {
        // Set a session flag to indicate the user is logged in
        sessionStorage.setItem('adminLoggedIn', 'true');
        
        // Show success message
        showMessage(loginMessage, 'Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1500);
    } else {
        showMessage(loginMessage, 'Please enter both email and password.', 'error');
    }
}

/**
 * Show a message in the specified element
 * @param {HTMLElement} element - The element to show the message in
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, info)
 */
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    
    // Clear error messages after 5 seconds
    if (type === 'error') {
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }
}
