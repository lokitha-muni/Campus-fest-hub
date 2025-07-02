// API endpoints with placeholder API Gateway URLs
const API_ENDPOINTS = {
    CREATE_EVENT: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/create-event',
    EVENTS_JSON: 'events.json',
    SUBSCRIBERS_JSON: 'subscribers.json'
};

// DOM Elements
const addEventForm = document.getElementById('add-event-form');
const addEventMessage = document.getElementById('add-event-message');
const eventsList = document.getElementById('events-list');
const subscribersList = document.getElementById('subscribers-list');
const logoutBtn = document.getElementById('logout-btn');
const tabLinks = document.querySelectorAll('.admin-sidebar li');

// Image input elements
const imageUrlOption = document.getElementById('image-url-option');
const imageFileOption = document.getElementById('image-file-option');
const imageUrlInput = document.getElementById('image-url-input');
const imageFileInput = document.getElementById('image-file-input');
const eventImageUrl = document.getElementById('event-image-url');
const eventImageFile = document.getElementById('event-image-file');

// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    if (!sessionStorage.getItem('adminLoggedIn')) {
        // Redirect to login page if not logged in
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Load events for the manage events tab
    loadEvents();
    
    // Load subscribers for the subscribers tab
    loadSubscribers();
    
    // Set up tab switching
    setupTabs();
    
    // Set up image input options
    setupImageInputs();
});

// Event listeners
addEventForm.addEventListener('submit', handleEventSubmission);
logoutBtn.addEventListener('click', handleLogout);

/**
 * Set up tab switching functionality
 */
function setupTabs() {
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabLinks.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the selected tab content
            const tabId = this.getAttribute('data-tab');
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
        });
    });
}

/**
 * Set up image input options
 */
function setupImageInputs() {
    // Toggle between URL and file upload
    imageUrlOption.addEventListener('change', function() {
        if (this.checked) {
            imageUrlInput.style.display = 'block';
            imageFileInput.style.display = 'none';
        }
    });
    
    imageFileOption.addEventListener('change', function() {
        if (this.checked) {
            imageUrlInput.style.display = 'none';
            imageFileInput.style.display = 'block';
        }
    });
    
    // Preview image when file is selected
    eventImageFile.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            // Create or get image preview element
            let previewContainer = document.querySelector('.image-preview');
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.className = 'image-preview';
                const previewImg = document.createElement('img');
                previewContainer.appendChild(previewImg);
                imageFileInput.after(previewContainer);
            }
            
            const previewImg = previewContainer.querySelector('img');
            
            // Read and display the file
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Handle event submission
 * @param {Event} e - Form submit event
 */
async function handleEventSubmission(e) {
    e.preventDefault();
    
    // Get image source based on selected option
    let imageSource = '';
    if (imageUrlOption.checked) {
        imageSource = eventImageUrl.value;
    } else {
        // For file upload, in a real application, you would upload the file to a server
        // and get back a URL. For this demo, we'll use a placeholder or data URL
        const file = eventImageFile.files[0];
        if (file) {
            // In a real app, you would upload the file here and get a URL back
            // For demo purposes, we'll create a data URL
            try {
                imageSource = await readFileAsDataURL(file);
            } catch (error) {
                console.error('Error reading file:', error);
                imageSource = `assets/${document.getElementById('event-type').value || 'event'}.jpg`;
            }
        } else {
            // Use a placeholder based on event type if no file is selected
            imageSource = `assets/${document.getElementById('event-type').value || 'event'}.jpg`;
        }
    }
    
    // Ensure all required fields are included for the Lambda function
    const eventData = {
        id: generateId(),
        name: document.getElementById('event-name').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        venue: document.getElementById('event-venue').value,
        type: document.getElementById('event-type').value,
        shortDescription: document.getElementById('event-short-desc').value,
        description: document.getElementById('event-description').value,
        image: imageSource
    };
    
    try {
        showMessage(addEventMessage, 'Submitting event...', 'info');
        
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
        showMessage(addEventMessage, 'Event added successfully! Subscribers will be notified.', 'success');
        addEventForm.reset();
        
        // Clear any image preview
        const previewContainer = document.querySelector('.image-preview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        // Reload events to show the newly added event
        loadEvents();
    } catch (error) {
        console.error('Error submitting event:', error);
        
        // Show error message
        showMessage(addEventMessage, 'Failed to add event. Please try again.', 'error');
    }
}

/**
 * Read a file as a data URL
 * @param {File} file - The file to read
 * @returns {Promise<string>} - A promise that resolves with the data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

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
        displayEventsInAdminPanel(events);
    } catch (error) {
        console.error('Error loading events:', error);
        if (eventsList) {
            eventsList.innerHTML = `
                <div class="error-message">
                    <p>Failed to load events. Please try again later.</p>
                </div>
            `;
        }
    }
}

/**
 * Display events in the admin panel
 * @param {Array} events - Array of event objects
 */
function displayEventsInAdminPanel(events) {
    if (!eventsList) return;
    
    if (!events || events.length === 0) {
        eventsList.innerHTML = '<p>No events available.</p>';
        return;
    }

    // Sort events by date (most recent first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    eventsList.innerHTML = events.map(event => {
        // Format date for display
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="admin-event-item" data-id="${event.id}">
                <div class="admin-event-info">
                    <h4 class="admin-event-title">${event.name}</h4>
                    <p class="admin-event-date">${formattedDate} | ${event.venue}</p>
                </div>
                <div class="admin-event-actions">
                    <button class="edit-btn" onclick="editEvent('${event.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteEvent('${event.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Load subscribers from the subscribers.json file
 */
async function loadSubscribers() {
    try {
        const response = await fetch(API_ENDPOINTS.SUBSCRIBERS_JSON);
        
        if (!response.ok) {
            throw new Error('Failed to fetch subscribers');
        }
        
        const subscribers = await response.json();
        displaySubscribers(subscribers);
    } catch (error) {
        console.error('Error loading subscribers:', error);
        if (subscribersList) {
            subscribersList.innerHTML = `
                <div class="error-message">
                    <p>Failed to load subscribers. Please try again later.</p>
                </div>
            `;
        }
    }
}

/**
 * Display subscribers in the admin panel
 * @param {Array} subscribers - Array of subscriber objects
 */
function displaySubscribers(subscribers) {
    if (!subscribersList) return;
    
    if (!subscribers || subscribers.length === 0) {
        subscribersList.innerHTML = '<p>No subscribers available.</p>';
        return;
    }

    // Sort subscribers by timestamp (most recent first)
    subscribers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    subscribersList.innerHTML = subscribers.map(subscriber => {
        // Format date for display
        const subDate = new Date(subscriber.timestamp);
        const formattedDate = subDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="subscriber-item">
                <p>${subscriber.email}</p>
                <p class="subscriber-date">Subscribed on: ${formattedDate}</p>
            </div>
        `;
    }).join('');
}

/**
 * Edit an event (placeholder function)
 * @param {string} eventId - ID of the event to edit
 */
function editEvent(eventId) {
    alert(`Edit event with ID: ${eventId} (This is a demo function)`);
}

/**
 * Delete an event (placeholder function)
 * @param {string} eventId - ID of the event to delete
 */
function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        alert(`Delete event with ID: ${eventId} (This is a demo function)`);
    }
}

/**
 * Handle logout
 */
function handleLogout(e) {
    e.preventDefault();
    
    // Clear admin session
    sessionStorage.removeItem('adminLoggedIn');
    
    // Redirect to login page
    window.location.href = 'admin-login.html';
}

/**
 * Generate a random ID for new events
 * @returns {string} - Random ID
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
