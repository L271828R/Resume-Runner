#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(pwd)"
SESSION_NAME="resume-runner-dev"

# --- Checks ---
command -v tmux >/dev/null 2>&1 || { echo "❌ tmux not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not installed"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ python3 not installed"; exit 1; }
command -v gobang >/dev/null 2>&1 || { echo "⚠️  gobang not installed (optional database GUI)"; }

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null || true

# Create new session
tmux new-session -d -s $SESSION_NAME -x 120 -y 40

# --- Window 1: Backend ---
tmux rename-window -t $SESSION_NAME:1 'backend'
tmux send-keys -t $SESSION_NAME:1 "cd $PROJECT_DIR/backend" C-m

# Check if virtualenv exists, otherwise create one
if [ -d "$PROJECT_DIR/backend/venv" ]; then
  tmux send-keys -t $SESSION_NAME:1 "source venv/bin/activate" C-m
else
  tmux send-keys -t $SESSION_NAME:1 "python3 -m venv venv && source venv/bin/activate" C-m
  tmux send-keys -t $SESSION_NAME:1 "pip install --upgrade pip" C-m
fi

# Install dependencies from requirements.txt
tmux send-keys -t $SESSION_NAME:1 "pip install -r requirements.txt" C-m

# Start backend server
tmux send-keys -t $SESSION_NAME:1 "python server.py" C-m

# --- Window 2: Frontend ---
tmux new-window -t $SESSION_NAME:2 -n 'frontend'
tmux send-keys -t $SESSION_NAME:2 "cd $PROJECT_DIR/frontend" C-m

# Always install/update npm dependencies
tmux send-keys -t $SESSION_NAME:2 "npm install" C-m

# Start frontend development server
tmux send-keys -t $SESSION_NAME:2 "npm start" C-m

# --- Window 3: Database ---
tmux new-window -t $SESSION_NAME:3 -n 'database'
tmux send-keys -t $SESSION_NAME:3 "cd $PROJECT_DIR/database" C-m

# Check if database exists, create if not
if [ ! -f "$PROJECT_DIR/database/resume_runner.db" ]; then
  tmux send-keys -t $SESSION_NAME:3 "python create_database.py" C-m
  tmux send-keys -t $SESSION_NAME:3 "python seed_test_data.py" C-m
fi

# Start gobang database browser if available
if command -v gobang >/dev/null 2>&1; then
  tmux send-keys -t $SESSION_NAME:3 "gobang" C-m
else
  tmux send-keys -t $SESSION_NAME:3 "echo '📊 Database ready at: $PROJECT_DIR/database/resume_runner.db'" C-m
  tmux send-keys -t $SESSION_NAME:3 "echo '💡 Install gobang for database GUI: cargo install gobang'" C-m
  tmux send-keys -t $SESSION_NAME:3 "echo '🔍 Or use sqlite3 directly: sqlite3 resume_runner.db'" C-m
fi

# --- Window 4: S3 & Files ---
tmux new-window -t $SESSION_NAME:4 -n 's3-files'
tmux send-keys -t $SESSION_NAME:4 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '☁️  S3 Helper Status:'" C-m
tmux send-keys -t $SESSION_NAME:4 "python -c \"from s3_helper import S3Helper; s3 = S3Helper(); print(f'Bucket: {s3.bucket_name}'); print(f'Status: {s3.get_bucket_info()[\"status\"]}')\"" C-m
tmux send-keys -t $SESSION_NAME:4 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '📁 To configure S3:'" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '1. Update .env file with your S3 bucket details'" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '2. Restart backend server'" C-m
tmux send-keys -t $SESSION_NAME:4 "echo ''" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '📝 Available commands:'" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '- python database/seed_test_data.py (add test data)'" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '- python backend/migrations/migrate.py status (check migrations)'" C-m

# --- Window 5: Working (extra shell for misc tasks) ---
tmux new-window -t $SESSION_NAME:5 -n 'working'
tmux send-keys -t $SESSION_NAME:5 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:5 "clear" C-m

# Start on the backend window
tmux select-window -t $SESSION_NAME:1

# Attach to session
echo "🚀 Starting Resume Runner Development Environment..."
echo "📊 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo "💾 Database: $PROJECT_DIR/database/resume_runner.db"
echo ""

tmux attach-session -t $SESSION_NAME