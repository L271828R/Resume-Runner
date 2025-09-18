# Resume Runner - LLM Context Documentation

## Project Overview

**Resume Runner** is a personal job application tracking and optimization system that solves the "document management nightmare" of active job searching. The core problem: when actively applying to 10+ jobs per day with different resume versions, you lose track of which resume went to which company, making interview preparation impossible weeks later.

## Core Value Proposition

1. **Track Resume Versions**: Know exactly which resume version was sent to each company
2. **Company Intelligence**: Monitor hiring patterns, salary ranges, and posting frequency
3. **AI Training Data**: Build a personal dataset that enables AI-powered application optimization
4. **Delegation Ready**: System trains on your decisions to enable assistants/relatives to apply on your behalf
5. **Recruiter Management**: Track which resume version each recruiter has on file

## System Architecture

### Hybrid Storage Approach
- **SQLite3**: Metadata, search queries, relationships, resume text content
- **AWS S3**: Physical documents (PDFs, screenshots, cover letters)

### Key Components

#### Database Schema (`database/init_db.sql`)
**Core Tables:**
- `companies` - Company profiles and hiring intelligence
- `resume_versions` - Different resume variants with full text content
- `recruiters` - Recruiter contacts and which resume they have
- `job_postings` - Individual job postings with salary/remote info
- `applications` - Your job applications linking all data
- `communications` - All interactions (emails, calls, etc.)
- `ai_insights` - AI-generated recommendations and patterns

**Key Innovation: Resume Content Storage**
- `resume_versions.content_text` stores full resume text in database
- Enables AI analysis without S3 dependency
- S3 only stores formatted documents (PDF/Word) for human viewing

#### AI Training Data Structure
Every application becomes a training data point:
- Resume version + job requirements + outcome = success pattern
- Skills emphasized + company type + interview rate = optimization rule
- Communication patterns + response times = engagement strategy

## Workflow Evolution

### Phase 1: Personal Tracking (Current Focus)
User manually tracks applications, building dataset of successful patterns.

### Phase 2: AI Optimization
After 50-100 applications, system identifies:
- Which resume versions work best for specific job types
- Optimal timing and follow-up strategies
- Company-specific application approaches

### Phase 3: Delegation Mode
Trained AI enables assistants to apply on your behalf:
- "Apply to this AWS role using Python_Cloud_v2 resume"
- "This matches your Microsoft interview pattern - high priority"
- Pre-written cover letters based on successful templates

## Key Features

### Company Intelligence
- **Hiring Frequency**: "Netflix posts 5-10 ML jobs per month"
- **Salary Tracking**: Historical salary ranges by company/role
- **Remote Trends**: Which companies offer remote work
- **Opportunity Alerts**: "Target companies that haven't posted recently"

### Resume Version Management
- **Success Metrics**: Interview rates by resume version
- **Content Analysis**: AI analyzes which skills/experiences get responses
- **Optimization**: Data-driven resume improvements

### Recruiter CRM
- **Version Tracking**: Which resume each recruiter has on file
- **Relationship Status**: Active, cold, successful partnerships
- **Success Rates**: Which recruiters deliver interview opportunities

## Technical Implementation

### Database Views
- `resume_success_metrics` - Interview rates by resume version
- `company_activity` - Hiring patterns and salary data
- `active_applications` - Current application pipeline

### AI Integration Points
1. **Resume Analysis**: Text content enables skill matching
2. **Job Matching**: Compare job descriptions to successful applications
3. **Timing Optimization**: Learn from response patterns
4. **Template Generation**: Auto-create cover letters from successful examples

## Future Enhancements

### Browser Extension
- Auto-capture job postings and company data
- One-click application tracking
- Screenshot automation for job descriptions

### Mobile App
- Quick lookup when companies call for interviews
- "What did I tell them about myself?" instant access
- Communication logging on the go

### Integration Possibilities
- LinkedIn automation for company monitoring
- Email parsing for automatic communication logging
- Calendar integration for interview scheduling

## Problem Solved

**Before Resume Runner:**
- Multiple resume versions scattered across files
- No memory of which version went where
- Interview preparation panic: "What position am I interviewing for?"
- Lost opportunities due to poor organization

**After Resume Runner:**
- Complete application history with exact documents
- AI-optimized resume selection for new applications
- Confident interview preparation with full context
- Delegation capability for passive job searching

## Data Privacy & Security

- Local SQLite3 database (user controls data)
- S3 with user's own AWS account
- No third-party data sharing (except chosen assistants)
- Personal AI training (not shared across users)

## Success Metrics

- **Organization**: Zero "which resume did I send?" moments
- **Optimization**: Improved interview rates through data analysis
- **Efficiency**: Successful delegation of application process
- **Intelligence**: Proactive identification of job opportunities

---

## Development Notes

### Current Status
- Database schema complete with recruiter tracking
- Ready for application development
- S3 integration planned for document storage

### Next Steps
1. Build basic CRUD operations for all tables
2. Implement resume text extraction (PDF to text)
3. Create job posting capture mechanism
4. Develop AI analysis functions

This system transforms job searching from chaotic document management into strategic, data-driven career advancement.