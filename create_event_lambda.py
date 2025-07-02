import boto3
import json
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
s3 = boto3.client('s3')
sns = boto3.client('sns')
ses = boto3.client('ses')

# Get configuration from environment variables
BUCKET = os.environ.get('S3_BUCKET_NAME')
EVENTS_KEY = os.environ.get('EVENTS_FILE_KEY', 'events.json')
SUBSCRIBERS_KEY = os.environ.get('SUBSCRIBERS_FILE_KEY', 'subscribers.json')
TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
SES_SENDER = os.environ.get('SES_SENDER_EMAIL')

def validate_event(event_data):
    """Validate required event fields"""
    required_fields = ['name', 'date', 'time', 'venue', 'description']
    missing_fields = [field for field in required_fields if not event_data.get(field)]
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    # Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(event_data['date'], '%Y-%m-%d')
    except ValueError:
        return False, "Invalid date format. Use YYYY-MM-DD."
    
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
        new_event = json.loads(event.get('body', '{}'))
        
        # Validate event data
        is_valid, error_message = validate_event(new_event)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': error_message})
            }
        
        # Generate a unique ID for the event if not provided
        if 'id' not in new_event:
            new_event['id'] = str(uuid.uuid4())
        
        # Add creation timestamp
        new_event['createdAt'] = datetime.now().isoformat()
        
        # Fetch current events from S3
        try:
            file = s3.get_object(Bucket=BUCKET, Key=EVENTS_KEY)
            events = json.loads(file['Body'].read().decode())
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                # If file doesn't exist, start with empty list
                events = []
            else:
                raise
        
        # Add new event
        events.append(new_event)
        
        # Sort events by date (ascending)
        events.sort(key=lambda x: x['date'])
        
        # Save updated events back to S3
        s3.put_object(
            Bucket=BUCKET, 
            Key=EVENTS_KEY, 
            Body=json.dumps(events, indent=2),
            ContentType='application/json'
        )
        
        # Format event date for notification
        try:
            event_date = datetime.strptime(new_event['date'], '%Y-%m-%d').strftime('%B %d, %Y')
        except ValueError:
            event_date = new_event['date']
        
        # Prepare notification message
        message = (
            f"🎉 New Event Added: {new_event['name']}\n\n"
            f"📅 Date: {event_date}\n"
            f"⏰ Time: {new_event['time']}\n"
            f"📍 Venue: {new_event['venue']}\n\n"
            f"Description: {new_event['description'][:100]}...\n\n"
            f"Visit our website for more details and to register!"
        )
        
        # Notify subscribers using both methods
        notification_sent = False
        
        # Method 1: Use SNS Topic if available
        if TOPIC_ARN:
            try:
                sns.publish(
                    TopicArn=TOPIC_ARN,
                    Subject=f"New Campus Event: {new_event['name']}",
                    Message=message
                )
                notification_sent = True
                print(f"Notification sent via SNS topic to subscribers")
            except Exception as e:
                print(f"Warning: Could not publish to SNS topic: {str(e)}")
        
        # Method 2: Use subscribers.json and SES
        if SES_SENDER:
            try:
                # Get subscribers from S3
                subscribers_file = s3.get_object(Bucket=BUCKET, Key=SUBSCRIBERS_KEY)
                subscribers = json.loads(subscribers_file['Body'].read().decode())
                
                # Prepare HTML email content
                html_message = f"""
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #8e44ad, #3498db); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }}
                        .button {{ display: inline-block; background: linear-gradient(135deg, #8e44ad, #3498db); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Campus Event!</h1>
                        </div>
                        <div class="content">
                            <h2>{new_event['name']}</h2>
                            <p><strong>Date:</strong> {event_date}</p>
                            <p><strong>Time:</strong> {new_event['time']}</p>
                            <p><strong>Venue:</strong> {new_event['venue']}</p>
                            <p><strong>Description:</strong> {new_event['description'][:200]}...</p>
                            <a href="#" class="button">View Event Details</a>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                # Send email to each subscriber
                for subscriber in subscribers:
                    if subscriber.get('status') == 'confirmed':
                        try:
                            ses.send_email(
                                Source=SES_SENDER,
                                Destination={'ToAddresses': [subscriber['email']]},
                                Message={
                                    'Subject': {'Data': f"New Campus Event: {new_event['name']}"},
                                    'Body': {
                                        'Html': {'Data': html_message},
                                        'Text': {'Data': message}
                                    }
                                }
                            )
                        except Exception as e:
                            print(f"Warning: Could not send email to {subscriber['email']}: {str(e)}")
                
                notification_sent = True
                print(f"Notification sent via SES to {len(subscribers)} subscribers")
            except Exception as e:
                print(f"Warning: Could not send emails to subscribers: {str(e)}")
        
        # Return success response
        response_message = 'Event added successfully!'
        if notification_sent:
            response_message += ' Subscribers have been notified.'
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': response_message,
                'eventId': new_event['id']
            })
        }
    
    except ClientError as e:
        # Handle AWS service errors
        print(f"AWS Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to process event'})
        }
    
    except Exception as e:
        # Log the error for debugging
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }
