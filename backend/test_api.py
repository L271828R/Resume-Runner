"""
Tests for the Flask API endpoints in Resume Runner
"""
import json

def test_health_check(client):
    """Test the /api/health endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'timestamp' in data
    assert data['database'] == 'connected'
    # The mock_s3_helper in conftest.py will return 'stubbed'
    assert data['s3_status'] == 'stubbed'

def test_get_companies(client, populated_db):
    """Test getting all companies"""
    response = client.get('/api/companies')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'companies' in data
    assert isinstance(data['companies'], list)
    assert len(data['companies']) > 0
    assert any(company['name'] == 'Test Company Inc.' for company in data['companies'])

def test_create_company(client, temp_db):
    """Test creating a new company"""
    new_company = {
        'name': 'NewCo',
        'website': 'https://newco.com',
        'industry': 'AI',
    }
    response = client.post('/api/companies', data=json.dumps(new_company), content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'company' in data
    assert data['company']['name'] == 'NewCo'
    assert data['company']['id'] is not None

def test_get_company_by_id(client, populated_db):
    """Test getting a single company by its ID"""
    company_id = populated_db['company_id']
    response = client.get(f'/api/companies/{company_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'company' in data
    assert data['company']['id'] == company_id
    assert data['company']['name'] == 'Test Company Inc.'

def test_update_company(client, populated_db):
    """Test updating a company's details"""
    company_id = populated_db['company_id']
    update_data = {'industry': 'FinTech'}
    response = client.put(f'/api/companies/{company_id}', data=json.dumps(update_data), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'company' in data
    assert data['company']['industry'] == 'FinTech'
    assert data['company']['name'] == 'Test Company Inc.'

def test_get_resume_versions(client, populated_db):
    """Test getting all resume versions"""
    response = client.get('/api/resume-versions')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'resume_versions' in data
    assert isinstance(data['resume_versions'], list)
    assert len(data['resume_versions']) > 0
    assert data['resume_versions'][0]['version_name'] == 'Data Science v1'

def test_create_resume_version(client, temp_db):
    """Test creating a new resume version"""
    new_resume = {
        'version_name': 'Software Engineer v1',
        'content_text': 'Test resume content with software engineering skills',
        'skills_emphasized': ['Python', 'JavaScript', 'React'],
        'target_roles': 'Software Engineer, Frontend Developer',
    }
    response = client.post('/api/resume-versions', data=json.dumps(new_resume), content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'resume_version' in data
    assert data['resume_version']['version_name'] == 'Software Engineer v1'
    assert data['resume_version']['id'] is not None

def test_get_resume_version_by_id(client, populated_db):
    """Test getting a single resume version by its ID"""
    resume_id = populated_db['resume_id']
    response = client.get(f'/api/resume-versions/{resume_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'resume_version' in data
    assert data['resume_version']['id'] == resume_id
    assert data['resume_version']['version_name'] == 'Data Science v1'

def test_update_resume_version(client, populated_db):
    """Test updating a resume version's details"""
    resume_id = populated_db['resume_id']
    update_data = {'target_roles': 'Senior Software Engineer'}
    response = client.put(f'/api/resume-versions/{resume_id}', data=json.dumps(update_data), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'resume_version' in data
    assert data['resume_version']['target_roles'] == 'Senior Software Engineer'
    assert data['resume_version']['version_name'] == 'Data Science v1'

def test_get_recruiters(client, populated_db):
    """Test getting all recruiters"""
    response = client.get('/api/recruiters')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recruiters' in data
    assert isinstance(data['recruiters'], list)
    assert len(data['recruiters']) > 0
    assert any(recruiter['name'] == 'Tech Recruitment Solutions' for recruiter in data['recruiters'])

def test_create_recruiter(client, temp_db):
    """Test creating a new recruiter"""
    new_recruiter = {
        'name': 'New Recruiter',
        'email': 'new@recruiter.com',
        'company': 'New Recruitment Co',
    }
    response = client.post('/api/recruiters', data=json.dumps(new_recruiter), content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'recruiter' in data
    assert data['recruiter']['name'] == 'New Recruiter'
    assert data['recruiter']['id'] is not None

def test_get_recruiter_by_id(client, populated_db):
    """Test getting a single recruiter by their ID"""
    recruiter_id = populated_db['recruiter_id']
    response = client.get(f'/api/recruiters/{recruiter_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recruiter' in data
    assert data['recruiter']['id'] == recruiter_id
    assert data['recruiter']['name'] == 'Tech Recruitment Solutions'

def test_update_recruiter(client, populated_db):
    """Test updating a recruiter's details"""
    recruiter_id = populated_db['recruiter_id']
    update_data = {'specialties': 'Data Engineering'}
    response = client.put(f'/api/recruiters/{recruiter_id}', data=json.dumps(update_data), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'recruiter' in data
    assert data['recruiter']['specialties'] == 'Data Engineering'
    assert data['recruiter']['name'] == 'Tech Recruitment Solutions'

def test_get_applications(client, populated_db):
    """Test getting all applications"""
    db = populated_db['db']
    app_id = db.add_application(
        company_id=populated_db['company_id'],
        position_title='Test Application',
        application_source='test',
        resume_version_id=populated_db['resume_id']
    )
    response = client.get('/api/applications')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'applications' in data
    assert isinstance(data['applications'], list)
    assert len(data['applications']) > 0
    assert data['applications'][0]['position_title'] == 'Test Application'

def test_create_application(client, populated_db):
    """Test creating a new application"""
    new_application = {
        'company_id': populated_db['company_id'],
        'position_title': 'New Test Application',
        'application_source': 'test',
        'resume_version_id': populated_db['resume_id']
    }
    response = client.post('/api/applications', data=json.dumps(new_application), content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'application' in data
    assert data['application']['position_title'] == 'New Test Application'
    assert data['application']['id'] is not None


def test_create_application_without_resume(client, populated_db):
    """Applications can be created without specifying a resume"""
    new_application = {
        'company_id': populated_db['company_id'],
        'position_title': 'Resume Optional Application',
        'application_source': 'test'
    }

    response = client.post(
        '/api/applications',
        data=json.dumps(new_application),
        content_type='application/json'
    )

    assert response.status_code == 201
    payload = json.loads(response.data)
    application = payload['application']
    assert application['resume_version_id'] is None
    assert application.get('resume_version') is None

def test_get_application_by_id(client, populated_db):
    """Test getting a single application by its ID"""
    db = populated_db['db']
    app_id = db.add_application(
        company_id=populated_db['company_id'],
        position_title='Test Application',
        application_source='test',
        resume_version_id=populated_db['resume_id']
    )
    response = client.get(f'/api/applications/{app_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'application' in data
    assert data['application']['id'] == app_id
    assert data['application']['position_title'] == 'Test Application'

def test_update_application(client, populated_db):
    """Test updating an application's details"""
    db = populated_db['db']
    app_id = db.add_application(
        company_id=populated_db['company_id'],
        position_title='Test Application',
        application_source='test',
        resume_version_id=populated_db['resume_id']
    )
    update_data = {'status': 'interview'}
    response = client.put(f'/api/applications/{app_id}', data=json.dumps(update_data), content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'application' in data
    assert data['application']['status'] == 'interview'
    assert data['application']['position_title'] == 'Test Application'


def test_manage_application_resume(client, populated_db):
    """Test the resume management endpoints"""
    db = populated_db['db']
    app_id = db.add_application(
        company_id=populated_db['company_id'],
        position_title='Resume CRUD Test',
        application_source='test'
    )

    resume_id = populated_db['resume_id']

    # Attach a resume via PUT
    put_response = client.put(
        f'/api/applications/{app_id}/resume',
        data=json.dumps({'resume_version_id': resume_id}),
        content_type='application/json'
    )
    assert put_response.status_code == 200
    put_payload = json.loads(put_response.data)
    assert put_payload['application']['resume_version_id'] == resume_id

    # Read back the resume via GET
    get_response = client.get(f'/api/applications/{app_id}/resume')
    assert get_response.status_code == 200
    resume_payload = json.loads(get_response.data)
    assert resume_payload['resume']['resume_version_id'] == resume_id

    # Remove the resume via DELETE
    delete_response = client.delete(f'/api/applications/{app_id}/resume')
    assert delete_response.status_code == 200
    delete_payload = json.loads(delete_response.data)
    assert delete_payload['application']['resume_version_id'] is None

    # Subsequent GET should report no resume
    follow_up_response = client.get(f'/api/applications/{app_id}/resume')
    assert follow_up_response.status_code == 200
    follow_up_payload = json.loads(follow_up_response.data)
    assert follow_up_payload['resume'] is None

def test_delete_application(client, populated_db):
    """Test deleting an application"""
    db = populated_db['db']
    app_id = db.add_application(
        company_id=populated_db['company_id'],
        position_title='Test Application',
        application_source='test',
        resume_version_id=populated_db['resume_id']
    )
    response = client.delete(f'/api/applications/{app_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Application deleted'

    # Verify it's gone
    response = client.get(f'/api/applications/{app_id}')
    assert response.status_code == 404
