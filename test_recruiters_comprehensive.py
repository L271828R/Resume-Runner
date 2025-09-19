#!/usr/bin/env python3
"""
Comprehensive test suite for recruiter functionality.
Tests all CRUD operations and field validation.
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

def test_recruiter_creation():
    """Test creating recruiters with all possible fields"""
    print("\n" + "="*80)
    print("TESTING RECRUITER CREATION WITH ALL FIELDS")
    print("="*80)

    # Test case 1: Full recruiter with manager details
    full_recruiter = {
        "name": "TechCorp Recruiting",
        "primary_contact_name": "Sarah Johnson",
        "email": "sarah.johnson@techcorp.com",
        "phone": "+1-555-0101",
        "phone_secondary": "+1-555-0102",
        "company": "TechCorp Recruiting",
        "linkedin_url": "https://linkedin.com/in/sarahjohnson",
        "specialties": "Software Engineering, Data Science, AI/ML",
        "position_title": "Senior Technical Recruiter",
        "department": "Talent Acquisition",
        "manager_name": "Mike Davis",
        "manager_email": "mike.davis@techcorp.com",
        "manager_phone": "+1-555-0103",
        "manager_linkedin_url": "https://linkedin.com/in/mikedavis",
        "account_name": "Netflix Engineering",
        "account_type": "Client Account",
        "office_location": "San Francisco, CA",
        "timezone": "PST",
        "preferred_contact_method": "email",
        "is_manager": False,
        "decision_authority": "Screening and Initial Interview",
        "relationship_status": "new",
        "notes": "Met at tech recruiting conference. Specializes in senior engineering roles."
    }

    result = test_api_call("POST", "/api/recruiters", full_recruiter)
    if result and 'recruiter' in result:
        full_recruiter_id = result['recruiter']['id'] if 'id' in result['recruiter'] else result['recruiter']
        print(f"✅ Created full recruiter with ID: {full_recruiter_id}")
    else:
        print("❌ Failed to create full recruiter")
        return None

    # Test case 2: Manager recruiter
    manager_recruiter = {
        "name": "Netflix",
        "primary_contact_name": "Alex Thompson",
        "email": "alex.thompson@netflix.com",
        "phone": "+1-555-0201",
        "company": "Netflix",
        "linkedin_url": "https://linkedin.com/in/alexthompson",
        "specialties": "Engineering Leadership, Platform Engineering",
        "position_title": "Engineering Manager",
        "department": "Platform Engineering",
        "account_name": "Netflix Internal",
        "account_type": "Internal Team",
        "office_location": "Los Gatos, CA",
        "timezone": "PST",
        "preferred_contact_method": "phone",
        "is_manager": True,
        "team_size": 12,
        "decision_authority": "Final Hiring Decision",
        "relationship_status": "active",
        "notes": "Direct hiring manager for platform team. Can make final decisions."
    }

    result = test_api_call("POST", "/api/recruiters", manager_recruiter)
    if result and 'recruiter' in result:
        manager_id = result['recruiter']['id'] if 'id' in result['recruiter'] else result['recruiter']
        print(f"✅ Created manager recruiter with ID: {manager_id}")
    else:
        print("❌ Failed to create manager recruiter")
        return None

    # Test case 3: Minimal recruiter
    minimal_recruiter = {
        "name": "BigYelloStaffing",
        "primary_contact_name": "John Doe",
        "email": "john.doe@example.com"
    }

    result = test_api_call("POST", "/api/recruiters", minimal_recruiter)
    if result and 'recruiter' in result:
        minimal_id = result['recruiter']['id'] if 'id' in result['recruiter'] else result['recruiter']
        print(f"✅ Created minimal recruiter with ID: {minimal_id}")
    else:
        print("❌ Failed to create minimal recruiter")
        return None

    return full_recruiter_id, manager_id, minimal_id

def test_recruiter_retrieval():
    """Test getting recruiters"""
    print("\n" + "="*80)
    print("TESTING RECRUITER RETRIEVAL")
    print("="*80)

    # Get all recruiters
    result = test_api_call("GET", "/api/recruiters")
    if result and 'recruiters' in result:
        print(f"✅ Retrieved {len(result['recruiters'])} recruiters")
        return result['recruiters']
    else:
        print("❌ Failed to retrieve recruiters")
        return []

def test_recruiter_dashboard():
    """Test recruiter dashboard with metrics"""
    print("\n" + "="*80)
    print("TESTING RECRUITER DASHBOARD")
    print("="*80)

    result = test_api_call("GET", "/api/recruiters/dashboard")
    if result and 'recruiters' in result:
        print(f"✅ Retrieved dashboard for {len(result['recruiters'])} recruiters")
        for recruiter in result['recruiters']:
            print(f"  - {recruiter['name']}: {recruiter.get('total_applications', 0)} applications")
        return result['recruiters']
    else:
        print("❌ Failed to retrieve recruiter dashboard")
        return []

def test_recruiter_updates(recruiter_id):
    """Test updating all fields of a recruiter"""
    print("\n" + "="*80)
    print(f"TESTING RECRUITER UPDATE (ID: {recruiter_id})")
    print("="*80)

    # Test updating all possible fields
    update_data = {
        "name": "TechCorp Talent Partners",
        "primary_contact_name": "Sarah Johnson-Smith",
        "email": "sarah.johnson.smith@techcorp.com",
        "phone": "+1-555-0111",
        "phone_secondary": "+1-555-0112",
        "company": "TechCorp Advanced Recruiting",
        "linkedin_url": "https://linkedin.com/in/sarahjohnsonsmith",
        "specialties": "Senior Software Engineering, Technical Leadership, AI/ML, Cloud Architecture",
        "position_title": "Principal Technical Recruiter",
        "department": "Strategic Talent Acquisition",
        "manager_name": "Jennifer Chen",
        "manager_email": "jennifer.chen@techcorp.com",
        "manager_phone": "+1-555-0113",
        "manager_linkedin_url": "https://linkedin.com/in/jenniferchen",
        "account_name": "Netflix Engineering & AI",
        "account_type": "Strategic Client Account",
        "office_location": "San Francisco, CA (Hybrid)",
        "timezone": "PST",
        "preferred_contact_method": "email",
        "is_manager": True,
        "team_size": 3,
        "decision_authority": "Technical Screening and Recommendation",
        "relationship_status": "active",
        "notes": "Promoted to Principal level. Now manages junior recruiters. Strong track record with senior engineering hires."
    }

    result = test_api_call("PUT", f"/api/recruiters/{recruiter_id}", update_data)
    if result and 'recruiter' in result:
        print("✅ Successfully updated recruiter with all fields")
        return True
    else:
        print("❌ Failed to update recruiter")
        return False

def test_recruiter_field_validation():
    """Test individual field updates to ensure all fields work"""
    print("\n" + "="*80)
    print("TESTING INDIVIDUAL FIELD VALIDATION")
    print("="*80)

    # Create a test recruiter
    test_recruiter = {
        "name": "Test Validation User",
        "email": "test@validation.com"
    }

    result = test_api_call("POST", "/api/recruiters", test_recruiter)
    if not result or 'recruiter' not in result:
        print("❌ Failed to create test recruiter for validation")
        return False

    recruiter_id = result['recruiter']['id'] if 'id' in result['recruiter'] else result['recruiter']
    print(f"Created test recruiter with ID: {recruiter_id}")

    # Test each field individually
    fields_to_test = [
        ("name", "Updated Name"),
        ("email", "updated@email.com"),
        ("phone", "+1-555-9999"),
        ("phone_secondary", "+1-555-8888"),
        ("company", "Updated Company"),
        ("linkedin_url", "https://linkedin.com/in/updated"),
        ("specialties", "Updated Specialties"),
        ("position_title", "Updated Title"),
        ("department", "Updated Department"),
        ("manager_name", "Updated Manager"),
        ("manager_email", "manager@updated.com"),
        ("manager_phone", "+1-555-7777"),
        ("manager_linkedin_url", "https://linkedin.com/in/manager"),
        ("account_name", "Updated Account"),
        ("account_type", "Updated Type"),
        ("office_location", "Updated Location"),
        ("timezone", "EST"),
        ("preferred_contact_method", "phone"),
        ("is_manager", True),
        ("team_size", 5),
        ("decision_authority", "Updated Authority"),
        ("relationship_status", "active"),
        ("notes", "Updated notes")
    ]

    success_count = 0
    for field_name, field_value in fields_to_test:
        update_data = {field_name: field_value}
        result = test_api_call("PUT", f"/api/recruiters/{recruiter_id}", update_data)

        if result and 'recruiter' in result:
            print(f"✅ Successfully updated field: {field_name}")
            success_count += 1
        else:
            print(f"❌ Failed to update field: {field_name}")

    print(f"\nField validation results: {success_count}/{len(fields_to_test)} fields successfully updated")
    return success_count == len(fields_to_test)

def main():
    """Run all recruiter tests"""
    print("Starting comprehensive recruiter testing...")
    print(f"Testing against: {BASE_URL}")

    try:
        # Test creation
        recruiter_ids = test_recruiter_creation()
        if not recruiter_ids:
            print("❌ Creation tests failed, stopping")
            return False

        # Test retrieval
        recruiters = test_recruiter_retrieval()

        # Test dashboard
        dashboard_recruiters = test_recruiter_dashboard()

        # Test updates on the full recruiter
        if recruiter_ids[0]:  # Use the full recruiter ID
            update_success = test_recruiter_updates(recruiter_ids[0])

        # Test field validation
        validation_success = test_recruiter_field_validation()

        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"✅ Creation: {'PASS' if recruiter_ids else 'FAIL'}")
        print(f"✅ Retrieval: {'PASS' if recruiters else 'FAIL'}")
        print(f"✅ Dashboard: {'PASS' if dashboard_recruiters else 'FAIL'}")
        print(f"✅ Updates: {'PASS' if update_success else 'FAIL'}")
        print(f"✅ Field Validation: {'PASS' if validation_success else 'FAIL'}")

        return all([recruiter_ids, recruiters, dashboard_recruiters, update_success, validation_success])

    except Exception as e:
        print(f"❌ Test suite failed with error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
