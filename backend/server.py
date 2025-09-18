#!/usr/bin/env python3
"""
Resume Runner Flask Backend Server
Provides REST API endpoints for the Resume Runner application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger
import sys
import os
from datetime import datetime, date
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_helper import ResumeRunnerDB
from s3_helper import S3Helper

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize Swagger
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Resume Runner API",
        "description": "API for tracking job applications and resume versions",
        "version": "1.0.0",
        "contact": {
            "name": "Resume Runner",
        }
    },
    "host": "localhost:5001",
    "basePath": "/api",
    "schemes": ["http"],
    "consumes": ["application/json"],
    "produces": ["application/json"],
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Initialize database and S3 helpers
db = ResumeRunnerDB()
s3 = S3Helper()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint
    ---
    tags:
      - Health
    responses:
      200:
        description: Service health status
        schema:
          type: object
          properties:
            status:
              type: string
              example: healthy
            timestamp:
              type: string
              example: "2024-09-18T10:30:00"
            database:
              type: string
              example: connected
            s3_status:
              type: string
              example: active
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected',
        's3_status': s3.get_bucket_info()['status']
    })

# Company endpoints
@app.route('/api/companies', methods=['GET'])
def get_companies():
    """Get all companies with activity metrics
    ---
    tags:
      - Companies
    responses:
      200:
        description: List of companies with hiring metrics
        schema:
          type: object
          properties:
            companies:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                  name:
                    type: string
                  website:
                    type: string
                  industry:
                    type: string
                  total_jobs_posted:
                    type: integer
                  applications_sent:
                    type: integer
                  is_remote_friendly:
                    type: boolean
      500:
        description: Server error
    """
    try:
        companies = db.get_company_activity()
        return jsonify({'companies': companies})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies', methods=['POST'])
def create_company():
    """Create a new company
    ---
    tags:
      - Companies
    parameters:
      - in: body
        name: company
        description: Company data
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: "Netflix"
            website:
              type: string
              example: "https://netflix.com"
            industry:
              type: string
              example: "Streaming/Entertainment"
            company_size:
              type: string
              example: "Large (10000+)"
            headquarters:
              type: string
              example: "Los Gatos, CA"
            is_remote_friendly:
              type: boolean
              example: true
    responses:
      201:
        description: Company created successfully
        schema:
          type: object
          properties:
            company:
              type: object
      400:
        description: Invalid input data
    """
    try:
        data = request.get_json()
        company_id = db.add_company(**data)
        company = db.get_company(company_id)
        return jsonify({'company': company}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    """Get company by ID"""
    try:
        company = db.get_company(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        return jsonify({'company': company})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies/search', methods=['GET'])
def search_companies():
    """Search companies by name"""
    try:
        name = request.args.get('name', '')
        if not name:
            return jsonify({'error': 'Name parameter required'}), 400

        company = db.find_company_by_name(name)
        return jsonify({'company': company})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Resume version endpoints
@app.route('/api/resume-versions', methods=['GET'])
def get_resume_versions():
    """Get all resume versions"""
    try:
        versions = db.list_resume_versions()
        return jsonify({'resume_versions': versions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume-versions', methods=['POST'])
def create_resume_version():
    """Create a new resume version"""
    try:
        data = request.get_json()

        # Handle file upload if provided
        s3_key = None
        if 'file_path' in data and data['file_path']:
            s3_key = s3.upload_resume(data['file_path'], data['version_name'])

        # Prepare data for database
        db_data = {
            'filename': data.get('file_path', f"{data['version_name']}.pdf"),
            'version_name': data['version_name'],
            'content_text': data.get('content_text', ''),  # Empty for now
            's3_key': s3_key,
            'skills_emphasized': data.get('skills_emphasized', []),
            'target_roles': data.get('target_roles'),
            'is_master': data.get('is_master', False),
            'description': data.get('description')
        }

        version_id = db.add_resume_version(**db_data)
        version = db.get_resume_version(version_id)
        return jsonify({'resume_version': version}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/resume-versions/<int:version_id>', methods=['GET'])
def get_resume_version(version_id):
    """Get resume version by ID"""
    try:
        version = db.get_resume_version(version_id)
        if not version:
            return jsonify({'error': 'Resume version not found'}), 404
        return jsonify({'resume_version': version})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume-versions/<int:version_id>', methods=['PUT'])
def update_resume_version(version_id):
    """Update resume version by ID"""
    try:
        data = request.get_json()

        # Check if version exists
        existing_version = db.get_resume_version(version_id)
        if not existing_version:
            return jsonify({'error': 'Resume version not found'}), 404

        # Handle file upload if provided
        s3_key = existing_version.get('s3_key')
        if 'file_path' in data and data['file_path']:
            s3_key = s3.upload_resume(data['file_path'], data['version_name'])

        # Update the version
        update_data = {
            'version_id': version_id,
            'filename': data.get('file_path', existing_version['filename']),
            'version_name': data['version_name'],
            'content_text': data.get('content_text', existing_version['content_text']),
            's3_key': s3_key,
            'skills_emphasized': data.get('skills_emphasized', []),
            'target_roles': data.get('target_roles'),
            'is_master': data.get('is_master', False),
            'description': data.get('description')
        }

        db.update_resume_version(**update_data)
        version = db.get_resume_version(version_id)
        return jsonify({'resume_version': version})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/resume-versions/success-metrics', methods=['GET'])
def get_resume_success_metrics():
    """Get success metrics for all resume versions"""
    try:
        metrics = db.get_resume_success_metrics()
        return jsonify({'success_metrics': metrics})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Recruiter endpoints
@app.route('/api/recruiters', methods=['GET'])
def get_recruiters():
    """Get all recruiters"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT r.*, rv.version_name as current_resume_version
                FROM recruiters r
                LEFT JOIN resume_versions rv ON r.current_resume_version_id = rv.id
                ORDER BY r.last_contact_date DESC NULLS LAST
            """)
            recruiters = [dict(row) for row in cursor.fetchall()]
        return jsonify({'recruiters': recruiters})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recruiters', methods=['POST'])
def create_recruiter():
    """Create a new recruiter"""
    try:
        data = request.get_json()
        recruiter_id = db.add_recruiter(**data)
        recruiter = db.get_recruiter(recruiter_id)
        return jsonify({'recruiter': recruiter}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/recruiters/<int:recruiter_id>', methods=['GET'])
def get_recruiter(recruiter_id):
    """Get recruiter by ID"""
    try:
        recruiter = db.get_recruiter(recruiter_id)
        if not recruiter:
            return jsonify({'error': 'Recruiter not found'}), 404
        return jsonify({'recruiter': recruiter})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recruiters/<int:recruiter_id>/resume', methods=['PUT'])
def update_recruiter_resume(recruiter_id):
    """Update which resume version a recruiter has"""
    try:
        data = request.get_json()
        resume_version_id = data.get('resume_version_id')
        if not resume_version_id:
            return jsonify({'error': 'resume_version_id required'}), 400

        db.update_recruiter_resume(recruiter_id, resume_version_id)
        recruiter = db.get_recruiter(recruiter_id)
        return jsonify({'recruiter': recruiter})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Job posting endpoints
@app.route('/api/job-postings', methods=['GET'])
def get_job_postings():
    """Get all job postings"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT jp.*, c.name as company_name
                FROM job_postings jp
                JOIN companies c ON jp.company_id = c.id
                ORDER BY jp.date_posted DESC
            """)
            postings = [dict(row) for row in cursor.fetchall()]
        return jsonify({'job_postings': postings})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/job-postings', methods=['POST'])
def create_job_posting():
    """Create a new job posting"""
    try:
        data = request.get_json()

        # Handle screenshot upload if provided
        if 'screenshot_path' in data:
            company_name = data.get('company_name', 'Unknown')
            title = data.get('title', 'Unknown Position')
            s3_key = s3.upload_job_screenshot(data['screenshot_path'], company_name, title)
            data['s3_screenshot_key'] = s3_key

        posting_id = db.add_job_posting(**data)

        # Get the created posting with company name
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT jp.*, c.name as company_name
                FROM job_postings jp
                JOIN companies c ON jp.company_id = c.id
                WHERE jp.id = ?
            """, (posting_id,))
            posting = dict(cursor.fetchone())

        return jsonify({'job_posting': posting}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Application endpoints
@app.route('/api/applications', methods=['GET'])
def get_applications():
    """Get all applications"""
    try:
        applications = db.get_active_applications()
        return jsonify({'applications': applications})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications', methods=['POST'])
def create_application():
    """Create a new application"""
    try:
        data = request.get_json()

        # Handle cover letter upload if provided
        if 'cover_letter_path' in data:
            company_name = data.get('company_name', 'Unknown')
            position_title = data.get('position_title', 'Unknown Position')
            s3_key = s3.upload_cover_letter(data['cover_letter_path'], company_name, position_title)
            data['cover_letter_s3_key'] = s3_key

        app_id = db.add_application(**data)
        application = db.get_application_details(app_id)
        return jsonify({'application': application}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/applications/<int:app_id>', methods=['GET'])
def get_application(app_id):
    """Get application details for interview prep"""
    try:
        application = db.get_application_details(app_id)
        if not application:
            return jsonify({'error': 'Application not found'}), 404
        return jsonify({'application': application})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications/<int:app_id>/status', methods=['PUT'])
def update_application_status(app_id):
    """Update application status"""
    try:
        data = request.get_json()
        status = data.get('status')
        response_date = data.get('response_date')
        notes = data.get('notes')

        if not status:
            return jsonify({'error': 'Status required'}), 400

        # Convert date string to date object if provided
        if response_date:
            response_date = datetime.fromisoformat(response_date).date()

        db.update_application_status(app_id, status, response_date, notes)
        application = db.get_application_details(app_id)
        return jsonify({'application': application})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/applications/search', methods=['GET'])
def search_applications():
    """Search applications by company name"""
    try:
        company_name = request.args.get('company', '')
        if not company_name:
            return jsonify({'error': 'Company parameter required'}), 400

        applications = db.search_applications_by_company(company_name)
        return jsonify({'applications': applications})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# File download endpoints
@app.route('/api/files/download-url', methods=['POST'])
def get_download_url():
    """Get pre-signed download URL for S3 file"""
    try:
        data = request.get_json()
        s3_key = data.get('s3_key')
        expires_in = data.get('expires_in', 3600)  # Default 1 hour

        if not s3_key:
            return jsonify({'error': 's3_key required'}), 400

        url = s3.get_download_url(s3_key, expires_in)
        return jsonify({'download_url': url})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/files/list', methods=['GET'])
def list_s3_files():
    """List files in S3 bucket"""
    try:
        prefix = request.args.get('prefix', '')
        files = s3.list_files(prefix)
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard/Analytics endpoints
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get overview statistics for dashboard"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()

            # Get basic counts
            cursor.execute("SELECT COUNT(*) FROM applications")
            total_applications = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM applications WHERE status IN ('phone_screen', 'interview', 'offer')")
            interviews = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM applications WHERE status = 'offer'")
            offers = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM companies")
            companies_tracked = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM resume_versions")
            resume_versions = cursor.fetchone()[0]

            # Calculate success rates
            interview_rate = (interviews / total_applications * 100) if total_applications > 0 else 0
            offer_rate = (offers / total_applications * 100) if total_applications > 0 else 0

        stats = {
            'total_applications': total_applications,
            'interviews': interviews,
            'offers': offers,
            'companies_tracked': companies_tracked,
            'resume_versions': resume_versions,
            'interview_rate': round(interview_rate, 1),
            'offer_rate': round(offer_rate, 1)
        }

        return jsonify({'stats': stats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/recent-activity', methods=['GET'])
def get_recent_activity():
    """Get recent applications and status updates"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    a.id, a.position_title, a.application_date, a.status, a.updated_at,
                    c.name as company_name
                FROM applications a
                JOIN companies c ON a.company_id = c.id
                ORDER BY a.updated_at DESC
                LIMIT 10
            """)
            activities = [dict(row) for row in cursor.fetchall()]

        return jsonify({'recent_activity': activities})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Resume Runner Backend Server...")
    print(f"📊 Database: {db.db_path}")
    print(f"☁️  S3 Status: {s3.get_bucket_info()['status']}")
    print("🌐 API available at: http://localhost:5001")
    print("📚 API Documentation: http://localhost:5001/docs/")

    app.run(debug=True, host='0.0.0.0', port=5001)