# Migration Guide

## Findings
- Earlier SQL files were missing the required `-- UP` / `-- DOWN` markers, which prevented `backend/migrations/migrate.py` from validating them.
- Multiple migrations add columns to existing tables; SQLite cannot drop columns natively, so rollbacks must rebuild affected tables or restore from backup.
- View definitions are duplicated across migrations. Always drop a view before re-creating it to avoid conflicts during upgrades or rollbacks.

## Running Migrations
1. Ensure you have a Python runtime available as `python3`.
2. From the repository root run `python3 backend/migrations/migrate.py` to apply pending migrations.
3. The script creates a backup before applying changes; keep an eye on its output for validation errors.

## Creating New Migrations
- Use `python3 backend/migrations/migrate.py create <name>` to scaffold a new file when possible.
- Every SQL migration **must** contain a single `-- UP` section followed by a `-- DOWN` section.
- Keep statements in each section idempotent: `DROP VIEW IF EXISTS`, `CREATE TABLE IF NOT EXISTS`, etc.
- When a rollback cannot be automated (for example, dropping columns), leave a clear comment in the `-- DOWN` block that explains the manual steps.

## Best Practices
- Group related schema changes (tables, indexes, views) in a single migration to simplify rollbacks.
- Add indexes in the same migration that creates the tables using them, and remove those indexes during rollback.
- When altering views in later migrations, copy the previous definition into the `-- DOWN` block so the prior shape is restored.
- After editing migrations, rerun `python3 backend/migrations/migrate.py status` to confirm the files validate.
- Keep the SQLite database checked into VC fresh by running `python database/create_database.py` when you change base schema files (helpful for tests).
