-- Migration: Create recruiter events timeline tracking

-- UP
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

-- DOWN
DROP INDEX IF EXISTS idx_recruiter_events_date;
DROP INDEX IF EXISTS idx_recruiter_events_recruiter;
DROP TABLE IF EXISTS recruiter_events;
