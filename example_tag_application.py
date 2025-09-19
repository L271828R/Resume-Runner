#!/usr/bin/env python3
"""
Example: How to apply tags to resume versions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_helper import ResumeRunnerDB

def example_tag_applications():
    """Show examples of applying tags to resumes"""
    db = ResumeRunnerDB()

    print("📝 Example: Applying Tags to Resumes")
    print("=" * 45)

    # Example 1: Create a new resume and tag it
    print("\n1. Creating a new resume version...")

    try:
        # Create a new backend-focused resume
        resume_id = db.add_resume_version(
            filename="backend_expert_resume.pdf",
            version_name="Backend_Expert",
            content_text="Senior backend developer with expertise in Python, APIs, and databases...",
            skills_emphasized=["Python", "FastAPI", "PostgreSQL", "Docker"],
            target_roles="Senior Backend Developer, API Developer",
            description="Version focused on backend development skills"
        )
        print(f"   ✅ Created resume 'Backend_Expert' (ID: {resume_id})")

        # Apply tags to this resume
        print(f"\n2. Applying tags to 'Backend_Expert'...")

        # Find tag IDs we want to apply
        more_python_tag = db.find_tag_by_name("MorePython")
        condensed_tag = db.find_tag_by_name("Condensed")

        if more_python_tag and condensed_tag:
            # Apply both MorePython and Condensed tags
            db.set_resume_tags(resume_id, [more_python_tag['id'], condensed_tag['id']])
            print(f"   ✅ Applied tags: MorePython, Condensed")
        else:
            print("   ❌ Required tags not found")

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return

    # Example 2: Modify existing resume tags
    print(f"\n3. Modifying tags for existing resume...")

    try:
        # Get the Tech_Manager resume (ID: 2)
        tech_manager = db.get_resume_version(2)
        if tech_manager:
            print(f"   Current resume: {tech_manager['version_name']}")

            # Get current tags
            current_tags = db.get_resume_tags(2)
            current_tag_names = [tag['name'] for tag in current_tags]
            print(f"   Current tags: {', '.join(current_tag_names)}")

            # Add MorePython tag to the management resume (multi-skilled manager)
            more_python_tag = db.find_tag_by_name("MorePython")
            management_tag = db.find_tag_by_name("Management")

            if more_python_tag and management_tag:
                # Set both Management and MorePython
                db.set_resume_tags(2, [management_tag['id'], more_python_tag['id']])
                print(f"   ✅ Updated tags: Management, MorePython")

    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Example 3: Show final state
    print(f"\n4. Final state of all resumes:")
    print("   " + "=" * 35)

    try:
        resumes = db.get_resume_versions_with_tags()
        for resume in resumes:
            tags_str = resume['tags'] if resume['tags'] else 'No tags'
            print(f"   📄 {resume['version_name']}: {tags_str}")

    except Exception as e:
        print(f"   ❌ Error: {e}")

def show_search_examples():
    """Show examples of searching by tags"""
    db = ResumeRunnerDB()

    print(f"\n🔍 Example: Searching Resumes by Tags")
    print("=" * 45)

    # Search for Python-focused resumes
    print("\n1. Finding all Python-focused resumes:")
    python_resumes = db.search_resumes_by_tags(["MorePython"])
    for resume in python_resumes:
        print(f"   📄 {resume['version_name']} - {resume['description']}")

    # Search for management resumes
    print("\n2. Finding all management-focused resumes:")
    mgmt_resumes = db.search_resumes_by_tags(["Management"])
    for resume in mgmt_resumes:
        print(f"   📄 {resume['version_name']} - {resume['description']}")

    # Search for resumes with BOTH Python AND Management
    print("\n3. Finding resumes with BOTH Python AND Management:")
    combined_resumes = db.search_resumes_by_tags(["MorePython", "Management"], match_all=True)
    for resume in combined_resumes:
        print(f"   📄 {resume['version_name']} - {resume['description']}")

if __name__ == "__main__":
    example_tag_applications()
    show_search_examples()

    print(f"\n🎯 Summary: You can apply tags to resumes using:")
    print("• db.set_resume_tags(resume_id, [tag_id1, tag_id2])  # Replace all tags")
    print("• db.add_resume_tag(resume_id, tag_id)               # Add single tag")
    print("• API: PUT /api/resume-versions/{id}/tags            # Via REST API")
    print("• python3 tag_resumes.py                            # Interactive script")