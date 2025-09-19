-- Migration: Create application events timeline tracking

-- UP
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

CREATE INDEX idx_application_events_application ON application_events(application_id);
CREATE INDEX idx_application_events_event_date ON application_events(event_date);

-- DOWN
DROP INDEX IF EXISTS idx_application_events_event_date;
DROP INDEX IF EXISTS idx_application_events_application;
DROP TABLE IF EXISTS application_events;
