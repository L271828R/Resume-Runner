-- Migration: Create proper relationships for recruiters, managers, and companies
-- This creates a more normalized structure for managing multiple managers per recruiter
-- and proper company-recruiter associations

-- UP

-- Create a separate managers table
CREATE TABLE managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone_secondary TEXT,
    linkedin_url TEXT,
    position_title TEXT,
    department TEXT,
    company_id INTEGER,
    office_location TEXT,
    timezone TEXT,
    preferred_contact_method TEXT DEFAULT 'email',
    decision_authority TEXT,
    is_hiring_manager BOOLEAN DEFAULT FALSE,
    team_size INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create a junction table for recruiter-manager relationships
CREATE TABLE recruiter_managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiter_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    relationship_type TEXT DEFAULT 'reports_to', -- 'reports_to', 'works_with', 'introduced_by'
    relationship_notes TEXT,
    introduction_date DATE,
    last_interaction_date DATE,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE,
    UNIQUE(recruiter_id, manager_id)
);

-- Create a junction table for company-recruiter associations
CREATE TABLE company_recruiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    recruiter_id INTEGER NOT NULL,
    association_type TEXT DEFAULT 'external', -- 'internal', 'external', 'contractor', 'agency'
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    specialization TEXT, -- What this recruiter specializes in for this company
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE,
    UNIQUE(company_id, recruiter_id)
);

-- Add indexes for better performance
CREATE INDEX idx_managers_company ON managers(company_id);
CREATE INDEX idx_managers_email ON managers(email);
CREATE INDEX idx_recruiter_managers_recruiter ON recruiter_managers(recruiter_id);
CREATE INDEX idx_recruiter_managers_manager ON recruiter_managers(manager_id);
CREATE INDEX idx_company_recruiters_company ON company_recruiters(company_id);
CREATE INDEX idx_company_recruiters_recruiter ON company_recruiters(recruiter_id);
CREATE INDEX idx_company_recruiters_active ON company_recruiters(is_active);

-- Add a company_id to recruiters for their primary company affiliation
ALTER TABLE recruiters ADD COLUMN primary_company_id INTEGER REFERENCES companies(id);
CREATE INDEX idx_recruiters_primary_company ON recruiters(primary_company_id);

-- Create a view for recruiter details with manager and company info
DROP VIEW IF EXISTS recruiter_details;
CREATE VIEW recruiter_details AS
SELECT
    r.*,
    pc.name as primary_company_name,
    GROUP_CONCAT(DISTINCT m.name || '|' || COALESCE(m.position_title, '') || '|' ||
                 COALESCE(rm.relationship_type, '') || '|' || COALESCE(rm.relationship_notes, ''), '; ') as managers_info,
    GROUP_CONCAT(DISTINCT c.name || '|' || cr.association_type || '|' ||
                 COALESCE(cr.specialization, '') || '|' || cr.is_active, '; ') as companies_info,
    COUNT(DISTINCT rm.manager_id) as manager_count,
    COUNT(DISTINCT cr.company_id) as company_count
FROM recruiters r
LEFT JOIN companies pc ON r.primary_company_id = pc.id
LEFT JOIN recruiter_managers rm ON r.id = rm.recruiter_id
LEFT JOIN managers m ON rm.manager_id = m.id
LEFT JOIN company_recruiters cr ON r.id = cr.recruiter_id
LEFT JOIN companies c ON cr.company_id = c.id
GROUP BY r.id, r.name, r.email, r.phone, r.company, r.linkedin_url, r.specialties,
         r.current_resume_version_id, r.last_contact_date, r.relationship_status,
         r.success_rate, r.notes, r.created_at, r.updated_at, pc.name;

-- DOWN
DROP VIEW IF EXISTS recruiter_details;

DROP INDEX IF EXISTS idx_recruiters_primary_company;
DROP INDEX IF EXISTS idx_company_recruiters_active;
DROP INDEX IF EXISTS idx_company_recruiters_recruiter;
DROP INDEX IF EXISTS idx_company_recruiters_company;
DROP INDEX IF EXISTS idx_recruiter_managers_manager;
DROP INDEX IF EXISTS idx_recruiter_managers_recruiter;
DROP INDEX IF EXISTS idx_managers_email;
DROP INDEX IF EXISTS idx_managers_company;

DROP TABLE IF EXISTS company_recruiters;
DROP TABLE IF EXISTS recruiter_managers;
DROP TABLE IF EXISTS managers;

-- SQLite cannot drop the primary_company_id column without rebuilding the recruiters table.
