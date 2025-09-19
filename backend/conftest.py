"""
Pytest configuration and shared fixtures for Resume Runner backend tests
"""
import os
import shutil
import sys
from importlib import import_module, reload
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

# Add the parent directory to Python path to import our modules
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from database.db_helper import ResumeRunnerDB

TEST_DB_TEMPLATE = Path(os.environ.get('TEST_DB_TEMPLATE', REPO_ROOT / 'database' / 'resume_runner.db'))


def _copy_template_db(destination: Path) -> None:
    if not TEST_DB_TEMPLATE.exists():
        raise FileNotFoundError(
            f"Test database template not found at {TEST_DB_TEMPLATE}. "
            "Run 'python database/create_database.py' to create it."
        )
    shutil.copyfile(TEST_DB_TEMPLATE, destination)


@pytest.fixture
def test_db_path(tmp_path):
    """Copy the main database to a temporary location for a test."""
    temp_db_path = tmp_path / 'test_resume_runner.db'
    _copy_template_db(temp_db_path)
    return str(temp_db_path)


@pytest.fixture
def temp_db(test_db_path):
    """Database helper pointing to the temporary test copy."""
    return ResumeRunnerDB(test_db_path)


@pytest.fixture
def fresh_db(tmp_path):
    """Create a fresh database copy for each test."""
    db_path = tmp_path / 'fresh_test_db.db'
    _copy_template_db(db_path)
    return ResumeRunnerDB(str(db_path))

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
def flask_app(test_db_path, mock_s3_helper):
    """Create Flask app backed by the temporary test database."""
    original_db_env = os.environ.get('DATABASE_PATH')
    os.environ['DATABASE_PATH'] = test_db_path

    if 'server' in sys.modules:
        server_module = reload(sys.modules['server'])
    else:
        server_module = import_module('server')

    server_module.db = ResumeRunnerDB(test_db_path)
    server_module.app.config['TESTING'] = True

    try:
        yield server_module.app
    finally:
        if original_db_env is None:
            os.environ.pop('DATABASE_PATH', None)
        else:
            os.environ['DATABASE_PATH'] = original_db_env

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
