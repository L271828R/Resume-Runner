-- Migration: Create recruiter_dashboard view
-- This view aggregates recruiter data with communication metrics

-- UP

-- Drop existing view first
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
    -- Calculate metrics from applications
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(CASE WHEN a.status IN ('phone_screen', 'interview', 'offer') THEN 1 END) as successful_applications,
    MAX(a.application_date) as last_application_date,
    -- Get latest communication date (for now use last_contact_date)
    r.last_contact_date as last_communication,
    -- Get recent application details (last 3 applications)
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

-- DOWN
DROP VIEW IF EXISTS recruiter_dashboard;
