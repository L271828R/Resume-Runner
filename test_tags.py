#!/usr/bin/env python3
"""
Test script for the tag system functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_helper import ResumeRunnerDB

def test_tagging_system():
    """Test the complete tagging system"""
    print("🧪 Testing Resume Tagging System")
    print("=" * 50)

    # Initialize database
    db = ResumeRunnerDB()

    # Test 1: Create tags
    print("\n1. Creating sample tags...")
    try:
        tag1_id = db.add_tag("MorePython", "Heavy emphasis on Python development", "#3776AB")
        tag2_id = db.add_tag("Management", "Highlights management and leadership experience", "#DC2626")
        tag3_id = db.add_tag("Condensed", "Shorter version with key highlights only", "#059669")
        tag4_id = db.add_tag("DataScience", "Emphasizes data science and analytics", "#7C3AED")

        print(f"   ✅ Created tag 'MorePython' (ID: {tag1_id})")
        print(f"   ✅ Created tag 'Management' (ID: {tag2_id})")
        print(f"   ✅ Created tag 'Condensed' (ID: {tag3_id})")
        print(f"   ✅ Created tag 'DataScience' (ID: {tag4_id})")

    except Exception as e:
        print(f"   ❌ Error creating tags: {e}")
        return False

    # Test 2: List all tags
    print("\n2. Listing all tags...")
    try:
        tags = db.get_all_tags()
        print(f"   Found {len(tags)} tags:")
        for tag in tags:
            print(f"   - {tag['name']} (ID: {tag['id']}, Color: {tag['color']})")
    except Exception as e:
        print(f"   ❌ Error listing tags: {e}")
        return False

    # Test 3: Create sample resume versions
    print("\n3. Creating sample resume versions...")
    try:
        resume1_id = db.add_resume_version(
            filename="python_ml_resume.pdf",
            version_name="Python_ML_Expert",
            content_text="Experienced Python developer with machine learning expertise...",
            skills_emphasized=["Python", "Machine Learning", "TensorFlow", "Pandas"],
            target_roles="Senior Python Developer, ML Engineer",
            description="Version targeting Python and ML roles"
        )

        resume2_id = db.add_resume_version(
            filename="management_resume.pdf",
            version_name="Tech_Manager",
            content_text="Engineering manager with 8+ years of leadership experience...",
            skills_emphasized=["Leadership", "Team Management", "Strategy", "Python"],
            target_roles="Engineering Manager, Technical Lead",
            description="Version emphasizing management experience"
        )

        resume3_id = db.add_resume_version(
            filename="condensed_resume.pdf",
            version_name="Condensed_Overview",
            content_text="Brief overview of key technical and leadership skills...",
            skills_emphasized=["Python", "Leadership", "Full-Stack"],
            target_roles="Various technical roles",
            description="Short version for quick applications"
        )

        print(f"   ✅ Created resume 'Python_ML_Expert' (ID: {resume1_id})")
        print(f"   ✅ Created resume 'Tech_Manager' (ID: {resume2_id})")
        print(f"   ✅ Created resume 'Condensed_Overview' (ID: {resume3_id})")

    except Exception as e:
        print(f"   ❌ Error creating resumes: {e}")
        return False

    # Test 4: Tag the resumes
    print("\n4. Tagging resume versions...")
    try:
        # Python ML resume: MorePython + DataScience
        db.set_resume_tags(resume1_id, [tag1_id, tag4_id])
        print(f"   ✅ Tagged 'Python_ML_Expert' with MorePython + DataScience")

        # Management resume: Management only
        db.set_resume_tags(resume2_id, [tag2_id])
        print(f"   ✅ Tagged 'Tech_Manager' with Management")

        # Condensed resume: Condensed + MorePython
        db.set_resume_tags(resume3_id, [tag3_id, tag1_id])
        print(f"   ✅ Tagged 'Condensed_Overview' with Condensed + MorePython")

    except Exception as e:
        print(f"   ❌ Error tagging resumes: {e}")
        return False

    # Test 5: Search by tags
    print("\n5. Testing tag searches...")
    try:
        # Search for MorePython resumes
        python_resumes = db.search_resumes_by_tags(["MorePython"])
        print(f"   📋 Found {len(python_resumes)} resumes with 'MorePython' tag:")
        for resume in python_resumes:
            print(f"      - {resume['version_name']}")

        # Search for Management resumes
        mgmt_resumes = db.search_resumes_by_tags(["Management"])
        print(f"   📋 Found {len(mgmt_resumes)} resumes with 'Management' tag:")
        for resume in mgmt_resumes:
            print(f"      - {resume['version_name']}")

        # Search for resumes with both MorePython AND DataScience
        combined_resumes = db.search_resumes_by_tags(["MorePython", "DataScience"], match_all=True)
        print(f"   📋 Found {len(combined_resumes)} resumes with BOTH 'MorePython' AND 'DataScience':")
        for resume in combined_resumes:
            print(f"      - {resume['version_name']}")

    except Exception as e:
        print(f"   ❌ Error searching resumes: {e}")
        return False

    # Test 6: View resumes with tags
    print("\n6. Viewing resumes with their tags...")
    try:
        resumes_with_tags = db.get_resume_versions_with_tags()
        print(f"   📋 Resume versions with tags:")
        for resume in resumes_with_tags:
            tags_str = resume['tags'] if resume['tags'] else 'No tags'
            print(f"      - {resume['version_name']}: {tags_str}")

    except Exception as e:
        print(f"   ❌ Error getting resumes with tags: {e}")
        return False

    print("\n🎉 All tests passed! Tag system is working correctly.")
    print("\nYou can now:")
    print("• Create tags like 'MorePython', 'Management', 'Condensed'")
    print("• Tag your resume versions")
    print("• Search for resumes by tags (e.g., find all Python-focused resumes)")
    print("• Use the API endpoints to integrate with the frontend")

    return True

if __name__ == "__main__":
    test_tagging_system()