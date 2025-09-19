-- Migration 003: Add tagging system for resume versions
-- Created: 2025-09-18
-- Description: Add tags and resume_tags tables to enable flexible tagging of resume versions

-- UP

-- Tags table - stores all available tags
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- hex color for UI display
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume tags junction table - many-to-many relationship
CREATE TABLE resume_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_version_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(resume_version_id, tag_id) -- Prevent duplicate tag assignments
);

-- Indexes for efficient searching
CREATE INDEX idx_resume_tags_resume ON resume_tags(resume_version_id);
CREATE INDEX idx_resume_tags_tag ON resume_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);

-- View for resume versions with their tags
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
GROUP BY rv.id, rv.filename, rv.version_name, rv.target_roles, rv.description, rv.success_rate, rv.created_at, rv.updated_at;

-- DOWN

-- Drop view first
DROP VIEW IF EXISTS resume_versions_with_tags;

-- Drop indexes
DROP INDEX IF EXISTS idx_resume_tags_resume;
DROP INDEX IF EXISTS idx_resume_tags_tag;
DROP INDEX IF EXISTS idx_tags_name;

-- Drop tables (junction table first due to foreign keys)
DROP TABLE IF EXISTS resume_tags;
DROP TABLE IF EXISTS tags;