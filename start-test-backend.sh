#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DB_DEFAULT="$REPO_ROOT/database/resume_runner.db"
BASE_DB="${BASE_DB:-$BASE_DB_DEFAULT}"
TEST_DB="$REPO_ROOT/database/resume_runner_test.db"

if [[ ! -f "$BASE_DB" ]]; then
  echo "❌ Base database not found at $BASE_DB" >&2
  echo "   Run 'python database/create_database.py' first." >&2
  exit 1
fi

echo "🧪 Creating fresh test database copy..."
rm -f "$TEST_DB"
cp "$BASE_DB" "$TEST_DB"

export DATABASE_PATH="$TEST_DB"
export BACKEND_PORT="${BACKEND_PORT:-5002}"
export FLASK_ENV="test"

echo "📂 Source database: $BASE_DB"
echo "🚀 Starting test backend on port $BACKEND_PORT using $TEST_DB"
cd "$REPO_ROOT"
python3 backend/server.py
