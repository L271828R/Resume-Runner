#!/usr/bin/env python3
"""
Test the frontend tag integration by creating sample data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_helper import ResumeRunnerDB

def setup_test_data():
    """Create test data to verify frontend integration"""
    print("🎭 Setting up test data for frontend tag integration")
    print("=" * 60)

    db = ResumeRunnerDB()

    # Ensure we have some tags
    tags_to_create = [
        {"name": "MorePython", "description": "Heavy emphasis on Python development", "color": "#3776AB"},
        {"name": "Management", "description": "Highlights management and leadership", "color": "#DC2626"},
        {"name": "Condensed", "description": "Shorter version for quick applications", "color": "#059669"},
        {"name": "DataScience", "description": "Emphasizes data science skills", "color": "#7C3AED"},
    ]

    print("\n1. Creating tags...")
    tag_ids = {}
    for tag_data in tags_to_create:
        existing = db.find_tag_by_name(tag_data["name"])
        if existing:
            tag_ids[tag_data["name"]] = existing['id']
            print(f"   ✅ Tag '{tag_data['name']}' already exists (ID: {existing['id']})")
        else:
            tag_id = db.add_tag(**tag_data)
            tag_ids[tag_data["name"]] = tag_id
            print(f"   ✅ Created tag '{tag_data['name']}' (ID: {tag_id})")

    # Ensure we have some tagged resumes
    print("\n2. Checking resume versions...")
    resumes = db.get_resume_versions_with_tags()
    print(f"   Found {len(resumes)} resume versions")

    if len(resumes) < 3:
        print("   Creating additional sample resumes...")

        # Create a few more resume versions with different focuses
        sample_resumes = [
            {
                "filename": "frontend_specialist_resume.pdf",
                "version_name": "Frontend_Specialist",
                "content_text": "Frontend developer specializing in React and modern JavaScript...",
                "skills_emphasized": ["React", "JavaScript", "TypeScript", "CSS"],
                "target_roles": "Frontend Developer, UI Engineer",
                "description": "Version emphasizing frontend development skills",
                "tags": ["MorePython", "Condensed"]  # Will be applied separately
            },
            {
                "filename": "data_scientist_resume.pdf",
                "version_name": "Data_Scientist_Pro",
                "content_text": "Data scientist with expertise in machine learning and Python...",
                "skills_emphasized": ["Python", "Machine Learning", "Pandas", "Scikit-learn"],
                "target_roles": "Data Scientist, ML Engineer, Research Scientist",
                "description": "Version optimized for data science positions",
                "tags": ["MorePython", "DataScience"]
            }
        ]

        for resume_data in sample_resumes:
            tags_to_apply = resume_data.pop("tags", [])

            resume_id = db.add_resume_version(**resume_data)
            print(f"   ✅ Created resume '{resume_data['version_name']}' (ID: {resume_id})")

            # Apply tags
            if tags_to_apply:
                tag_ids_to_apply = [tag_ids[tag_name] for tag_name in tags_to_apply if tag_name in tag_ids]
                db.set_resume_tags(resume_id, tag_ids_to_apply)
                print(f"      Applied tags: {', '.join(tags_to_apply)}")

    print("\n3. Final state - Resume versions with tags:")
    final_resumes = db.get_resume_versions_with_tags()
    for resume in final_resumes:
        tags_str = resume['tags'] if resume['tags'] else 'No tags'
        print(f"   📄 {resume['version_name']}: {tags_str}")

    print(f"\n✅ Test data setup complete!")
    print(f"📊 You now have {len(final_resumes)} resume versions with tags")
    print(f"🏷️  Available tags: {', '.join(tag_ids.keys())}")
    print(f"\n🌐 Frontend should now display:")
    print(f"   • Resume cards with tag displays")
    print(f"   • Tag selector in the edit form")
    print(f"   • Ability to create new tags")
    print(f"   • Ability to add/remove tags from resumes")

if __name__ == "__main__":
    setup_test_data()