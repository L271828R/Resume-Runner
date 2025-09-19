-- Migration 004: Extend applications table with job posting details
-- Created: 2025-09-19
-- Description: Add columns to store job posting snapshot data and update active_applications view

-- UP
ALTER TABLE applications ADD COLUMN job_posting_text TEXT;
ALTER TABLE applications ADD COLUMN job_location TEXT;
ALTER TABLE applications ADD COLUMN job_url TEXT;
ALTER TABLE applications ADD COLUMN salary_min INTEGER;
ALTER TABLE applications ADD COLUMN salary_max INTEGER;
ALTER TABLE applications ADD COLUMN is_remote BOOLEAN DEFAULT 0;

DROP VIEW IF EXISTS active_applications;
CREATE VIEW active_applications AS
SELECT
    a.id,
    c.name AS company_name,
    a.position_title,
    a.application_date,
    a.status,
    rv.version_name AS resume_used,
    r.name AS recruiter_name,
    COALESCE(a.salary_min, jp.salary_min) AS salary_min,
    COALESCE(a.salary_max, jp.salary_max) AS salary_max,
    COALESCE(a.is_remote, jp.is_remote) AS is_remote,
    a.job_posting_text,
    a.job_location,
    a.job_url,
    JULIANDAY('now') - JULIANDAY(a.application_date) AS days_since_application
FROM applications a
JOIN companies c ON a.company_id = c.id
JOIN resume_versions rv ON a.resume_version_id = rv.id
LEFT JOIN recruiters r ON a.recruiter_id = r.id
LEFT JOIN job_postings jp ON a.job_posting_id = jp.id
WHERE a.status NOT IN ('rejected', 'withdrawn', 'offer')
ORDER BY a.application_date DESC;

-- Note: SQLite cannot drop the added application columns without table rebuild.

-- DOWN
DROP VIEW IF EXISTS active_applications;
CREATE VIEW active_applications AS
SELECT
    a.id,
    c.name as company_name,
    a.position_title,
    a.application_date,
    a.status,
    rv.version_name as resume_used,
    r.name as recruiter_name,
    jp.salary_min,
    jp.salary_max,
    jp.is_remote,
    JULIANDAY('now') - JULIANDAY(a.application_date) as days_since_application
FROM applications a
JOIN companies c ON a.company_id = c.id
JOIN resume_versions rv ON a.resume_version_id = rv.id
LEFT JOIN recruiters r ON a.recruiter_id = r.id
LEFT JOIN job_postings jp ON a.job_posting_id = jp.id
WHERE a.status NOT IN ('rejected', 'withdrawn', 'offer')
ORDER BY a.application_date DESC;
