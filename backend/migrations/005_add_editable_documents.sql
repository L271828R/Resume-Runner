-- Migration: Add support for both PDF and editable document versions
-- This allows users to upload both a PDF (for viewing) and editable source files (DOC/DOCX)

-- UP

-- Add new columns to resume_versions table for editable document support
ALTER TABLE resume_versions ADD COLUMN editable_s3_key TEXT; -- S3 key for editable document (DOC/DOCX)
ALTER TABLE resume_versions ADD COLUMN editable_filename TEXT; -- Filename of editable document

-- Update existing data comments for clarity
-- filename -> PDF filename (for viewing)
-- s3_key -> PDF S3 key (for viewing)
-- editable_filename -> Editable source filename (for editing)
-- editable_s3_key -> Editable source S3 key (for editing)

-- Add index for efficient queries
CREATE INDEX idx_resume_versions_files ON resume_versions(s3_key, editable_s3_key);

-- DOWN
DROP INDEX IF EXISTS idx_resume_versions_files;
-- SQLite does not support dropping columns without table rebuild; restore from backup if necessary.
