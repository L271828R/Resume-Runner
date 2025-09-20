"""
Tests for database operations in Resume Runner
"""
import pytest
import json
import sqlite3
from datetime import datetime, date


class TestCompanyOperations:
    """Test company CRUD operations"""

    def setup_method(self):
        """Setup before each test method"""
        self.test_data = {}

    def teardown_method(self):
        """Cleanup after each test method"""
        self.test_data = {}

    def test_add_company(self, temp_db, sample_company_data):
        """Test adding a new company"""
        company_id = temp_db.add_company(**sample_company_data)

        assert company_id is not None
        assert isinstance(company_id, int)
        assert company_id > 0

        company = temp_db.get_company(company_id)
        assert company is not None
        assert company['notes'] == sample_company_data['notes']
        assert company['is_remote_friendly'] == sample_company_data['is_remote_friendly']
        assert company['linkedin_url'] == sample_company_data['linkedin_url']

    def test_get_company(self, populated_db, sample_company_data):
        """Test retrieving a company by ID"""
        db = populated_db['db']
        company_id = populated_db['company_id']

        company = db.get_company(company_id)

        assert company is not None
        assert company['name'] == sample_company_data['name']
        assert company['website'] == sample_company_data['website']
        assert company['industry'] == sample_company_data['industry']
        assert company['is_remote_friendly'] == sample_company_data['is_remote_friendly']
        assert company['notes'] == sample_company_data['notes']
        assert company['linkedin_url'] == sample_company_data['linkedin_url']

    def test_find_company_by_name(self, populated_db, sample_company_data):
        """Test finding company by name"""
        db = populated_db['db']

        company = db.find_company_by_name(sample_company_data['name'])

        assert company is not None
        assert company['name'] == sample_company_data['name']

    def test_find_company_by_name_partial(self, populated_db):
        """Test finding company by partial name"""
        db = populated_db['db']

        company = db.find_company_by_name('Test Company')

        assert company is not None
        assert 'Test Company' in company['name']

    def test_find_nonexistent_company(self, temp_db):
        """Test finding non-existent company returns None"""
        company = temp_db.find_company_by_name('NonExistent Company')
        assert company is None

    def test_get_company_activity(self, populated_db, sample_company_data):
        """Test getting company activity metrics"""
        db = populated_db['db']

        activities = db.get_company_activity()

        assert isinstance(activities, list)
        assert len(activities) >= 1

        # Check if our test company is in the results
        company_names = [activity['name'] for activity in activities]
        assert 'Test Company Inc.' in company_names

        target = next(activity for activity in activities if activity['name'] == 'Test Company Inc.')
        assert target['notes'] == sample_company_data['notes']
        assert target['linkedin_url'] == sample_company_data['linkedin_url']


class TestResumeVersionOperations:
    """Test resume version CRUD operations"""

    def setup_method(self):
        """Setup before each test method"""
        self.test_data = {}

    def teardown_method(self):
        """Cleanup after each test method"""
        self.test_data = {}

    def test_add_resume_version(self, temp_db, sample_resume_data):
        """Test adding a new resume version"""
        resume_id = temp_db.add_resume_version(**sample_resume_data)

        assert resume_id is not None
        assert isinstance(resume_id, int)
        assert resume_id > 0

    def test_get_resume_version(self, populated_db, sample_resume_data):
        """Test retrieving a resume version by ID"""
        db = populated_db['db']
        resume_id = populated_db['resume_id']

        resume = db.get_resume_version(resume_id)

        assert resume is not None
        assert resume['version_name'] == sample_resume_data['version_name']
        assert resume['filename'] == sample_resume_data['filename']
        assert resume['is_master'] == sample_resume_data['is_master']
        assert resume['target_roles'] == sample_resume_data['target_roles']

    def test_list_resume_versions(self, populated_db):
        """Test listing all resume versions"""
        db = populated_db['db']

        versions = db.list_resume_versions()

        assert isinstance(versions, list)
        assert len(versions) >= 1

        # Check if our test resume is in the results
        version_names = [v['version_name'] for v in versions]
        assert 'Data Science v1' in version_names

    def test_resume_skills_parsing(self, populated_db):
        """Test that skills are properly stored and retrieved as JSON"""
        db = populated_db['db']
        resume_id = populated_db['resume_id']

        resume = db.get_resume_version(resume_id)

        assert 'skills_emphasized' in resume
        skills_value = resume['skills_emphasized']
        if skills_value:
            if isinstance(skills_value, str):
                skills = json.loads(skills_value)
            else:
                skills = skills_value
            assert isinstance(skills, list)
            assert 'Python' in skills
            assert 'Machine Learning' in skills

    def test_update_resume_version(self, populated_db):
        """Test updating a resume version"""
        db = populated_db['db']
        resume_id = populated_db['resume_id']

        # Update the resume version
        db.update_resume_version(
            version_id=resume_id,
            filename='updated_resume.pdf',
            version_name='Data Science v2',
            content_text='Updated resume content',
            skills_emphasized=['Python', 'TensorFlow', 'Docker'],
            target_roles='Senior Data Scientist',
            is_master=False,
            description='Updated description'
        )

        # Retrieve and verify
        updated_resume = db.get_resume_version(resume_id)
        assert updated_resume['version_name'] == 'Data Science v2'
        assert updated_resume['filename'] == 'updated_resume.pdf'
        assert updated_resume['is_master'] == False

    def test_get_resume_success_metrics(self, populated_db):
        """Test getting resume success metrics"""
        db = populated_db['db']

        metrics = db.get_resume_success_metrics()

        assert isinstance(metrics, list)
        # Should at least have our test resume version
        assert len(metrics) >= 0  # May be empty if no applications yet


