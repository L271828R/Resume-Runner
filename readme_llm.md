# Resume Runner – LLM Analysis

## Project Overview
Resume Runner addresses the resume/application management chaos that comes with applying to many roles at once. The system tracks resume variants, correlates them with applications, and exposes analytics that can later power AI-driven recommendations. Storage is hybrid: SQLite keeps structured metadata and resume text, while AWS S3 (stubbed in development) is intended for binary assets like PDFs and screenshots.

## Architecture at a Glance
- **Backend:** Flask + Swagger REST API with CORS enabled for the React client. The API wires directly into a rich SQLite helper (`database/db_helper.py`) and an S3 abstraction (`s3_helper.py`).
- **Database:** `init_db.sql` defines companies, resumes, recruiters, job postings, applications, communications, and AI insights tables, plus analytic views for resume success and company activity. Tooling includes schema migrations, rebuild scripts, and seed data.
- **Frontend:** React 18 with React Router and React Query. Pages cover dashboard metrics, application tracking, resume catalogs, and recruiter management, all backed by shared components such as forms, timelines, and tag selectors.
- **Tooling:** `start-dev.sh` spins up a tmux workspace that launches backend, frontend, database seeding, and optional gobang GUI. Additional CLI scripts handle tagging workflows and database inspection.

## Database Schema Updates
When altering tables, indexes, or views, keep the checked-in schema aligned with the live SQLite file so migrations can run cleanly in production. Recommended flow:
1. Apply your schema changes locally (via migration script or direct SQL) and verify the app/tests against `database/resume_runner.db`.
2. Export the fresh schema with `sqlite3 database/resume_runner.db ".schema" > schema/init_db.sql.tmp`.
3. Strip SQLite bookkeeping tables (e.g., `sqlite_sequence`) and tidy any wrapped column definitions, then replace `schema/init_db.sql`.
4. Spot-check resume-related tables (`resume_versions`, `recruiters`, `applications`) to confirm new columns are present before committing.
5. Delete the temporary dump file and commit the updated SQL alongside your change.

This keeps prod-ready migrations reproducible and prevents the extra SQLite tables from sneaking into version control.

## Key Components and Files
- `backend/server.py` – Main Flask app exposing CRUD + analytics endpoints and auto-generated Swagger docs at `/docs`.
- `database/db_helper.py` – Centralized SQLite helper with methods for each domain area plus tagging APIs consumed by CLI tools and HTTP routes.
- `database/init_db.sql` – Authoritative schema with indexes and views (e.g., `resume_success_metrics`, `company_activity`).
- `frontend/src/pages/*` – React screens using React Query for data fetching/mutation and consistent UI patterns for cards, tables, and modals.
- `frontend/src/components/*` – Shared UI pieces such as `ApplicationForm` (react-hook-form + custom dropdowns) and `TagSelector` (creates and assigns tags).
- `start-dev.sh` – tmux-based dev bootstrapper that provisions Python venv, npm install, DB seeding, and S3 status checks.
- `test_tags.py`, `test_api_tags.py`, `backend/test_database.py`, `backend/test_s3.py` – Local testing scripts that validate tagging, database operations, and S3 helpers.

## Notable Observations
- The tmux script reports the backend on port 5000, but the Flask server listens on 5001; updating one of these will avoid onboarding confusion.
- S3 helper is currently running in stub mode. Supplying real bucket credentials via `.env` will enable full upload/download flows.
- Tagging features are well-covered with scripts and UI integration, but comprehensive automated integration tests have room to grow.
- Extensive inline documentation and Swagger annotations will help future contributors navigate the API surface quickly.

## Suggested Next Steps
1. Align `start-dev.sh` messaging with the actual Flask port (5001) or standardize the server to run on 5000.
2. Expand automated tests to cover end-to-end tagging and dashboard analytics flows once APIs stabilize.
3. Document the process for configuring AWS credentials so the S3 helper can leave stub mode in non-dev environments.
