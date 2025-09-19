#!/usr/bin/env python3
"""
Simple test to demonstrate manager and recruiter relationship functionality.
"""

import json
import requests

BASE_URL = "http://localhost:5001"

def test_api_call(method, endpoint, data=None):
    """Helper function to test API calls"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == "PUT":
            response = requests.put(url, json=data, headers={'Content-Type': 'application/json'})

        print(f"{method} {endpoint} -> {response.status_code}")
        if response.status_code >= 400:
            print(f"Error: {response.text}")
            return None
        return response.json()
    except Exception as e:
        print(f"Request failed: {e}")
        return None

def main():
    print("Testing Manager & Recruiter Relationship System")
    print("=" * 50)

    # 1. Create a manager
    manager_data = {
        "name": "Jennifer Williams",
        "email": "jennifer.williams@techcompany.com",
        "phone": "+1-555-3001",
        "position_title": "Engineering Director",
        "department": "Engineering",
        "company_id": 1,  # Use existing company
        "is_hiring_manager": True,
        "team_size": 25,
        "decision_authority": "Final Hiring Decision",
        "notes": "Oversees all engineering hiring. Very detail-oriented."
    }

    result = test_api_call("POST", "/api/managers", manager_data)
    if result and 'manager' in result:
        manager_id = result['manager']['id']
        print(f"✅ Created manager: {result['manager']['name']} (ID: {manager_id})")
    else:
        print("❌ Failed to create manager")
        return

    # 2. Get existing recruiter (use one from previous tests)
    result = test_api_call("GET", "/api/recruiters")
    if result and 'recruiters' in result and len(result['recruiters']) > 0:
        recruiter = result['recruiters'][0]
        recruiter_id = recruiter['id']
        contact = recruiter.get('primary_contact_name')
        contact_info = f" (primary contact: {contact})" if contact else ""
        print(f"✅ Using existing recruiter: {recruiter['name']}{contact_info} (ID: {recruiter_id})")
    else:
        print("❌ No recruiters found")
        return

    # 3. Create a relationship between recruiter and manager
    relationship_data = {
        "manager_id": manager_id,
        "relationship_type": "works_with",
        "relationship_notes": "Primary contact for senior engineering roles",
        "is_primary_contact": True
    }

    result = test_api_call("POST", f"/api/recruiters/{recruiter_id}/managers", relationship_data)
    if result and 'relationship_id' in result:
        print(f"✅ Created recruiter-manager relationship")
    else:
        print("❌ Failed to create relationship")
        return

    # 4. Get recruiter's managers
    result = test_api_call("GET", f"/api/recruiters/{recruiter_id}/managers")
    if result and 'managers' in result:
        print(f"✅ Recruiter has {len(result['managers'])} manager relationships:")
        for mgr in result['managers']:
            print(f"   - {mgr['manager_name']} ({mgr['relationship_type']})")
            if mgr['relationship_notes']:
                print(f"     Notes: {mgr['relationship_notes']}")
    else:
        print("❌ Failed to get recruiter's managers")

    # 5. Get manager's recruiters
    result = test_api_call("GET", f"/api/managers/{manager_id}/recruiters")
    if result and 'recruiters' in result:
        print(f"✅ Manager has {len(result['recruiters'])} recruiter relationships:")
        for rec in result['recruiters']:
            print(f"   - {rec['recruiter_name']} ({rec['relationship_type']})")
    else:
        print("❌ Failed to get manager's recruiters")

    # 6. Update relationship
    update_data = {
        "relationship_notes": "Updated: Primary contact for all senior and principal engineering roles",
        "last_interaction_date": "2025-09-19"
    }
    result = test_api_call("PUT", f"/api/recruiters/{recruiter_id}/managers/{manager_id}", update_data)
    if result and result.get('success'):
        print("✅ Updated relationship successfully")
    else:
        print("❌ Failed to update relationship")

    print("\n🎉 Manager-Recruiter relationship system is working!")

if __name__ == "__main__":
    main()
