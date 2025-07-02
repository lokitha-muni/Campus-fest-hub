import json
import boto3
import os
import re
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
s3 = boto3.client('s3')
sns = boto3.client('sns')

# Get configuration from environment variables
BUCKET = os.environ.get('S3_BUCKET_NAME')
SUBSCRIBERS_KEY = os.environ.get('SUBSCRIBERS_FILE_KEY', 'subscribers.json')
TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def validate_email(email):
    """Validate email format using regex pattern"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

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
        body = json.loads(event.get('body', '{}'))
        email = body.get("email")
        
        # Validate input
        if not email:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Email is required'})
            }
        
        if not validate_email(email):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid email format'})
            }
        
        # Fetch current subscribers
        current_subscribers = []
        try:
            res = s3.get_object(Bucket=BUCKET, Key=SUBSCRIBERS_KEY)
            current_subscribers = json.loads(res['Body'].read().decode())
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchKey':
                raise
        
        # Check if email is already subscribed
        for subscriber in current_subscribers:
            if subscriber.get('email') == email:
                return {
                    'statusCode': 409,
                    'headers': headers,
                    'body': json.dumps({'message': 'You are already subscribed to our newsletter'})
                }
        
        # Add new subscriber to the list
        new_subscriber = {
            "id": f"sub-{str(uuid.uuid4())[:8]}",
            "email": email,
            "timestamp": datetime.now().isoformat(),
            "status": "confirmed"
        }
        
        current_subscribers.append(new_subscriber)
        
        # Save updated subscribers back to S3
        s3.put_object(
            Bucket=BUCKET,
            Key=SUBSCRIBERS_KEY,
            Body=json.dumps(current_subscribers, indent=2),
            ContentType='application/json'
        )
        
        # Also subscribe to SNS topic if TOPIC_ARN is provided
        if TOPIC_ARN:
            try:
                sns.subscribe(
                    TopicArn=TOPIC_ARN,
                    Protocol='email',
                    Endpoint=email
                )
                print(f"Email {email} subscribed to SNS topic {TOPIC_ARN}")
            except Exception as e:
                print(f"Warning: Could not subscribe to SNS topic: {str(e)}")
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Successfully subscribed to our newsletter!',
                'subscriberId': new_subscriber['id']
            })
        }
    
    except ClientError as e:
        # Handle AWS service errors
        print(f"AWS Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to process subscription'})
        }
    
    except Exception as e:
        # Log the error for debugging
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'An unexpected error occurred'})
        }
