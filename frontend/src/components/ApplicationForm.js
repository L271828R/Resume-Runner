import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  X,
  Building2,
  FileText,
  DollarSign,
  MapPin,
  Calendar,
  ExternalLink,
  Upload,
  User
} from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

const ApplicationForm = ({ isOpen, onClose, onSubmit, application = null, onDelete = null }) => {
  const [jobPostingText, setJobPostingText] = useState(application?.job_posting_text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    defaultValues: application ? {
      company_id: application.company_id?.toString(),
      position_title: application.position_title,
      application_source: application.application_source,
      job_location: application.job_location,
      resume_version_id: application.resume_version_id?.toString(),
      recruiter_id: application.recruiter_id?.toString(),
      job_url: application.job_url,
      salary_min: application.salary_min,
      salary_max: application.salary_max,
      is_remote: application.is_remote ? 'true' : 'false',
      application_date: application.application_date,
      notes: application.notes
    } : {}
  });

  // Register validation rules for SearchableDropdown fields
  register('company_id', { required: 'Company is required' });
  register('application_source', { required: 'Application source is required' });
  register('resume_version_id', { required: 'Resume version is required' });

  // Fetch companies and resume versions for dropdowns
  const { data: companies } = useQuery(
    'companies',
    () => fetch('/api/companies').then(res => res.json()),
    { enabled: isOpen }
  );

  const queryClient = useQueryClient();

  const createCompanyMutation = useMutation(
    async (name) => {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create company');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        const newCompany = data?.company;
        if (!newCompany) {
          return;
        }

        queryClient.setQueryData('companies', (old) => {
          if (!old) {
            return { companies: [newCompany] };
          }

          const existing = old.companies || [];
          if (existing.some((company) => company.id === newCompany.id)) {
            return old;
          }

          return {
            ...old,
            companies: [...existing, newCompany]
          };
        });
      }
    }
  );

  const { data: resumeVersions } = useQuery(
    'resume-versions',
    () => fetch('/api/resume-versions').then(res => res.json()),
    { enabled: isOpen }
  );

  const { data: recruiters } = useQuery(
    'recruiters',
    () => fetch('/api/recruiters').then(res => res.json()),
    { enabled: isOpen }
  );

  const watchedCompanyId = watch('company_id');
  const watchedIsRemote = watch('is_remote');

  const companyOptions = companies?.companies?.map(company => ({
    value: company.id.toString(),
    label: company.name
  })) || [];

  const handleCreateCompany = async (name) => {
    const trimmedName = name.trim();

    if (!trimmedName || createCompanyMutation.isLoading) {
      return false;
    }

    try {
      const result = await createCompanyMutation.mutateAsync(trimmedName);
      const newCompanyId = result?.company?.id;

      if (newCompanyId) {
        setValue('company_id', newCompanyId.toString(), { shouldValidate: true });
        trigger('company_id');
      }

      return true;
    } catch (error) {
      console.error('Error creating company:', error);
      alert(error.message || 'Failed to create company');
      return false;
    }
  };

  // Application source options
  const applicationSourceOptions = [
    { value: 'indeed', label: 'Indeed' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'company_website', label: 'Company Website' },
    { value: 'glassdoor', label: 'Glassdoor' },
    { value: 'recruiter', label: 'Recruiter Contact' },
    { value: 'referral', label: 'Employee Referral' },
    { value: 'job_board', label: 'Other Job Board' },
    { value: 'direct_application', label: 'Direct Application' },
    { value: 'networking', label: 'Networking Event' },
    { value: 'headhunter', label: 'Headhunter' }
  ];

  // Major city options
  const locationOptions = [
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'new_york_ny', label: 'New York, NY' },
    { value: 'san_francisco_ca', label: 'San Francisco, CA' },
    { value: 'los_angeles_ca', label: 'Los Angeles, CA' },
    { value: 'chicago_il', label: 'Chicago, IL' },
    { value: 'seattle_wa', label: 'Seattle, WA' },
    { value: 'boston_ma', label: 'Boston, MA' },
    { value: 'austin_tx', label: 'Austin, TX' },
    { value: 'denver_co', label: 'Denver, CO' },
    { value: 'atlanta_ga', label: 'Atlanta, GA' },
    { value: 'miami_fl', label: 'Miami, FL' },
    { value: 'dallas_tx', label: 'Dallas, TX' },
    { value: 'washington_dc', label: 'Washington, DC' },
    { value: 'portland_or', label: 'Portland, OR' },
    { value: 'philadelphia_pa', label: 'Philadelphia, PA' },
    { value: 'san_diego_ca', label: 'San Diego, CA' },
    { value: 'phoenix_az', label: 'Phoenix, AZ' },
    { value: 'minneapolis_mn', label: 'Minneapolis, MN' },
    { value: 'toronto_on', label: 'Toronto, ON' },
    { value: 'vancouver_bc', label: 'Vancouver, BC' },
    { value: 'london_uk', label: 'London, UK' },
    { value: 'berlin_de', label: 'Berlin, DE' },
    { value: 'amsterdam_nl', label: 'Amsterdam, NL' },
    { value: 'other', label: 'Other Location' }
  ];

  if (!isOpen) return null;

  const onFormSubmit = async (data) => {
    console.log('Form data received:', data);

    // Validate required fields
    if (!data.application_source) {
      console.error('Missing application_source');
      setValue('application_source', '', { shouldValidate: true });
      return;
    }

    if (!data.resume_version_id) {
      console.error('Missing resume_version_id');
      setValue('resume_version_id', '', { shouldValidate: true });
      return;
    }

    if (!data.company_id) {
      console.error('Missing company_id');
      return;
    }

    if (!data.position_title) {
      console.error('Missing position_title');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine form data with job posting text
      const applicationData = {
        ...data,
        company_id: parseInt(data.company_id),
        resume_version_id: parseInt(data.resume_version_id),
        recruiter_id: data.recruiter_id ? parseInt(data.recruiter_id) : null,
        job_posting_text: jobPostingText,
        salary_min: data.salary_min ? parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? parseInt(data.salary_max) : null,
        is_remote: data.is_remote === 'true',
        application_date: data.application_date || new Date().toISOString().split('T')[0]
      };

      console.log('Submitting application data:', applicationData);
      await onSubmit(applicationData);

      // If a recruiter was selected, track resume sharing
      if (applicationData.recruiter_id && applicationData.resume_version_id) {
        try {
          await fetch(`/api/recruiters/${applicationData.recruiter_id}/resume-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resume_version_id: applicationData.resume_version_id,
              sharing_context: 'job_application',
              notes: `Shared for job application: ${applicationData.position_title} at ${companies?.companies?.find(c => c.id == applicationData.company_id)?.name}`
            }),
          });
        } catch (error) {
          console.warn('Failed to track resume sharing with recruiter:', error);
          // Don't fail the application submission if this fails
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error creating application: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !application) return;

    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(application.id);
    } catch (error) {
      console.error('Error deleting application:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '95vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto'
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  };

  const contentStyle = {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    maxHeight: 'calc(95vh - 140px)'
  };

  const footerStyle = {
    padding: '24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
            Add New Application
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div style={contentStyle}>
            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#dc2626'
                }}>
                  Please fix the following errors:
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '14px',
                  color: '#dc2626'
                }}>
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Job Description Section - Moved to top for better visibility */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                <FileText size={16} style={{ display: 'inline', marginRight: '8px' }} />
                Job Description
              </h3>

              <div className="form-group">
                <label className="form-label">
                  Complete Job Posting
                  <span style={{ color: '#6b7280', fontWeight: '400', marginLeft: '8px' }}>
                    (Copy and paste the full job description here)
                  </span>
                </label>

                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  {/* Toolbar */}
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>Characters: {jobPostingText.length}</span>
                      <span>Words: {jobPostingText.trim() ? jobPostingText.trim().split(/\s+/).length : 0}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setJobPostingText('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Basic text prettification
                          const prettified = jobPostingText
                            // Fix spacing around punctuation
                            .replace(/\s*([.,!?;:])\s*/g, '$1 ')
                            // Fix multiple spaces
                            .replace(/\s+/g, ' ')
                            // Fix line breaks (convert single breaks to double for paragraphs)
                            .replace(/\n\s*\n\s*\n+/g, '\n\n')
                            // Trim whitespace
                            .trim();
                          setJobPostingText(prettified);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Format Text
                      </button>
                    </div>
                  </div>

                  {/* Text Area */}
                  <textarea
                    className="form-textarea"
                    rows="8"
                    placeholder="Paste the complete job posting here including:
• Job title and company information
• Job responsibilities and duties
• Required qualifications and skills
• Preferred qualifications
• Salary range and benefits
• Location and work arrangement
• Application instructions

Tip: Raw text is fine - use 'Format Text' to clean it up!"
                    value={jobPostingText}
                    onChange={(e) => setJobPostingText(e.target.value)}
                    style={{
                      border: 'none',
                      resize: 'vertical',
                      minHeight: '200px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
                      padding: '16px',
                      outline: 'none',
                      backgroundColor: '#fafafa'
                    }}
                  />
                </div>

                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  💡 <strong>Pro tip:</strong> Paste raw text from job postings - the format button will clean up spacing and formatting automatically. This helps preserve the original posting even if the URL changes.
                </div>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: '24px' }}>
              {/* Left Column */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                  <Building2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Company & Position
                </h3>

                <div className="form-group">
                  <label className="form-label">
                    Company <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
                  </label>
                  <SearchableDropdown
                    options={companyOptions}
                    value={watch('company_id') || ''}
                    onChange={(value) => {
                      setValue('company_id', value, { shouldValidate: true });
                      trigger('company_id');
                    }}
                    placeholder="Select or create a company..."
                    required
                    error={errors.company_id?.message}
                    allowCreate
                    onCreateOption={handleCreateCompany}
                    isLoading={createCompanyMutation.isLoading}
                  />
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    Can't find it? Add the company by name now and refine it later from the Companies page.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Position Title <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.position_title ? 'border-red-500' : ''}`}
                    style={errors.position_title ? { borderColor: '#ef4444' } : {}}
                    placeholder="e.g., Senior Software Engineer"
                    {...register('position_title', { required: 'Position title is required' })}
                  />
                  {errors.position_title && (
                    <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                      {errors.position_title.message}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Application Source <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
                  </label>
                  <SearchableDropdown
                    options={applicationSourceOptions}
                    value={watch('application_source') || ''}
                    onChange={(value) => {
                      setValue('application_source', value);
                      trigger('application_source');
                    }}
                    placeholder="Select application source..."
                    required
                    error={errors.application_source?.message}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <SearchableDropdown
                    options={locationOptions}
                    value={watch('job_location') || ''}
                    onChange={(value) => setValue('job_location', value)}
                    placeholder="Select job location..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Resume Version Used <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
                  </label>
                  <SearchableDropdown
                    options={resumeVersions?.resume_versions?.map(version => ({
                      value: version.id.toString(),
                      label: `${version.version_name}${version.is_master ? ' (Master)' : ''}`
                    })) || []}
                    value={watch('resume_version_id') || ''}
                    onChange={(value) => {
                      setValue('resume_version_id', value);
                      trigger('resume_version_id');
                    }}
                    placeholder="Select resume version..."
                    required
                    error={errors.resume_version_id?.message}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recruiter Contact (Optional)</label>
                  <SearchableDropdown
                    options={recruiters?.recruiters?.map(recruiter => ({
                      value: recruiter.id.toString(),
                      label: `${recruiter.name} - ${recruiter.company || 'Independent'}`,
                      details: recruiter.specialties ? `Specializes in: ${recruiter.specialties}` : null,
                      contact: recruiter.email || recruiter.phone
                    })) || []}
                    value={watch('recruiter_id') || ''}
                    onChange={(value) => setValue('recruiter_id', value)}
                    placeholder="Select recruiter contact..."
                    renderOption={(option) => (
                      <div style={{ padding: '8px 0' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {option.label}
                        </div>
                        {option.details && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {option.details}
                          </div>
                        )}
                        {option.contact && (
                          <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                            📧 {option.contact}
                          </div>
                        )}
                      </div>
                    )}
                  />
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    💡 When you select a recruiter, we'll automatically track that you shared your selected resume version with them.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Application Date</label>
                  <input
                    type="date"
                    className="form-input"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    {...register('application_date')}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                  <DollarSign size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  Job Details
                </h3>

                <div className="grid grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Salary Min ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 120000"
                      {...register('salary_min')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Salary Max ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 150000"
                      {...register('salary_max')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Type</label>
                  <select className="form-input" {...register('is_remote')}>
                    <option value="">Not specified</option>
                    <option value="true">Remote</option>
                    <option value="false">On-site</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., San Francisco, CA"
                    {...register('location')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Posting URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    {...register('job_board_url')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select className="form-input" {...register('status')} defaultValue="applied">
                    <option value="applied">Applied</option>
                    <option value="phone_screen">Phone Screen Scheduled</option>
                    <option value="interview">Interview Scheduled</option>
                    <option value="offer">Offer Received</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>


            {/* Notes Section */}
            <div style={{ marginTop: '24px' }}>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Any additional notes about this application..."
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {application && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || isSubmitting}
                  className="btn btn-danger"
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: '1px solid #ef4444',
                    opacity: isDeleting ? 0.6 : 1
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Application'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="btn btn-primary"
                style={{
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting
                  ? (application ? 'Updating...' : 'Creating...')
                  : (application ? 'Update Application' : 'Add Application')
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
