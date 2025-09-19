#!/usr/bin/env python3
"""
Resume Runner Test Data Seeder
Adds realistic test data to the database for development and testing
"""

from db_helper import ResumeRunnerDB
from datetime import date, timedelta
import random

def seed_test_data():
    """Add comprehensive test data to the database"""
    db = ResumeRunnerDB()

    print("🌱 Seeding test data...")

    # Sample companies
    companies_data = [
        {
            'name': 'Netflix',
            'website': 'https://netflix.com',
            'industry': 'Streaming/Entertainment',
            'company_size': 'Large (10000+)',
            'headquarters': 'Los Gatos, CA',
            'is_remote_friendly': True
        },
        {
            'name': 'Amazon Web Services',
            'website': 'https://aws.amazon.com',
            'industry': 'Cloud Computing',
            'company_size': 'Large (10000+)',
            'headquarters': 'Seattle, WA',
            'is_remote_friendly': True
        },
        {
            'name': 'Stripe',
            'website': 'https://stripe.com',
            'industry': 'Fintech',
            'company_size': 'Medium (1000-5000)',
            'headquarters': 'San Francisco, CA',
            'is_remote_friendly': True
        },
        {
            'name': 'Spotify',
            'website': 'https://spotify.com',
            'industry': 'Music/Technology',
            'company_size': 'Large (5000-10000)',
            'headquarters': 'Stockholm, Sweden',
            'is_remote_friendly': True
        },
        {
            'name': 'DataBricks',
            'website': 'https://databricks.com',
            'industry': 'Data Analytics',
            'company_size': 'Medium (1000-5000)',
            'headquarters': 'San Francisco, CA',
            'is_remote_friendly': True
        }
    ]

    company_ids = []
    for company in companies_data:
        company_id = db.add_company(**company)
        company_ids.append(company_id)
        print(f"  ✓ Added company: {company['name']}")

    # Sample resume versions
    resume_versions_data = [
        {
            'filename': 'Resume_DataScience_Master.pdf',
            'version_name': 'DataScience_Master_v1',
            'content_text': '''Luis Rueda
Senior Data Scientist | Machine Learning Engineer

Experience:
• 5+ years developing ML models for large-scale data processing
• Python expertise: pandas, scikit-learn, TensorFlow, PyTorch
• SQL and NoSQL database optimization
• AWS cloud infrastructure (EC2, S3, Lambda, SageMaker)
• Statistical analysis and A/B testing frameworks
• Docker containerization and Kubernetes orchestration

Education:
• MS Computer Science, Focus: Machine Learning
• BS Mathematics, Minor: Statistics

Skills: Python, R, SQL, TensorFlow, PyTorch, AWS, Docker, Kubernetes, Spark, Kafka''',
            's3_key': 'resumes/DataScience_Master_v1.pdf',
            'skills_emphasized': ['Python', 'Machine Learning', 'TensorFlow', 'AWS', 'SQL'],
            'target_roles': 'Data Scientist, ML Engineer, AI Engineer',
            'is_master': True,
            'description': 'Master resume emphasizing data science and ML experience'
        },
        {
            'filename': 'Resume_Python_Backend.pdf',
            'version_name': 'Python_Backend_v2',
            'content_text': '''Luis Rueda
Senior Python Developer | Backend Engineer

Experience:
• 6+ years building scalable backend systems with Python
• Django and Flask web framework expertise
• RESTful API design and microservices architecture
• PostgreSQL and Redis database management
• Docker containerization and CI/CD pipelines
• AWS deployment and infrastructure management
• Test-driven development and code review practices

Education:
• MS Computer Science
• BS Mathematics

Skills: Python, Django, Flask, PostgreSQL, Redis, Docker, AWS, REST APIs, Microservices''',
            's3_key': 'resumes/Python_Backend_v2.pdf',
            'skills_emphasized': ['Python', 'Django', 'Flask', 'PostgreSQL', 'AWS', 'REST APIs'],
            'target_roles': 'Backend Developer, Python Engineer, API Developer',
            'is_master': False,
            'description': 'Backend-focused resume emphasizing Python web development'
        },
        {
            'filename': 'Resume_CloudOps_DevOps.pdf',
            'version_name': 'CloudOps_DevOps_v1',
            'content_text': '''Luis Rueda
Cloud Operations Engineer | DevOps Specialist

Experience:
• 4+ years managing cloud infrastructure and deployment pipelines
• AWS certified solutions architect with hands-on experience
• Kubernetes cluster management and Docker containerization
• Infrastructure as Code using Terraform and CloudFormation
• CI/CD pipeline automation with Jenkins and GitHub Actions
• Monitoring and logging with CloudWatch, Prometheus, Grafana
• Python automation scripting and Bash operations

Education:
• MS Computer Science
• AWS Solutions Architect Certification

Skills: AWS, Kubernetes, Docker, Terraform, Jenkins, Python, Bash, CloudFormation''',
            's3_key': 'resumes/CloudOps_DevOps_v1.pdf',
            'skills_emphasized': ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'DevOps', 'CI/CD'],
            'target_roles': 'DevOps Engineer, Cloud Engineer, Platform Engineer',
            'is_master': False,
            'description': 'DevOps and cloud operations focused resume'
        }
    ]

    resume_version_ids = []
    for resume in resume_versions_data:
        resume_id = db.add_resume_version(**resume)
        resume_version_ids.append(resume_id)
        print(f"  ✓ Added resume version: {resume['version_name']}")

    # Sample recruiters
    recruiters_data = [
        {
            'name': 'TechRecruit Partners',
            'primary_contact_name': 'Sarah Chen',
            'email': 'sarah.chen@techrecruit.com',
            'phone': '+1-555-0123',
            'company': 'TechRecruit Partners',
            'linkedin_url': 'https://linkedin.com/in/sarahchenrecruit',
            'specialties': 'Data Science, Machine Learning, AI roles',
            'current_resume_version_id': resume_version_ids[0],  # DataScience version
            'relationship_status': 'active'
        },
        {
            'name': 'DevTalent Solutions',
            'primary_contact_name': 'Mike Rodriguez',
            'email': 'mike@devtalent.io',
            'phone': '+1-555-0456',
            'company': 'DevTalent Solutions',
            'linkedin_url': 'https://linkedin.com/in/mikerodriguezdev',
            'specialties': 'Backend Engineering, Python, API Development',
            'current_resume_version_id': resume_version_ids[1],  # Python Backend version
            'relationship_status': 'active'
        },
        {
            'name': 'CloudCareer Consulting',
            'primary_contact_name': 'Jennifer Kim',
            'email': 'j.kim@cloudcareer.com',
            'company': 'CloudCareer Consulting',
            'specialties': 'DevOps, Cloud Engineering, Platform roles',
            'current_resume_version_id': resume_version_ids[2],  # CloudOps version
            'relationship_status': 'new'
        }
    ]

    recruiter_ids = []
    for recruiter in recruiters_data:
        recruiter_id = db.add_recruiter(**recruiter)
        recruiter_ids.append(recruiter_id)
        print(f"  ✓ Added recruiter: {recruiter['name']} (primary contact: {recruiter.get('primary_contact_name', 'N/A')})")

    # Sample job postings
    job_postings_data = [
        {
            'company_id': company_ids[0],  # Netflix
            'title': 'Senior Data Scientist - Recommendation Systems',
            'description': 'Join Netflix to build ML models that help 200M+ users discover content they love. Work with petabyte-scale data using Python, Spark, and TensorFlow.',
            'salary_min': 180000,
            'salary_max': 250000,
            'is_remote': True,
            'location': 'Los Gatos, CA (Remote OK)',
            'job_board_url': 'https://jobs.netflix.com/jobs/12345',
            's3_screenshot_key': 'job_screenshots/netflix_ds_12345.png',
            'date_posted': date.today() - timedelta(days=14)
        },
        {
            'company_id': company_ids[1],  # AWS
            'title': 'Python Backend Engineer - EC2 Team',
            'description': 'Build and scale backend services for Amazon EC2. Work with Python, Django, and distributed systems at massive scale.',
            'salary_min': 160000,
            'salary_max': 220000,
            'is_remote': False,
            'location': 'Seattle, WA',
            'job_board_url': 'https://amazon.jobs/en/jobs/67890',
            's3_screenshot_key': 'job_screenshots/aws_backend_67890.png',
            'date_posted': date.today() - timedelta(days=7)
        },
        {
            'company_id': company_ids[2],  # Stripe
            'title': 'DevOps Engineer - Platform Infrastructure',
            'description': 'Help scale Stripe\'s payment infrastructure. Work with Kubernetes, Terraform, and AWS to support billions of API requests.',
            'salary_min': 170000,
            'salary_max': 230000,
            'is_remote': True,
            'location': 'San Francisco, CA (Remote OK)',
            'job_board_url': 'https://stripe.com/jobs/listing/devops-platform',
            's3_screenshot_key': 'job_screenshots/stripe_devops_platform.png',
            'date_posted': date.today() - timedelta(days=21)
        }
    ]

    job_posting_ids = []
    for job in job_postings_data:
        job_id = db.add_job_posting(**job)
        job_posting_ids.append(job_id)
        print(f"  ✓ Added job posting: {job['title']}")

    # Sample applications
    applications_data = [
        {
            'company_id': company_ids[0],  # Netflix
            'job_posting_id': job_posting_ids[0],
            'recruiter_id': recruiter_ids[0],  # Sarah Chen
            'resume_version_id': resume_version_ids[0],  # DataScience version
            'position_title': 'Senior Data Scientist - Recommendation Systems',
            'application_date': date.today() - timedelta(days=12),
            'application_source': 'Recruiter Referral',
            'cover_letter_s3_key': 'cover_letters/netflix_ds_cover.pdf'
        },
        {
            'company_id': company_ids[1],  # AWS
            'job_posting_id': job_posting_ids[1],
            'resume_version_id': resume_version_ids[1],  # Python Backend version
            'position_title': 'Python Backend Engineer - EC2 Team',
            'application_date': date.today() - timedelta(days=5),
            'application_source': 'LinkedIn',
            'cover_letter_s3_key': 'cover_letters/aws_backend_cover.pdf'
        },
        {
            'company_id': company_ids[2],  # Stripe
            'job_posting_id': job_posting_ids[2],
            'recruiter_id': recruiter_ids[2],  # Jennifer Kim
            'resume_version_id': resume_version_ids[2],  # CloudOps version
            'position_title': 'DevOps Engineer - Platform Infrastructure',
            'application_date': date.today() - timedelta(days=18),
            'application_source': 'Recruiter Referral',
            'cover_letter_s3_key': 'cover_letters/stripe_devops_cover.pdf'
        }
    ]

    application_ids = []
    for app in applications_data:
        app_id = db.add_application(**app)
        application_ids.append(app_id)
        print(f"  ✓ Added application: {app['position_title']}")

    # Update some application statuses to show progression
    status_updates = [
        (application_ids[0], 'phone_screen', 'Got phone screen! Interview scheduled for next week.'),
        (application_ids[1], 'applied', None),
        (application_ids[2], 'interview', 'Technical interview completed. Waiting for feedback.')
    ]

    for app_id, status, notes in status_updates:
        db.update_application_status(app_id, status, notes=notes)
        print(f"  ✓ Updated application {app_id} status: {status}")

    print("\n✅ Test data seeding completed!")
    print("\nSummary:")
    print(f"  • {len(companies_data)} companies")
    print(f"  • {len(resume_versions_data)} resume versions")
    print(f"  • {len(recruiters_data)} recruiters")
    print(f"  • {len(job_postings_data)} job postings")
    print(f"  • {len(applications_data)} applications")

if __name__ == "__main__":
    seed_test_data()
