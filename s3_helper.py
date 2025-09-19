#!/usr/bin/env python3
"""
Resume Runner S3 Integration Helper
Handles file uploads and downloads to/from AWS S3
Currently stubbed with test data - will use real S3 when bucket is configured
"""

import os
import boto3
from botocore.exceptions import (
    ClientError,
    EndpointConnectionError,
    NoCredentialsError,
)
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import mimetypes
from datetime import datetime

load_dotenv()

class S3Helper:
    def __init__(self):
        """Initialize S3 client with configuration from environment"""
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'your-resume-runner-bucket')
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.is_stubbed = self.bucket_name == 'your-resume-runner-bucket'

        if not self.is_stubbed:
            try:
                self.s3_client = boto3.client(
                    's3',
                    region_name=self.aws_region,
                    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
                )
                self._verify_bucket_access()
            except (NoCredentialsError, ClientError, EndpointConnectionError) as e:
                print(f"⚠️  S3 configuration issue detected: {e}")
                print("   Falling back to stubbed S3 mode for development")
                self.is_stubbed = True
            except Exception as e:
                print(f"❌ Unexpected error while configuring S3: {e}")
                print("   Falling back to stubbed S3 mode for development")
                self.is_stubbed = True
        else:
            print("📝 S3Helper running in stubbed mode - update .env with real bucket name")

        # Surface final operating mode for clarity in logs
        if self.is_stubbed:
            print("ℹ️  S3Helper active in STUB mode – uploads will be simulated locally")
        else:
            print(f"ℹ️  S3Helper connected to bucket '{self.bucket_name}' in region '{self.aws_region}'")

    def _verify_bucket_access(self):
        """Verify we can access the S3 bucket"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print(f"✅ S3 bucket '{self.bucket_name}' is accessible")
        except (ClientError, EndpointConnectionError) as e:
            if isinstance(e, ClientError):
                error_code = e.response['Error']['Code']
                if error_code == '404':
                    print(f"❌ S3 bucket '{self.bucket_name}' does not exist")
                else:
                    print(f"❌ Error accessing S3 bucket: {e}")
            else:
                print(f"❌ Unable to reach S3 endpoint: {e}")
            self.is_stubbed = True
            print("ℹ️  S3Helper switching to stub mode due to connection issue")

    def upload_resume(self, file_path: str, version_name: str) -> str:
        """
        Upload a resume file to S3
        Returns the S3 key for the uploaded file
        """
        if self.is_stubbed:
            print("ℹ️  Uploading resume via STUB flow")
            return self._stub_upload_resume(file_path, version_name)

        try:
            # Generate S3 key
            file_extension = Path(file_path).suffix
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            s3_key = f"resume-runner/resumes/{version_name}_{timestamp}{file_extension}"

            # Determine content type
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'

            # Upload file
            with open(file_path, 'rb') as file:
                self.s3_client.upload_fileobj(
                    file,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': content_type,
                        'Metadata': {
                            'version_name': version_name,
                            'upload_timestamp': timestamp
                        }
                    }
                )

            print(f"✅ Resume uploaded to S3: {s3_key}")
            return s3_key

        except Exception as e:
            print(f"❌ Error uploading resume: {e}")
            print("ℹ️  Falling back to stub upload so request can complete")
            self.is_stubbed = True
            return self._stub_upload_resume(file_path, version_name)

    def upload_job_screenshot(self, file_path: str, company_name: str, job_title: str) -> str:
        """
        Upload a job posting screenshot to S3
        Returns the S3 key for the uploaded file
        """
        if self.is_stubbed:
            print("ℹ️  Uploading job screenshot via STUB flow")
            return self._stub_upload_screenshot(file_path, company_name, job_title)

        try:
            # Generate S3 key
            file_extension = Path(file_path).suffix
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_company = company_name.replace(' ', '_').replace('/', '_')
            safe_job = job_title.replace(' ', '_').replace('/', '_')[:50]  # Limit length
            s3_key = f"resume-runner/job_screenshots/{safe_company}_{safe_job}_{timestamp}{file_extension}"

            # Upload file
            with open(file_path, 'rb') as file:
                self.s3_client.upload_fileobj(
                    file,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': 'image/png',
                        'Metadata': {
                            'company_name': company_name,
                            'job_title': job_title,
                            'upload_timestamp': timestamp
                        }
                    }
                )

            print(f"✅ Job screenshot uploaded to S3: {s3_key}")
            return s3_key

        except Exception as e:
            print(f"❌ Error uploading screenshot: {e}")
            print("ℹ️  Falling back to stub upload so request can complete")
            self.is_stubbed = True
            return self._stub_upload_screenshot(file_path, company_name, job_title)

    def upload_cover_letter(self, file_path: str, company_name: str, position_title: str) -> str:
        """
        Upload a cover letter to S3
        Returns the S3 key for the uploaded file
        """
        if self.is_stubbed:
            print("ℹ️  Uploading cover letter via STUB flow")
            return self._stub_upload_cover_letter(file_path, company_name, position_title)

        try:
            # Generate S3 key
            file_extension = Path(file_path).suffix
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_company = company_name.replace(' ', '_').replace('/', '_')
            s3_key = f"resume-runner/cover_letters/{safe_company}_{position_title.replace(' ', '_')}_{timestamp}{file_extension}"

            # Upload file
            with open(file_path, 'rb') as file:
                self.s3_client.upload_fileobj(
                    file,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': 'application/pdf',
                        'Metadata': {
                            'company_name': company_name,
                            'position_title': position_title,
                            'upload_timestamp': timestamp
                        }
                    }
                )

            print(f"✅ Cover letter uploaded to S3: {s3_key}")
            return s3_key

        except Exception as e:
            print(f"❌ Error uploading cover letter: {e}")
            print("ℹ️  Falling back to stub upload so request can complete")
            self.is_stubbed = True
            return self._stub_upload_cover_letter(file_path, company_name, position_title)

    def get_download_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """
        Generate a pre-signed URL for downloading a file from S3
        expires_in: URL expiration time in seconds (default 1 hour)
        """
        if self.is_stubbed:
            return f"https://stub-bucket.s3.amazonaws.com/{s3_key}?expires_in={expires_in}"

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"❌ Error generating download URL: {e}")
            return f"https://stub-bucket.s3.amazonaws.com/{s3_key}?error=true"

    def download_file(self, s3_key: str, local_path: str) -> bool:
        """
        Download a file from S3 to local filesystem
        Returns True if successful, False otherwise
        """
        if self.is_stubbed:
            return self._stub_download_file(s3_key, local_path)

        try:
            self.s3_client.download_file(self.bucket_name, s3_key, local_path)
            print(f"✅ Downloaded {s3_key} to {local_path}")
            return True
        except Exception as e:
            print(f"❌ Error downloading file: {e}")
            return False

    def delete_file(self, s3_key: str) -> bool:
        """
        Delete a file from S3
        Returns True if successful, False otherwise
        """
        if self.is_stubbed:
            print(f"🧪 STUB: Would delete {s3_key} from S3")
            return True

        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            print(f"✅ Deleted {s3_key} from S3")
            return True
        except Exception as e:
            print(f"❌ Error deleting file: {e}")
            return False

    def list_files(self, prefix: str = "") -> list:
        """
        List files in S3 bucket with optional prefix filter
        Returns list of S3 keys
        """
        if self.is_stubbed:
            return self._stub_list_files(prefix)

        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            if 'Contents' in response:
                return [obj['Key'] for obj in response['Contents']]
            return []
        except Exception as e:
            print(f"❌ Error listing files: {e}")
            return []

    # Stub methods for development without real S3
    def _stub_upload_resume(self, file_path: str, version_name: str) -> str:
        """Stub method for resume upload"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_extension = Path(file_path).suffix
        s3_key = f"resume-runner/resumes/{version_name}_{timestamp}{file_extension}"
        print(f"🧪 STUB: Would upload resume to S3 as {s3_key}")
        return s3_key

    def _stub_upload_screenshot(self, file_path: str, company_name: str, job_title: str) -> str:
        """Stub method for screenshot upload"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_company = company_name.replace(' ', '_').replace('/', '_')
        safe_job = job_title.replace(' ', '_').replace('/', '_')[:50]
        s3_key = f"resume-runner/job_screenshots/{safe_company}_{safe_job}_{timestamp}.png"
        print(f"🧪 STUB: Would upload screenshot to S3 as {s3_key}")
        return s3_key

    def _stub_upload_cover_letter(self, file_path: str, company_name: str, position_title: str) -> str:
        """Stub method for cover letter upload"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_company = company_name.replace(' ', '_').replace('/', '_')
        s3_key = f"resume-runner/cover_letters/{safe_company}_{position_title.replace(' ', '_')}_{timestamp}.pdf"
        print(f"🧪 STUB: Would upload cover letter to S3 as {s3_key}")
        return s3_key

    def _stub_download_file(self, s3_key: str, local_path: str) -> bool:
        """Stub method for file download"""
        print(f"🧪 STUB: Would download {s3_key} to {local_path}")
        # Create empty file for testing
        Path(local_path).touch()
        return True

    def _stub_list_files(self, prefix: str = "") -> list:
        """Stub method for listing files"""
        stub_files = [
            "resume-runner/resumes/DataScience_Master_v1_20240918_143022.pdf",
            "resume-runner/resumes/Python_Backend_v2_20240918_143045.pdf",
            "resume-runner/resumes/CloudOps_DevOps_v1_20240918_143101.pdf",
            "resume-runner/job_screenshots/netflix_recommendation_systems_20240918_143201.png",
            "resume-runner/job_screenshots/aws_backend_engineer_20240918_143245.png",
            "resume-runner/cover_letters/Netflix_DataScientist_20240918_143301.pdf",
            "resume-runner/cover_letters/AWS_BackendEngineer_20240918_143345.pdf"
        ]

        filtered = [f for f in stub_files if f.startswith(prefix)] if prefix else stub_files
        print(f"🧪 STUB: Listing {len(filtered)} files with prefix '{prefix}'")
        return filtered

    def get_bucket_info(self) -> Dict[str, Any]:
        """Get information about the S3 bucket configuration"""
        return {
            'bucket_name': self.bucket_name,
            'region': self.aws_region,
            'is_stubbed': self.is_stubbed,
            'status': 'stubbed' if self.is_stubbed else 'active'
        }
