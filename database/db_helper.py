#!/usr/bin/env python3
"""
Resume Runner Database Helper Functions
Provides easy-to-use functions for database operations
"""

import sqlite3
import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ResumeRunnerDB:
    def __init__(self, db_path: Optional[str] = None):
        """Initialize database connection"""
        if db_path is None:
            db_path = os.getenv('DATABASE_PATH', 'database/resume_runner.db')

        # Convert relative path to absolute
        if not os.path.isabs(db_path):
            script_dir = Path(__file__).parent.parent
            db_path = script_dir / db_path

        self.db_path = str(db_path)
        self.ensure_db_exists()

    def ensure_db_exists(self):
        """Ensure database file exists"""
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Database not found at {self.db_path}. Run create_database.py first.")

    def get_connection(self):
        """Get database connection with row factory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    # Company operations
    def add_company(self, name: str, website: str = None, industry: str = None,
                   company_size: str = None, headquarters: str = None,
                   is_remote_friendly: bool = False, **kwargs) -> int:
        """Add a new company to the database"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO companies (name, website, industry, company_size,
                                     headquarters, is_remote_friendly)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, website, industry, company_size, headquarters, is_remote_friendly))
            return cursor.lastrowid

    def update_company(self, company_id: int, **kwargs) -> bool:
        """Update company fields dynamically"""
        allowed_fields = {
            'name', 'website', 'industry', 'company_size', 'headquarters',
            'is_remote_friendly', 'notes', 'is_starred'
        }

        updates = []
        values = []

        for field, value in kwargs.items():
            if field in allowed_fields and value is not None:
                if field in {'is_remote_friendly', 'is_starred'}:
                    value = int(bool(value))
                updates.append(f"{field} = ?")
                values.append(value)

        if not updates:
            return False

        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(company_id)
            query = f"UPDATE companies SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def get_company(self, company_id: int) -> Optional[Dict]:
        """Get company by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def find_company_by_name(self, name: str) -> Optional[Dict]:
        """Find company by name (case insensitive)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            search_term = f"%{name}%"
            cursor.execute(
                "SELECT * FROM companies WHERE LOWER(name) LIKE LOWER(?) LIMIT 1",
                (search_term,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def add_company_event(self, company_id: int, title: str, event_type: str = 'note',
                          event_date: date = None, description: str = None,
                          follow_up_required: bool = False, follow_up_date: date = None) -> int:
        """Add a timeline event for a company"""
        if event_date is None:
            event_date = date.today()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO company_events
                (company_id, event_type, title, description, event_date,
                 follow_up_required, follow_up_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (company_id, event_type, title, description, event_date,
                  int(follow_up_required), follow_up_date))
            return cursor.lastrowid

    def get_company_events(self, company_id: int) -> List[Dict]:
        """Fetch company timeline events ordered by most recent"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM company_events
                WHERE company_id = ?
                ORDER BY event_date DESC, created_at DESC
            """, (company_id,))
            return [dict(row) for row in cursor.fetchall()]

    def update_company_event(self, event_id: int, **kwargs) -> bool:
        """Update fields on a company event"""
        if not kwargs:
            return False

        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates = []
            values = []

            for field, value in kwargs.items():
                if value is not None:
                    updates.append(f"{field} = ?")
                    if field == 'follow_up_required':
                        values.append(int(bool(value)))
                    else:
                        values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(event_id)

            query = f"UPDATE company_events SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def delete_company_event(self, event_id: int) -> bool:
        """Remove a company event"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM company_events WHERE id = ?", (event_id,))
            return cursor.rowcount > 0

    # Resume version operations
    def add_resume_version(self, filename: str, version_name: str, content_text: str,
                          s3_key: str = None, editable_s3_key: str = None, editable_filename: str = None,
                          skills_emphasized: List[str] = None, target_roles: str = None,
                          is_master: bool = False, description: str = None) -> int:
        """Add a new resume version"""
        skills_json = json.dumps(skills_emphasized) if skills_emphasized else None
        word_count = len(content_text.split()) if content_text else 0

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO resume_versions (filename, version_name, content_text, s3_key,
                                           editable_s3_key, editable_filename, skills_emphasized,
                                           target_roles, is_master, description, word_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (filename, version_name, content_text, s3_key, editable_s3_key, editable_filename,
                  skills_json, target_roles, is_master, description, word_count))
            return cursor.lastrowid

    def update_resume_version(self, version_id: int, filename: str, version_name: str,
                             content_text: str, s3_key: str = None, editable_s3_key: str = None,
                             editable_filename: str = None, skills_emphasized: List[str] = None,
                             target_roles: str = None, is_master: bool = False, description: str = None):
        """Update an existing resume version"""
        skills_json = json.dumps(skills_emphasized) if skills_emphasized else None
        word_count = len(content_text.split()) if content_text else 0

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE resume_versions
                SET filename = ?, version_name = ?, content_text = ?, s3_key = ?,
                    editable_s3_key = ?, editable_filename = ?, skills_emphasized = ?,
                    target_roles = ?, is_master = ?, description = ?, word_count = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (filename, version_name, content_text, s3_key, editable_s3_key, editable_filename,
                  skills_json, target_roles, is_master, description, word_count, version_id))

    def get_resume_version(self, version_id: int) -> Optional[Dict]:
        """Get resume version by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resume_versions WHERE id = ?", (version_id,))
            row = cursor.fetchone()
            if row:
                result = dict(row)
                if result['skills_emphasized']:
                    result['skills_emphasized'] = json.loads(result['skills_emphasized'])
                return result
            return None

    def list_resume_versions(self) -> List[Dict]:
        """List all resume versions"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resume_versions ORDER BY created_at DESC")
            rows = cursor.fetchall()
            results = []
            for row in rows:
                result = dict(row)
                if result['skills_emphasized']:
                    result['skills_emphasized'] = json.loads(result['skills_emphasized'])
                results.append(result)
            return results

    # Recruiter operations
    def add_recruiter(self, name: str, primary_contact_name: str = None,
                     email: str = None, phone: str = None,
                     company: str = None, linkedin_url: str = None,
                     specialties: str = None, current_resume_version_id: int = None,
                     position_title: str = None, department: str = None,
                     manager_name: str = None, manager_email: str = None,
                     manager_phone: str = None, manager_linkedin_url: str = None,
                     account_name: str = None, account_type: str = None,
                     office_location: str = None, timezone: str = None,
                     phone_secondary: str = None, preferred_contact_method: str = None,
                     is_manager: bool = False, team_size: int = None,
                     decision_authority: str = None, relationship_status: str = 'new',
                     notes: str = None, is_starred: bool = False, **kwargs) -> int:
        """Add a new recruiter with full contact and manager information"""
        columns = [
            'name', 'primary_contact_name', 'email', 'phone', 'company', 'linkedin_url', 'specialties',
            'current_resume_version_id', 'position_title', 'department',
            'manager_name', 'manager_email', 'manager_phone', 'manager_linkedin_url',
            'account_name', 'account_type', 'office_location', 'timezone',
            'phone_secondary', 'preferred_contact_method', 'is_manager',
            'team_size', 'decision_authority', 'relationship_status', 'notes',
            'is_starred'
        ]

        values = (
            name, primary_contact_name, email, phone, company, linkedin_url, specialties,
            current_resume_version_id, position_title, department,
            manager_name, manager_email, manager_phone, manager_linkedin_url,
            account_name, account_type, office_location, timezone,
            phone_secondary, preferred_contact_method, int(bool(is_manager)),
            team_size, decision_authority, relationship_status, notes,
            int(bool(is_starred))
        )

        placeholders = ', '.join(['?'] * len(columns))

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"""
                INSERT INTO recruiters ({', '.join(columns)})
                VALUES ({placeholders})
                """,
                values
            )
            return cursor.lastrowid

    def update_recruiter_resume(self, recruiter_id: int, resume_version_id: int):
        """Update which resume version a recruiter has"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE recruiters
                SET current_resume_version_id = ?, last_contact_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (resume_version_id, recruiter_id))

    def get_recruiter(self, recruiter_id: int) -> Optional[Dict]:
        """Get recruiter by ID with current resume info"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT r.*, rv.version_name as current_resume_version
                FROM recruiters r
                LEFT JOIN resume_versions rv ON r.current_resume_version_id = rv.id
                WHERE r.id = ?
            """, (recruiter_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_recruiter(self, recruiter_id: int, name: str = None,
                        primary_contact_name: str = None,
                        email: str = None,
                        phone: str = None, company: str = None, linkedin_url: str = None,
                        specialties: str = None, position_title: str = None,
                        department: str = None, phone_secondary: str = None,
                        office_location: str = None, timezone: str = None,
                        preferred_contact_method: str = None, relationship_status: str = None,
                        notes: str = None, manager_name: str = None, manager_email: str = None,
                        manager_phone: str = None, manager_linkedin_url: str = None,
                        account_name: str = None, account_type: str = None,
                        is_manager: bool = None, team_size: int = None,
                        decision_authority: str = None, **kwargs) -> bool:
        """Update recruiter information with full manager and account details"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Build dynamic update query
            updates = []
            values = []

            for field, value in {
                'name': name,
                'primary_contact_name': primary_contact_name,
                'email': email,
                'phone': phone,
                'company': company,
                'linkedin_url': linkedin_url, 'specialties': specialties,
                'position_title': position_title, 'department': department,
                'phone_secondary': phone_secondary, 'office_location': office_location,
                'timezone': timezone, 'preferred_contact_method': preferred_contact_method,
                'relationship_status': relationship_status, 'notes': notes,
                'manager_name': manager_name, 'manager_email': manager_email,
                'manager_phone': manager_phone, 'manager_linkedin_url': manager_linkedin_url,
                'account_name': account_name, 'account_type': account_type,
                'is_manager': is_manager, 'team_size': team_size,
                'decision_authority': decision_authority,
                'is_starred': kwargs.get('is_starred') if 'is_starred' in kwargs else None
            }.items():
                if value is not None:
                    if field == 'is_starred':
                        value = int(bool(value))
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(recruiter_id)

            query = f"UPDATE recruiters SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def add_recruiter_resume_share(self, recruiter_id: int, resume_version_id: int,
                                  sharing_context: str = None, job_posting_id: int = None,
                                  notes: str = None) -> int:
        """Track sharing a resume with a recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO recruiter_resume_history
                (recruiter_id, resume_version_id, sharing_context, job_posting_id, notes)
                VALUES (?, ?, ?, ?, ?)
            """, (recruiter_id, resume_version_id, sharing_context, job_posting_id, notes))
            return cursor.lastrowid

    def get_recruiter_resume_history(self, recruiter_id: int) -> List[Dict]:
        """Get all resumes shared with a recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT rrh.*, rv.version_name, rv.filename, jp.title as job_title
                FROM recruiter_resume_history rrh
                JOIN resume_versions rv ON rrh.resume_version_id = rv.id
                LEFT JOIN job_postings jp ON rrh.job_posting_id = jp.id
                WHERE rrh.recruiter_id = ?
                ORDER BY rrh.shared_date DESC
            """, (recruiter_id,))
            return [dict(row) for row in cursor.fetchall()]

    def add_recruiter_communication(self, recruiter_id: int, communication_type: str,
                                   direction: str, subject: str = None, content: str = None,
                                   outcome: str = None, follow_up_required: bool = False,
                                   follow_up_date: date = None, notes: str = None) -> int:
        """Log communication with a recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO recruiter_communications
                (recruiter_id, communication_type, direction, subject, content,
                 outcome, follow_up_required, follow_up_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (recruiter_id, communication_type, direction, subject, content,
                  outcome, follow_up_required, follow_up_date, notes))
            return cursor.lastrowid

    def get_recruiter_communications(self, recruiter_id: int) -> List[Dict]:
        """Get all communications with a recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM recruiter_communications
                WHERE recruiter_id = ?
                ORDER BY communication_date DESC
            """, (recruiter_id,))
            return [dict(row) for row in cursor.fetchall()]

    def add_recruiter_event(self, recruiter_id: int, title: str, event_type: str = 'note',
                            event_date: date = None, description: str = None,
                            follow_up_required: bool = False, follow_up_date: date = None) -> int:
        """Add a timeline event for a recruiter"""
        if event_date is None:
            event_date = date.today()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO recruiter_events
                (recruiter_id, event_type, title, description, event_date,
                 follow_up_required, follow_up_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (recruiter_id, event_type, title, description, event_date,
                  int(follow_up_required), follow_up_date))
            return cursor.lastrowid

    def get_recruiter_events(self, recruiter_id: int) -> List[Dict]:
        """Fetch recruiter timeline events ordered by most recent"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM recruiter_events
                WHERE recruiter_id = ?
                ORDER BY event_date DESC, created_at DESC
            """, (recruiter_id,))
            return [dict(row) for row in cursor.fetchall()]

    def update_recruiter_event(self, event_id: int, **kwargs) -> bool:
        """Update fields on a recruiter event"""
        if not kwargs:
            return False

        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates = []
            values = []

            for field, value in kwargs.items():
                if value is not None:
                    updates.append(f"{field} = ?")
                    if field == 'follow_up_required':
                        values.append(int(bool(value)))
                    else:
                        values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(event_id)

            query = f"UPDATE recruiter_events SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def delete_recruiter_event(self, event_id: int) -> bool:
        """Remove a recruiter event"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM recruiter_events WHERE id = ?", (event_id,))
            return cursor.rowcount > 0

    def get_recruiter_dashboard(self) -> List[Dict]:
        """Get recruiter dashboard with metrics"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM recruiter_dashboard ORDER BY last_communication DESC NULLS LAST")
            return [dict(row) for row in cursor.fetchall()]

    # Manager operations
    def add_manager(self, name: str, email: str = None, phone: str = None,
                   phone_secondary: str = None, linkedin_url: str = None,
                   position_title: str = None, department: str = None,
                   company_id: int = None, office_location: str = None,
                   timezone: str = None, preferred_contact_method: str = 'email',
                   decision_authority: str = None, is_hiring_manager: bool = False,
                   team_size: int = None, notes: str = None, **kwargs) -> int:
        """Add a new manager"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO managers (
                    name, email, phone, phone_secondary, linkedin_url, position_title,
                    department, company_id, office_location, timezone, preferred_contact_method,
                    decision_authority, is_hiring_manager, team_size, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, email, phone, phone_secondary, linkedin_url, position_title,
                  department, company_id, office_location, timezone, preferred_contact_method,
                  decision_authority, is_hiring_manager, team_size, notes))
            return cursor.lastrowid

    def get_manager(self, manager_id: int) -> Optional[Dict]:
        """Get manager by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT m.*, c.name as company_name
                FROM managers m
                LEFT JOIN companies c ON m.company_id = c.id
                WHERE m.id = ?
            """, (manager_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_managers(self, company_id: int = None) -> List[Dict]:
        """Get all managers, optionally filtered by company"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if company_id:
                cursor.execute("""
                    SELECT m.*, c.name as company_name
                    FROM managers m
                    LEFT JOIN companies c ON m.company_id = c.id
                    WHERE m.company_id = ?
                    ORDER BY m.name
                """, (company_id,))
            else:
                cursor.execute("""
                    SELECT m.*, c.name as company_name
                    FROM managers m
                    LEFT JOIN companies c ON m.company_id = c.id
                    ORDER BY m.name
                """)
            return [dict(row) for row in cursor.fetchall()]

    def update_manager(self, manager_id: int, **kwargs) -> bool:
        """Update manager information"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates = []
            values = []

            for field, value in kwargs.items():
                if value is not None and field not in ['id', 'created_at']:
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(manager_id)

            query = f"UPDATE managers SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def delete_manager(self, manager_id: int) -> bool:
        """Delete a manager"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM managers WHERE id = ?", (manager_id,))
            return cursor.rowcount > 0

    # Recruiter-Manager relationship operations
    def add_recruiter_manager(self, recruiter_id: int, manager_id: int,
                             relationship_type: str = 'reports_to',
                             relationship_notes: str = None,
                             introduction_date: date = None,
                             is_primary_contact: bool = False, **kwargs) -> int:
        """Add a relationship between a recruiter and manager"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO recruiter_managers (
                    recruiter_id, manager_id, relationship_type, relationship_notes,
                    introduction_date, is_primary_contact
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (recruiter_id, manager_id, relationship_type, relationship_notes,
                  introduction_date, is_primary_contact))
            return cursor.lastrowid

    def get_recruiter_managers(self, recruiter_id: int) -> List[Dict]:
        """Get all managers associated with a recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT rm.*, m.name as manager_name, m.email as manager_email,
                       m.phone as manager_phone, m.position_title as manager_position,
                       m.department as manager_department, m.decision_authority,
                       m.is_hiring_manager, m.team_size, m.notes as manager_notes,
                       c.name as company_name
                FROM recruiter_managers rm
                JOIN managers m ON rm.manager_id = m.id
                LEFT JOIN companies c ON m.company_id = c.id
                WHERE rm.recruiter_id = ?
                ORDER BY rm.is_primary_contact DESC, m.name
            """, (recruiter_id,))
            return [dict(row) for row in cursor.fetchall()]

    def get_manager_recruiters(self, manager_id: int) -> List[Dict]:
        """Get all recruiters associated with a manager"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT rm.*, r.name as recruiter_name, r.email as recruiter_email,
                       r.phone as recruiter_phone, r.company as recruiter_company
                FROM recruiter_managers rm
                JOIN recruiters r ON rm.recruiter_id = r.id
                WHERE rm.manager_id = ?
                ORDER BY rm.is_primary_contact DESC, r.name
            """, (manager_id,))
            return [dict(row) for row in cursor.fetchall()]

    def update_recruiter_manager(self, recruiter_id: int, manager_id: int, **kwargs) -> bool:
        """Update recruiter-manager relationship"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates = []
            values = []

            for field, value in kwargs.items():
                if value is not None and field not in ['recruiter_id', 'manager_id', 'created_at']:
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.extend([recruiter_id, manager_id])

            query = f"UPDATE recruiter_managers SET {', '.join(updates)} WHERE recruiter_id = ? AND manager_id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def remove_recruiter_manager(self, recruiter_id: int, manager_id: int) -> bool:
        """Remove relationship between recruiter and manager"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM recruiter_managers
                WHERE recruiter_id = ? AND manager_id = ?
            """, (recruiter_id, manager_id))
            return cursor.rowcount > 0

    # Company-Recruiter association operations
    def add_company_recruiter(self, company_id: int, recruiter_id: int,
                             association_type: str = 'external',
                             start_date: date = None, specialization: str = None,
                             notes: str = None, **kwargs) -> int:
        """Add association between company and recruiter"""
        if start_date is None:
            start_date = date.today()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO company_recruiters (
                    company_id, recruiter_id, association_type, start_date,
                    specialization, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (company_id, recruiter_id, association_type, start_date,
                  specialization, notes))
            return cursor.lastrowid

    def get_company_recruiters(self, company_id: int, active_only: bool = True) -> List[Dict]:
        """Get all recruiters associated with a company"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT cr.*, r.name as recruiter_name, r.email as recruiter_email,
                       r.phone as recruiter_phone, r.linkedin_url as recruiter_linkedin,
                       r.specialties as recruiter_specialties, r.relationship_status
                FROM company_recruiters cr
                JOIN recruiters r ON cr.recruiter_id = r.id
                WHERE cr.company_id = ?
            """
            if active_only:
                query += " AND cr.is_active = 1"
            query += " ORDER BY cr.start_date DESC"

            cursor.execute(query, (company_id,))
            return [dict(row) for row in cursor.fetchall()]

    def get_recruiter_companies(self, recruiter_id: int, active_only: bool = True) -> List[Dict]:
        """Get all companies associated with a recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT cr.*, c.name as company_name, c.industry,
                       c.website
                FROM company_recruiters cr
                JOIN companies c ON cr.company_id = c.id
                WHERE cr.recruiter_id = ?
            """
            if active_only:
                query += " AND cr.is_active = 1"
            query += " ORDER BY cr.start_date DESC"

            cursor.execute(query, (recruiter_id,))
            return [dict(row) for row in cursor.fetchall()]

    def update_company_recruiter(self, company_id: int, recruiter_id: int, **kwargs) -> bool:
        """Update company-recruiter association"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates = []
            values = []

            for field, value in kwargs.items():
                if value is not None and field not in ['company_id', 'recruiter_id', 'created_at']:
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.extend([company_id, recruiter_id])

            query = f"UPDATE company_recruiters SET {', '.join(updates)} WHERE company_id = ? AND recruiter_id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def remove_company_recruiter(self, company_id: int, recruiter_id: int) -> bool:
        """Remove association between company and recruiter"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE company_recruiters SET is_active = 0, end_date = CURRENT_DATE
                WHERE company_id = ? AND recruiter_id = ?
            """, (company_id, recruiter_id))
            return cursor.rowcount > 0

    # Job posting operations
    def add_job_posting(self, company_id: int, title: str, description: str = None,
                       salary_min: int = None, salary_max: int = None,
                       is_remote: bool = False, location: str = None,
                       job_board_url: str = None, s3_screenshot_key: str = None,
                       date_posted: date = None, **kwargs) -> int:
        """Add a new job posting"""
        if date_posted is None:
            date_posted = date.today()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO job_postings (company_id, title, description, salary_min,
                                        salary_max, is_remote, location, job_board_url,
                                        s3_screenshot_key, date_posted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (company_id, title, description, salary_min, salary_max, is_remote,
                  location, job_board_url, s3_screenshot_key, date_posted))
            return cursor.lastrowid

    # Application operations
    def add_application(self, company_id: int, resume_version_id: Optional[int] = None, position_title: str = None,
                       application_date: date = None, job_posting_id: int = None,
                       recruiter_id: int = None, application_source: str = None,
                       cover_letter_s3_key: str = None, job_posting_text: str = None,
                       job_location: str = None, job_url: str = None,
                       salary_min: int = None, salary_max: int = None,
                       is_remote: Optional[bool] = None, notes: str = None,
                       outcome_notes: str = None, **kwargs) -> int:
        """Add a new job application"""
        if position_title is None:
            raise ValueError("position_title is required")

        if application_date is None:
            application_date = date.today()
        elif isinstance(application_date, str) and application_date:
            application_date = date.fromisoformat(application_date)

        if resume_version_id in ("", None):
            resume_version_id = None
        else:
            resume_version_id = int(resume_version_id)

        if salary_min in ("", None):
            salary_min = None
        else:
            salary_min = int(salary_min)

        if salary_max in ("", None):
            salary_max = None
        else:
            salary_max = int(salary_max)

        if is_remote is not None:
            # Normalize to integer 0/1 for SQLite
            if isinstance(is_remote, str):
                is_remote = is_remote.lower() in ('true', '1', 'yes')
            is_remote = 1 if is_remote else 0

        if outcome_notes is None and notes is not None:
            outcome_notes = notes

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO applications (
                    company_id,
                    job_posting_id,
                    recruiter_id,
                    resume_version_id,
                    position_title,
                    application_date,
                    application_source,
                    cover_letter_s3_key,
                    job_posting_text,
                    job_location,
                    job_url,
                    salary_min,
                    salary_max,
                    is_remote,
                    outcome_notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                company_id,
                job_posting_id,
                recruiter_id,
                resume_version_id,
                position_title,
                application_date,
                application_source,
                cover_letter_s3_key,
                job_posting_text,
                job_location,
                job_url,
                salary_min,
                salary_max,
                is_remote,
                outcome_notes
            ))
            return cursor.lastrowid

    def update_application_status(self, application_id: int, status: str,
                                 response_date: date = None, notes: str = None):
        """Update application status"""
        if response_date is None and status != 'applied':
            response_date = date.today()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE applications
                SET status = ?, response_date = ?, outcome_notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, response_date, notes, application_id))

    def update_application_resume(self, application_id: int, resume_version_id: Optional[int]) -> bool:
        """Update or clear the resume version used for an application"""
        if resume_version_id in ("", None):
            resume_version_id = None
        else:
            resume_version_id = int(resume_version_id)

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE applications
                SET resume_version_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (resume_version_id, application_id))
            return cursor.rowcount > 0

    def update_application(self, application_id: int, **kwargs) -> bool:
        """Update application fields"""
        allowed_fields = {
            'job_posting_text',
            'job_location',
            'job_url',
            'notes',
            'outcome_notes',
            'status',
            'job_posting_id',
            'is_remote',
            'application_source',
            'salary_min',
            'salary_max',
            'position_title'
        }

        updates = []
        values = []

        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'is_remote':
                    if value is None:
                        pass
                    elif isinstance(value, str):
                        lowered = value.lower()
                        if lowered in ('1', 'true', 'remote', 'yes'):
                            value = 1
                        elif lowered in ('0', 'false', 'onsite', 'no'):
                            value = 0
                        elif lowered in ('', 'unknown', 'null', 'none'):
                            value = None
                        else:
                            value = None
                    else:
                        value = 1 if bool(value) else 0
                elif field in {'salary_min', 'salary_max', 'job_posting_id'}:
                    if value in (None, ''):
                        value = None
                    else:
                        try:
                            value = int(value)
                        except (TypeError, ValueError):
                            continue
                updates.append(f"{field} = ?")
                values.append(value)

        if not updates:
            return False

        with self.get_connection() as conn:
            cursor = conn.cursor()
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(application_id)
            query = f"UPDATE applications SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def delete_application(self, application_id: int) -> bool:
        """Delete an application and related timeline/communications"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            existing_tables = {
                row[0]
                for row in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            }

            # Remove related records first to avoid orphan data
            if 'application_events' in existing_tables:
                cursor.execute("DELETE FROM application_events WHERE application_id = ?", (application_id,))
            if 'communications' in existing_tables:
                cursor.execute("DELETE FROM communications WHERE application_id = ?", (application_id,))

            cursor.execute("DELETE FROM applications WHERE id = ?", (application_id,))
            deleted = cursor.rowcount > 0
            return deleted

    # Utility views
    def get_active_applications(self) -> List[Dict]:
        """Get all active applications with company and resume info"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM active_applications")
            return [dict(row) for row in cursor.fetchall()]

    def get_resume_success_metrics(self) -> List[Dict]:
        """Get success metrics for all resume versions"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resume_success_metrics")
            return [dict(row) for row in cursor.fetchall()]

    def get_company_activity(self) -> List[Dict]:
        """Get hiring activity for all companies"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM company_activity")
            return [dict(row) for row in cursor.fetchall()]

    def get_company_details(self, company_id: int) -> Optional[Dict]:
        """Get detailed company information including basic info"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT c.*, ca.total_jobs_posted, ca.applications_sent,
                       ca.last_job_posted, ca.avg_salary_min, ca.avg_salary_max, ca.remote_jobs
                FROM companies c
                LEFT JOIN company_activity ca ON c.id = ca.id
                WHERE c.id = ?
            """, (company_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_company_job_postings(self, company_id: int) -> List[Dict]:
        """Get all job postings for a company"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT jp.*,
                       COUNT(a.id) as applications_count,
                       GROUP_CONCAT(DISTINCT a.status) as application_statuses
                FROM job_postings jp
                LEFT JOIN applications a ON jp.id = a.job_posting_id
                WHERE jp.company_id = ?
                GROUP BY jp.id
                ORDER BY jp.date_posted DESC
            """, (company_id,))
            return [dict(row) for row in cursor.fetchall()]

    def get_company_applications(self, company_id: int) -> List[Dict]:
        """Get all applications for a company"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.*, rv.version_name as resume_used, r.name as recruiter_name,
                       jp.title as job_posting_title
                FROM applications a
                LEFT JOIN resume_versions rv ON a.resume_version_id = rv.id
                LEFT JOIN recruiters r ON a.recruiter_id = r.id
                LEFT JOIN job_postings jp ON a.job_posting_id = jp.id
                WHERE a.company_id = ?
                ORDER BY a.application_date DESC
            """, (company_id,))
            return [dict(row) for row in cursor.fetchall()]

    def get_company_stats(self, company_id: int) -> Dict:
        """Get comprehensive stats for a company"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Basic counts
            cursor.execute("""
                SELECT
                    COUNT(DISTINCT jp.id) as total_jobs,
                    COUNT(DISTINCT a.id) as total_applications,
                    COUNT(DISTINCT CASE WHEN a.status IN ('phone_screen', 'interview', 'offer') THEN a.id END) as interviews_plus,
                    COUNT(DISTINCT CASE WHEN a.status = 'offer' THEN a.id END) as offers,
                    COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) as rejections,
                    MIN(a.application_date) as first_application,
                    MAX(a.application_date) as last_application,
                    AVG(jp.salary_min) as avg_salary_min,
                    AVG(jp.salary_max) as avg_salary_max
                FROM companies c
                LEFT JOIN job_postings jp ON c.id = jp.company_id
                LEFT JOIN applications a ON c.id = a.company_id
                WHERE c.id = ?
            """, (company_id,))

            stats = dict(cursor.fetchone())

            # Calculate success rate
            if stats['total_applications'] and stats['total_applications'] > 0:
                stats['success_rate'] = round((stats['interviews_plus'] / stats['total_applications']) * 100, 1)
            else:
                stats['success_rate'] = 0

            return stats

    # Search functions
    def search_applications_by_company(self, company_name: str) -> List[Dict]:
        """Search applications by company name"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.*, c.name as company_name, rv.version_name as resume_version
                FROM applications a
                JOIN companies c ON a.company_id = c.id
                LEFT JOIN resume_versions rv ON a.resume_version_id = rv.id
                WHERE LOWER(c.name) LIKE LOWER(?)
                ORDER BY a.application_date DESC
            """, (f"%{company_name}%",))
            return [dict(row) for row in cursor.fetchall()]

    def get_application_details(self, application_id: int) -> Optional[Dict]:
        """Get full application details for interview prep"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT
                    a.*,
                    c.name as company_name,
                    c.website as company_website,
                    rv.version_name as resume_version,
                    rv.content_text as resume_content,
                    rv.skills_emphasized as resume_skills,
                    jp.description as job_description,
                    COALESCE(a.salary_min, jp.salary_min) as salary_min,
                    COALESCE(a.salary_max, jp.salary_max) as salary_max,
                    COALESCE(a.is_remote, jp.is_remote) as is_remote,
                    r.name as recruiter_name, r.email as recruiter_email
                FROM applications a
                JOIN companies c ON a.company_id = c.id
                LEFT JOIN resume_versions rv ON a.resume_version_id = rv.id
                LEFT JOIN job_postings jp ON a.job_posting_id = jp.id
                LEFT JOIN recruiters r ON a.recruiter_id = r.id
                WHERE a.id = ?
            """, (application_id,))
            row = cursor.fetchone()
            if row:
                result = dict(row)
                if result['resume_skills']:
                    result['resume_skills'] = json.loads(result['resume_skills'])
                return result
            return None

    # Application events/timeline operations
    def add_application_event(self, application_id: int, event_type: str, event_date: date,
                             title: str, description: str = None, outcome: str = None,
                             next_steps: str = None, attendees: List[str] = None,
                             location: str = None, meeting_link: str = None,
                             documents_shared: List[str] = None, duration_minutes: int = None,
                             follow_up_required: bool = False, follow_up_date: date = None,
                             event_time: str = None) -> int:
        """Add an event to application timeline"""
        import json

        attendees_json = json.dumps(attendees) if attendees else None
        documents_json = json.dumps(documents_shared) if documents_shared else None

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO application_events
                (application_id, event_type, event_date, event_time, title, description,
                 outcome, next_steps, attendees, location, meeting_link, documents_shared,
                 duration_minutes, follow_up_required, follow_up_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (application_id, event_type, event_date, event_time, title, description,
                  outcome, next_steps, attendees_json, location, meeting_link, documents_json,
                  duration_minutes, follow_up_required, follow_up_date))
            return cursor.lastrowid

    def get_application_timeline(self, application_id: int) -> List[Dict]:
        """Get complete timeline for an application"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM application_events
                WHERE application_id = ?
                ORDER BY event_date DESC, created_at DESC
            """, (application_id,))
            return [dict(row) for row in cursor.fetchall()]

    def update_application_event(self, event_id: int, **kwargs) -> bool:
        """Update an application event"""
        import json

        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Build dynamic update query
            updates = []
            values = []

            for field, value in kwargs.items():
                if value is not None:
                    if field in ['attendees', 'documents_shared'] and isinstance(value, list):
                        value = json.dumps(value)
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(event_id)

            query = f"UPDATE application_events SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def delete_application_event(self, event_id: int) -> bool:
        """Delete an application event"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM application_events WHERE id = ?", (event_id,))
            return cursor.rowcount > 0

    def get_upcoming_follow_ups(self, days_ahead: int = 7) -> List[Dict]:
        """Get upcoming follow-ups across all applications"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT ae.*, a.position_title, c.name as company_name
                FROM application_events ae
                JOIN applications a ON ae.application_id = a.id
                JOIN companies c ON a.company_id = c.id
                WHERE ae.follow_up_required = 1
                AND ae.follow_up_date BETWEEN DATE('now') AND DATE('now', '+{} days')
                ORDER BY ae.follow_up_date ASC
            """.format(days_ahead))
            return [dict(row) for row in cursor.fetchall()]

    def auto_create_application_submitted_event(self, application_id: int, application_date: date) -> int:
        """Automatically create the initial 'application submitted' event"""
        return self.add_application_event(
            application_id=application_id,
            event_type='application_submitted',
            event_date=application_date,
            title='Application Submitted',
            description='Initial application submitted to the company',
            outcome='pending'
        )

    # Tag operations
    def add_tag(self, name: str, description: str = None, color: str = '#3B82F6') -> int:
        """Add a new tag"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tags (name, description, color)
                VALUES (?, ?, ?)
            """, (name, description, color))
            return cursor.lastrowid

    def get_all_tags(self) -> List[Dict]:
        """Get all available tags"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tags ORDER BY name")
            return [dict(row) for row in cursor.fetchall()]

    def get_tag(self, tag_id: int) -> Optional[Dict]:
        """Get tag by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tags WHERE id = ?", (tag_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def find_tag_by_name(self, name: str) -> Optional[Dict]:
        """Find tag by name (case insensitive)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tags WHERE LOWER(name) = LOWER(?)", (name,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_tag(self, tag_id: int, name: str = None, description: str = None, color: str = None) -> bool:
        """Update a tag"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            updates = []
            values = []

            for field, value in {'name': name, 'description': description, 'color': color}.items():
                if value is not None:
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            values.append(tag_id)
            query = f"UPDATE tags SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            return cursor.rowcount > 0

    def delete_tag(self, tag_id: int) -> bool:
        """Delete a tag (also removes all resume associations)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM tags WHERE id = ?", (tag_id,))
            return cursor.rowcount > 0

    # Resume tag operations
    def add_resume_tag(self, resume_version_id: int, tag_id: int) -> int:
        """Associate a tag with a resume version"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR IGNORE INTO resume_tags (resume_version_id, tag_id)
                VALUES (?, ?)
            """, (resume_version_id, tag_id))
            return cursor.lastrowid

    def remove_resume_tag(self, resume_version_id: int, tag_id: int) -> bool:
        """Remove a tag from a resume version"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM resume_tags
                WHERE resume_version_id = ? AND tag_id = ?
            """, (resume_version_id, tag_id))
            return cursor.rowcount > 0

    def get_resume_tags(self, resume_version_id: int) -> List[Dict]:
        """Get all tags for a resume version"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT t.* FROM tags t
                JOIN resume_tags rt ON t.id = rt.tag_id
                WHERE rt.resume_version_id = ?
                ORDER BY t.name
            """, (resume_version_id,))
            return [dict(row) for row in cursor.fetchall()]

    def set_resume_tags(self, resume_version_id: int, tag_ids: List[int]):
        """Set tags for a resume version (replaces existing tags)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Remove existing tags
            cursor.execute("DELETE FROM resume_tags WHERE resume_version_id = ?", (resume_version_id,))

            # Add new tags
            for tag_id in tag_ids:
                cursor.execute("""
                    INSERT INTO resume_tags (resume_version_id, tag_id)
                    VALUES (?, ?)
                """, (resume_version_id, tag_id))

    def search_resumes_by_tags(self, tag_names: List[str], match_all: bool = False) -> List[Dict]:
        """Search resumes by tag names"""
        if not tag_names:
            return []

        with self.get_connection() as conn:
            cursor = conn.cursor()

            placeholders = ', '.join(['?' for _ in tag_names])

            if match_all:
                # Must have ALL specified tags
                query = """
                    SELECT DISTINCT rv.* FROM resume_versions rv
                    JOIN resume_tags rt ON rv.id = rt.resume_version_id
                    JOIN tags t ON rt.tag_id = t.id
                    WHERE LOWER(t.name) IN ({})
                    GROUP BY rv.id
                    HAVING COUNT(DISTINCT t.id) = ?
                    ORDER BY rv.created_at DESC
                """.format(placeholders)
                params = [name.lower() for name in tag_names] + [len(tag_names)]
            else:
                # Must have ANY of the specified tags
                query = """
                    SELECT DISTINCT rv.* FROM resume_versions rv
                    JOIN resume_tags rt ON rv.id = rt.resume_version_id
                    JOIN tags t ON rt.tag_id = t.id
                    WHERE LOWER(t.name) IN ({})
                    ORDER BY rv.created_at DESC
                """.format(placeholders)
                params = [name.lower() for name in tag_names]

            cursor.execute(query, params)
            results = []
            for row in cursor.fetchall():
                result = dict(row)
                if result['skills_emphasized']:
                    result['skills_emphasized'] = json.loads(result['skills_emphasized'])
                results.append(result)
            return results

    def get_resume_versions_with_tags(self) -> List[Dict]:
        """Get all resume versions along with their tags"""
        try:
            print(f"🔍 [DEBUG] DB: Starting get_resume_versions_with_tags query...")
            with self.get_connection() as conn:
                cursor = conn.cursor()
                print(f"🔍 [DEBUG] DB: Executing SQL query...")
                cursor.execute(
                """
                SELECT
                    rv.id,
                    rv.filename,
                    rv.version_name,
                    rv.content_text,
                    rv.s3_key,
                    rv.editable_s3_key,
                    rv.editable_filename,
                    rv.skills_emphasized,
                    rv.target_roles,
                    rv.is_master,
                    rv.description,
                    rv.success_rate,
                    rv.word_count,
                    rv.created_at,
                    rv.updated_at,
                    GROUP_CONCAT(t.name, ', ') AS tags,
                    COUNT(t.id) AS tag_count
                FROM resume_versions rv
                LEFT JOIN resume_tags rt ON rv.id = rt.resume_version_id
                LEFT JOIN tags t ON rt.tag_id = t.id
                GROUP BY rv.id
                ORDER BY rv.created_at DESC
                """
            )

            print(f"🔍 [DEBUG] DB: Query executed, processing results...")
            results = []
            for row in cursor.fetchall():
                result = {
                    'id': row[0],
                    'filename': row[1],
                    'version_name': row[2],
                    'content_text': row[3],
                    's3_key': row[4],
                    'editable_s3_key': row[5],
                    'editable_filename': row[6],
                    'skills_emphasized': json.loads(row[7]) if row[7] else None,
                    'target_roles': row[8],
                    'is_master': row[9],
                    'description': row[10],
                    'success_rate': row[11],
                    'word_count': row[12],
                    'created_at': row[13],
                    'updated_at': row[14],
                    'tags': row[15],
                    'tag_count': row[16]
                }
                results.append(result)
            print(f"🔍 [DEBUG] DB: Processed {len(results)} results")
            return results
        except Exception as e:
            print(f"❌ [ERROR] DB: Error in get_resume_versions_with_tags: {str(e)}")
            import traceback
            print(f"❌ [ERROR] DB: Traceback: {traceback.format_exc()}")
            raise
