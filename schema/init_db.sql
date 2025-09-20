CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    linkedin_url TEXT,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    editable_s3_key TEXT,
    editable_filename TEXT
);
CREATE TABLE recruiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    primary_contact_name TEXT,
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
    is_starred BOOLEAN DEFAULT 0,
    position_title TEXT,
    department TEXT,
    manager_name TEXT,
    manager_email TEXT,
    manager_phone TEXT,
    manager_linkedin_url TEXT,
    account_name TEXT,
    account_type TEXT,
    office_location TEXT,
    timezone TEXT,
    phone_secondary TEXT,
    preferred_contact_method TEXT,
    is_manager BOOLEAN DEFAULT FALSE,
    team_size INTEGER,
    decision_authority TEXT,
    primary_company_id INTEGER REFERENCES companies(id),
    FOREIGN KEY (current_resume_version_id) REFERENCES resume_versions(id)
);
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
CREATE TABLE application_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    event_type TEXT DEFAULT 'note',
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_time TEXT,
    outcome TEXT,
    next_steps TEXT,
    attendees TEXT,
    location TEXT,
    meeting_link TEXT,
    documents_shared TEXT,
    duration_minutes INTEGER,
    follow_up_required BOOLEAN DEFAULT 0,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
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
CREATE INDEX idx_job_postings_company ON job_postings(company_id);
CREATE INDEX idx_communications_application ON communications(application_id);
CREATE INDEX idx_recruiters_status ON recruiters(relationship_status);
CREATE INDEX idx_application_events_application ON application_events(application_id);
CREATE INDEX idx_application_events_event_date ON application_events(event_date);
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
GROUP BY rv.id, rv.version_name, rv.skills_emphasized
/* resume_success_metrics(id,version_name,skills_emphasized,total_applications,interviews,offers,interview_rate) */;
CREATE VIEW company_activity AS
SELECT
    c.id,
    c.name,
    c.website,
    c.industry,
    c.company_size,
    c.headquarters,
    c.is_remote_friendly,
    c.updated_at,
    c.notes,
    c.linkedin_url,
    COUNT(jp.id) as total_jobs_posted,
    COUNT(a.id) as applications_sent,
    MAX(jp.date_posted) as last_job_posted,
    AVG(jp.salary_min) as avg_salary_min,
    AVG(jp.salary_max) as avg_salary_max,
    COUNT(CASE WHEN jp.is_remote = 1 THEN 1 END) as remote_jobs
FROM companies c
LEFT JOIN job_postings jp ON c.id = jp.company_id
LEFT JOIN applications a ON c.id = a.company_id
GROUP BY c.id, c.name, c.website, c.industry, c.company_size, c.headquarters,
         c.is_remote_friendly, c.updated_at, c.notes, c.linkedin_url
/* company_activity(id,name,website,industry,company_size,headquarters,is_remote_friendly,updated_at,notes,linkedin_url,total_jobs_posted,applications_sent,last_job_posted,avg_salary_min,avg_salary_max,remote_jobs) */;
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- hex color for UI display
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE resume_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(resume_version_id, tag_id) -- Prevent duplicate tag assignments
);
CREATE INDEX idx_resume_tags_resume ON resume_tags(resume_version_id);
CREATE INDEX idx_resume_tags_tag ON resume_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE VIEW resume_versions_with_tags AS
SELECT
    rv.id,
    rv.filename,
    rv.version_name,
    rv.target_roles,
    rv.description,
    rv.success_rate,
    rv.created_at,
    rv.updated_at,
    GROUP_CONCAT(t.name, ', ') as tags,
    COUNT(t.id) as tag_count
FROM resume_versions rv
LEFT JOIN resume_tags rt ON rv.id = rt.resume_version_id
LEFT JOIN tags t ON rt.tag_id = t.id
GROUP BY rv.id, rv.filename, rv.version_name, rv.target_roles, rv.description, rv.success_rate, rv.created_at, rv.updated_at
/* resume_versions_with_tags(id,filename,version_name,target_roles,description,success_rate,created_at,updated_at,tags,tag_count) */;
CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY);
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
CREATE INDEX idx_managers_company ON managers(company_id);
CREATE INDEX idx_managers_email ON managers(email);
CREATE TABLE recruiter_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiter_id INTEGER NOT NULL,
    event_type TEXT DEFAULT 'note',
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    follow_up_required BOOLEAN DEFAULT 0,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);
CREATE INDEX idx_recruiter_events_recruiter ON recruiter_events(recruiter_id);
CREATE INDEX idx_recruiter_events_date ON recruiter_events(event_date);
CREATE TABLE company_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    event_type TEXT DEFAULT 'note',
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    follow_up_required BOOLEAN DEFAULT 0,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
CREATE INDEX idx_company_events_company ON company_events(company_id);
CREATE INDEX idx_company_events_date ON company_events(event_date);
CREATE INDEX idx_resume_versions_files ON resume_versions(s3_key, editable_s3_key);
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
         r.success_rate, r.notes, r.is_starred, r.created_at, r.updated_at
/* recruiter_dashboard(id,name,primary_contact_name,email,phone,company,linkedin_url,specialties,current_resume_version_id,last_contact_date,relationship_status,success_rate,notes,is_starred,created_at,updated_at,total_applications,successful_applications,last_application_date,last_communication,recent_applications) */;
CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    job_posting_id INTEGER,
    recruiter_id INTEGER,
    resume_version_id INTEGER,
    position_title TEXT NOT NULL,
    application_date DATE NOT NULL,
    application_source TEXT,
    cover_letter_s3_key TEXT,
    job_posting_text TEXT,
    job_location TEXT,
    job_url TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    is_remote BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'applied',
    response_date DATE,
    interview_dates TEXT,
    salary_offered INTEGER,
    rejection_reason TEXT,
    feedback_received TEXT,
    follow_up_dates TEXT,
    outcome_notes TEXT,
    ai_match_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id)
);
CREATE INDEX idx_applications_company ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date ON applications(application_date);
CREATE VIEW active_applications AS
SELECT
    a.id,
    c.name as company_name,
    a.position_title,
    a.application_date,
    a.status,
    rv.version_name as resume_used,
    r.name as recruiter_name,
    r.primary_contact_name as recruiter_primary_contact,
    COALESCE(a.salary_min, jp.salary_min) as salary_min,
    COALESCE(a.salary_max, jp.salary_max) as salary_max,
    COALESCE(a.is_remote, jp.is_remote) as is_remote,
    a.job_posting_text,
    a.job_location,
    a.job_url,
    JULIANDAY('now') - JULIANDAY(a.application_date) as days_since_application
FROM applications a
JOIN companies c ON a.company_id = c.id
LEFT JOIN resume_versions rv ON a.resume_version_id = rv.id
LEFT JOIN recruiters r ON a.recruiter_id = r.id
LEFT JOIN job_postings jp ON a.job_posting_id = jp.id
WHERE a.status NOT IN ('rejected', 'withdrawn', 'offer')
ORDER BY a.application_date DESC
/* active_applications(id,company_name,position_title,application_date,status,resume_used,recruiter_name,recruiter_primary_contact,salary_min,salary_max,is_remote,job_posting_text,job_location,job_url,days_since_application) */;
