#!/usr/bin/env python3
"""
Resume Runner Database Setup
Creates the SQLite3 database and initializes tables
"""

import sqlite3
import os
from pathlib import Path

def create_database():
    """Create the Resume Runner database with all tables"""

    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    db_path = script_dir / "resume_runner.db"
    sql_path = script_dir / "init_db.sql"

    # Remove existing database if it exists
    if db_path.exists():
        print(f"Removing existing database: {db_path}")
        os.remove(db_path)

    # Create new database
    print(f"Creating new database: {db_path}")
    conn = sqlite3.connect(db_path)

    # Read and execute the SQL schema
    with open(sql_path, 'r') as f:
        sql_script = f.read()

    cursor = conn.cursor()
    cursor.executescript(sql_script)
    conn.commit()

    print("Database created successfully!")
    print("\nTables created:")

    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(f"  - {table[0]}")

    print("\nViews created:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='view';")
    views = cursor.fetchall()
    for view in views:
        print(f"  - {view[0]}")

    conn.close()
    return str(db_path)

if __name__ == "__main__":
    db_path = create_database()
    print(f"\nDatabase ready at: {db_path}")