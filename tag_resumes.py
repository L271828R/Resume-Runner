#!/usr/bin/env python3
"""
Script to apply tags to resume versions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_helper import ResumeRunnerDB

def list_resumes_and_tags():
    """Display all resumes and available tags"""
    db = ResumeRunnerDB()

    print("📄 Your Resume Versions")
    print("=" * 30)

    resumes = db.list_resume_versions()
    if not resumes:
        print("No resume versions found. Create some resumes first!")
        return [], []

    for resume in resumes:
        current_tags = db.get_resume_tags(resume['id'])
        tag_names = [tag['name'] for tag in current_tags]
        tag_str = ", ".join(tag_names) if tag_names else "No tags"
        print(f"{resume['id']}. {resume['version_name']} - {tag_str}")

    print("\n🏷️  Available Tags")
    print("=" * 20)

    tags = db.get_all_tags()
    if not tags:
        print("No tags found. Create some tags first!")
        return resumes, []

    for tag in tags:
        desc = f" - {tag['description']}" if tag['description'] else ""
        print(f"{tag['id']}. {tag['name']}{desc}")

    return resumes, tags

def apply_tags_interactive():
    """Interactive tag application"""
    db = ResumeRunnerDB()

    resumes, tags = list_resumes_and_tags()
    if not resumes or not tags:
        return

    print("\n🎯 Apply Tags to Resume")
    print("=" * 25)

    # Select resume
    while True:
        try:
            resume_id = int(input("\nEnter resume ID to tag: "))
            resume = db.get_resume_version(resume_id)
            if resume:
                break
            else:
                print(f"❌ Resume ID {resume_id} not found")
        except ValueError:
            print("❌ Please enter a valid number")

    print(f"\nSelected: {resume['version_name']}")

    # Show current tags
    current_tags = db.get_resume_tags(resume_id)
    if current_tags:
        current_tag_names = [tag['name'] for tag in current_tags]
        print(f"Current tags: {', '.join(current_tag_names)}")
    else:
        print("Current tags: None")

    # Select tags to apply
    print(f"\nEnter tag IDs to apply (comma-separated, e.g., '1,3,4'):")
    print("Or enter tag names (comma-separated, e.g., 'MorePython,Management'):")
    tag_input = input("Tags: ").strip()

    if not tag_input:
        print("❌ No tags specified")
        return

    # Parse input - check if it's IDs or names
    tag_ids = []
    if tag_input.replace(',', '').replace(' ', '').isdigit():
        # Input is tag IDs
        try:
            tag_ids = [int(x.strip()) for x in tag_input.split(',') if x.strip()]
        except ValueError:
            print("❌ Invalid tag IDs")
            return
    else:
        # Input is tag names
        tag_names = [x.strip() for x in tag_input.split(',') if x.strip()]
        for name in tag_names:
            tag = db.find_tag_by_name(name)
            if tag:
                tag_ids.append(tag['id'])
            else:
                print(f"❌ Tag '{name}' not found")
                return

    # Validate tag IDs exist
    valid_tag_ids = [tag['id'] for tag in tags]
    invalid_ids = [tid for tid in tag_ids if tid not in valid_tag_ids]
    if invalid_ids:
        print(f"❌ Invalid tag IDs: {invalid_ids}")
        return

    # Apply the tags
    try:
        db.set_resume_tags(resume_id, tag_ids)

        # Show result
        updated_tags = db.get_resume_tags(resume_id)
        tag_names = [tag['name'] for tag in updated_tags]
        print(f"✅ Applied tags to '{resume['version_name']}': {', '.join(tag_names)}")

    except Exception as e:
        print(f"❌ Error applying tags: {e}")

def search_resumes_by_tags():
    """Search and display resumes by tags"""
    db = ResumeRunnerDB()

    tags = db.get_all_tags()
    if not tags:
        print("No tags found. Create some tags first!")
        return

    print("🏷️  Available Tags")
    print("=" * 20)
    for tag in tags:
        print(f"- {tag['name']}")

    print("\n🔍 Search Resumes by Tags")
    print("=" * 30)

    tag_input = input("Enter tag names to search (comma-separated): ").strip()
    if not tag_input:
        print("❌ No tags specified")
        return

    tag_names = [x.strip() for x in tag_input.split(',') if x.strip()]

    # Ask for match type
    match_all = input("Match ALL tags? (y/n) [default: n]: ").strip().lower() == 'y'

    try:
        resumes = db.search_resumes_by_tags(tag_names, match_all)

        if not resumes:
            match_type = "ALL" if match_all else "ANY"
            print(f"📭 No resumes found with {match_type} of these tags: {', '.join(tag_names)}")
            return

        match_type = "ALL" if match_all else "ANY"
        print(f"\n📋 Found {len(resumes)} resumes with {match_type} of: {', '.join(tag_names)}")
        print("=" * 50)

        for resume in resumes:
            # Get tags for this resume
            resume_tags = db.get_resume_tags(resume['id'])
            tag_names_list = [tag['name'] for tag in resume_tags]
            tag_str = ", ".join(tag_names_list) if tag_names_list else "No tags"

            print(f"📄 {resume['version_name']}")
            print(f"   Tags: {tag_str}")
            print(f"   Description: {resume['description'] or 'No description'}")
            print(f"   Target roles: {resume['target_roles'] or 'Not specified'}")
            print()

    except Exception as e:
        print(f"❌ Error searching resumes: {e}")

def show_all_resumes_with_tags():
    """Show all resumes with their current tags"""
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
            print(f"📄 {resume['version_name']}")
            print(f"   Tags: {tags_str}")
            print(f"   Description: {resume['description'] or 'No description'}")
            print(f"   Success rate: {resume['success_rate']}%")
            print()

    except Exception as e:
        print(f"❌ Error getting resumes: {e}")

def main():
    """Main menu"""
    while True:
        print("\n🏷️  Resume Tagging System")
        print("=" * 30)
        print("1. View all resumes and tags")
        print("2. Apply tags to a resume")
        print("3. Search resumes by tags")
        print("4. Show all resumes with their tags")
        print("5. Quit")

        choice = input("\nChoose an option (1-5): ").strip()

        if choice == "1":
            list_resumes_and_tags()
        elif choice == "2":
            apply_tags_interactive()
        elif choice == "3":
            search_resumes_by_tags()
        elif choice == "4":
            show_all_resumes_with_tags()
        elif choice == "5":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main()