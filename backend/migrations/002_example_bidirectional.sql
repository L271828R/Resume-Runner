-- Migration 002: Example Bidirectional Migration
-- Created: 2024-09-18
-- Description: Example of how to write UP/DOWN migrations

-- UP
-- Add example fields to demonstrate migration pattern
ALTER TABLE companies ADD COLUMN founded_year INTEGER;
ALTER TABLE companies ADD COLUMN employee_count INTEGER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companies_founded_year ON companies(founded_year);

-- DOWN
-- Remove the added fields and indexes
DROP INDEX IF EXISTS idx_companies_founded_year;

-- Note: SQLite doesn't support DROP COLUMN directly
-- For production rollbacks, you would need to:
-- 1. Create new table without the columns
-- 2. Copy data (excluding the columns)
-- 3. Drop old table and rename new one
-- For this example, we'll use ALTER TABLE which works in newer SQLite versions
-- ALTER TABLE companies DROP COLUMN employee_count;
-- ALTER TABLE companies DROP COLUMN founded_year;

-- For safer rollback, comment above and use table recreation:
CREATE TABLE IF NOT EXISTS companies_rollback_temp (
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
    hiring_frequency TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies_rollback_temp
SELECT id, name, website, industry, company_size, headquarters,
       is_remote_friendly, last_job_seen, total_jobs_tracked,
       avg_salary_min, avg_salary_max, hiring_frequency, notes,
       created_at, updated_at
FROM companies;

DROP TABLE companies;
ALTER TABLE companies_rollback_temp RENAME TO companies;