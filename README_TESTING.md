# Testing Backends

To experiment with data or run automated tests without touching your primary database, you can spin up a mirrored backend that uses a disposable SQLite copy and a separate port.

## Quick Start

```bash
./start-test-backend.sh
```

The script will:

1. Copy `database/resume_runner.db` to `database/resume_runner_test.db` (overwriting the previous test copy).
2. Export `DATABASE_PATH` so the Flask app uses the cloned database.
3. Export `BACKEND_PORT=5002` (override by setting `BACKEND_PORT` before running the script).
4. Launch `backend/server.py` bound to `0.0.0.0:$BACKEND_PORT`.

When the server starts you should see output similar to:

```
🚀 Starting Resume Runner Backend Server...
📊 Database: /path/to/repo/database/resume_runner_test.db
☁️  S3 Status: stub
🌐 API available at: http://localhost:5002
📚 API Documentation: http://localhost:5002/docs/
```

Stop the test backend with `Ctrl+C`. The cloned database remains on disk so you can inspect it, but it will be recreated the next time you run the script.

## Why a Mirror Backend?

- **Isolation:** Populate scenarios for automated tests or manual experiments without affecting the main `.db` file.
- **Parallel Development:** Keep the primary backend running on the default port (5001) while you run integration tests or demos against the mirrored backend on port 5002.
- **Deterministic State:** Every invocation of `start-test-backend.sh` resets the test database to the current state of `database/resume_runner.db`.

## Customising the Environment

- Change the listening port by setting `BACKEND_PORT` before launching:
  ```bash
  BACKEND_PORT=6000 ./start-test-backend.sh
  ```
- Use an alternate source database by setting `BASE_DB` before running the script:
  ```bash
  BASE_DB=database/seed_snapshot.db ./start-test-backend.sh
  ```
  (The script falls back to `database/resume_runner.db` if `BASE_DB` is not provided.)
- Pytest fixtures also respect a `TEST_DB_TEMPLATE` environment variable. If you want
  backend tests to clone a different seed database, export that variable before
  running `pytest`.

## Frontend Testing Notes

Point your frontend or API client at `http://localhost:<BACKEND_PORT>` when interacting with the mirrored backend. For example, you can run the React app as usual (`npm start`) and temporarily change the API base URL to the test port while debugging.

## Clean Up

There's no special teardown—just stop the process. If you want to remove the test database copy manually:

```bash
rm -f database/resume_runner_test.db
```

Happy testing!

## Running Pytest

`pytest` automatically copies the main database (or `TEST_DB_TEMPLATE`) into a temporary location for every test, sets `DATABASE_PATH` to that copy, and reloads the Flask app so API calls and direct `ResumeRunnerDB` calls share the same isolated data. No additional setup is required—just run:

```bash
pytest backend/test_api.py
```