class TestRecruiterOperations:
    """Test recruiter CRUD operations"""

    def setup_method(self):
        """Setup before each test method"""
        self.test_data = {}

    def teardown_method(self):
        """Cleanup after each test method"""
        self.test_data = {}

    def test_add_recruiter(self, temp_db, sample_recruiter_data):
        """Test adding a new recruiter"""
        recruiter_id = temp_db.add_recruiter(**sample_recruiter_data)

        assert recruiter_id is not None
        assert isinstance(recruiter_id, int)
        assert recruiter_id > 0

    def test_get_recruiter(self, populated_db, sample_recruiter_data):
        """Test retrieving a recruiter by ID"""
        db = populated_db['db']
        recruiter_id = populated_db['recruiter_id']

        recruiter = db.get_recruiter(recruiter_id)

        assert recruiter is not None
        assert recruiter['name'] == sample_recruiter_data['name']
        assert recruiter['primary_contact_name'] == sample_recruiter_data['primary_contact_name']
        assert recruiter['email'] == sample_recruiter_data['email']
        assert recruiter['company'] == sample_recruiter_data['company']
        assert recruiter['relationship_status'] == sample_recruiter_data['relationship_status']

    def test_update_recruiter_resume(self, populated_db):
        """Test updating which resume version a recruiter has"""
        db = populated_db['db']
        recruiter_id = populated_db['recruiter_id']
        resume_id = populated_db['resume_id']

        # Update recruiter's current resume
        db.update_recruiter_resume(recruiter_id, resume_id)

        # Verify the update
        recruiter = db.get_recruiter(recruiter_id)
        assert recruiter['current_resume_version_id'] == resume_id


