#!/usr/bin/env python3
"""
Test S3 connection and credentials
"""
import os
import sys
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env')

def test_s3_connection():
    """Test S3 connection with current credentials"""

    # Get environment variables
    bucket_name = os.getenv('S3_BUCKET_NAME')
    aws_region = os.getenv('AWS_REGION')
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')

    print("=== S3 Configuration Test ===")
    print(f"Bucket Name: {bucket_name}")
    print(f"Region: {aws_region}")
    print(f"Access Key: {access_key[:10]}..." if access_key else "Access Key: None")
    print(f"Secret Key: {'***' if secret_key else 'None'}")
    print()

    if not all([bucket_name, aws_region, access_key, secret_key]):
        print("❌ Missing required environment variables")
        return False

    try:
        # Create S3 client
        s3_client = boto3.client(
            's3',
            region_name=aws_region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )

        print("✅ S3 client created successfully")

        # Test bucket access
        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' is accessible")

            # Test listing objects
            try:
                response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=5)
                object_count = response.get('KeyCount', 0)
                print(f"✅ Found {object_count} objects in bucket")

                # Show some objects if they exist
                if 'Contents' in response:
                    print("📁 Sample objects:")
                    for obj in response['Contents'][:3]:
                        print(f"   - {obj['Key']} ({obj['Size']} bytes)")

            except ClientError as e:
                print(f"⚠️  Could not list objects: {e}")

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '403':
                print(f"❌ Access denied to bucket '{bucket_name}' - check permissions")
            elif error_code == '404':
                print(f"❌ Bucket '{bucket_name}' does not exist")
            else:
                print(f"❌ Error accessing bucket: {e}")
            return False

    except NoCredentialsError:
        print("❌ No AWS credentials found")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

    return True

if __name__ == "__main__":
    success = test_s3_connection()
    sys.exit(0 if success else 1)