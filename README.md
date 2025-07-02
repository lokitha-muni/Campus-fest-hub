# Campus Fest Hub

Campus Fest Hub is a college event announcement website that allows students to explore upcoming campus events, view detailed information, register for events, and subscribe for future updates. Built with a galaxy-themed UI, the platform includes a secure admin login for authorized users to add new events. The entire backend is powered by AWS services like Lambda, API Gateway, and S3, making the system fully serverless and scalable.

![index_page1](https://github.com/user-attachments/assets/263cda2f-82e9-40e5-9f94-4e82b41169ec)

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Local Development](#local-development)
  - [AWS Deployment](#aws-deployment)
- [API Integration](#api-integration)
- [Lambda Functions](#lambda-functions)
- [Browser Compatibility](#browser-compatibility)
- [Screenshots](#screenshots)
- [Credits](#credits)
- [License](#license)

## Features

- Animated starry background with nebula effects
- Display upcoming events from a JSON file
- Detailed event pages with full information
- Email subscription form for event notifications
- Admin login and dashboard for managing events
- Responsive design with galaxy-themed colors
- Automatic refresh of events after submission
- Serverless backend using AWS Lambda and API Gateway

## Architecture

![College-fest-archi](https://github.com/user-attachments/assets/d6835c26-401f-4651-8b94-5578d30d0ef0)

The Campus Fest Hub uses a serverless architecture with the following components:

- **Frontend**: Static website hosted on Amazon S3
- **Backend**: AWS Lambda functions for handling API requests
- **API Gateway**: RESTful API endpoints for the frontend to interact with the backend
- **S3 Storage**: Stores JSON files (events.json, subscribers.json, registrations.json)
- **Amazon SNS**: Handles email notifications for new events and subscriptions
- **Amazon SES**: Sends formatted emails to subscribers

### Data Flow

1. Users view events loaded from events.json
2. Users can register for events (data stored in registrations.json)
3. Users can subscribe to newsletters (data stored in subscribers.json)
4. Admins can add new events, which updates events.json and notifies subscribers

## Project Structure

### HTML Pages
- `index.html` - Home page with event listings and subscription form
- `event.html` - Detailed view of a specific event
- `admin-login.html` - Admin authentication page
- `admin-dashboard.html` - Admin interface for managing events
- `test-event.html` - Test page for event links

### CSS
- `css/styles.css` - Main stylesheet with galaxy theme and responsive design

### JavaScript
- `js/stars.js` - Creates the animated starry background
- `js/main.js` - Handles home page functionality
- `js/event-details.js` - Manages event details page
- `js/admin-login.js` - Handles admin authentication
- `js/admin-dashboard.js` - Manages the admin dashboard

### Data
- `events.json` - Sample event data
- `subscribers.json` - List of newsletter subscribers
- `registrations.json` - Event registration data

### Lambda Functions
- `register_lambda.py` - Handles event registrations
- `subscribe_lambda.py` - Manages newsletter subscriptions
- `create_event_lambda.py` - Processes new event creation and notifications

## Setup Instructions

### Local Development

1. Clone this repository to your local machine
2. Open `index.html` in your browser to view the website
3. Use admin@festhub.com / admin123 to access the admin dashboard
4. Modify the `API_ENDPOINTS` object in JavaScript files to point to your actual API Gateway endpoints

### AWS Deployment

#### S3 Website Hosting

1. Create an S3 bucket for website hosting:
   ```
   aws s3 mb s3://your-bucket-name
   ```

2. Enable static website hosting on the bucket:
   ```
   aws s3 website s3://your-bucket-name --index-document index.html
   ```

3. Set bucket policy to allow public read access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

4. Upload the website files to S3:
   ```
   aws s3 sync . s3://your-bucket-name
   ```

5. Access your website at:
   ```
   http://your-bucket-name.s3-website-your-region.amazonaws.com
   ```

#### Lambda Functions and API Gateway Setup

1. Create an SNS topic for notifications:
   ```
   aws sns create-topic --name campus-fest-notifications
   ```

2. Create IAM roles for Lambda functions with appropriate permissions:
   - S3 read/write access to your bucket
   - SNS publish permissions
   - SES send email permissions (if using SES)
   - CloudWatch Logs permissions

3. Create Lambda functions using the provided Python files:
   - register_lambda.py
   - subscribe_lambda.py
   - create_event_lambda.py

4. Set environment variables for each Lambda function:
   - S3_BUCKET_NAME: Your S3 bucket name
   - SNS_TOPIC_ARN: ARN of the SNS topic created earlier
   - SES_SENDER_EMAIL: Verified email address for sending notifications (if using SES)

5. Create API Gateway endpoints:
   - /register - Connected to register_lambda
   - /subscribe - Connected to subscribe_lambda
   - /create-event - Connected to create_event_lambda

6. Enable CORS on API Gateway for all endpoints

7. Deploy the API and note the API Gateway URL

8. Update the API_ENDPOINTS in the JavaScript files with your API Gateway URL:
   ```javascript
   const API_ENDPOINTS = {
       SUBSCRIBE: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/subscribe',
       CREATE_EVENT: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/create-event',
       REGISTER: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/register',
       EVENTS_JSON: 'events.json',
       SUBSCRIBERS_JSON: 'subscribers.json',
       REGISTRATIONS_JSON: 'registrations.json'
   };
   ```

9. Re-upload the updated JavaScript files to your S3 bucket

## API Integration

The frontend interacts with the backend through these API endpoints:

1. **Subscribe API** (`/subscribe`):
   - Method: POST
   - Payload: `{ "email": "user@example.com" }`
   - Response: Confirmation message and subscription ID

2. **Register API** (`/register`):
   - Method: POST
   - Payload: `{ "name": "User Name", "email": "user@example.com", "eventName": "Event Name", "eventId": "1" }`
   - Response: Confirmation message and registration ID

3. **Create Event API** (`/create-event`):
   - Method: POST
   - Payload: Event details including name, date, time, venue, description, etc.
   - Response: Confirmation message and event ID

## Lambda Functions

### register_lambda.py
Handles event registrations:
- Validates registration data (name, email, eventName/eventId)
- Checks for duplicate registrations
- Adds new registrations to registrations.json in S3

### subscribe_lambda.py
Handles newsletter subscriptions:
- Validates email format
- Stores subscriber information in subscribers.json
- Optionally subscribes the email to an SNS topic

### create_event_lambda.py
Handles adding new events:
- Validates required event fields
- Adds the event to events.json in S3
- Notifies subscribers via SNS and/or SES

## Browser Compatibility

Tested and working on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Screenshots

![index_page1](https://github.com/user-attachments/assets/a5a3e1eb-3c18-45b5-93ae-830c9125d171)
![index_page2](https://github.com/user-attachments/assets/cbe1179a-f085-4309-bf02-ffc1301194a8)
![index_page3](https://github.com/user-attachments/assets/71cb9ba9-5755-46be-b6cb-e8000d9a14dc)
![registered_img](https://github.com/user-attachments/assets/59e6a0b3-73e5-4380-a032-6583558384a9)
![admin_login](https://github.com/user-attachments/assets/46f1ebc3-8b0f-4a5d-829d-39ee2cbe21e3)
![admin_dashboard](https://github.com/user-attachments/assets/db196067-81a6-494e-9113-635c997eadfa)
![managevents_img](https://github.com/user-attachments/assets/e1d61dca-af9c-402a-9a21-a0b2f45cbedf)
![subscribers_img](https://github.com/user-attachments/assets/34e41e55-761f-4432-8bc6-b8685bae7004)
![subscribed_img](https://github.com/user-attachments/assets/65ed806d-9bf2-4b79-8d5f-d1c9ef897384)
![subscribers_json](https://github.com/user-attachments/assets/297a3395-0f54-4a55-8cb3-64689e553720)

## Credits

- Font Awesome for icons
- Unsplash for sample images
- Background animation inspired by various space/galaxy CSS effects

## License

This project is open source and available for personal and commercial use.
