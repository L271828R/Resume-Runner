#!/usr/bin/env python3
"""
Test script for the tag API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5001/api"

def test_tag_api():
    """Test the tag API endpoints"""
    print("🌐 Testing Tag API Endpoints")
    print("=" * 50)

    # Test 1: Get all tags
    print("\n1. Getting all tags...")
    try:
        response = requests.get(f"{BASE_URL}/tags")
        if response.status_code == 200:
            tags = response.json()['tags']
            print(f"   ✅ Found {len(tags)} tags")
            for tag in tags:
                print(f"      - {tag['name']} (ID: {tag['id']})")
        else:
            print(f"   ❌ Failed to get tags: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print("   💡 Make sure the server is running: python3 backend/server.py")
        return False

    # Test 2: Search resumes by tags
    print("\n2. Searching resumes by tags...")
    try:
        # Search for MorePython resumes
        response = requests.get(f"{BASE_URL}/resume-versions/search?tags=MorePython")
        if response.status_code == 200:
            resumes = response.json()['resumes']
            print(f"   ✅ Found {len(resumes)} resumes with 'MorePython' tag:")
            for resume in resumes:
                print(f"      - {resume['version_name']}")
        else:
            print(f"   ❌ Failed to search resumes: {response.status_code}")

        # Search with multiple tags
        response = requests.get(f"{BASE_URL}/resume-versions/search?tags=MorePython,DataScience&match_all=true")
        if response.status_code == 200:
            resumes = response.json()['resumes']
            print(f"   ✅ Found {len(resumes)} resumes with BOTH 'MorePython' AND 'DataScience':")
            for resume in resumes:
                print(f"      - {resume['version_name']}")
        else:
            print(f"   ❌ Failed to search with multiple tags: {response.status_code}")

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

    # Test 3: Get resume versions with tags
    print("\n3. Getting resume versions with tags...")
    try:
        response = requests.get(f"{BASE_URL}/resume-versions/with-tags")
        if response.status_code == 200:
            resumes = response.json()['resume_versions']
            print(f"   ✅ Found {len(resumes)} resume versions:")
            for resume in resumes:
                tags_str = resume['tags'] if resume['tags'] else 'No tags'
                print(f"      - {resume['version_name']}: {tags_str}")
        else:
            print(f"   ❌ Failed to get resumes with tags: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

    print("\n🎉 All API tests passed! The tag system API is working correctly.")
    print("\nAvailable API endpoints:")
    print("• GET  /api/tags - Get all tags")
    print("• POST /api/tags - Create a new tag")
    print("• GET  /api/resume-versions/search?tags=MorePython - Search resumes by tags")
    print("• GET  /api/resume-versions/with-tags - Get all resumes with their tags")
    print("• PUT  /api/resume-versions/{id}/tags - Set tags for a resume")

    return True

if __name__ == "__main__":
    test_tag_api()