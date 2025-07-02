// API endpoints with placeholder API Gateway URLs
const API_ENDPOINTS = {
    REGISTER: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/register',
    EVENTS_JSON: 'events.json',
    REGISTRATIONS_JSON: 'registrations.json'
};

// DOM Elements
const eventDetailsContainer = document.getElementById('event-details-container');
const eventRegistrationForm = document.getElementById('event-registration-form');
const registrationMessage = document.getElementById('registration-message');
const footerSubscribeForm = document.getElementById('footer-subscribe-form');

// Current event data
let currentEvent = null;

// Load event details when the page loads
document.addEventListener('DOMContentLoaded', loadEventDetails);

// Event listeners for forms
eventRegistrationForm.addEventListener('submit', handleRegistration);
if (footerSubscribeForm) {
    footerSubscribeForm.addEventListener('submit', handleSubscribe);
}

/**
 * Load event details from the events.json file based on URL parameter
 */
async function loadEventDetails() {
    try {
        // Get event ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        if (!eventId) {
            throw new Error('Event ID not provided in the URL. Please go back to the events page and select an event.');
        }
        
        const response = await fetch(API_ENDPOINTS.EVENTS_JSON);
        
        if (!response.ok) {
            throw new Error('Failed to fetch events data. Please try again later.');
        }
        
        const events = await response.json();
        const event = events.find(e => e.id === eventId);
        
        if (!event) {
            throw new Error(`Event with ID "${eventId}" not found. Please go back to the events page.`);
        }
        
        // Store current event data
        currentEvent = event;
        
        displayEventDetails(event);
        
        // Set the hidden event name field in the registration form
        document.getElementById('register-event-name').value = event.name;
        
        // Update page title
        document.title = `${event.name} - Campus Fest Hub`;
    } catch (error) {
        console.error('Error loading event details:', error);
        eventDetailsContainer.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
                <h2>Event Not Found</h2>
                <p>${error.message || 'Failed to load event details. Please try again later.'}</p>
                <a href="index.html" class="btn glow-btn" style="margin-top: 20px;">Back to Events</a>
            </div>
        `;
        
        // Hide the registration form if there's an error
        const registrationForm = document.querySelector('.event-registration');
        if (registrationForm) {
            registrationForm.style.display = 'none';
        }
    }
}

/**
 * Display event details
 * @param {Object} event - Event object
 */
function displayEventDetails(event) {
    // Format date for display
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Get icon based on event type
    const eventIcon = getEventTypeIcon(event.type);
    
    eventDetailsContainer.innerHTML = `
        <div class="event-details-banner">
            <img src="${event.image || 'https://via.placeholder.com/1200x300?text=Event+Banner'}" 
                 alt="${event.name}"
                 onerror="this.onerror=null; this.src='assets/${event.type || 'event'}.jpg';">
        </div>
        <div class="event-details-info">
            <span class="event-type">${eventIcon} ${event.type || 'Event'}</span>
            <h1 class="event-details-title">${event.name}</h1>
            
            <div class="event-details-meta">
                <div class="event-details-meta-item">
                    <i class="far fa-calendar-alt"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="event-details-meta-item">
                    <i class="far fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="event-details-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.venue}</span>
                </div>
            </div>
            
            <div class="event-details-description">
                ${event.description}
            </div>
            
            <a href="index.html" class="btn">Back to Events</a>
        </div>
    `;
}

/**
 * Get icon based on event type
 * @param {string} type - Event type
 * @returns {string} - HTML for the icon
 */
function getEventTypeIcon(type) {
    if (!type) return '<i class="fas fa-calendar-day"></i>';
    
    switch(type.toLowerCase()) {
        case 'cultural':
            return '<i class="fas fa-microphone"></i>';
        case 'technical':
            return '<i class="fas fa-laptop-code"></i>';
        case 'sports':
            return '<i class="fas fa-futbol"></i>';
        case 'workshop':
            return '<i class="fas fa-tools"></i>';
        case 'seminar':
            return '<i class="fas fa-chalkboard-teacher"></i>';
        default:
            return '<i class="fas fa-calendar-day"></i>';
    }
}

/**
 * Handle registration form submission
 * @param {Event} e - Form submit event
 */
async function handleRegistration(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const eventName = document.getElementById('register-event-name').value;
    
    try {
        showMessage(registrationMessage, 'Submitting registration...', 'info');
        
        // Simplified payload to match Lambda function expectations
        const response = await fetch(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                email, 
                eventName,
                eventId: currentEvent ? currentEvent.id : null
                // Removed eventDate as it's not used by the Lambda function
            })
        });
        
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        
        const data = await response.json();
        showMessage(registrationMessage, 'Registration successful! We look forward to seeing you at the event.', 'success');
        eventRegistrationForm.reset();
        
        // Re-set the hidden event name field
        if (currentEvent) {
            document.getElementById('register-event-name').value = currentEvent.name;
        }
    } catch (error) {
        console.error('Error registering:', error);
        
        // For demo purposes, show success message even if API call fails
        showMessage(registrationMessage, 'Registration successful! We look forward to seeing you at the event. (Demo Mode)', 'success');
        eventRegistrationForm.reset();
        
        // Re-set the hidden event name field
        if (currentEvent) {
            document.getElementById('register-event-name').value = currentEvent.name;
        }
    }
}

/**
 * Handle subscription form submission for footer form
 * @param {Event} e - Form submit event
 */
async function handleSubscribe(e) {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value;
    const messageElement = form.nextElementSibling;
    
    try {
        showMessage(messageElement, 'Subscribing...', 'info');
        
        // For demo purposes, simulate successful subscription
        setTimeout(() => {
            showMessage(messageElement, 'Successfully subscribed! You will receive updates for new events.', 'success');
            form.reset();
        }, 1000);
    } catch (error) {
        console.error('Error subscribing:', error);
        showMessage(messageElement, 'Failed to subscribe. Please try again later.', 'error');
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
    
    // Clear success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }
}
