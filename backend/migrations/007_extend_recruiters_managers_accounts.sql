-- Migration: Extend recruiters table for manager and account tracking
-- Add fields to capture manager relationships and account information

-- UP

-- Add manager/account related fields
ALTER TABLE recruiters ADD COLUMN position_title TEXT; -- Their job title
ALTER TABLE recruiters ADD COLUMN department TEXT; -- Department they work in
ALTER TABLE recruiters ADD COLUMN manager_name TEXT; -- Name of their manager
ALTER TABLE recruiters ADD COLUMN manager_email TEXT; -- Manager's email
ALTER TABLE recruiters ADD COLUMN manager_phone TEXT; -- Manager's phone
ALTER TABLE recruiters ADD COLUMN manager_linkedin_url TEXT; -- Manager's LinkedIn
ALTER TABLE recruiters ADD COLUMN account_name TEXT; -- Account they manage (e.g., Netflix)
ALTER TABLE recruiters ADD COLUMN account_type TEXT; -- Type of account (client, internal, etc.)
ALTER TABLE recruiters ADD COLUMN office_location TEXT; -- Office location
ALTER TABLE recruiters ADD COLUMN timezone TEXT; -- Their timezone
ALTER TABLE recruiters ADD COLUMN phone_secondary TEXT; -- Secondary phone
ALTER TABLE recruiters ADD COLUMN preferred_contact_method TEXT; -- email, phone, linkedin, etc.
ALTER TABLE recruiters ADD COLUMN is_manager BOOLEAN DEFAULT FALSE; -- Whether they are a manager themselves
ALTER TABLE recruiters ADD COLUMN team_size INTEGER; -- If manager, how many people on team
ALTER TABLE recruiters ADD COLUMN decision_authority TEXT; -- Level of hiring decision authority

-- DOWN
-- SQLite cannot drop columns in-place; restore from backup or rebuild table to remove these fields.
