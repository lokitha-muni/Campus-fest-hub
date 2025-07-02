// API endpoints with actual API Gateway URLs
const API_ENDPOINTS = {
    SUBSCRIBE: 'https://5s1yffr6u9.execute-api.us-east-1.amazonaws.com/subscribe',
    CREATE_EVENT: 'https://5s1yffr6u9.execute-api.us-east-1.amazonaws.com/create-event',
    EVENTS_JSON: 'events.json'
};

// DOM Elements
const eventsContainer = document.getElementById('events-container');
const subscribeForm = document.getElementById('subscribe-form');
const subscribeMessage = document.getElementById('subscribe-message');
const eventForm = document.getElementById('event-form');
const eventMessage = document.getElementById('event-message');

// Load events when the page loads
document.addEventListener('DOMContentLoaded', loadEvents);

// Event listeners for forms
subscribeForm.addEventListener('submit', handleSubscribe);
eventForm.addEventListener('submit', handleEventSubmission);

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
            <div class="error">
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
        
        return `
            <div class="event-card">
                <div class="event-date">${formattedDate}</div>
                <h3 class="event-title">${event.name}</h3>
                <div class="event-venue"><i class="fas fa-map-marker-alt"></i> ${event.venue}</div>
                <p class="event-description">${event.description}</p>
                <div class="event-time"><i class="far fa-clock"></i> ${event.time}</div>
            </div>
        `;
    }).join('');
}

/**
 * Handle subscription form submission
 * @param {Event} e - Form submit event
 */
async function handleSubscribe(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    try {
        showMessage(subscribeMessage, 'Subscribing...', 'info');
        
        const response = await fetch(API_ENDPOINTS.SUBSCRIBE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            throw new Error('Subscription failed');
        }
        
        const data = await response.json();
        showMessage(subscribeMessage, 'Successfully subscribed! You will receive updates for new events.', 'success');
        subscribeForm.reset();
    } catch (error) {
        console.error('Error subscribing:', error);
        showMessage(subscribeMessage, 'Failed to subscribe. Please try again later.', 'error');
    }
}

/**
 * Handle event submission form
 * @param {Event} e - Form submit event
 */
async function handleEventSubmission(e) {
    e.preventDefault();
    
    const eventData = {
        name: document.getElementById('event-name').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        venue: document.getElementById('event-venue').value,
        description: document.getElementById('event-description').value
    };
    
    try {
        showMessage(eventMessage, 'Submitting event...', 'info');
        
        const response = await fetch(API_ENDPOINTS.CREATE_EVENT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            throw new Error('Event submission failed');
        }
        
        const data = await response.json();
        showMessage(eventMessage, 'Event added successfully!', 'success');
        eventForm.reset();
        
        // Reload events to show the newly added event
        loadEvents();
    } catch (error) {
        console.error('Error submitting event:', error);
        showMessage(eventMessage, 'Failed to add event. Please try again later.', 'error');
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