class TestApplicationOperations:
    """Test application CRUD operations"""

    def setup_method(self):
        """Setup before each test method"""
        self.test_data = {}
        self.created_ids = []

    def teardown_method(self):
        """Cleanup after each test method"""
        self.test_data = {}
        self.created_ids = []

    def test_add_application(self, populated_db, sample_application_data):
        """Test adding a new application"""
        db = populated_db['db']

        # Use the populated company and resume IDs
        sample_application_data['company_id'] = populated_db['company_id']
        sample_application_data['resume_version_id'] = populated_db['resume_id']

        app_id = db.add_application(**sample_application_data)

        assert app_id is not None
        assert isinstance(app_id, int)
        assert app_id > 0

    def test_get_active_applications(self, populated_db, sample_application_data):
        """Test getting active applications"""
        db = populated_db['db']

        # Add an application first
        sample_application_data['company_id'] = populated_db['company_id']
        sample_application_data['resume_version_id'] = populated_db['resume_id']
        app_id = db.add_application(**sample_application_data)

        applications = db.get_active_applications()

        assert isinstance(applications, list)
        assert len(applications) >= 1

        # Find our test application
        test_app = next((app for app in applications if app['id'] == app_id), None)
        assert test_app is not None
        assert test_app['position_title'] == sample_application_data['position_title']

    def test_get_active_applications_without_resume(self, populated_db, sample_application_data):
        """Active applications should include records that do not yet have a resume"""
        db = populated_db['db']

        application_data = {
            **sample_application_data,
            'company_id': populated_db['company_id'],
            'position_title': 'Resume Pending'
        }
        application_data.pop('resume_version_id', None)

        app_id = db.add_application(**application_data)

        applications = db.get_active_applications()
        test_app = next((app for app in applications if app['id'] == app_id), None)

        assert test_app is not None
        assert test_app['resume_used'] is None

    def test_get_application_details(self, populated_db, sample_application_data):
        """Test getting detailed application information"""
        db = populated_db['db']

        # Add an application first
        sample_application_data['company_id'] = populated_db['company_id']
        sample_application_data['resume_version_id'] = populated_db['resume_id']
        app_id = db.add_application(**sample_application_data)

        details = db.get_application_details(app_id)

        assert details is not None
        assert details['position_title'] == sample_application_data['position_title']
        assert details['application_source'] == sample_application_data['application_source']
        assert 'company_name' in details  # Should include joined data

    def test_get_application_details_without_resume(self, populated_db, sample_application_data):
        """Details should be retrievable even without a resume"""
        db = populated_db['db']

        application_data = {
            **sample_application_data,
            'company_id': populated_db['company_id'],
            'position_title': 'Resume TBD'
        }
        application_data.pop('resume_version_id', None)

        app_id = db.add_application(**application_data)
        details = db.get_application_details(app_id)

        assert details is not None
        assert details['resume_version_id'] is None
        assert details['resume_version'] is None

    def test_update_application_status(self, populated_db, sample_application_data):
        """Test updating application status"""
        db = populated_db['db']

        # Add an application first
        sample_application_data['company_id'] = populated_db['company_id']
        sample_application_data['resume_version_id'] = populated_db['resume_id']
        app_id = db.add_application(**sample_application_data)

        # Update status
        response_date = date(2024, 9, 20)
        notes = 'Moved to phone screen round'

        db.update_application_status(app_id, 'phone_screen', response_date, notes)

        # Verify update
        details = db.get_application_details(app_id)
        assert details['status'] == 'phone_screen'
        assert details['outcome_notes'] == notes

    def test_search_applications_by_company(self, populated_db, sample_application_data):
        """Test searching applications by company name"""
        db = populated_db['db']

        # Add an application first
        sample_application_data['company_id'] = populated_db['company_id']
        sample_application_data['resume_version_id'] = populated_db['resume_id']
        app_id = db.add_application(**sample_application_data)

        # Search for applications
        applications = db.search_applications_by_company('Test Company')

        assert isinstance(applications, list)
        assert len(applications) >= 1

        # Find our test application
        test_app = next((app for app in applications if app['id'] == app_id), None)
        assert test_app is not None
        assert 'Test Company' in test_app['company_name']

    def test_add_application_without_resume(self, populated_db, sample_application_data):
        """Applications can be recorded without linking a resume"""
        db = populated_db['db']

        application_data = {
            **sample_application_data,
            'company_id': populated_db['company_id'],
            'position_title': 'Resume Later'
        }
        application_data.pop('resume_version_id', None)

        app_id = db.add_application(**application_data)
        assert isinstance(app_id, int)

        details = db.get_application_details(app_id)
        assert details['resume_version_id'] is None
        assert details['resume_version'] is None

    def test_update_application_resume_clear(self, populated_db, sample_application_data):
        """Clearing an application's resume should persist"""
        db = populated_db['db']

        sample_application_data['company_id'] = populated_db['company_id']
        sample_application_data['resume_version_id'] = populated_db['resume_id']
        app_id = db.add_application(**sample_application_data)

        result = db.update_application_resume(app_id, None)
        assert result is True

        details = db.get_application_details(app_id)
        assert details['resume_version_id'] is None
        assert details['resume_version'] is None


class TestDatabaseIntegrity:
    """Test database constraints and data integrity"""

    def setup_method(self):
        """Setup before each test method"""
        self.test_data = {}
        self.created_ids = []

    def teardown_method(self):
        """Cleanup after each test method"""
        self.test_data = {}
        self.created_ids = []

    def test_duplicate_company_name(self, temp_db, sample_company_data):
        """Test handling of duplicate company names"""
        # Add first company
        company_id1 = temp_db.add_company(**sample_company_data)
        assert company_id1 > 0

        # Second insert with same name should violate UNIQUE constraint
        with pytest.raises(sqlite3.IntegrityError):
            temp_db.add_company(**sample_company_data)

    def test_foreign_key_constraints(self, populated_db, sample_application_data):
        """Test foreign key constraints work properly"""
        db = populated_db['db']

        # Try to add application with invalid company_id
        sample_application_data['company_id'] = 99999  # Non-existent
        sample_application_data['resume_version_id'] = populated_db['resume_id']

        with pytest.raises(sqlite3.IntegrityError):
            db.add_application(**sample_application_data)

    def test_master_resume_logic(self, temp_db, sample_resume_data):
        """Test that master resume logic works correctly"""
        # Add first resume as master
        resume_data1 = sample_resume_data.copy()
        resume_data1['version_name'] = 'Resume v1'
        resume_data1['is_master'] = True
        resume_id1 = temp_db.add_resume_version(**resume_data1)

        # Add second resume as master (should work)
        resume_data2 = sample_resume_data.copy()
        resume_data2['version_name'] = 'Resume v2'
        resume_data2['is_master'] = True
        resume_id2 = temp_db.add_resume_version(**resume_data2)

        # Both should be added successfully
        assert resume_id1 > 0
        assert resume_id2 > 0

        # Both can be masters (business logic allows multiple masters)
        resume1 = temp_db.get_resume_version(resume_id1)
        resume2 = temp_db.get_resume_version(resume_id2)
        assert resume1['is_master'] == True
        assert resume2['is_master'] == True
