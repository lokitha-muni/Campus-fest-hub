// API endpoints with placeholder API Gateway URLs
const API_ENDPOINTS = {
    SUBSCRIBE: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/subscribe',
    CREATE_EVENT: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/create-event',
    EVENTS_JSON: 'events.json'
};

// DOM Elements
const eventsContainer = document.getElementById('events-container');
const subscribeForm = document.getElementById('subscribe-form');
const subscribeMessage = document.getElementById('subscribe-message');
const footerSubscribeForm = document.getElementById('footer-subscribe-form');

// Load events when the page loads
document.addEventListener('DOMContentLoaded', loadEvents);

// Event listeners for forms
subscribeForm.addEventListener('submit', handleSubscribe);
footerSubscribeForm.addEventListener('submit', handleSubscribe);

/**
 * Load events from the events.json file
 */
async function loadEvents() {
    try {
        const response = await fetch(API_ENDPOINTS.EVENTS_JSON);
        
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load events. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Display events in the events container
 * @param {Array} events - Array of event objects
 */
function displayEvents(events) {
    if (!events || events.length === 0) {
        eventsContainer.innerHTML = '<p>No upcoming events at the moment.</p>';
        return;
    }

    // Sort events by date (most recent first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    eventsContainer.innerHTML = events.map(event => {
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
        
        return `
            <div class="event-card">
                <div class="event-image">
                    <img src="${event.image || 'https://via.placeholder.com/300x180?text=Event'}" 
                         alt="${event.name}"
                         onerror="this.onerror=null; this.src='assets/${event.type || 'event'}.jpg';">
                </div>
                <div class="event-content">
                    <span class="event-type">${eventIcon} ${event.type || 'Event'}</span>
                    <h3 class="event-title">${event.name}</h3>
                    <div class="event-info">
                        <i class="far fa-calendar-alt"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="event-info">
                        <i class="far fa-clock"></i>
                        <span>${event.time}</span>
                    </div>
                    <div class="event-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.venue}</span>
                    </div>
                    <p class="event-description">${event.shortDescription || event.description.substring(0, 100) + '...'}</p>
                    <a href="event.html?id=${event.id}" class="event-link">Know More <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `;
    }).join('');
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
 * Handle subscription form submission
 * @param {Event} e - Form submit event
 */
async function handleSubscribe(e) {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value;
    
    // Determine which message element to use
    const messageElement = form.id === 'subscribe-form' ? subscribeMessage : 
                          form.nextElementSibling;
    
    try {
        showMessage(messageElement, 'Subscribing...', 'info');
        
        const response = await fetch(API_ENDPOINTS.SUBSCRIBE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                // Already subscribed
                showMessage(messageElement, errorData.message || 'You are already subscribed to our newsletter.', 'info');
            } else {
                throw new Error(errorData.error || 'Subscription failed');
            }
            return;
        }
        
        const data = await response.json();
        showMessage(messageElement, data.message || 'Successfully subscribed to our newsletter!', 'success');
        form.reset();
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
