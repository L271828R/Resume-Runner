#!/bin/bash
#
# Production Database Seeding Script for ResumeRunner
# This script sets up the database with migrations and optional seed data
#
# Usage:
#   ./seed_database.sh                    # Run migrations only
#   ./seed_database.sh --with-test-data   # Run migrations + add test data
#   ./seed_database.sh --status           # Show migration status
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
DATABASE_DIR="$SCRIPT_DIR/database"
SCHEMA_DIR="$SCRIPT_DIR/schema"
MIGRATIONS_DIR="$BACKEND_DIR/migrations"

# Default values
WITH_TEST_DATA=false
SHOW_STATUS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-test-data)
      WITH_TEST_DATA=true
      shift
      ;;
    --status)
      SHOW_STATUS=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --with-test-data    Run migrations and add test data"
      echo "  --status           Show migration status"
      echo "  --help, -h         Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                    # Run migrations only (production setup)"
      echo "  $0 --with-test-data   # Run migrations + add test data (development)"
      echo "  $0 --status           # Show current migration status"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to print colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validation functions
validate_environment() {
    print_colored $BLUE "🔍 Validating environment..."

    # Check if we're in the right directory
    if [[ ! -f "$SCRIPT_DIR/backend/requirements.txt" ]]; then
        print_colored $RED "❌ Error: This script must be run from the ResumeRunner project root directory"
        print_colored $YELLOW "   Current directory: $SCRIPT_DIR"
        print_colored $YELLOW "   Expected files: backend/requirements.txt, database/, backend/migrations/"
        exit 1
    fi

    # Check if Python 3 is available
    if ! command_exists python3; then
        print_colored $RED "❌ Error: Python 3 is required but not found"
        print_colored $YELLOW "   Please install Python 3 and try again"
        exit 1
    fi

    # Check Python version (3.8+)
    python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    required_version="3.8"
    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)"; then
        print_colored $RED "❌ Error: Python 3.8+ is required. Found: Python $python_version"
        exit 1
    fi

    # Check if required directories exist
    for dir in "$BACKEND_DIR" "$DATABASE_DIR" "$SCHEMA_DIR"; do
        if [[ ! -d "$dir" ]]; then
            print_colored $RED "❌ Error: Required directory not found: $dir"
            exit 1
        fi
    done

    # Check if schema files exist
    if [[ ! -f "$SCHEMA_DIR/init_db.sql" ]]; then
        print_colored $RED "❌ Error: Main schema file not found: $SCHEMA_DIR/init_db.sql"
        exit 1
    fi

    # Check if seed script exists (when needed)
    if [[ "$WITH_TEST_DATA" == "true" && ! -f "$DATABASE_DIR/seed_test_data.py" ]]; then
        print_colored $RED "❌ Error: Seed script not found: $DATABASE_DIR/seed_test_data.py"
        exit 1
    fi

    print_colored $GREEN "✅ Environment validation passed"
}

# Function to install Python dependencies
install_dependencies() {
    print_colored $BLUE "📦 Installing Python dependencies..."

    # Check if we should create a virtual environment
    if [[ -z "$VIRTUAL_ENV" ]]; then
        print_colored $YELLOW "⚠️  Warning: No virtual environment detected"
        print_colored $YELLOW "   Consider running: python3 -m venv venv && source venv/bin/activate"
        print_colored $YELLOW "   Continuing with system Python..."
    fi

    # Install dependencies
    cd "$BACKEND_DIR"
    if python3 -m pip install -r requirements.txt --quiet; then
        print_colored $GREEN "✅ Dependencies installed successfully"
    else
        print_colored $RED "❌ Failed to install dependencies"
        print_colored $YELLOW "   Try running manually: cd backend && pip install -r requirements.txt"
        exit 1
    fi

    cd "$SCRIPT_DIR"
}

