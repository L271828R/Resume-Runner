#!/usr/bin/env python3
"""
Resume Runner Database Migration Script
Usage:
    python migrate.py                 # Apply pending migrations
    python migrate.py --rollback      # Rollback latest migration
    python migrate.py --rollback N    # Rollback to version N
    python migrate.py status          # Show migration status
    python migrate.py create <name>   # Create new migration file
"""

import sqlite3
import os
import sys
import shutil
import hashlib
import re
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Optional

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'

class MigrationError(Exception):
    pass

class DatabaseMigrator:
    def __init__(self, db_path=None):
        """Initialize migration manager"""
        if db_path is None:
            # Default to the database path
            script_dir = Path(__file__).parent.parent.parent
            db_path = script_dir / "database" / "resume_runner.db"

        self.db_path = Path(db_path)
        self.migrations_dir = Path(__file__).parent
        self.backup_dir = self.migrations_dir / "backups"

        # Create directories if they don't exist
        self.backup_dir.mkdir(exist_ok=True)

        if not self.db_path.exists():
            print(f"{Colors.YELLOW}Database not found, creating: {self.db_path}{Colors.NC}")
            self._create_database()

    def print_colored(self, message: str, color: str = Colors.NC):
        print(f"{color}{message}{Colors.NC}")

    def _create_database(self):
        """Create database if it doesn't exist"""
        # Run the initial database creation
        database_dir = self.db_path.parent
        create_script = database_dir / "create_database.py"
        if create_script.exists():
            os.system(f"cd {database_dir} && python create_database.py")
        else:
            # Create empty database
            self.db_path.touch()

    def create_backup(self) -> Path:
        """Create backup before migration"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / timestamp
        backup_path.mkdir(exist_ok=True)

        backup_file = backup_path / "resume_runner_pre_migration.db"
        shutil.copy2(self.db_path, backup_file)

        self.print_colored(f"📦 Backup saved at {backup_path}", Colors.YELLOW)
        return backup_path

    def restore_backup(self, backup_path: Path):
        """Restore database from backup"""
        backup_file = backup_path / "resume_runner_pre_migration.db"
        shutil.copy2(backup_file, self.db_path)
        self.print_colored("🔄 Database restored from backup", Colors.YELLOW)

    def ensure_migrations_table(self):
        """Create migrations tracking table if it doesn't exist"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    filename TEXT NOT NULL,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    applied_by TEXT DEFAULT 'developer',
                    execution_time_ms INTEGER DEFAULT 0,
                    checksum TEXT,
                    description TEXT
                );
            """)
            conn.commit()

    def get_current_version(self) -> int:
        """Get current database version"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
            return cursor.fetchone()[0]

    def validate_migration_file(self, file_path: Path) -> Tuple[str, str]:
        """Validate migration file and return UP and DOWN SQL sections."""
        self.print_colored(f"🔍 Validating {file_path.name}", Colors.BLUE)

        content = file_path.read_text()

        # Check for required markers
        if not re.search(r'^-- UP$', content, re.MULTILINE):
            raise MigrationError(f"Missing '-- UP' marker in {file_path.name}")

        if not re.search(r'^-- DOWN$', content, re.MULTILINE):
            raise MigrationError(f"Missing '-- DOWN' marker in {file_path.name}")

        # Split content by -- UP and -- DOWN markers
        lines = content.split('\n')
        up_start = None
        down_start = None

        for i, line in enumerate(lines):
            if line.strip() == '-- UP':
                up_start = i + 1
            elif line.strip() == '-- DOWN':
                down_start = i + 1
                break

        if up_start is None:
            raise MigrationError(f"Could not find UP section in {file_path.name}")

        if down_start is None:
            raise MigrationError(f"Could not find DOWN section in {file_path.name}")

        # Extract UP and DOWN sections
        up_lines = lines[up_start:down_start-1]
        down_lines = lines[down_start:]

        up_sql = '\n'.join(up_lines).strip()
        down_sql = '\n'.join(down_lines).strip()

        # Remove comment lines and empty lines for validation
        up_cleaned = '\n'.join(line for line in up_sql.split('\n')
                              if line.strip() and not line.strip().startswith('--'))
        down_cleaned = '\n'.join(line for line in down_sql.split('\n')
                                if line.strip() and not line.strip().startswith('--'))

        if not up_cleaned:
            raise MigrationError(f"Empty UP section in {file_path.name}")

        if not down_cleaned:
            self.print_colored(f"⚠️  Empty DOWN section in {file_path.name} - rollback not supported", Colors.YELLOW)

        self.print_colored("   ✅ UP and DOWN sections validated", Colors.GREEN)
        return up_sql, down_sql

    def get_migration_version(self, filename: str) -> int:
        """Extract version number from migration filename."""
        match = re.match(r'^(\d+)', filename)
        if not match:
            raise MigrationError(f"Could not extract version from filename: {filename}")
        return int(match.group(1))

    def get_pending_migrations(self) -> List[Tuple[Path, int]]:
        """Get list of pending migrations sorted by version."""
        current_version = self.get_current_version()
        pending = []

        for file_path in self.migrations_dir.glob("*.sql"):
            if file_path.name.startswith("_"):
                continue

            version = self.get_migration_version(file_path.name)
            if version > current_version:
                pending.append((file_path, version))

        return sorted(pending, key=lambda x: x[1])

    def execute_sql(self, sql: str) -> float:
        """Execute SQL and return execution time in seconds."""
        start_time = datetime.now()

        with sqlite3.connect(self.db_path) as conn:
            # Remove any migration records from the SQL (handled separately)
            clean_sql = re.sub(r'INSERT INTO schema_migrations.*?;', '', sql, flags=re.DOTALL)
            if clean_sql.strip():
                conn.executescript(clean_sql)
                conn.commit()

        end_time = datetime.now()
        return (end_time - start_time).total_seconds()

    def calculate_checksum(self, file_path: Path) -> str:
        """Calculate MD5 checksum of file."""
        return hashlib.md5(file_path.read_bytes()).hexdigest()

    def get_migration_description(self, file_path: Path) -> str:
        """Extract description from migration file."""
        content = file_path.read_text()

        # Look for description patterns
        patterns = [
            r'^-- Description: (.*)$',
            r'^-- Migration \d+: (.*)$',
            r'^-- Change: (.*)$',
            r'^-- Summary: (.*)$',
            r'^-- (.*)$'  # Any comment line as fallback
        ]

        for pattern in patterns:
            match = re.search(pattern, content, re.MULTILINE)
            if match:
                desc = match.group(1).strip()
                if desc and not desc.startswith('Migration') and len(desc) > 5:
                    return desc

        # If no explicit description, use filename
        filename_desc = file_path.name.replace('.sql', '').replace('_', ' ')
        return filename_desc if filename_desc else "No description"

    def record_migration(self, file_path: Path, version: int, exec_time: float):
        """Record migration in schema_migrations table."""
        checksum = self.calculate_checksum(file_path)
        description = self.get_migration_description(file_path)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO schema_migrations
                (version, filename, applied_by, execution_time_ms, checksum, description)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (version, file_path.name, os.getenv('USER', 'system'), int(exec_time * 1000), checksum, description))
            conn.commit()

    def apply_migrations(self):
        """Apply all pending migrations."""
        self.print_colored("🚀 Starting database migration process", Colors.BLUE)

        current_version = self.get_current_version()
        self.print_colored(f"📊 Current DB version: {current_version}", Colors.BLUE)

        pending_migrations = self.get_pending_migrations()

        if not pending_migrations:
            self.print_colored("✅ No pending migrations", Colors.GREEN)
            return

        # Validate all migrations first
        self.print_colored("🔍 Validating all pending migrations...", Colors.BLUE)
        validated_migrations = []

        for file_path, version in pending_migrations:
            up_sql, down_sql = self.validate_migration_file(file_path)
            description = self.get_migration_description(file_path)
            validated_migrations.append((file_path, version, up_sql, down_sql, description))

        self.print_colored("✅ All migrations validated successfully", Colors.GREEN)

        # Show pending migrations
        self.print_colored("📋 Pending migrations:", Colors.YELLOW)
        for file_path, version, _, _, description in validated_migrations:
            print(f"  - {file_path.name}: {description}")

        # Confirm with user
        response = input("Apply these migrations? (y/N): ")
        if response.lower() != 'y':
            self.print_colored("❌ Cancelled", Colors.YELLOW)
            return

        # Create backup
        backup_path = self.create_backup()

        try:
            # Apply migrations
            for file_path, version, up_sql, down_sql, description in validated_migrations:
                self.print_colored(f"⚡ Applying {file_path.name}: {description}", Colors.YELLOW)

                exec_time = self.execute_sql(up_sql)
                self.record_migration(file_path, version, exec_time)

                self.print_colored(f"   ✅ Success ({exec_time:.2f}s)", Colors.GREEN)

            new_version = self.get_current_version()
            self.print_colored(f"🎉 Migrations applied: {current_version} → {new_version}", Colors.GREEN)

        except Exception as e:
            self.print_colored(f"💥 Migration failed: {e}", Colors.RED)
            self.restore_backup(backup_path)
            raise

    def rollback_migration(self, target_version=None):
        """Rollback to a specific version or latest."""
        current_version = self.get_current_version()

        if target_version is None:
            # Rollback latest migration
            target_version = current_version

        if target_version == 0:
            self.print_colored("⚠️  No migrations to rollback", Colors.YELLOW)
            return

        # Get migration info from database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT filename FROM schema_migrations WHERE version = ?", (target_version,))
            result = cursor.fetchone()

            if not result:
                raise MigrationError(f"No migration found for version {target_version}")

            filename = result[0]

        migration_file = self.migrations_dir / filename
        if not migration_file.exists():
            raise MigrationError(f"Migration file missing: {migration_file}")

        # Validate and get DOWN SQL
        up_sql, down_sql = self.validate_migration_file(migration_file)

        if not down_sql.strip() or not any(line.strip() and not line.strip().startswith('--')
                                          for line in down_sql.split('\n')):
            raise MigrationError(f"Migration {target_version} has no rollback support")

        self.print_colored(f"🔄 Rolling back version {target_version} ({filename})", Colors.YELLOW)

        # Create backup
        backup_path = self.create_backup()

        try:
            # Execute rollback
            self.execute_sql(down_sql)

            # Remove from migrations table
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM schema_migrations WHERE version = ?", (target_version,))
                conn.commit()

            self.print_colored(f"✅ Rolled back migration {target_version}", Colors.GREEN)

        except Exception as e:
            self.print_colored(f"💥 Rollback failed: {e}", Colors.RED)
            self.restore_backup(backup_path)
            raise

    def status(self):
        """Show migration status"""
        applied = self.get_applied_migrations()
        available = self.get_available_migrations()
        pending = self.get_pending_migrations()

        print("📊 Migration Status")
        print("=" * 50)
        print(f"Database: {self.db_path}")
        print(f"Applied migrations: {len(applied)}")
        print(f"Available migrations: {len(available)}")
        print(f"Pending migrations: {len(pending)}")
        print()

        if applied:
            print("✅ Applied Migrations:")
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT version, filename, applied_at, description
                    FROM schema_migrations
                    ORDER BY version
                """)
                for version, filename, applied_at, description in cursor.fetchall():
                    print(f"   {version:03d}: {description} (applied {applied_at})")
            print()

        if pending:
            print("⏳ Pending Migrations:")
            for file_path, version in pending:
                description = self.get_migration_description(file_path)
                print(f"   {version:03d}: {description}")
        else:
            print("✅ No pending migrations")

    def get_applied_migrations(self):
        """Get list of applied migrations"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT version FROM schema_migrations ORDER BY version")
            return [row[0] for row in cursor.fetchall()]

    def get_available_migrations(self):
        """Get list of available migration files"""
        migrations = []
        for file_path in sorted(self.migrations_dir.glob("*.sql")):
            if file_path.name.startswith("_"):
                continue

            # Extract version from filename
            filename = file_path.name
            if "_" in filename:
                version_str = filename.split("_")[0]
                try:
                    version = int(version_str)
                    description = self.get_migration_description(file_path)
                    migrations.append({
                        'version': version,
                        'filename': filename,
                        'path': file_path,
                        'description': description
                    })
                except ValueError:
                    continue

        return migrations

    def create_migration(self, name: str):
        """Create a new migration file with UP/DOWN template"""
        # Get next version number
        available = self.get_available_migrations()
        if available:
            last_version = max(m['version'] for m in available)
            next_version = last_version + 1
        else:
            next_version = 1

        # Create filename
        safe_name = name.lower().replace(" ", "_").replace("-", "_")
        filename = f"{next_version:03d}_{safe_name}.sql"
        file_path = self.migrations_dir / filename

        # Create migration template
        template = f"""-- Migration {next_version:03d}: {name.title()}
-- Created: {datetime.now().strftime('%Y-%m-%d')}
-- Description: {name}

-- UP
-- Add your forward migration SQL here
-- Example:
-- CREATE TABLE new_table (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     name TEXT NOT NULL
-- );

-- DOWN
-- Add your rollback migration SQL here
-- Example:
-- DROP TABLE IF EXISTS new_table;
"""

        with open(file_path, 'w') as f:
            f.write(template)

        self.print_colored(f"✅ Created migration file: {filename}", Colors.GREEN)
        self.print_colored(f"📁 Location: {file_path}", Colors.BLUE)
        self.print_colored(f"✏️  Edit the file to add your SQL statements, then run 'python migrate.py' to apply", Colors.YELLOW)

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Resume Runner Database Migration Tool")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Status command
    subparsers.add_parser('status', help='Show migration status')

    # Up command (default)
    up_parser = subparsers.add_parser('up', help='Apply pending migrations')

    # Rollback command
    rollback_parser = subparsers.add_parser('rollback', help='Rollback migrations')
    rollback_parser.add_argument('version', nargs='?', type=int, help='Target version to rollback to')

    # Create command
    create_parser = subparsers.add_parser('create', help='Create a new migration file')
    create_parser.add_argument('name', help='Name of the migration')

    args = parser.parse_args()

    try:
        manager = DatabaseMigrator()
        manager.ensure_migrations_table()

        if args.command == 'status':
            manager.status()

        elif args.command == 'rollback':
            manager.rollback_migration(args.version)

        elif args.command == 'create':
            manager.create_migration(args.name)

        elif args.command == 'up' or not args.command:
            # Default action is to apply migrations
            manager.apply_migrations()

        else:
            parser.print_help()

    except MigrationError as e:
        print(f"{Colors.RED}{e}{Colors.NC}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.RED}Unexpected error: {e}{Colors.NC}")
        sys.exit(1)

if __name__ == "__main__":
    main()