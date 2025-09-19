#!/usr/bin/env python3
"""
Show all resumes with their current tags
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_helper import ResumeRunnerDB

def show_current_state():
    """Show current resumes and tags"""
    db = ResumeRunnerDB()

    print("📋 All Resume Versions with Tags")
    print("=" * 40)

    try:
        resumes = db.get_resume_versions_with_tags()

        if not resumes:
            print("No resume versions found.")
            return

        for resume in resumes:
            tags_str = resume['tags'] if resume['tags'] else 'No tags'
            print(f"📄 {resume['version_name']} (ID: {resume['id']})")
            print(f"   Tags: {tags_str}")
            print(f"   Description: {resume['description'] or 'No description'}")
            print(f"   Target roles: {resume['target_roles'] or 'Not specified'}")
            print()

        print("🏷️  Available Tags")
        print("=" * 20)
        tags = db.get_all_tags()
        for tag in tags:
            desc = f" - {tag['description']}" if tag['description'] else ""
            print(f"{tag['id']}. {tag['name']}{desc}")

    except Exception as e:
        print(f"❌ Error getting resumes: {e}")

if __name__ == "__main__":
    show_current_state()