# Function to initialize database from schema
initialize_database() {
    local db_path="$DATABASE_DIR/resume_runner.db"

    print_colored $BLUE "🚀 Initializing database from schema..."

    # Check if database already exists
    if [[ -f "$db_path" ]]; then
        print_colored $GREEN "✅ Database already exists at: $db_path"

        # Check if it has tables
        local table_count=$(sqlite3 "$db_path" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null || echo "0")

        if [[ "$table_count" -gt 0 ]]; then
            print_colored $GREEN "✅ Database contains $table_count tables - appears ready to use"
            return 0
        else
            print_colored $YELLOW "⚠️  Database file exists but appears empty - recreating schema..."
        fi
    else
        print_colored $BLUE "📄 Creating new database from schema files..."
    fi

    # Create/recreate database from schema files
    if sqlite3 "$db_path" < "$SCHEMA_DIR/init_db.sql"; then
        print_colored $GREEN "✅ Main schema applied successfully"
    else
        print_colored $RED "❌ Failed to apply main schema"
        exit 1
    fi

    # Apply additional schema files if they exist
    if [[ -f "$SCHEMA_DIR/add_tagging.sql" ]]; then
        if sqlite3 "$db_path" < "$SCHEMA_DIR/add_tagging.sql"; then
            print_colored $GREEN "✅ Tagging schema applied successfully"
        else
            print_colored $RED "❌ Failed to apply tagging schema"
            exit 1
        fi
    fi

    # Set schema version
    sqlite3 "$db_path" "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);"
    sqlite3 "$db_path" "INSERT OR REPLACE INTO schema_migrations (version) VALUES (1);"

    print_colored $GREEN "✅ Database initialized successfully"
}

# Function to show database status
show_database_status() {
    local db_path="$DATABASE_DIR/resume_runner.db"

    print_colored $BLUE "📊 Database Status"
    print_colored $BLUE "=================="

    if [[ ! -f "$db_path" ]]; then
        print_colored $YELLOW "⚠️  Database file does not exist: $db_path"
        print_colored $BLUE "   Run without --status to create the database"
        return 1
    fi

    # Show schema version
    local schema_version=$(sqlite3 "$db_path" "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null || echo "unknown")
    print_colored $GREEN "Schema version: $schema_version"

    # Show table count
    local table_count=$(sqlite3 "$db_path" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';" 2>/dev/null || echo "0")
    print_colored $GREEN "Tables: $table_count"

    # Show sample table info
    print_colored $BLUE "Available tables:"
    sqlite3 "$db_path" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;" | while read table; do
        local count=$(sqlite3 "$db_path" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "error")
        print_colored $BLUE "  • $table ($count rows)"
    done
}

# Function to seed test data
seed_test_data() {
    print_colored $BLUE "🌱 Seeding test data..."

    cd "$DATABASE_DIR"

    if python3 seed_test_data.py; then
        print_colored $GREEN "✅ Test data seeded successfully"
    else
        print_colored $RED "❌ Failed to seed test data"
        print_colored $YELLOW "   The database migrations were successful, but test data seeding failed"
        print_colored $YELLOW "   You can try running manually: cd database && python3 seed_test_data.py"
        exit 1
    fi

    cd "$SCRIPT_DIR"
}

# Function to backup existing database
backup_database() {
    local db_path="$DATABASE_DIR/resume_runner.db"

    if [[ -f "$db_path" ]]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        local backup_path="$DATABASE_DIR/backups/resume_runner_${timestamp}.db"

        # Create backup directory if it doesn't exist
        mkdir -p "$DATABASE_DIR/backups"

        if cp "$db_path" "$backup_path"; then
            print_colored $YELLOW "📦 Database backed up to: $backup_path"
        else
            print_colored $YELLOW "⚠️  Warning: Could not create database backup"
        fi
    fi
}

# Main execution
main() {
    print_colored $GREEN "🎯 ResumeRunner Database Setup Script"
    print_colored $GREEN "======================================"

    # Show status and exit if requested
    if [[ "$SHOW_STATUS" == "true" ]]; then
        validate_environment
        show_database_status
        exit 0
    fi

    # Validate environment
    validate_environment

    # Install dependencies
    install_dependencies

    # Backup existing database (if it exists)
    backup_database

    # Initialize database from schema
    initialize_database

    # Seed test data if requested
    if [[ "$WITH_TEST_DATA" == "true" ]]; then
        seed_test_data
        print_colored $GREEN "🎉 Database setup completed with test data!"
        print_colored $BLUE "   Your development database is ready with sample data"
    else
        print_colored $GREEN "🎉 Production database setup completed!"
        print_colored $BLUE "   Database is ready for production use"
    fi

    # Show final status
    print_colored $BLUE ""
    print_colored $BLUE "📋 Final Status:"
    show_database_status

    print_colored $BLUE ""
    print_colored $BLUE "💡 Next steps:"
    if [[ "$WITH_TEST_DATA" == "true" ]]; then
        print_colored $BLUE "   • Start your development server"
        print_colored $BLUE "   • Test with the seeded sample data"
    else
        print_colored $BLUE "   • Start your production server"
        print_colored $BLUE "   • Begin using your application"
    fi
    print_colored $BLUE "   • Run '$0 --status' to check migration status anytime"
}

# Handle script interruption
trap 'print_colored $RED "\n❌ Script interrupted. Database may be in an inconsistent state."; exit 1' INT

# Run main function
main "$@"