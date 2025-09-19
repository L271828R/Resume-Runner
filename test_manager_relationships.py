#!/usr/bin/env python3
"""
Test suite for manager and company-recruiter relationship functionality.
Tests all CRUD operations for managers and associations.
"""

import json
import requests
import sys
from datetime import datetime, date

BASE_URL = "http://localhost:5001"

def test_api_call(method, endpoint, data=None):
    """Helper function to test API calls with proper error handling"""
    url = f"{BASE_URL}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == "PUT":
            response = requests.put(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == "DELETE":
            response = requests.delete(url)

        print(f"{method} {endpoint}")
        print(f"Status: {response.status_code}")

        if response.status_code >= 400:
            print(f"Error: {response.text}")
            return None

        try:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            return result
        except:
            print(f"Response: {response.text}")
            return response.text

    except Exception as e:
        print(f"Request failed: {e}")
        return None

def setup_test_data():
    """Create test companies and recruiters for relationship testing"""
    print("\n" + "="*80)
    print("SETTING UP TEST DATA")
    print("="*80)

    # Create test companies
    companies = [
        {"name": "Netflix", "industry": "Technology", "size": "Large", "website": "https://netflix.com"},
        {"name": "Spotify", "industry": "Technology", "size": "Large", "website": "https://spotify.com"}
    ]

    company_ids = []
    for company_data in companies:
        result = test_api_call("POST", "/api/companies", company_data)
        if result and 'company' in result:
            company_ids.append(result['company']['id'])
            print(f"✅ Created company: {company_data['name']}")

    # Create test recruiters
    recruiters = [
        {
            "name": "RecruitCorp",
            "primary_contact_name": "Jane Smith",
            "email": "jane@recruitcorp.com",
            "company": "RecruitCorp"
        },
        {
            "name": "TalentFinder",
            "primary_contact_name": "Bob Johnson",
            "email": "bob@talentfinder.com",
            "company": "TalentFinder"
        }
    ]

    recruiter_ids = []
    for recruiter_data in recruiters:
        result = test_api_call("POST", "/api/recruiters", recruiter_data)
        if result and 'recruiter' in result:
            recruiter_ids.append(result['recruiter']['id'])
            print(f"✅ Created recruiter: {recruiter_data['name']} (primary contact: {recruiter_data.get('primary_contact_name', 'N/A')})")

    return company_ids, recruiter_ids

def test_manager_creation():
    """Test creating managers with all fields"""
    print("\n" + "="*80)
    print("TESTING MANAGER CREATION")
    print("="*80)

    # Test case 1: Engineering Manager at Netflix
    netflix_manager = {
        "name": "Sarah Chen",
        "email": "sarah.chen@netflix.com",
        "phone": "+1-555-1001",
        "phone_secondary": "+1-555-1002",
        "linkedin_url": "https://linkedin.com/in/sarahchen",
        "position_title": "Senior Engineering Manager",
        "department": "Platform Engineering",
        "company_id": 1,  # Assuming Netflix has ID 1
        "office_location": "Los Gatos, CA",
        "timezone": "PST",
        "preferred_contact_method": "email",
        "decision_authority": "Final Hiring Decision",
        "is_hiring_manager": True,
        "team_size": 15,
        "notes": "Direct hiring manager for platform infrastructure. Very responsive to technical discussions."
    }

    result = test_api_call("POST", "/api/managers", netflix_manager)
    if result and 'manager' in result:
        netflix_manager_id = result['manager']['id']
        print(f"✅ Created Netflix manager with ID: {netflix_manager_id}")
    else:
        print("❌ Failed to create Netflix manager")
        return None

    # Test case 2: HR Manager at Spotify
    spotify_manager = {
        "name": "Alex Rodriguez",
        "email": "alex.rodriguez@spotify.com",
        "phone": "+1-555-2001",
        "linkedin_url": "https://linkedin.com/in/alexrodriguez",
        "position_title": "Senior HR Business Partner",
        "department": "Human Resources",
        "company_id": 2,  # Assuming Spotify has ID 2
        "office_location": "New York, NY",
        "timezone": "EST",
        "preferred_contact_method": "phone",
        "decision_authority": "Screening and Initial Interview",
        "is_hiring_manager": False,
        "notes": "Handles initial screening and cultural fit interviews. Coordinates with hiring managers."
    }

    result = test_api_call("POST", "/api/managers", spotify_manager)
    if result and 'manager' in result:
        spotify_manager_id = result['manager']['id']
        print(f"✅ Created Spotify manager with ID: {spotify_manager_id}")
    else:
        print("❌ Failed to create Spotify manager")
        return None

    return netflix_manager_id, spotify_manager_id

def test_manager_operations(manager_ids):
    """Test manager CRUD operations"""
    print("\n" + "="*80)
    print("TESTING MANAGER OPERATIONS")
    print("="*80)

    if not manager_ids:
        print("❌ No manager IDs to test")
        return False

    netflix_manager_id = manager_ids[0]

    # Test getting all managers
    result = test_api_call("GET", "/api/managers")
    if result and 'managers' in result:
        print(f"✅ Retrieved {len(result['managers'])} managers")
    else:
        print("❌ Failed to get managers")

    # Test getting manager by ID
    result = test_api_call("GET", f"/api/managers/{netflix_manager_id}")
    if result and 'manager' in result:
        print(f"✅ Retrieved manager: {result['manager']['name']}")
    else:
        print("❌ Failed to get manager by ID")

    # Test updating manager
    update_data = {
        "team_size": 18,
        "notes": "Team expanded to include new ML infrastructure engineers."
    }
    result = test_api_call("PUT", f"/api/managers/{netflix_manager_id}", update_data)
    if result and 'manager' in result:
        print(f"✅ Updated manager team size to: {result['manager']['team_size']}")
    else:
        print("❌ Failed to update manager")

    return True

def test_recruiter_manager_relationships(recruiter_ids, manager_ids):
    """Test recruiter-manager relationship operations"""
    print("\n" + "="*80)
    print("TESTING RECRUITER-MANAGER RELATIONSHIPS")
    print("="*80)

    if not recruiter_ids or not manager_ids:
        print("❌ Missing recruiter or manager IDs")
        return False

    recruiter_id = recruiter_ids[0]  # RecruitCorp
    netflix_manager_id = manager_ids[0]  # Sarah Chen
    spotify_manager_id = manager_ids[1]  # Alex Rodriguez

    # Test adding recruiter-manager relationship
    relationship_data = {
        "manager_id": netflix_manager_id,
        "relationship_type": "works_with",
        "relationship_notes": "Primary contact for platform engineering roles",
        "is_primary_contact": True
    }

    result = test_api_call("POST", f"/api/recruiters/{recruiter_id}/managers", relationship_data)
    if result and 'relationship_id' in result:
        print(f"✅ Created recruiter-manager relationship")
    else:
        print("❌ Failed to create recruiter-manager relationship")

    # Add second manager relationship
    relationship_data2 = {
        "manager_id": spotify_manager_id,
        "relationship_type": "introduced_by",
        "relationship_notes": "Met through mutual connection at tech meetup"
    }

    result = test_api_call("POST", f"/api/recruiters/{recruiter_id}/managers", relationship_data2)
    if result:
        print("✅ Created second manager relationship")

    # Test getting recruiter's managers
    result = test_api_call("GET", f"/api/recruiters/{recruiter_id}/managers")
    if result and 'managers' in result:
        print(f"✅ Recruiter has {len(result['managers'])} manager relationships")
        for manager in result['managers']:
            print(f"  - {manager['manager_name']} ({manager['relationship_type']})")
    else:
        print("❌ Failed to get recruiter's managers")

    # Test getting manager's recruiters
    result = test_api_call("GET", f"/api/managers/{netflix_manager_id}/recruiters")
    if result and 'recruiters' in result:
        print(f"✅ Manager has {len(result['recruiters'])} recruiter relationships")
    else:
        print("❌ Failed to get manager's recruiters")

    # Test updating relationship
    update_data = {
        "relationship_notes": "Updated: Now primary contact for all Netflix platform roles",
        "last_interaction_date": "2025-09-19"
    }
    result = test_api_call("PUT", f"/api/recruiters/{recruiter_id}/managers/{netflix_manager_id}", update_data)
    if result and result.get('success'):
        print("✅ Updated recruiter-manager relationship")
    else:
        print("❌ Failed to update relationship")

    return True

def test_company_recruiter_associations(company_ids, recruiter_ids):
    """Test company-recruiter association operations"""
    print("\n" + "="*80)
    print("TESTING COMPANY-RECRUITER ASSOCIATIONS")
    print("="*80)

    if not company_ids or not recruiter_ids:
        print("❌ Missing company or recruiter IDs")
        return False

    netflix_id = company_ids[0]
    spotify_id = company_ids[1]
    jane_id = recruiter_ids[0]
    bob_id = recruiter_ids[1]

    # Test adding company-recruiter associations
    associations = [
        {
            "company_id": netflix_id,
            "recruiter_id": jane_id,
            "association_type": "external",
            "specialization": "Senior Engineering Roles",
            "notes": "Preferred recruiter for platform and infrastructure positions"
        },
        {
            "company_id": netflix_id,
            "recruiter_id": bob_id,
            "association_type": "external",
            "specialization": "Data Science and ML",
            "notes": "Specializes in AI/ML talent acquisition"
        },
        {
            "company_id": spotify_id,
            "recruiter_id": jane_id,
            "association_type": "external",
            "specialization": "Full-stack Development",
            "notes": "Handles general software engineering roles"
        }
    ]

    for assoc in associations:
        result = test_api_call("POST", f"/api/companies/{assoc['company_id']}/recruiters", {
            "recruiter_id": assoc["recruiter_id"],
            "association_type": assoc["association_type"],
            "specialization": assoc["specialization"],
            "notes": assoc["notes"]
        })
        if result and 'association_id' in result:
            print(f"✅ Created association for company {assoc['company_id']} - recruiter {assoc['recruiter_id']}")
        else:
            print(f"❌ Failed to create association")

    # Test getting company's recruiters
    result = test_api_call("GET", f"/api/companies/{netflix_id}/recruiters")
    if result and 'recruiters' in result:
        print(f"✅ Netflix has {len(result['recruiters'])} associated recruiters")
        for recruiter in result['recruiters']:
            print(f"  - {recruiter['recruiter_name']}: {recruiter['specialization']}")
    else:
        print("❌ Failed to get company's recruiters")

    # Test getting recruiter's companies
    result = test_api_call("GET", f"/api/recruiters/{jane_id}/companies")
    if result and 'companies' in result:
        print(f"✅ Jane has {len(result['companies'])} company associations")
        for company in result['companies']:
            print(f"  - {company['company_name']}: {company['specialization']}")
    else:
        print("❌ Failed to get recruiter's companies")

    # Test updating association
    update_data = {
        "specialization": "Senior Engineering & Leadership Roles",
        "notes": "Expanded to include engineering management positions"
    }
    result = test_api_call("PUT", f"/api/companies/{netflix_id}/recruiters/{jane_id}", update_data)
    if result and result.get('success'):
        print("✅ Updated company-recruiter association")
    else:
        print("❌ Failed to update association")

    return True

def main():
    """Run all manager and relationship tests"""
    print("Starting comprehensive manager and relationship testing...")
    print(f"Testing against: {BASE_URL}")

    try:
        # Setup test data
        company_ids, recruiter_ids = setup_test_data()

        # Test manager creation
        manager_ids = test_manager_creation()

        # Test manager operations
        manager_ops_success = test_manager_operations(manager_ids)

        # Test recruiter-manager relationships
        relationship_success = test_recruiter_manager_relationships(recruiter_ids, manager_ids)

        # Test company-recruiter associations
        association_success = test_company_recruiter_associations(company_ids, recruiter_ids)

        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"✅ Setup: {'PASS' if company_ids and recruiter_ids else 'FAIL'}")
        print(f"✅ Manager Creation: {'PASS' if manager_ids else 'FAIL'}")
        print(f"✅ Manager Operations: {'PASS' if manager_ops_success else 'FAIL'}")
        print(f"✅ Recruiter-Manager Relationships: {'PASS' if relationship_success else 'FAIL'}")
        print(f"✅ Company-Recruiter Associations: {'PASS' if association_success else 'FAIL'}")

        return all([company_ids, recruiter_ids, manager_ids, manager_ops_success,
                   relationship_success, association_success])

    except Exception as e:
        print(f"❌ Test suite failed with error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
