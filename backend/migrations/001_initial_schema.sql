-- Migration 001: Initial Schema
-- Resume Runner Database Initial Setup
-- Created: 2024-09-18

-- Companies table - track companies and their hiring patterns
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    headquarters TEXT,
    is_remote_friendly BOOLEAN DEFAULT 0,
    last_job_seen DATE,
    total_jobs_tracked INTEGER DEFAULT 0,
    avg_salary_min INTEGER,
    avg_salary_max INTEGER,
    hiring_frequency TEXT, -- 'frequent', 'occasional', 'rare'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume versions table - track different versions of resumes
CREATE TABLE resume_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    version_name TEXT NOT NULL, -- e.g., 'DataScience_v3', 'Python_ML_v1'
    content_text TEXT NOT NULL, -- Full text content of the resume for AI analysis
    s3_key TEXT, -- S3 object key for the actual resume file (PDF/Word)
    skills_emphasized TEXT, -- JSON array of emphasized skills
    target_roles TEXT, -- What roles this version targets
    is_master BOOLEAN DEFAULT 0, -- Is this the master/base resume
    description TEXT, -- What makes this version unique
    success_rate REAL DEFAULT 0.0, -- interviews/applications ratio
    word_count INTEGER, -- For quick analysis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recruiters table - track recruiters and their preferences
CREATE TABLE recruiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT, -- Agency or company they work for
    linkedin_url TEXT,
    specialties TEXT, -- What roles/industries they focus on
    current_resume_version_id INTEGER, -- Which resume version they have
    last_contact_date DATE,
    relationship_status TEXT DEFAULT 'new', -- 'new', 'active', 'cold', 'blocked'
    success_rate REAL DEFAULT 0.0, -- How many of their referrals led to interviews
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_resume_version_id) REFERENCES resume_versions(id)
);

-- Job postings table - track individual job postings
CREATE TABLE job_postings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT, -- Full job description
    requirements TEXT, -- Key requirements extracted
    salary_min INTEGER,
    salary_max INTEGER,
    is_remote BOOLEAN DEFAULT 0,
    location TEXT,
    job_board_url TEXT, -- Original posting URL
    s3_screenshot_key TEXT, -- S3 key for job posting screenshot
    date_posted DATE,
    date_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'filled'
    interest_level INTEGER DEFAULT 0, -- 1-5 scale of your interest
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Applications table - track job applications you've made
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    job_posting_id INTEGER, -- May be NULL for cold applications
    recruiter_id INTEGER, -- May be NULL for direct applications
    resume_version_id INTEGER NOT NULL,
    position_title TEXT NOT NULL,
    application_date DATE NOT NULL,
    application_source TEXT, -- 'LinkedIn', 'Indeed', 'Company Website', 'Recruiter', etc.
    cover_letter_s3_key TEXT, -- S3 key for cover letter used
    status TEXT DEFAULT 'applied', -- 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'withdrawn'
    response_date DATE,
    interview_dates TEXT, -- JSON array of interview dates
    salary_offered INTEGER,
    rejection_reason TEXT,
    feedback_received TEXT,
    follow_up_dates TEXT, -- JSON array of follow-up dates
    outcome_notes TEXT,
    ai_match_score REAL, -- How well this matched your profile (for AI training)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id)
);

-- Communication log table - track all communications
CREATE TABLE communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    recruiter_id INTEGER,
    company_id INTEGER,
    communication_type TEXT NOT NULL, -- 'email', 'phone', 'linkedin', 'text'
    direction TEXT NOT NULL, -- 'inbound', 'outbound'
    subject TEXT,
    content TEXT,
    communication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_required BOOLEAN DEFAULT 0,
    follow_up_date DATE,
    notes TEXT,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- AI insights table - store AI-generated insights for future use
CREATE TABLE ai_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_type TEXT NOT NULL, -- 'resume_optimization', 'company_timing', 'application_strategy'
    subject_id INTEGER, -- ID of the subject (application, company, etc.)
    subject_type TEXT, -- 'application', 'company', 'resume_version', etc.
    insight_text TEXT NOT NULL,
    confidence_score REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_validated BOOLEAN DEFAULT NULL -- TRUE if proven correct, FALSE if wrong, NULL if unknown
);

-- Indexes for common queries
CREATE INDEX idx_applications_company ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date ON applications(application_date);
CREATE INDEX idx_job_postings_company ON job_postings(company_id);
CREATE INDEX idx_communications_application ON communications(application_id);
CREATE INDEX idx_recruiters_status ON recruiters(relationship_status);

-- Views for common queries

-- Success metrics by resume version
CREATE VIEW resume_success_metrics AS
SELECT
    rv.id,
    rv.version_name,
    rv.skills_emphasized,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status IN ('phone_screen', 'interview', 'offer') THEN 1 END) as interviews,
    COUNT(CASE WHEN a.status = 'offer' THEN 1 END) as offers,
    ROUND(
        COUNT(CASE WHEN a.status IN ('phone_screen', 'interview', 'offer') THEN 1 END) * 100.0 /
        NULLIF(COUNT(a.id), 0), 2
    ) as interview_rate
FROM resume_versions rv
LEFT JOIN applications a ON rv.id = a.resume_version_id
GROUP BY rv.id, rv.version_name, rv.skills_emphasized;

-- Company hiring activity
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

-- Active applications dashboard
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