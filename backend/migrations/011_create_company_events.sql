-- Migration: Create company events timeline tracking

-- UP
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

-- DOWN
DROP INDEX IF EXISTS idx_company_events_date;
DROP INDEX IF EXISTS idx_company_events_company;
DROP TABLE IF EXISTS company_events;
