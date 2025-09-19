"""
Pytest configuration and shared fixtures for Resume Runner backend tests
"""
import pytest
import os
import tempfile
import shutil
from unittest.mock import Mock, patch
import sys

# Add the parent directory to Python path to import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_helper import ResumeRunnerDB
from s3_helper import S3Helper


@pytest.fixture
def temp_db():
    """Create a temporary database for testing"""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, 'test_resume_runner.db')

    # Create test database
    db = ResumeRunnerDB(db_path)

    yield db

    # Cleanup - close database connections
    try:
        db.get_connection().close()
    except Exception:
        pass  # Connection might already be closed

    # Remove temporary directory
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def fresh_db():
    """Create a fresh database for each test (no shared data)"""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, 'fresh_test_db.db')

    # Create fresh database
    db = ResumeRunnerDB(db_path)

    yield db

    # Cleanup
    try:
        db.get_connection().close()
    except Exception:
        pass

    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_company_data():
    """Sample company data for testing"""
    return {
        'name': 'Test Company Inc.',
        'website': 'https://testcompany.com',
        'industry': 'Technology',
        'company_size': 'Medium (100-1000)',
        'headquarters': 'San Francisco, CA',
        'is_remote_friendly': True
    }


@pytest.fixture
def sample_resume_data():
    """Sample resume version data for testing"""
    return {
        'filename': 'test_resume.pdf',
        'version_name': 'Data Science v1',
        'content_text': 'Test resume content with data science skills',
        's3_key': 'resume-runner/resumes/test_resume_20240918.pdf',
        'skills_emphasized': ['Python', 'Machine Learning', 'SQL'],
        'target_roles': 'Data Scientist, ML Engineer',
        'is_master': True,
        'description': 'Resume optimized for data science roles'
    }


@pytest.fixture
def sample_recruiter_data():
    """Sample recruiter data for testing"""
    return {
        'name': 'Tech Recruitment Solutions',
        'primary_contact_name': 'Jane Smith',
        'email': 'jane.smith@techrecruiter.com',
        'phone': '(555) 123-4567',
        'company': 'Tech Recruitment Solutions',
        'linkedin_url': 'https://linkedin.com/in/janesmith',
        'specialties': 'Software Engineering, Data Science',
        'relationship_status': 'active',
        'preferred_contact_method': 'email',
        'notes': 'Great recruiter for tech roles'
    }


@pytest.fixture
def sample_application_data():
    """Sample application data for testing"""
    return {
        'company_id': 1,
        'position_title': 'Senior Data Scientist',
        'application_source': 'linkedin',
        'job_location': 'san_francisco_ca',
        'resume_version_id': 1,
        'job_posting_text': 'We are looking for a Senior Data Scientist...',
        'job_url': 'https://company.com/jobs/data-scientist',
        'salary_min': 120000,
        'salary_max': 160000,
        'is_remote': False,
        'application_date': '2024-09-18',
        'status': 'applied',
        'notes': 'Applied through LinkedIn recruiter'
    }


@pytest.fixture
def mock_s3_helper():
    """Mock S3Helper for testing without actual AWS calls"""
    with patch('s3_helper.S3Helper') as mock_s3:
        mock_instance = Mock()
        mock_instance.is_stubbed = True
        mock_instance.bucket_name = 'test-bucket'
        mock_instance.upload_resume.return_value = 'resume-runner/resumes/test_20240918.pdf'
        mock_instance.upload_job_screenshot.return_value = 'resume-runner/screenshots/test_20240918.png'
        mock_instance.upload_cover_letter.return_value = 'resume-runner/cover_letters/test_20240918.pdf'
        mock_instance.get_download_url.return_value = 'https://test-bucket.s3.amazonaws.com/test-file'
        mock_instance.list_files.return_value = ['test-file1.pdf', 'test-file2.pdf']
        mock_instance.delete_file.return_value = True
        mock_instance.get_bucket_info.return_value = {
            'bucket_name': 'test-bucket',
            'region': 'us-east-1',
            'is_stubbed': True,
            'status': 'stubbed'
        }
        mock_s3.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def flask_app():
    """Create Flask app for testing"""
    # Import here to avoid circular imports
    from server import app
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(flask_app):
    """Create test client"""
    return flask_app.test_client()


@pytest.fixture
def populated_db(temp_db, sample_company_data, sample_resume_data, sample_recruiter_data):
    """Database with sample data populated"""
    # Add sample company
    company_id = temp_db.add_company(**sample_company_data)

    # Add sample resume version
    resume_id = temp_db.add_resume_version(**sample_resume_data)

    # Add sample recruiter
    recruiter_id = temp_db.add_recruiter(**sample_recruiter_data)

    return {
        'db': temp_db,
        'company_id': company_id,
        'resume_id': resume_id,
        'recruiter_id': recruiter_id
    }


# Test data constants
TEST_SKILLS = ['Python', 'React', 'AWS', 'Docker', 'PostgreSQL']
TEST_COMPANIES = [
    'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta',
    'Netflix', 'Uber', 'Airbnb', 'Spotify', 'Slack'
]
TEST_LOCATIONS = [
    'san_francisco_ca', 'new_york_ny', 'seattle_wa',
    'austin_tx', 'remote', 'boston_ma'
]
