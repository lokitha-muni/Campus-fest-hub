import boto3
import json
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError
import re

# Initialize S3 client
s3 = boto3.client('s3')

# Get configuration from environment variables
BUCKET = os.environ.get('S3_BUCKET_NAME')
REGISTRATIONS_KEY = os.environ.get('REGISTRATIONS_FILE_KEY', 'registrations.json')
EVENTS_KEY = os.environ.get('EVENTS_FILE_KEY', 'events.json')

def validate_email(email):
    """Validate email format using regex pattern"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_registration(data):
    """Validate registration data"""
    if not data.get('name'):
        return False, "Name is required"
    
    if not data.get('email'):
        return False, "Email is required"
    
    if not validate_email(data.get('email', '')):
        return False, "Invalid email format"
    
    if not data.get('eventName') and not data.get('eventId'):
        return False, "Event information is required"
    
    return True, ""

def lambda_handler(event, context):
    # Set up CORS headers for API Gateway integration
    headers = {
        'Access-Control-Allow-Origin': '*',  # For development; restrict in production
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
    
    # Handle preflight OPTIONS request
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'CORS preflight request successful'})
        }
    
    try:
        # Parse request body
        data = json.loads(event.get('body', '{}'))
        
        # Validate registration data
        is_valid, error_message = validate_registration(data)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': error_message})
            }
        
        # Extract registration details
        name = data.get('name')
        email = data.get('email')
        event_name = data.get('eventName')
        event_id = data.get('eventId')

        # If we have event ID but not event name, try to fetch event name
        if event_id and not event_name:
            try:
                events_file = s3.get_object(Bucket=BUCKET, Key=EVENTS_KEY)
                events = json.loads(events_file['Body'].read().decode())
                
                for evt in events:
                    if evt.get('id') == event_id:
                        event_name = evt.get('name')
                        break
            except Exception as e:
                print(f"Warning: Could not fetch event name for ID {event_id}: {str(e)}")
        
        # Fetch current registrations
        current_registrations = []
        try:
            res = s3.get_object(Bucket=BUCKET, Key=REGISTRATIONS_KEY)
            current_registrations = json.loads(res['Body'].read().decode())
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchKey':
                raise
        
        # Check for duplicate registration
        for reg in current_registrations:
            if (reg.get('email') == email and 
                (reg.get('eventId') == event_id or reg.get('eventName') == event_name)):
                return {
                    'statusCode': 409,
                    'headers': headers,
                    'body': json.dumps({'error': 'You are already registered for this event'})
                }
        
        # Create registration record - removed status field to match frontend expectations
        registration = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "eventName": event_name,
            "eventId": event_id,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add registration to list
        current_registrations.append(registration)
        
        # Save updated registrations back to S3
        s3.put_object(
            Bucket=BUCKET,
            Key=REGISTRATIONS_KEY,
            Body=json.dumps(current_registrations, indent=2),
            ContentType='application/json'
        )

        # Return success response
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Registration successful',
                'registrationId': registration['id']
            })
        }

    except ClientError as e:
        # Handle AWS service errors
        print(f"AWS Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to process registration'})
        }
    
    except Exception as e:
        # Log the error for debugging
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }

