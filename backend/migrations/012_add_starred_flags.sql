-- Migration: Add starred flags for recruiters and companies, refresh aggregate views

-- UP
ALTER TABLE recruiters ADD COLUMN is_starred BOOLEAN DEFAULT 0;
ALTER TABLE companies ADD COLUMN is_starred BOOLEAN DEFAULT 0;

DROP VIEW IF EXISTS recruiter_dashboard;
CREATE VIEW recruiter_dashboard AS
SELECT
    r.id,
    r.name,
    r.primary_contact_name,
    r.email,
    r.phone,
    r.company,
    r.linkedin_url,
    r.specialties,
    r.current_resume_version_id,
    r.last_contact_date,
    r.relationship_status,
    r.success_rate,
    r.notes,
    r.is_starred,
    r.created_at,
    r.updated_at,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(CASE WHEN a.status IN ('phone_screen', 'interview', 'offer') THEN 1 END) as successful_applications,
    MAX(a.application_date) as last_application_date,
    r.last_contact_date as last_communication,
    GROUP_CONCAT(
        CASE WHEN a.application_date IS NOT NULL
        THEN c.name || '|' || a.position_title || '|' || a.application_date || '|' || a.status
        END, '; '
    ) as recent_applications
FROM recruiters r
LEFT JOIN applications a ON r.id = a.recruiter_id
LEFT JOIN companies c ON a.company_id = c.id
GROUP BY r.id, r.name, r.primary_contact_name, r.email, r.phone, r.company, r.linkedin_url, r.specialties,
         r.current_resume_version_id, r.last_contact_date, r.relationship_status,
         r.success_rate, r.notes, r.is_starred, r.created_at, r.updated_at;

DROP VIEW IF EXISTS company_activity;
CREATE VIEW company_activity AS
SELECT
    c.id,
    c.name,
    c.website,
    c.industry,
    c.company_size,
    c.headquarters,
    c.is_remote_friendly,
    c.is_starred,
    c.updated_at,
    COUNT(jp.id) as total_jobs_posted,
    COUNT(a.id) as applications_sent,
    MAX(jp.date_posted) as last_job_posted,
    AVG(jp.salary_min) as avg_salary_min,
    AVG(jp.salary_max) as avg_salary_max,
    COUNT(CASE WHEN jp.is_remote = 1 THEN 1 END) as remote_jobs
FROM companies c
LEFT JOIN job_postings jp ON c.id = jp.company_id
LEFT JOIN applications a ON c.id = a.company_id
GROUP BY c.id, c.name, c.website, c.industry, c.company_size,
         c.headquarters, c.is_remote_friendly, c.is_starred, c.updated_at;

-- DOWN
DROP VIEW IF EXISTS company_activity;
DROP VIEW IF EXISTS recruiter_dashboard;

CREATE VIEW recruiter_dashboard AS
SELECT
    r.id,
    r.name,
    r.primary_contact_name,
    r.email,
    r.phone,
    r.company,
    r.linkedin_url,
    r.specialties,
    r.current_resume_version_id,
    r.last_contact_date,
    r.relationship_status,
    r.success_rate,
    r.notes,
    r.created_at,
    r.updated_at,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(CASE WHEN a.status IN ('phone_screen', 'interview', 'offer') THEN 1 END) as successful_applications,
    MAX(a.application_date) as last_application_date,
    r.last_contact_date as last_communication,
    GROUP_CONCAT(
        CASE WHEN a.application_date IS NOT NULL
        THEN c.name || '|' || a.position_title || '|' || a.application_date || '|' || a.status
        END, '; '
    ) as recent_applications
FROM recruiters r
LEFT JOIN applications a ON r.id = a.recruiter_id
LEFT JOIN companies c ON a.company_id = c.id
GROUP BY r.id, r.name, r.primary_contact_name, r.email, r.phone, r.company, r.linkedin_url, r.specialties,
         r.current_resume_version_id, r.last_contact_date, r.relationship_status,
         r.success_rate, r.notes, r.created_at, r.updated_at;

CREATE VIEW company_activity AS
SELECT
    c.id,
    c.name,
    COUNT(jp.id) as total_jobs_posted,
    COUNT(a.id) as applications_sent,
    MAX(jp.date_posted) as last_job_posted,
    AVG(jp.salary_min) as avg_salary_min,
    AVG(jp.salary_max) as avg_salary_max,
    COUNT(CASE WHEN jp.is_remote = 1 THEN 1 END) as remote_jobs
FROM companies c
LEFT JOIN job_postings jp ON c.id = jp.company_id
LEFT JOIN applications a ON c.id = a.company_id
GROUP BY c.id, c.name;
