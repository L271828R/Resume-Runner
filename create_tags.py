#!/usr/bin/env python3
"""
Simple script to create your own tags
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_helper import ResumeRunnerDB

def create_tag_interactive():
    """Interactive tag creation"""
    db = ResumeRunnerDB()

    print("🏷️  Create Your Own Tags")
    print("=" * 30)

    while True:
        print("\nEnter tag details (or 'quit' to exit):")

        # Get tag name
        name = input("Tag name: ").strip()
        if name.lower() == 'quit':
            break

        if not name:
            print("❌ Tag name cannot be empty")
            continue

        # Check if tag already exists
        existing = db.find_tag_by_name(name)
        if existing:
            print(f"❌ Tag '{name}' already exists")
            continue

        # Get optional description
        description = input("Description (optional): ").strip()
        if not description:
            description = None

        # Get optional color
        color = input("Color (hex, e.g., #3776AB) [default: #3B82F6]: ").strip()
        if not color:
            color = "#3B82F6"

        # Create the tag
        try:
            tag_id = db.add_tag(name, description, color)
            print(f"✅ Created tag '{name}' (ID: {tag_id})")
        except Exception as e:
            print(f"❌ Error creating tag: {e}")

def create_predefined_tags():
    """Create a set of useful predefined tags"""
    db = ResumeRunnerDB()

    predefined_tags = [
        {"name": "MorePython", "description": "Heavy emphasis on Python development", "color": "#3776AB"},
        {"name": "Management", "description": "Highlights management and leadership experience", "color": "#DC2626"},
        {"name": "Condensed", "description": "Shorter version with key highlights only", "color": "#059669"},
        {"name": "DataScience", "description": "Emphasizes data science and analytics", "color": "#7C3AED"},
        {"name": "Backend", "description": "Focuses on backend development", "color": "#1D4ED8"},
        {"name": "Frontend", "description": "Emphasizes frontend development", "color": "#EC4899"},
        {"name": "FullStack", "description": "Showcases full-stack capabilities", "color": "#10B981"},
        {"name": "DevOps", "description": "Highlights DevOps and infrastructure", "color": "#F59E0B"},
        {"name": "Business", "description": "Emphasizes business and strategic experience", "color": "#8B5CF6"},
        {"name": "Startup", "description": "Tailored for startup environments", "color": "#EF4444"},
        {"name": "Enterprise", "description": "Focused on enterprise-level experience", "color": "#3B82F6"},
        {"name": "Remote", "description": "Optimized for remote work opportunities", "color": "#06B6D4"},
    ]

    print("🏷️  Creating Predefined Tags")
    print("=" * 35)

    for tag_data in predefined_tags:
        # Check if tag already exists
        existing = db.find_tag_by_name(tag_data["name"])
        if existing:
            print(f"⏭️  Tag '{tag_data['name']}' already exists, skipping")
            continue

        try:
            tag_id = db.add_tag(**tag_data)
            print(f"✅ Created tag '{tag_data['name']}' (ID: {tag_id})")
        except Exception as e:
            print(f"❌ Error creating tag '{tag_data['name']}': {e}")

def list_all_tags():
    """List all existing tags"""
    db = ResumeRunnerDB()

    print("📋 Your Current Tags")
    print("=" * 25)

    tags = db.get_all_tags()
    if not tags:
        print("No tags found. Create some tags first!")
        return

    for tag in tags:
        desc = f" - {tag['description']}" if tag['description'] else ""
        print(f"🏷️  {tag['name']} (ID: {tag['id']}, Color: {tag['color']}){desc}")

def main():
    """Main menu"""
    while True:
        print("\n🏷️  Tag Management System")
        print("=" * 30)
        print("1. Create tags interactively")
        print("2. Create predefined useful tags")
        print("3. List all existing tags")
        print("4. Quit")

        choice = input("\nChoose an option (1-4): ").strip()

        if choice == "1":
            create_tag_interactive()
        elif choice == "2":
            create_predefined_tags()
        elif choice == "3":
            list_all_tags()
        elif choice == "4":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please enter 1-4.")

if __name__ == "__main__":
    main()